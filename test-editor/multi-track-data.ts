import {
  Tab,
  Bar,
  Beat,
  Note,
  NoteValue,
  NoteDuration,
  Guitar,
  Score,
  GuitarNote,
} from "../src/index";

function createTrack(name: string, type: string): Tab {
  const stringsCount = 6;
  const tuning = [
    new Note(NoteValue.E, 4),
    new Note(NoteValue.B, 3),
    new Note(NoteValue.G, 3),
    new Note(NoteValue.D, 3),
    new Note(NoteValue.A, 2),
    new Note(NoteValue.E, 2),
  ];
  const fretsCount = 24;
  const guitar = new Guitar(stringsCount, tuning, fretsCount);

  let notes: number[] = [];
  switch (type) {
    case "lead":
      notes = [8, 10, 12, 13];
      break;
    case "rhythm":
      notes = [6, 8, 10, 11];
      break;
    case "bass":
      notes = [4, 6, 8, 9];
      break;
    default:
      break;
  }

  const bars = [
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter, [
        new GuitarNote(guitar, 1, type === "lead" ? notes[0] : undefined),
        new GuitarNote(guitar, 2),
        new GuitarNote(guitar, 3),
        new GuitarNote(guitar, 4),
        new GuitarNote(guitar, 5, type === "rhythm" ? notes[0] : undefined),
        new GuitarNote(guitar, 6, type === "bass" ? notes[0] : undefined),
      ]),
      new Beat(guitar, NoteDuration.Quarter, [
        new GuitarNote(guitar, 1, type === "lead" ? notes[1] : undefined),
        new GuitarNote(guitar, 2),
        new GuitarNote(guitar, 3),
        new GuitarNote(guitar, 4),
        new GuitarNote(guitar, 5, type === "rhythm" ? notes[1] : undefined),
        new GuitarNote(guitar, 6, type === "bass" ? notes[1] : undefined),
      ]),
      new Beat(guitar, NoteDuration.Quarter, [
        new GuitarNote(guitar, 1, type === "lead" ? notes[2] : undefined),
        new GuitarNote(guitar, 2),
        new GuitarNote(guitar, 3),
        new GuitarNote(guitar, 4),
        new GuitarNote(guitar, 5, type === "rhythm" ? notes[2] : undefined),
        new GuitarNote(guitar, 6, type === "bass" ? notes[2] : undefined),
      ]),
      new Beat(guitar, NoteDuration.Quarter, [
        new GuitarNote(guitar, 1, type === "lead" ? notes[3] : undefined),
        new GuitarNote(guitar, 2),
        new GuitarNote(guitar, 3),
        new GuitarNote(guitar, 4),
        new GuitarNote(guitar, 5, type === "rhythm" ? notes[3] : undefined),
        new GuitarNote(guitar, 6, type === "bass" ? notes[3] : undefined),
      ]),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter, [
        new GuitarNote(guitar, 1),
        new GuitarNote(guitar, 2),
        new GuitarNote(guitar, 3),
        new GuitarNote(guitar, 4),
        new GuitarNote(guitar, 5),
        new GuitarNote(guitar, 6),
      ]),
      new Beat(guitar, NoteDuration.Quarter, [
        new GuitarNote(guitar, 1),
        new GuitarNote(guitar, 2),
        new GuitarNote(guitar, 3),
        new GuitarNote(guitar, 4),
        new GuitarNote(guitar, 5),
        new GuitarNote(guitar, 6),
      ]),
      new Beat(guitar, NoteDuration.Quarter, [
        new GuitarNote(guitar, 1),
        new GuitarNote(guitar, 2),
        new GuitarNote(guitar, 3),
        new GuitarNote(guitar, 4),
        new GuitarNote(guitar, 5),
        new GuitarNote(guitar, 6),
      ]),
      new Beat(guitar, NoteDuration.Quarter, [
        new GuitarNote(guitar, 1),
        new GuitarNote(guitar, 2),
        new GuitarNote(guitar, 3),
        new GuitarNote(guitar, 4),
        new GuitarNote(guitar, 5),
        new GuitarNote(guitar, 6),
      ]),
    ]),
  ];

  return new Tab(name, "guitar", guitar, bars);
}

const leadTrack = createTrack("Lead Guitar", 'lead');
const rhythmTrack = createTrack("Rhythm Guitar", 'rhythm');
const bassTrack = createTrack("Bass", 'bass');

export const score = new Score(
  -1,
  "Test Score",
  "Test Artist",
  "Test Song",
  false,
  [leadTrack, rhythmTrack, bassTrack]
);
