import {
  Score,
  Beat,
  Track,
  VoiceNumber,
  fractionLt,
  ticksToFraction,
} from "../notation/model";
import { randomInt } from "../shared";
import { trackEvent, TrackEventType } from "../shared/events";
import { ResolvedPlaybackConfig } from "../config/tabui-config";
import { PlaybackScheduler, ScheduledBeatChange } from "./playback-scheduler";

// TODO: In a future playback refactor audit the extensive usage of try/catch here,
// among other things

/** Seconds of score material to keep scheduled ahead of playback. */
const LOOKAHEAD_SECONDS = 5;
/** Interval in milliseconds for rolling lookahead scheduling. */
const LOOKAHEAD_INTERVAL_MS = 50;

export interface PlaybackOptions {
  /** Beat to start playback from. */
  startBeat?: Beat;
  /** Ignore an already-open repeat when playback starts inside it. */
  skipOpenRepeatAtStart?: boolean;
  /** Playback range end beat. */
  loopEndBeat?: Beat;
}

/**
 * Owns playback transport and UI-facing playback state.
 * ScorePlayer keeps AudioContext lifecycle, start/stop/dispose behavior, rolling
 * lookahead polling, and playback events. Score-material scheduling is delegated
 * to PlaybackScheduler so score traversal and Web Audio node scheduling stay out
 * of the transport layer.
 */
export class ScorePlayer {
  /** Runtime identity used to scope global playback events to this player. */
  readonly uuid: number;
  /** Score being played. */
  readonly score: Score;

  /** Audio context object. */
  private _audioContext?: AudioContext;
  /** Score-material scheduler and owner of playback scheduling submodules. */
  private _scheduler: PlaybackScheduler;
  /** Anchored value of AudioContext.currentTime for exact playback scheduling. */
  private _currentScheduleBase: number;
  /** Interval handle for rolling lookahead scheduling. */
  private _schedulerInterval?: ReturnType<typeof setInterval>;
  /** Timeouts driving beat-change and natural-stop UI events. */
  private _scheduledUiTimeouts: Map<ReturnType<typeof setTimeout>, number>;
  /** Stop timeout for natural playback end. */
  private _stopTimeout?: ReturnType<typeof setTimeout>;
  /** Whether the current run has an initialized range and schedule base. */
  private _schedulingReady: boolean;

  /** UUID of the currently rendered track. */
  private _activeTrackUUID: number;
  /** UUID of the active staff used to avoid duplicate beat-change events. */
  private _activeStaffUUID: number;
  /** Voice preferred when simultaneous cursor beats are coalesced. */
  private _activeVoiceNumber: VoiceNumber;
  /** Last beat whose scheduled start time was reached on the active track. */
  private _lastStartedBeat?: Beat;
  /** Beat used as the origin for playback navigation commands. */
  private _playbackAnchorBeat?: Beat;
  /** Indicates if playback is active or starting. */
  private _isPlaying: boolean = false;
  /** Monotonic playback generation used to ignore stale async start completions. */
  private _playbackRunId: number = 0;
  /** True after disposal; async start work must not resume playback. */
  private _disposed: boolean = false;

  /**
   * Owns playback transport and UI-facing playback state.
   * @param score Score
   * @param activeTrack Currently rendered track
   * @param playbackConfig Resolved playback sample configuration
   */
  constructor(
    score: Score,
    activeTrack: Track,
    playbackConfig: ResolvedPlaybackConfig = {}
  ) {
    this.uuid = randomInt();
    this._currentScheduleBase = 0;
    this._scheduledUiTimeouts = new Map();
    this._schedulingReady = false;

    this.score = score;
    this._scheduler = new PlaybackScheduler(this.score, playbackConfig);
    this._activeTrackUUID = activeTrack.uuid;
    this._activeStaffUUID = activeTrack.staves[0].uuid;
    this._activeVoiceNumber = 1;
  }

  /** Ensures audio context exists before playback starts. */
  private ensureAudioContext(): void {
    if (this._disposed) {
      return;
    }

    if (this._audioContext !== undefined) {
      return;
    }

    const audioContext = new AudioContext();
    try {
      this._scheduler.setAudioContext(audioContext);
    } catch (error) {
      void audioContext.close().catch(() => {});
      throw error;
    }
    this._audioContext = audioContext;
  }

  /** Resets rolling scheduling state for a fresh playback run. */
  private resetSchedulingState(): void {
    this._currentScheduleBase = 0;
    this._schedulingReady = false;
    this._lastStartedBeat = undefined;
    this._playbackAnchorBeat = undefined;
    this._scheduler.reset();
  }

  /** Emits a playback state change signal for UI consumers. */
  private emitPlaybackStateChanged(): void {
    trackEvent.emit(TrackEventType.PlayerStateChanged, {
      playerUUID: this.uuid,
    });
  }

  private handlePlaybackFailure(
    error: unknown,
    playbackAnchorBeat: Beat | undefined,
    message: string
  ): void {
    this._playbackRunId++;
    this._isPlaying = false;
    this.resetPlayback();
    this._playbackAnchorBeat = playbackAnchorBeat;
    this.emitPlaybackStateChanged();
    console.error(message, error);
  }

  private handleScheduledBeatChange(
    beatChange: ScheduledBeatChange,
    nextBeatChange?: ScheduledBeatChange
  ): void {
    if (this._audioContext === undefined) {
      throw Error("Audio context is not initialized");
    }

    const playbackRunId = this._playbackRunId;
    const delayMs = Math.max(
      0,
      (beatChange.startTime - this._audioContext.currentTime) * 1000
    );
    const timeout = setTimeout(() => {
      this._scheduledUiTimeouts.delete(timeout);
      if (!this._isPlaying || playbackRunId !== this._playbackRunId) {
        return;
      }

      this._lastStartedBeat = beatChange.beat;
      trackEvent.emit(TrackEventType.PlayerCurBeatChanged, {
        trackUUID: this._activeTrackUUID,
        playerUUID: this.uuid,
        beatUUID: beatChange.beat.uuid,
        nextBeatUUID: nextBeatChange?.beat.uuid,
        startTime: beatChange.startTime,
        endTime: nextBeatChange?.startTime ?? beatChange.endTime,
        playbackRunId,
      });
    }, delayMs);
    this._scheduledUiTimeouts.set(timeout, beatChange.startTime);
  }

  private getCursorBeatPriority(beat: Beat): number {
    if (beat.voiceBar.bar.staff.uuid !== this._activeStaffUUID) {
      return 0;
    }
    return beat.voiceBar.voiceNumber === this._activeVoiceNumber ? 2 : 1;
  }

  private getCursorBeatChanges(
    beatChanges: ScheduledBeatChange[]
  ): ScheduledBeatChange[] {
    const activeTrackBeatChanges = beatChanges
      .filter(
        ({ beat }) =>
          beat.voiceBar.bar.staff.track.uuid === this._activeTrackUUID
      )
      .sort((a, b) => a.startTime - b.startTime);
    const cursorBeatChanges: ScheduledBeatChange[] = [];
    for (const beatChange of activeTrackBeatChanges) {
      const previous = cursorBeatChanges[cursorBeatChanges.length - 1];
      if (previous?.startTime === beatChange.startTime) {
        const previousPriority = this.getCursorBeatPriority(previous.beat);
        const beatPriority = this.getCursorBeatPriority(beatChange.beat);
        if (
          beatPriority > previousPriority ||
          (beatPriority === previousPriority &&
            beatChange.endTime > previous.endTime)
        ) {
          cursorBeatChanges[cursorBeatChanges.length - 1] = beatChange;
        }
        continue;
      }

      cursorBeatChanges.push(beatChange);
    }
    return cursorBeatChanges;
  }

  private isForwardBeatChange(
    beatChange: ScheduledBeatChange,
    nextBeatChange: ScheduledBeatChange
  ): boolean {
    const currentMasterBarIndex = this.score.masterBars.indexOf(
      beatChange.beat.voiceBar.bar.masterBar
    );
    const nextMasterBarIndex = this.score.masterBars.indexOf(
      nextBeatChange.beat.voiceBar.bar.masterBar
    );
    const beatPosition = ticksToFraction(
      beatChange.beat.startTick,
      beatChange.beat.voiceBar.tickResolution
    );
    const nextBeatPosition = ticksToFraction(
      nextBeatChange.beat.startTick,
      nextBeatChange.beat.voiceBar.tickResolution
    );
    return (
      nextMasterBarIndex > currentMasterBarIndex ||
      (nextMasterBarIndex === currentMasterBarIndex &&
        fractionLt(beatPosition, nextBeatPosition))
    );
  }

  private scheduleBeatChanges(
    beatChanges: ScheduledBeatChange[],
    nextBeatChanges: ScheduledBeatChange[]
  ): void {
    const cursorBeatChanges = this.getCursorBeatChanges(beatChanges);
    this._playbackAnchorBeat ??= cursorBeatChanges[0]?.beat;
    const nextCursorBeatChange = this.getCursorBeatChanges(nextBeatChanges)[0];
    for (let i = 0; i < cursorBeatChanges.length; i++) {
      let nextBeatChange: ScheduledBeatChange | undefined =
        cursorBeatChanges[i + 1] ?? nextCursorBeatChange;
      nextBeatChange =
        nextBeatChange !== undefined &&
        this.isForwardBeatChange(cursorBeatChanges[i], nextBeatChange)
          ? nextBeatChange
          : undefined;
      this.handleScheduledBeatChange(cursorBeatChanges[i], nextBeatChange);
    }
  }

  private clearUiTimeoutsFrom(startTime: number): void {
    for (const [timeout, timeoutStartTime] of this._scheduledUiTimeouts) {
      if (timeoutStartTime < startTime) {
        continue;
      }

      clearTimeout(timeout);
      this._scheduledUiTimeouts.delete(timeout);
    }
  }

  /** Handles natural playback completion once all playback has been buffered. */
  private handleNaturalPlaybackComplete(): void {
    if (this._audioContext === undefined || this._stopTimeout !== undefined) {
      return;
    }

    const playbackRunId = this._playbackRunId;
    const delayMs = Math.max(
      0,
      (this._currentScheduleBase +
        this._scheduler.scheduledPlaybackSeconds -
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

  /** Schedules the next lookahead window and handles scheduler results. */
  private scheduleLookahead(): void {
    if (!this._isPlaying) {
      return;
    }

    if (this._audioContext === undefined) {
      throw Error("Audio context is not initialized");
    }

    const elapsedPlaybackSeconds = Math.max(
      0,
      this._audioContext.currentTime - this._currentScheduleBase
    );
    const lookaheadTargetSeconds = elapsedPlaybackSeconds + LOOKAHEAD_SECONDS;
    const result = this._scheduler.scheduleUntil(lookaheadTargetSeconds);
    this.scheduleBeatChanges(result.beatChanges, result.nextBeatChanges);
    if (result.playbackComplete) {
      this.handleNaturalPlaybackComplete();
    }
  }

  /** Starts rolling score scheduling for the current playback run. */
  private scheduleScore(): void {
    if (this._audioContext === undefined) {
      throw Error("Playback scheduler is not initialized");
    }

    this._currentScheduleBase = this._audioContext.currentTime + 0.05;
    this._scheduler.setScheduleBase(this._currentScheduleBase);

    clearInterval(this._schedulerInterval);
    this.scheduleLookahead();
    this._schedulingReady = true;
    const playbackRunId = this._playbackRunId;
    this._schedulerInterval = setInterval(() => {
      if (playbackRunId !== this._playbackRunId) {
        return;
      }

      try {
        this.scheduleLookahead();
      } catch (error) {
        this.handlePlaybackFailure(
          error,
          this.playbackAnchorBeat,
          "Failed to schedule playback"
        );
      }
    }, LOOKAHEAD_INTERVAL_MS);
  }

  /**
   * Starts playback from the specified options/current state.
   * @param options Playback options
   */
  public async start(options: PlaybackOptions = {}): Promise<void> {
    if (this._disposed) {
      return;
    }

    const playbackRunId = ++this._playbackRunId;
    const playbackAnchorBeat =
      options.startBeat ?? this._lastStartedBeat ?? this._playbackAnchorBeat;

    this.resetPlayback();
    this._playbackAnchorBeat = playbackAnchorBeat;
    if (!this._isPlaying) {
      this._isPlaying = true;
      this.emitPlaybackStateChanged();
    }

    try {
      this.ensureAudioContext();
    } catch (error) {
      if (this._disposed || playbackRunId !== this._playbackRunId) {
        return;
      }
      this.handlePlaybackFailure(
        error,
        playbackAnchorBeat,
        "Failed to initialize audio context"
      );
      return;
    }

    if (this._audioContext === undefined) {
      throw Error("Audio context is not initialized at score player start");
    }

    try {
      await this._audioContext.resume();
    } catch (error) {
      if (this._disposed || playbackRunId !== this._playbackRunId) {
        return;
      }

      this.handlePlaybackFailure(
        error,
        playbackAnchorBeat,
        "Failed to start audio context"
      );
      return;
    }

    if (this._disposed || playbackRunId !== this._playbackRunId) {
      return;
    }

    try {
      await this._scheduler.loadSamples();
    } catch (error) {
      if (this._disposed || playbackRunId !== this._playbackRunId) {
        return;
      }

      this.handlePlaybackFailure(
        error,
        playbackAnchorBeat,
        "Failed to load playback samples"
      );
      return;
    }

    if (this._disposed || playbackRunId !== this._playbackRunId) {
      return;
    }

    try {
      this.resetSchedulingState();
      this._playbackAnchorBeat = playbackAnchorBeat;
      this._scheduler.setPlaybackRange(playbackAnchorBeat, options.loopEndBeat);

      if (playbackAnchorBeat) {
        this._activeStaffUUID = playbackAnchorBeat.voiceBar.bar.staff.uuid;
        this._activeVoiceNumber = playbackAnchorBeat.voiceBar.voiceNumber;
      }

      this.scheduleScore();
    } catch (error) {
      if (this._disposed || playbackRunId !== this._playbackRunId) {
        return;
      }
      this.handlePlaybackFailure(
        error,
        playbackAnchorBeat,
        "Failed to schedule playback"
      );
    }
  }

  /**
   * Clears scheduled playback work without changing playback generation.
   */
  private resetPlayback(): void {
    this._schedulingReady = false;
    if (this._audioContext === undefined) {
      return;
    }

    clearInterval(this._schedulerInterval);
    this._schedulerInterval = undefined;

    if (this._stopTimeout !== undefined) {
      clearTimeout(this._stopTimeout);
      this._stopTimeout = undefined;
    }

    for (const timeout of this._scheduledUiTimeouts.keys()) {
      clearTimeout(timeout);
    }
    this._scheduledUiTimeouts.clear();

    this._scheduler.stopScheduledAudioNodes(this._audioContext.currentTime);
    this.resetSchedulingState();
  }

  /** Stops playback and clears scheduled events. */
  public stop(): void {
    this._playbackRunId++;
    this._isPlaying = false;
    this.resetPlayback();
    this.emitPlaybackStateChanged();
  }

  private applyLiveLoopChange(): void {
    if (!this._isPlaying || !this._schedulingReady) {
      return;
    }

    if (this._audioContext === undefined) {
      throw Error("Audio context is not initialized");
    }

    const elapsedPlaybackSeconds = Math.max(
      0,
      this._audioContext.currentTime - this._currentScheduleBase
    );
    const nextLoopStartOffset = this._scheduler.nextLoopStartOffsetAfter(
      elapsedPlaybackSeconds
    );
    if (!this._scheduler.isLooped && nextLoopStartOffset !== undefined) {
      const loopStartTime = this._currentScheduleBase + nextLoopStartOffset;
      this.clearUiTimeoutsFrom(loopStartTime);
      this._scheduler.stopAudioFrom(
        loopStartTime,
        this._audioContext.currentTime
      );
      this._scheduler.truncateAt(nextLoopStartOffset);
    }

    if (this._stopTimeout !== undefined) {
      clearTimeout(this._stopTimeout);
      this._stopTimeout = undefined;
    }
    try {
      this.scheduleLookahead();
    } catch (error) {
      this.handlePlaybackFailure(
        error,
        this.playbackAnchorBeat,
        "Failed to schedule playback"
      );
    }
  }

  /** Toggles loop mode. */
  public toggleLoop(): void {
    this._scheduler.toggleLoop();
    this.applyLiveLoopChange();
  }

  /** Applies current track playback-control state to already scheduled audio. */
  public syncTrackPlaybackState(): void {
    if (this._audioContext === undefined) {
      return;
    }

    this._scheduler.applyTrackControls(this._audioContext.currentTime);
  }

  /** Clears currently selected loop section. */
  public clearLoopSection(): void {
    this._scheduler.clearLoopSection();
  }

  /**
   * Sets playback loop section.
   * @param startBeat Loop start beat
   * @param endBeat Loop end beat
   */
  public setLoopSection(startBeat: Beat, endBeat: Beat): void {
    this._scheduler.setLoopSection(startBeat, endBeat);
  }

  /** Disposes all playback resources. */
  public dispose(): void {
    if (this._disposed) {
      return;
    }

    this._disposed = true;
    this.stop();

    if (this._audioContext !== undefined) {
      void this._audioContext.close().catch(() => {});
      this._audioContext = undefined;
      this._scheduler.clearAudioContext();
    }
  }

  /** Indicates if playback is active. */
  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  /** Indicates if loop mode is enabled. */
  public get isLooped(): boolean {
    return this._scheduler.isLooped;
  }

  /** Last beat whose scheduled start time was reached on the active track. */
  public get lastStartedBeat(): Beat | undefined {
    return this._lastStartedBeat;
  }

  /** Beat used as the origin for playback navigation commands. */
  public get playbackAnchorBeat(): Beat | undefined {
    return this._lastStartedBeat ?? this._playbackAnchorBeat;
  }

  /** Current Web Audio clock time used by playback cursor animation. */
  public get currentTime(): number | undefined {
    return this._audioContext?.currentTime;
  }

  /** Current playback generation used to invalidate stale cursor animation. */
  public get playbackRunId(): number {
    return this._playbackRunId;
  }
}
