import { randomInt } from "@/shared";
import { NoteDuration } from "./note-duration";
import { BarRepeatStatus } from "./bar-repeat-status";

export type MasterBarData = {
  tempo: number;
  beatsCount: number;
  duration: NoteDuration;
  repeatStatus: BarRepeatStatus;
  repeatCount: number | null;
};

export const DEFAULT_MASTER_BAR: MasterBarData = {
  tempo: 120,
  beatsCount: 4,
  duration: NoteDuration.Quarter,
  repeatStatus: BarRepeatStatus.None,
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
  private _tempo: number;
  /** Number of beats for the bar */
  private _beatsCount: number;
  /** The duration of the note that constitutes a whole bar */
  private _duration: NoteDuration;
  /** Whether this bar is a repeat start, repeat end or a regular bar */
  private _repeatStatus: BarRepeatStatus;
  /** How many times a repeat section should repeat */
  private _repeatCount: number | null = null;

  /**
   * Single source of truth of what's happening at i-th bar
   * @param tempo Tempo
   * @param beatsCount Beast count
   * @param duration Bar duration
   * @param repeatStatus Repeat status
   * @param repeatCount Repeat count (only when end of repeat section)
   */
  constructor({
    tempo = 120,
    beatsCount = 4,
    duration = NoteDuration.Quarter,
    repeatStatus = BarRepeatStatus.None,
    repeatCount = null,
  }: MasterBarData) {
    this.uuid = randomInt();

    this._tempo = tempo;
    this._beatsCount = beatsCount;
    this._duration = duration;
    this._repeatStatus = repeatStatus;
    this._repeatCount = repeatCount;
  }

  /** Tempo setter */
  public set tempo(newTempo: number) {
    this._tempo = newTempo;
  }
  /** Tempo getter */
  public get tempo(): number {
    return this._tempo;
  }

  /** Beats count setter */
  public set beatsCount(newBeatsCount: number) {
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

  /** Repeat status setter */
  public set repeatStatus(newStatus: BarRepeatStatus) {
    this._repeatStatus =
      newStatus === this._repeatStatus ? BarRepeatStatus.None : newStatus;
    if (this._repeatStatus === BarRepeatStatus.End) {
      this._repeatCount = 2; // Default repeat count
    } else {
      this._repeatCount = null;
    }
  }
  /** Repeat status getter */
  public get repeatStatus(): BarRepeatStatus {
    return this._repeatStatus;
  }

  /** Repeat count setter  */
  public set repeatCount(newCount: number) {
    if (this._repeatStatus !== BarRepeatStatus.End) {
      throw Error("Attempted to set repeat count of a non-repeat-end bar");
    }
    this._repeatCount = newCount;
  }
  /** How many times a repeat section should repeat */
  public get repeatCount(): number | null {
    return this._repeatCount;
  }

  /** Gets max duration of the bar */
  public get maxDuration() {
    return this._beatsCount * this._duration;
  }

  /** Gets essential master bar data */
  public get barData(): MasterBarData {
    return {
      tempo: this._tempo,
      beatsCount: this._beatsCount,
      duration: this._duration,
      repeatStatus: this._repeatStatus,
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
      repeatStatus: this._repeatStatus,
      repeatCount: this._repeatCount,
    });
  }
}
