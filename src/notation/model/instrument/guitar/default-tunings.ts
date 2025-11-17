import { Note, NoteValue } from "../../note/note";

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
  [K in StringCount]: Record<TuningsPerStringCount[K], Note[]>;
};

export const DEFAULT_TUNINGS: DefaultTunings = {
  4: {
    BassStandard: [
      new Note(NoteValue.G, 2),
      new Note(NoteValue.D, 2),
      new Note(NoteValue.A, 1),
      new Note(NoteValue.E, 1),
    ],
    UkuleleStandard: [
      new Note(NoteValue.A, 4),
      new Note(NoteValue.E, 4),
      new Note(NoteValue.C, 3),
      new Note(NoteValue.G, 4),
    ],
  },
  5: {
    BanjoStandard: [
      new Note(NoteValue.D, 4),
      new Note(NoteValue.B, 4),
      new Note(NoteValue.G, 3),
      new Note(NoteValue.D, 3),
      new Note(NoteValue.G, 3),
    ],
  },
  6: {
    Standard: [
      new Note(NoteValue.E, 4),
      new Note(NoteValue.B, 3),
      new Note(NoteValue.G, 3),
      new Note(NoteValue.D, 3),
      new Note(NoteValue.A, 2),
      new Note(NoteValue.E, 2),
    ],
    GuitarDropD: [
      new Note(NoteValue.E, 4),
      new Note(NoteValue.B, 3),
      new Note(NoteValue.G, 3),
      new Note(NoteValue.D, 3),
      new Note(NoteValue.A, 2),
      new Note(NoteValue.D, 2),
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
