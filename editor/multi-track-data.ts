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

function getBeats(
  count: number,
  guitar: Guitar,
  duration: NoteDuration,
  type: string,
  notes: number[]
): Beat[] {
  let beats = [];
  for (let i = 0; i < count; i++) {
    beats.push(
      new Beat(guitar, duration, [
        new GuitarNote(guitar, 1, type === "lead" ? notes[i % 4] : undefined),
        new GuitarNote(guitar, 2),
        new GuitarNote(guitar, 3),
        new GuitarNote(guitar, 4),
        new GuitarNote(guitar, 5, type === "rhythm" ? notes[i % 4] : undefined),
        new GuitarNote(guitar, 6, type === "bass" ? notes[i % 4] : undefined),
      ])
    );
  }

  return beats;
}

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
    new Bar(
      guitar,
      120,
      4,
      NoteDuration.Quarter,
      getBeats(4, guitar, NoteDuration.Quarter, type, notes)
    ),
    new Bar(
      guitar,
      120,
      4,
      NoteDuration.Quarter,
      getBeats(8, guitar, NoteDuration.Eighth, type, notes)
    ),
    new Bar(
      guitar,
      120,
      4,
      NoteDuration.Quarter,
      getBeats(16, guitar, NoteDuration.Sixteenth, type, notes)
    ),
  ];

  return new Tab(name, "guitar", guitar, bars);
}

const leadTrack = createTrack("Lead Guitar", "lead");
const rhythmTrack = createTrack("Rhythm Guitar", "rhythm");
const bassTrack = createTrack("Bass", "bass");

export const score = new Score(
  -1,
  "Test Score",
  "Test Artist",
  "Test Song",
  false,
  [leadTrack, rhythmTrack, bassTrack]
);
