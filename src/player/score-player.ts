import {
  BarRepeatStatus,
  Score,
  Beat,
  TimingFraction,
  Track,
  ticksToFraction,
  ticksToSeconds,
  Note,
  getNoteFrequency,
  Bar,
  fractionLt,
  fractionLte,
  fractionToSeconds,
  Staff,
} from "../notation/model";
import { trackEvent, TrackEventType } from "@/shared/events";

const ZERO_FRACTION = { numerator: 0, denominator: 1 };

export interface PlaybackOptions {
  /** Beat to start playback from */
  startBeat?: Beat;
  /** Ignore an already-open repeat when playback starts inside it */
  skipOpenRepeatAtStart?: boolean;
  /** Loop section start beat */
  loopStartBeat?: Beat;
  /** Loop section end beat */
  loopEndBeat?: Beat;
}

interface LoopSection {
  /** Loop start beat */
  startBeat: Beat;
  /** Loop end beat */
  endBeat: Beat;
}

interface PlaybackBoundary {
  /** Master bar index in the score */
  masterBarIndex: number;
  /** Offset inside the master bar as a whole-note fraction */
  offset: TimingFraction;
}

/** Current rolling playback position inside the score timeline */
interface PlaybackCursor {
  /** Master bar index in the score */
  masterBarIndex: number;
  /** Start offset inside the current master bar */
  startOffset: TimingFraction;
  /** Repeat start master bar index if inside a repeat section */
  repeatStartIndex?: number;
  /** Completed repeat passes for the active repeat section */
  repeatCount: number;
}

/** Interface representing everything that makes the note's sound */
interface NoteVoice {
  oscillatorNode: OscillatorNode;
  gainNode: GainNode;
}

export class ScorePlayer {
  /** Score being played */
  readonly score: Score;

  /** Audio context object */
  private _audioContext?: AudioContext;
  /** Absolute playback time in seconds scheduled so far */
  private _scheduledPlaybackSeconds: number;
  /** Anchored value of AudioContext.currentTime for exact playback scheduling */
  private _currentScheduleBase: number;

  /** All currently scheduled note voices */
  private _scheduledVoices: Set<NoteVoice>;
  /** Index of the next master bar to schedule */
  private _nextMasterBarIndexToSchedule: number;
  /** Playback start boundary for the current run */
  private _playbackStartBoundary?: PlaybackBoundary;
  /** Playback end boundary for the current run */
  private _playbackEndBoundary?: PlaybackBoundary;

  /** UUID of the currently rendered track */
  private _activeTrackUUID: number;
  /** UUID of the staff on which the player was started (to avoid multiple beat change events)*/
  private _activeStaffUUID: number;

  /** Indicates if playback is active or starting */
  private _isPlaying: boolean = false;
  /** Monotonic playback generation used to ignore stale async start completions */
  private _playbackRunId: number = 0;
  /** Indicates if looping is enabled */
  private _isLooped: boolean = false;
  /** Selected loop section if any */
  private _loopSection?: LoopSection;
  /** Current beat on the active rendered track */
  private _currentBeat?: Beat;
  /** Active repeat section start index if traversal is inside a repeat */
  private _repeatStartMasterBarIndex?: number;
  /** Completed repeat passes for the active repeat section */
  private _repeatPassCount: number = 0;

  /** Seconds to keep scheduled ahead of the transport */
  private _lookaheadSeconds: number = 5;
  /** Lookahead polling interval in milliseconds */
  private _schedulerIntervalMs: number = 50;
  /** Interval handle for rolling scheduling */
  private _schedulerInterval?: ReturnType<typeof setInterval>;
  /** Timeouts driving beat-change and natural-stop UI events */
  private _scheduledUiTimeouts: Set<ReturnType<typeof setTimeout>>;
  /** Stop timeout for natural playback end */
  private _stopTimeout?: ReturnType<typeof setTimeout>;

  /**
   * Score player that handles playback for all tracks/staves
   * @param score Score
   * @param activeTrack Currently rendered track
   */
  constructor(score: Score, activeTrack: Track) {
    this._scheduledPlaybackSeconds = 0;
    this._currentScheduleBase = 0;
    this._scheduledVoices = new Set();
    this._nextMasterBarIndexToSchedule = 0;
    this._scheduledUiTimeouts = new Set();

    this.score = score;
    this._activeTrackUUID = activeTrack.uuid;
    this._activeStaffUUID = activeTrack.staves[0].uuid;
    void ZERO_FRACTION;
  }

  /** Ensures audio context exists before playback starts */
  private ensureAudioContext(): void {
    if (this._audioContext !== undefined) {
      return;
    }

    this._audioContext = new AudioContext();
  }

  /** Resets rolling scheduling state for a fresh playback run */
  private resetSchedulingState(): void {
    this._scheduledPlaybackSeconds = 0;
    this._currentScheduleBase = 0;
    this._nextMasterBarIndexToSchedule = 0;
    this._playbackStartBoundary = undefined;
    this._playbackEndBoundary = undefined;
    this._currentBeat = undefined;
    this._repeatStartMasterBarIndex = undefined;
    this._repeatPassCount = 0;
  }

  /** Emits a playback state change signal for UI consumers */
  private emitPlaybackStateChanged(): void {
    trackEvent.emit(TrackEventType.PlayerStateChanged, {});
  }

  /** Schedules a beat-change event for the active rendered track */
  private scheduleBeatChange(beat: Beat, startTime: number): void {
    if (
      beat.bar.staff.track.uuid !== this._activeTrackUUID ||
      beat.bar.staff.uuid !== this._activeStaffUUID
    ) {
      return;
    }
    if (this._audioContext === undefined) {
      throw Error("Audio context is not initialized");
    }

    const playbackRunId = this._playbackRunId;
    const delayMs = Math.max(
      0,
      (startTime - this._audioContext.currentTime) * 1000
    );
    const timeout = setTimeout(() => {
      this._scheduledUiTimeouts.delete(timeout);
      if (!this._isPlaying || playbackRunId !== this._playbackRunId) {
        return;
      }

      this._currentBeat = beat;
      trackEvent.emit(TrackEventType.PlayerCurBeatChanged, {
        beatUUID: beat.uuid,
      });
    }, delayMs);
    this._scheduledUiTimeouts.add(timeout);
  }

  /** Schedules a natural stop once all playback has been buffered */
  private scheduleNaturalStop(): void {
    if (this._audioContext === undefined || this._stopTimeout !== undefined) {
      return;
    }

    const playbackRunId = this._playbackRunId;
    const delayMs = Math.max(
      0,
      (this._currentScheduleBase +
        this._scheduledPlaybackSeconds -
        this._audioContext.currentTime) *
        1000
    );
    this._stopTimeout = setTimeout(() => {
      this._stopTimeout = undefined;
      if (!this._isPlaying || playbackRunId !== this._playbackRunId) {
        return;
      }

      this.stop();
    }, delayMs);
  }

  /** Gets playback start boundary from the selected start beat or score start */
  private getPlaybackStartBoundary(startBeat?: Beat): PlaybackBoundary {
    if (startBeat === undefined) {
      return {
        masterBarIndex: 0,
        offset: ZERO_FRACTION,
      };
    }

    return {
      masterBarIndex: this.score.masterBars.indexOf(startBeat.bar.masterBar),
      offset: ticksToFraction(
        startBeat.startTick,
        startBeat.bar.tickResolution
      ),
    };
  }

  /** Gets playback end boundary from the selected end beat if any */
  private getPlaybackEndBoundary(endBeat?: Beat): PlaybackBoundary | undefined {
    if (endBeat === undefined) {
      return undefined;
    }

    return {
      masterBarIndex: this.score.masterBars.indexOf(endBeat.bar.masterBar),
      offset: ticksToFraction(endBeat.endTick, endBeat.bar.tickResolution),
    };
  }

  /** Indicates whether a repeat span is fully contained inside current playback */
  private isRepeatInsidePlayback(
    repeatStartIndex: number,
    repeatEndIndex: number
  ): boolean {
    const playbackStartIndex = this._playbackStartBoundary?.masterBarIndex;
    const playbackEndIndex = this._playbackEndBoundary?.masterBarIndex;
    if (playbackStartIndex === undefined || playbackEndIndex === undefined) {
      return true;
    }

    return (
      repeatStartIndex >= playbackStartIndex &&
      repeatEndIndex <= playbackEndIndex
    );
  }

  /**
   * Gets the next master bar index in playback order honoring score repeats.
   * Returns null when playback should stop at the end of the score.
   */
  private getNextMasterBarIndex(currentMasterBarIndex: number): number | null {
    const masterBar = this.score.masterBars[currentMasterBarIndex];

    if (
      masterBar.repeatStatus === BarRepeatStatus.Start &&
      this._repeatStartMasterBarIndex !== currentMasterBarIndex
    ) {
      this._repeatStartMasterBarIndex = currentMasterBarIndex;
      this._repeatPassCount = 0;
    }

    if (
      masterBar.repeatStatus === BarRepeatStatus.End &&
      this._repeatStartMasterBarIndex !== undefined
    ) {
      const repeatCount = masterBar.repeatCount ?? 2;
      if (
        this.isRepeatInsidePlayback(
          this._repeatStartMasterBarIndex,
          currentMasterBarIndex
        ) &&
        this._repeatPassCount < repeatCount - 1
      ) {
        this._repeatPassCount++;
        return this._repeatStartMasterBarIndex;
      }

      this._repeatStartMasterBarIndex = undefined;
      this._repeatPassCount = 0;
    }

    if (
      this._isLooped &&
      this._playbackEndBoundary !== undefined &&
      currentMasterBarIndex === this._playbackEndBoundary.masterBarIndex
    ) {
      if (this._loopSection !== undefined) {
        this._playbackStartBoundary = this.getPlaybackStartBoundary(
          this._loopSection.startBeat
        );
      }
      return this._playbackStartBoundary?.masterBarIndex ?? 0;
    }

    const nextMasterBarIndex = currentMasterBarIndex + 1;
    if (nextMasterBarIndex >= this.score.masterBars.length && this._isLooped) {
      this._playbackStartBoundary = this.getPlaybackStartBoundary();
      return 0;
    }

    return nextMasterBarIndex < this.score.masterBars.length
      ? nextMasterBarIndex
      : null;
  }

  /**
   * Schedules a single note to play at a given start time and end at a given stop time
   * @param note - Note
   * @param startTime - Start time for the note (note's beat's start time)
   * @param stopTime - Stop time for the note (note's beat's stop time)
   */
  private scheduleNote(note: Note, startTime: number, stopTime: number): void {
    // == Web Audio note initialization, should be extracted later ==
    //
    // Each note gets its own oscillator because oscillators are one-shot
    // sound events: start them once, stop them once, then create new ones.
    this.ensureAudioContext();
    if (this._audioContext === undefined) {
      throw Error("Audio context is not initialized");
    }

    const oscillatorNode = this._audioContext.createOscillator();
    oscillatorNode.type = "sine";
    oscillatorNode.frequency.value = getNoteFrequency(note);

    // A tiny fade in/out prevents clicks at note boundaries.
    const gainNode = this._audioContext.createGain();
    const releaseStartTime = Math.max(startTime + 0.01, stopTime - 0.02);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.06, startTime + 0.01);
    gainNode.gain.setValueAtTime(0.06, releaseStartTime);
    gainNode.gain.linearRampToValueAtTime(0, stopTime);

    oscillatorNode.connect(gainNode);
    gainNode.connect(this._audioContext.destination);
    oscillatorNode.start(startTime);
    oscillatorNode.stop(stopTime);

    const scheduledVoice = { oscillatorNode, gainNode };

    oscillatorNode.onended = () => {
      oscillatorNode.disconnect();
      gainNode.disconnect();
      this._scheduledVoices.delete(scheduledVoice);
    };

    this._scheduledVoices.add(scheduledVoice);
    //
    // == Web Audio note initialization, should be extracted later ==
  }

  /**
   * Schedules all beat's notes to play at the same time for the same duration
   * @param beat - Beat to schedule
   * @returns Beat's duration in seconds
   */
  private scheduleBeat(beat: Beat, barTimingOffsetSeconds: number): number {
    const beatDurationInSeconds = ticksToSeconds(
      beat.fullDurationTicks,
      beat.bar.tickResolution,
      beat.bar.masterBar.tempo
    );
    const startTime = this._currentScheduleBase + barTimingOffsetSeconds;
    const stopTime = startTime + beatDurationInSeconds;

    this.scheduleBeatChange(beat, startTime);

    for (const note of beat.notes) {
      this.scheduleNote(note, startTime, stopTime);
    }

    return beatDurationInSeconds;
  }

  /** Gets the start offset in seconds for the current first playback bar */
  private getMasterBarStartOffsetSeconds(masterBarIndex: number): number {
    if (
      this._playbackStartBoundary === undefined ||
      masterBarIndex !== this._playbackStartBoundary.masterBarIndex
    ) {
      return 0;
    }

    return fractionToSeconds(
      this._playbackStartBoundary.offset,
      this.score.masterBars[masterBarIndex].tempo
    );
  }

  /** Gets the end offset in seconds for the current last playback bar */
  private getMasterBarEndOffsetSeconds(masterBarIndex: number): number {
    const fullMasterBarDurationSeconds = fractionToSeconds(
      this.score.masterBars[masterBarIndex].barDurationFraction,
      this.score.masterBars[masterBarIndex].tempo
    );

    if (
      this._playbackEndBoundary === undefined ||
      masterBarIndex !== this._playbackEndBoundary.masterBarIndex
    ) {
      return fullMasterBarDurationSeconds;
    }

    return fractionToSeconds(
      this._playbackEndBoundary.offset,
      this.score.masterBars[masterBarIndex].tempo
    );
  }

  /** Gets the scheduled playback duration for a master bar slice */
  private getMasterBarDurationSeconds(masterBarIndex: number): number {
    return (
      this.getMasterBarEndOffsetSeconds(masterBarIndex) -
      this.getMasterBarStartOffsetSeconds(masterBarIndex)
    );
  }

  /**
   * Schedules a single bar
   * @param bar - Bar to schedule
   */
  private scheduleBar(masterBarIndex: number, bar: Bar): void {
    const masterBarStartOffsetSeconds =
      this.getMasterBarStartOffsetSeconds(masterBarIndex);
    for (const beat of bar.beats) {
      if (!bar.beatPlayable(beat)) {
        continue;
      }

      if (
        this._playbackStartBoundary !== undefined &&
        masterBarIndex === this._playbackStartBoundary.masterBarIndex
      ) {
        const beatStartOffset = ticksToFraction(
          beat.startTick,
          bar.tickResolution
        );
        if (fractionLt(beatStartOffset, this._playbackStartBoundary.offset)) {
          continue;
        }
      }

      if (
        this._playbackEndBoundary !== undefined &&
        masterBarIndex === this._playbackEndBoundary.masterBarIndex
      ) {
        const beatStartOffset = ticksToFraction(
          beat.startTick,
          bar.tickResolution
        );
        if (fractionLte(this._playbackEndBoundary.offset, beatStartOffset)) {
          continue;
        }
      }

      const beatStartOffsetSeconds = ticksToSeconds(
        beat.startTick,
        bar.tickResolution,
        bar.masterBar.tempo
      );
      this.scheduleBeat(
        beat,
        this._scheduledPlaybackSeconds +
          beatStartOffsetSeconds -
          masterBarStartOffsetSeconds
      );
    }
  }

  /**
   * Scheduling a master bar, meaning scheduling all bars that correspond
   * to the passed master bar
   * @param masterBarIndex - Index of the master bar
   */
  private scheduleMasterBar(masterBarIndex: number): void {
    const masterBarDurationSeconds =
      this.getMasterBarDurationSeconds(masterBarIndex);

    for (const track of this.score.tracks) {
      for (const staff of track.staves) {
        const bar = staff.bars[masterBarIndex];
        this.scheduleBar(masterBarIndex, bar);
      }
    }

    this._scheduledPlaybackSeconds += masterBarDurationSeconds;
    if (
      this._playbackStartBoundary !== undefined &&
      masterBarIndex === this._playbackStartBoundary.masterBarIndex
    ) {
      this._playbackStartBoundary = undefined;
    }
    if (
      this._playbackEndBoundary !== undefined &&
      masterBarIndex === this._playbackEndBoundary.masterBarIndex &&
      !this._isLooped
    ) {
      this._playbackEndBoundary = undefined;
    }
    const nextMasterBarIndex = this.getNextMasterBarIndex(masterBarIndex);
    this._nextMasterBarIndexToSchedule =
      nextMasterBarIndex ?? this.score.masterBars.length;
  }

  /**
   * Schedules the next "lookahead window" of the score
   */
  private scheduleLookahead(): void {
    if (!this._isPlaying) {
      return;
    }

    if (this._audioContext === undefined) {
      throw Error("AudioContext is not initialized at lookahead schedule");
    }

    const elapsedPlaybackSeconds = Math.max(
      0,
      this._audioContext.currentTime - this._currentScheduleBase
    );
    const lookaheadTargetSeconds =
      elapsedPlaybackSeconds + this._lookaheadSeconds;

    while (this._nextMasterBarIndexToSchedule < this.score.masterBars.length) {
      const masterBarIndex = this._nextMasterBarIndexToSchedule;
      const masterBarDurationSeconds =
        this.getMasterBarDurationSeconds(masterBarIndex);

      if (
        this._scheduledPlaybackSeconds + masterBarDurationSeconds >
        lookaheadTargetSeconds
      ) {
        break;
      }

      this.scheduleMasterBar(masterBarIndex);
    }

    if (
      !this._isLooped &&
      this._nextMasterBarIndexToSchedule >= this.score.masterBars.length
    ) {
      this.scheduleNaturalStop();
    }
  }

  /**
   * Schedules the entire score
   */
  private scheduleScore(): void {
    this._isPlaying = true;
    this.emitPlaybackStateChanged();
    this.ensureAudioContext();
    if (this._audioContext === undefined) {
      throw Error("Audio context is not initialized");
    }

    this._currentScheduleBase = this._audioContext.currentTime + 0.05;
    this._scheduledPlaybackSeconds = 0;

    clearInterval(this._schedulerInterval);

    this._schedulerInterval = setInterval(() => {
      this.scheduleLookahead();
    }, this._schedulerIntervalMs);

    this.scheduleLookahead();
  }

  /**
   * Starts playback from the specified options/current state
   * @param options Playback options
   */
  public async start(options: PlaybackOptions = {}): Promise<void> {
    const playbackRunId = ++this._playbackRunId;

    this._isPlaying = false;
    this.resetPlayback();

    this.ensureAudioContext();

    if (this._audioContext === undefined) {
      throw Error("Audio context is not initialized at score player start");
    }

    try {
      await this._audioContext.resume();
    } catch (error) {
      if (playbackRunId !== this._playbackRunId) {
        return;
      }

      this._isPlaying = false;
      console.error("Failed to start audio context", error);
      return;
    }

    if (playbackRunId !== this._playbackRunId) {
      return;
    }

    this.resetSchedulingState();
    this._playbackStartBoundary = this.getPlaybackStartBoundary(
      this._isLooped && this._loopSection !== undefined
        ? this._loopSection.startBeat
        : options.startBeat
    );
    this._playbackEndBoundary =
      this._isLooped && this._loopSection !== undefined
        ? this.getPlaybackEndBoundary(this._loopSection.endBeat)
        : this.getPlaybackEndBoundary(options.loopEndBeat);
    this._nextMasterBarIndexToSchedule =
      this._playbackStartBoundary.masterBarIndex;

    if (options.startBeat) {
      this._activeStaffUUID = options.startBeat.bar.staff.uuid;
    }

    this.scheduleScore();
  }

  /**
   * Un-schedules all the scheduled notes without changing playback generation
   */
  private resetPlayback(): void {
    if (this._audioContext === undefined) {
      return;
    }

    clearInterval(this._schedulerInterval);
    this._schedulerInterval = undefined;

    if (this._stopTimeout !== undefined) {
      clearTimeout(this._stopTimeout);
      this._stopTimeout = undefined;
    }

    for (const timeout of this._scheduledUiTimeouts) {
      clearTimeout(timeout);
    }
    this._scheduledUiTimeouts.clear();

    for (const voice of this._scheduledVoices) {
      try {
        voice.oscillatorNode.stop(this._audioContext.currentTime);
      } catch {
        // Stopping an already stopped oscillator is harmless for teardown.
      }
      voice.gainNode.disconnect();
      voice.oscillatorNode.disconnect();
    }

    this._scheduledVoices.clear();
    this.resetSchedulingState();
  }

  /** Stops playback and clears scheduled events */
  public stop(): void {
    this._playbackRunId++;
    this._isPlaying = false;
    this.resetPlayback();
    this.emitPlaybackStateChanged();
  }

  /** Toggles loop mode */
  public toggleLoop(): void {
    this._isLooped = !this._isLooped;
  }

  /** Enables loop mode */
  public enableLoop(): void {
    this._isLooped = true;
  }

  /** Disables loop mode */
  public disableLoop(): void {
    this._isLooped = false;
  }

  /** Clears currently selected loop section */
  public clearLoopSection(): void {
    this._loopSection = undefined;
  }

  /**
   * Sets playback loop section
   * @param startBeat Loop start beat
   * @param endBeat Loop end beat
   */
  public setLoopSection(startBeat: Beat, endBeat: Beat): void {
    this._loopSection = { startBeat, endBeat };
  }

  /** Disposes all playback resources */
  public dispose(): void {
    this.stop();

    if (this._audioContext !== undefined) {
      void this._audioContext.close();
      this._audioContext = undefined;
    }
  }

  /** Indicates if playback is active */
  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  /** Indicates if loop mode is enabled */
  public get isLooped(): boolean {
    return this._isLooped;
  }

  /** Current beat on the active rendered track */
  public get currentBeat(): Beat | undefined {
    return this._currentBeat;
  }
}
