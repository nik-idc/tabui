import { Note, NoteValue } from "@/index";

import { createTrack } from "./helpers";

const tuning = [
  new Note(NoteValue.G, 3),
  new Note(NoteValue.D, 3),
  new Note(NoteValue.A, 2),
  new Note(NoteValue.E, 2),
];
export const bassTrack = createTrack("Bass Guitar", 4, tuning, [4]);
