import { Bar } from "./bar";
import { Guitar } from "./guitar";
import { GuitarNote } from "./guitar-note";
import { NoteDuration } from "./note-duration";
import { randomInt } from "../misc/random-int";

export type TupletSettings = {
  normalCount: number;
  tupletCount: number;
};

/**
 * Class that represents a beat
 */
export class Beat {
  /**
   * Beat's unique identifier
   */
  readonly uuid: number;
  /**
   * Guitar on which the beat is played
   */
  readonly guitar: Guitar;
  /**
   * Note duration
   */
  public duration: NoteDuration;
  /**
   * Dots applied to the beat (0 = no dots, 1 = 1 dot, 2 = 2 dots)
   */
  private _dots: number;
  /**
   * Index of the beam group the beat belongs to (undefined if not in any group)
   */
  private _beamGroupId?: number;
  /**
   * Tuplet settings of the beat
   */
  private _tupletSettings?: TupletSettings;
  /**
   * True only if part of a beam group and is the last beat of that group
   */
  private _lastInBeamGroup: boolean;
  /**
   * Beat notes
   */
  readonly notes: GuitarNote[];

  /**
   * Class that represents a beat
   * @param guitar Guitar on which the beat is played
   * @param duration Note duration
   * @param notes Notes array
   * @param dots Number of dots to apply
   */
  constructor(
    guitar: Guitar,
    duration: NoteDuration,
    notes?: GuitarNote[],
    dots?: number
  ) {
    this.uuid = randomInt();
    this.guitar = guitar;
    this.duration = duration;
    this._dots = dots === undefined ? 0 : dots;
    this._lastInBeamGroup = false;

    if (notes !== undefined) {
      if (notes.length !== guitar.stringsCount) {
        throw Error(`Notes provided to a beat were not full: ${notes}`);
      }

      this.notes = notes;
    } else {
      this.notes = Array.from(
        { length: guitar.stringsCount },
        (_, stringNum) => new GuitarNote(this.guitar, stringNum + 1, undefined)
      );
    }
  }

  /**
   * Set beat's dot count (or reset it if setting the same dot)
   * @param newDots New dots value (can't be anything other than 0, 1 and 2)
   */
  public setDots(newDots: number): void {
    if (newDots !== 0 && newDots !== 1 && newDots !== 2) {
      throw Error(`${newDots} is an invalid dots value`);
    }

    this._dots = newDots === this._dots ? 0 : newDots;
  }

  public setBeamGroupId(newBeamGroupId: number | undefined): void {
    this._beamGroupId = newBeamGroupId;
    if (this._beamGroupId === undefined) {
      this._lastInBeamGroup = false;
    }
  }

  public setIsLastInBeamGroup(newIsLastInBeamGroup: boolean): void {
    this._lastInBeamGroup = newIsLastInBeamGroup;
  }

  /**
   * Sets (or unsets) tuplet settings
   * @param newSettings Tuplet settings (unsets tuplet if undefined)
   */
  public setTupletGroupSettings(newSettings?: TupletSettings): void {
    if (newSettings === undefined) {
      this._tupletSettings = undefined;
      return;
    }

    this._tupletSettings = {
      normalCount: newSettings.normalCount,
      tupletCount: newSettings.tupletCount,
    };
  }

  public deepCopy(): Beat {
    const beat = new Beat(this.guitar, this.duration);

    for (let i = 0; i < this.notes.length; i++) {
      beat.notes[i] = this.notes[i].deepCopy();
    }

    return beat;
  }

  /**
   * Parses beat into simple object
   * @returns Simple parsed object
   */
  public toJSONObj(): Object {
    const notesJSON = [];
    for (const note of this.notes) {
      notesJSON.push(note.toJSONObj());
    }

    return {
      duration: this.duration,
      notes: notesJSON,
    };
  }

  /**
   * Parses beat into JSON string
   * @returns Parsed JSON string
   */
  public toJSON(): string {
    return JSON.stringify(this.toJSONObj());
  }

  /**
   * Parses a JSON object and returns a beat object
   * @param guitar Guitar of the track
   * @param obj Beat object
   * @returns Parsed beat object
   */
  static fromJSON(guitar: Guitar, obj: any): Beat {
    if (obj.duration === undefined || obj.notes === undefined) {
      throw Error(
        `Invalid JSON to parse into beat, obj: ${JSON.stringify(obj)}`
      );
    }

    const notes: GuitarNote[] = [];
    for (let i = 1; i <= guitar.stringsCount; i++) {
      const note = obj.notes.find((n: any) => n?.stringNum === i);
      if (note === undefined) {
        notes.push(new GuitarNote(guitar, i, undefined));
      } else {
        notes.push(GuitarNote.fromJSON(guitar, note));
      }
    }

    return new Beat(guitar, obj.duration, notes);
  }

  /**
   * Compares two beats for equality (ignores uuid)
   * @param beat1 Beat 1
   * @param beat2 Beat 2
   * @returns True if equal (ignoring uuid)
   */
  static compare(beat1: Beat, beat2: Beat): boolean {
    // Definitely not the same with different guitars/durations
    if (beat1.guitar !== beat2.guitar || beat1.duration !== beat2.duration) {
      return false;
    }

    // Compare notes
    for (let i = 0; i < beat1.guitar.stringsCount; i++) {
      if (!GuitarNote.compare(beat1.notes[i], beat2.notes[i])) {
        return false;
      }
    }

    // If all is the same then beats are equal
    return true;
  }

  /**
   * Gets full duration taking applied dots into accounr
   * @returns
   */
  public getFullDuration(): number {
    let duration = this.duration;
    switch (this._dots) {
      case 0:
        duration = this.duration;
        break;
      case 1:
        duration = this.duration + this.duration / 2;
        break;
      case 2:
        duration = this.duration + this.duration / 2 + this.duration / 4;
        break;
      default:
        throw Error(`Beat dots value is not in [0, 1, 2] - ${this._dots}`);
        break;
    }

    if (this._tupletSettings !== undefined) {
      duration =
        duration *
        (this._tupletSettings.tupletCount / this._tupletSettings.normalCount);
    }

    return duration;
  }

  /**
   * Dots applied to the beat (0 = no dots, 1 = 1 dot, 2 = 2 dots)
   */
  public get dots(): number {
    return this._dots;
  }

  /**
   * Index of the beam group the beat belongs to (undefined if not in any group)
   */
  public get beamGroupId(): number | undefined {
    return this._beamGroupId;
  }

  /**
   * True only if part of a beam group and is the last beat of that group
   */
  public get lastInBeamGroup(): boolean {
    return this._lastInBeamGroup;
  }

  /**
   * UUID of the tuplet group the beat is part of. Undefined if not in a tuplet
   */
  public get tupletSettings(): TupletSettings | undefined {
    return this._tupletSettings;
  }
}
