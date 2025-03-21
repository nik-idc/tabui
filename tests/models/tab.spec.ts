import { Bar, Chord, NoteDuration, Tab, TabWindow } from "../../src/index";
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

function randomFrets(tab: Tab): void {
  for (const bar of tab.bars) {
    for (const chord of bar.chords) {
      for (const note of chord.notes) {
        const newFret = Math.floor(Math.random() * tab.guitar.fretsCount);
        note.fret = newFret;
      }
    }
  }
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
    const oldChords = tab.getChordsSeq().slice(3, 5);
    // New chords - 2 chords
    const newChords = tab.getChordsSeq().slice(6, 7);
    const prevChordsCount = tab.getChordsSeq().length;
    tab.replaceChords(oldChords, newChords);

    const chordsCount = tab.getChordsSeq().length;
    expect(chordsCount).toBe(prevChordsCount - 1);
    expect(Chord.compare(tab.getChordsSeq()[3], tab.getChordsSeq()[6])).toBe(
      true
    );
    expect(Chord.compare(tab.getChordsSeq()[4], tab.getChordsSeq()[7])).toBe(
      true
    );
  });

  test("Tab replace chords: sel === new", () => {
    const tab = getTab();

    // Selected - 3 chords
    const oldChords = tab.getChordsSeq().slice(3, 5);
    // New chords - 3 chords
    const newChords = tab.getChordsSeq().slice(6, 8);
    const prevChordsCount = tab.getChordsSeq().length;
    tab.replaceChords(oldChords, newChords);

    const chordsCount = tab.getChordsSeq().length;
    expect(chordsCount).toBe(prevChordsCount);
    expect(Chord.compare(tab.getChordsSeq()[3], tab.getChordsSeq()[6])).toBe(
      true
    );
    expect(Chord.compare(tab.getChordsSeq()[4], tab.getChordsSeq()[7])).toBe(
      true
    );
    expect(Chord.compare(tab.getChordsSeq()[5], tab.getChordsSeq()[8])).toBe(
      true
    );
  });

  test("Tab replace chords: sel > new", () => {
    const tab = getTab();

    // Selected - 2 chords
    const oldChords = tab.getChordsSeq().slice(3, 4);
    // New chords - 3 chords
    const newChords = tab.getChordsSeq().slice(6, 8);
    const prevChordsCount = tab.getChordsSeq().length;
    tab.replaceChords(oldChords, newChords);

    const chordsCount = tab.getChordsSeq().length;
    expect(chordsCount).toBe(prevChordsCount + 1);
    expect(Chord.compare(tab.bars[0].chords[3], tab.getChordsSeq()[6])).toBe(
      true
    );
    expect(Chord.compare(tab.bars[1].chords[0], tab.getChordsSeq()[7])).toBe(
      true
    );
    expect(Chord.compare(tab.bars[1].chords[1], tab.getChordsSeq()[8])).toBe(
      true
    );
  });

  test("Tab remove chords", () => {
    const tab = getTab();

    const prevChordsCount = tab.getChordsSeq().length;
    // Removing 2 chords
    tab.removeChords(tab.getChordsSeq().slice(2, 4));

    const chordsCount = tab.getChordsSeq().length;
    expect(chordsCount).toBe(prevChordsCount - 2);
  });

  test("Tab apply note effect: bend", () => {
    const tab = getTab();

    const options = { bendPitch: 1.5 };
    const bendEffect = new GuitarEffect(GuitarEffectType.Bend, options);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.Bend, options);
    expect(tab.bars[0].chords[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].chords[2].notes[2].effects[0]).toStrictEqual(bendEffect);
    expect(tab.bars[0].chords[2].notes[2].effects[0].options).toStrictEqual(
      options
    );
  });

  test("Tab apply note effect: bend-and-release", () => {
    const tab = getTab();

    const options = { bendPitch: 1.5, bendReleasePitch: 1.5 };
    const bendAndReleaseEffect = new GuitarEffect(
      GuitarEffectType.BendAndRelease,
      options
    );
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.BendAndRelease, options);
    expect(tab.bars[0].chords[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].chords[2].notes[2].effects[0]).toStrictEqual(
      bendAndReleaseEffect
    );
    expect(tab.bars[0].chords[2].notes[2].effects[0].options).toStrictEqual(
      options
    );
  });

  test("Tab apply note effect: prebend", () => {
    const tab = getTab();

    const options = { prebendPitch: 1.5 };
    const prebendEffect = new GuitarEffect(GuitarEffectType.Prebend, options);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.Prebend, options);
    expect(tab.bars[0].chords[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].chords[2].notes[2].effects[0]).toStrictEqual(
      prebendEffect
    );
    expect(tab.bars[0].chords[2].notes[2].effects[0].options).toStrictEqual(
      options
    );
  });

  test("Tab apply note effect: prebend-and-release", () => {
    const tab = getTab();

    const options = { prebendPitch: 1.5, bendReleasePitch: 1.5 };
    const prebendAndReleaseEffect = new GuitarEffect(
      GuitarEffectType.PrebendAndRelease,
      options
    );
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.PrebendAndRelease, options);
    expect(tab.bars[0].chords[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].chords[2].notes[2].effects[0]).toStrictEqual(
      prebendAndReleaseEffect
    );
    expect(tab.bars[0].chords[2].notes[2].effects[0].options).toStrictEqual(
      options
    );
  });

  test("Tab apply note effect: vibrato", () => {
    const tab = getTab();

    const vibratoEffect = new GuitarEffect(GuitarEffectType.Vibrato);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.Vibrato);
    expect(tab.bars[0].chords[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].chords[2].notes[2].effects[0]).toStrictEqual(
      vibratoEffect
    );
  });

  test("Tab apply note effect: slide", () => {
    const tab = getTab();
    randomFrets(tab);

    const nextHigher =
      tab.bars[0].chords[2].notes[2].fret! <
      tab.bars[0].chords[3].notes[2].fret!;
    const options = new GuitarEffectOptions(
      undefined,
      undefined,
      undefined,
      nextHigher
    );
    const slideEffect = new GuitarEffect(GuitarEffectType.Slide, options);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.Slide, options);
    expect(tab.bars[0].chords[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].chords[2].notes[2].effects[0]).toStrictEqual(
      slideEffect
    );
    expect(tab.bars[0].chords[2].notes[2].effects[0].effectType).toBe(
      GuitarEffectType.Slide
    );
  });

  test("Tab apply note effect: hammer-on", () => {
    const tab = getTab();

    const hammerOnEffect = new GuitarEffect(GuitarEffectType.HammerOnOrPullOff);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.HammerOnOrPullOff);
    expect(tab.bars[0].chords[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].chords[2].notes[2].effects[0]).toStrictEqual(
      hammerOnEffect
    );
    expect(tab.bars[0].chords[2].notes[2].effects[0].effectType).toBe(
      GuitarEffectType.HammerOnOrPullOff
    );
  });

  test("Tab apply note effect: pinch harmonic", () => {
    const tab = getTab();

    const phEffect = new GuitarEffect(GuitarEffectType.PinchHarmonic);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.PinchHarmonic);
    expect(tab.bars[0].chords[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].chords[2].notes[2].effects[0]).toStrictEqual(phEffect);
    expect(tab.bars[0].chords[2].notes[2].effects[0].effectType).toBe(
      GuitarEffectType.PinchHarmonic
    );
  });

  test("Tab apply note effect: natural harmonic", () => {
    const tab = getTab();

    const nhEffect = new GuitarEffect(GuitarEffectType.NaturalHarmonic);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.NaturalHarmonic);
    expect(tab.bars[0].chords[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].chords[2].notes[2].effects[0]).toStrictEqual(nhEffect);
    expect(tab.bars[0].chords[2].notes[2].effects[0].effectType).toBe(
      GuitarEffectType.NaturalHarmonic
    );
  });

  test("Tab apply note effect: palm-mute", () => {
    const tab = getTab();

    const pmEffect = new GuitarEffect(GuitarEffectType.PalmMute);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.PalmMute);
    expect(tab.bars[0].chords[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].chords[2].notes[2].effects[0]).toStrictEqual(pmEffect);
    expect(tab.bars[0].chords[2].notes[2].effects[0].effectType).toBe(
      GuitarEffectType.PalmMute
    );
  });

  test("Tab apply incompatible effects: natural harmonic + bend", () => {
    const tab = getTab();

    const options = { bendPitch: 1.5 };
    const bendEffect = new GuitarEffect(GuitarEffectType.Bend, options);
    const nhEffect = new GuitarEffect(GuitarEffectType.NaturalHarmonic);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.Bend, options);
    const nhApplyResult = tab.applyEffectToNote(
      0,
      2,
      3,
      GuitarEffectType.NaturalHarmonic
    );

    expect(nhApplyResult).toBe(false);
    expect(tab.bars[0].chords[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].chords[2].notes[2].effects[0]).toStrictEqual(bendEffect);
  });

  test("Tab apply compatible effects: pinch harmonic + bend", () => {
    const tab = getTab();

    const options = { bendPitch: 1.5 };
    const bendEffect = new GuitarEffect(GuitarEffectType.Bend, options);
    const phEffect = new GuitarEffect(GuitarEffectType.PinchHarmonic);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.Bend, options);
    const phApplyResult = tab.applyEffectToNote(
      0,
      2,
      3,
      GuitarEffectType.PinchHarmonic
    );

    expect(phApplyResult).toBe(true);
    expect(tab.bars[0].chords[2].notes[2].effects.length).toBe(2);
    expect(tab.bars[0].chords[2].notes[2].effects[0]).toStrictEqual(bendEffect);
    expect(tab.bars[0].chords[2].notes[2].effects[1]).toStrictEqual(phEffect);
  });
});
