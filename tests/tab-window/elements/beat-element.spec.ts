import {
  Bar,
  Beat,
  BeatElement,
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
const noteTextSize = 12;
const timeSigTextSize = 24;
const tempoTextSize = 36;
const durationsHeight = 50;
const dim = new TabWindowDim(
  width,
  noteTextSize,
  timeSigTextSize,
  tempoTextSize,
  durationsHeight,
  stringsCount
);

let duration = NoteDuration.Quarter;
let beat = new Beat(guitar, duration);
let beatCoords = new Point(0, 0);
let beatElement = new BeatElement(dim, beatCoords, beat);

describe("Beat element tests", () => {
  beforeEach(() => {
    // Reinit beat element
    beat = new Beat(guitar, duration);
    beatElement = new BeatElement(dim, beatCoords, beat);
  });

  describe("Beat element calc test", () => {
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
    test.each(cases)("Beat element duration (%d, %d)", (dur, ratio) => {
      // Reinit beat element
      beat = new Beat(guitar, dur);
      beatElement = new BeatElement(dim, beatCoords, beat);

      // Make expected results
      let expectedRect = new Rect(
        beatCoords.x,
        beatCoords.y,
        ratio * dim.noteRectWidth32,
        dim.tabLineMinHeight
      );
      let expectedDurationRect = new Rect(
        beatCoords.x,
        beatCoords.y,
        ratio * dim.noteRectWidth32,
        dim.durationsHeight
      );

      // Calc
      beatElement.calc();

      // Test
      expect(beatElement.rect).toStrictEqual(expectedRect);
      expect(beatElement.durationRect).toStrictEqual(expectedDurationRect);
    });
  });

  test("Scale horizontally test", () => {
    const scale = 2;
    // Reinit beat element
    beat = new Beat(guitar, NoteDuration.Whole);
    beatElement = new BeatElement(dim, beatCoords, beat);

    // Make expected data
    const expectedRect = new Rect(
      beatElement.rect.x * scale,
      beatElement.rect.y,
      beatElement.rect.width * scale,
      beatElement.rect.height
    );
    const expectedDurationRect = new Rect(
      beatElement.durationRect.x * scale,
      beatElement.durationRect.y,
      beatElement.durationRect.width * scale,
      beatElement.durationRect.height
    );

    // Scale
    beatElement.scaleBeatHorBy(scale);

    // Test
    expect(beatElement.rect).toStrictEqual(expectedRect);
    expect(beatElement.durationRect).toStrictEqual(expectedDurationRect);
  });

  test("Transalate test", () => {
    // Make expected data
    const dx = 20;
    const dy = 50;
    const expectedRect = new Rect(
      beatElement.rect.x + dx,
      beatElement.rect.y + dy,
      beatElement.rect.width,
      beatElement.rect.height
    );
    const expectedDurationRect = new Rect(
      beatElement.durationRect.x + dx,
      beatElement.durationRect.y + dy,
      beatElement.durationRect.width,
      beatElement.durationRect.height
    );

    // Translate
    beatElement.translateBy(dx, dy);

    // Test
    expect(beatElement.rect).toStrictEqual(expectedRect);
    expect(beatElement.durationRect).toStrictEqual(expectedDurationRect);
  });
});
