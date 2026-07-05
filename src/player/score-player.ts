import { Score, Beat, Track } from "../notation/model";
import { trackEvent, TrackEventType } from "@/shared/events";
import { ResolvedPlaybackConfig } from "@/config/tabui-config";
import { PlaybackScheduler } from "./playback-scheduler";

/** Seconds of score material to keep scheduled ahead of playback. */
const LOOKAHEAD_SECONDS = 5;
/** Interval in milliseconds for rolling lookahead scheduling. */
const LOOKAHEAD_INTERVAL_MS = 50;

export interface PlaybackOptions {
  /** Beat to start playback from. */
  startBeat?: Beat;
  /** Ignore an already-open repeat when playback starts inside it. */
  skipOpenRepeatAtStart?: boolean;
  /** Loop section start beat. */
  loopStartBeat?: Beat;
  /** Loop section end beat. */
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
  private _scheduledUiTimeouts: Set<ReturnType<typeof setTimeout>>;
  /** Stop timeout for natural playback end. */
  private _stopTimeout?: ReturnType<typeof setTimeout>;

  /** UUID of the currently rendered track. */
  private _activeTrackUUID: number;
  /** UUID of the active staff used to avoid duplicate beat-change events. */
  private _activeStaffUUID: number;
  /** Current beat on the active rendered track. */
  private _currentBeat?: Beat;
  /** Indicates if playback is active or starting. */
  private _isPlaying: boolean = false;
  /** Monotonic playback generation used to ignore stale async start completions. */
  private _playbackRunId: number = 0;

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
    this._currentScheduleBase = 0;
    this._scheduledUiTimeouts = new Set();

    this.score = score;
    this._scheduler = new PlaybackScheduler({
      score: this.score,
      playbackConfig,
    });
    this._activeTrackUUID = activeTrack.uuid;
    this._activeStaffUUID = activeTrack.staves[0].uuid;
  }

  /** Ensures audio context exists before playback starts. */
  private ensureAudioContext(): void {
    if (this._audioContext !== undefined) {
      return;
    }

    this._audioContext = new AudioContext();
    this._scheduler.setAudioContext(this._audioContext);
  }

  /** Resets rolling scheduling state for a fresh playback run. */
  private resetSchedulingState(): void {
    this._currentScheduleBase = 0;
    this._currentBeat = undefined;
    this._scheduler.reset();
  }

  /** Emits a playback state change signal for UI consumers. */
  private emitPlaybackStateChanged(): void {
    trackEvent.emit(TrackEventType.PlayerStateChanged, {});
  }

  /**
   * Handles one scheduled beat-change result from PlaybackScheduler.
   * @param beat Beat whose cursor should become active
   * @param startTime Absolute audio context time when the beat starts
   */
  private handleScheduledBeatChange(beat: Beat, startTime: number): void {
    if (
      beat.voiceBar.bar.staff.track.uuid !== this._activeTrackUUID ||
      beat.voiceBar.bar.staff.uuid !== this._activeStaffUUID
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
    for (const beatChange of result.beatChanges) {
      this.handleScheduledBeatChange(beatChange.beat, beatChange.startTime);
    }
    if (result.playbackComplete) {
      this.handleNaturalPlaybackComplete();
    }
  }

  /** Starts rolling score scheduling for the current playback run. */
  private scheduleScore(): void {
    this._isPlaying = true;
    this.emitPlaybackStateChanged();
    if (this._audioContext === undefined) {
      throw Error("Playback scheduler is not initialized");
    }

    this._currentScheduleBase = this._audioContext.currentTime + 0.05;
    this._scheduler.setScheduleBase(this._currentScheduleBase);

    clearInterval(this._schedulerInterval);
    this.scheduleLookahead();
    this._schedulerInterval = setInterval(() => {
      this.scheduleLookahead();
    }, LOOKAHEAD_INTERVAL_MS);
  }

  /**
   * Starts playback from the specified options/current state.
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

    await this._scheduler.loadSamples();

    if (playbackRunId !== this._playbackRunId) {
      return;
    }

    this.resetSchedulingState();
    this._scheduler.setPlaybackRange({
      startBeat: options.startBeat,
      endBeat: options.loopEndBeat,
    });

    if (options.startBeat) {
      this._activeStaffUUID = options.startBeat.voiceBar.bar.staff.uuid;
    }

    this.scheduleScore();
  }

  /**
   * Clears scheduled playback work without changing playback generation.
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

  /** Toggles loop mode. */
  public toggleLoop(): void {
    this._scheduler.toggleLoop();
  }

  /** Enables loop mode. */
  public enableLoop(): void {
    this._scheduler.enableLoop();
  }

  /** Disables loop mode. */
  public disableLoop(): void {
    this._scheduler.disableLoop();
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
    this.stop();

    if (this._audioContext !== undefined) {
      void this._audioContext.close();
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

  /** Current beat on the active rendered track. */
  public get currentBeat(): Beat | undefined {
    return this._currentBeat;
  }
}
