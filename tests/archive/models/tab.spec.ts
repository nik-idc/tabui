import { Bar, Beat, NoteDuration, Tab } from "../../src/index";
import { Guitar, GuitarNote, Note } from "../../src/index";
import { GuitarTechnique } from "../../src/models/guitar-technique/guitar-technique";
import { GuitarTechniqueOptions } from "../../src/models/guitar-technique/guitar-technique-options";
import { GuitarTechniqueType } from "../../src/models/guitar-technique/guitar-technique-type";

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

  test("Tab apply note technique: bend", () => {
    const tab = getTab();

    const bendOptions = { bendPitch: 1.5 };
    const bendTechnique = new GuitarTechnique(
      GuitarTechniqueType.Bend,
      bendOptions
    );
    randomFrets(tab);
    tab.applyTechniqueToNote(0, 2, 3, GuitarTechniqueType.Bend, bendOptions);
    expect(tab.bars[0].beats[2].notes[2].techniques.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].techniques[0]).toStrictEqual(
      bendTechnique
    );
    expect(
      tab.bars[0].beats[2].notes[2].techniques[0].bendOptions
    ).toStrictEqual(bendOptions);
  });

  test("Tab apply note technique: bend-and-release", () => {
    const tab = getTab();

    const bendOptions = { bendPitch: 1.5, bendReleasePitch: 1.5 };
    const bendAndReleaseTechnique = new GuitarTechnique(
      GuitarTechniqueType.BendAndRelease,
      bendOptions
    );
    randomFrets(tab);
    tab.applyTechniqueToNote(
      0,
      2,
      3,
      GuitarTechniqueType.BendAndRelease,
      bendOptions
    );
    expect(tab.bars[0].beats[2].notes[2].techniques.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].techniques[0]).toStrictEqual(
      bendAndReleaseTechnique
    );
    expect(
      tab.bars[0].beats[2].notes[2].techniques[0].bendOptions
    ).toStrictEqual(bendOptions);
  });

  test("Tab apply note technique: prebend", () => {
    const tab = getTab();

    const bendOptions = { prebendPitch: 1.5 };
    const prebendTechnique = new GuitarTechnique(
      GuitarTechniqueType.Prebend,
      bendOptions
    );
    randomFrets(tab);
    tab.applyTechniqueToNote(0, 2, 3, GuitarTechniqueType.Prebend, bendOptions);
    expect(tab.bars[0].beats[2].notes[2].techniques.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].techniques[0]).toStrictEqual(
      prebendTechnique
    );
    expect(
      tab.bars[0].beats[2].notes[2].techniques[0].bendOptions
    ).toStrictEqual(bendOptions);
  });

  test("Tab apply note technique: prebend-and-release", () => {
    const tab = getTab();

    const bendOptions = { prebendPitch: 1.5, bendReleasePitch: 1.5 };
    const prebendAndReleaseTechnique = new GuitarTechnique(
      GuitarTechniqueType.PrebendAndRelease,
      bendOptions
    );
    randomFrets(tab);
    tab.applyTechniqueToNote(
      0,
      2,
      3,
      GuitarTechniqueType.PrebendAndRelease,
      bendOptions
    );
    expect(tab.bars[0].beats[2].notes[2].techniques.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].techniques[0]).toStrictEqual(
      prebendAndReleaseTechnique
    );
    expect(
      tab.bars[0].beats[2].notes[2].techniques[0].bendOptions
    ).toStrictEqual(bendOptions);
  });

  test("Tab apply note technique: vibrato", () => {
    const tab = getTab();

    const vibratoTechnique = new GuitarTechnique(GuitarTechniqueType.Vibrato);
    randomFrets(tab);
    tab.applyTechniqueToNote(0, 2, 3, GuitarTechniqueType.Vibrato);
    expect(tab.bars[0].beats[2].notes[2].techniques.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].techniques[0]).toStrictEqual(
      vibratoTechnique
    );
  });

  test("Tab apply note technique: slide", () => {
    const tab = getTab();
    randomFrets(tab);

    const nextHigher =
      tab.bars[0].beats[2].notes[2].fret! < tab.bars[0].beats[3].notes[2].fret!;
    const bendOptions = new GuitarTechniqueOptions(
      undefined,
      undefined,
      undefined,
      nextHigher
    );
    const slideTechnique = new GuitarTechnique(
      GuitarTechniqueType.Slide,
      bendOptions
    );
    tab.applyTechniqueToNote(0, 2, 3, GuitarTechniqueType.Slide, bendOptions);
    expect(tab.bars[0].beats[2].notes[2].techniques.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].techniques[0]).toStrictEqual(
      slideTechnique
    );
    expect(tab.bars[0].beats[2].notes[2].techniques[0].type).toBe(
      GuitarTechniqueType.Slide
    );
  });

  test("Tab apply note technique: hammer-on", () => {
    const tab = getTab();

    const hammerOnTechnique = new GuitarTechnique(
      GuitarTechniqueType.HammerOnOrPullOff
    );
    randomFrets(tab);
    tab.applyTechniqueToNote(0, 2, 3, GuitarTechniqueType.HammerOnOrPullOff);
    expect(tab.bars[0].beats[2].notes[2].techniques.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].techniques[0]).toStrictEqual(
      hammerOnTechnique
    );
    expect(tab.bars[0].beats[2].notes[2].techniques[0].type).toBe(
      GuitarTechniqueType.HammerOnOrPullOff
    );
  });

  test("Tab apply note technique: pinch harmonic", () => {
    const tab = getTab();

    const phTechnique = new GuitarTechnique(GuitarTechniqueType.PinchHarmonic);
    randomFrets(tab);
    tab.applyTechniqueToNote(0, 2, 3, GuitarTechniqueType.PinchHarmonic);
    expect(tab.bars[0].beats[2].notes[2].techniques.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].techniques[0]).toStrictEqual(
      phTechnique
    );
    expect(tab.bars[0].beats[2].notes[2].techniques[0].type).toBe(
      GuitarTechniqueType.PinchHarmonic
    );
  });

  test("Tab apply note technique: natural harmonic", () => {
    const tab = getTab();

    const nhTechnique = new GuitarTechnique(
      GuitarTechniqueType.NaturalHarmonic
    );
    randomFrets(tab);
    tab.applyTechniqueToNote(0, 2, 3, GuitarTechniqueType.NaturalHarmonic);
    expect(tab.bars[0].beats[2].notes[2].techniques.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].techniques[0]).toStrictEqual(
      nhTechnique
    );
    expect(tab.bars[0].beats[2].notes[2].techniques[0].type).toBe(
      GuitarTechniqueType.NaturalHarmonic
    );
  });

  test("Tab apply note technique: palm-mute", () => {
    const tab = getTab();

    const pmTechnique = new GuitarTechnique(GuitarTechniqueType.PalmMute);
    randomFrets(tab);
    tab.applyTechniqueToNote(0, 2, 3, GuitarTechniqueType.PalmMute);
    expect(tab.bars[0].beats[2].notes[2].techniques.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].techniques[0]).toStrictEqual(
      pmTechnique
    );
    expect(tab.bars[0].beats[2].notes[2].techniques[0].type).toBe(
      GuitarTechniqueType.PalmMute
    );
  });

  test("Tab apply incompatible techniques: natural harmonic + bend", () => {
    const tab = getTab();

    const bendOptions = { bendPitch: 1.5 };
    const bendTechnique = new GuitarTechnique(
      GuitarTechniqueType.Bend,
      bendOptions
    );
    const nhTechnique = new GuitarTechnique(
      GuitarTechniqueType.NaturalHarmonic
    );
    randomFrets(tab);
    tab.applyTechniqueToNote(0, 2, 3, GuitarTechniqueType.Bend, bendOptions);
    const nhApplyResult = tab.applyTechniqueToNote(
      0,
      2,
      3,
      GuitarTechniqueType.NaturalHarmonic
    );

    expect(nhApplyResult).toBe(false);
    expect(tab.bars[0].beats[2].notes[2].techniques.length).toBe(1);
    expect(tab.bars[0].beats[2].notes[2].techniques[0]).toStrictEqual(
      bendTechnique
    );
  });

  test("Tab apply compatible techniques: pinch harmonic + bend", () => {
    const tab = getTab();

    const bendOptions = { bendPitch: 1.5 };
    const bendTechnique = new GuitarTechnique(
      GuitarTechniqueType.Bend,
      bendOptions
    );
    const phTechnique = new GuitarTechnique(GuitarTechniqueType.PinchHarmonic);
    randomFrets(tab);
    tab.applyTechniqueToNote(0, 2, 3, GuitarTechniqueType.Bend, bendOptions);
    const phApplyResult = tab.applyTechniqueToNote(
      0,
      2,
      3,
      GuitarTechniqueType.PinchHarmonic
    );

    expect(phApplyResult).toBe(true);
    expect(tab.bars[0].beats[2].notes[2].techniques.length).toBe(2);
    expect(tab.bars[0].beats[2].notes[2].techniques[0]).toStrictEqual(
      bendTechnique
    );
    expect(tab.bars[0].beats[2].notes[2].techniques[1]).toStrictEqual(
      phTechnique
    );
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
