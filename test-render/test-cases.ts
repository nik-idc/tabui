import { Bar } from "../src/models/bar";
import { Beat } from "../src/models/beat";
import { Guitar } from "../src/models/guitar";
import { GuitarEffect } from "../src/models/guitar-effect/guitar-effect";
import { GuitarEffectOptions } from "../src/models/guitar-effect/guitar-effect-options";
import { GuitarEffectType } from "..//src/models/guitar-effect/guitar-effect-type";
import { Note } from "../src/models/note";
import { NoteDuration } from "../src/models/note-duration";
import { Tab } from "../src/models/tab";
import { TabWindow } from "../src/tab-window/tab-window";
import { TabWindowDim } from "../src/tab-window/tab-window-dim";
import { SelectedMoveDirection } from "../src/tab-window/elements/selected-element";

let calcSpeed: number | undefined = undefined;

const width = 1200;
const noteTextSize = 14;
const timeSigTextSize = 42;
const tempoTextSize = 28;
const durationsHeight = 50;

function randomFrets(tab: Tab, allNotes: boolean = false): void {
  for (const bar of tab.bars) {
    for (const beat of bar.beats) {
      for (const note of beat.notes) {
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
  tabLineElementId: number,
  barElementId: number,
  beatElementId: number,
  stringNum: number
): void {
  tabWindow.selectNoteElementUsingIds(
    tabLineElementId,
    barElementId,
    beatElementId,
    stringNum - 1
  );
}

export function createBasicTab(): Tab {
  const stringsCount = 6;
  const tuning = [Note.E, Note.A, Note.D, Note.G, Note.B, Note.E];
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
    new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ]),
  ];

  const tab = new Tab(1, "test", "Unknown", "Unknown", guitar, bars, true);
  return tab;
}

export function createBasicTabWindow(): TabWindow {
  const tab: Tab = createBasicTab();

  const dim = new TabWindowDim(
    width,
    noteTextSize,
    timeSigTextSize,
    tempoTextSize,
    durationsHeight,
    tab.guitar.stringsCount
  );
  const tabWindow = new TabWindow(tab, dim);
  tabWindow.calcTabElement();
  return tabWindow;
}

export function createCustomTabWindow(
  barsCount: number,
  barBeats: number,
  barDuration: NoteDuration
): TabWindow {
  const stringsCount = 6;
  const tuning = [Note.E, Note.A, Note.D, Note.G, Note.B, Note.E];
  const fretsCount = 24;
  const guitar = new Guitar(stringsCount, tuning, fretsCount);

  const bars: Bar[] = [];
  for (let i = 0; i < barsCount; i++) {
    const beats: Beat[] = [];

    for (let j = 0; j < barBeats; j++) {
      beats.push(new Beat(guitar, barDuration));
    }

    bars.push(new Bar(guitar, 120, barBeats, barDuration, beats));
  }

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
  tabWindow.calcTabElement();
  return tabWindow;
}

export function createTabWindowFromTab(tab: Tab): TabWindow {
  const dim = new TabWindowDim(
    width,
    noteTextSize,
    timeSigTextSize,
    tempoTextSize,
    durationsHeight,
    tab.guitar.stringsCount
  );
  return new TabWindow(tab, dim);
}

export interface TestCase {
  tabWindow: TabWindow;
  caption: string;
}

function prepareTestCases(): TestCase[] {
  const tabWindows = [
    (() => {
      const tabWindow = createBasicTabWindow();

      // Fill frets
      randomFrets(tabWindow.tab, true);

      return {
        tabWindow: tabWindow,
        caption: "Draw tab window",
      };
    })(),
    (() => {
      const tabWindow = createBasicTabWindow();

      selectNote(tabWindow, 1, 4, 3, 4);

      // Move right thus creating new notes
      tabWindow.moveSelectedNote(SelectedMoveDirection.Right);
      tabWindow.moveSelectedNote(SelectedMoveDirection.Right);
      tabWindow.moveSelectedNote(SelectedMoveDirection.Right);
      tabWindow.moveSelectedNote(SelectedMoveDirection.Right);
      tabWindow.moveSelectedNote(SelectedMoveDirection.Right);
      tabWindow.moveSelectedNote(SelectedMoveDirection.Right);

      // Move selected note left to see if it's at the right place
      tabWindow.moveSelectedNote(SelectedMoveDirection.Left);
      tabWindow.moveSelectedNote(SelectedMoveDirection.Left);

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

      tabWindow.calcTabElement();
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
            new Beat(guitar, NoteDuration.Quarter),
            new Beat(guitar, NoteDuration.Quarter),
            new Beat(guitar, NoteDuration.Quarter),
            new Beat(guitar, NoteDuration.Quarter),
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
      tabWindow.calcTabElement();
      const after = performance.now();
      calcSpeed = after - before;

      selectNote(tabWindow, 0, 1, 2, 4);
      return {
        tabWindow: tabWindow,
        caption:
          "7 string guitar + a single 'tabWindow.calcTabElement' " +
          `on 100 bars performance measuring: calc speed is ${calcSpeed}`,
      };
    })(),
    (() => {
      const firstBeat = [0, 1, 0];
      const secondBeat = [1, 0, 2];

      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectBeatUsingIds(firstBeat[0], firstBeat[1], firstBeat[2]);
      tabWindow.selectBeatUsingIds(secondBeat[0], secondBeat[1], secondBeat[2]);

      return {
        tabWindow: tabWindow,
        caption:
          "Select beats left-to-right: from " +
          `${firstBeat[0]}-${firstBeat[1]}-${firstBeat[2]} to ` +
          `${secondBeat[0]}-${secondBeat[1]}-${secondBeat[2]}`,
      };
    })(),
    (() => {
      const firstBeat = [0, 1, 0];
      const secondBeat = [1, 0, 2];
      const thirdBeat = [0, 0, 1];

      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectBeatUsingIds(firstBeat[0], firstBeat[1], firstBeat[2]);
      tabWindow.selectBeatUsingIds(secondBeat[0], secondBeat[1], secondBeat[2]);
      // tabWindow.selectBeatUsingIds(0, 0, 3);
      // tabWindow.selectBeatUsingIds(0, 0, 2);
      tabWindow.selectBeatUsingIds(thirdBeat[0], thirdBeat[1], thirdBeat[2]);

      return {
        tabWindow: tabWindow,
        caption:
          "Select beats from left-to-right to then right-to-left: " +
          `${firstBeat[0]}-${firstBeat[1]}-${firstBeat[2]} to ` +
          `${secondBeat[0]}-${secondBeat[1]}-${secondBeat[2]} to ` +
          `${thirdBeat[0]}-${thirdBeat[1]}-${thirdBeat[2]}`,
      };
    })(),
    (() => {
      const firstBeat = [1, 0, 2];
      const secondBeat = [0, 1, 0];

      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectBeatUsingIds(firstBeat[0], firstBeat[1], firstBeat[2]);
      tabWindow.selectBeatUsingIds(secondBeat[0], secondBeat[1], secondBeat[2]);

      return {
        tabWindow: tabWindow,
        caption:
          "Select beats right-to-left: " +
          `${firstBeat[0]}-${firstBeat[1]}-${firstBeat[2]} to ` +
          `${secondBeat[0]}-${secondBeat[1]}-${secondBeat[2]}`,
      };
    })(),
    (() => {
      const firstBeat = [1, 0, 2];
      const secondBeat = [0, 1, 0];
      const thirdBeat = [1, 1, 1];

      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectBeatUsingIds(firstBeat[0], firstBeat[1], firstBeat[2]);
      tabWindow.selectBeatUsingIds(secondBeat[0], secondBeat[1], secondBeat[2]);
      // tabWindow.selectBeatUsingIds(1, 0, 3);
      // tabWindow.selectBeatUsingIds(1, 1, 0);
      tabWindow.selectBeatUsingIds(thirdBeat[0], thirdBeat[1], thirdBeat[2]);

      return {
        tabWindow: tabWindow,
        caption:
          "Select beats from right-to-left to left-to-right: " +
          `${firstBeat[0]}-${firstBeat[1]}-${firstBeat[2]} to ` +
          `${secondBeat[0]}-${secondBeat[1]}-${secondBeat[2]} to ` +
          `${thirdBeat[0]}-${thirdBeat[1]}-${thirdBeat[2]}`,
      };
    })(),
    (() => {
      const copiedNote = [0, 1, 1, 2];
      const pastedNote = [0, 2, 3, 5];

      const tabWindow = createBasicTabWindow();

      // Select beats first
      tabWindow.selectBeatUsingIds(1, 0, 2);
      tabWindow.selectBeatUsingIds(0, 1, 0);
      // Select note element should clear all selected beats
      tabWindow.selectNoteElementUsingIds(
        copiedNote[0],
        copiedNote[1],
        copiedNote[2],
        copiedNote[3]
      );
      tabWindow.selectionManager.selectedElement!.note.fret = Math.floor(
        Math.random() * 24
      );

      // Copy selected note
      tabWindow.copy();

      // Select note to paste value into & paste
      tabWindow.selectNoteElementUsingIds(
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

      // Select beats first
      tabWindow.selectBeatUsingIds(1, 0, 2);
      tabWindow.selectBeatUsingIds(0, 1, 0);
      // Select note element should clear all selected beats
      tabWindow.selectNoteElementUsingIds(
        copiedNote[0],
        copiedNote[1],
        copiedNote[2],
        copiedNote[3]
      );
      tabWindow.selectionManager.selectedElement!.note.fret = Math.floor(
        Math.random() * 24
      );

      // Copy selected note
      tabWindow.copy();

      tabWindow.moveSelectedNote(SelectedMoveDirection.Up);
      tabWindow.paste();

      tabWindow.moveSelectedNote(SelectedMoveDirection.Right);
      tabWindow.moveSelectedNote(SelectedMoveDirection.Down);
      tabWindow.paste();

      tabWindow.moveSelectedNote(SelectedMoveDirection.Down);
      tabWindow.moveSelectedNote(SelectedMoveDirection.Left);
      tabWindow.paste();

      tabWindow.moveSelectedNote(SelectedMoveDirection.Left);
      tabWindow.moveSelectedNote(SelectedMoveDirection.Up);
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
      const firstBeat = [0, 2, 3];
      const secondBeat = [0, 1, 0];
      const pastedAtNote = [1, 0, 1, 2];

      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      // Select note element first
      tabWindow.selectNoteElementUsingIds(0, 1, 1, 2);
      // Select beats clears selected element
      tabWindow.selectBeatUsingIds(firstBeat[0], firstBeat[1], firstBeat[2]);
      tabWindow.selectBeatUsingIds(secondBeat[0], secondBeat[1], secondBeat[2]);

      // Copy selected beats
      tabWindow.copy();

      // Select note element where beats will be pasted & paste
      tabWindow.selectNoteElementUsingIds(
        pastedAtNote[0],
        pastedAtNote[1],
        pastedAtNote[2],
        pastedAtNote[3]
      );
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption:
          "Copy paste selected beats: beats from " +
          `${firstBeat[0]}-${firstBeat[1]}-${firstBeat[2]} to ` +
          `${secondBeat[0]}-${secondBeat[1]}-${secondBeat[2]} pasted at ` +
          `${pastedAtNote[0]}-${pastedAtNote[1]}-${pastedAtNote[2]}-${pastedAtNote[3]}`,
      };
    })(),
    (() => {
      const copiedBeats = [
        [0, 2, 3],
        [0, 1, 0],
      ];
      const pasteIntoBeats = [
        [1, 0, 3],
        [1, 2, 2],
      ];

      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      // Select note element first
      tabWindow.selectNoteElementUsingIds(0, 1, 1, 2);
      // Select beats clears selected element
      tabWindow.selectBeatUsingIds(
        copiedBeats[0][0],
        copiedBeats[0][1],
        copiedBeats[0][2]
      );
      tabWindow.selectBeatUsingIds(
        copiedBeats[1][0],
        copiedBeats[1][1],
        copiedBeats[1][2]
      );

      // Copy selected beats
      tabWindow.copy();

      // Select note element where beats will be pasted & paste
      tabWindow.selectNoteElementUsingIds(0, 1, 1, 2);
      tabWindow.selectNoteElementUsingIds(0, 1, 2, 2);
      tabWindow.selectBeatUsingIds(
        pasteIntoBeats[0][0],
        pasteIntoBeats[0][1],
        pasteIntoBeats[0][2]
      );
      tabWindow.selectBeatUsingIds(
        pasteIntoBeats[1][0],
        pasteIntoBeats[1][1],
        pasteIntoBeats[1][2]
      );
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption:
          "Copy paste selected beats while selection not empty: copied beats from " +
          `${copiedBeats[0][0]}-${copiedBeats[0][1]}-${copiedBeats[0][2]} to ` +
          `${copiedBeats[1][0]}-${copiedBeats[1][1]}-${copiedBeats[1][2]} ` +
          `pasted into beats from ` +
          `${pasteIntoBeats[0][0]}-${pasteIntoBeats[0][1]}-${pasteIntoBeats[0][2]} to ` +
          `${pasteIntoBeats[1][0]}-${pasteIntoBeats[1][1]}-${pasteIntoBeats[1][2]}`,
      };
    })(),
    (() => {
      const copiedBeat = [0, 2, 1];
      const pastedIntoBeat = [0, 3, 3];

      const tabWindow = createBasicTabWindow();
      // randomFrets(tabWindow.tab, true);

      tabWindow.selectNoteElementUsingIds(
        copiedBeat[0],
        copiedBeat[1],
        copiedBeat[2],
        3
      );
      tabWindow.setSelectedNoteFret(20);
      // // Set beat notes value
      // tabWindow.tabElement.tabLineElements[copiedBeat[0]].barElements[
      //   copiedBeat[1]
      // ].beatElements[
      //   copiedBeat[2]
      // ].beatNotesElement.noteElements[3].note.fret = 20;

      // Select note element first
      tabWindow.selectNoteElementUsingIds(0, 1, 1, 2);
      // Select beats clears selected element
      tabWindow.selectBeatUsingIds(copiedBeat[0], copiedBeat[1], copiedBeat[2]);

      // Copy selected beats
      tabWindow.copy();

      // Select note element first
      tabWindow.selectNoteElementUsingIds(0, 1, 1, 2);
      // Select note element where beats will be pasted & paste
      tabWindow.selectBeatUsingIds(
        pastedIntoBeat[0],
        pastedIntoBeat[1],
        pastedIntoBeat[2]
      );
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption:
          "Copy paste beats replacing an equal number of selected beats: " +
          "copied beat from " +
          `${copiedBeat[0]}-${copiedBeat[1]}-${copiedBeat[2]} ` +
          `replacing beat at ` +
          `${pastedIntoBeat[0]}-${pastedIntoBeat[1]}-${pastedIntoBeat[2]}`,
      };
    })(),
    (() => {
      const copiedBeats = [
        [0, 2, 1],
        [0, 2, 2],
      ];
      const pastedIntoBeat = [0, 3, 3];

      const tabWindow = createBasicTabWindow();
      // Set beat notes value
      tabWindow.tabElement.tabLineElements[copiedBeats[0][0]].barElements[
        copiedBeats[0][1]
      ].beatElements[
        copiedBeats[0][2]
      ].beatNotesElement.noteElements[3].note.fret = 20;
      tabWindow.tabElement.tabLineElements[copiedBeats[1][0]].barElements[
        copiedBeats[1][1]
      ].beatElements[
        copiedBeats[1][2]
      ].beatNotesElement.noteElements[3].note.fret = 19;

      // Select note element first
      tabWindow.selectNoteElementUsingIds(0, 1, 1, 2);
      // Select beats to copy
      tabWindow.selectBeatUsingIds(
        copiedBeats[0][0],
        copiedBeats[0][1],
        copiedBeats[0][2]
      );
      tabWindow.selectBeatUsingIds(
        copiedBeats[1][0],
        copiedBeats[1][1],
        copiedBeats[1][2]
      );

      // Copy selected beats
      tabWindow.copy();

      // Select note element first
      tabWindow.selectNoteElementUsingIds(0, 1, 1, 2);
      // Select note element where beats will be pasted & paste
      tabWindow.selectBeatUsingIds(
        pastedIntoBeat[0],
        pastedIntoBeat[1],
        pastedIntoBeat[2]
      );
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption:
          "Copy paste more beats than selected beats: copied beats from " +
          `${copiedBeats[0][0]}-${copiedBeats[0][1]}-${copiedBeats[0][2]} to ` +
          `${copiedBeats[1][0]}-${copiedBeats[1][1]}-${copiedBeats[1][2]} ` +
          `replacing beat at ` +
          `${pastedIntoBeat[0]}-${pastedIntoBeat[1]}-${pastedIntoBeat[2]}`,
      };
    })(),
    (() => {
      const copiedBeat = [0, 2, 1];
      const pastedIntoBeats = [
        [0, 3, 2],
        [0, 3, 3],
      ];

      const tabWindow = createBasicTabWindow();
      // Set beat notes value
      tabWindow.tabElement.tabLineElements[copiedBeat[0]].barElements[
        copiedBeat[1]
      ].beatElements[
        copiedBeat[2]
      ].beatNotesElement.noteElements[3].note.fret = 20;

      // Select note element first
      tabWindow.selectNoteElementUsingIds(0, 1, 1, 2);
      // Select beats clears selected element
      tabWindow.selectBeatUsingIds(copiedBeat[0], copiedBeat[1], copiedBeat[2]);

      // Copy selected beats
      tabWindow.copy();

      // Select note element first
      tabWindow.selectNoteElementUsingIds(0, 1, 1, 2);
      // Select note element where beats will be pasted & paste
      tabWindow.selectBeatUsingIds(
        pastedIntoBeats[0][0],
        pastedIntoBeats[0][1],
        pastedIntoBeats[0][2]
      );
      tabWindow.selectBeatUsingIds(
        pastedIntoBeats[1][0],
        pastedIntoBeats[1][1],
        pastedIntoBeats[1][2]
      );
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption:
          "Copy paste 1 beat replacing multiple selected beats: " +
          "copied beat from " +
          `${copiedBeat[0]}-${copiedBeat[1]}-${copiedBeat[2]} to ` +
          `replacing beats from ` +
          `${pastedIntoBeats[0][0]}-${pastedIntoBeats[0][1]}-${pastedIntoBeats[0][2]} to ` +
          `${pastedIntoBeats[1][0]}-${pastedIntoBeats[1][1]}-${pastedIntoBeats[1][2]}`,
      };
    })(),
    (() => {
      const copiedBeats = [
        [0, 2, 1],
        [0, 2, 2],
      ];
      const pastedIntoBeats = [
        [0, 3, 1],
        [0, 3, 2],
        [0, 3, 3],
      ];

      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      // Set beat notes value
      tabWindow.selectBeatUsingIds(
        copiedBeats[0][0],
        copiedBeats[0][1],
        copiedBeats[0][2]
      );
      tabWindow.selectBeatUsingIds(
        copiedBeats[1][0],
        copiedBeats[1][1],
        copiedBeats[1][2]
      );
      tabWindow.changeSelectionDuration(NoteDuration.Sixteenth);

      // Copy selected beats
      tabWindow.copy();

      // Select note element first
      tabWindow.selectNoteElementUsingIds(0, 1, 1, 2);
      // Select note element where beats will be pasted & paste
      tabWindow.selectBeatUsingIds(
        pastedIntoBeats[0][0],
        pastedIntoBeats[0][1],
        pastedIntoBeats[0][2]
      );
      tabWindow.selectBeatUsingIds(
        pastedIntoBeats[2][0],
        pastedIntoBeats[2][1],
        pastedIntoBeats[2][2]
      );
      tabWindow.paste();

      return {
        tabWindow: tabWindow,
        caption:
          "Copy paste 2 beats replacing 3 selected beats: " +
          "copied beat from " +
          `${copiedBeats[0][0]}-${copiedBeats[0][1]}-${copiedBeats[0][2]} to ` +
          `${copiedBeats[1][0]}-${copiedBeats[1][1]}-${copiedBeats[1][2]} ` +
          `replacing beats from ` +
          `${pastedIntoBeats[0][0]}-${pastedIntoBeats[0][1]}-${pastedIntoBeats[0][2]} to ` +
          `${pastedIntoBeats[2][0]}-${pastedIntoBeats[2][1]}-${pastedIntoBeats[2][2]}`,
      };
    })(),
    (() => {
      const tab = createBasicTab();
      randomFrets(tab, true);
      tab.bars[1].beats[0].notes[3].addEffect(
        new GuitarEffect(GuitarEffectType.PalmMute)
      );
      tab.bars[1].beats[1].notes[3].addEffect(
        new GuitarEffect(GuitarEffectType.PalmMute)
      );
      tab.bars[1].beats[1].notes[3].addEffect(
        new GuitarEffect(GuitarEffectType.Vibrato)
      );
      tab.bars[5].beats[1].notes[3].addEffect(
        new GuitarEffect(GuitarEffectType.Vibrato)
      );

      const tabWindow = createTabWindowFromTab(tab);

      return {
        tabWindow: tabWindow,
        caption: "Create tab window from tab with preset effects",
      };
    })(),
    (() => {
      const tab = createBasicTab();
      randomFrets(tab, true);
      const tabWindow = createTabWindowFromTab(tab);

      tabWindow.selectNoteElementUsingIds(0, 3, 1, 3);
      tabWindow.tabElement.tabLineElements[0].applyEffectSingle(
        3,
        1,
        4,
        GuitarEffectType.PalmMute
      );

      return {
        tabWindow: tabWindow,
        caption: "Create tab window and apply effects later",
      };
    })(),
    (() => {
      const tab = createBasicTab();
      randomFrets(tab, true);
      tab.bars[0].beats[1].notes[4].addEffect(
        new GuitarEffect(GuitarEffectType.Vibrato)
      );
      tab.bars[3].beats[1].notes[4].addEffect(
        new GuitarEffect(GuitarEffectType.Vibrato)
      );
      tab.bars[5].beats[1].notes[4].addEffect(
        new GuitarEffect(GuitarEffectType.Vibrato)
      );
      const tabWindow = createTabWindowFromTab(tab);

      tabWindow.selectNoteElementUsingIds(0, 3, 1, 3);
      tabWindow.tabElement.tabLineElements[0].applyEffectSingle(
        3,
        1,
        4,
        GuitarEffectType.PalmMute
      );

      return {
        tabWindow: tabWindow,
        caption:
          "Create tab window from tab with preset effects and apply effects later",
      };
    })(),
    (() => {
      const tab = createBasicTab();
      randomFrets(tab, true);
      const tabWindow = createTabWindowFromTab(tab);

      tabWindow.selectNoteElementUsingIds(0, 3, 1, 3);
      tabWindow.tabElement.tabLineElements[0].applyEffectSingle(
        3,
        1,
        4,
        GuitarEffectType.PalmMute
      );
      tabWindow.tabElement.tabLineElements[0].removeEffectSingle(3, 1, 4, 0);

      return {
        tabWindow: tabWindow,
        caption: "Create tab window, apply effect and then remove it",
      };
    })(),
    (() => {
      const effectsToTry = [
        [
          [
            [0, 0, 0, 0],
            [0, 0, 1, 1],
            [0, 0, 2, 2],
            [0, 0, 3, 3],
            [0, 0, 4, 4],
            [0, 0, 5, 5],
          ],
          GuitarEffectType.Bend,
          new GuitarEffectOptions(1, undefined, undefined),
        ],
        [
          [
            [0, 1, 0, 0],
            [0, 1, 1, 1],
            [0, 1, 2, 2],
            [0, 1, 3, 3],
            [0, 1, 4, 4],
            [0, 1, 5, 5],
          ],
          GuitarEffectType.BendAndRelease,
          new GuitarEffectOptions(1.75, 1.5, undefined),
        ],
        [
          [
            [0, 2, 0, 0],
            [0, 2, 1, 1],
            [0, 2, 2, 2],
            [0, 2, 3, 3],
            [0, 2, 4, 4],
            [0, 2, 5, 5],
          ],
          GuitarEffectType.Prebend,
          new GuitarEffectOptions(undefined, undefined, 0.5),
        ],
        [
          [
            [1, 0, 0, 0],
            [1, 0, 1, 1],
            [1, 0, 2, 2],
            [1, 0, 3, 3],
            [1, 0, 4, 4],
            [1, 0, 5, 5],
          ],
          GuitarEffectType.PrebendAndRelease,
          new GuitarEffectOptions(undefined, 1.75, 1.5),
        ],
      ];

      const tabWindow = createCustomTabWindow(4, 6, NoteDuration.Quarter);
      randomFrets(tabWindow.tab, true);

      for (const effectToTry of effectsToTry) {
        const effectNotes = effectToTry[0] as number[][];
        for (const effectNote of effectNotes) {
          tabWindow.selectNoteElementUsingIds(
            effectNote[0],
            effectNote[1],
            effectNote[2],
            effectNote[3]
          );

          tabWindow.tabElement.tabLineElements[effectNote[0]].applyEffectSingle(
            effectNote[1],
            effectNote[2],
            effectNote[3] + 1,
            effectToTry[1] as GuitarEffectType,
            effectToTry[2] as GuitarEffectOptions
          );
        }
      }

      return {
        tabWindow: tabWindow,
        caption: "Apply all existing types of bend effects on notes: ",
      };
    })(),
    (() => {
      const effectsToTry = [
        [
          [
            [0, 0, 0, 0],
            [0, 0, 1, 1],
            [0, 0, 2, 2],
            [0, 0, 3, 3],
            [0, 0, 4, 4],
            [0, 0, 5, 5],
          ],
          GuitarEffectType.Vibrato,
        ],
        [
          [
            [0, 1, 0, 0],
            [0, 1, 1, 1],
            [0, 1, 2, 2],
            [0, 1, 3, 3],
            [0, 1, 4, 4],
            [0, 1, 5, 5],
          ],
          GuitarEffectType.Slide,
        ],
        [
          [
            [0, 2, 0, 0],
            [0, 2, 1, 1],
            [0, 2, 2, 2],
            [0, 2, 3, 3],
            [0, 2, 4, 4],
            [0, 2, 5, 5],
          ],
          GuitarEffectType.HammerOnOrPullOff,
        ],
        [
          [
            [1, 0, 0, 0],
            [1, 0, 1, 1],
            [1, 0, 2, 2],
            [1, 0, 3, 3],
            [1, 0, 4, 4],
            [1, 0, 5, 5],
          ],
          GuitarEffectType.PinchHarmonic,
        ],
        [
          [
            [1, 1, 0, 0],
            [1, 1, 1, 1],
            [1, 1, 2, 2],
            [1, 1, 3, 3],
            [1, 1, 4, 4],
            [1, 1, 5, 5],
          ],
          GuitarEffectType.NaturalHarmonic,
        ],
        [
          [
            [1, 2, 0, 0],
            [1, 2, 1, 1],
            [1, 2, 2, 2],
            [1, 2, 3, 3],
            [1, 2, 4, 4],
            [1, 2, 5, 5],
          ],
          GuitarEffectType.PalmMute,
        ],
      ];

      const tabWindow = createCustomTabWindow(6, 6, NoteDuration.Quarter);
      randomFrets(tabWindow.tab, true);

      for (const effectToTry of effectsToTry) {
        const effectNotes = effectToTry[0] as number[][];
        for (const effectNote of effectNotes) {
          tabWindow.selectNoteElementUsingIds(
            effectNote[0],
            effectNote[1],
            effectNote[2],
            effectNote[3]
          );

          tabWindow.tabElement.tabLineElements[effectNote[0]].applyEffectSingle(
            effectNote[1],
            effectNote[2],
            effectNote[3] + 1,
            effectToTry[1] as GuitarEffectType,
            effectToTry[2] as GuitarEffectOptions
          );
        }
      }

      return {
        tabWindow: tabWindow,
        caption: "Apply all existing types of effects on notes: ",
      };
    })(),
  ];

  return tabWindows;
}

export const testData = {
  testCases: prepareTestCases(),
};
