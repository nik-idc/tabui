import {
  Bar,
  Beat,
  GuitarNote,
  GuitarTechniqueType,
  Score,
  Track,
  getNoteFrequency,
  ticksToSeconds,
} from "../notation/model";
import { ResolvedPlaybackConfig } from "../config/tabui-config";
import { PlaybackNoteScheduler } from "./playback-note-scheduler";
import { PlaybackSampleManager } from "./playback-sample-manager";
import { PlaybackTraversalManager } from "./playback-traversal-manager";
import { ScheduledAudioNode, TrackAudioBus } from "./scheduled-audio-node";

export interface ScheduledBeatChange {
  /** Beat whose UI cursor should be activated. */
  beat: Beat;
  /** Absolute audio context time when the beat starts. */
  startTime: number;
  /** Absolute audio context time when the beat's duration ends. */
  endTime: number;
}

export interface PlaybackScheduleResult {
  /** Beat-change UI events produced while scheduling score material. */
  beatChanges: ScheduledBeatChange[];
  /** Calculated beat timing data for the next traversal bar. */
  nextBeatChanges: ScheduledBeatChange[];
  /** Indicates that non-looped playback reached the natural end. */
  playbackComplete: boolean;
}

/**
 * Schedules score material for playback.
 * This owns rolling score scheduling state and delegates traversal decisions and
 * per-note Web Audio node creation to narrower playback modules.
 */
export class PlaybackScheduler {
  /** Score whose bars and beats should be scheduled. */
  private _score: Score;
  /** Traversal manager for boundaries, repeats, and looping. */
  private _traversalManager: PlaybackTraversalManager;
  /** Playback sample configuration. */
  private _playbackConfig: ResolvedPlaybackConfig;
  /** Sample manager used to resolve configured samples by instrument tone. */
  private _sampleManager?: PlaybackSampleManager;
  /** Scheduler that creates Web Audio nodes for individual notes. */
  private _noteScheduler?: PlaybackNoteScheduler;

  /** Absolute playback time in seconds scheduled so far. */
  private _scheduledPlaybackSeconds: number;
  /** Anchored value of AudioContext.currentTime for exact playback scheduling. */
  private _currentScheduleBase: number;
  /** All currently scheduled audio nodes. */
  private _scheduledAudioNodes: Set<ScheduledAudioNode>;
  /** Stable per-track audio buses for live volume/mute/solo/pan controls. */
  private _trackAudioBuses: Map<number, TrackAudioBus>;
  /** Audio context currently backing sample, note, and track-bus scheduling. */
  private _audioContext?: AudioContext;
  /** Index of the next master bar to schedule. */
  private _nextMasterBarIndexToSchedule: number;
  /** Scheduled playback-second offsets where looped passes begin. */
  private _loopStartOffsets: number[];

  /**
   * Schedules score material for playback.
   * @param score Score whose material should be scheduled
   * @param playbackConfig Playback sample configuration
   */
  constructor(score: Score, playbackConfig: ResolvedPlaybackConfig) {
    this._score = score;
    this._traversalManager = new PlaybackTraversalManager(score);
    this._playbackConfig = playbackConfig;

    this._scheduledPlaybackSeconds = 0;
    this._currentScheduleBase = 0;
    this._scheduledAudioNodes = new Set();
    this._trackAudioBuses = new Map();
    this._audioContext = undefined;
    this._nextMasterBarIndexToSchedule = 0;
    this._loopStartOffsets = [];
  }

  private createTrackAudioBus(track: Track): TrackAudioBus {
    if (this._audioContext === undefined) {
      throw new Error("Audio context undefined in rebuild track buses");
    }

    const gainNode = this._audioContext.createGain();
    let pannerNode: StereoPannerNode | undefined;
    try {
      pannerNode = this._audioContext.createStereoPanner();
      gainNode.connect(pannerNode);
      pannerNode.connect(this._audioContext.destination);
      return { track, gainNode, pannerNode };
    } catch (error) {
      gainNode.disconnect();
      pannerNode?.disconnect();
      throw error;
    }
  }

  private rebuildTrackAudioBuses(): void {
    if (this._audioContext === undefined) {
      throw new Error("Audio context undefined in rebuild track buses");
    }

    for (const bus of this._trackAudioBuses.values()) {
      bus.gainNode.disconnect();
      bus.pannerNode.disconnect();
    }
    this._trackAudioBuses.clear();

    for (const track of this._score.tracks) {
      this._trackAudioBuses.set(track.uuid, this.createTrackAudioBus(track));
    }
    this.applyTrackControls(this._audioContext.currentTime);
  }

  /**
   * Sets the audio context used for sample loading and note scheduling.
   * @param audioContext Audio context used by sample and note schedulers
   */
  public setAudioContext(audioContext: AudioContext): void {
    this.clearAudioContext();
    this._audioContext = audioContext;
    try {
      this._sampleManager = new PlaybackSampleManager(
        audioContext,
        this._playbackConfig
      );
      this._noteScheduler = new PlaybackNoteScheduler(
        audioContext,
        this._sampleManager
      );
      this.rebuildTrackAudioBuses();
    } catch (error) {
      this.clearAudioContext();
      throw error;
    }
  }

  /** Clears audio-context-backed helpers after the audio context is closed. */
  public clearAudioContext(): void {
    for (const bus of this._trackAudioBuses.values()) {
      bus.gainNode.disconnect();
      bus.pannerNode.disconnect();
    }
    this._sampleManager = undefined;
    this._noteScheduler = undefined;
    this._audioContext = undefined;
    this._trackAudioBuses.clear();
  }

  /** Loads configured samples before playback scheduling begins. */
  public async loadSamples(): Promise<void> {
    if (this._sampleManager === undefined) {
      throw Error("Playback sample manager is not initialized");
    }

    await this._sampleManager.loadConfiguredSamples();
  }

  /** Resets rolling scheduling state for a fresh playback run. */
  public reset(): void {
    this._scheduledPlaybackSeconds = 0;
    this._currentScheduleBase = 0;
    this._nextMasterBarIndexToSchedule = 0;
    this._loopStartOffsets = [];
    this._traversalManager.reset();
  }

  /**
   * Sets traversal boundaries for the next playback run.
   * @param startBeat Beat to start playback from
   * @param endBeat Beat to end playback at
   */
  public setPlaybackRange(startBeat?: Beat, endBeat?: Beat): void {
    this._traversalManager.setPlaybackRange(startBeat, endBeat);
    this._nextMasterBarIndexToSchedule =
      this._traversalManager.firstMasterBarIndex;
  }

  /**
   * Sets the audio time base used for subsequent score scheduling.
   * @param scheduleBase Absolute audio context time corresponding to playback zero
   */
  public setScheduleBase(scheduleBase: number): void {
    this._currentScheduleBase = scheduleBase;
    this._scheduledPlaybackSeconds = 0;
    this._nextMasterBarIndexToSchedule =
      this._traversalManager.firstMasterBarIndex;
    this._loopStartOffsets = [];
  }

  /**
   * Stops all scheduled audio nodes and clears scheduler-owned node state.
   * @param currentTime Audio context time used for immediate source stop
   */
  public stopScheduledAudioNodes(currentTime: number): void {
    for (const audioNode of this._scheduledAudioNodes) {
      try {
        audioNode.sourceNode.stop(currentTime);
      } catch {
        // Stopping an already stopped oscillator is harmless for teardown.
      }
      audioNode.gainNode.disconnect();
      audioNode.sourceNode.disconnect();
    }

    this._scheduledAudioNodes.clear();
  }

  /**
   * Stops scheduled audio nodes whose source starts at or after startTime.
   * @param startTime Absolute AudioContext time where cancellation starts
   * @param currentTime AudioContext time used for immediate source stop
   */
  public stopAudioFrom(startTime: number, currentTime: number): void {
    for (const audioNode of [...this._scheduledAudioNodes]) {
      if (audioNode.startTime < startTime) {
        continue;
      }

      try {
        audioNode.sourceNode.stop(currentTime);
      } catch {
        // Stopping an already stopped oscillator is harmless for teardown.
      }
      audioNode.gainNode.disconnect();
      audioNode.sourceNode.disconnect();
      this._scheduledAudioNodes.delete(audioNode);
    }
  }

  private getPlaybackEndTime(beat: Beat): number | undefined {
    const masterBarIndex = this._score.masterBars.indexOf(
      beat.voiceBar.bar.masterBar
    );
    const endDistanceSeconds =
      this._traversalManager.getPlaybackEndDistanceSeconds(masterBarIndex);
    if (endDistanceSeconds === undefined) {
      return undefined;
    }
    return (
      this._currentScheduleBase +
      this._scheduledPlaybackSeconds +
      endDistanceSeconds
    );
  }

  private createScheduledBeatChange(beat: Beat): ScheduledBeatChange {
    const bar = beat.voiceBar.bar;
    const masterBarIndex = this._score.masterBars.indexOf(bar.masterBar);
    const masterBarStartOffsetSeconds =
      this._traversalManager.getMasterBarStartOffsetSeconds(masterBarIndex);
    const beatStartOffsetSeconds = ticksToSeconds(
      beat.startTick,
      beat.voiceBar.tickResolution,
      bar.masterBar.tempo
    );
    const beatDurationInSeconds = ticksToSeconds(
      beat.fullDurationTicks,
      beat.voiceBar.tickResolution,
      bar.masterBar.tempo
    );
    const startTime =
      this._currentScheduleBase +
      this._scheduledPlaybackSeconds +
      beatStartOffsetSeconds -
      masterBarStartOffsetSeconds;
    const playbackEndTime = this.getPlaybackEndTime(beat);
    return {
      beat,
      startTime,
      endTime: Math.min(
        startTime + beatDurationInSeconds,
        playbackEndTime ?? Infinity
      ),
    };
  }

  /**
   * Schedules all playable notes in one beat and returns its UI timing data.
   * @param beat Beat to schedule
   */
  private scheduleBeat(
    beat: Beat,
    trackBus: TrackAudioBus
  ): ScheduledBeatChange {
    if (this._noteScheduler === undefined) {
      throw Error("Playback note scheduler is not initialized");
    }

    const beatChange = this.createScheduledBeatChange(beat);

    for (const note of beat.notes ?? []) {
      if (this.noteIsSlideTarget(note)) {
        continue;
      }

      const scheduledAudioNode = this._noteScheduler.scheduleNote(
        note,
        beatChange.startTime,
        beatChange.endTime,
        trackBus,
        this.getPlaybackEndTime(beat)
      );
      if (scheduledAudioNode === null) {
        continue;
      }

      scheduledAudioNode.sourceNode.onended = () => {
        scheduledAudioNode.sourceNode.disconnect();
        scheduledAudioNode.gainNode.disconnect();
        this._scheduledAudioNodes.delete(scheduledAudioNode);
      };

      this._scheduledAudioNodes.add(scheduledAudioNode);
    }

    return beatChange;
  }

  private noteIsSlideTarget(note: unknown): boolean {
    if (!(note instanceof GuitarNote)) {
      return false;
    }

    const prevBeat = note.beat.voiceBar.bar.staff.getPrevBeat(note.beat);
    const prevNote = prevBeat?.notes?.[note.stringNum - 1];
    return (
      prevNote instanceof GuitarNote &&
      prevNote.hasTechnique(GuitarTechniqueType.Slide) &&
      getNoteFrequency(note) > 0
    );
  }

  private getTrackAudioBus(track: Track): TrackAudioBus {
    let bus = this._trackAudioBuses.get(track.uuid);
    if (bus !== undefined) {
      return bus;
    }

    if (this._audioContext === undefined) {
      throw Error("Track audio bus is not initialized");
    }

    bus = this.createTrackAudioBus(track);
    this._trackAudioBuses.set(track.uuid, bus);
    this.applyTrackControls(this._audioContext.currentTime);
    return bus;
  }

  private removeStaleTrackAudioBuses(): void {
    const trackUUIDs = new Set(this._score.tracks.map((track) => track.uuid));
    for (const [trackUUID, bus] of this._trackAudioBuses) {
      if (trackUUIDs.has(trackUUID)) {
        continue;
      }

      bus.gainNode.disconnect();
      bus.pannerNode.disconnect();
      this._trackAudioBuses.delete(trackUUID);
    }
  }

  /**
   * Schedules a single staff bar for the current master bar pass.
   * @param masterBarIndex Master bar index being scheduled
   * @param bar Staff bar to schedule
   */
  private scheduleBar(masterBarIndex: number, bar: Bar): ScheduledBeatChange[] {
    const beatChanges: ScheduledBeatChange[] = [];
    const trackBus = this.getTrackAudioBus(bar.staff.track);
    for (const voiceBar of bar.voiceBarsAsArray) {
      for (const beat of voiceBar.beats) {
        if (!voiceBar.beatPlayable(beat)) {
          continue;
        }

        if (
          this._traversalManager.beatOutsideBoundaries(masterBarIndex, beat)
        ) {
          continue;
        }

        beatChanges.push(this.scheduleBeat(beat, trackBus));
      }
    }
    return beatChanges;
  }

  private calculateBarBeatChanges(
    masterBarIndex: number,
    bar: Bar
  ): ScheduledBeatChange[] {
    const beatChanges: ScheduledBeatChange[] = [];
    for (const voiceBar of bar.voiceBarsAsArray) {
      for (const beat of voiceBar.beats) {
        if (
          !voiceBar.beatPlayable(beat) ||
          this._traversalManager.beatOutsideBoundaries(masterBarIndex, beat)
        ) {
          continue;
        }

        beatChanges.push(this.createScheduledBeatChange(beat));
      }
    }
    return beatChanges;
  }

  private calculateNextMasterBarBeatChanges(): ScheduledBeatChange[] {
    const masterBarIndex = this._nextMasterBarIndexToSchedule;
    if (masterBarIndex >= this._score.masterBars.length) {
      return [];
    }

    const beatChanges: ScheduledBeatChange[] = [];
    for (const track of this._score.tracks) {
      for (const staff of track.staves) {
        beatChanges.push(
          ...this.calculateBarBeatChanges(
            masterBarIndex,
            staff.bars[masterBarIndex]
          )
        );
      }
    }
    return beatChanges;
  }

  /**
   * Schedules all track/staff bars for one master bar.
   * @param masterBarIndex Master bar index to schedule
   */
  private scheduleMasterBar(masterBarIndex: number): ScheduledBeatChange[] {
    const beatChanges: ScheduledBeatChange[] = [];
    const masterBarDurationSeconds =
      this._traversalManager.getMasterBarDurationSeconds(masterBarIndex);

    for (const track of this._score.tracks) {
      for (const staff of track.staves) {
        const bar = staff.bars[masterBarIndex];
        beatChanges.push(...this.scheduleBar(masterBarIndex, bar));
      }
    }

    this._scheduledPlaybackSeconds += masterBarDurationSeconds;
    const traversalResult =
      this._traversalManager.completeMasterBar(masterBarIndex);
    if (traversalResult.loopRestarted) {
      this._loopStartOffsets.push(this._scheduledPlaybackSeconds);
    }
    this._nextMasterBarIndexToSchedule =
      traversalResult.nextMasterBarIndex ?? this._score.masterBars.length;
    return beatChanges;
  }

  /** Applies current track controls to already-buffered audio nodes. */
  public applyTrackControls(currentTime: number): void {
    this.removeStaleTrackAudioBuses();
    const hasSoloedTrack = this._score.tracks.some((track) => track.soloed);
    for (const [_, bus] of this._trackAudioBuses) {
      const track = bus.track;
      const trackAudible = !track.muted && (!hasSoloedTrack || track.soloed);
      const trackGain = trackAudible ? track.volume : 0;

      bus.gainNode.gain.setValueAtTime(trackGain, currentTime);
      bus.pannerNode.pan.setValueAtTime(track.pan, currentTime);
    }
  }

  /**
   * Schedules score material until the lookahead target is reached.
   * @param lookaheadTargetSeconds Playback seconds to schedule up to
   * @returns Beat changes and natural-completion status produced while scheduling
   */
  public scheduleUntil(lookaheadTargetSeconds: number): PlaybackScheduleResult {
    const beatChanges: ScheduledBeatChange[] = [];

    while (this._nextMasterBarIndexToSchedule < this._score.masterBars.length) {
      const masterBarIndex = this._nextMasterBarIndexToSchedule;
      if (this._scheduledPlaybackSeconds >= lookaheadTargetSeconds) {
        break;
      }

      beatChanges.push(...this.scheduleMasterBar(masterBarIndex));
    }

    return {
      beatChanges,
      nextBeatChanges: this.calculateNextMasterBarBeatChanges(),
      playbackComplete: this._traversalManager.playbackComplete(
        this._nextMasterBarIndexToSchedule
      ),
    };
  }

  private resumeLoopFromEnd(): void {
    const lastLoopStartOffset =
      this._loopStartOffsets[this._loopStartOffsets.length - 1];
    if (lastLoopStartOffset !== this._scheduledPlaybackSeconds) {
      this._loopStartOffsets.push(this._scheduledPlaybackSeconds);
    }
    this._nextMasterBarIndexToSchedule =
      this._traversalManager.restartLoopTraversal();
  }

  /** Absolute playback time in seconds scheduled so far. */
  public get scheduledPlaybackSeconds(): number {
    return this._scheduledPlaybackSeconds;
  }

  /** Toggles loop mode. */
  public toggleLoop(): void {
    this._traversalManager.toggleLoop();
    if (
      this._traversalManager.isLooped &&
      this._nextMasterBarIndexToSchedule >= this._score.masterBars.length
    ) {
      this.resumeLoopFromEnd();
    }
  }

  /**
   * Gets the next scheduled loop-pass start after the current playback offset.
   * Offsets are measured from the start of the current playback run, not from
   * AudioContext.currentTime.
   * @param elapsedPlaybackSeconds Current playback offset in seconds
   * @returns Next loop start offset, or undefined if none is buffered
   */
  public nextLoopStartOffsetAfter(
    elapsedPlaybackSeconds: number
  ): number | undefined {
    return this._loopStartOffsets.find((o) => o > elapsedPlaybackSeconds);
  }

  /**
   * Discards scheduler state after the provided playback offset.
   * @param playbackSeconds Playback offset, measured from the current run start
   */
  public truncateAt(playbackSeconds: number): void {
    this._scheduledPlaybackSeconds = playbackSeconds;
    this._nextMasterBarIndexToSchedule = this._score.masterBars.length;
    this._traversalManager.resetRepeatTraversal();
    this._loopStartOffsets = this._loopStartOffsets.filter(
      (o) => o < playbackSeconds
    );
  }

  /** Clears currently selected loop section. */
  public clearLoopSection(): void {
    this._traversalManager.clearLoopSection();
  }

  /**
   * Sets playback loop section.
   * @param startBeat Loop start beat
   * @param endBeat Loop end beat
   */
  public setLoopSection(startBeat: Beat, endBeat: Beat): void {
    this._traversalManager.setLoopSection(startBeat, endBeat);
  }

  /** Indicates if loop mode is enabled. */
  public get isLooped(): boolean {
    return this._traversalManager.isLooped;
  }
}
