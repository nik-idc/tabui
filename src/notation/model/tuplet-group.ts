import { randomInt } from "../../shared";
import { MusicInstrument } from "./instrument/instrument";
import { Beat } from "./beat";

/**
 * Class that represents a tuplet group inside a bar
 */
export class BarTupletGroup<I extends MusicInstrument = MusicInstrument> {
  /** Tuplet group's unique identifier */
  readonly uuid: number;
  /** Tuplet group's beats */
  readonly beats: Beat<I>[];
  /** True if beats 'fill' the tuplet group */
  readonly complete: boolean;
  /** True if normal count = tuplet count + 1 (3:2, 4:3, 5:4 etc) */
  readonly isStandard: boolean;
  /** "normalCount" many notes are equal "tupletCount" beats */
  readonly normalCount: number;
  /** "normalCount" many notes are equal "tupletCount" beats */
  readonly tupletCount: number;

  /**
   * Groups live beats without copying them or rebuilding their timing.
   * @param beats Retained live array from one voice; complete when its length equals normalCount.
   * @param normalCount Number of written notes in a complete group (3 for triplets).
   * @param tupletCount Number of ordinary beat units they occupy (2 for triplets).
   */
  constructor(beats: Beat<I>[], normalCount: number, tupletCount: number) {
    this.uuid = randomInt();
    this.normalCount = normalCount;
    this.tupletCount = tupletCount;

    this.beats = beats;

    this.complete = this.beats.length === normalCount;
    this.isStandard = this.normalCount === this.tupletCount + 1;
  }

  /**
   * Returns the beat's played duration in whole-note units, including dots and tuplets.
   * @param index Zero-based position in this group's beat array.
   * @throws If the index is absent or the beat's rhythm fraction is invalid.
   */
  public getCalculatedDurationAt(index: number): number {
    const beat = this.beats[index];
    if (beat === undefined) {
      throw new Error(`Tuplet beat at index ${index} does not exist`);
    }

    // NOTE: Historical name kept for compatibility. This now returns the
    // beat's already-calculated full played duration.
    return beat.fullDuration;
  }

  /**
   * Returns the beat's last rebuilt played duration in its owning voice's bar-local ticks.
   * @param index Zero-based position in this group's beat array.
   * @throws If the index is absent.
   */
  public getDurationTicksAt(index: number): number {
    const beat = this.beats[index];
    if (beat === undefined) {
      throw new Error(`Tuplet beat at index ${index} does not exist`);
    }

    // NOTE: Historical name kept for compatibility. This now returns the
    // beat's already-calculated full played duration in ticks.
    return beat.fullDurationTicks;
  }

  /**
   * Creates a group with a new UUID and array, sharing the original beat references and their owners.
   */
  public deepCopy(): BarTupletGroup {
    const copy = new BarTupletGroup(
      [...this.beats],
      this.normalCount,
      this.tupletCount
    );
    return copy;
  }

  /** Tuplet start in bar-local ticks */
  public get startTick(): number {
    const firstBeat = this.beats[0];
    return firstBeat?.startTick ?? 0;
  }

  /** Tuplet end in bar-local ticks */
  public get endTick(): number {
    const lastBeat = this.beats[this.beats.length - 1];
    return lastBeat?.endTick ?? 0;
  }

  /** Total tuplet span in bar-local ticks */
  public get totalTicks(): number {
    return this.endTick - this.startTick;
  }
}
