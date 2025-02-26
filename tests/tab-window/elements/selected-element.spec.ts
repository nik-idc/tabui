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
import { SelectedElementWindowIds } from "../../../src/tab-window/tab-window";

import { createBasicTabWindow } from "../../../test-render/test-cases";

describe("Selected element tests", () => {
  test("Selected element move up test: any string", () => {
    const tabWindow = createBasicTabWindow();

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
    const ids = tabWindow.getSelectedNoteElementIds();
    //  Check if selected note actually moved up
    expect(ids.stringNum).toBe(newSelectedNoteElementId + 1);
    //  Sanity tests
    expect(ids.chordElementId).toBe(chordElementId);
    expect(ids.barElementId).toBe(tabLineElementId);
    expect(ids.tabLineElementId).toBe(barElementId);
  });

  test("Selected element move up test: 0th string", () => {
    const tabWindow = createBasicTabWindow();

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
    const ids = tabWindow.getSelectedNoteElementIds();
    //  Check if selected note actually moved up
    expect(ids.stringNum).toBe(newSelectedNoteElementId + 1);
    //  Sanity tests
    expect(ids.chordElementId).toBe(chordElementId);
    expect(ids.barElementId).toBe(tabLineElementId);
    expect(ids.tabLineElementId).toBe(barElementId);
  });

  test("Selected element move down test: any string", () => {
    const tabWindow = createBasicTabWindow();

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
    const ids = tabWindow.getSelectedNoteElementIds();
    //  Check if selected note actually moved down
    expect(ids.stringNum).toBe(newSelectedNoteElementId + 1);
    //  Sanity tests
    expect(ids.chordElementId).toBe(chordElementId);
    expect(ids.barElementId).toBe(tabLineElementId);
    expect(ids.tabLineElementId).toBe(barElementId);
  });

  test("Selected element move down test: 0th string", () => {
    const tabWindow = createBasicTabWindow();
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
    const ids = tabWindow.getSelectedNoteElementIds();
    //  Check if selected note actually moved down
    expect(ids.stringNum).toBe(newSelectedNoteElementId + 1);
    //  Sanity tests
    expect(ids.chordElementId).toBe(chordElementId);
    expect(ids.barElementId).toBe(tabLineElementId);
    expect(ids.tabLineElementId).toBe(barElementId);
  });

  test("Selected element move left test: any chord", () => {
    const tabWindow = createBasicTabWindow();
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
    const ids = tabWindow.getSelectedNoteElementIds();
    //  Check if selected note actually moved left
    expect(ids.stringNum).toBe(newSelectedNoteElementId + 1);
    expect(ids.chordElementId).toBe(newSelectedChordElementId);
    //  Sanity tests
    expect(ids.barElementId).toBe(tabLineElementId);
    expect(ids.tabLineElementId).toBe(barElementId);
  });

  test("Selected element move left test: 0th chord in not first bar", () => {
    const tabWindow = createBasicTabWindow();
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
    const newSelectedChordElementId = 3;
    const newSelectedNoteElementId = 5;

    // Move selected note up
    tabWindow.moveSelectedNoteLeft();

    // Test
    const ids = tabWindow.getSelectedNoteElementIds();
    //  Check if selected note actually moved left
    expect(ids.stringNum).toBe(newSelectedNoteElementId + 1);
    expect(ids.chordElementId).toBe(newSelectedChordElementId);
    expect(ids.barElementId).toBe(newSelectedBarElementId);
    //  Sanity tests
    expect(ids.tabLineElementId).toBe(tabLineElementId);
  });

  test("Selected element move left test: 0th chord in first bar in not first tab line", () => {
    const tabWindow = createBasicTabWindow();
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
    const newSelectedBarElementId = 4;
    const newSelectedChordElementId = 3;
    const newSelectedNoteElementId = 5;

    // Move selected note up
    tabWindow.moveSelectedNoteLeft();

    // Test
    const ids = tabWindow.getSelectedNoteElementIds();
    //  Check if selected note actually moved left
    expect(ids.stringNum).toBe(newSelectedNoteElementId + 1);
    expect(ids.chordElementId).toBe(newSelectedChordElementId);
    expect(ids.barElementId).toBe(newSelectedBarElementId);
    expect(ids.tabLineElementId).toBe(newTabLineElementId);
  });

  test("Selected element move left test: 0th chord in first bar in first tab line", () => {
    const tabWindow = createBasicTabWindow();
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
    const ids = tabWindow.getSelectedNoteElementIds();
    //  Check if selected note actually didn't change
    expect(ids.stringNum).toBe(noteElementId + 1);
    expect(ids.chordElementId).toBe(chordElementId);
    expect(ids.barElementId).toBe(barElementId);
    expect(ids.tabLineElementId).toBe(tabLineElementId);
  });

  test("Selected element move right test: any chord", () => {
    const tabWindow = createBasicTabWindow();
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
    const ids = tabWindow.getSelectedNoteElementIds();
    //  Check if selected note actually moved right
    expect(ids.stringNum).toBe(newSelectedNoteElementId + 1);
    expect(ids.chordElementId).toBe(newSelectedChordElementId);
    //  Sanity tests
    expect(ids.barElementId).toBe(barElementId);
    expect(ids.tabLineElementId).toBe(barElementId);
  });

  test("Selected element move right test: last chord in not last bar", () => {
    const tabWindow = createBasicTabWindow();
    // Select note element
    const tabLineElementId = 0;
    const barElementId = 0;
    const chordElementId = 3;
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
    const ids = tabWindow.getSelectedNoteElementIds();
    //  Check if selected note actually moved right
    expect(ids.stringNum).toBe(newSelectedNoteElementId + 1);
    expect(ids.chordElementId).toBe(newSelectedChordElementId);
    expect(ids.barElementId).toBe(newSelectedBarElementId);
    //  Sanity tests
    expect(ids.tabLineElementId).toBe(barElementId);
  });

  test("Selected element move right test: last chord in last bar in not last line", () => {
    const tabWindow = createBasicTabWindow();
    // Select note element
    const tabLineElementId = 0;
    const barElementId = 4;
    const chordElementId = 3;
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
    const ids = tabWindow.getSelectedNoteElementIds();
    //  Check if selected note actually moved right
    expect(ids.stringNum).toBe(newSelectedNoteElementId + 1);
    expect(ids.chordElementId).toBe(newSelectedChordElementId);
    expect(ids.barElementId).toBe(newSelectedBarElementId);
    expect(ids.tabLineElementId).toBe(newTabLineElementId);
  });

  test("Selected element move right test: last chord in last bar in last line, new bar", () => {
    const tabWindow = createBasicTabWindow();

    tabWindow.tab.bars.splice(tabWindow.tab.bars.length - 1, 1);
    tabWindow.calc();

    // Select note element
    const tabLineElementId = 1;
    const barElementId = 3;
    const chordElementId = 3;
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
    const newTabLineElementId = 1;
    const newSelectedBarElementId = 4;
    const newSelectedChordElementId = 0;
    const newSelectedNoteElementId = 5;

    // Test
    const ids = tabWindow.getSelectedNoteElementIds();
    //  Check if selected note actually moved right
    expect(ids.stringNum).toBe(newSelectedNoteElementId + 1);
    expect(ids.chordElementId).toBe(newSelectedChordElementId);
    expect(ids.barElementId).toBe(newSelectedBarElementId);
    expect(ids.tabLineElementId).toBe(newTabLineElementId);
  });

  test("Selected element move right test: last chord in last bar in last line, new tab line", () => {
    const tabWindow = createBasicTabWindow();
    // Select note element
    const tabLineElementId = 1;
    const barElementId = 4;
    const chordElementId = 3;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Move notes to the right until a new tab line is created
    tabWindow.moveSelectedNoteRight();
    tabWindow.moveSelectedNoteRight();
    tabWindow.moveSelectedNoteRight();
    tabWindow.moveSelectedNoteRight();
    tabWindow.moveSelectedNoteRight();

    // Expected result is a new bar/tab line element
    const newTabLineElementId = 2;
    const newSelectedBarElementId = 1;
    const newSelectedChordElementId = 0;
    const newSelectedNoteElementId = 5;

    // Test
    const ids = tabWindow.getSelectedNoteElementIds();
    //  Check if selected note actually moved right
    expect(ids.stringNum).toBe(newSelectedNoteElementId + 1);
    expect(ids.chordElementId).toBe(newSelectedChordElementId);
    expect(ids.barElementId).toBe(newSelectedBarElementId);
    expect(ids.tabLineElementId).toBe(newTabLineElementId);
  });
});
