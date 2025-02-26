import { Bar } from "./bar";
import { Guitar } from "./guitar";
import { GuitarNote } from "./guitar-note";
import { NoteDuration } from "./note-duration";
import { randomInt } from "../misc/random-int";
/**
 * Class that represents a chord
 */
export class Chord {
  /**
   * Chord's unique identifier
   */
  readonly uuid: number;
  /**
   * Guitar on which the chord is played
   */
  readonly guitar: Guitar;
  /**
   * Note duration
   */
  public duration: NoteDuration;
  /**
   * Chord notes
   */
  readonly notes: GuitarNote[];

  /**
   * Class that represents a chord
   * @param guitar Guitar on which the chord is played
   * @param duration Note duration
   */
  constructor(guitar: Guitar, duration: NoteDuration) {
    this.uuid = randomInt();
    this.guitar = guitar;
    this.duration = duration;
    this.notes = Array.from(
      { length: guitar.stringsCount },
      (_, stringNum) => new GuitarNote(this.guitar, stringNum + 1, undefined)
    );
  }

  public deepCopy(): Chord {
    const chord = new Chord(this.guitar, this.duration);

    for (let i = 0; i < this.notes.length; i++) {
      chord.notes[i] = this.notes[i].deepCopy();
    }

    return chord;
  }

  /**
   * Parses a JSON object and returns a chord object
   * @param obj Chord object
   * @returns Parsed chord object
   */
  static fromObject(obj: any): Chord {
    if (
      obj.guitar === undefined ||
      obj.duration === undefined ||
      obj.notes === undefined
    ) {
      throw Error("Invalid js object to parse to chord");
    }

    let guitar = Guitar.fromObject(obj.guitar); // Parse guitar
    let chord = new Chord(guitar, obj._duration); // Craete chord instance
    chord.notes.length = 0; // Delete default notes
    obj.notes.forEach((note: any) =>
      chord.notes.push(GuitarNote.fromObject(note))
    );
    return chord;
  }

  /**
   * Compares two chords for equality (ignores uuid)
   * @param chord1 Chord 1
   * @param chord2 Chord 2
   * @returns True if equal (ignoring uuid)
   */
  static compare(chord1: Chord, chord2: Chord): boolean {
    // Definitely not the same with different guitars/durations
    if (
      chord1.guitar !== chord2.guitar ||
      chord1.duration !== chord2.duration
    ) {
      return false;
    }

    // Compare notes
    for (let i = 0; i < chord1.guitar.stringsCount; i++) {
      if (!GuitarNote.compare(chord1.notes[i], chord2.notes[i])) {
        return false;
      }
    }

    // If all is the same then chords are equal
    return true;
  }
}
