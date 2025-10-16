/**
 * Musical notes
 */
export var NoteValue;
(function (NoteValue) {
    NoteValue["A"] = "A";
    NoteValue["ASharp"] = "A#";
    NoteValue["B"] = "B";
    NoteValue["C"] = "C";
    NoteValue["CSharp"] = "C#";
    NoteValue["D"] = "D";
    NoteValue["DSharp"] = "D#";
    NoteValue["E"] = "E";
    NoteValue["F"] = "F";
    NoteValue["FSharp"] = "F#";
    NoteValue["G"] = "G";
    NoteValue["GSharp"] = "G#";
    NoteValue["Dead"] = "X";
    NoteValue["None"] = "";
})(NoteValue || (NoteValue = {}));
export const NotesArr = [
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
export const NoteValuesArr = [
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
export const LOWEST_OCTAVE = 1;
export const HIGHEST_OCTAVE = 7;
export class Note {
    _noteValue;
    _octave;
    constructor(noteValue, octave) {
        if (!NoteValuesArr.includes(noteValue)) {
            throw Error(`Invalid note value. Note value - ${noteValue}`);
        }
        if (octave !== undefined &&
            (octave < LOWEST_OCTAVE || octave > HIGHEST_OCTAVE)) {
            throw Error(`Invalid octave. Provided octave - ${octave}`);
        }
        if (noteValue !== NoteValue.None &&
            noteValue !== NoteValue.Dead &&
            octave === undefined) {
            throw Error("Octave not provided for a playable note");
        }
        if ((noteValue === NoteValue.None || noteValue === NoteValue.Dead) &&
            octave !== undefined) {
            throw Error("Octave provided for an unplayable note");
        }
        this._noteValue = noteValue;
        this._octave = octave;
    }
    transpose(semitones) {
        if (this._octave === undefined) {
            throw Error("Attempted to transpose a non-transposable note");
        }
        const currentIndex = NotesArr.indexOf(this._noteValue);
        const totalSemitones = this._octave * NOTES_PER_OCTAVE + currentIndex + semitones;
        const newOctave = Math.floor(totalSemitones / NOTES_PER_OCTAVE);
        const newIndex = ((totalSemitones % NOTES_PER_OCTAVE) + NOTES_PER_OCTAVE) %
            NOTES_PER_OCTAVE;
        if (newOctave < LOWEST_OCTAVE || newOctave > HIGHEST_OCTAVE) {
            throw new Error("Octave out of range");
        }
        this._noteValue = NotesArr[newIndex];
        this._octave = newOctave;
    }
    raiseNote(semitones) {
        this.transpose(semitones);
    }
    lowerNote(semitones) {
        this.transpose(-semitones);
    }
    get noteValue() {
        return this._noteValue;
    }
    get octave() {
        return this._octave;
    }
    get noteStr() {
        if (this._noteValue === NoteValue.None ||
            this._noteValue === NoteValue.Dead) {
            return "";
        }
        return `${this._noteValue}${this._octave}`;
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
//# sourceMappingURL=note.js.map