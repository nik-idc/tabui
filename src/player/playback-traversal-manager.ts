import {
  BarRepeatStatus,
  Beat,
  fractionEq,
  fractionLt,
  fractionLte,
  fractionToSeconds,
  Score,
  ticksToFraction,
  TimingFraction,
} from "../notation/model";

const ZERO_FRACTION = { numerator: 0, denominator: 1 };

export interface PlaybackLoopSection {
  /** Loop start beat. */
  startBeat: Beat;
  /** Loop end beat. */
  endBeat: Beat;
}

export interface PlaybackTraversalResult {
  nextMasterBarIndex: number | null;
  loopRestarted: boolean;
  repeatJumped: boolean;
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

  /** Requested start retained to reject repeats that begin before it. */
  private _requestedStartBoundary?: PlaybackBoundary;
  /** Start applied until the first bar of the current playback pass completes. */
  private _pendingStartBoundary?: PlaybackBoundary;
  /** First non-playable point, used to stop selected/loop playback before score end. */
  private _playbackEndBoundary?: PlaybackBoundary;
  /** Indicates if playback should loop after the end boundary or score end. */
  private _isLooped: boolean;
  /** Selected loop section, if loop playback is bounded by selection. */
  private _loopSection?: PlaybackLoopSection;
  /** Whether selecting a section implicitly enabled loop mode. */
  private _selectionLoopEnabledBySelection: boolean;
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
    this._selectionLoopEnabledBySelection = false;
    this._repeatPassCount = 0;
  }

  /** Resets timeline traversal state for a fresh playback run. */
  public reset(): void {
    this._requestedStartBoundary = undefined;
    this._pendingStartBoundary = undefined;
    this._playbackEndBoundary = undefined;
    this.resetRepeatTraversal();
  }

  /** Resets notation-repeat traversal without changing playback boundaries. */
  public resetRepeatTraversal(): void {
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

  private boundaryBefore(
    boundary: PlaybackBoundary,
    otherBoundary: PlaybackBoundary
  ): boolean {
    if (boundary.masterBarIndex !== otherBoundary.masterBarIndex) {
      return boundary.masterBarIndex < otherBoundary.masterBarIndex;
    }
    return fractionLt(boundary.offset, otherBoundary.offset);
  }

  /**
   * Sets traversal boundaries from the provided playback range.
   * @param startBeat Beat to start playback from
   * @param endBeat Beat to end playback at
   */
  public setPlaybackRange(startBeat?: Beat, endBeat?: Beat): void {
    let loopSection = this._isLooped ? this._loopSection : undefined;
    if (startBeat !== undefined && loopSection !== undefined) {
      const startBoundary = this.getPlaybackStartBoundary(startBeat);
      const loopEndBoundary = this.getPlaybackEndBoundary(loopSection.endBeat);
      if (
        loopEndBoundary !== undefined &&
        !this.boundaryBefore(startBoundary, loopEndBoundary)
      ) {
        this._loopSection = undefined;
        loopSection = undefined;
      }
    }

    this.reset();
    this._pendingStartBoundary = this.getPlaybackStartBoundary(
      startBeat ?? loopSection?.startBeat
    );
    this._requestedStartBoundary = this._pendingStartBoundary;
    this._playbackEndBoundary =
      loopSection !== undefined
        ? this.getPlaybackEndBoundary(loopSection.endBeat)
        : this.getPlaybackEndBoundary(endBeat);
  }

  /**
   * Gets the start offset in seconds for the current first playback bar.
   * @param masterBarIndex Master bar index
   * @returns Start offset in seconds
   */
  public getMasterBarStartOffsetSeconds(masterBarIndex: number): number {
    if (
      this._pendingStartBoundary === undefined ||
      masterBarIndex !== this._pendingStartBoundary.masterBarIndex
    ) {
      return 0;
    }

    return fractionToSeconds(
      this._pendingStartBoundary.offset,
      this.score.masterBars[masterBarIndex].tempo
    );
  }

  /** Gets the bounded playback end offset for a master bar, if present. */
  public getPlaybackEndOffsetSeconds(
    masterBarIndex: number
  ): number | undefined {
    if (
      this._playbackEndBoundary === undefined ||
      masterBarIndex !== this._playbackEndBoundary.masterBarIndex
    ) {
      return undefined;
    }

    return fractionToSeconds(
      this._playbackEndBoundary.offset,
      this.score.masterBars[masterBarIndex].tempo
    );
  }

  /** Gets score-linear seconds from a master-bar slice start to playback end. */
  public getPlaybackEndDistanceSeconds(
    masterBarIndex: number
  ): number | undefined {
    const playbackEndBoundary = this._playbackEndBoundary;
    if (
      playbackEndBoundary === undefined ||
      masterBarIndex > playbackEndBoundary.masterBarIndex
    ) {
      return undefined;
    }

    const endBoundaryIndex = playbackEndBoundary.masterBarIndex;
    let distanceSeconds = 0;
    for (let i = masterBarIndex; i <= endBoundaryIndex; i++) {
      const startOffset =
        i === masterBarIndex ? this.getMasterBarStartOffsetSeconds(i) : 0;
      const endOffset =
        i === endBoundaryIndex
          ? fractionToSeconds(
              playbackEndBoundary.offset,
              this.score.masterBars[i].tempo
            )
          : fractionToSeconds(
              this.score.masterBars[i].barDurationFraction,
              this.score.masterBars[i].tempo
            );
      distanceSeconds += endOffset - startOffset;
    }
    return distanceSeconds;
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

    return (
      this.getPlaybackEndOffsetSeconds(masterBarIndex) ??
      fullMasterBarDurationSeconds
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
      this._pendingStartBoundary !== undefined &&
      masterBarIndex === this._pendingStartBoundary.masterBarIndex
    ) {
      const beatStartOffset = ticksToFraction(
        beat.startTick,
        beat.voiceBar.tickResolution
      );
      if (fractionLt(beatStartOffset, this._pendingStartBoundary.offset)) {
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
    const playbackStartBoundary = this._requestedStartBoundary;
    if (playbackStartBoundary !== undefined) {
      const repeatStartsInsidePlayback =
        repeatStartIndex > playbackStartBoundary.masterBarIndex ||
        (repeatStartIndex === playbackStartBoundary.masterBarIndex &&
          fractionEq(playbackStartBoundary.offset, ZERO_FRACTION));
      if (!repeatStartsInsidePlayback) {
        return false;
      }
    }

    const playbackEndBoundary = this._playbackEndBoundary;
    if (playbackEndBoundary !== undefined) {
      const repeatEndsInsidePlayback =
        repeatEndIndex < playbackEndBoundary.masterBarIndex ||
        (repeatEndIndex === playbackEndBoundary.masterBarIndex &&
          fractionEq(
            playbackEndBoundary.offset,
            this.score.masterBars[repeatEndIndex].barDurationFraction
          ));
      if (!repeatEndsInsidePlayback) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets the next master bar index in playback order honoring repeats.
   * @param currentMasterBarIndex Current master bar index
   * @returns Next master bar index, or null when playback should stop
   */
  private getNextMasterBar(
    currentMasterBarIndex: number,
    honorRepeatEnd: boolean = true
  ): PlaybackTraversalResult {
    const masterBar = this.score.masterBars[currentMasterBarIndex];

    if (
      masterBar.repeatStatus === BarRepeatStatus.Start &&
      this._repeatStartMasterBarIndex !== currentMasterBarIndex
    ) {
      this._repeatStartMasterBarIndex = currentMasterBarIndex;
      this._repeatPassCount = 0;
    }

    if (
      honorRepeatEnd &&
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
        return {
          nextMasterBarIndex: this._repeatStartMasterBarIndex,
          loopRestarted: false,
          repeatJumped: true,
        };
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
        this._pendingStartBoundary = this.getPlaybackStartBoundary(
          this._loopSection.startBeat
        );
      }
      return {
        nextMasterBarIndex: this._pendingStartBoundary?.masterBarIndex ?? 0,
        loopRestarted: true,
        repeatJumped: false,
      };
    }

    const nextMasterBarIndex = currentMasterBarIndex + 1;
    if (nextMasterBarIndex >= this.score.masterBars.length && this._isLooped) {
      this._pendingStartBoundary = this.getPlaybackStartBoundary();
      return {
        nextMasterBarIndex: 0,
        loopRestarted: true,
        repeatJumped: false,
      };
    }

    return {
      nextMasterBarIndex:
        nextMasterBarIndex < this.score.masterBars.length
          ? nextMasterBarIndex
          : null,
      loopRestarted: false,
      repeatJumped: false,
    };
  }

  /**
   * Advances timeline state after a master bar has been scheduled.
   * @param masterBarIndex Scheduled master bar index
   * @returns Next master bar index to schedule, or null when playback is done
   */
  public completeMasterBar(masterBarIndex: number): PlaybackTraversalResult {
    if (
      this._pendingStartBoundary !== undefined &&
      masterBarIndex === this._pendingStartBoundary.masterBarIndex
    ) {
      this._pendingStartBoundary = undefined;
    }
    const playbackEndBoundary = this._playbackEndBoundary;
    const reachedPlaybackEnd =
      playbackEndBoundary !== undefined &&
      masterBarIndex === playbackEndBoundary.masterBarIndex;
    const playbackEndReachesBarEnd =
      !reachedPlaybackEnd ||
      fractionEq(
        playbackEndBoundary.offset,
        this.score.masterBars[masterBarIndex].barDurationFraction
      );
    if (!playbackEndReachesBarEnd) {
      this.resetRepeatTraversal();
    }
    const traversalResult = this.getNextMasterBar(
      masterBarIndex,
      playbackEndReachesBarEnd
    );
    if (
      reachedPlaybackEnd &&
      !this._isLooped &&
      !traversalResult.repeatJumped
    ) {
      this._playbackEndBoundary = undefined;
      return {
        nextMasterBarIndex: null,
        loopRestarted: false,
        repeatJumped: false,
      };
    }

    return traversalResult;
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
    this._selectionLoopEnabledBySelection = false;
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

  /** Sets a selection section and reports whether it enabled loop mode. */
  public setSelectionLoopSection(startBeat: Beat, endBeat: Beat): boolean {
    this.setLoopSection(startBeat, endBeat);
    if (this._isLooped) {
      return false;
    }

    this._isLooped = true;
    this._selectionLoopEnabledBySelection = true;
    return true;
  }

  /** Clears a selection section and reports whether it disabled loop mode. */
  public clearSelectionLoopSection(): boolean {
    this.clearLoopSection();
    if (!this._selectionLoopEnabledBySelection) {
      return false;
    }

    this._isLooped = false;
    this._selectionLoopEnabledBySelection = false;
    return true;
  }

  /** Indicates if loop mode is enabled. */
  public get isLooped(): boolean {
    return this._isLooped;
  }

  /** First master bar index to schedule for the current playback run. */
  public get firstMasterBarIndex(): number {
    return this._pendingStartBoundary?.masterBarIndex ?? 0;
  }

  /** Restores traversal state for a newly scheduled loop pass. */
  public restartLoopTraversal(): number {
    this.resetRepeatTraversal();
    this._pendingStartBoundary = this.getPlaybackStartBoundary(
      this._loopSection?.startBeat
    );
    return this._pendingStartBoundary.masterBarIndex;
  }
}
