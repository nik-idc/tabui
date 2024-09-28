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

import { createBasicTabWindow } from "../../../test-render/test-cases";

describe("Selected element tests", () => {
  test("Selected element move up test: any string", () => {
    const tabWindow = createBasicTabWindow();

    // Select note element
    const barElementsLineId = 0;
    const barElementId = 0;
    const chordElementId = 1;
    const noteElementId = 4;
    tabWindow.selectNoteElement(
      barElementsLineId,
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
      tabWindow.barElementLines[barElementsLineId][barElementId].chordElements[
        chordElementId
      ].noteElements[newSelectedNoteElementId]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId].chordElements[
        chordElementId
      ]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId]
    );
    expect(tabWindow.selectedElement.barElementsLine).toBe(
      tabWindow.barElementLines[barElementsLineId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(chordElementId);
    expect(tabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(tabWindow.selectedElement.barElementsLineId).toBe(barElementsLineId);
  });

  test("Selected element move up test: 0th string", () => {
    const tabWindow = createBasicTabWindow();

    // Select note element
    const barElementsLineId = 0;
    const barElementId = 0;
    const chordElementId = 1;
    const noteElementId = 0;
    tabWindow.selectNoteElement(
      barElementsLineId,
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
      tabWindow.barElementLines[barElementsLineId][barElementId].chordElements[
        chordElementId
      ].noteElements[newSelectedNoteElementId]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId].chordElements[
        chordElementId
      ]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId]
    );
    expect(tabWindow.selectedElement.barElementsLine).toBe(
      tabWindow.barElementLines[barElementsLineId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(chordElementId);
    expect(tabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(tabWindow.selectedElement.barElementsLineId).toBe(barElementsLineId);
  });

  test("Selected element move down test: any string", () => {
    const tabWindow = createBasicTabWindow();

    // Select note element
    const barElementsLineId = 0;
    const barElementId = 0;
    const chordElementId = 1;
    const noteElementId = 4;
    tabWindow.selectNoteElement(
      barElementsLineId,
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
      tabWindow.barElementLines[barElementsLineId][barElementId].chordElements[
        chordElementId
      ].noteElements[newSelectedNoteElementId]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId].chordElements[
        chordElementId
      ]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId]
    );
    expect(tabWindow.selectedElement.barElementsLine).toBe(
      tabWindow.barElementLines[barElementsLineId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(chordElementId);
    expect(tabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(tabWindow.selectedElement.barElementsLineId).toBe(barElementsLineId);
  });

  test("Selected element move down test: 0th string", () => {
    const tabWindow = createBasicTabWindow();
    // Select note element
    const barElementsLineId = 0;
    const barElementId = 0;
    const chordElementId = 1;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      barElementsLineId,
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
      tabWindow.barElementLines[barElementsLineId][barElementId].chordElements[
        chordElementId
      ].noteElements[newSelectedNoteElementId]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId].chordElements[
        chordElementId
      ]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId]
    );
    expect(tabWindow.selectedElement.barElementsLine).toBe(
      tabWindow.barElementLines[barElementsLineId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(chordElementId);
    expect(tabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(tabWindow.selectedElement.barElementsLineId).toBe(barElementsLineId);
  });

  test("Selected element move left test: any chord", () => {
    const tabWindow = createBasicTabWindow();
    // Select note element
    const barElementsLineId = 0;
    const barElementId = 0;
    const chordElementId = 1;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      barElementsLineId,
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
      tabWindow.barElementLines[barElementsLineId][barElementId].chordElements[
        newSelectedChordElementId
      ].noteElements[newSelectedNoteElementId]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId].chordElements[
        newSelectedChordElementId
      ]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId]
    );
    expect(tabWindow.selectedElement.barElementsLine).toBe(
      tabWindow.barElementLines[barElementsLineId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(
      newSelectedChordElementId
    );
    expect(tabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(tabWindow.selectedElement.barElementsLineId).toBe(barElementsLineId);
  });

  test("Selected element move left test: 0th chord in not first bar", () => {
    const tabWindow = createBasicTabWindow();
    // Select note element
    const barElementsLineId = 0;
    const barElementId = 1;
    const chordElementId = 0;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      barElementsLineId,
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
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.barElementLines[barElementsLineId][newSelectedBarElementId]
        .chordElements[newSelectedChordElementId].noteElements[
        newSelectedNoteElementId
      ]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.barElementLines[barElementsLineId][newSelectedBarElementId]
        .chordElements[newSelectedChordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.barElementLines[barElementsLineId][newSelectedBarElementId]
    );
    expect(tabWindow.selectedElement.barElementsLine).toBe(
      tabWindow.barElementLines[barElementsLineId]
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
    expect(tabWindow.selectedElement.barElementsLineId).toBe(barElementsLineId);
  });

  test("Selected element move left test: 0th chord in first bar in not first tab line", () => {
    const tabWindow = createBasicTabWindow();
    // Select note element
    const barElementsLineId = 1;
    const barElementId = 0;
    const chordElementId = 0;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      barElementsLineId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Create expected result
    const newBarElementsLineId = 0;
    const newSelectedBarElementId = 4;
    const newSelectedChordElementId = 3;
    const newSelectedNoteElementId = 5;

    // Move selected note up
    tabWindow.moveSelectedNoteLeft();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.barElementLines[newBarElementsLineId][newSelectedBarElementId]
        .chordElements[newSelectedChordElementId].noteElements[
        newSelectedNoteElementId
      ]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.barElementLines[newBarElementsLineId][newSelectedBarElementId]
        .chordElements[newSelectedChordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.barElementLines[newBarElementsLineId][newSelectedBarElementId]
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
    expect(tabWindow.selectedElement.barElementsLineId).toBe(
      newBarElementsLineId
    );
  });

  test("Selected element move left test: 0th chord in first bar in first tab line", () => {
    const tabWindow = createBasicTabWindow();
    // Select note element
    const barElementsLineId = 0;
    const barElementId = 0;
    const chordElementId = 0;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      barElementsLineId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Expected result is nothing changing
    // Move selected note up
    tabWindow.moveSelectedNoteLeft();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId].chordElements[
        chordElementId
      ].noteElements[noteElementId]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId].chordElements[
        chordElementId
      ]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId]
    );
    expect(tabWindow.selectedElement.barElementsLine).toBe(
      tabWindow.barElementLines[barElementsLineId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(noteElementId);
    expect(tabWindow.selectedElement.chordElementId).toBe(chordElementId);
    expect(tabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(tabWindow.selectedElement.barElementsLineId).toBe(barElementsLineId);
  });

  test("Selected element move right test: any chord", () => {
    const tabWindow = createBasicTabWindow();
    // Select note element
    const barElementsLineId = 0;
    const barElementId = 0;
    const chordElementId = 0;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      barElementsLineId,
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
      tabWindow.barElementLines[barElementsLineId][barElementId].chordElements[
        newSelectedChordElementId
      ].noteElements[newSelectedNoteElementId]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId].chordElements[
        newSelectedChordElementId
      ]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.barElementLines[barElementsLineId][barElementId]
    );
    expect(tabWindow.selectedElement.barElementsLine).toBe(
      tabWindow.barElementLines[barElementsLineId]
    );
    expect(tabWindow.selectedElement.noteElementId).toBe(
      newSelectedNoteElementId
    );
    expect(tabWindow.selectedElement.chordElementId).toBe(
      newSelectedChordElementId
    );
    expect(tabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(tabWindow.selectedElement.barElementsLineId).toBe(barElementsLineId);
  });

  test("Selected element move right test: last chord in not last bar", () => {
    const tabWindow = createBasicTabWindow();
    // Select note element
    const barElementsLineId = 0;
    const barElementId = 0;
    const chordElementId = 3;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      barElementsLineId,
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
      tabWindow.barElementLines[barElementsLineId][newSelectedBarElementId]
        .chordElements[newSelectedChordElementId].noteElements[
        newSelectedNoteElementId
      ]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.barElementLines[barElementsLineId][newSelectedBarElementId]
        .chordElements[newSelectedChordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.barElementLines[barElementsLineId][newSelectedBarElementId]
    );
    expect(tabWindow.selectedElement.barElementsLine).toBe(
      tabWindow.barElementLines[barElementsLineId]
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
    expect(tabWindow.selectedElement.barElementsLineId).toBe(barElementsLineId);
  });

  test("Selected element move right test: last chord in last bar in not last line", () => {
    const tabWindow = createBasicTabWindow();
    // Select note element
    const barElementsLineId = 0;
    const barElementId = 4;
    const chordElementId = 3;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      barElementsLineId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Create expected result
    const newBarElementsLineId = 1;
    const newSelectedBarElementId = 0;
    const newSelectedChordElementId = 0;
    const newSelectedNoteElementId = 5;

    // Move selected note up
    tabWindow.moveSelectedNoteRight();

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.barElementLines[newBarElementsLineId][newSelectedBarElementId]
        .chordElements[newSelectedChordElementId].noteElements[
        newSelectedNoteElementId
      ]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.barElementLines[newBarElementsLineId][newSelectedBarElementId]
        .chordElements[newSelectedChordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.barElementLines[newBarElementsLineId][newSelectedBarElementId]
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
    expect(tabWindow.selectedElement.barElementsLineId).toBe(
      newBarElementsLineId
    );
  });

  test("Selected element move right test: last chord in last bar in last line, new bar", () => {
    const tabWindow = createBasicTabWindow();

    tabWindow.tab.bars.splice(tabWindow.tab.bars.length - 1, 1);
    tabWindow.calc();

    // Select note element
    const barElementsLineId = 1;
    const barElementId = 3;
    const chordElementId = 3;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      barElementsLineId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Move selected note up (one note right in this case should be a new bar)
    tabWindow.moveSelectedNoteRight();

    // Expected result is a new bar/tab line element
    const newBarElementsLineId = 1;
    const newSelectedBarElementId = 4;
    const newSelectedChordElementId = 0;
    const newSelectedNoteElementId = 5;

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.barElementLines[newBarElementsLineId][newSelectedBarElementId]
        .chordElements[newSelectedChordElementId].noteElements[
        newSelectedNoteElementId
      ]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.barElementLines[newBarElementsLineId][newSelectedBarElementId]
        .chordElements[newSelectedChordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.barElementLines[newBarElementsLineId][newSelectedBarElementId]
    );
    expect(tabWindow.selectedElement.barElementsLine).toBe(
      tabWindow.barElementLines[newBarElementsLineId]
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
    expect(tabWindow.selectedElement.barElementsLineId).toBe(barElementsLineId);
  });

  test("Selected element move right test: last chord in last bar in last line, new tab line", () => {
    const tabWindow = createBasicTabWindow();
    // Select note element
    const barElementsLineId = 1;
    const barElementId = 4;
    const chordElementId = 3;
    const noteElementId = 5;
    tabWindow.selectNoteElement(
      barElementsLineId,
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
    const newBarElementsLineId = 2;
    const newSelectedBarElementId = 1;
    const newSelectedChordElementId = 0;
    const newSelectedNoteElementId = 5;

    // Test
    expect(tabWindow.selectedElement.noteElement).toBe(
      tabWindow.barElementLines[newBarElementsLineId][newSelectedBarElementId]
        .chordElements[newSelectedChordElementId].noteElements[
        newSelectedNoteElementId
      ]
    );
    expect(tabWindow.selectedElement.chordElement).toBe(
      tabWindow.barElementLines[newBarElementsLineId][newSelectedBarElementId]
        .chordElements[newSelectedChordElementId]
    );
    expect(tabWindow.selectedElement.barElement).toBe(
      tabWindow.barElementLines[newBarElementsLineId][newSelectedBarElementId]
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
    expect(tabWindow.selectedElement.barElementsLineId).toBe(
      newBarElementsLineId
    );
  });
});
