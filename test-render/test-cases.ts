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
      const firstChord = [0, 1, 0];
      const secondChord = [1, 0, 2];

      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectChord(firstChord[0], firstChord[1], firstChord[2]);
      tabWindow.selectChord(secondChord[0], secondChord[1], secondChord[2]);

      return {
        tabWindow: tabWindow,
        caption:
          "Select chords left-to-right: from " +
          `${firstChord[0]}-${firstChord[1]}-${firstChord[2]} to ` +
          `${secondChord[0]}-${secondChord[1]}-${secondChord[2]}`,
      };
    })(),
    (() => {
      const firstChord = [0, 1, 0];
      const secondChord = [1, 0, 2];
      const thirdChord = [0, 0, 1];

      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectChord(firstChord[0], firstChord[1], firstChord[2]);
      tabWindow.selectChord(secondChord[0], secondChord[1], secondChord[2]);
      // tabWindow.selectChord(0, 0, 3);
      // tabWindow.selectChord(0, 0, 2);
      tabWindow.selectChord(thirdChord[0], thirdChord[1], thirdChord[2]);

      return {
        tabWindow: tabWindow,
        caption:
          "Select chords from left-to-right to then right-to-left:" +
          `${firstChord[0]}-${firstChord[1]}-${firstChord[2]} to ` +
          `${secondChord[0]}-${secondChord[1]}-${secondChord[2]} to ` +
          `${secondChord[0]}-${secondChord[1]}-${secondChord[2]}`,
      };
    })(),
    (() => {
      const firstChord = [1, 0, 2];
      const secondChord = [0, 1, 0];

      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectChord(firstChord[0], firstChord[1], firstChord[2]);
      tabWindow.selectChord(secondChord[0], secondChord[1], secondChord[2]);

      return {
        tabWindow: tabWindow,
        caption:
          "Select chords right-to-left" +
          `${firstChord[0]}-${firstChord[1]}-${firstChord[2]} to ` +
          `${secondChord[0]}-${secondChord[1]}-${secondChord[2]}`,
      };
    })(),
    (() => {
      const firstChord = [1, 0, 2];
      const secondChord = [0, 1, 0];
      const thirdChord = [1, 1, 1];

      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectChord(firstChord[0], firstChord[1], firstChord[2]);
      tabWindow.selectChord(secondChord[0], secondChord[1], secondChord[2]);
      // tabWindow.selectChord(1, 0, 3);
      // tabWindow.selectChord(1, 1, 0);
      tabWindow.selectChord(thirdChord[0], thirdChord[1], thirdChord[2]);

      return {
        tabWindow: tabWindow,
        caption:
          "Select chords from right-to-left to left-to-right" +
          `${firstChord[0]}-${firstChord[1]}-${firstChord[2]} to ` +
          `${secondChord[0]}-${secondChord[1]}-${secondChord[2]} to ` +
          `${secondChord[0]}-${secondChord[1]}-${secondChord[2]}`,
      };
    })(),
    (() => {
      const copiedNote = [0, 1, 1, 2];
      const pastedNote = [0, 2, 3, 5];

      const tabWindow = createBasicTabWindow();

      // Select chords first
      tabWindow.selectChord(1, 0, 2);
      tabWindow.selectChord(0, 1, 0);
      // Select note element should clear all selected chords
      tabWindow.selectNoteElement(
        copiedNote[0],
        copiedNote[1],
        copiedNote[2],
        copiedNote[3]
      );
      tabWindow.selectedElement.note.fret = Math.floor(Math.random() * 24);

      // Copy selected note
      tabWindow.copy();

      // Select note to paste value into & paste
      tabWindow.selectNoteElement(
        pastedNote[0],
        pastedNote[1],
        pastedNote[2],
        pastedNote[3]
      );
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption:
          "Copy paste selected note after 'click': from " +
          `${copiedNote[0]}-${copiedNote[1]}-${copiedNote[2]}-${copiedNote[3]} to ` +
          `${pastedNote[0]}-${pastedNote[1]}-${pastedNote[2]}-${pastedNote[3]}`,
      };
    })(),
    (() => {
      const copiedNote = [0, 1, 1, 2];

      const tabWindow = createBasicTabWindow();

      // Select chords first
      tabWindow.selectChord(1, 0, 2);
      tabWindow.selectChord(0, 1, 0);
      // Select note element should clear all selected chords
      tabWindow.selectNoteElement(
        copiedNote[0],
        copiedNote[1],
        copiedNote[2],
        copiedNote[3]
      );
      tabWindow.selectedElement.note.fret = Math.floor(Math.random() * 24);

      // Copy selected note
      tabWindow.copy();

      tabWindow.moveSelectedNoteUp();
      tabWindow.paste();

      tabWindow.moveSelectedNoteRight();
      tabWindow.moveSelectedNoteDown();
      tabWindow.paste();

      tabWindow.moveSelectedNoteDown();
      tabWindow.moveSelectedNoteLeft();
      tabWindow.paste();

      tabWindow.moveSelectedNoteLeft();
      tabWindow.moveSelectedNoteUp();
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption:
          "Copy paste selected note after 'moving': from " +
          `${copiedNote[0]}-${copiedNote[1]}-${copiedNote[2]}-${copiedNote[3]} ` +
          `to all directions (up, right, down, left)`,
      };
    })(),
    (() => {
      const firstChord = [0, 2, 3];
      const secondChord = [0, 1, 0];
      const pastedAtNote = [1, 0, 1, 2];

      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      // Select note element first
      tabWindow.selectNoteElement(0, 1, 1, 2);
      // Select chords clears selected element
      tabWindow.selectChord(firstChord[0], firstChord[1], firstChord[2]);
      tabWindow.selectChord(secondChord[0], secondChord[1], secondChord[2]);

      // Copy selected chords
      tabWindow.copy();

      // Select note element where chords will be pasted & paste
      tabWindow.selectNoteElement(
        pastedAtNote[0],
        pastedAtNote[1],
        pastedAtNote[2],
        pastedAtNote[3]
      );
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption:
          "Copy paste selected chords: chords from " +
          `${firstChord[0]}-${firstChord[1]}-${firstChord[2]} to ` +
          `${secondChord[0]}-${secondChord[1]}-${secondChord[2]} pasted at ` +
          `${pastedAtNote[0]}-${pastedAtNote[1]}-${pastedAtNote[2]}-${pastedAtNote[3]}`,
      };
    })(),
    (() => {
      const copiedChords = [
        [0, 2, 3],
        [0, 1, 0],
      ];
      const pasteIntoChords = [
        [1, 0, 3],
        [1, 2, 2],
      ];

      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      // Select note element first
      tabWindow.selectNoteElement(0, 1, 1, 2);
      // Select chords clears selected element
      tabWindow.selectChord(
        copiedChords[0][0],
        copiedChords[0][1],
        copiedChords[0][2]
      );
      tabWindow.selectChord(
        copiedChords[1][0],
        copiedChords[1][1],
        copiedChords[1][2]
      );

      // Copy selected chords
      tabWindow.copy();

      // Select note element where chords will be pasted & paste
      tabWindow.selectNoteElement(0, 1, 1, 2);
      tabWindow.selectNoteElement(0, 1, 2, 2);
      tabWindow.selectChord(
        pasteIntoChords[0][0],
        pasteIntoChords[0][1],
        pasteIntoChords[0][2]
      );
      tabWindow.selectChord(
        pasteIntoChords[1][0],
        pasteIntoChords[1][1],
        pasteIntoChords[1][2]
      );
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption:
          "Copy paste selected chords while selection not empty: copied chords from " +
          `${copiedChords[0][0]}-${copiedChords[0][1]}-${copiedChords[0][2]} to ` +
          `${copiedChords[1][0]}-${copiedChords[1][1]}-${copiedChords[1][2]} ` +
          `pasted into chords from ` +
          `${pasteIntoChords[0][0]}-${pasteIntoChords[0][1]}-${pasteIntoChords[0][2]} to ` +
          `${pasteIntoChords[1][0]}-${pasteIntoChords[1][1]}-${pasteIntoChords[1][2]}`,
      };
    })(),
    (() => {
      const copiedChord = [0, 2, 1];
      const pastedIntoChord = [0, 3, 3];

      const tabWindow = createBasicTabWindow();
      // Set chord notes value
      tabWindow.barElementLines[copiedChord[0]][copiedChord[1]].chordElements[
        copiedChord[2]
      ].noteElements[3].note.fret = 20;

      // Select note element first
      tabWindow.selectNoteElement(0, 1, 1, 2);
      // Select chords clears selected element
      tabWindow.selectChord(copiedChord[0], copiedChord[1], copiedChord[2]);

      // Copy selected chords
      tabWindow.copy();

      // Select note element first
      tabWindow.selectNoteElement(0, 1, 1, 2);
      // Select note element where chords will be pasted & paste
      tabWindow.selectChord(
        pastedIntoChord[0],
        pastedIntoChord[1],
        pastedIntoChord[2]
      );
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption:
          "Copy paste chords replacing an equal number of selected chords: " +
          "copied chord from " +
          `${copiedChord[0]}-${copiedChord[1]}-${copiedChord[2]} ` +
          `replacing chord at ` +
          `${pastedIntoChord[0]}-${pastedIntoChord[1]}-${pastedIntoChord[2]}`,
      };
    })(),
    (() => {
      const copiedChords = [
        [0, 2, 1],
        [0, 2, 2],
      ];
      const pastedIntoChord = [0, 3, 3];

      const tabWindow = createBasicTabWindow();
      // Set chord notes value
      tabWindow.barElementLines[copiedChords[0][0]][
        copiedChords[0][1]
      ].chordElements[copiedChords[0][2]].noteElements[3].note.fret = 20;
      tabWindow.barElementLines[copiedChords[1][0]][
        copiedChords[1][1]
      ].chordElements[copiedChords[1][2]].noteElements[3].note.fret = 19;

      // Select note element first
      tabWindow.selectNoteElement(0, 1, 1, 2);
      // Select chords to copy
      tabWindow.selectChord(
        copiedChords[0][0],
        copiedChords[0][1],
        copiedChords[0][2]
      );
      tabWindow.selectChord(
        copiedChords[1][0],
        copiedChords[1][1],
        copiedChords[1][2]
      );

      // Copy selected chords
      tabWindow.copy();

      // Select note element first
      tabWindow.selectNoteElement(0, 1, 1, 2);
      // Select note element where chords will be pasted & paste
      tabWindow.selectChord(
        pastedIntoChord[0],
        pastedIntoChord[1],
        pastedIntoChord[2]
      );
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption:
          "Copy paste more chords than selected chords: copied chords from " +
          `${copiedChords[0][0]}-${copiedChords[0][1]}-${copiedChords[0][2]} to ` +
          `${copiedChords[1][0]}-${copiedChords[1][1]}-${copiedChords[1][2]} ` +
          `replacing chord at ` +
          `${pastedIntoChord[0]}-${pastedIntoChord[1]}-${pastedIntoChord[2]}`,
      };
    })(),
    (() => {
      const copiedChord = [0, 2, 1];
      const pastedIntoChords = [
        [0, 3, 2],
        [0, 3, 3],
      ];

      const tabWindow = createBasicTabWindow();
      // Set chord notes value
      tabWindow.barElementLines[copiedChord[0]][copiedChord[1]].chordElements[
        copiedChord[2]
      ].noteElements[3].note.fret = 20;

      // Select note element first
      tabWindow.selectNoteElement(0, 1, 1, 2);
      // Select chords clears selected element
      tabWindow.selectChord(copiedChord[0], copiedChord[1], copiedChord[2]);

      // Copy selected chords
      tabWindow.copy();

      // Select note element first
      tabWindow.selectNoteElement(0, 1, 1, 2);
      // Select note element where chords will be pasted & paste
      tabWindow.selectChord(
        pastedIntoChords[0][0],
        pastedIntoChords[0][1],
        pastedIntoChords[0][2]
      );
      tabWindow.selectChord(
        pastedIntoChords[1][0],
        pastedIntoChords[1][1],
        pastedIntoChords[1][2]
      );
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption:
          "Copy paste 1 chord replacing multiple selected chords: " +
          "copied chord from " +
          `${copiedChord[0]}-${copiedChord[1]}-${copiedChord[2]} to ` +
          `replacing chords from ` +
          `${pastedIntoChords[0][0]}-${pastedIntoChords[0][1]}-${pastedIntoChords[0][2]} to ` +
          `${pastedIntoChords[1][0]}-${pastedIntoChords[1][1]}-${pastedIntoChords[1][2]}`,
      };
    })(),
  ];

  return tabWindows;
}

export const testData = {
  testCases: prepareTestCases(),
};
