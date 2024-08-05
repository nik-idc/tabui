import {
  Bar,
  BarElement,
  Chord,
  ChordElement,
  Guitar,
  GuitarNote,
  Note,
  NoteDuration,
  NoteElement,
  Point,
  Rect,
  Tab,
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

const width = 1200;
const noteTextSize = 12;
const durationsHeight = 50;
const dim = new TabWindowDim(width, noteTextSize, durationsHeight, stringsCount);

describe("Tab line element tests", () => {
  test("Tab element fits test: should fit", () => {
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, true, true);

    const tabLineCoords = new Point(0, 0);
    const tabLineElement = new TabLineElement(dim, tabLineCoords);

    // Check if fits
    const result = tabLineElement.barElementFits(barElement);

    // Test
    expect(result).toBe(true);
  });

  test("Tab element fits test: should not fit", () => {
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, true, true);
    barElement.scaleBarHorBy(20);

    const tabLineCoords = new Point(0, 0);
    const tabLineElement = new TabLineElement(dim, tabLineCoords);

    // Check if fits
    const result = tabLineElement.barElementFits(barElement);

    // Test
    expect(result).toBe(false);
  });

  test("Insert bar test: result true", () => {
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, true, true);

    const tabLineCoords = new Point(0, 0);
    const tabLineElement = new TabLineElement(dim, tabLineCoords);

    // Insert the bar
    const result = tabLineElement.insertBar(bar);

    // Test
    expect(result).toBe(true);
    expect(tabLineElement.barElements.length).toBe(1);
  });

  // test("Insert bar test: result false", () => {
  //   const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
  //     new Chord(guitar, NoteDuration.Quarter),
  //     new Chord(guitar, NoteDuration.Quarter),
  //     new Chord(guitar, NoteDuration.Quarter),
  //     new Chord(guitar, NoteDuration.Quarter),
  //   ]);
  //   const barCoords = new Point(0, 0);
  //   const dim = new TabWindowDim(90 * 2 + 10, 12, 12, 6);
  //   const barElement = new BarElement(dim, barCoords, bar, true, true);

  //   const tabLineCoords = new Point(0, 0);
  //   const tabLineElement = new TabLineElement(dim, tabLineCoords);

  //   // Insert 3 bars
  //   const results: boolean[] = [];
  //   results.push(tabLineElement.insertBar(bar));
  //   results.push(tabLineElement.insertBar(bar));
  //   results.push(tabLineElement.insertBar(bar));

  //   // Test
  //   expect(results).toStrictEqual([true, true, false]);
  //   expect(tabLineElement.barElements.length).toBe(2);
  // });

  // test("Justify bars test", () => {
  //   const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
  //     new Chord(guitar, NoteDuration.Quarter),
  //     new Chord(guitar, NoteDuration.Quarter),
  //     new Chord(guitar, NoteDuration.Quarter),
  //     new Chord(guitar, NoteDuration.Quarter),
  //   ]);
  //   const barCoords = new Point(0, 0);
  //   const barElement = new BarElement(dim, barCoords, bar, true, true);

  //   const tabLineCoords = new Point(0, 0);
  //   const tabLineElement = new TabLineElement(dim, tabLineCoords);

  //   // Insert 4 bars
  //   tabLineElement.insertBar(bar);
  //   tabLineElement.insertBar(bar);
  //   tabLineElement.insertBar(bar);
  //   tabLineElement.insertBar(bar);

  //   // Get before-justify width of bars
  //   let beforeWidth = 0;
  //   const beforeWidths: number[] = [];
  //   for (const barElement of tabLineElement.barElements) {
  //     beforeWidth += barElement.rect.width;
  //     beforeWidths.push(barElement.rect.width);
  //   }
  //   let gapWidth = dim.width - beforeWidth;

  //   // Justify
  //   tabLineElement.justifyBars();

  //   // Get after-justify width of bars
  //   let afterWidth = 0;
  //   const afterWidths: number[] = [];
  //   for (const barElement of tabLineElement.barElements) {
  //     afterWidth += barElement.rect.width;
  //     afterWidths.push(barElement.rect.width);
  //   }

  //   // Scale of justifying
  //   const scale = afterWidth / beforeWidth;

  //   expect(afterWidth).toBeGreaterThan(beforeWidth);
  //   expect(afterWidth).toBe(dim.width);
  //   expect(afterWidth).toBe(tabLineElement.rect.width);
  //   for (let i = 0; i < tabLineElement.barElements.length; i++) {
  //     expect(afterWidths[i]).toBe(beforeWidths[i] * scale);
  //   }
  // });
});
