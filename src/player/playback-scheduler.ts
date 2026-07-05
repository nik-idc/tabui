import { Bar, Beat, Score, ticksToSeconds } from "@/notation/model";
import { ResolvedPlaybackConfig } from "@/config/tabui-config";
import { PlaybackNoteScheduler } from "./playback-note-scheduler";
import { PlaybackSampleManager } from "./playback-sample-manager";
import { PlaybackTraversalManager } from "./playback-traversal-manager";
import { ScheduledAudioNode } from "./scheduled-audio-node";

export interface PlaybackSchedulerOptions {
  /** Score whose material should be scheduled. */
  score: Score;
  /** Playback sample configuration. */
  playbackConfig: ResolvedPlaybackConfig;
}

export interface PlaybackSchedulerRangeOptions {
  /** Beat to start playback from. */
  startBeat?: Beat;
  /** Beat to end playback at. */
  endBeat?: Beat;
}

export interface ScheduledBeatChange {
  /** Beat whose UI cursor should be activated. */
  beat: Beat;
  /** Absolute audio context time when the beat starts. */
  startTime: number;
}

export interface PlaybackScheduleResult {
  /** Beat-change UI events produced while scheduling score material. */
  beatChanges: ScheduledBeatChange[];
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
  /** Sample manager used to resolve configured samples by instrument preset. */
  private _sampleManager?: PlaybackSampleManager;
  /** Scheduler that creates Web Audio nodes for individual notes. */
  private _noteScheduler?: PlaybackNoteScheduler;

  /** Absolute playback time in seconds scheduled so far. */
  private _scheduledPlaybackSeconds: number;
  /** Anchored value of AudioContext.currentTime for exact playback scheduling. */
  private _currentScheduleBase: number;
  /** All currently scheduled audio nodes. */
  private _scheduledAudioNodes: Set<ScheduledAudioNode>;
  /** Index of the next master bar to schedule. */
  private _nextMasterBarIndexToSchedule: number;

  /**
   * Schedules score material for playback.
   * @param options Scheduler dependencies
   */
  constructor(options: PlaybackSchedulerOptions) {
    this._score = options.score;
    this._traversalManager = new PlaybackTraversalManager(options.score);
    this._playbackConfig = options.playbackConfig;

    this._scheduledPlaybackSeconds = 0;
    this._currentScheduleBase = 0;
    this._scheduledAudioNodes = new Set();
    this._nextMasterBarIndexToSchedule = 0;
  }

  /**
   * Sets the audio context used for sample loading and note scheduling.
   * @param audioContext Audio context used by sample and note schedulers
   */
  public setAudioContext(audioContext: AudioContext): void {
    this._sampleManager = new PlaybackSampleManager(
      audioContext,
      this._playbackConfig
    );
    this._noteScheduler = new PlaybackNoteScheduler(
      audioContext,
      this._sampleManager
    );
  }

  /** Clears audio-context-backed helpers after the audio context is closed. */
  public clearAudioContext(): void {
    this._sampleManager = undefined;
    this._noteScheduler = undefined;
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
    this._traversalManager.reset();
  }

  /**
   * Sets traversal boundaries for the next playback run.
   * @param options Playback range boundaries
   */
  public setPlaybackRange(options: PlaybackSchedulerRangeOptions): void {
    this._traversalManager.setPlaybackRange(options);
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
   * Schedules all playable notes in one beat and returns its duration.
   * @param beat Beat to schedule
   * @param barTimingOffsetSeconds Beat start offset from the current schedule base
   * @param beatChanges Accumulator for UI beat-change scheduling data
   * @returns Beat duration in seconds
   */
  private scheduleBeat(
    beat: Beat,
    barTimingOffsetSeconds: number,
    beatChanges: ScheduledBeatChange[]
  ): number {
    if (this._noteScheduler === undefined) {
      throw Error("Playback note scheduler is not initialized");
    }

    const beatDurationInSeconds = ticksToSeconds(
      beat.fullDurationTicks,
      beat.voiceBar.tickResolution,
      beat.voiceBar.bar.masterBar.tempo
    );
    const startTime = this._currentScheduleBase + barTimingOffsetSeconds;
    const stopTime = startTime + beatDurationInSeconds;

    beatChanges.push({ beat, startTime });

    for (const note of beat.notes ?? []) {
      const scheduledAudioNode = this._noteScheduler.scheduleNote(
        note,
        startTime,
        stopTime
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

    return beatDurationInSeconds;
  }

  /**
   * Schedules a single staff bar for the current master bar pass.
   * @param masterBarIndex Master bar index being scheduled
   * @param bar Staff bar to schedule
   * @param beatChanges Accumulator for UI beat-change scheduling data
   */
  private scheduleBar(
    masterBarIndex: number,
    bar: Bar,
    beatChanges: ScheduledBeatChange[]
  ): void {
    const masterBarStartOffsetSeconds =
      this._traversalManager.getMasterBarStartOffsetSeconds(masterBarIndex);
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

        const beatStartOffsetSeconds = ticksToSeconds(
          beat.startTick,
          voiceBar.tickResolution,
          bar.masterBar.tempo
        );
        this.scheduleBeat(
          beat,
          this._scheduledPlaybackSeconds +
            beatStartOffsetSeconds -
            masterBarStartOffsetSeconds,
          beatChanges
        );
      }
    }
  }

  /**
   * Schedules all track/staff bars for one master bar.
   * @param masterBarIndex Master bar index to schedule
   * @param beatChanges Accumulator for UI beat-change scheduling data
   */
  private scheduleMasterBar(
    masterBarIndex: number,
    beatChanges: ScheduledBeatChange[]
  ): void {
    const masterBarDurationSeconds =
      this._traversalManager.getMasterBarDurationSeconds(masterBarIndex);

    for (const track of this._score.tracks) {
      for (const staff of track.staves) {
        const bar = staff.bars[masterBarIndex];
        this.scheduleBar(masterBarIndex, bar, beatChanges);
      }
    }

    this._scheduledPlaybackSeconds += masterBarDurationSeconds;
    const nextMasterBarIndex =
      this._traversalManager.completeMasterBar(masterBarIndex);
    this._nextMasterBarIndexToSchedule =
      nextMasterBarIndex ?? this._score.masterBars.length;
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
      const masterBarDurationSeconds =
        this._traversalManager.getMasterBarDurationSeconds(masterBarIndex);

      if (
        this._scheduledPlaybackSeconds + masterBarDurationSeconds >
        lookaheadTargetSeconds
      ) {
        break;
      }

      this.scheduleMasterBar(masterBarIndex, beatChanges);
    }

    return {
      beatChanges,
      playbackComplete: this._traversalManager.playbackComplete(
        this._nextMasterBarIndexToSchedule
      ),
    };
  }

  /** Absolute playback time in seconds scheduled so far. */
  public get scheduledPlaybackSeconds(): number {
    return this._scheduledPlaybackSeconds;
  }

  /** Toggles loop mode. */
  public toggleLoop(): void {
    this._traversalManager.toggleLoop();
  }

  /** Enables loop mode. */
  public enableLoop(): void {
    this._traversalManager.enableLoop();
  }

  /** Disables loop mode. */
  public disableLoop(): void {
    this._traversalManager.disableLoop();
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
