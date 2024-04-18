import { Bar } from "./bar";
import { Guitar } from "./guitar";
import { GuitarNote } from "./guitar-note";
import { NoteDuration } from "./note-duration";

export class Chord {
  readonly guitar: Guitar;
  private _duration: NoteDuration;
  readonly notes: GuitarNote[];

  constructor(guitar: Guitar, duration: NoteDuration) {
    this.guitar = guitar;
    this._duration = duration;
    this.notes = [];
    for (let strNum = 1; strNum <= guitar.stringsCount; strNum++) {
      this.notes.push(new GuitarNote(this.guitar, strNum, null));
    }
  }

  static fromObject(obj: any): Chord {
    if (
      obj.guitar === undefined ||
      obj._duration === undefined ||
      obj.notes === undefined
    ) {
      throw new Error("Invalid js object to parse to chord");
    }

    let guitar = Guitar.fromObject(obj.guitar); // Parse guitar
    let chord = new Chord(guitar, obj._duration); // Craete chord instance
    chord.notes.length = 0; // Delete default notes
    obj.notes.forEach((note: any) =>
      chord.notes.push(GuitarNote.fromObject(note))
    ); // Parse notes
    return chord;
  }

  get duration(): NoteDuration {
    return this._duration;
  }

  set duration(duration: NoteDuration) {
    if (!Object.values(NoteDuration).includes(duration)) {
      throw new Error(`${duration} is an invalid note duration`);
    }

    this._duration = duration;
  }
}
