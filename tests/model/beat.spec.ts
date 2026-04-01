import { GuitarNote, NoteDuration } from "../../src/notation/model";
import { createBarWithBeats, createBeat } from "./helpers";

describe("Beat model", () => {
  test("compare uses tuplet settings value equality", () => {
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

    expect(beats[0].compare(beats[1])).toBe(true);
  });

  test("setNote rejects index equal to notes length", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const beat = beats[0];

    expect(() => beat.setNote(beat.notes.length, beat.notes[0])).toThrow(Error);
  });

  test("setNote replaces note at a valid index", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const beat = beats[0];
    const sourceBeat = createBeat(bar, NoteDuration.Quarter);
    const note = sourceBeat.notes[0] as GuitarNote;
    note.fret = 3;

    const result = beat.setNote(0, note);

    expect(result.index).toBe(0);
    expect(result.notes).toHaveLength(1);
    expect((beat.notes[0] as GuitarNote).fret).toBe(3);
  });

  test("exposes tick timing fields after bar rebuild", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth, dots: 1 },
    ]);

    bar.rebuildTiming();

    expect(beats[0].startTick).toBe(0);
    expect(beats[0].endTick).toBe(beats[0].fullDurationTicks);
    expect(beats[1].startTick).toBe(beats[0].endTick);
    expect(beats[1].endTick).toBe(
      beats[1].startTick + beats[1].fullDurationTicks
    );
    expect(beats[0].baseDurationTicks).toBeGreaterThan(0);
  });
});
