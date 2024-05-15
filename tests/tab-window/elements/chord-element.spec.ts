import {
  Bar,
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

let duration = NoteDuration.Quarter;
let chord = new Chord(guitar, duration);
let chordCoords = new Point(0, 0);
let chordElement = new ChordElement(dim, chordCoords, chord);

describe("Chord element tests", () => {
  beforeEach(() => {
    // Reinit chord element
    chord = new Chord(guitar, duration);
    chordElement = new ChordElement(dim, chordCoords, chord);
  });

  describe("Chord element calc test", () => {
    // Expected width ratios where all of these
    // are multiplied by min note size
    const cases = [
      [NoteDuration.Whole, 1.5],
      [NoteDuration.Half, 1.4],
      [NoteDuration.Quarter, 1.3],
      [NoteDuration.Eighth, 1.2],
      [NoteDuration.Sixteenth, 1.1],
      [NoteDuration.ThirtySecond, 1.0],
    ];
    test.each(cases)("Chord element duration (%d, %d)", (dur, ratio) => {
      // Reinit chord element
      chord = new Chord(guitar, dur);
      chordElement = new ChordElement(dim, chordCoords, chord);

      // Make expected results
      let expectedRect = new Rect(
        chordCoords.x,
        chordCoords.y,
        ratio * dim.minNoteSize,
        dim.lineHeight
      );
      let expectedDurationRect = new Rect(
        chordCoords.x,
        chordCoords.y,
        ratio * dim.minNoteSize,
        dim.durationsHeight
      );

      // Calc
      chordElement.calc();

      // Test
      expect(chordElement.rect).toStrictEqual(expectedRect);
      expect(chordElement.durationRect).toStrictEqual(expectedDurationRect);
    });
  });

  test("Can be scaled down test", () => {
    // Should not be scalable considering default values
    expect(chordElement.canBeScaledDown(0.75)).toBe(false);

    // Reinit chord element
    chord = new Chord(guitar, NoteDuration.Whole);
    chordElement = new ChordElement(dim, chordCoords, chord);

    // Should be scalable considering now it's a whole note
    expect(chordElement.canBeScaledDown(0.75)).toBe(true);

    // Passing scale >= 1 should always be true
    expect(chordElement.canBeScaledDown(1)).toBe(true);
    expect(chordElement.canBeScaledDown(10)).toBe(true);
  });

  describe("Scale horizontally test", () => {
    const cases = [2.0, 0.75];
    test.each(cases)("Scale test: %d", (scale) => {
      // Reinit chord element
      chord = new Chord(guitar, NoteDuration.Whole);
      chordElement = new ChordElement(dim, chordCoords, chord);

      // Make expected data
      const expectedRect = new Rect(
        chordElement.rect.x * scale,
        chordElement.rect.y,
        chordElement.rect.width * scale,
        chordElement.rect.height
      );
      const expectedDurationRect = new Rect(
        chordElement.durationRect.x * scale,
        chordElement.durationRect.y,
        chordElement.durationRect.width * scale,
        chordElement.durationRect.height
      );

      // Scale
      chordElement.scaleChordHorBy(scale);

      // Test
      expect(chordElement.rect).toStrictEqual(expectedRect);
      expect(chordElement.durationRect).toStrictEqual(expectedDurationRect);
    });
  });

  test("Transalate test", () => {
    // Make expected data
    const dx = 20;
    const dy = 50;
    const expectedRect = new Rect(
      chordElement.rect.x + dx,
      chordElement.rect.y + dy,
      chordElement.rect.width,
      chordElement.rect.height
    );
    const expectedDurationRect = new Rect(
      chordElement.durationRect.x + dx,
      chordElement.durationRect.y + dy,
      chordElement.durationRect.width,
      chordElement.durationRect.height
    );

    // Translate
    chordElement.translateBy(dx, dy);

    // Test
    expect(chordElement.rect).toStrictEqual(expectedRect);
    expect(chordElement.durationRect).toStrictEqual(expectedDurationRect);
  });
});
