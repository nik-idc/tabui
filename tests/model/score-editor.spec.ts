import {
  BendTechniqueOptions,
  BendType,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  ScoreEditor,
} from "../../src/notation/model";
import { createBarWithBeats } from "./helpers";

describe("ScoreEditor", () => {
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

    expect(bar.tupletGroups).toHaveLength(1);
    expect(bar.tupletGroups[0].beats[0]).toBe(beat);
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

    const before = bar.tupletGroups[0].getCalculatedDurationAt(0);

    ScoreEditor.setDots([beats[0]], 1);

    expect(bar.tupletGroups[0].getCalculatedDurationAt(0)).toBeGreaterThan(
      before
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

  test("removeBeats preserves seed-beat invariant when all beats are removed", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);

    ScoreEditor.removeBeats([...bar.beats]);

    expect(bar.beats).toHaveLength(1);
    expect(bar.beats[0].isEmpty()).toBe(true);
  });

  test("setTechniqueNotes toggles a live technique on and off", () => {
    const { beats } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Quarter,
      },
    ]);
    const note = beats[0].notes[0] as GuitarNote;
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
    const note = beats[0].notes[0] as GuitarNote;
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
    const first = beats[0].notes[0] as GuitarNote;
    const second = beats[0].notes[1] as GuitarNote;
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
    const note = beats[0].notes[0] as GuitarNote;
    note.fret = 5;

    expect(() =>
      ScoreEditor.setTechniqueNotes([note], GuitarTechniqueType.Bend)
    ).toThrow("Bend passed without options");
  });
});
