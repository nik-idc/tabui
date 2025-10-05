import { randomInt } from "../misc/random-int";
import { Beat } from "./beat";
import { Guitar } from "./guitar";
import { NoteDuration } from "./note-duration";

type TupletBeat = {
  actualBeat: Beat;
  calculatedDuration: number;
};

export class TupletGroup {
  /**
   * Tuplet group's unique identifier
   */
  readonly uuid: number;
  /**
   * Array of all beats in the bar
   */
  readonly beats: TupletBeat[];
  /**
   * True if beats 'fill' the tuplet group
   */
  readonly complete: boolean;
  /**
   * True if normal count = tuplet count + 1 (3:2, 4:3, 5:4 etc)
   */
  readonly isStandard: boolean;
  /**
   * "normalCount" many notes are equal "tupletCount" beats
   */
  readonly normalCount: number;
  /**
   * "normalCount" many notes are equal "tupletCount" beats
   */
  readonly tupletCount: number;

  constructor(beats: Beat[], normalCount: number, tupletCount: number) {
    this.uuid = randomInt();
    // this.beats = beats;
    this.normalCount = normalCount;
    this.tupletCount = tupletCount;

    this.beats = [];
    for (const beat of beats) {
      const factor = this.tupletCount / this.normalCount;
      const calculatedDuration = beat.getFullDuration() * factor;
      this.beats.push({
        actualBeat: beat,
        calculatedDuration: calculatedDuration,
      });
    }

    this.complete = this.beats.length === normalCount;
    this.isStandard = this.normalCount === this.tupletCount + 1;
  }

  public deepCopy(): TupletGroup {
    const actualBeats = this.beats.map((b) => b.actualBeat);
    const copy = new TupletGroup(
      actualBeats,
      this.normalCount,
      this.tupletCount
    );
    return copy;
  }
}
