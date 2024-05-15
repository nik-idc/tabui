import {
  Bar,
  Chord,
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

let chordRect = new Rect(0, 0, dim.width / 4, dim.lineHeight);
let strNum = 3;
let fret = 5;
let guitarNote = new GuitarNote(guitar, strNum, fret);
let noteElement = new NoteElement(dim, chordRect, guitarNote);

describe("Note element tests", () => {
  beforeEach(() => {
    // Setup data before each test run
    chordRect = new Rect(0, 0, dim.width / 4, dim.lineHeight);
    strNum = 3;
    fret = 5;
    guitarNote = new GuitarNote(guitar, strNum, fret);
    noteElement = new NoteElement(dim, chordRect, guitarNote);
  });

  test("Note element calc test", () => {
    // Make expected results
    const expectedRect = new Rect(
      chordRect.x,
      -dim.minNoteSize / 2 + dim.minNoteSize * (strNum - 1),
      chordRect.width,
      dim.minNoteSize
    );
    const expectedNoteRect = new Rect(
      chordRect.x + chordRect.width / 2,
      expectedRect.y,
      dim.minNoteSize,
      expectedRect.height
    );
    const expectedTextCoords = new Point(
      chordRect.x + chordRect.width / 2,
      noteElement.rect.y + dim.minNoteSize / 2
    );

    // Calc
    noteElement.calc();

    // Test
    expect(noteElement.rect).toStrictEqual(expectedRect);
    expect(noteElement.noteRect).toStrictEqual(expectedNoteRect);
    expect(noteElement.textCoords).toStrictEqual(expectedTextCoords);
  });

  test("Note element can be scaled down test", () => {
    // Can be scaled down (default values are down-scalable)
    expect(noteElement.canBeScaledDown(0.5)).toBe(true);

    // Can't be scaled down
    //  Resize to non down-scalable
    chordRect = new Rect(0, 0, dim.minNoteSize, dim.lineHeight);
    noteElement = new NoteElement(dim, chordRect, guitarNote);

    //  Test
    expect(noteElement.canBeScaledDown(0.5)).toBe(false);
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
    const expectedNoteRect = new Rect(
      noteElement.noteRect.x,
      noteElement.noteRect.y,
      noteElement.noteRect.width,
      noteElement.noteRect.height
    );
    const expectedTextCoords = new Point(
      noteElement.textCoords.x,
      noteElement.textCoords.y
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
      expect(noteElement.noteRect).toStrictEqual(expectedNoteRect);
      expect(noteElement.textCoords).toStrictEqual(expectedTextCoords);
      expect(scaleError).toBeInstanceOf(Error);
    }
  });

  test("Note scale horizontally test: valid value", () => {
    // Valid scale value: succesfull scale
    //  Make expected values values
    const scaleFactor = 0.2;
    let expectedRect = new Rect(
      noteElement.rect.x * scaleFactor,
      noteElement.rect.y,
      noteElement.rect.width * scaleFactor,
      noteElement.rect.height
    );
    let expectedNoteRect = new Rect(
      noteElement.noteRect.x * scaleFactor,
      noteElement.noteRect.y,
      noteElement.noteRect.width * scaleFactor,
      noteElement.noteRect.height
    );
    let expectedTextCoords = new Point(
      noteElement.textCoords.x * scaleFactor,
      noteElement.textCoords.y
    );

    //  Scale
    let result = noteElement.scaleNoteHorBy(scaleFactor);

    //  Test
    expect(result).toBe(true);
    expect(noteElement.rect).toStrictEqual(expectedRect);
    expect(noteElement.noteRect).toStrictEqual(expectedNoteRect);
    expect(noteElement.textCoords).toStrictEqual(expectedTextCoords);

    // Valid scale value: unsuccesfull scale
    //  Resize
    chordRect = new Rect(0, 0, dim.minNoteSize, dim.lineHeight);
    noteElement = new NoteElement(dim, chordRect, guitarNote);

    //  Remember prev values
    expectedRect = new Rect(
      noteElement.rect.x,
      noteElement.rect.y,
      noteElement.rect.width,
      noteElement.rect.height
    );
    expectedNoteRect = new Rect(
      noteElement.noteRect.x,
      noteElement.noteRect.y,
      noteElement.noteRect.width,
      noteElement.noteRect.height
    );
    expectedTextCoords = new Point(
      noteElement.textCoords.x,
      noteElement.textCoords.y
    );

    //  Scale
    result = noteElement.scaleNoteHorBy(scaleFactor);

    //  Test
    expect(result).toBe(false);
    expect(noteElement.rect).toStrictEqual(expectedRect);
    expect(noteElement.noteRect).toStrictEqual(expectedNoteRect);
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
    const expectedNoteRect = new Rect(
      noteElement.noteRect.x + dx,
      noteElement.noteRect.y + dy,
      noteElement.noteRect.width,
      noteElement.noteRect.height
    );
    const expectedTextCoords = new Point(
      noteElement.textCoords.x + dx,
      noteElement.textCoords.y + dy
    );

    // Translate
    noteElement.translateBy(dx, dy);

    // Test
    expect(noteElement.rect).toStrictEqual(expectedRect);
    expect(noteElement.noteRect).toStrictEqual(expectedNoteRect);
    expect(noteElement.textCoords).toStrictEqual(expectedTextCoords);
  });
});
