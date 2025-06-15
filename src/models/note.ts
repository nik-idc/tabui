/**
 * Musical notes
 */
export enum NoteValue {
  A = "A",
  ASharp = "A#",
  B = "B",
  C = "C",
  CSharp = "C#",
  D = "D",
  DSharp = "D#",
  E = "E",
  F = "F",
  FSharp = "F#",
  G = "G",
  GSharp = "G#",
  Dead = "X",
  None = "",
}

export const NotesArr: NoteValue[] = [
  NoteValue.A,
  NoteValue.ASharp,
  NoteValue.B,
  NoteValue.C,
  NoteValue.CSharp,
  NoteValue.D,
  NoteValue.DSharp,
  NoteValue.E,
  NoteValue.F,
  NoteValue.FSharp,
  NoteValue.G,
  NoteValue.GSharp,
];

export const NoteValuesArr: NoteValue[] = [
  NoteValue.A,
  NoteValue.ASharp,
  NoteValue.B,
  NoteValue.C,
  NoteValue.CSharp,
  NoteValue.D,
  NoteValue.DSharp,
  NoteValue.E,
  NoteValue.F,
  NoteValue.FSharp,
  NoteValue.G,
  NoteValue.GSharp,
  NoteValue.Dead,
  NoteValue.None,
];

export const NOTES_PER_OCTAVE = NotesArr.length;
export const LOWEST_OCTAVE = 0;
export const HIGHEST_OCTAVE = 9;

export class Note {
  private _noteValue: NoteValue;
  private _octave?: number;

  constructor(noteValue: NoteValue, octave?: number) {
    if (!NoteValuesArr.includes(noteValue)) {
      throw Error(`Invalid note value. Note value - ${noteValue}`);
    }

    if (
      octave !== undefined &&
      (octave < LOWEST_OCTAVE || octave > HIGHEST_OCTAVE)
    ) {
      throw Error(`Invalid octave. Provided octave - ${octave}`);
    }

    if (
      noteValue !== NoteValue.None &&
      noteValue !== NoteValue.Dead &&
      octave === undefined
    ) {
      throw Error("Octave not provided for a playable note");
    }

    if (
      (noteValue === NoteValue.None || noteValue === NoteValue.Dead) &&
      octave !== undefined
    ) {
      throw Error("Octave provided for an unplayable note");
    }

    this._noteValue = noteValue;
    this._octave = octave;
  }

  private transpose(semitones: number): void {
    if (this._octave === undefined) {
      throw Error("Attempted to transpose a non-transposable note");
    }

    const currentIndex = NotesArr.indexOf(this._noteValue);
    const totalSemitones =
      this._octave * NOTES_PER_OCTAVE + currentIndex + semitones;

    const newOctave = Math.floor(totalSemitones / NOTES_PER_OCTAVE);
    const newIndex =
      ((totalSemitones % NOTES_PER_OCTAVE) + NOTES_PER_OCTAVE) %
      NOTES_PER_OCTAVE;

    if (newOctave < LOWEST_OCTAVE || newOctave > HIGHEST_OCTAVE) {
      throw new Error("Octave out of range");
    }

    this._noteValue = NotesArr[newIndex];
    this._octave = newOctave;
  }

  public raiseNote(semitones: number): void {
    this.transpose(semitones);
  }

  public lowerNote(semitones: number): void {
    this.transpose(-semitones);
  }

  public get noteValue(): NoteValue {
    return this._noteValue;
  }

  public get octave(): number | undefined {
    return this._octave;
  }

  public get noteStr(): string {
    if (
      this._noteValue === NoteValue.None ||
      this._noteValue === NoteValue.Dead
    ) {
      return "";
    }

    return `${this._noteValue}${this._octave}`;
  }

  /**
   * Parses note into simple object
   * @returns Simple parsed object
   */
  public toJSONObj(): Object {
    return {
      noteValue: this._noteValue,
      octave: this.octave,
    };
  }

  /**
   * Parses note into JSON string
   * @returns Parsed JSON string
   */
  public toJSON(): string {
    return JSON.stringify(this.toJSONObj());
  }
}

// /**
//  * Musical notes
//  */
// export enum NoteValue {
//   A = "A", // 1
//   ASharp = "A#", // 2
//   B = "B", // 3
//   C = "C", // 4
//   CSharp = "C#", // 5
//   D = "D", // 6
//   DSharp = "D#", // 7
//   E = "E", // 8
//   F = "F", // 9
//   FSharp = "F#", // 10
//   G = "G", // 11
//   GSharp = "G#", // 12
//   Dead = "X",
//   None = "",
// }

// /**
//  * Array of 2 octaves of notes ordered from A to G#
//  */
// export const NotesCalcArr = [
//   // First
//   NoteValue.A,
//   NoteValue.ASharp,
//   NoteValue.B,
//   NoteValue.C,
//   NoteValue.CSharp,
//   NoteValue.D,
//   NoteValue.DSharp,
//   NoteValue.E,
//   NoteValue.F,
//   NoteValue.FSharp,
//   NoteValue.G,
//   NoteValue.GSharp,
//   // Second
//   NoteValue.A,
//   NoteValue.ASharp,
//   NoteValue.B,
//   NoteValue.C,
//   NoteValue.CSharp,
//   NoteValue.D,
//   NoteValue.DSharp,
//   NoteValue.E,
//   NoteValue.F,
//   NoteValue.FSharp,
//   NoteValue.G,
//   NoteValue.GSharp,
// ];

// /**
//  * All possible note values as array
//  */
// export const NotesArr = [
//   NoteValue.A,
//   NoteValue.ASharp,
//   NoteValue.B,
//   NoteValue.C,
//   NoteValue.CSharp,
//   NoteValue.D,
//   NoteValue.DSharp,
//   NoteValue.E,
//   NoteValue.F,
//   NoteValue.FSharp,
//   NoteValue.G,
//   NoteValue.GSharp,
//   NoteValue.Dead,
//   NoteValue.None,
// ];

// const LOWEST_OCTAVE = 1;
// const HIGHEST_OCTAVE = 7;

// export class Note {
//   private _noteValue: NoteValue;
//   private _octave: number;

//   constructor(noteValue: NoteValue, octave: number) {
//     this._noteValue = noteValue;
//     this._octave = octave;
//   }

//   public raiseNote(semitones: number): void {
//     if (semitones <0 ) {
//       throw Error("Attempted to raise a note with a negative semitones value")
//     }

//     if (semitones === 0) {
//       return;
//     }

//     const resNoteNum = (NotesArr.indexOf(this._noteValue) + 1) + semitones;

//     if (resNoteNum > 12) {

//     }
//   }

//   public get noteValue(): NoteValue {
//     return this._noteValue;
//   }

//   public get noteStr(): string {
//     return `${this._noteValue}${this._octave}`
//   }
// }
