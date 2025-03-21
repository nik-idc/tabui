/**
 * Musical notes
 */
export enum Note {
  A = "A", // 1
  ASharp = "A#", // 2
  B = "B", // 3
  C = "C", // 4
  CSharp = "C#", // 5
  D = "D", // 6
  DSharp = "D#", // 7
  E = "E", // 8
  F = "F", // 9
  FSharp = "F#", // 10
  G = "G", // 11
  GSharp = "G#", // 12
  Dead = "X",
  None = "",
}

/**
 * Array of 2 octaves of notes ordered from A to G#
 */
export const NotesCalcArr = [
  // First
  Note.A,
  Note.ASharp,
  Note.B,
  Note.C,
  Note.CSharp,
  Note.D,
  Note.DSharp,
  Note.E,
  Note.F,
  Note.FSharp,
  Note.G,
  Note.GSharp,
  // Second
  Note.A,
  Note.ASharp,
  Note.B,
  Note.C,
  Note.CSharp,
  Note.D,
  Note.DSharp,
  Note.E,
  Note.F,
  Note.FSharp,
  Note.G,
  Note.GSharp,
];

/**
 * All possible note values as array
 */
export const NotesArr = [
  Note.A,
  Note.ASharp,
  Note.B,
  Note.C,
  Note.CSharp,
  Note.D,
  Note.DSharp,
  Note.E,
  Note.F,
  Note.FSharp,
  Note.G,
  Note.GSharp,
  Note.Dead,
  Note.None,
];
