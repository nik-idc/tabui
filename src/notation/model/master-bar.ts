import { randomInt } from "../../shared";
import { BarRepeatStatus, BarRepeatStatusChange } from "./bar-repeat-status";
import { NoteDuration } from "./note-duration";
import { getBaseDurationFraction, TimingFraction } from "./timing";

/** Shared tempo, meter, and repeat settings for the same bar on all staves. */
export type MasterBarData = {
  /** Quarter-note tempo in BPM, finite and within 1–999. */
  tempo: number;
  /** Integer meter numerator, from 1 through 32. */
  beatsCount: number;
  /** Written beat unit, such as Quarter for a meter denominator of 4. */
  duration: NoteDuration;
  /** Whether the bar opens a repeat section. */
  isRepeatStart: boolean;
  /** Whether the bar closes a repeat section. */
  isRepeatEnd: boolean;
  /** Total section plays, 2–32 at a repeat end; null otherwise. */
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

/** Shared default settings: 120 BPM, 4/4, and no repeat boundaries. */
export const DEFAULT_MASTER_BAR: MasterBarData = {
  tempo: 120,
  beatsCount: 4,
  duration: NoteDuration.Quarter,
  isRepeatStart: false,
  isRepeatEnd: false,
  repeatCount: null,
};

/**
 * Shared tempo, meter, and repeats at one score position.
 * Each track's staff.bars[i] refers to score.masterBars[i].
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
   * Creates shared bar settings from a complete MasterBarData object.
   * At runtime, undefined fields use DEFAULT_MASTER_BAR values; the TypeScript input requires every field.
   * A repeat end defaults to two plays; other bars store a null count.
   * @throws If tempo, meter numerator, or an active repeat-end count is outside supported bounds.
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

  /**
   * Sets quarter-note BPM without rebuilding voice timing.
   * @throws If tempo is not finite or outside 1–999.
   */
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
  /** Quarter-note tempo in BPM. */
  public get tempo(): number {
    return this._tempo;
  }

  /**
   * Sets the meter numerator; rebuild affected voices afterward.
   * @throws If the count is not an integer from 1 through 32.
   */
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

  /** Sets the written meter beat unit without validation; rebuild affected voices afterward. */
  public set duration(newDuration: NoteDuration) {
    this._duration = newDuration;
  }
  /** Written meter beat unit in whole-note units, such as 0.25 for a quarter note. */
  public get duration(): NoteDuration {
    return this._duration;
  }

  /** Time signature numerator alias */
  public get timeSignatureNumerator(): number {
    return this._beatsCount;
  }

  /** Meter beat unit in whole-note units, not the printed integer denominator (0.25 means 4). */
  public get timeSignatureDenominator(): NoteDuration {
    return this._duration;
  }

  /**
   * Adds or updates one repeat status on this bar.
   * @param change Boundary, enabled state, and optional total play count for an end; omitted count defaults to two.
   * @throws If a truthy count is supplied for a start or a supplied truthy count is not an integer from 2 through 32.
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

  /** True when this bar both starts and ends a repeat section. */
  public isSelfContainedRepeat(): boolean {
    return this._isRepeatStart && this._isRepeatEnd;
  }

  /**
   * Checks the time signature data equality between this and another bar
   * @param otherBar - Other bar
   * @returns Time signature comparison result
   */
  public isEqualTimeSig(otherBar: MasterBar): boolean {
    return (
      this._beatsCount === otherBar.beatsCount &&
      this._duration === otherBar.duration
    );
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
  /** Enables a repeat end with two plays if no count exists; disabling clears the count to null. */
  public set isRepeatEnd(value: boolean) {
    this._isRepeatEnd = value;
    if (!value) {
      this._repeatCount = null;
    } else if (this._repeatCount === null) {
      this._repeatCount = MIN_MASTER_BAR_REPEAT_COUNT;
    }
  }
  /**
   * Sets the total number of plays of the repeat section.
   * @throws If this is not a repeat end or the count is not an integer from 2 through 32.
   */
  public set repeatCount(newCount: number) {
    if (!this._isRepeatEnd) {
      throw Error("Attempted to set repeat count of a non-repeat-end bar");
    }
    this.validateRepeatCount(newCount);
    this._repeatCount = newCount;
  }
  /** Total section plays at a repeat end, or null otherwise. */
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

  /** Meter duration in whole-note units. */
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

  /** Returns a new settings object; modifying it does not change this master bar. */
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
   * Creates an independent master bar with the same settings and a new UUID.
   * @throws If stored settings are outside supported bounds.
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
