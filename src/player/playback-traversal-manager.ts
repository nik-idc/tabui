import {
  BarRepeatStatus,
  Beat,
  fractionLt,
  fractionLte,
  fractionToSeconds,
  Score,
  ticksToFraction,
  TimingFraction,
} from "@/notation/model";

const ZERO_FRACTION = { numerator: 0, denominator: 1 };

export interface PlaybackLoopSection {
  /** Loop start beat. */
  startBeat: Beat;
  /** Loop end beat. */
  endBeat: Beat;
}

interface PlaybackBoundary {
  /** Master bar index containing the playback clipping point. */
  masterBarIndex: number;
  /** Bar-local clipping offset represented as a whole-note fraction. */
  offset: TimingFraction;
}

/**
 * Owns score playback timeline traversal.
 * This class has no Web Audio responsibilities; it only answers which part of
 * the score should be scheduled next while honoring start/end boundaries,
 * repeats, and loop sections.
 */
export class PlaybackTraversalManager {
  /** Score whose master bars define the playback timeline. */
  readonly score: Score;

  /** First playable point, used to skip earlier beats in selected/loop playback. */
  private _playbackStartBoundary?: PlaybackBoundary;
  /** First non-playable point, used to stop selected/loop playback before score end. */
  private _playbackEndBoundary?: PlaybackBoundary;
  /** Indicates if playback should loop after the end boundary or score end. */
  private _isLooped: boolean;
  /** Selected loop section, if loop playback is bounded by selection. */
  private _loopSection?: PlaybackLoopSection;
  /** Active repeat section start index if traversal is inside a repeat. */
  private _repeatStartMasterBarIndex?: number;
  /** Completed repeat passes for the active repeat section. */
  private _repeatPassCount: number;

  /**
   * Owns score playback timeline traversal.
   * @param score Score whose master bars define the playback timeline
   */
  constructor(score: Score) {
    this.score = score;
    this._isLooped = false;
    this._repeatPassCount = 0;
  }

  /** Resets timeline traversal state for a fresh playback run. */
  public reset(): void {
    this._playbackStartBoundary = undefined;
    this._playbackEndBoundary = undefined;
    this._repeatStartMasterBarIndex = undefined;
    this._repeatPassCount = 0;
  }

  /**
   * Gets playback start boundary from the selected start beat or score start.
   * @param startBeat Selected start beat
   * @returns Playback start boundary
   */
  private getPlaybackStartBoundary(startBeat?: Beat): PlaybackBoundary {
    if (startBeat === undefined) {
      return {
        masterBarIndex: 0,
        offset: ZERO_FRACTION,
      };
    }

    return {
      masterBarIndex: this.score.masterBars.indexOf(
        startBeat.voiceBar.bar.masterBar
      ),
      offset: ticksToFraction(
        startBeat.startTick,
        startBeat.voiceBar.tickResolution
      ),
    };
  }

  /**
   * Gets playback end boundary from the selected end beat if any.
   * @param endBeat Selected end beat
   * @returns Playback end boundary, or undefined for score end
   */
  private getPlaybackEndBoundary(endBeat?: Beat): PlaybackBoundary | undefined {
    if (endBeat === undefined) {
      return undefined;
    }

    return {
      masterBarIndex: this.score.masterBars.indexOf(
        endBeat.voiceBar.bar.masterBar
      ),
      offset: ticksToFraction(endBeat.endTick, endBeat.voiceBar.tickResolution),
    };
  }

  /**
   * Sets traversal boundaries from the provided playback range.
   * @param startBeat Beat to start playback from
   * @param endBeat Beat to end playback at
   */
  public setPlaybackRange(startBeat?: Beat, endBeat?: Beat): void {
    this.reset();
    this._playbackStartBoundary = this.getPlaybackStartBoundary(
      this._isLooped && this._loopSection !== undefined
        ? this._loopSection.startBeat
        : startBeat
    );
    this._playbackEndBoundary =
      this._isLooped && this._loopSection !== undefined
        ? this.getPlaybackEndBoundary(this._loopSection.endBeat)
        : this.getPlaybackEndBoundary(endBeat);
  }

  /**
   * Gets the start offset in seconds for the current first playback bar.
   * @param masterBarIndex Master bar index
   * @returns Start offset in seconds
   */
  public getMasterBarStartOffsetSeconds(masterBarIndex: number): number {
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

  /**
   * Gets the end offset in seconds for the current last playback bar.
   * @param masterBarIndex Master bar index
   * @returns End offset in seconds
   */
  public getMasterBarEndOffsetSeconds(masterBarIndex: number): number {
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

  /**
   * Gets the scheduled playback duration for a master bar slice.
   * @param masterBarIndex Master bar index
   * @returns Master bar slice duration in seconds
   */
  public getMasterBarDurationSeconds(masterBarIndex: number): number {
    return (
      this.getMasterBarEndOffsetSeconds(masterBarIndex) -
      this.getMasterBarStartOffsetSeconds(masterBarIndex)
    );
  }

  /**
   * Indicates if a beat should be skipped because it is outside boundaries.
   * @param masterBarIndex Master bar index
   * @param beat Beat to check
   * @returns True if beat is outside the active playback boundaries
   */
  public beatOutsideBoundaries(masterBarIndex: number, beat: Beat): boolean {
    if (
      this._playbackStartBoundary !== undefined &&
      masterBarIndex === this._playbackStartBoundary.masterBarIndex
    ) {
      const beatStartOffset = ticksToFraction(
        beat.startTick,
        beat.voiceBar.tickResolution
      );
      if (fractionLt(beatStartOffset, this._playbackStartBoundary.offset)) {
        return true;
      }
    }

    if (
      this._playbackEndBoundary !== undefined &&
      masterBarIndex === this._playbackEndBoundary.masterBarIndex
    ) {
      const beatStartOffset = ticksToFraction(
        beat.startTick,
        beat.voiceBar.tickResolution
      );
      if (fractionLte(this._playbackEndBoundary.offset, beatStartOffset)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Indicates whether a repeat span is fully contained inside current playback.
   * @param repeatStartIndex Repeat start master bar index
   * @param repeatEndIndex Repeat end master bar index
   * @returns True if repeat should be honored in this playback run
   */
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
   * Gets the next master bar index in playback order honoring repeats.
   * @param currentMasterBarIndex Current master bar index
   * @returns Next master bar index, or null when playback should stop
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
      const isRepeatInsidePlayback = this.isRepeatInsidePlayback(
        this._repeatStartMasterBarIndex,
        currentMasterBarIndex
      );
      if (isRepeatInsidePlayback && this._repeatPassCount < repeatCount - 1) {
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
   * Advances timeline state after a master bar has been scheduled.
   * @param masterBarIndex Scheduled master bar index
   * @returns Next master bar index to schedule, or null when playback is done
   */
  public completeMasterBar(masterBarIndex: number): number | null {
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

    return this.getNextMasterBarIndex(masterBarIndex);
  }

  /**
   * Indicates if playback should naturally stop at the provided next index.
   * @param nextMasterBarIndex Next master bar index to schedule
   * @returns True if non-looped playback has reached the end
   */
  public playbackComplete(nextMasterBarIndex: number): boolean {
    return (
      !this._isLooped && nextMasterBarIndex >= this.score.masterBars.length
    );
  }

  /** Toggles loop mode. */
  public toggleLoop(): void {
    this._isLooped = !this._isLooped;
  }

  /** Enables loop mode. */
  public enableLoop(): void {
    this._isLooped = true;
  }

  /** Disables loop mode. */
  public disableLoop(): void {
    this._isLooped = false;
  }

  /** Clears currently selected loop section. */
  public clearLoopSection(): void {
    this._loopSection = undefined;
  }

  /**
   * Sets playback loop section.
   * @param startBeat Loop start beat
   * @param endBeat Loop end beat
   */
  public setLoopSection(startBeat: Beat, endBeat: Beat): void {
    this._loopSection = { startBeat, endBeat };
  }

  /** Indicates if loop mode is enabled. */
  public get isLooped(): boolean {
    return this._isLooped;
  }

  /** First master bar index to schedule for the current playback run. */
  public get firstMasterBarIndex(): number {
    return this._playbackStartBoundary?.masterBarIndex ?? 0;
  }
}
