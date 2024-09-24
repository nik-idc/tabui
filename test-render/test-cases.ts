import { Bar } from "../src/models/bar";
import { Chord } from "../src/models/chord";
import { Guitar } from "../src/models/guitar";
import { Note } from "../src/models/note";
import { NoteDuration } from "../src/models/note-duration";
import { Tab } from "../src/models/tab";
import { TabWindow } from "../src/tab-window/tab-window";
import { TabWindowDim } from "../src/tab-window/tab-window-dim";

let calcSpeed: number | undefined = undefined;

const width = 1200;
const noteTextSize = 14;
const timeSigTextSize = 42;
const tempoTextSize = 28;
// const noteTextSize = 12;
// const timeSigTextSize = 36;
// const tempoTextSize = 24;
const durationsHeight = 50;

function randomFrets(tab: Tab, allStrings: boolean = false): void {
  for (const bar of tab.bars) {
    for (const chord of bar.chords) {
      for (const note of chord.notes) {
        if (allStrings) {
          note.fret = Math.floor(Math.random() * 24);
        } else {
          note.fret =
            Math.random() <= 0.2 ? Math.floor(Math.random() * 24) : undefined;
        }
      }
    }
  }
}

function selectNote(
  tabWindow: TabWindow,
  barElementLineId: number,
  barElementId: number,
  chordElementId: number,
  stringNum: number
): void {
  // const tabLineElement = tabWindow.tabLineElements[tabLineId];
  // const barElement = tabLineElement.barElements[barElementId];
  // const chordElement = barElement.chordElements[chordElementId];
  // const noteElement = chordElement.noteElements[stringNum - 1];
  tabWindow.selectNoteElement(
    barElementLineId,
    barElementId,
    chordElementId,
    stringNum - 1
  );
}

function prepareTestCase1(): TabWindow {
  const stringsCount = 6;
  const tuning = [Note.E, Note.A, Note.D, Note.G, Note.B, Note.E];
  const fretsCount = 24;
  const guitar = new Guitar(stringsCount, tuning, fretsCount);

  const bars = [
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 3, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 180, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
  ];

  const tab = new Tab(1, "test", "Unknown", "Unknown", guitar, bars, true);

  const dim = new TabWindowDim(
    width,
    noteTextSize,
    timeSigTextSize,
    tempoTextSize,
    durationsHeight,
    guitar.stringsCount
  );
  const tabWindow = new TabWindow(tab, dim);
  tabWindow.calc();
  selectNote(tabWindow, 0, 3, 3, 4);
  tabWindow.moveSelectedNoteRight();
  tabWindow.moveSelectedNoteRight();
  tabWindow.moveSelectedNoteRight();
  tabWindow.moveSelectedNoteRight();
  tabWindow.moveSelectedNoteRight();
  tabWindow.moveSelectedNoteRight();

  randomFrets(tab, true);

  tabWindow.moveSelectedNoteLeft();
  tabWindow.moveSelectedNoteLeft();

  return tabWindow;
}

function prepareTestCase2(): TabWindow {
  const stringsCount = 6;
  const tuning = [Note.E, Note.A, Note.D, Note.G, Note.B, Note.E];
  const fretsCount = 24;
  const guitar = new Guitar(stringsCount, tuning, fretsCount);
  const bars = [];
  const tab = new Tab(1, "test", "Unknown", "Unknown", guitar, bars, true);

  const dim = new TabWindowDim(
    width,
    noteTextSize,
    timeSigTextSize,
    tempoTextSize,
    durationsHeight,
    guitar.stringsCount
  );
  const tabWindow = new TabWindow(tab, dim);

  tabWindow.calc();
  // tabWindow.calcNew();
  return tabWindow;
}

function prepareTestCase3(): TabWindow {
  const stringsCount = 6;
  const tuning = [Note.E, Note.A, Note.D, Note.G, Note.B, Note.E];
  const fretsCount = 24;
  const guitar = new Guitar(stringsCount, tuning, fretsCount);
  const bars = [
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 3, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 180, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 3, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 130, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 180, 5, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 3, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 180, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 180, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
  ];
  const tab = new Tab(1, "test", "Unknown", "Unknown", guitar, bars, true);
  randomFrets(tab);

  const dim = new TabWindowDim(
    width,
    noteTextSize,
    timeSigTextSize,
    tempoTextSize,
    durationsHeight,
    guitar.stringsCount
  );
  const tabWindow = new TabWindow(tab, dim);
  tabWindow.calc();
  // selectNote(tabWindow, 0, 1, 2, 4);
  return tabWindow;
}

function prepareTestCase4(): TabWindow {
  const stringsCount = 7;
  const tuning = [Note.A, Note.E, Note.A, Note.D, Note.G, Note.B, Note.E];
  const fretsCount = 24;
  const guitar = new Guitar(stringsCount, tuning, fretsCount);
  let bars = new Array<Bar>();
  for (let i = 0; i < 100; i++) {
    bars.push(
      new Bar(guitar, 120, 4, NoteDuration.Quarter, [
        new Chord(guitar, NoteDuration.Quarter),
        new Chord(guitar, NoteDuration.Quarter),
        new Chord(guitar, NoteDuration.Quarter),
        new Chord(guitar, NoteDuration.Quarter),
      ])
    );
  }
  const tab = new Tab(1, "test", "Unknown", "Unknown", guitar, bars, true);
  randomFrets(tab);

  const dim = new TabWindowDim(
    width,
    noteTextSize,
    timeSigTextSize,
    tempoTextSize,
    durationsHeight,
    guitar.stringsCount
  );
  const tabWindow = new TabWindow(tab, dim);

  const before = performance.now();
  tabWindow.calc();
  const after = performance.now();
  calcSpeed = after - before;

  selectNote(tabWindow, 0, 1, 2, 4);
  return tabWindow;
}

function prepareTestCase5(): TabWindow {
  const stringsCount = 6;
  const tuning = [Note.E, Note.A, Note.D, Note.G, Note.B, Note.E];
  const fretsCount = 24;
  const guitar = new Guitar(stringsCount, tuning, fretsCount);

  const bars = [
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 3, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 180, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
  ];

  const tab = new Tab(1, "test", "Unknown", "Unknown", guitar, bars, true);

  const dim = new TabWindowDim(
    width,
    noteTextSize,
    timeSigTextSize,
    tempoTextSize,
    durationsHeight,
    guitar.stringsCount
  );
  const tabWindow = new TabWindow(tab, dim);
  tabWindow.calc();
  randomFrets(tab, true);

  tabWindow.selectChord(0, 0, 3);
  tabWindow.selectChord(0, 1, 0);
  tabWindow.selectChord(0, 1, 1);
  tabWindow.selectChord(0, 1, 2);

  tabWindow.insertChordsAt(0, 1, 2);

  tabWindow.selectChord(0, 0, 3);
  tabWindow.selectChord(0, 1, 0);
  tabWindow.selectChord(0, 1, 1);
  tabWindow.selectChord(0, 1, 2);

  return tabWindow;
}

function prepareTestCase6(): TabWindow {
  const tabWindow = createBasicTabWindow();
  tabWindow.calc();
  randomFrets(tabWindow.tab, true);

  tabWindow.selectChord(0, 1, 0);
  tabWindow.selectChord(1, 0, 2);

  return tabWindow;
}

function prepareTestCase7(): TabWindow {
  const tabWindow = createBasicTabWindow();
  tabWindow.calc();
  randomFrets(tabWindow.tab, true);

  tabWindow.selectChord(0, 1, 0);
  tabWindow.selectChord(1, 0, 2);
  // tabWindow.selectChord(0, 0, 1);
  tabWindow.selectChord(0, 0, 3);
  tabWindow.selectChord(0, 0, 2);
  tabWindow.selectChord(0, 0, 1);

  return tabWindow;
}

function createBasicTabWindow(): TabWindow {
  const stringsCount = 6;
  const tuning = [Note.E, Note.A, Note.D, Note.G, Note.B, Note.E];
  const fretsCount = 24;
  const guitar = new Guitar(stringsCount, tuning, fretsCount);

  const bars = [
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
  ];

  const tab = new Tab(1, "test", "Unknown", "Unknown", guitar, bars, true);

  const dim = new TabWindowDim(
    width,
    noteTextSize,
    timeSigTextSize,
    tempoTextSize,
    durationsHeight,
    guitar.stringsCount
  );
  const tabWindow = new TabWindow(tab, dim);
  tabWindow.calc();
  randomFrets(tab, true);
  return tabWindow;
}

function prepareTestCases(): TabWindow[] {
  const tabWindows = [
    prepareTestCase1(),
    prepareTestCase2(),
    prepareTestCase3(),
    prepareTestCase4(),
    prepareTestCase5(),
    prepareTestCase6(),
    prepareTestCase7(),
  ];

  return tabWindows;
}

export const testData = {
  tabWindows: prepareTestCases(),
  calcSpeed: calcSpeed,
  createBasicTabWindow: createBasicTabWindow,
};
