import { Bar, Chord, NoteDuration, Tab, TabWindow } from "../../src/index";
import { Guitar, GuitarNote, Note } from "../../src/index";

function getTabData(): {
  stringsCount: number;
  fretCount: number;
  guitar: Guitar;
  id: number;
  name: string;
  artist: string;
  song: string;
  bars: Bar[];
} {
  const stringsCount = 6;
  const fretCount = 24;
  const guitar = new Guitar(
    stringsCount,
    [Note.E, Note.B, Note.G, Note.D, Note.A, Note.E],
    fretCount
  );
  return {
    stringsCount: stringsCount,
    fretCount: fretCount,
    guitar: guitar,
    id: 1,
    name: "Wonderful name",
    artist: "Rare artist",
    song: "Interesting song",
    bars: [
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
    ],
  };
}

function getTab(): Tab {
  const { name, artist, song, guitar, bars } = getTabData();

  return new Tab(1, name, artist, song, guitar, bars);
}

describe("Tab Model Tests", () => {
  test("Tab from valid object test", () => {
    const { id, name, artist, song, guitar, bars } = getTabData();
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
    const { id, artist, guitar, bars } = getTabData();
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

  test("Tab replace chords: sel > new", () => {
    const tab = getTab();

    // Selected - 3 chords
    const selChords = tab.chordsSeq.slice(3, 5);
    // New chords - 2 chords
    const newChords = tab.chordsSeq.slice(6, 7);
    const prevChordsCount = tab.chordsSeq.length;
    tab.replaceChords(selChords, newChords);

    const chordsCount = tab.chordsSeq.length;
    expect(chordsCount).toBe(prevChordsCount - 1);
    expect(Chord.compare(tab.chordsSeq[3], tab.chordsSeq[6])).toBe(true);
    expect(Chord.compare(tab.chordsSeq[4], tab.chordsSeq[7])).toBe(true);
  });

  test("Tab replace chords: sel === new", () => {
    const tab = getTab();

    // Selected - 3 chords
    const selChords = tab.chordsSeq.slice(3, 5);
    // New chords - 3 chords
    const newChords = tab.chordsSeq.slice(6, 8);
    const prevChordsCount = tab.chordsSeq.length;
    tab.replaceChords(selChords, newChords);

    const chordsCount = tab.chordsSeq.length;
    expect(chordsCount).toBe(prevChordsCount);
    expect(Chord.compare(tab.chordsSeq[3], tab.chordsSeq[6])).toBe(true);
    expect(Chord.compare(tab.chordsSeq[4], tab.chordsSeq[7])).toBe(true);
    expect(Chord.compare(tab.chordsSeq[5], tab.chordsSeq[8])).toBe(true);
  });

  test("Tab replace chords: sel > new", () => {
    const tab = getTab();

    // Selected - 2 chords
    const selChords = tab.chordsSeq.slice(3, 4);
    // New chords - 3 chords
    const newChords = tab.chordsSeq.slice(6, 8);
    const prevChordsCount = tab.chordsSeq.length;
    tab.replaceChords(selChords, newChords);

    const chordsCount = tab.chordsSeq.length;
    expect(chordsCount).toBe(prevChordsCount + 1);
    expect(Chord.compare(tab.bars[0].chords[3], tab.chordsSeq[6])).toBe(true);
    expect(Chord.compare(tab.bars[1].chords[0], tab.chordsSeq[7])).toBe(true);
    expect(Chord.compare(tab.bars[1].chords[1], tab.chordsSeq[8])).toBe(true);
  });

  test("Tab remove chords", () => {
    const tab = getTab();

    const prevChordsCount = tab.chordsSeq.length;
    // Removing 2 chords
    tab.removeChords(tab.chordsSeq.slice(2, 4));

    const chordsCount = tab.chordsSeq.length;
    expect(chordsCount).toBe(prevChordsCount - 2);
  });
});
