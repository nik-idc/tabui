import { Bar } from "./bar";
import { Guitar } from "./guitar";
import { GuitarNote } from "./guitar-note";
import { NoteDuration } from "./note-duration";
import { randomInt } from "../misc/random-int";
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
   * Beat notes
   */
  readonly notes: GuitarNote[];

  /**
   * Class that represents a beat
   * @param guitar Guitar on which the beat is played
   * @param duration Note duration
   * @param notes Notes array
   */
  constructor(guitar: Guitar, duration: NoteDuration, notes?: GuitarNote[]) {
    this.uuid = randomInt();
    this.guitar = guitar;
    this.duration = duration;

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

  public deepCopy(): Beat {
    const beat = new Beat(this.guitar, this.duration);

    for (let i = 0; i < this.notes.length; i++) {
      beat.notes[i] = this.notes[i].deepCopy();
    }

    return beat;
  }

  /**
   * Parses a JSON object and returns a beat object
   * @param obj Beat object
   * @returns Parsed beat object
   */
  static fromObject(obj: any): Beat {
    if (
      obj.guitar === undefined ||
      obj.duration === undefined ||
      obj.notes === undefined
    ) {
      throw Error("Invalid js object to parse to beat");
    }

    const guitar = Guitar.fromObject(obj.guitar);

    const notes: GuitarNote[] = [];
    for (const note of obj.notes) {
      notes.push(GuitarNote.fromObject(note));
    }

    return new Beat(guitar, obj.duration, notes);
    // let beat = new Beat(guitar, obj._duration); // Craete beat instance
    // beat.notes.length = 0; // Delete default notes
    // obj.notes.forEach((note: any) =>
    //   beat.notes.push(GuitarNote.fromObject(note))
    // );
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
}
