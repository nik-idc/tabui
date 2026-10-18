import {
  BendTechniqueOptions,
  BendType,
  Beat,
  Guitar,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  ScoreEditor,
} from "../../../src/notation/model";
import { createBarWithBeats, createBeat } from "./helpers";

describe("ScoreEditor", () => {
  function noteBeats(beats: Beat<Guitar>[]): Beat<Guitar>[] {
    return beats.filter((beat) => beat.hasNotes());
  }

  test("removeBars removes each requested original bar index once in index order", () => {
    const { score } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);

    for (let i = 0; i < 6; i++) {
      score.appendMasterBar({
        tempo: 120 + i * 10,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      });
    }

    const originalUUIDs = score.masterBars.map((bar) => bar.uuid);
    const originalMasterBars = [...score.masterBars];
    const staff = score.tracks[0].staves[0];
    const originalBars = [...staff.bars];

    const removedBars = ScoreEditor.removeBars(score, [4, 2, 3, 2]);

    expect(score.masterBars.map((bar) => bar.uuid)).toEqual([
      originalUUIDs[0],
      originalUUIDs[1],
      originalUUIDs[5],
      originalUUIDs[6],
    ]);
    expect(removedBars.map((result) => result.index)).toEqual([2, 3, 4]);
    expect(staff.bars).toEqual([
      originalBars[0],
      originalBars[1],
      originalBars[5],
      originalBars[6],
    ]);
    removedBars.forEach((v, i) => {
      expect(v.masterBar).toBe(originalMasterBars[i + 2]);
      expect(v.bars.size).toBe(1);
      expect(v.bars.get(staff.uuid)).toBe(originalBars[i + 2]);
    });
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

  test("setTupletGroupSettings clears when passed the same settings", () => {
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

  test("setTupletGroupSettings rebuilds group membership and timing", () => {
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
    expect(voiceBar.tupletGroups[0].beats).toEqual([beat]);
    expect(voiceBar.tupletGroups[0].complete).toBe(false);
    expect(beats.map((b) => b.startTick / voiceBar.tickResolution)).toEqual([
      0,
      1 / 12,
      5 / 24,
    ]);

    ScoreEditor.setTupletGroupSettings(beat, {
      normalCount: 3,
      tupletCount: 2,
    });

    expect(voiceBar.tupletGroups).toHaveLength(0);
    expect(beats.map((b) => b.startTick / voiceBar.tickResolution)).toEqual([
      0,
      1 / 8,
      1 / 4,
    ]);
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

  test("setDots applies the requested value to a mixed selection", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter, dots: 1 },
      { baseDuration: NoteDuration.Quarter, dots: 0 },
    ]);

    ScoreEditor.setDots(beats, 1);

    expect(beats.map((beat) => beat.dots)).toEqual([1, 1]);
  });

  test("setDots rejects invalid dot values", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);

    expect(() => ScoreEditor.setDots([beats[0]], 3)).toThrow();
    expect(beats[0].dots).toBe(0);
    expect(beats[0].fullDurationTicks / beats[0].voiceBar.tickResolution).toBe(
      1 / 4
    );
  });

  test("setDurations applies the requested value to a mixed selection", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);

    ScoreEditor.setDurations(beats, NoteDuration.Quarter);

    expect(beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
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

  test("setTuplet applies the requested settings to a mixed selection", () => {
    const { beats } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      { baseDuration: NoteDuration.Eighth },
    ]);

    ScoreEditor.setTuplet(beats, { normalCount: 3, tupletCount: 2 });

    expect(beats.map((beat) => beat.tupletSettings)).toEqual([
      { normalCount: 3, tupletCount: 2 },
      { normalCount: 3, tupletCount: 2 },
    ]);
  });

  test("setTimeSignatures updates every bar tied to an edited master bar", () => {
    const { score, track, masterBar, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const extraStaff = track.insertStaff(1).staves[0];
    const siblingBar = extraStaff.bars[0];
    const voiceBar = bar.getVoiceBar(1);
    const siblingVoiceBar = siblingBar.getVoiceBar(1);
    if (voiceBar === null || siblingVoiceBar === null) {
      throw Error("Expected voice 1 bars");
    }
    siblingVoiceBar.replaceBeats(
      [1, 2, 3, 4].map(() => createBeat(siblingVoiceBar, NoteDuration.Quarter))
    );
    expect(bar.checkDurationsFit()).toBe(true);
    expect(siblingBar.checkDurationsFit()).toBe(true);

    ScoreEditor.setTimeSignatures(score, [
      { masterBar, beatsCount: 3, duration: NoteDuration.Quarter },
    ]);

    expect(masterBar.beatsCount).toBe(3);
    // Four quarter notes still occupy four ticks; the new meter allows three.
    for (const voice of [voiceBar, siblingVoiceBar]) {
      expect(voice.tickResolution).toBe(4);
      expect(voice.barTicks).toBe(3);
      expect(voice.actualTicks).toBe(4);
    }
    expect(bar.checkDurationsFit()).toBe(false);
    expect(siblingBar.checkDurationsFit()).toBe(false);
  });

  test("replaceBeats copies full rhythmic data for equal-length replacements", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const replacements = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        dots: 1,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Sixteenth,
        tupletSettings: { normalCount: 5, tupletCount: 4 },
      },
    ]).beats;

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

  test("replaceBeats copies note techniques independently of the source", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const source = createBarWithBeats([{ baseDuration: NoteDuration.Quarter }])
      .beats[0];
    const sourceNote = source.notes?.[0];
    if (!(sourceNote instanceof GuitarNote)) {
      throw Error("Expected guitar note in source beat");
    }
    sourceNote.fret = 5;
    ScoreEditor.setTechniqueNotes(
      [sourceNote],
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1,
        bendDuration: 1,
      })
    );

    ScoreEditor.replaceBeats(beats, [source]);

    const voiceBar = bar.getVoiceBar(1);
    const copiedNote = voiceBar?.beats[0].notes?.[0];
    if (!(copiedNote instanceof GuitarNote)) {
      throw Error("Expected guitar note in copied beat");
    }
    expect(copiedNote.hasTechnique(GuitarTechniqueType.Bend)).toBe(true);
    expect(copiedNote.fret).toBe(5);
    expect(copiedNote.techniques[0]).not.toBe(sourceNote.techniques[0]);
    expect(copiedNote.techniques[0].bendOptions?.bendPitch).toBe(1);
    expect(copiedNote.techniques[0].note).toBe(copiedNote);

    copiedNote.fret = 7;
    ScoreEditor.setTechniqueNotes([copiedNote], GuitarTechniqueType.Bend);

    expect(copiedNote.hasTechnique(GuitarTechniqueType.Bend)).toBe(false);
    expect(sourceNote.fret).toBe(5);
    expect(sourceNote.hasTechnique(GuitarTechniqueType.Bend)).toBe(true);
    expect(sourceNote.techniques[0].bendOptions?.bendPitch).toBe(1);
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

    const output = ScoreEditor.replaceBeats(beats, replacements);

    expect(output.insertedBeats).toHaveLength(3);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    expect(voiceBar.beats).toHaveLength(3);
    expect(noteBeats(voiceBar.beats).map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Eighth,
      NoteDuration.Eighth,
      NoteDuration.Quarter,
    ]);
    expect(voiceBar.actualTicks).toBe(voiceBar.tickResolution / 2);
  });

  test("replaceBeats updates timing when replacing with fewer beats", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const replacements = createBarWithBeats([
      {
        baseDuration: NoteDuration.Half,
        dots: 1,
      },
    ]).beats;

    const output = ScoreEditor.replaceBeats(beats, replacements);

    expect(output.insertedBeats).toHaveLength(1);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    expect(voiceBar.beats).toHaveLength(1);
    expect(noteBeats(voiceBar.beats)[0].baseDuration).toBe(NoteDuration.Half);
    expect(noteBeats(voiceBar.beats)[0].dots).toBe(1);
    expect(voiceBar.actualTicks).toBe((voiceBar.tickResolution * 3) / 4);
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

  test("setTechniqueNotes replaces existing bend options without toggling", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const note = beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 5;
    const initialOptions = new BendTechniqueOptions({
      type: BendType.Bend,
      bendPitch: 0.5,
      bendDuration: 1,
    });
    const replacementOptions = new BendTechniqueOptions({
      type: BendType.PrebendBend,
      prebendPitch: 0.5,
      bendPitch: 1,
      bendDuration: 0.75,
    });
    ScoreEditor.setTechniqueNotes(
      [note],
      GuitarTechniqueType.Bend,
      initialOptions
    );

    expect(
      ScoreEditor.setTechniqueNotes(
        [note],
        GuitarTechniqueType.Bend,
        replacementOptions
      )
    ).toBe(true);
    expect(note.techniques).toHaveLength(1);
    expect(note.techniques[0].bendOptions).toEqual(replacementOptions);

    expect(
      ScoreEditor.setTechniqueNotes(
        [note],
        GuitarTechniqueType.Bend,
        replacementOptions
      )
    ).toBe(false);
    expect(note.techniques).toHaveLength(1);
    expect(note.techniques[0].bendOptions).toEqual(replacementOptions);
  });

  test("bend options replace and add across a mixed selection", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const first = beats[0].notes?.[0];
    const second = beats[0].notes?.[1];
    if (!(first instanceof GuitarNote) || !(second instanceof GuitarNote)) {
      throw Error("Expected guitar notes in test beat");
    }
    first.fret = 5;
    second.fret = 5;
    ScoreEditor.setTechniqueNotes(
      [first],
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 0.5,
        bendDuration: 1,
      })
    );
    const replacementOptions = new BendTechniqueOptions({
      type: BendType.Bend,
      bendPitch: 1,
      bendDuration: 0.75,
    });

    expect(
      ScoreEditor.setTechniqueNotes(
        [first, second],
        GuitarTechniqueType.Bend,
        replacementOptions
      )
    ).toBe(true);
    expect(first.techniques).toHaveLength(1);
    expect(second.techniques).toHaveLength(1);
    expect(first.techniques[0].bendOptions).toEqual(replacementOptions);
    expect(second.techniques[0].bendOptions).toEqual(replacementOptions);
  });

  test("invalid replacement options leave the existing bend unchanged", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const note = beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 5;
    ScoreEditor.setTechniqueNotes(
      [note],
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 0.5,
        bendDuration: 1,
      })
    );
    const invalidOptions = new BendTechniqueOptions({
      type: BendType.Bend,
      bendPitch: 1,
      bendDuration: 1,
    });
    // JavaScript callers can change readonly options after construction.
    (invalidOptions as { bendPitch: number }).bendPitch = Number.NaN;

    expect(() =>
      ScoreEditor.setTechniqueNotes(
        [note],
        GuitarTechniqueType.Bend,
        invalidOptions
      )
    ).toThrow();
    expect(note.techniques).toHaveLength(1);
    expect(note.techniques[0].bendOptions).toMatchObject({
      type: BendType.Bend,
      bendPitch: 0.5,
      bendDuration: 1,
    });
  });

  test("setTechniqueNotes on mixed selection applies to unapplied notes", () => {
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
    expect(first.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(second.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
  });

  test.each([1, 2] as const)(
    "setDots removes %s dots when every selected beat has them",
    (dots) => {
      const { beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter },
      ]);
      ScoreEditor.setDots(beats, dots);
      expect(beats.map((beat) => beat.dots)).toEqual([dots, dots]);

      ScoreEditor.setDots(beats, dots);

      expect(beats.map((beat) => beat.dots)).toEqual([0, 0]);
    }
  );

  test("setTechniqueNotes removes a technique only when all notes have it", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const notes = beats
      .flatMap((beat) => beat.notes ?? [])
      .filter((note): note is GuitarNote => note instanceof GuitarNote);
    const first = beats[0].notes?.[0];
    const second = beats[1].notes?.[0];
    if (!(first instanceof GuitarNote) || !(second instanceof GuitarNote)) {
      throw Error("Expected guitar notes in test beat");
    }

    first.fret = 5;
    second.fret = 7;
    expect(notes).toHaveLength(12);
    expect(
      ScoreEditor.setTechniqueNotes(notes, GuitarTechniqueType.LetRing)
    ).toBe(true);
    expect(first.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(second.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);

    expect(
      ScoreEditor.setTechniqueNotes(notes, GuitarTechniqueType.LetRing)
    ).toBe(true);
    expect(first.hasTechnique(GuitarTechniqueType.LetRing)).toBe(false);
    expect(second.hasTechnique(GuitarTechniqueType.LetRing)).toBe(false);
    const emptyNotes = notes.filter(
      (note) => note !== first && note !== second
    );
    expect(emptyNotes).toHaveLength(10);
    for (const note of emptyNotes) {
      expect(note.fret).toBeNull();
      expect(note.techniques).toEqual([]);
    }
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
    expect(note.techniques).toEqual([]);
  });
});
