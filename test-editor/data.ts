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
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ]),
  ];

  const tab = new Tab("test tab", "guitar", guitar, bars);
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

export function fillTestTab(tabWindow: TabWindow): void {
  // First string
  tabWindow.selectNoteElementUsingIds(0, 0, 0, 0);
  tabWindow.setSelectedElementFret(8);
  tabWindow.selectNoteElementUsingIds(0, 0, 1, 0);
  tabWindow.setSelectedElementFret(10);
  tabWindow.selectNoteElementUsingIds(0, 0, 2, 0);
  tabWindow.setSelectedElementFret(12);
  tabWindow.selectNoteElementUsingIds(0, 0, 3, 0);
  tabWindow.setSelectedElementFret(13);
  tabWindow.selectNoteElementUsingIds(0, 1, 0, 0);
  tabWindow.setSelectedElementFret(15);
  tabWindow.selectNoteElementUsingIds(0, 1, 1, 0);
  tabWindow.setSelectedElementFret(13);
  tabWindow.selectNoteElementUsingIds(0, 1, 2, 0);
  tabWindow.setSelectedElementFret(12);
  tabWindow.selectNoteElementUsingIds(0, 1, 3, 0);
  tabWindow.setSelectedElementFret(10);

  // Third string
  tabWindow.selectNoteElementUsingIds(0, 2, 0, 2);
  tabWindow.setSelectedElementFret(8);
  tabWindow.selectNoteElementUsingIds(0, 2, 1, 2);
  tabWindow.setSelectedElementFret(10);
  tabWindow.selectNoteElementUsingIds(0, 2, 2, 2);
  // tabWindow.setSelectedElementFret(12);
  // tabWindow.selectNoteElementUsingIds(0, 2, 3, 2);
  tabWindow.setSelectedElementFret(13);
  tabWindow.selectNoteElementUsingIds(0, 3, 0, 2);
  tabWindow.setSelectedElementFret(15);
  tabWindow.selectNoteElementUsingIds(0, 3, 1, 2);
  tabWindow.setSelectedElementFret(13);
  tabWindow.selectNoteElementUsingIds(0, 3, 2, 2);
  tabWindow.setSelectedElementFret(12);
  tabWindow.selectNoteElementUsingIds(0, 3, 3, 2);
  tabWindow.setSelectedElementFret(10);
  tabWindow.selectNoteElementUsingIds(0, 3, 4, 2);
  tabWindow.setSelectedElementFret(8);

  // All open strings
  tabWindow.selectNoteElementUsingIds(0, 4, 0, 0);
  tabWindow.setSelectedElementFret(0);
  tabWindow.selectNoteElementUsingIds(0, 4, 1, 1);
  tabWindow.setSelectedElementFret(0);
  tabWindow.selectNoteElementUsingIds(0, 4, 2, 2);
  tabWindow.setSelectedElementFret(0);
  tabWindow.selectNoteElementUsingIds(0, 4, 3, 3);
  tabWindow.setSelectedElementFret(0);
  tabWindow.selectNoteElementUsingIds(1, 0, 0, 4);
  tabWindow.setSelectedElementFret(0);
  tabWindow.selectNoteElementUsingIds(1, 0, 1, 5);
  tabWindow.setSelectedElementFret(0);
}
