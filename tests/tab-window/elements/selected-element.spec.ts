import {
  Bar,
  Chord,
  Guitar,
  Note,
  NoteDuration,
  Point,
  Tab,
  TabWindow,
  TabWindowDim,
} from "../../../src";
import { SelectedElement } from "../../../src/tab-window/elements/selected-element";
import { TabLineElement } from "../../../src/tab-window/elements/tab-line-element";

const stringsCount = 6;
const fretsCount = 24;
const guitar = new Guitar(
  stringsCount,
  [Note.E, Note.B, Note.G, Note.D, Note.A, Note.E],
  fretsCount
);
const tabId = 1;
const tabName = "Random";
const tabArtist = "Me";
const tabSong = "Song";
const tab = new Tab(tabId, tabName, tabArtist, tabSong, guitar, [
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
  new Bar(guitar, 120, 4, NoteDuration.Quarter, [
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
  ]),
]);

const width = 1200;
const noteTextSize = 12;
const infoTextSize = 24;
const durationsHeight = 50;
const dim = new TabWindowDim(
  width,
  noteTextSize,
  infoTextSize,
  durationsHeight,
  stringsCount
);

let tabWindow = new TabWindow(tab, dim);

describe("Selected element tests", () => {
  test("Selected element move up test: any string", () => {
    // Select note element
    const tabLineElementId = 0;
    const barElementId = 0;
    const chordElementId = 1;
    const noteElementId = 4;
    tabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Create expected result
    const newSelectedNoteElementId = 3;

    // Move selected note up
    tabWindow.moveSelectedNoteUp();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[chordElementId].noteElements[newSelectedNoteElementId]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[chordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
    );
    expect(tabWindow.selectedElement.tabLineElement).toBe(
      tabWindow.tabLineElements[tabLineElementId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(chordElementId);
    expect(tabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(tabWindow.selectedElement.tabLineElementId).toBe(tabLineElementId);
  });

  test("Selected element move up test: 0th string", () => {
    // Select note element
    const tabLineElementId = 0;
    const barElementId = 0;
    const chordElementId = 1;
    const noteElementId = 0;
    tabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Create expected result
    const newSelectedNoteElementId = 5;

    // Move selected note up
    tabWindow.moveSelectedNoteUp();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[chordElementId].noteElements[newSelectedNoteElementId]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[chordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
    );
    expect(tabWindow.selectedElement.tabLineElement).toBe(
      tabWindow.tabLineElements[tabLineElementId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(chordElementId);
    expect(tabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(tabWindow.selectedElement.tabLineElementId).toBe(tabLineElementId);
  });

  test("Selected element move down test: any string", () => {
    // Select note element
    const tabLineElementId = 0;
    const barElementId = 0;
    const chordElementId = 1;
    const noteElementId = 4;
    tabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Create expected result
    const newSelectedNoteElementId = 5;

    // Move selected note up
    tabWindow.moveSelectedNoteDown();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[chordElementId].noteElements[newSelectedNoteElementId]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[chordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
    );
    expect(tabWindow.selectedElement.tabLineElement).toBe(
      tabWindow.tabLineElements[tabLineElementId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(chordElementId);
    expect(tabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(tabWindow.selectedElement.tabLineElementId).toBe(tabLineElementId);
  });

  test("Selected element move down test: 0th string", () => {
    // Select note element
    const tabLineElementId = 0;
    const barElementId = 0;
    const chordElementId = 1;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Create expected result
    const newSelectedNoteElementId = 0;

    // Move selected note up
    tabWindow.moveSelectedNoteDown();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[chordElementId].noteElements[newSelectedNoteElementId]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[chordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
    );
    expect(tabWindow.selectedElement.tabLineElement).toBe(
      tabWindow.tabLineElements[tabLineElementId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(chordElementId);
    expect(tabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(tabWindow.selectedElement.tabLineElementId).toBe(tabLineElementId);
  });

  test("Selected element move left test: any chord", () => {
    // Select note element
    const tabLineElementId = 0;
    const barElementId = 0;
    const chordElementId = 1;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Create expected result
    const newSelectedChordElementId = 0;
    const newSelectedNoteElementId = 5;

    // Move selected note up
    tabWindow.moveSelectedNoteLeft();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[newSelectedChordElementId].noteElements[
        newSelectedNoteElementId
      ]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[newSelectedChordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
    );
    expect(tabWindow.selectedElement.tabLineElement).toBe(
      tabWindow.tabLineElements[tabLineElementId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(
      newSelectedChordElementId
    );
    expect(tabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(tabWindow.selectedElement.tabLineElementId).toBe(tabLineElementId);
  });

  test("Selected element move left test: 0th chord in not first bar", () => {
    // Select note element
    const tabLineElementId = 0;
    const barElementId = 1;
    const chordElementId = 0;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Create expected result
    const newSelectedBarElementId = 0;
    const newSelectedChordElementId =
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements.length - 1;
    const newSelectedNoteElementId = 5;

    // Move selected note up
    tabWindow.moveSelectedNoteLeft();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[
        newSelectedBarElementId
      ].chordElements[newSelectedChordElementId].noteElements[
        newSelectedNoteElementId
      ]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[
        newSelectedBarElementId
      ].chordElements[newSelectedChordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[
        newSelectedBarElementId
      ]
    );
    expect(tabWindow.selectedElement.tabLineElement).toBe(
      tabWindow.tabLineElements[tabLineElementId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(
      newSelectedChordElementId
    );
    expect(tabWindow.selectedElement.barElementId).toBe(
      newSelectedBarElementId
    );
    expect(tabWindow.selectedElement.tabLineElementId).toBe(tabLineElementId);
  });

  test("Selected element move left test: 0th chord in first bar in not first tab line", () => {
    // Select note element
    const tabLineElementId = 1;
    const barElementId = 0;
    const chordElementId = 0;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Create expected result
    const newTabLineElementId = 0;
    const newSelectedBarElementId =
      tabWindow.tabLineElements[newTabLineElementId].barElements.length - 1;
    const newSelectedChordElementId =
      tabWindow.tabLineElements[newTabLineElementId].barElements[
        newSelectedBarElementId
      ].chordElements.length - 1;
    const newSelectedNoteElementId = 5;

    // Move selected note up
    tabWindow.moveSelectedNoteLeft();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.tabLineElements[newTabLineElementId].barElements[
        newSelectedBarElementId
      ].chordElements[newSelectedChordElementId].noteElements[
        newSelectedNoteElementId
      ]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.tabLineElements[newTabLineElementId].barElements[
        newSelectedBarElementId
      ].chordElements[newSelectedChordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.tabLineElements[newTabLineElementId].barElements[
        newSelectedBarElementId
      ]
    );
    expect(tabWindow.selectedElement.tabLineElement).toBe(
      tabWindow.tabLineElements[newTabLineElementId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(
      newSelectedChordElementId
    );
    expect(tabWindow.selectedElement.barElementId).toBe(
      newSelectedBarElementId
    );
    expect(tabWindow.selectedElement.tabLineElementId).toBe(
      newTabLineElementId
    );
  });

  test("Selected element move left test: 0th chord in first bar in first tab line", () => {
    // Select note element
    const tabLineElementId = 0;
    const barElementId = 0;
    const chordElementId = 0;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Expected result is nothing changing
    // Move selected note up
    tabWindow.moveSelectedNoteLeft();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[chordElementId].noteElements[noteElementId]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[chordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
    );
    expect(tabWindow.selectedElement.tabLineElement).toBe(
      tabWindow.tabLineElements[tabLineElementId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(noteElementId);
    expect(tabWindow.selectedElement.chordElementId).toBe(chordElementId);
    expect(tabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(tabWindow.selectedElement.tabLineElementId).toBe(tabLineElementId);
  });

  test("Selected element move right test: any chord", () => {
    // Select note element
    const tabLineElementId = 0;
    const barElementId = 0;
    const chordElementId = 0;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Create expected result
    const newSelectedChordElementId = 1;
    const newSelectedNoteElementId = 5;

    // Move selected note up
    tabWindow.moveSelectedNoteRight();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[newSelectedChordElementId].noteElements[
        newSelectedNoteElementId
      ]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[newSelectedChordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
    );
    expect(tabWindow.selectedElement.tabLineElement).toBe(
      tabWindow.tabLineElements[tabLineElementId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(
      newSelectedChordElementId
    );
    expect(tabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(tabWindow.selectedElement.tabLineElementId).toBe(tabLineElementId);
  });

  test("Selected element move right test: last chord in not last bar", () => {
    // Select note element
    const tabLineElementId = 0;
    const barElementId = 0;
    const chordElementId =
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements.length - 1;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Create expected result
    const newSelectedBarElementId = 1;
    const newSelectedChordElementId = 0;
    const newSelectedNoteElementId = 5;

    // Move selected note up
    tabWindow.moveSelectedNoteRight();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[
        newSelectedBarElementId
      ].chordElements[newSelectedChordElementId].noteElements[
        newSelectedNoteElementId
      ]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[
        newSelectedBarElementId
      ].chordElements[newSelectedChordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[
        newSelectedBarElementId
      ]
    );
    expect(tabWindow.selectedElement.tabLineElement).toBe(
      tabWindow.tabLineElements[tabLineElementId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(
      newSelectedChordElementId
    );
    expect(tabWindow.selectedElement.barElementId).toBe(
      newSelectedBarElementId
    );
    expect(tabWindow.selectedElement.tabLineElementId).toBe(tabLineElementId);
  });

  test("Selected element move right test: last chord in last bar in not last line", () => {
    // Select note element
    const tabLineElementId = 0;
    const barElementId =
      tabWindow.tabLineElements[tabLineElementId].barElements.length - 1;
    const chordElementId =
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements.length - 1;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Create expected result
    const newTabLineElementId = 1;
    const newSelectedBarElementId = 0;
    const newSelectedChordElementId = 0;
    const newSelectedNoteElementId = 5;

    // Move selected note up
    tabWindow.moveSelectedNoteRight();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.tabLineElements[newTabLineElementId].barElements[
        newSelectedBarElementId
      ].chordElements[newSelectedChordElementId].noteElements[
        newSelectedNoteElementId
      ]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.tabLineElements[newTabLineElementId].barElements[
        newSelectedBarElementId
      ].chordElements[newSelectedChordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.tabLineElements[newTabLineElementId].barElements[
        newSelectedBarElementId
      ]
    );
    expect(tabWindow.selectedElement.tabLineElement).toBe(
      tabWindow.tabLineElements[newTabLineElementId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(
      newSelectedChordElementId
    );
    expect(tabWindow.selectedElement.barElementId).toBe(
      newSelectedBarElementId
    );
    expect(tabWindow.selectedElement.tabLineElementId).toBe(
      newTabLineElementId
    );
  });

  test("Selected element move right test: last chord in last bar in last line, new bar", () => {
    // Select note element
    const tabLineElementId = 1;
    const barElementId =
      tabWindow.tabLineElements[tabLineElementId].barElements.length - 1;
    const chordElementId =
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements.length - 1;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Move selected note up (one note right in this case should be a new bar)
    tabWindow.moveSelectedNoteRight();

    // Expected result is a new bar/tab line element
    const newSelectedBarElementId =
      tabWindow.tabLineElements[tabLineElementId].barElements.length - 1;
    const newSelectedChordElementId = 0;
    const newSelectedNoteElementId = 5;

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[
        newSelectedBarElementId
      ].chordElements[newSelectedChordElementId].noteElements[
        newSelectedNoteElementId
      ]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[
        newSelectedBarElementId
      ].chordElements[newSelectedChordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.tabLineElements[tabLineElementId].barElements[
        newSelectedBarElementId
      ]
    );
    expect(tabWindow.selectedElement.tabLineElement).toBe(
      tabWindow.tabLineElements[tabLineElementId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(
      newSelectedChordElementId
    );
    expect(tabWindow.selectedElement.barElementId).toBe(
      newSelectedBarElementId
    );
    expect(tabWindow.selectedElement.tabLineElementId).toBe(tabLineElementId);
  });

  test("Selected element move right test: last chord in last bar in last line, new tab line", () => {
    // Select note element
    const tabLineElementId = 1;
    const barElementId =
      tabWindow.tabLineElements[tabLineElementId].barElements.length - 1;
    const chordElementId =
      tabWindow.tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements.length - 1;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Move note to the right until a new tab line is created
    while (tabWindow.tabLineElements.length !== 3) {
      tabWindow.moveSelectedNoteRight();
    }

    // Expected result is a new bar/tab line element
    const newTabLineElementId = tabWindow.tabLineElements.length - 1;
    const newSelectedBarElementId = 0;
    const newSelectedChordElementId = 0;
    const newSelectedNoteElementId = 5;

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.tabLineElements[newTabLineElementId].barElements[
        newSelectedBarElementId
      ].chordElements[newSelectedChordElementId].noteElements[
        newSelectedNoteElementId
      ]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.tabLineElements[newTabLineElementId].barElements[
        newSelectedBarElementId
      ].chordElements[newSelectedChordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.tabLineElements[newTabLineElementId].barElements[
        newSelectedBarElementId
      ]
    );
    expect(tabWindow.selectedElement.tabLineElement).toBe(
      tabWindow.tabLineElements[newTabLineElementId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(
      newSelectedChordElementId
    );
    expect(tabWindow.selectedElement.barElementId).toBe(
      newSelectedBarElementId
    );
    expect(tabWindow.selectedElement.tabLineElementId).toBe(
      newTabLineElementId
    );
  });
});
