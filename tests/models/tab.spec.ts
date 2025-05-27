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

  test("Tab replace beats: sel > new", () => {
    const tab = getTab();

    // Selected - 3 beats
    const oldBeats = tab.getBeatsSeq().slice(3, 5);
    // New beats - 2 beats
    const newBeats = tab.getBeatsSeq().slice(6, 7);
    const prevBeatsCount = tab.getBeatsSeq().length;
    tab.replaceBeats(oldBeats, newBeats);

    const beatsCount = tab.getBeatsSeq().length;
    expect(beatsCount).toBe(prevBeatsCount - 1);
    expect(Beat.compare(tab.getBeatsSeq()[3], tab.getBeatsSeq()[6])).toBe(true);
    expect(Beat.compare(tab.getBeatsSeq()[4], tab.getBeatsSeq()[7])).toBe(true);
  });

  test("Tab replace beats: sel === new", () => {
    const tab = getTab();

    // Selected - 3 beats
    const oldBeats = tab.getBeatsSeq().slice(3, 5);
    // New beats - 3 beats
    const newBeats = tab.getBeatsSeq().slice(6, 8);
    const prevBeatsCount = tab.getBeatsSeq().length;
    tab.replaceBeats(oldBeats, newBeats);

    const beatsCount = tab.getBeatsSeq().length;
    expect(beatsCount).toBe(prevBeatsCount);
    expect(Beat.compare(tab.getBeatsSeq()[3], tab.getBeatsSeq()[6])).toBe(true);
    expect(Beat.compare(tab.getBeatsSeq()[4], tab.getBeatsSeq()[7])).toBe(true);
    expect(Beat.compare(tab.getBeatsSeq()[5], tab.getBeatsSeq()[8])).toBe(true);
  });

  test("Tab replace beats: sel > new", () => {
    const tab = getTab();

    // Selected - 2 beats
    const oldBeats = tab.getBeatsSeq().slice(3, 4);
    // New beats - 3 beats
    const newBeats = tab.getBeatsSeq().slice(6, 8);
    const prevBeatsCount = tab.getBeatsSeq().length;
    tab.replaceBeats(oldBeats, newBeats);

    const beatsCount = tab.getBeatsSeq().length;
    expect(beatsCount).toBe(prevBeatsCount + 1);
    expect(Beat.compare(tab.bars[0].beats[3], tab.getBeatsSeq()[6])).toBe(true);
    expect(Beat.compare(tab.bars[1].beats[0], tab.getBeatsSeq()[7])).toBe(true);
    expect(Beat.compare(tab.bars[1].beats[1], tab.getBeatsSeq()[8])).toBe(true);
  });

  test("Tab remove beats", () => {
    const tab = getTab();

    const prevBeatsCount = tab.getBeatsSeq().length;
    // Removing 2 beats
    tab.removeBeats(tab.getBeatsSeq().slice(2, 4));

    const beatsCount = tab.getBeatsSeq().length;
    expect(beatsCount).toBe(prevBeatsCount - 2);
  });

  test("Tab apply note effect: bend", () => {
    const tab = getTab();

    const options = { bendPitch: 1.5 };
    const bendEffect = new GuitarEffect(GuitarEffectType.Bend, options);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.Bend, options);
    expect(tab.bars[0].beats[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].effects[0]).toStrictEqual(bendEffect);
    expect(tab.bars[0].beats[2].notes[2].effects[0].options).toStrictEqual(
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
    expect(tab.bars[0].beats[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].effects[0]).toStrictEqual(
      bendAndReleaseEffect
    );
    expect(tab.bars[0].beats[2].notes[2].effects[0].options).toStrictEqual(
      options
    );
  });

  test("Tab apply note effect: prebend", () => {
    const tab = getTab();

    const options = { prebendPitch: 1.5 };
    const prebendEffect = new GuitarEffect(GuitarEffectType.Prebend, options);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.Prebend, options);
    expect(tab.bars[0].beats[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].effects[0]).toStrictEqual(
      prebendEffect
    );
    expect(tab.bars[0].beats[2].notes[2].effects[0].options).toStrictEqual(
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
    expect(tab.bars[0].beats[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].effects[0]).toStrictEqual(
      prebendAndReleaseEffect
    );
    expect(tab.bars[0].beats[2].notes[2].effects[0].options).toStrictEqual(
      options
    );
  });

  test("Tab apply note effect: vibrato", () => {
    const tab = getTab();

    const vibratoEffect = new GuitarEffect(GuitarEffectType.Vibrato);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.Vibrato);
    expect(tab.bars[0].beats[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].effects[0]).toStrictEqual(
      vibratoEffect
    );
  });

  test("Tab apply note effect: slide", () => {
    const tab = getTab();
    randomFrets(tab);

    const nextHigher =
      tab.bars[0].beats[2].notes[2].fret! < tab.bars[0].beats[3].notes[2].fret!;
    const options = new GuitarEffectOptions(
      undefined,
      undefined,
      undefined,
      nextHigher
    );
    const slideEffect = new GuitarEffect(GuitarEffectType.Slide, options);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.Slide, options);
    expect(tab.bars[0].beats[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].effects[0]).toStrictEqual(slideEffect);
    expect(tab.bars[0].beats[2].notes[2].effects[0].effectType).toBe(
      GuitarEffectType.Slide
    );
  });

  test("Tab apply note effect: hammer-on", () => {
    const tab = getTab();

    const hammerOnEffect = new GuitarEffect(GuitarEffectType.HammerOnOrPullOff);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.HammerOnOrPullOff);
    expect(tab.bars[0].beats[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].effects[0]).toStrictEqual(
      hammerOnEffect
    );
    expect(tab.bars[0].beats[2].notes[2].effects[0].effectType).toBe(
      GuitarEffectType.HammerOnOrPullOff
    );
  });

  test("Tab apply note effect: pinch harmonic", () => {
    const tab = getTab();

    const phEffect = new GuitarEffect(GuitarEffectType.PinchHarmonic);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.PinchHarmonic);
    expect(tab.bars[0].beats[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].effects[0]).toStrictEqual(phEffect);
    expect(tab.bars[0].beats[2].notes[2].effects[0].effectType).toBe(
      GuitarEffectType.PinchHarmonic
    );
  });

  test("Tab apply note effect: natural harmonic", () => {
    const tab = getTab();

    const nhEffect = new GuitarEffect(GuitarEffectType.NaturalHarmonic);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.NaturalHarmonic);
    expect(tab.bars[0].beats[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].effects[0]).toStrictEqual(nhEffect);
    expect(tab.bars[0].beats[2].notes[2].effects[0].effectType).toBe(
      GuitarEffectType.NaturalHarmonic
    );
  });

  test("Tab apply note effect: palm-mute", () => {
    const tab = getTab();

    const pmEffect = new GuitarEffect(GuitarEffectType.PalmMute);
    randomFrets(tab);
    tab.applyEffectToNote(0, 2, 3, GuitarEffectType.PalmMute);
    expect(tab.bars[0].beats[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].effects[0]).toStrictEqual(pmEffect);
    expect(tab.bars[0].beats[2].notes[2].effects[0].effectType).toBe(
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
    expect(tab.bars[0].beats[2].notes[2].effects.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].effects[0]).toStrictEqual(bendEffect);
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
    expect(tab.bars[0].beats[2].notes[2].effects.length).toBe(2);
    expect(tab.bars[0].beats[2].notes[2].effects[0]).toStrictEqual(bendEffect);
    expect(tab.bars[0].beats[2].notes[2].effects[1]).toStrictEqual(phEffect);
  });

  test("Test from object after transcription", () => {
    const tabObj = require("./test-data/tab-gp-4.json");

    let parseError: Error | undefined;
    try {
      const tab = Tab.fromObject(tabObj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBe(undefined);
    }
  });
});
