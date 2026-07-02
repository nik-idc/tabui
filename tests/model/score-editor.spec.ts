import {
  BarRepeatStatus,
  BendTechniqueOptions,
  BendType,
  Beat,
  Guitar,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  ScoreEditor,
} from "../../src/notation/model";
import { createBarWithBeats } from "./helpers";

describe("ScoreEditor", () => {
  function noteBeats(beats: Beat<Guitar>[]): Beat<Guitar>[] {
    return beats.filter((beat) => beat.hasNotes());
  }

  test("removeBars removes the requested original bar indices", () => {
    const { score } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);

    for (let i = 0; i < 6; i++) {
      score.appendMasterBar({
        tempo: 120 + i * 10,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        repeatStatus: BarRepeatStatus.None,
        repeatCount: null,
      });
    }

    const originalUUIDs = score.masterBars.map((bar) => bar.uuid);

    const removedBars = ScoreEditor.removeBars(score, [2, 3, 4]);

    expect(score.masterBars.map((bar) => bar.uuid)).toEqual([
      originalUUIDs[0],
      originalUUIDs[1],
      originalUUIDs[5],
      originalUUIDs[6],
    ]);
    expect(removedBars.map((result) => result.index)).toEqual([2, 3, 4]);
  });

  test("setTupletGroupSettings clears only on exact tuplet match", () => {
    const { beats } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);
    const beat = beats[0];

    ScoreEditor.setTupletGroupSettings(beat, {
      normalCount: 3,
      tupletCount: 1,
    });

    expect(beat.tupletSettings).toEqual({ normalCount: 3, tupletCount: 1 });
  });

  test("setTupletGroupSettings recomputes bar tuplets and beaming", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const beat = beats[0];

    ScoreEditor.setTupletGroupSettings(beat, {
      normalCount: 3,
      tupletCount: 2,
    });

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    expect(voiceBar.tupletGroups).toHaveLength(1);
    expect(voiceBar.tupletGroups[0].beats[0]).toBe(beat);
  });

  test("setDots refreshes tuplet group calculated durations", () => {
    const { bar, beats } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);

    ScoreEditor.setDots([beats[0]], 1);

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    expect(voiceBar.tupletGroups[0].getCalculatedDurationAt(0)).toBeCloseTo(
      1 / 8,
      10
    );
    expect(voiceBar.tupletGroups[0].getDurationTicksAt(0)).toBe(
      beats[0].fullDurationTicks
    );
  });

  test("setDots toggles to zero when setting the same value", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);

    ScoreEditor.setDots([beats[0]], 1);
    expect(beats[0].dots).toBe(1);

    ScoreEditor.setDots([beats[0]], 1);
    expect(beats[0].dots).toBe(0);
  });

  test("setDots rejects invalid dot values", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);

    expect(() => ScoreEditor.setDots([beats[0]], 3)).toThrow(
      "3 is an invalid dots value"
    );
  });

  test("setTupletGroupSettings clears tuplet when same settings are passed", () => {
    const { beats } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);

    ScoreEditor.setTupletGroupSettings(beats[0], {
      normalCount: 3,
      tupletCount: 2,
    });

    expect(beats[0].tupletSettings).toBeNull();
  });

  test("setTuplet toggles matching settings off across multiple beats", () => {
    const { beats } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);

    ScoreEditor.setTuplet(beats, { normalCount: 3, tupletCount: 2 });

    expect(beats[0].tupletSettings).toBeNull();
    expect(beats[1].tupletSettings).toBeNull();
  });

  test("setTimeSignature updates every bar tied to a master bar", () => {
    const { score, track, masterBar, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const extraStaff = track.insertStaff(1).staves[0];
    const siblingBar = extraStaff.bars[0];

    ScoreEditor.setTimeSignature(score, masterBar, 3, NoteDuration.Quarter);

    const voiceBar = bar.getVoiceBar(1);
    const siblingVoiceBar = siblingBar.getVoiceBar(1);
    if (voiceBar === null || siblingVoiceBar === null) {
      throw Error("Expected voice 1 bars");
    }
    expect(voiceBar.barTicks).toBe((voiceBar.tickResolution * 3) / 4);
    expect(siblingVoiceBar.barTicks).toBe(
      (siblingVoiceBar.tickResolution * 3) / 4
    );
    expect(bar.checkDurationsFit()).toBe(false);
    expect(siblingBar.checkDurationsFit()).toBe(false);
  });

  test("replaceBeats copies full rhythmic data for equal-length replacements", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const replacements = [
      createBarWithBeats([
        {
          baseDuration: NoteDuration.Eighth,
          dots: 1,
          tupletSettings: { normalCount: 3, tupletCount: 2 },
        },
      ]).beats[0],
      createBarWithBeats([
        {
          baseDuration: NoteDuration.Sixteenth,
          tupletSettings: { normalCount: 5, tupletCount: 4 },
        },
      ]).beats[0],
    ];

    ScoreEditor.replaceBeats(beats, replacements);

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    expect(voiceBar.beats[0].baseDuration).toBe(NoteDuration.Eighth);
    expect(voiceBar.beats[0].dots).toBe(1);
    expect(voiceBar.beats[0].tupletSettings).toEqual({
      normalCount: 3,
      tupletCount: 2,
    });
    expect(voiceBar.beats[1].baseDuration).toBe(NoteDuration.Sixteenth);
    expect(voiceBar.beats[1].tupletSettings).toEqual({
      normalCount: 5,
      tupletCount: 4,
    });
  });

  test("replaceBeats updates timing when replacing with more beats", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const replacements = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Quarter },
    ]).beats;

    const insertedBeats = ScoreEditor.replaceBeats(beats, replacements);

    expect(insertedBeats).toHaveLength(3);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    expect(noteBeats(voiceBar.beats)).toHaveLength(3);
    expect(noteBeats(voiceBar.beats).map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Eighth,
      NoteDuration.Eighth,
      NoteDuration.Quarter,
    ]);
    expect(voiceBar.actualTicks).toBe((voiceBar.tickResolution * 3) / 4);
  });

  test("replaceBeats updates timing when replacing with fewer beats", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const replacements = createBarWithBeats([
      {
        baseDuration: NoteDuration.Quarter,
        dots: 1,
      },
    ]).beats;

    const remainingBeats = ScoreEditor.replaceBeats(beats, replacements);

    expect(remainingBeats).toHaveLength(1);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    expect(noteBeats(voiceBar.beats)).toHaveLength(1);
    expect(noteBeats(voiceBar.beats)[0].baseDuration).toBe(
      NoteDuration.Quarter
    );
    expect(noteBeats(voiceBar.beats)[0].dots).toBe(1);
    expect(voiceBar.actualTicks).toBe((voiceBar.tickResolution * 5) / 8);
  });

  test("removeBeats replaces the last removed content with a rest", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }

    ScoreEditor.removeBeats([...voiceBar.beats]);

    expect(noteBeats(voiceBar.beats)).toHaveLength(0);
    expect(voiceBar.beats).toHaveLength(1);
    expect(voiceBar.beats[0].isRest()).toBe(true);
  });

  test("setTechniqueNotes toggles a live technique on and off", () => {
    const { beats } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Quarter,
      },
    ]);
    const note = beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

    note.fret = 3;

    expect(
      ScoreEditor.setTechniqueNotes([note], GuitarTechniqueType.LetRing)
    ).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);

    expect(
      ScoreEditor.setTechniqueNotes([note], GuitarTechniqueType.LetRing)
    ).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(false);
  });

  test("setTechniqueNotes returns false for incompatible technique application", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const note = beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

    note.fret = 5;

    ScoreEditor.setTechniqueNotes([note], GuitarTechniqueType.NaturalHarmonic);

    const changed = ScoreEditor.setTechniqueNotes(
      [note],
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1,
        bendDuration: 1,
      })
    );

    expect(changed).toBe(false);
    expect(note.hasTechnique(GuitarTechniqueType.NaturalHarmonic)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.Bend)).toBe(false);
  });

  test("setTechniqueNotes on mixed selection removes only already-applied notes", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const first = beats[0].notes?.[0];
    const second = beats[0].notes?.[1];
    if (!(first instanceof GuitarNote) || !(second instanceof GuitarNote)) {
      throw Error("Expected guitar notes in test beat");
    }

    first.fret = 3;
    second.fret = 5;

    ScoreEditor.setTechniqueNotes([first], GuitarTechniqueType.LetRing);

    const changed = ScoreEditor.setTechniqueNotes(
      [first, second],
      GuitarTechniqueType.LetRing
    );

    expect(changed).toBe(true);
    expect(first.hasTechnique(GuitarTechniqueType.LetRing)).toBe(false);
    expect(second.hasTechnique(GuitarTechniqueType.LetRing)).toBe(false);
  });

  test("setTechniqueNotes throws when bend options are missing for bend", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const note = beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

    note.fret = 5;

    expect(() =>
      ScoreEditor.setTechniqueNotes([note], GuitarTechniqueType.Bend)
    ).toThrow("Bend passed without options");
  });
});
