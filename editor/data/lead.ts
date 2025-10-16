import { Note, NoteValue } from "@/index";

import { createTrack } from "./helpers";

const tuning = [
  new Note(NoteValue.E, 4),
  new Note(NoteValue.B, 3),
  new Note(NoteValue.G, 3),
  new Note(NoteValue.D, 3),
  new Note(NoteValue.A, 2),
  new Note(NoteValue.E, 2),
];
export const leadTrack = createTrack("Lead Guitar", 6, tuning, [1,3]);
