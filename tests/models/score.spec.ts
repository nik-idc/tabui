import { Bar, Beat, NoteDuration, Tab } from "../../src/index";
import { Guitar, GuitarNote, Note } from "../../src/index";
import { GuitarEffect } from "../../src/models/guitar-effect/guitar-effect";
import { GuitarEffectOptions } from "../../src/models/guitar-effect/guitar-effect-options";
import { GuitarEffectType } from "../../src/models/guitar-effect/guitar-effect-type";

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
  const guitar = new Guitar();
  return {
    stringsCount: guitar.stringsCount,
    fretCount: guitar.fretsCount,
    guitar: guitar,
    id: 1,
    name: "Wonderful name",
    artist: "Rare artist",
    song: "Interesting song",
    bars: [
      new Bar(guitar, 120, 4, NoteDuration.Quarter, [
        new Beat(guitar, NoteDuration.Quarter),
        new Beat(guitar, NoteDuration.Quarter),
        new Beat(guitar, NoteDuration.Quarter),
        new Beat(guitar, NoteDuration.Quarter),
      ]),
      new Bar(guitar, 120, 4, NoteDuration.Quarter, [
        new Beat(guitar, NoteDuration.Quarter),
        new Beat(guitar, NoteDuration.Quarter),
        new Beat(guitar, NoteDuration.Quarter),
        new Beat(guitar, NoteDuration.Quarter),
      ]),
      new Bar(guitar, 120, 2, NoteDuration.Quarter, [
        new Beat(guitar, NoteDuration.Quarter),
        new Beat(guitar, NoteDuration.Quarter),
      ]),
      new Bar(guitar, 120, 4, NoteDuration.Quarter, [
        new Beat(guitar, NoteDuration.Quarter),
        new Beat(guitar, NoteDuration.Quarter),
        new Beat(guitar, NoteDuration.Quarter),
        new Beat(guitar, NoteDuration.Quarter),
      ]),
    ],
  };
}

function getTab(): Tab {
  const { name, artist, song, guitar, bars } = getTabData();

  return new Tab(1, name, artist, song, guitar, bars);
}

function randomFrets(tab: Tab): void {
  for (const bar of tab.bars) {
    for (const beat of bar.beats) {
      for (const note of beat.notes) {
        const newFret = Math.floor(Math.random() * tab.guitar.fretsCount);
        note.fret = newFret;
      }
    }
  }
}

describe("Score Model Tests", () => {
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
});
