import { Chord } from "./chord";
import { Guitar } from "./guitar";
import { Note, NotesCalcArr } from "./note";
import { randomInt } from "../misc/random-int";

/**
 * Class that represents a guitar note
 */
export class GuitarNote {
  /**
   * Guitar note's unique identifier
   */
  readonly uuid: number;
  /**
   * Guitar on which the note is played
   */
  readonly guitar: Guitar;
  /**
   * String number
   */
  private _stringNum: number = 0;
  /**
   * Fret number
   */
  private _fret: number | undefined;
  /**
   * Note value
   */
  private _note: Note;

  /**
   * Class that represents a guitar note
   * @param guitar Guitar on which the note is played
   * @param stringNum String number
   * @param fret Fret number
   */
  constructor(guitar: Guitar, stringNum: number, fret: number | undefined) {
    this.uuid = randomInt();
    this.guitar = guitar;
    this._stringNum = stringNum;
    this._fret = fret;
    this.calcNote();
  }

  /**
   * Getter/setter for string number
   */
  get stringNum(): number {
    return this._stringNum;
  }

  /**
   * Getter/setter for string number
   */
  set stringNum(val: number) {
    // Check string validity
    if (val <= 0 || val > this.guitar.stringsCount) {
      throw new Error(`${val} is an invalid string number, only strings
				1 to ${this.guitar.stringsCount} are allowed`);
    }

    this._stringNum = val;
    this.calcNote();
  }

  /**
   * Getter/setter for fret number
   */
  get fret(): number | undefined {
    return this._fret;
  }

  /**
   * Getter/setter for fret number
   */
  set fret(val: number | undefined) {
    // Undefined means no note
    if (val === undefined) {
      this._fret = undefined;
      this.calcNote();
      return;
    }

    if (typeof val === "number") {
      if (val < 0) {
        throw new Error("Negative numbers can't be fret values");
      }

      this._fret =
        val <= this.guitar.fretsCount ? val : val % this.guitar.fretsCount;
      this.calcNote();
    }
  }

  private calcNote(): void {
    if (this._fret === undefined) {
      this._note = Note.None;
      return;
    }

    if (typeof this._fret === "string") {
      this._note = Note.Dead;
      return;
    }

    const baseNote = this.guitar.tuning[this._stringNum - 1];
    const baseNoteId = NotesCalcArr.indexOf(baseNote);
    const noteId = baseNoteId + (this._fret % 12);
    const note = NotesCalcArr[noteId];

    this._note = note;
  }

  public deepCopy(): GuitarNote {
    return new GuitarNote(this.guitar, this._stringNum, this._fret);
  }

  /**
   * Note value of the current note
   */
  get note(): Note {
    return this._note;
  }

  static fromObject(obj: any): GuitarNote {
    if (obj.guitar === undefined || obj._stringNum === undefined) {
      throw new Error("Invalid js object to parse to guitar note");
    }

    let guitar = Guitar.fromObject(obj.guitar); // Parse guitar
    let guitarNote = new GuitarNote(guitar, obj._stringNum, obj._fret); // Create guitar note instance
    return guitarNote;
  }

  /**
   * Compares two guitar notes for equality (ignores uuid)
   * @param note1 Note 1
   * @param note2 Note 2
   * @returns True if equal (ignoring uuid)
   */
  static compare(note1: GuitarNote, note2: GuitarNote): boolean {
    return (
      note1._fret === note2._fret &&
      note1._note === note2._note &&
      note1._stringNum === note2._stringNum &&
      note1.guitar === note2.guitar
    );
  }
}
