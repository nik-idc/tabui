import { TabWindow } from "../../src/index";
import { Guitar, GuitarNote, Note } from "../../src/index";

const stringsCount = 6;
const fretCount = 24;
const guitar = new Guitar(
  stringsCount,
  [Note.E, Note.B, Note.G, Note.D, Note.A, Note.E],
  fretCount
);

describe("Guitar Note Model Tests", () => {
  test("Guitar note set string number valid test", () => {
    const stringNum = 4;
    const fret = 12;
    const guitarNote = new GuitarNote(guitar, stringNum, fret);

    const newstringNum = 5;
    let setstringNumError: Error | undefined;
    try {
      guitarNote.stringNum = newstringNum;
    } catch (error) {
      setstringNumError = error;
    } finally {
      expect(setstringNumError).toBe(undefined);
      expect(guitarNote.stringNum).toBe(newstringNum);
    }
  });

  test("Guitar note set string number invalid test", () => {
    const stringNum = 4;
    const fret = 12;
    const guitarNote = new GuitarNote(guitar, stringNum, fret);

    const newstringNum = stringsCount + 1;
    let setstringNumError: Error | undefined;
    try {
      guitarNote.stringNum = newstringNum;
    } catch (error) {
      setstringNumError = error;
    } finally {
      expect(setstringNumError).toBeInstanceOf(Error);
      expect(guitarNote.stringNum).toBe(stringNum);
    }
  });

  test("Guitar note set fret valid test: normal fret value", () => {
    const stringNum = 4;
    const fret = 12;
    const guitarNote = new GuitarNote(guitar, stringNum, fret);

    const newFret = 13;
    let setFretError: Error | undefined;
    try {
      guitarNote.fret = newFret;
    } catch (error) {
      setFretError = error;
    } finally {
      expect(setFretError).toBe(undefined);
      expect(guitarNote.fret).toBe(newFret);
    }
  });

  test("Guitar note set fret valid test: frets count fret value", () => {
    const stringNum = 4;
    const fret = 12;
    const guitarNote = new GuitarNote(guitar, stringNum, fret);

    const newFret = fretCount;
    let setFretError: Error | undefined;
    try {
      guitarNote.fret = newFret;
    } catch (error) {
      setFretError = error;
    } finally {
      expect(setFretError).toBe(undefined);
      expect(guitarNote.fret).toBe(newFret);
    }
  });

  test("Guitar note set fret valid test: big fret value", () => {
    const stringNum = 4;
    const fret = 12;
    const guitarNote = new GuitarNote(guitar, stringNum, fret);

    const newFret = 99;
    let setFretError: Error | undefined;
    try {
      guitarNote.fret = newFret;
    } catch (error) {
      setFretError = error;
    } finally {
      expect(setFretError).toBe(undefined);
      expect(guitarNote.fret).toBe(newFret % fretCount);
    }
  });

  test("Guitar note get note value test", () => {
    const stringNum = 4;
    const fret = 12;
    const guitarNote = new GuitarNote(guitar, stringNum, fret);
    expect(guitarNote.note).toBe(Note.D);

    guitarNote.fret = 14;
    expect(guitarNote.note).toBe(Note.E);

    guitarNote.fret = 24;
    expect(guitarNote.note).toBe(Note.D);

    guitarNote.fret = 25;
    expect(guitarNote.note).toBe(Note.DSharp);
  });

  test("Guitar note from valid object test", () => {
    const guitarObj = {
      stringsCount: 7,
      tuning: ["G", "C", "G", "C", "F", "A", "D"],
      fretsCount: 24,
    };
    const guitar = Guitar.fromObject(guitarObj);
    const guitarNoteObj = {
      guitar: guitar,
      _stringNum: 1,
      _fret: 12,
    };

    let parseError: Error | undefined;
    try {
      const guitarNote = GuitarNote.fromObject(guitarNoteObj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBe(undefined);
    }
  });

  test("Guitar note from invalid object test", () => {
    const guitarNoteObj = {
      guitar: undefined,
      _stringNum: 1,
      _fret: 12,
    };

    let parseError: Error | undefined;
    try {
      const guitarNote = GuitarNote.fromObject(guitarNoteObj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBeInstanceOf(Error);
    }
  });
});
