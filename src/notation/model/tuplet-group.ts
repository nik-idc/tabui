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
   * Class that represents a tuplet group inside a bar
   * @param beats Tuplet group beats
   * @param normalCount Normal count
   * @param tupletCount Tuplet count
   */
  constructor(beats: Beat<I>[], normalCount: number, tupletCount: number) {
    this.uuid = randomInt();
    this.normalCount = normalCount;
    this.tupletCount = tupletCount;

    this.beats = beats;

    this.complete = this.beats.length === normalCount;
    this.isStandard = this.normalCount === this.tupletCount + 1;
  }

  /** Gets calculated duration of a tuplet beat by index */
  public getCalculatedDurationAt(index: number): number {
    const beat = this.beats[index];
    if (beat === undefined) {
      throw new Error(`Tuplet beat at index ${index} does not exist`);
    }

    return beat.fullDuration * (this.tupletCount / this.normalCount);
  }

  /**
   * Creates current tuplet group's deep copy
   * @returns Current tuplet group's deep copy
   */
  public deepCopy(): BarTupletGroup {
    const copy = new BarTupletGroup(
      [...this.beats],
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
    for (let i = 0; i < this.beats.length; i++) {
      const beat = this.beats[i];
      beatsJSON.push({
        actualBeat: beat.toJSON(),
        calculatedDuration: this.getCalculatedDurationAt(i),
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
