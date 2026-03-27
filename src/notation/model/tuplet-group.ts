import { randomInt } from "@/shared";
import { MusicInstrument } from "./instrument/instrument";
import { BeatJSON, Beat } from "./beat";

/**
 * Tuplet beat JSON format
 */
export interface BarTupletBeatJSON {
  actualBeat: BeatJSON;
  calculatedDuration: number;
}

/**
 * Tuplet beat type
 */
export type BarTupletBeat<I extends MusicInstrument = MusicInstrument> = {
  actualBeat: Beat<I>;
  calculatedDuration: number;
};

/**
 * Tuplet group JSON format
 */
export interface BarTupletGroupJSON {
  beats: BarTupletBeatJSON[];
  complete: boolean;
  isStandard: boolean;
  normalCount: number;
  tupletCount: number;
}

/**
 * Class that represents a tuplet group inside a bar
 */
export class BarTupletGroup<I extends MusicInstrument = MusicInstrument> {
  /** Tuplet group's unique identifier */
  readonly uuid: number;
  /** Array of all beats in the bar */
  readonly beats: BarTupletBeat<I>[];
  /** True if beats 'fill' the tuplet group */
  readonly complete: boolean;
  /** True if normal count = tuplet count + 1 (3:2, 4:3, 5:4 etc) */
  readonly isStandard: boolean;
  /** "normalCount" many notes are equal "tupletCount" beats */
  readonly normalCount: number;
  /** "normalCount" many notes are equal "tupletCount" beats */
  readonly tupletCount: number;

  /**
   * Class that represents a tuplet group inside a bar
   * @param beats Tuplet group beats
   * @param normalCount Normal count
   * @param tupletCount Tuplet count
   */
  constructor(beats: Beat<I>[], normalCount: number, tupletCount: number) {
    this.uuid = randomInt();
    this.normalCount = normalCount;
    this.tupletCount = tupletCount;

    this.beats = [];
    for (const beat of beats) {
      const factor = this.tupletCount / this.normalCount;
      const calculatedDuration = beat.fullDuration * factor;
      this.beats.push({
        actualBeat: beat,
        calculatedDuration: calculatedDuration,
      });
    }

    this.complete = this.beats.length === normalCount;
    this.isStandard = this.normalCount === this.tupletCount + 1;
  }

  /**
   * Creates current tuplet group's deep copy
   * @returns Current tuplet group's deep copy
   */
  public deepCopy(): BarTupletGroup {
    const actualBeats = this.beats.map((b) => b.actualBeat);
    const copy = new BarTupletGroup(
      actualBeats,
      this.normalCount,
      this.tupletCount
    );
    return copy;
  }

  /**
   * Returns current tuplet group JSON
   * @returns Current tuplet group JSON
   */
  public toJSON(): BarTupletGroupJSON {
    const beatsJSON: BarTupletBeatJSON[] = [];
    for (const beat of this.beats) {
      beatsJSON.push({
        actualBeat: beat.actualBeat.toJSON(),
        calculatedDuration: beat.calculatedDuration,
      });
    }

    return {
      beats: beatsJSON,
      complete: this.complete,
      isStandard: this.isStandard,
      normalCount: this.normalCount,
      tupletCount: this.tupletCount,
    };
  }
}
