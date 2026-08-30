import { randomInt } from "../../shared";
import { BarRepeatStatus, BarRepeatStatusChange } from "./bar-repeat-status";
import { NoteDuration } from "./note-duration";
import { getBaseDurationFraction, TimingFraction } from "./timing";

export type MasterBarData = {
  tempo: number;
  beatsCount: number;
  duration: NoteDuration;
  isRepeatStart: boolean;
  isRepeatEnd: boolean;
  repeatCount: number | null;
};

/** Lowest accepted tempo in BPM. Shared with serialization & UI. */
export const MIN_MASTER_BAR_TEMPO = 1;
/** Highest accepted tempo in BPM. Shared with serialization & UI. */
export const MAX_MASTER_BAR_TEMPO = 999;
/** Lowest accepted beats-per-measure numerator. Shared with serialization & UI. */
export const MIN_MASTER_BAR_BEATS_COUNT = 1;
/** Highest accepted beats-per-measure numerator. Shared with serialization & UI. */
export const MAX_MASTER_BAR_BEATS_COUNT = 32;
/** Lowest accepted repeat count. */
export const MIN_MASTER_BAR_REPEAT_COUNT = 2;
/** Highest accepted repeat count. */
export const MAX_MASTER_BAR_REPEAT_COUNT = 32;

export const DEFAULT_MASTER_BAR: MasterBarData = {
  tempo: 120,
  beatsCount: 4,
  duration: NoteDuration.Quarter,
  isRepeatStart: false,
  isRepeatEnd: false,
  repeatCount: null,
};

/**
 * Single source of truth of what's happening in a bar.
 * Each track's bars ALL have a reference to the respective master bar.
 * For example:
 * - Score
 * - - masterBars: 300 bars
 * - - tracks: 4 tracks (lead, rhythm, bass, drums)
 * - - - For each track 'track.bars[i]' contains a reference to 'masterBars[i]'
 */
export class MasterBar {
  /** Master bar's unqiue identifier */
  readonly uuid: number;

  /** Tempo of the bar */
  private _tempo: number = DEFAULT_MASTER_BAR.tempo;
  /** Number of beats for the bar */
  private _beatsCount: number = DEFAULT_MASTER_BAR.beatsCount;
  /** The duration of the note that constitutes a whole bar */
  private _duration: NoteDuration;
  /** Whether this bar starts a repeat section. */
  private _isRepeatStart: boolean;
  /** Whether this bar ends a repeat section. */
  private _isRepeatEnd: boolean;
  /** How many times a repeat section should repeat */
  private _repeatCount: number | null = null;

  /**
   * Single source of truth of what's happening at i-th bar
   * @param tempo Tempo
   * @param beatsCount Beast count
   * @param duration Bar duration
   * @param isRepeatStart Whether this bar starts a repeat section
   * @param isRepeatEnd Whether this bar ends a repeat section
   * @param repeatCount Repeat count (only when end of repeat section)
   */
  constructor({
    tempo = DEFAULT_MASTER_BAR.tempo,
    beatsCount = DEFAULT_MASTER_BAR.beatsCount,
    duration = DEFAULT_MASTER_BAR.duration,
    isRepeatStart = DEFAULT_MASTER_BAR.isRepeatStart,
    isRepeatEnd = DEFAULT_MASTER_BAR.isRepeatEnd,
    repeatCount = DEFAULT_MASTER_BAR.repeatCount,
  }: MasterBarData) {
    this.uuid = randomInt();

    this.tempo = tempo;
    this.beatsCount = beatsCount;
    this._duration = duration;
    this._isRepeatStart = isRepeatStart;
    this._isRepeatEnd = isRepeatEnd;
    this._repeatCount = isRepeatEnd
      ? (repeatCount ?? MIN_MASTER_BAR_REPEAT_COUNT)
      : null;
    if (isRepeatEnd) {
      this.validateRepeatCount(repeatCount ?? MIN_MASTER_BAR_REPEAT_COUNT);
    }
  }

  /** Tempo setter */
  public set tempo(newTempo: number) {
    if (
      !Number.isFinite(newTempo) ||
      newTempo < MIN_MASTER_BAR_TEMPO ||
      newTempo > MAX_MASTER_BAR_TEMPO
    ) {
      throw new Error(
        `Tempo ${newTempo} is outside ${MIN_MASTER_BAR_TEMPO}..${MAX_MASTER_BAR_TEMPO}`
      );
    }
    this._tempo = newTempo;
  }
  /** Tempo getter */
  public get tempo(): number {
    return this._tempo;
  }

  /** Beats count setter */
  public set beatsCount(newBeatsCount: number) {
    if (
      !Number.isInteger(newBeatsCount) ||
      newBeatsCount < MIN_MASTER_BAR_BEATS_COUNT ||
      newBeatsCount > MAX_MASTER_BAR_BEATS_COUNT
    ) {
      throw new Error(
        `Beats count ${newBeatsCount} is outside ${MIN_MASTER_BAR_BEATS_COUNT}..${MAX_MASTER_BAR_BEATS_COUNT}`
      );
    }
    this._beatsCount = newBeatsCount;
  }
  /** Beats count getter */
  public get beatsCount(): number {
    return this._beatsCount;
  }

  /** Duration setter */
  public set duration(newDuration: NoteDuration) {
    this._duration = newDuration;
  }
  /** Duration getter */
  public get duration(): NoteDuration {
    return this._duration;
  }

  /** Time signature numerator alias */
  public get timeSignatureNumerator(): number {
    return this._beatsCount;
  }

  /** Time signature denominator alias */
  public get timeSignatureDenominator(): NoteDuration {
    return this._duration;
  }

  /**
   * Adds or updates one repeat status on this bar.
   * @param change Bar repeat status change info:
   * - Status
   * - Enabled/disabled
   * - Repeat count (only if is repeat end)
   */
  public setRepeatStatus(change: BarRepeatStatusChange): void {
    const { status, enabled, repeatCount } = change;
    if (status === BarRepeatStatus.Start && repeatCount) {
      throw Error("Repeat start cannot have a repeat count");
    }

    if (repeatCount) {
      this.validateRepeatCount(repeatCount);
    }

    if (status === BarRepeatStatus.Start) {
      this._isRepeatStart = enabled;
    } else {
      this._isRepeatEnd = enabled;
      this._repeatCount = enabled
        ? (repeatCount ?? MIN_MASTER_BAR_REPEAT_COUNT)
        : null;
    }
  }

  public isSelfContainedRepeat(): boolean {
    return this._isRepeatStart && this._isRepeatEnd;
  }

  /** Whether this bar starts a repeat section. */
  public get isRepeatStart(): boolean {
    return this._isRepeatStart;
  }
  /** Sets whether this bar starts a repeat section. */
  public set isRepeatStart(value: boolean) {
    this._isRepeatStart = value;
  }
  /** Whether this bar ends a repeat section. */
  public get isRepeatEnd(): boolean {
    return this._isRepeatEnd;
  }
  /** Sets whether this bar ends a repeat section. */
  public set isRepeatEnd(value: boolean) {
    this._isRepeatEnd = value;
    if (!value) {
      this._repeatCount = null;
    } else if (this._repeatCount === null) {
      this._repeatCount = MIN_MASTER_BAR_REPEAT_COUNT;
    }
  }
  /** Repeat count setter  */
  public set repeatCount(newCount: number) {
    if (!this._isRepeatEnd) {
      throw Error("Attempted to set repeat count of a non-repeat-end bar");
    }
    this.validateRepeatCount(newCount);
    this._repeatCount = newCount;
  }
  /** How many times a repeat section should repeat */
  public get repeatCount(): number | null {
    return this._repeatCount;
  }

  private validateRepeatCount(value: number): void {
    const isOutsideRange =
      !Number.isSafeInteger(value) ||
      value < MIN_MASTER_BAR_REPEAT_COUNT ||
      value > MAX_MASTER_BAR_REPEAT_COUNT;
    if (isOutsideRange) {
      const bounds =
        `${MIN_MASTER_BAR_REPEAT_COUNT}..` + `${MAX_MASTER_BAR_REPEAT_COUNT}`;
      throw Error(`Repeat count ${value} is outside ${bounds}`);
    }
  }

  /** Gets max duration of the bar */
  public get maxDuration() {
    return this._beatsCount * this._duration;
  }

  /**
   * Exact duration of this bar as a fraction of a whole note.
   * E.g. 3/4 -> 3/4, 6/8 -> 3/4.
   */
  public get barDurationFraction(): TimingFraction {
    const beatUnit = getBaseDurationFraction(this._duration);

    return {
      numerator: beatUnit.numerator * this._beatsCount,
      denominator: beatUnit.denominator,
    };
  }

  /** Gets essential master bar data */
  public get barData(): MasterBarData {
    return {
      tempo: this._tempo,
      beatsCount: this._beatsCount,
      duration: this._duration,
      isRepeatStart: this._isRepeatStart,
      isRepeatEnd: this._isRepeatEnd,
      repeatCount: this._repeatCount,
    };
  }

  /**
   * Creates a deep copy of the master bar
   * @returns Deep copy of the master bar
   */
  public deepCopy(): MasterBar {
    return new MasterBar({
      tempo: this._tempo,
      beatsCount: this._beatsCount,
      duration: this._duration,
      isRepeatStart: this._isRepeatStart,
      isRepeatEnd: this._isRepeatEnd,
      repeatCount: this._repeatCount,
    });
  }
}
