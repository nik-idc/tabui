import { testData } from "./../../test-render/test-cases";

describe("Tab window tests", () => {
  test("Tab window calc test: calc bar elements, test case 1", () => {
    const expectedBarElementLinesCount = 2;
    const expectedLine1BarCount = 5;
    const expectedLine2BarCount = 1;

    // Test
    expect(testData.tabWindows[0].barElementLines.length).toBe(
      expectedBarElementLinesCount
    );
    expect(testData.tabWindows[0].barElementLines[0].length).toBe(
      expectedLine1BarCount
    );
    expect(testData.tabWindows[0].barElementLines[1].length).toBe(
      expectedLine2BarCount
    );
  });

  test("Tab window calc test: calc bar elements, test case 2", () => {
    const expectedBarElementLinesCount = 1;
    const expectedLine1BarCount = 1;

    // Test
    expect(testData.tabWindows[1].barElementLines.length).toBe(
      expectedBarElementLinesCount
    );
    expect(testData.tabWindows[1].barElementLines[0].length).toBe(
      expectedLine1BarCount
    );
  });

  test("Tab window calc test: calc bar elements, test case 3", () => {
    const expectedBarElementLinesCount = 3;
    const expectedLine1BarCount = 5;
    const expectedLine2BarCount = 4;
    const expectedLine3BarCount = 4;

    // Test
    expect(testData.tabWindows[2].barElementLines.length).toBe(
      expectedBarElementLinesCount
    );
    expect(testData.tabWindows[2].barElementLines[0].length).toBe(
      expectedLine1BarCount
    );
    expect(testData.tabWindows[2].barElementLines[1].length).toBe(
      expectedLine2BarCount
    );
    expect(testData.tabWindows[2].barElementLines[2].length).toBe(
      expectedLine3BarCount
    );
  });

  test("Tab window calc test: calc bar elements, test case 4", () => {
    const expectedBarElementLinesCount = 20;
    const expectedLineBarCount = 5;

    // Test
    expect(testData.tabWindows[3].barElementLines.length).toBe(
      expectedBarElementLinesCount
    );
    for (const barElementLine of testData.tabWindows[3].barElementLines) {
      expect(barElementLine.length).toBe(expectedLineBarCount);
    }
  });

  test("Tab window select note element test", () => {
    const basicTabWindow = testData.createBasicTabWindow();

    const barElementsLineId = 0;
    const barElementId = 1;
    const chordElementId = 0;
    const noteElementId = 3;
    basicTabWindow.selectNoteElement(
      barElementsLineId,
      barElementId,
      chordElementId,
      noteElementId
    );

    // Test
    expect(basicTabWindow.selectionElements.length).toBe(0);
    expect(basicTabWindow.selectedElement.barElementsLineId).toBe(
      barElementsLineId
    );
    expect(basicTabWindow.selectedElement.barElementId).toBe(barElementId);
    expect(basicTabWindow.selectedElement.chordElementId).toBe(chordElementId);
    expect(basicTabWindow.selectedElement.noteElementId).toBe(noteElementId);
    expect(basicTabWindow.selectedElement.noteElement.isSelected).toBe(true);
  });

  test("Tab window select chord test", () => {
    const basicTabWindow = testData.createBasicTabWindow();

    const barElementsLineId = 0;
    const barElementId = 1;
    const chordElementId = 0;
    basicTabWindow.selectChord(barElementsLineId, barElementId, chordElementId);

    // Test
    expect(basicTabWindow.selectionElements.length).toBe(1);
    expect(basicTabWindow.selectionElements[0].barElementsLineId).toBe(0);
    expect(basicTabWindow.selectionElements[0].barElementId).toBe(1);
    expect(basicTabWindow.selectionElements[0].chordElementId).toBe(0);
    expect(basicTabWindow.selectionElements[0].chordElement.inSelection).toBe(
      true
    );
    expect(basicTabWindow.selectedElement).toBe(undefined);
  });

  test("Tab window insert chords test", () => {
    const basicTabWindow = testData.createBasicTabWindow();

    basicTabWindow.selectChord(0, 1, 0);
    basicTabWindow.selectChord(0, 1, 1);
    basicTabWindow.selectChord(0, 1, 2);
    const insertChordId = 2;

    basicTabWindow.insertChordsAt(0, 1, insertChordId);

    // Test
    for (let i = 0; i < 3; i++) {
      expect(basicTabWindow.barElementLines[0][1].chordElements[i].chord).toBe(
        basicTabWindow.barElementLines[0][1].chordElements[i + 3].chord
      );
    }
  });
});
