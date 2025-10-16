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
} from "@/index";

export function getBeats(
  count: number,
  guitar: Guitar,
  duration: NoteDuration,
  affectedStrings: number[],
  notes: number[]
): Beat[] {
  let beats = [];
  for (let i = 0; i < count; i++) {
    const notesArr: GuitarNote[] = [];
    for (let j = 1; j <= guitar.stringsCount; j++) {
      const fretVal = affectedStrings.includes(j) ? notes[i % 4] : undefined;
      notesArr.push(new GuitarNote(guitar, j, fretVal));
    }
    beats.push(new Beat(guitar, duration, notesArr));
  }

  return beats;
}

export function createTrack(
  name: string,
  stringsCount: number,
  tuning: Note[],
  affectedStrings: number[]
): Tab {
  const fretsCount = 24;
  const guitar = new Guitar(stringsCount, tuning, fretsCount);

  const notes = [8, 10, 12, 13];

  const bars = [
    new Bar(
      guitar,
      120,
      4,
      NoteDuration.Quarter,
      getBeats(4, guitar, NoteDuration.Quarter, affectedStrings, notes)
    ),
    new Bar(
      guitar,
      120,
      4,
      NoteDuration.Quarter,
      getBeats(8, guitar, NoteDuration.Eighth, affectedStrings, notes)
    ),
    new Bar(
      guitar,
      120,
      4,
      NoteDuration.Quarter,
      getBeats(16, guitar, NoteDuration.Sixteenth, affectedStrings, notes)
    ),
  ];

  return new Tab(name, "guitar", guitar, bars);
}
