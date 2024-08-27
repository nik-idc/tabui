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
    const expectedBarElementLinesCount = 60;
    const expectedLineBarCount = 5;

    // Test
    expect(testData.tabWindows[3].barElementLines.length).toBe(
      expectedBarElementLinesCount
    );
    for (const barElementLine of testData.tabWindows[3].barElementLines) {
      expect(barElementLine.length).toBe(expectedLineBarCount);
    }
  });
});
