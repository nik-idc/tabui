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
    const tabLineElement = tabWindow.tabLineElements[0];
    const barElement = tabLineElement.barElements[0];
    const chordElement = barElement.chordElements[1];
    const noteElement = chordElement.noteElements[4];
    tabWindow.selectNoteElement(
      noteElement,
      chordElement,
      barElement,
      tabLineElement
    );

    // Create expected result
    const newSelectedNoteElement = chordElement.noteElements[3];

    // Move selected note up
    tabWindow.moveSelectedNoteUp();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(newSelectedNoteElement);
    expect(tabWindow.selectedElement.chordElement).toBe(chordElement);
    expect(tabWindow.selectedElement.barElement).toBe(barElement);
    expect(tabWindow.selectedElement.tabLineElement).toBe(tabLineElement);
  });

  test("Selected element move up test: 0th string", () => {
    // Select note element
    const tabLineElement = tabWindow.tabLineElements[0];
    const barElement = tabLineElement.barElements[0];
    const chordElement = barElement.chordElements[1];
    const noteElement = chordElement.noteElements[0];
    tabWindow.selectNoteElement(
      noteElement,
      chordElement,
      barElement,
      tabLineElement
    );

    // Create expected result
    const newSelectedNoteElement = chordElement.noteElements[5];

    // Move selected note up
    tabWindow.moveSelectedNoteUp();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(newSelectedNoteElement);
    expect(tabWindow.selectedElement.chordElement).toBe(chordElement);
    expect(tabWindow.selectedElement.barElement).toBe(barElement);
    expect(tabWindow.selectedElement.tabLineElement).toBe(tabLineElement);
  });

  test("Selected element move down test: any string", () => {
    // Select note element
    const tabLineElement = tabWindow.tabLineElements[0];
    const barElement = tabLineElement.barElements[0];
    const chordElement = barElement.chordElements[1];
    const noteElement = chordElement.noteElements[4];
    tabWindow.selectNoteElement(
      noteElement,
      chordElement,
      barElement,
      tabLineElement
    );

    // Create expected result
    const newSelectedNoteElement = chordElement.noteElements[5];

    // Move selected note up
    tabWindow.moveSelectedNoteDown();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(newSelectedNoteElement);
    expect(tabWindow.selectedElement.chordElement).toBe(chordElement);
    expect(tabWindow.selectedElement.barElement).toBe(barElement);
    expect(tabWindow.selectedElement.tabLineElement).toBe(tabLineElement);
  });

  test("Selected element move down test: 0th string", () => {
    // Select note element
    const tabLineElement = tabWindow.tabLineElements[0];
    const barElement = tabLineElement.barElements[0];
    const chordElement = barElement.chordElements[1];
    const noteElement = chordElement.noteElements[5];
    tabWindow.selectNoteElement(
      noteElement,
      chordElement,
      barElement,
      tabLineElement
    );

    // Create expected result
    const newSelectedNoteElement = chordElement.noteElements[0];

    // Move selected note up
    tabWindow.moveSelectedNoteDown();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(newSelectedNoteElement);
    expect(tabWindow.selectedElement.chordElement).toBe(chordElement);
    expect(tabWindow.selectedElement.barElement).toBe(barElement);
    expect(tabWindow.selectedElement.tabLineElement).toBe(tabLineElement);
  });

  test("Selected element move left test: any chord", () => {
    // Select note element
    const tabLineElement = tabWindow.tabLineElements[0];
    const barElement = tabLineElement.barElements[0];
    const chordElement = barElement.chordElements[1];
    const noteElement = chordElement.noteElements[5];
    tabWindow.selectNoteElement(
      noteElement,
      chordElement,
      barElement,
      tabLineElement
    );

    // Create expected result
    const newSelectedChordElement = barElement.chordElements[0];
    const newSelectedNoteElement = newSelectedChordElement.noteElements[5];

    // Move selected note up
    tabWindow.moveSelectedNoteLeft();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(newSelectedNoteElement);
    expect(tabWindow.selectedElement.chordElement).toBe(
      newSelectedChordElement
    );
    expect(tabWindow.selectedElement.barElement).toBe(barElement);
    expect(tabWindow.selectedElement.tabLineElement).toBe(tabLineElement);
  });

  test("Selected element move left test: 0th chord in not first bar", () => {
    // Select note element
    const tabLineElement = tabWindow.tabLineElements[0];
    const barElement = tabLineElement.barElements[1];
    const chordElement = barElement.chordElements[0];
    const noteElement = chordElement.noteElements[5];
    tabWindow.selectNoteElement(
      noteElement,
      chordElement,
      barElement,
      tabLineElement
    );

    // Create expected result
    const newSelectedBarElement = tabLineElement.barElements[0];
    const newSelectedChordElement =
      newSelectedBarElement.chordElements[barElement.chordElements.length - 1];
    const newSelectedNoteElement = newSelectedChordElement.noteElements[5];

    // Move selected note up
    tabWindow.moveSelectedNoteLeft();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(newSelectedNoteElement);
    expect(tabWindow.selectedElement.chordElement).toBe(
      newSelectedChordElement
    );
    expect(tabWindow.selectedElement.barElement).toBe(newSelectedBarElement);
    expect(tabWindow.selectedElement.tabLineElement).toBe(tabLineElement);
  });

  test("Selected element move left test: 0th chord in first bar in not first tab line", () => {
    // Select note element
    const tabLineElement = tabWindow.tabLineElements[1];
    const barElement = tabLineElement.barElements[0];
    const chordElement = barElement.chordElements[0];
    const noteElement = chordElement.noteElements[5];
    tabWindow.selectNoteElement(
      noteElement,
      chordElement,
      barElement,
      tabLineElement
    );

    // Create expected result
    const newTabLineElement = tabWindow.tabLineElements[0];
    const newSelectedBarElement =
      newTabLineElement.barElements[newTabLineElement.barElements.length - 1];
    const newSelectedChordElement =
      newSelectedBarElement.chordElements[barElement.chordElements.length - 1];
    const newSelectedNoteElement = newSelectedChordElement.noteElements[5];

    // Move selected note up
    tabWindow.moveSelectedNoteLeft();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(newSelectedNoteElement);
    expect(tabWindow.selectedElement.chordElement).toBe(
      newSelectedChordElement
    );
    expect(tabWindow.selectedElement.barElement).toBe(newSelectedBarElement);
    expect(tabWindow.selectedElement.tabLineElement).toBe(newTabLineElement);
  });

  test("Selected element move left test: 0th chord in first bar in first tab line", () => {
    // Select note element
    const tabLineElement = tabWindow.tabLineElements[0];
    const barElement = tabLineElement.barElements[0];
    const chordElement = barElement.chordElements[0];
    const noteElement = chordElement.noteElements[5];
    tabWindow.selectNoteElement(
      noteElement,
      chordElement,
      barElement,
      tabLineElement
    );

    // Expected result is nothing changing
    // Move selected note up
    tabWindow.moveSelectedNoteLeft();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(noteElement);
    expect(tabWindow.selectedElement.chordElement).toBe(chordElement);
    expect(tabWindow.selectedElement.barElement).toBe(barElement);
    expect(tabWindow.selectedElement.tabLineElement).toBe(tabLineElement);
  });

  test("Selected element move right test: any chord", () => {
    // Select note element
    const tabLineElement = tabWindow.tabLineElements[0];
    const barElement = tabLineElement.barElements[0];
    const chordElement = barElement.chordElements[0];
    const noteElement = chordElement.noteElements[5];
    tabWindow.selectNoteElement(
      noteElement,
      chordElement,
      barElement,
      tabLineElement
    );

    // Create expected result
    const newSelectedChordElement = barElement.chordElements[1];
    const newSelectedNoteElement = newSelectedChordElement.noteElements[5];

    // Move selected note up
    tabWindow.moveSelectedNoteRight();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(newSelectedNoteElement);
    expect(tabWindow.selectedElement.chordElement).toBe(
      newSelectedChordElement
    );
    expect(tabWindow.selectedElement.barElement).toBe(barElement);
    expect(tabWindow.selectedElement.tabLineElement).toBe(tabLineElement);
  });

  test("Selected element move right test: last chord in not last bar", () => {
    // Select note element
    const tabLineElement = tabWindow.tabLineElements[0];
    const barElement = tabLineElement.barElements[0];
    const chordElement =
      barElement.chordElements[barElement.chordElements.length - 1];
    const noteElement = chordElement.noteElements[5];
    tabWindow.selectNoteElement(
      noteElement,
      chordElement,
      barElement,
      tabLineElement
    );

    // Create expected result
    const newSelectedBarElement = tabLineElement.barElements[1];
    const newSelectedChordElement = newSelectedBarElement.chordElements[0];
    const newSelectedNoteElement = newSelectedChordElement.noteElements[5];

    // Move selected note up
    tabWindow.moveSelectedNoteRight();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(newSelectedNoteElement);
    expect(tabWindow.selectedElement.chordElement).toBe(
      newSelectedChordElement
    );
    expect(tabWindow.selectedElement.barElement).toBe(newSelectedBarElement);
    expect(tabWindow.selectedElement.tabLineElement).toBe(tabLineElement);
  });

  test("Selected element move right test: last chord in last bar in not last line", () => {
    // Select note element
    const tabLineElement = tabWindow.tabLineElements[0];
    const barElement =
      tabLineElement.barElements[tabLineElement.barElements.length - 1];
    const chordElement =
      barElement.chordElements[barElement.chordElements.length - 1];
    const noteElement = chordElement.noteElements[5];
    tabWindow.selectNoteElement(
      noteElement,
      chordElement,
      barElement,
      tabLineElement
    );

    // Create expected result
    const newTabLineElement = tabWindow.tabLineElements[1];
    const newSelectedBarElement = newTabLineElement.barElements[0];
    const newSelectedChordElement = newSelectedBarElement.chordElements[0];
    const newSelectedNoteElement = newSelectedChordElement.noteElements[5];

    // Move selected note up
    tabWindow.moveSelectedNoteRight();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(newSelectedNoteElement);
    expect(tabWindow.selectedElement.chordElement).toBe(
      newSelectedChordElement
    );
    expect(tabWindow.selectedElement.barElement).toBe(newSelectedBarElement);
    expect(tabWindow.selectedElement.tabLineElement).toBe(newTabLineElement);
  });

  test("Selected element move right test: last chord in last bar in last line, new bar", () => {
    // Select note element
    const tabLineElement = tabWindow.tabLineElements[1];
    const barElement =
      tabLineElement.barElements[tabLineElement.barElements.length - 1];
    const chordElement =
      barElement.chordElements[barElement.chordElements.length - 1];
    const noteElement = chordElement.noteElements[5];
    tabWindow.selectNoteElement(
      noteElement,
      chordElement,
      barElement,
      tabLineElement
    );

    // Move selected note up (one note right in this case should be a new bar)
    tabWindow.moveSelectedNoteRight();

    // Expected result is a new bar/tab line element
    const newSelectedBarElement =
      tabLineElement.barElements[tabLineElement.barElements.length - 1];
    const newSelectedChordElement = newSelectedBarElement.chordElements[0];
    const newSelectedNoteElement = newSelectedChordElement.noteElements[5];

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(newSelectedNoteElement);
    expect(tabWindow.selectedElement.chordElement).toBe(
      newSelectedChordElement
    );
    expect(tabWindow.selectedElement.barElement).toBe(newSelectedBarElement);
    expect(tabWindow.selectedElement.tabLineElement).toBe(tabLineElement);
  });

  test("Selected element move right test: last chord in last bar in last line, new tab line", () => {
    // Select note element
    const tabLineElement = tabWindow.tabLineElements[1];
    const barElement =
      tabLineElement.barElements[tabLineElement.barElements.length - 1];
    const chordElement =
      barElement.chordElements[barElement.chordElements.length - 1];
    const noteElement = chordElement.noteElements[5];
    tabWindow.selectNoteElement(
      noteElement,
      chordElement,
      barElement,
      tabLineElement
    );

    // Move note to the right until a new tab line is created
    while (tabWindow.tabLineElements.length !== 3) {
      tabWindow.moveSelectedNoteRight();
    }

    // Expected result is a new bar/tab line element
    const newTabLineElement =
      tabWindow.tabLineElements[tabWindow.tabLineElements.length - 1];
    const newSelectedBarElement = newTabLineElement.barElements[0];
    const newSelectedChordElement = newSelectedBarElement.chordElements[0];
    const newSelectedNoteElement = newSelectedChordElement.noteElements[5];

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(newSelectedNoteElement);
    expect(tabWindow.selectedElement.chordElement).toBe(
      newSelectedChordElement
    );
    expect(tabWindow.selectedElement.barElement).toBe(newSelectedBarElement);
    expect(tabWindow.selectedElement.tabLineElement).toBe(newTabLineElement);
  });
});
