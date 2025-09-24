import {
  Tab,
  Bar,
  Beat,
  Note,
  NoteValue,
  NoteDuration,
  Guitar,
  TabWindow,
  TabWindowDim,
  TabWindowRenderer,
  Score,
  GuitarNote,
} from "../src/index";

// Tab window dim
const width = 1200;
const noteTextSize = 14;
const timeSigTextSize = 42;
const tempoTextSize = 28;
const durationsHeight = 50;

// Create tab window
export function createBasicTab() {
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

  const bars = [
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter, [
        new GuitarNote(guitar, 1, 8),
        new GuitarNote(guitar, 2),
        new GuitarNote(guitar, 3),
        new GuitarNote(guitar, 4),
        new GuitarNote(guitar, 5),
        new GuitarNote(guitar, 6),
      ]),
      new Beat(guitar, NoteDuration.Quarter, [
        new GuitarNote(guitar, 1, 10),
        new GuitarNote(guitar, 2),
        new GuitarNote(guitar, 3),
        new GuitarNote(guitar, 4),
        new GuitarNote(guitar, 5),
        new GuitarNote(guitar, 6),
      ]),
      new Beat(guitar, NoteDuration.Quarter, [
        new GuitarNote(guitar, 1, 12),
        new GuitarNote(guitar, 2),
        new GuitarNote(guitar, 3),
        new GuitarNote(guitar, 4),
        new GuitarNote(guitar, 5),
        new GuitarNote(guitar, 6),
      ]),
      new Beat(guitar, NoteDuration.Quarter, [
        new GuitarNote(guitar, 1, 13),
        new GuitarNote(guitar, 2),
        new GuitarNote(guitar, 3),
        new GuitarNote(guitar, 4),
        new GuitarNote(guitar, 5),
        new GuitarNote(guitar, 6),
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

  const tab = new Tab("test tab 2", "guitar", guitar, bars);
  return tab;
}

export function createBasicTabWindow() {
  const tab = createBasicTab();

  const score = new Score(-1, "test score", "test artist", "test song", true, [
    tab,
  ]);

  const dim = new TabWindowDim(
    width,
    noteTextSize,
    timeSigTextSize,
    tempoTextSize,
    durationsHeight,
    tab.guitar.stringsCount
  );
  const tabWindow = new TabWindow(score, tab, dim);
  tabWindow.calcTabElement();
  return tabWindow;
}

// export function fillTestTab(tabWindow: TabWindow): void {
//   // First string
//   tabWindow.selectNoteElementUsingIds(0, 0, 0, 0);
//   tabWindow.setSelectedElementFret(8);
//   tabWindow.selectNoteElementUsingIds(0, 0, 1, 0);
//   tabWindow.setSelectedElementFret(10);
//   tabWindow.selectNoteElementUsingIds(0, 0, 2, 0);
//   tabWindow.setSelectedElementFret(12);
//   tabWindow.selectNoteElementUsingIds(0, 0, 3, 0);
//   tabWindow.setSelectedElementFret(13);
// }

export const data2TabWindow = createBasicTabWindow();
// fillTestTab(data2TabWindow);
