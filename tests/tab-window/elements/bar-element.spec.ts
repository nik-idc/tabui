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

const stringsCount = 6;
const fretsCount = 24;
const guitar = new Guitar(
  stringsCount,
  [Note.E, Note.B, Note.G, Note.D, Note.A, Note.E],
  fretsCount
);

const width = 1200;
const minNoteSize = 12;
const gap = 10;
const durationsHeight = 50;
const dim = new TabWindowDim(
  width,
  minNoteSize,
  gap,
  durationsHeight,
  stringsCount
);

describe("Bar element tests", () => {
  describe("Bar element calc test", () => {
    // Expected width ratios where all of these
    // are multiplied by min note size
    const chords = [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, chords);
    const barCoords = new Point(0, 0);
    const regularBarElement = new BarElement(dim, barCoords, bar, false, false);
    const tempoBarElement = new BarElement(dim, barCoords, bar, false, true);
    const signBarElement = new BarElement(dim, barCoords, bar, true, false);
    const bothBarElement = new BarElement(dim, barCoords, bar, true, true);

    const cases = [
      { barElement: regularBarElement, name: "Regular (show none)" },
      { barElement: tempoBarElement, name: "Show tempo" },
      { barElement: signBarElement, name: "Show signature" },
      { barElement: bothBarElement, name: "Show both" },
    ];
    test.each(cases)("%s bar element", ({ barElement, name }) => {
      // Make expected results
      const expectedSigRect = new Rect(
        barCoords.x,
        barCoords.y + dim.durationsHeight,
        barElement.showSignature ? dim.minInfoWidth : 0,
        barElement.showSignature ? dim.barHeight : 0
      );
      const expectedTempoRect = new Rect(
        barCoords.x,
        barCoords.y,
        barElement.showTempo ? dim.minInfoWidth : 0,
        barElement.showTempo ? dim.durationsHeight : 0
      );

      let chordsWidth = 0;
      for (const chordElement of barElement.chordElements) {
        chordsWidth += chordElement.rect.width;
      }
      const expectedRect = new Rect(
        barCoords.x,
        barCoords.y,
        expectedSigRect.width + chordsWidth,
        dim.tabLineHeight
      );

      // Calc
      barElement.calc();

      // Test
      expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
      expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
      expect(barElement.rect).toStrictEqual(expectedRect);
    });
  });

  test("Can be scaled down test", () => {
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]);
    const barCoords = new Point(0, 0);
    let showSignature = true;
    let showTempo = true;
    const barElement = new BarElement(
      dim,
      barCoords,
      bar,
      showSignature,
      showTempo
    );

    // // Should not be scalable considering default values
    // expect(chordElement.canBeScaledDown(0.75)).toBe(false);

    // // Reinit chord element
    // chord = new Chord(guitar, NoteDuration.Whole);
    // chordElement = new ChordElement(dim, chordCoords, chord);

    // // Should be scalable considering now it's a whole note
    // expect(chordElement.canBeScaledDown(0.75)).toBe(true);

    // // Passing scale >= 1 should always be true
    // expect(chordElement.canBeScaledDown(1)).toBe(true);
    // expect(chordElement.canBeScaledDown(10)).toBe(true);
  });
});
