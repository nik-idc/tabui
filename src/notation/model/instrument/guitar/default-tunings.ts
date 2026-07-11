import { NoteType, NoteValue } from "../../note";

type StringCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// Define allowed tuning names per string count
interface TuningsPerStringCount {
  1: "Standard";
  2: "Standard";
  3: "Standard";
  4: "BassStandard" | "UkuleleStandard";
  5: "BanjoStandard";
  6: "Standard" | "GuitarDropD";
  7: "Standard";
  8: "Standard";
  9: "Standard";
  10: "Standard";
  11: "Standard";
  12: "Standard";
}

// Strongly-typed tuning map
type DefaultTunings = {
  [K in StringCount]: Record<TuningsPerStringCount[K], NoteType[]>;
};

export const DEFAULT_TUNINGS: DefaultTunings = {
  1: {
    Standard: [{ noteValue: NoteValue.E, octave: 2 }],
  },
  2: {
    Standard: [
      { noteValue: NoteValue.B, octave: 2 },
      { noteValue: NoteValue.E, octave: 2 },
    ],
  },
  3: {
    Standard: [
      { noteValue: NoteValue.G, octave: 3 },
      { noteValue: NoteValue.B, octave: 2 },
      { noteValue: NoteValue.E, octave: 2 },
    ],
  },
  4: {
    BassStandard: [
      { noteValue: NoteValue.G, octave: 2 },
      { noteValue: NoteValue.D, octave: 2 },
      { noteValue: NoteValue.A, octave: 1 },
      { noteValue: NoteValue.E, octave: 1 },
    ],
    UkuleleStandard: [
      { noteValue: NoteValue.A, octave: 4 },
      { noteValue: NoteValue.E, octave: 4 },
      { noteValue: NoteValue.C, octave: 3 },
      { noteValue: NoteValue.G, octave: 4 },
    ],
  },
  5: {
    BanjoStandard: [
      { noteValue: NoteValue.D, octave: 4 },
      { noteValue: NoteValue.B, octave: 4 },
      { noteValue: NoteValue.G, octave: 3 },
      { noteValue: NoteValue.D, octave: 3 },
      { noteValue: NoteValue.G, octave: 3 },
    ],
  },
  6: {
    Standard: [
      { noteValue: NoteValue.E, octave: 4 },
      { noteValue: NoteValue.B, octave: 3 },
      { noteValue: NoteValue.G, octave: 3 },
      { noteValue: NoteValue.D, octave: 3 },
      { noteValue: NoteValue.A, octave: 2 },
      { noteValue: NoteValue.E, octave: 2 },
    ],
    GuitarDropD: [
      { noteValue: NoteValue.E, octave: 4 },
      { noteValue: NoteValue.B, octave: 3 },
      { noteValue: NoteValue.G, octave: 3 },
      { noteValue: NoteValue.D, octave: 3 },
      { noteValue: NoteValue.A, octave: 2 },
      { noteValue: NoteValue.D, octave: 2 },
    ],
  },
  7: {
    Standard: [
      { noteValue: NoteValue.E, octave: 4 },
      { noteValue: NoteValue.B, octave: 3 },
      { noteValue: NoteValue.G, octave: 3 },
      { noteValue: NoteValue.D, octave: 3 },
      { noteValue: NoteValue.A, octave: 2 },
      { noteValue: NoteValue.E, octave: 2 },
      { noteValue: NoteValue.B, octave: 1 },
    ],
  },
  8: {
    Standard: [
      { noteValue: NoteValue.E, octave: 4 },
      { noteValue: NoteValue.B, octave: 3 },
      { noteValue: NoteValue.G, octave: 3 },
      { noteValue: NoteValue.D, octave: 3 },
      { noteValue: NoteValue.A, octave: 2 },
      { noteValue: NoteValue.E, octave: 2 },
      { noteValue: NoteValue.B, octave: 1 },
      { noteValue: NoteValue.FSharp, octave: 1 },
    ],
  },
  9: {
    Standard: [
      { noteValue: NoteValue.E, octave: 4 },
      { noteValue: NoteValue.B, octave: 3 },
      { noteValue: NoteValue.G, octave: 3 },
      { noteValue: NoteValue.D, octave: 3 },
      { noteValue: NoteValue.A, octave: 2 },
      { noteValue: NoteValue.E, octave: 2 },
      { noteValue: NoteValue.B, octave: 1 },
      { noteValue: NoteValue.FSharp, octave: 1 },
      { noteValue: NoteValue.CSharp, octave: 1 },
    ],
  },
  10: {
    Standard: [
      { noteValue: NoteValue.E, octave: 4 },
      { noteValue: NoteValue.B, octave: 3 },
      { noteValue: NoteValue.G, octave: 3 },
      { noteValue: NoteValue.D, octave: 3 },
      { noteValue: NoteValue.A, octave: 2 },
      { noteValue: NoteValue.E, octave: 2 },
      { noteValue: NoteValue.B, octave: 1 },
      { noteValue: NoteValue.FSharp, octave: 1 },
      { noteValue: NoteValue.CSharp, octave: 1 },
      { noteValue: NoteValue.GSharp, octave: 0 },
    ],
  },
  11: {
    Standard: [
      { noteValue: NoteValue.E, octave: 4 },
      { noteValue: NoteValue.B, octave: 3 },
      { noteValue: NoteValue.G, octave: 3 },
      { noteValue: NoteValue.D, octave: 3 },
      { noteValue: NoteValue.A, octave: 2 },
      { noteValue: NoteValue.E, octave: 2 },
      { noteValue: NoteValue.B, octave: 1 },
      { noteValue: NoteValue.FSharp, octave: 1 },
      { noteValue: NoteValue.CSharp, octave: 1 },
      { noteValue: NoteValue.GSharp, octave: 0 },
      { noteValue: NoteValue.DSharp, octave: 0 },
    ],
  },
  12: {
    Standard: [
      { noteValue: NoteValue.E, octave: 4 },
      { noteValue: NoteValue.B, octave: 3 },
      { noteValue: NoteValue.G, octave: 3 },
      { noteValue: NoteValue.D, octave: 3 },
      { noteValue: NoteValue.A, octave: 2 },
      { noteValue: NoteValue.E, octave: 2 },
      { noteValue: NoteValue.B, octave: 1 },
      { noteValue: NoteValue.FSharp, octave: 1 },
      { noteValue: NoteValue.CSharp, octave: 1 },
      { noteValue: NoteValue.GSharp, octave: 0 },
      { noteValue: NoteValue.DSharp, octave: 0 },
      { noteValue: NoteValue.ASharp, octave: 0 },
    ],
  },
} as const;
