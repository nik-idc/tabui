import { Bar, Beat, Score, ticksToSeconds } from "../notation/model";
import { PlaybackAudioEngine } from "./playback-audio-engine";
import { PlaybackTraversalManager } from "./playback-traversal-manager";

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
  private readonly _score: Score;
  /** Traversal manager for boundaries, repeats, and looping. */
  private readonly _traversalManager: PlaybackTraversalManager;
  /** Context-bound audio graph and note renderer. */
  private readonly _audioEngine: PlaybackAudioEngine;

  /** Absolute playback time in seconds scheduled so far. */
  private _scheduledPlaybackSeconds: number;
  /** Anchored value of AudioContext.currentTime for exact playback scheduling. */
  private _currentScheduleBase: number;
  /** Index of the next master bar to schedule. */
  private _nextMasterBarIndexToSchedule: number;
  /** Scheduled playback-second offsets where looped passes begin. */
  private _loopStartOffsets: number[];

  /**
   * Schedules score material for playback.
   * @param score Score whose material should be scheduled
   * @param audioEngine Audio renderer for scheduled beats
   */
  constructor(score: Score, audioEngine: PlaybackAudioEngine) {
    this._score = score;
    this._traversalManager = new PlaybackTraversalManager(score);
    this._audioEngine = audioEngine;

    this._scheduledPlaybackSeconds = 0;
    this._currentScheduleBase = 0;
    this._nextMasterBarIndexToSchedule = 0;
    this._loopStartOffsets = [];
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
  private scheduleBeat(beat: Beat): ScheduledBeatChange {
    const beatChange = this.createScheduledBeatChange(beat);
    this._audioEngine.scheduleBeat(
      beat,
      beatChange.startTime,
      beatChange.endTime,
      this.getPlaybackEndTime(beat)
    );
    return beatChange;
  }

  /**
   * Schedules a single staff bar for the current master bar pass.
   * @param masterBarIndex Master bar index being scheduled
   * @param bar Staff bar to schedule
   */
  private scheduleBar(masterBarIndex: number, bar: Bar): ScheduledBeatChange[] {
    const beatChanges: ScheduledBeatChange[] = [];
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

        beatChanges.push(this.scheduleBeat(beat));
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
        const bar = staff.bars[masterBarIndex];
        if (bar === undefined) {
          throw new Error(
            `PlaybackScheduler invariant violated: staff ${staff.uuid} has no bar at master bar index ${masterBarIndex}`
          );
        }
        beatChanges.push(...this.calculateBarBeatChanges(masterBarIndex, bar));
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
        if (bar === undefined) {
          throw new Error(
            `PlaybackScheduler invariant violated: staff ${staff.uuid} has no bar at master bar index ${masterBarIndex}`
          );
        }
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

  /** Absolute audio context time corresponding to playback zero. */
  public get scheduleBase(): number {
    return this._currentScheduleBase;
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

  /** Sets a selection loop section, enabling and resuming looping if needed. */
  public setSelectionLoopSection(startBeat: Beat, endBeat: Beat): void {
    const loopEnabled = this._traversalManager.setSelectionLoopSection(
      startBeat,
      endBeat
    );
    if (
      loopEnabled &&
      this._nextMasterBarIndexToSchedule >= this._score.masterBars.length
    ) {
      this.resumeLoopFromEnd();
    }
  }

  /** Clears a selection loop section and reports whether loop mode changed. */
  public clearSelectionLoopSection(): boolean {
    return this._traversalManager.clearSelectionLoopSection();
  }

  /** Indicates if loop mode is enabled. */
  public get isLooped(): boolean {
    return this._traversalManager.isLooped;
  }
}
