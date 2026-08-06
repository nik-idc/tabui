import { Score, Beat, Track } from "../notation/model";
import { randomInt } from "../shared";
import { trackEvent, TrackEventType } from "../shared/events";
import { ResolvedPlaybackConfig } from "../config/tabui-config";
import { PlaybackAudioEngine } from "./playback-audio-engine";
import { PlaybackCursorCoordinator } from "./playback-cursor-coordinator";
import { PlaybackScheduler } from "./playback-scheduler";

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

export enum PlaybackErrorCode {
  ContextInit = "context-init",
  ContextStart = "context-start",
  SampleLoading = "sample-loading",
  Scheduling = "scheduling",
}

export interface PlaybackError {
  code: PlaybackErrorCode;
  message: string;
  cause: unknown;
}

export type PlaybackErrorListener = (error: PlaybackError) => void;

/**
 * Owns playback transport and UI-facing playback state.
 * ScorePlayer coordinates start/stop/dispose behavior, rolling lookahead polling,
 * and playback events. Score timing, audio resources, and cursor projection are
 * delegated to dedicated collaborators.
 */
export class ScorePlayer {
  /** Runtime identity used to scope global playback events to this player. */
  readonly uuid: number;
  /** Score being played. */
  readonly score: Score;

  /** Score timeline planner and traversal coordinator. */
  private readonly _scheduler: PlaybackScheduler;
  /** Context-bound audio graph and note renderer. */
  private readonly _audioEngine: PlaybackAudioEngine;
  /** Interval handle for rolling lookahead scheduling. */
  private _schedulerInterval?: ReturnType<typeof setInterval>;
  /** Stop timeout for natural playback end. */
  private _stopTimeout?: ReturnType<typeof setTimeout>;
  /** Whether the current run has an initialized range and schedule base. */
  private _schedulingReady: boolean;

  /** Visible-track cursor projection and event coordination. */
  private readonly _cursorCoordinator: PlaybackCursorCoordinator;
  /** Indicates if playback is active or starting. */
  private _isPlaying: boolean = false;
  /** Monotonic playback generation used to ignore stale async start completions. */
  private _playbackRunId: number = 0;
  /** True after disposal; async start work must not resume playback. */
  private _disposed: boolean = false;
  /** Optional owner-scoped sink for actionable asynchronous failures. */
  private readonly _onError?: PlaybackErrorListener;

  /**
   * Owns playback transport and UI-facing playback state.
   * @param score Score
   * @param activeTrack Currently rendered track
   * @param playbackConfig Resolved playback sample configuration
   */
  constructor(
    score: Score,
    activeTrack: Track,
    playbackConfig: ResolvedPlaybackConfig = {},
    onError?: PlaybackErrorListener
  ) {
    this.uuid = randomInt();
    this._schedulingReady = false;

    this.score = score;
    this._onError = onError;
    this._audioEngine = new PlaybackAudioEngine(this.score, playbackConfig);
    this._scheduler = new PlaybackScheduler(this.score, this._audioEngine);
    this._cursorCoordinator = new PlaybackCursorCoordinator(
      this.score,
      activeTrack,
      this.uuid
    );
  }

  /** Resets rolling scheduling state for a fresh playback run. */
  private resetSchedulingState(): void {
    this._schedulingReady = false;
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
    code: PlaybackErrorCode,
    message: string
  ): void {
    this._playbackRunId++;
    this._isPlaying = false;
    this.resetPlayback();
    this._cursorCoordinator.setPlaybackAnchorBeat(playbackAnchorBeat);
    this.emitPlaybackStateChanged();
    console.error(message, error);
    this._onError?.({ code, message, cause: error });
  }

  /** Handles natural playback completion once all playback has been buffered. */
  private handleNaturalPlaybackComplete(): void {
    const currentTime = this._audioEngine.currentTime;
    if (currentTime === undefined || this._stopTimeout !== undefined) {
      return;
    }

    const playbackRunId = this._playbackRunId;
    const delayMs = Math.max(
      0,
      (this._scheduler.scheduleBase +
        this._scheduler.scheduledPlaybackSeconds -
        currentTime) *
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

    const currentTime = this._audioEngine.currentTime;
    if (currentTime === undefined) {
      throw Error("Audio context is not initialized");
    }

    const elapsedPlaybackSeconds = Math.max(
      0,
      currentTime - this._scheduler.scheduleBase
    );
    const lookaheadTargetSeconds = elapsedPlaybackSeconds + LOOKAHEAD_SECONDS;
    const result = this._scheduler.scheduleUntil(lookaheadTargetSeconds);
    this._cursorCoordinator.processScheduledBeatChanges(
      result.beatChanges,
      result.nextBeatChanges,
      currentTime,
      this._playbackRunId
    );
    if (result.playbackComplete) {
      this.handleNaturalPlaybackComplete();
    }
  }

  /** Starts rolling score scheduling for the current playback run. */
  private scheduleScore(): void {
    const currentTime = this._audioEngine.currentTime;
    if (currentTime === undefined) {
      throw Error("Playback scheduler is not initialized");
    }

    this._scheduler.setScheduleBase(currentTime + 0.05);

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
          PlaybackErrorCode.Scheduling,
          "Failed to schedule playback"
        );
      }
    }, LOOKAHEAD_INTERVAL_MS);
  }

  private startIsStale(playbackRunId: number): boolean {
    return this._disposed || playbackRunId !== this._playbackRunId;
  }

  private async initializeAudioForStart(
    playbackRunId: number,
    playbackAnchorBeat: Beat | undefined
  ): Promise<boolean> {
    try {
      this._audioEngine.initialize();
    } catch (error) {
      if (!this.startIsStale(playbackRunId)) {
        this.handlePlaybackFailure(
          error,
          playbackAnchorBeat,
          PlaybackErrorCode.ContextInit,
          "Failed to initialize audio context"
        );
      }
      return false;
    }

    try {
      await this._audioEngine.resume();
    } catch (error) {
      if (!this.startIsStale(playbackRunId)) {
        this.handlePlaybackFailure(
          error,
          playbackAnchorBeat,
          PlaybackErrorCode.ContextStart,
          "Failed to start audio context"
        );
      }
      return false;
    }

    return !this.startIsStale(playbackRunId);
  }

  private async loadSamplesForStart(
    playbackRunId: number,
    playbackAnchorBeat: Beat | undefined
  ): Promise<boolean> {
    try {
      await this._audioEngine.loadSamples();
    } catch (error) {
      if (!this.startIsStale(playbackRunId)) {
        this.handlePlaybackFailure(
          error,
          playbackAnchorBeat,
          PlaybackErrorCode.SampleLoading,
          "Failed to load playback samples"
        );
      }
      return false;
    }

    return !this.startIsStale(playbackRunId);
  }

  private initializeScheduleForStart(
    options: PlaybackOptions,
    playbackRunId: number,
    playbackAnchorBeat: Beat | undefined,
    activeTrackUUIDAtStart: number
  ): void {
    try {
      this.resetSchedulingState();
      if (this._cursorCoordinator.activeTrackUUID === activeTrackUUIDAtStart) {
        this._cursorCoordinator.setPlaybackAnchorBeat(playbackAnchorBeat);
      }
      this._scheduler.setPlaybackRange(playbackAnchorBeat, options.loopEndBeat);

      if (
        playbackAnchorBeat !== undefined &&
        this._cursorCoordinator.activeTrackUUID === activeTrackUUIDAtStart
      ) {
        this._cursorCoordinator.preferBeatLane(playbackAnchorBeat);
      }

      this.scheduleScore();
    } catch (error) {
      if (!this.startIsStale(playbackRunId)) {
        this.handlePlaybackFailure(
          error,
          playbackAnchorBeat,
          PlaybackErrorCode.Scheduling,
          "Failed to schedule playback"
        );
      }
    }
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
      options.startBeat ?? this._cursorCoordinator.playbackAnchorBeat;
    const activeTrackUUIDAtStart = this._cursorCoordinator.activeTrackUUID;

    this.resetPlayback();
    this._cursorCoordinator.setPlaybackAnchorBeat(playbackAnchorBeat);
    if (!this._isPlaying) {
      this._isPlaying = true;
      this.emitPlaybackStateChanged();
    }

    const audioInitialized = await this.initializeAudioForStart(
      playbackRunId,
      playbackAnchorBeat
    );
    if (!audioInitialized) {
      return;
    }

    const samplesLoaded = await this.loadSamplesForStart(
      playbackRunId,
      playbackAnchorBeat
    );
    if (!samplesLoaded) {
      return;
    }

    this.initializeScheduleForStart(
      options,
      playbackRunId,
      playbackAnchorBeat,
      activeTrackUUIDAtStart
    );
  }

  /**
   * Clears scheduled playback work without changing playback generation.
   */
  private resetPlayback(): void {
    this._schedulingReady = false;
    this._cursorCoordinator.reset(this._playbackRunId);
    if (this._audioEngine.currentTime === undefined) {
      return;
    }

    clearInterval(this._schedulerInterval);
    this._schedulerInterval = undefined;

    if (this._stopTimeout !== undefined) {
      clearTimeout(this._stopTimeout);
      this._stopTimeout = undefined;
    }

    this._audioEngine.stopScheduledAudioNodes();
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

    const currentTime = this._audioEngine.currentTime;
    if (currentTime === undefined) {
      throw Error("Audio context is not initialized");
    }

    const elapsedPlaybackSeconds = Math.max(
      0,
      currentTime - this._scheduler.scheduleBase
    );
    const nextLoopStartOffset = this._scheduler.nextLoopStartOffsetAfter(
      elapsedPlaybackSeconds
    );
    if (!this._scheduler.isLooped && nextLoopStartOffset !== undefined) {
      const loopStartTime = this._scheduler.scheduleBase + nextLoopStartOffset;
      this._cursorCoordinator.truncateFrom(loopStartTime);
      this._audioEngine.stopAudioFrom(loopStartTime);
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
        PlaybackErrorCode.Scheduling,
        "Failed to schedule playback"
      );
    }
  }

  /** Toggles loop mode. */
  public toggleLoop(): void {
    this._scheduler.toggleLoop();
    this.applyLiveLoopChange();
  }

  /** Sets a selection loop section and enables loop when needed. */
  public setSelectionLoopSection(startBeat: Beat, endBeat: Beat): void {
    this._scheduler.setSelectionLoopSection(startBeat, endBeat);
    this.applyLiveLoopChange();
  }

  /** Clears the selection loop section and restores loop if selection enabled it. */
  public clearSelectionLoopSection(): void {
    const loopModeChanged = this._scheduler.clearSelectionLoopSection();
    if (!loopModeChanged) {
      return;
    }

    this.applyLiveLoopChange();
  }

  /** Retargets cursor ownership to a newly selected notation track. */
  public setActiveTrack(track: Track): void {
    if (!this.score.tracks.includes(track)) {
      throw Error("Track is not part of this score");
    }

    const currentTime = this._isPlaying
      ? this._audioEngine.currentTime
      : undefined;
    this._cursorCoordinator.setActiveTrack(
      track,
      currentTime,
      this._playbackRunId
    );
  }

  /** Resolves the current buffered cursor beat for a track without retargeting. */
  public getCurrentBeatForTrack(track: Track): Beat | undefined {
    const currentTime = this._audioEngine.currentTime;
    if (
      !this.score.tracks.includes(track) ||
      !this._isPlaying ||
      currentTime === undefined
    ) {
      return undefined;
    }

    return this._cursorCoordinator.getCurrentBeatForTrack(track, currentTime);
  }

  /** Applies current track playback-control state to already scheduled audio. */
  public syncTrackPlaybackState(): void {
    this._audioEngine.applyTrackControls();
  }

  /** Applies score-wide playback controls to already scheduled audio. */
  public syncMasterPlaybackState(): void {
    this._audioEngine.applyMasterControls();
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
    this._audioEngine.dispose();
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
    return this._cursorCoordinator.lastStartedBeat;
  }

  /** Beat used as the origin for playback navigation commands. */
  public get playbackAnchorBeat(): Beat | undefined {
    return this._cursorCoordinator.playbackAnchorBeat;
  }

  /** Current Web Audio clock time used by playback cursor animation. */
  public get currentTime(): number | undefined {
    return this._audioEngine.currentTime;
  }

  /** Current playback generation used to invalidate stale cursor animation. */
  public get playbackRunId(): number {
    return this._playbackRunId;
  }
}
