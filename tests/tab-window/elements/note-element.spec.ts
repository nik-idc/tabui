import {
  Bar,
  Beat,
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

let beatRect = new Rect(0, 0, dim.width / 4, dim.tabLineHeight);
let stringNum = 3;
let fret = 5;
let guitarNote = new GuitarNote(guitar, stringNum, fret);
let noteElement = new NoteElement(dim, beatRect, guitarNote);

describe("Note element tests", () => {
  beforeEach(() => {
    // Setup data before each test run
    beatRect = new Rect(0, 0, dim.width / 4, dim.tabLineHeight);
    stringNum = 3;
    fret = 5;
    guitarNote = new GuitarNote(guitar, stringNum, fret);
    noteElement = new NoteElement(dim, beatRect, guitarNote);
  });

  test("Note element calc test", () => {
    // Make expected results
    const expectedY =
      beatRect.y + dim.durationsHeight + (stringNum - 1) * dim.noteRectHeight;
    const expectedRect = new Rect(
      beatRect.x,
      expectedY,
      beatRect.width,
      dim.noteRectHeight
    );
    const expectedTextRect = new Rect(
      beatRect.x + beatRect.width / 2 - dim.noteTextSize / 2,
      expectedY + expectedRect.height / 2 - dim.noteTextSize / 2,
      dim.noteTextSize,
      dim.noteTextSize
    );
    const expectedTextCoords = new Point(
      expectedTextRect.x + expectedTextRect.width / 2,
      expectedTextRect.y + expectedTextRect.height / 2
    );

    // Calc
    noteElement.calc();

    // Test
    expect(noteElement.rect).toStrictEqual(expectedRect);
    expect(noteElement.textRect).toStrictEqual(expectedTextRect);
    expect(noteElement.textCoords).toStrictEqual(expectedTextCoords);
  });

  test("Note scale horizontally test: invalid value", () => {
    // Invalid scale value
    //  Remember prev values
    const expectedRect = new Rect(
      noteElement.rect.x,
      noteElement.rect.y,
      noteElement.rect.width,
      noteElement.rect.height
    );
    const expectedTextRect = new Rect(
      noteElement.textRect.x,
      noteElement.textRect.y,
      noteElement.textRect.width,
      noteElement.textRect.height
    );

    let scaleError: Error | undefined;
    try {
      //  Attempt scaling
      noteElement.scaleNoteHorBy(-1);
    } catch (error) {
      //  Record error
      scaleError = error;
    } finally {
      //  Test
      expect(noteElement.rect).toStrictEqual(expectedRect);
      expect(noteElement.textRect).toStrictEqual(expectedTextRect);
      expect(scaleError).toBeInstanceOf(Error);
    }
  });

  test("Note scale horizontally test: valid value", () => {
    // Make expected values values
    const scaleFactor = 1.2;
    const expectedRect = new Rect(
      noteElement.rect.x * scaleFactor,
      noteElement.rect.y,
      noteElement.rect.width * scaleFactor,
      noteElement.rect.height
    );
    const expectedTextRect = new Rect(
      expectedRect.x + expectedRect.width / 2 - dim.noteTextSize / 2,
      noteElement.textRect.y,
      noteElement.textRect.width,
      noteElement.textRect.height
    );
    const expectedTextCoords = new Point(
      expectedTextRect.x + expectedTextRect.width / 2,
      noteElement.textCoords.y
    );

    // Scale
    noteElement.scaleNoteHorBy(scaleFactor);

    // Test
    expect(noteElement.rect).toStrictEqual(expectedRect);
    expect(noteElement.textRect).toStrictEqual(expectedTextRect);
    expect(noteElement.textCoords).toStrictEqual(expectedTextCoords);
  });

  test("Note element translate by test", () => {
    // Make expected data
    const dx = 20;
    const dy = 30;
    const expectedRect = new Rect(
      noteElement.rect.x + dx,
      noteElement.rect.y + dy,
      noteElement.rect.width,
      noteElement.rect.height
    );
    const expectedTextRect = new Rect(
      noteElement.textRect.x + dx,
      noteElement.textRect.y + dy,
      noteElement.textRect.width,
      noteElement.textRect.height
    );

    // Translate
    noteElement.translateBy(dx, dy);

    // Test
    expect(noteElement.rect).toStrictEqual(expectedRect);
    expect(noteElement.textRect).toStrictEqual(expectedTextRect);
  });
});
