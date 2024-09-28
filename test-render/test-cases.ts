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
const durationsHeight = 50;

function randomFrets(tab: Tab, allNotes: boolean = false): void {
  for (const bar of tab.bars) {
    for (const chord of bar.chords) {
      for (const note of chord.notes) {
        if (allNotes) {
          const newFret = Math.floor(Math.random() * 24);
          note.fret = newFret;
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
  tabWindow.selectNoteElement(
    barElementLineId,
    barElementId,
    chordElementId,
    stringNum - 1
  );
}

export function createBasicTabWindow(): TabWindow {
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
  return tabWindow;
}

export interface TestCase {
  tabWindow: TabWindow;
  caption: string;
}

function prepareTestCases(): TestCase[] {
  const tabWindows = [
    (() => {
      const tabWindow = createBasicTabWindow();

      selectNote(tabWindow, 1, 4, 3, 4);

      // Move right thus creating new notes
      tabWindow.moveSelectedNoteRight();
      tabWindow.moveSelectedNoteRight();
      tabWindow.moveSelectedNoteRight();
      tabWindow.moveSelectedNoteRight();
      tabWindow.moveSelectedNoteRight();
      tabWindow.moveSelectedNoteRight();

      // Move selected note left to see if it's at the right place
      tabWindow.moveSelectedNoteLeft();
      tabWindow.moveSelectedNoteLeft();

      // Fill frets
      randomFrets(tabWindow.tab, true);

      return {
        tabWindow: tabWindow,
        caption: "Move selected note",
      };
    })(),
    (() => {
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
      return {
        tabWindow: tabWindow,
        caption: "Empty bars array creates tab with 1 bar",
      };
    })(),
    (() => {
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
      return {
        tabWindow: tabWindow,
        caption:
          "7 string guitar + a single 'TabWindow.calc' " +
          `on 100 bars performance measuring: calc speed is ${calcSpeed}`,
      };
    })(),
    (() => {
      // select chords left-to-right
      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectChord(0, 1, 0);
      tabWindow.selectChord(1, 0, 2);

      return {
        tabWindow: tabWindow,
        caption: "Select chords left-to-right",
      };
    })(),
    (() => {
      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectChord(0, 1, 0);
      tabWindow.selectChord(1, 0, 2);
      tabWindow.selectChord(0, 0, 3);
      tabWindow.selectChord(0, 0, 2);
      tabWindow.selectChord(0, 0, 1);

      return {
        tabWindow: tabWindow,
        caption: "Select chords from left-to-right to then right-to-left",
      };
    })(),
    (() => {
      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectChord(1, 0, 2);
      tabWindow.selectChord(0, 1, 0);

      return {
        tabWindow: tabWindow,
        caption: "Select chords right-to-left",
      };
    })(),
    (() => {
      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectChord(1, 0, 2);
      tabWindow.selectChord(0, 1, 0);
      tabWindow.selectChord(1, 0, 3);
      tabWindow.selectChord(1, 1, 0);
      tabWindow.selectChord(1, 1, 1);

      return {
        tabWindow: tabWindow,
        caption: "Select chords from right-to-left to left-to-right",
      };
    })(),
    (() => {
      const tabWindow = createBasicTabWindow();

      // Select chords first
      tabWindow.selectChord(1, 0, 2);
      tabWindow.selectChord(0, 1, 0);
      // Select note element should clear all selected chords
      tabWindow.selectNoteElement(0, 1, 1, 2);
      tabWindow.selectedElement.note.fret = Math.floor(Math.random() * 24);

      // Copy selected note
      tabWindow.copy();

      // Select note to paste value into & paste
      tabWindow.selectNoteElement(0, 2, 3, 5);
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption: "Copy paste selected note: from 0-1-1-2 to 0-2-3-5",
      };
    })(),
    (() => {
      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      // Select note element first
      tabWindow.selectNoteElement(0, 1, 1, 2);
      // Select chords clears selected element
      tabWindow.selectChord(0, 2, 3);
      tabWindow.selectChord(0, 1, 0);

      // Copy selected chords
      tabWindow.copy();

      // Select note element where chords will be pasted & paste
      tabWindow.selectNoteElement(1, 0, 1, 2);
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption:
          "Copy paste selected chords: " +
          "chords from 1-0-2 to 0-1-0 pasted at 1-0-1-2",
      };
    })(),
  ];

  return tabWindows;
}

export const testData = {
  testCases: prepareTestCases(),
};
