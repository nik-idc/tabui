/**
 * Musical notes
 */
export declare enum NoteValue {
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
    None = ""
}
export declare const NotesArr: NoteValue[];
export declare const NoteValuesArr: NoteValue[];
export declare const NOTES_PER_OCTAVE: number;
export declare const LOWEST_OCTAVE = 1;
export declare const HIGHEST_OCTAVE = 7;
export declare class Note {
    private _noteValue;
    private _octave?;
    constructor(noteValue: NoteValue, octave?: number);
    private transpose;
    raiseNote(semitones: number): void;
    lowerNote(semitones: number): void;
    get noteValue(): NoteValue;
    get octave(): number | undefined;
    get noteStr(): string;
}
