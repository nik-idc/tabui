import {
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
});
