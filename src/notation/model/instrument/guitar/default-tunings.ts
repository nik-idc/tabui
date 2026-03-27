import { Note, NoteType, NoteValue } from "../../note";

type StringCount = 4 | 5 | 6 | 7 | 8 | 9 | 12;

// Define allowed tuning names per string count
interface TuningsPerStringCount {
  4: "BassStandard" | "UkuleleStandard";
  5: "BanjoStandard";
  6: "Standard" | "GuitarDropD";
  7: "Standard";
  8: "Standard";
  9: "Standard";
  12: "Standard";
}

// Strongly-typed tuning map
type DefaultTunings = {
  [K in StringCount]: Record<TuningsPerStringCount[K], NoteType[]>;
};

export const DEFAULT_TUNINGS: DefaultTunings = {
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
    Standard: [],
  },
  8: {
    Standard: [],
  },
  9: {
    Standard: [],
  },
  12: {
    Standard: [],
  },
} as const;
