import { Bar, Chord, NoteDuration, Tab, TabWindow } from "../../src/index";
import { Guitar, GuitarNote, Note } from "../../src/index";

const stringsCount = 6;
const fretCount = 24;
const guitar = new Guitar(
  stringsCount,
  [Note.E, Note.B, Note.G, Note.D, Note.A, Note.E],
  fretCount
);
const id = 1;
const name = "Wonderful name";
const artist = "Rare artist";
const song = "Interesting song";
const bars = [
  new Bar(guitar, 120, 4, NoteDuration.Quarter, [
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
  ]),
  new Bar(guitar, 120, 4, NoteDuration.Quarter, [
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
  ]),
  new Bar(guitar, 120, 2, NoteDuration.Quarter, [
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
  ]),
  new Bar(guitar, 120, 4, NoteDuration.Quarter, [
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
  ]),
];

describe("Tab Model Tests", () => {
  test("Tab from valid object test", () => {
    const isPublic = false;
    const data = {
      id,
      name,
      artist,
      song,
      guitar,
      bars,
      isPublic,
    };
    const tabObj = {
      id,
      name,
      artist,
      song,
      guitar,
      isPublic,
      data,
    };

    let parseError: Error | undefined;
    try {
      const tab = Tab.fromObject(tabObj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBe(undefined);
    }
  });

  test("Tab from invalid object test", () => {
    const tabObj = {
      id,
      artist,
      guitar,
      bars,
    };

    let parseError: Error | undefined;
    try {
      const tab = Tab.fromObject(tabObj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBeInstanceOf(Error);
    }
  });
});
