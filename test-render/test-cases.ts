import { Bar } from "../src/models/bar";
import { Beat } from "../src/models/beat";
import { Guitar } from "../src/models/guitar";
import { GuitarEffect } from "../src/models/guitar-effect/guitar-effect";
import { GuitarEffectOptions } from "../src/models/guitar-effect/guitar-effect-options";
import { GuitarEffectType } from "..//src/models/guitar-effect/guitar-effect-type";
import { Note, NoteValue } from "../src/models/note";
import { NoteDuration } from "../src/models/note-duration";
import { Tab } from "../src/models/tab";
import { TabWindow } from "../src/tab-window/tab-window";
import { TabWindowDim } from "../src/tab-window/tab-window-dim";
import { SelectedMoveDirection } from "../src/tab-window/elements/selected-element";
import { Score } from "../src";
import fs from "fs";

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
  const tuning = [
    new Note(NoteValue.E, 4),
    new Note(NoteValue.B, 3),
    new Note(NoteValue.G, 3),
    new Note(NoteValue.D, 3),
    new Note(NoteValue.A, 2),
    new Note(NoteValue.D, 2),
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

  const tab = new Tab("Unknown", "Guitar", guitar, bars);
  return tab;
}

export function createBasicScore(tabs?: Tab[]): Score {
  if (tabs === undefined || tabs.length === 0) {
    tabs = [createBasicTab(), createBasicTab()];
  }

  const score = new Score(
    -1,
    "basic score",
    "basic artist",
    "basic song",
    false,
    tabs
  );

  return score;
}

export function createBasicTabWindow(): TabWindow {
  // const tab: Tab = createBasicTab();
  const score = createBasicScore();
  const tab = score.tracks[0];

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

export function createCustomTabWindow(
  barsCount: number,
  barBeats: number,
  barDuration: NoteDuration
): TabWindow {
  const stringsCount = 6;
  const guitar = new Guitar(stringsCount);

  const bars: Bar[] = [];
  for (let i = 0; i < barsCount; i++) {
    const beats: Beat[] = [];

    for (let j = 0; j < barBeats; j++) {
      beats.push(new Beat(guitar, barDuration));
    }

    bars.push(new Bar(guitar, 120, barBeats, barDuration, beats));
  }

  const tab1 = new Tab("Unknown", "Guitar", guitar, bars);
  const tab2 = createBasicTab();
  const score = createBasicScore([tab1, tab2]);

  const dim = new TabWindowDim(
    width,
    noteTextSize,
    timeSigTextSize,
    tempoTextSize,
    durationsHeight,
    guitar.stringsCount
  );
  const tabWindow = new TabWindow(score, tab1, dim);
  tabWindow.calcTabElement();
  return tabWindow;
}

export function createTabWindowFromTab(score: Score, tab: Tab): TabWindow {
  const dim = new TabWindowDim(
    width,
    noteTextSize,
    timeSigTextSize,
    tempoTextSize,
    durationsHeight,
    tab.guitar.stringsCount
  );
  return new TabWindow(score, tab, dim);
}

export interface TestCase {
  tabWindow: TabWindow;
  caption: string;
}

function prepareTestCases(): TestCase[] {
  const tabWindows = [
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

      const score = new Score(
        -1,
        "rand name",
        "rand artist",
        "rand song",
        true,
        [tab]
      );
      fs.writeFileSync(
        "test-data/tabber-to-json.json",
        JSON.stringify(score.toJSONObj())
      );

      const tabWindow = createTabWindowFromTab(score, tab);
      return {
        tabWindow: tabWindow,
        caption: "Parse score to json",
      };
    })(),
    (() => {
      const scoreObj = require("../test-data/tabber-to-json.json");
      const score = Score.fromJSON(scoreObj);

      console.log(score);
      const tabWindow = new TabWindow(
        score,
        score.tracks[0],
        new TabWindowDim(
          width,
          noteTextSize,
          timeSigTextSize,
          tempoTextSize,
          durationsHeight,
          score.tracks[0].guitar.stringsCount
        )
      );

      return {
        tabWindow: tabWindow,
        caption: "Parse test, look at the console",
      };
    })(),
    (() => {
      const score = createBasicScore();
      const tab = score.tracks[0];

      const tabWindow = new TabWindow(
        score,
        tab,
        new TabWindowDim(
          width,
          noteTextSize,
          timeSigTextSize,
          tempoTextSize,
          durationsHeight,
          tab.guitar.stringsCount
        )
      );

      tabWindow.prependBar();

      return {
        tabWindow: tabWindow,
        caption: "Prepend bar to the score test, tab #1",
      };
    })(),
    (() => {
      const score = createBasicScore();
      const tab = score.tracks[0];

      const tabWindow = new TabWindow(
        score,
        tab,
        new TabWindowDim(
          width,
          noteTextSize,
          timeSigTextSize,
          tempoTextSize,
          durationsHeight,
          tab.guitar.stringsCount
        )
      );

      tabWindow.appendBar();

      return {
        tabWindow: tabWindow,
        caption: "Append bar to the score test, tab #1",
      };
    })(),
    (() => {
      const score = createBasicScore();
      const tab = score.tracks[0];

      const tabWindow = new TabWindow(
        score,
        tab,
        new TabWindowDim(
          width,
          noteTextSize,
          timeSigTextSize,
          tempoTextSize,
          durationsHeight,
          tab.guitar.stringsCount
        )
      );

      const insertIndex = 2;
      tabWindow.insertBar(insertIndex);

      return {
        tabWindow: tabWindow,
        caption: `Insert bar at index ${insertIndex} to the score test, tab #1`,
      };
    })(),
    (() => {
      const score = createBasicScore();
      const tab = score.tracks[0];

      const tabWindow = new TabWindow(
        score,
        tab,
        new TabWindowDim(
          width,
          noteTextSize,
          timeSigTextSize,
          tempoTextSize,
          durationsHeight,
          tab.guitar.stringsCount
        )
      );

      tabWindow.selectNoteElementUsingIds(0, 2, 1, 4);
      tabWindow.setSelectedElementFret(12);

      const removeIndex = 2;
      tabWindow.removeBar(removeIndex);

      return {
        tabWindow: tabWindow,
        caption: `Remove bar at index ${removeIndex} the score test, tab #1`,
      };
    })(),
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
      const tab = createBasicTab();
      randomFrets(tab, true);
      // tab.bars[9].beats.splice(1, 3); // Last bar
      // tab.bars[1].beats.splice(1, 3); // Random bar in line 1
      tab.bars[6].beats.splice(1, 3); // Random bar in line 2

      const score = new Score();
      score.tracks[0] = tab;

      const tabWindow = createTabWindowFromTab(score, tab);

      // selectNote(tabWindow, 1, 4, 0, 3); // Last bar
      // selectNote(tabWindow, 0, 1, 0, 3); // Random bar in line 1
      selectNote(tabWindow, 1, 1, 0, 3); // Random bar in line 2

      // Move right thus creating a new beat
      tabWindow.moveSelectedNote(SelectedMoveDirection.Right);

      return {
        tabWindow: tabWindow,
        caption: "Move selected note: add beat",
      };
    })(),
    (() => {
      const stringsCount = 6;
      const guitar = new Guitar(stringsCount);
      const bars = [];
      const tab = new Tab("Unknown", "Guitar", guitar, bars);
      const score = createBasicScore([tab]);

      const dim = new TabWindowDim(
        width,
        noteTextSize,
        timeSigTextSize,
        tempoTextSize,
        durationsHeight,
        guitar.stringsCount
      );
      const tabWindow = new TabWindow(score, tab, dim);

      tabWindow.calcTabElement();
      return {
        tabWindow: tabWindow,
        caption: "Empty bars array creates tab with 1 bar",
      };
    })(),
    (() => {
      const stringsCount = 7;
      const tuning = [
        new Note(NoteValue.E, 4),
        new Note(NoteValue.B, 3),
        new Note(NoteValue.G, 3),
        new Note(NoteValue.D, 3),
        new Note(NoteValue.A, 2),
        new Note(NoteValue.E, 2),
        new Note(NoteValue.A, 1),
      ];
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
      const tab = new Tab("Unknown", "Guitar", guitar, bars);
      const score = createBasicScore([tab]);
      randomFrets(tab);

      const dim = new TabWindowDim(
        width,
        noteTextSize,
        timeSigTextSize,
        tempoTextSize,
        durationsHeight,
        guitar.stringsCount
      );
      const tabWindow = new TabWindow(score, tab, dim);

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
      // tabWindow.tabEditor!.selectBeatUsingIds(0, 0, 3);
      // tabWindow.tabEditor!.selectBeatUsingIds(0, 0, 2);
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
      // tabWindow.tabEditor!.selectBeatUsingIds(1, 0, 3);
      // tabWindow.tabEditor!.selectBeatUsingIds(1, 1, 0);
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
      tabWindow.setSelectedElementFret(Math.floor(Math.random() * 24));

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
      tabWindow.setSelectedElementFret(Math.floor(Math.random() * 24));

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
      tabWindow.setSelectedElementFret(20);
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
      tabWindow.selectNoteElementUsingIds(
        copiedBeats[0][0],
        copiedBeats[0][1],
        copiedBeats[0][2],
        3
      );
      tabWindow.setSelectedElementFret(20);
      tabWindow.selectNoteElementUsingIds(
        copiedBeats[1][0],
        copiedBeats[1][1],
        copiedBeats[1][2],
        3
      );
      tabWindow.setSelectedElementFret(19);

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
      tabWindow.selectNoteElementUsingIds(
        copiedBeat[0],
        copiedBeat[0],
        copiedBeat[0],
        3
      );
      tabWindow.setSelectedElementFret(20);

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
      const score = createBasicScore([tab]);
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

      const tabWindow = createTabWindowFromTab(score, tab);

      return {
        tabWindow: tabWindow,
        caption: "Create tab window from tab with preset effects",
      };
    })(),
    (() => {
      const tab = createBasicTab();
      const score = createBasicScore([tab]);
      randomFrets(tab, true);
      const tabWindow = createTabWindowFromTab(score, tab);

      tabWindow.selectNoteElementUsingIds(0, 3, 1, 3);

      tabWindow.applyEffectSingle(GuitarEffectType.PalmMute);

      return {
        tabWindow: tabWindow,
        caption: "Create tab window and apply effects later",
      };
    })(),
    (() => {
      const tab = createBasicTab();
      const score = createBasicScore([tab]);
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
      const tabWindow = createTabWindowFromTab(score, tab);

      tabWindow.selectNoteElementUsingIds(0, 3, 1, 3);

      tabWindow.applyEffectSingle(GuitarEffectType.PalmMute);

      return {
        tabWindow: tabWindow,
        caption:
          "Create tab window from tab with preset effects and apply effects later",
      };
    })(),
    (() => {
      const tab = createBasicTab();
      const score = createBasicScore([tab]);
      randomFrets(tab, true);
      const tabWindow = createTabWindowFromTab(score, tab);

      tabWindow.selectNoteElementUsingIds(0, 3, 1, 3);

      tabWindow.applyEffectSingle(GuitarEffectType.PalmMute);
      tabWindow.removeEffectSingle(GuitarEffectType.PalmMute);

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

          tabWindow.applyEffectSingle(
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

          tabWindow.applyEffectSingle(
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
    (() => {
      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectNoteElementUsingIds(0, 3, 1, 3);
      tabWindow.applyEffectSingle(GuitarEffectType.PalmMute);

      tabWindow.undo();

      return {
        tabWindow: tabWindow,
        caption: "Test undo: apply palm mute and then undo it",
      };
    })(),
    (() => {
      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectNoteElementUsingIds(0, 3, 1, 3);
      tabWindow.applyEffectSingle(GuitarEffectType.PalmMute);

      tabWindow.undo();
      tabWindow.redo();

      return {
        tabWindow: tabWindow,
        caption: "Test undo: apply palm mute, then undo it and then redo it",
      };
    })(),
    (() => {
      const tabWindow = createBasicTabWindow();
      randomFrets(tabWindow.tab, true);

      tabWindow.selectNoteElementUsingIds(0, 3, 1, 3);
      tabWindow.applyEffectSingle(GuitarEffectType.PalmMute);
      tabWindow.selectNoteElementUsingIds(0, 3, 2, 3);
      tabWindow.applyEffectSingle(GuitarEffectType.PalmMute);
      tabWindow.selectNoteElementUsingIds(0, 3, 3, 3);
      tabWindow.applyEffectSingle(GuitarEffectType.PalmMute);
      tabWindow.selectNoteElementUsingIds(0, 4, 0, 3);
      tabWindow.applyEffectSingle(GuitarEffectType.PalmMute);
      tabWindow.selectNoteElementUsingIds(0, 4, 1, 3);
      tabWindow.applyEffectSingle(GuitarEffectType.PalmMute);

      tabWindow.undo();
      tabWindow.undo();
      tabWindow.undo();
      tabWindow.redo();
      tabWindow.redo();

      return {
        tabWindow: tabWindow,
        caption:
          "Test undo: 3 undo's and 2 redo's. " +
          "Result should be 4 palm mutes",
      };
    })(),
  ];

  return tabWindows;
}

export const testData = {
  testCases: prepareTestCases(),
};
