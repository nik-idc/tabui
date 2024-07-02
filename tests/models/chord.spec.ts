import { Chord, NoteDuration, TabWindow } from "../../src/index";
import { Guitar, GuitarNote, Note } from "../../src/index";

const stringsCount = 6;
const fretCount = 24;
const guitar = new Guitar(
  stringsCount,
  [Note.E, Note.B, Note.G, Note.D, Note.A, Note.E],
  fretCount
);

describe("Chord Model Tests", () => {
  test("Chord from valid object test", () => {
    const chordObj = {
      guitar: guitar,
      duration: 1 / 4,
      notes: [
        new GuitarNote(guitar, 1, 12),
        new GuitarNote(guitar, 2, 12),
        new GuitarNote(guitar, 3, 13),
        new GuitarNote(guitar, 4, 14),
        new GuitarNote(guitar, 5, 14),
        new GuitarNote(guitar, 6, 12),
      ],
    };

    let parseError: Error | undefined;
    try {
      const chord = Chord.fromObject(chordObj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBe(undefined);
    }
  });

  test("Chord from invalid object test", () => {
    const chordObj = {
      guitar: guitar,
      notes: [
        new GuitarNote(guitar, 1, 12),
        new GuitarNote(guitar, 2, 12),
        new GuitarNote(guitar, 3, 13),
        new GuitarNote(guitar, 4, 14),
        new GuitarNote(guitar, 5, 14),
        new GuitarNote(guitar, 6, 12),
      ],
    };

    let parseError: Error | undefined;
    try {
      const chord = Chord.fromObject(chordObj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBeInstanceOf(Error);
    }
  });
});
