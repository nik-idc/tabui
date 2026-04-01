import { BarRepeatStatus, NoteDuration } from "../../src/notation/model";
import { createBarWithBeats, createBeat, createScoreGraph } from "./helpers";
import { fillBar } from "../../editor/data/helpers";

describe("Bar model", () => {
  test("new bar starts with one empty seed beat", () => {
    const { bar } = createScoreGraph();

    expect(bar.beats).toHaveLength(1);
    expect(bar.beats[0].isEmpty()).toBe(true);
    expect(bar.beats[0].baseDuration).toBe(NoteDuration.Quarter);
  });

  test("removeBeat rejects index equal to current length", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);

    expect(() => bar.removeBeat(bar.beats.length)).toThrow(Error);
  });

  test("isEmpty returns true for a bar with one empty seed beat", () => {
    const { bar } = createScoreGraph();

    expect(bar.isEmpty()).toBe(true);
  });

  test("removeBeat resets bar to one empty seed beat when removing the last beat", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);

    const result = bar.removeBeat(0);

    expect(result).toHaveLength(1);
    expect(bar.beats).toHaveLength(1);
    expect(bar.beats[0].isEmpty()).toBe(true);
    expect(bar.beats[0].baseDuration).toBe(NoteDuration.Quarter);
  });

  test("appendBeats with no arguments inserts one empty beat", () => {
    const { bar } = createScoreGraph();

    const result = bar.appendBeats();

    expect(bar.beats).toHaveLength(2);
    expect(result.index).toBe(1);
    expect(result.beats).toHaveLength(1);
    expect(result.beats[0]).toBe(bar.beats[1]);
    expect(bar.beats[1].isEmpty()).toBe(true);
  });

  test("appendBeats appends provided beats at the end", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const inputBeat = createBeat(bar, NoteDuration.Eighth);

    const result = bar.appendBeats([inputBeat]);

    expect(result.index).toBe(1);
    expect(bar.beats).toHaveLength(2);
    expect(result.beats[0]).toBe(bar.beats[1]);
    expect(bar.beats[1].baseDuration).toBe(NoteDuration.Eighth);
  });

  test("prependBeats prepends provided beats at the beginning", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const inputBeat = createBeat(bar, NoteDuration.Eighth);

    const result = bar.prependBeats([inputBeat]);

    expect(result.index).toBe(0);
    expect(bar.beats).toHaveLength(2);
    expect(result.beats[0]).toBe(bar.beats[0]);
    expect(bar.beats[0].baseDuration).toBe(NoteDuration.Eighth);
  });

  test("toJSON strips a sole empty seed beat", () => {
    const { bar } = createScoreGraph();

    expect(bar.toJSON().beats).toHaveLength(0);
  });

  test("rebuildTiming computes bar and beat ticks", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth, dots: 1 },
      { baseDuration: NoteDuration.Sixteenth },
    ]);

    bar.rebuildTiming();

    expect(bar.tickResolution).toBeGreaterThan(0);
    expect(bar.barTicks).toBe(bar.tickResolution);
    expect(bar.actualTicks).toBe(
      beats[0].fullDurationTicks +
        beats[1].fullDurationTicks +
        beats[2].fullDurationTicks
    );
    expect(beats[0].startTick).toBe(0);
    expect(beats[1].startTick).toBe(beats[0].endTick);
    expect(beats[2].startTick).toBe(beats[1].endTick);
  });

  test("checkDurationsFit and beatPlayable use tick-based bar bounds", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Whole },
      { baseDuration: NoteDuration.Eighth },
    ]);

    expect(bar.checkDurationsFit()).toBe(false);
    expect(bar.beatPlayable(beats[0])).toBe(true);
    expect(bar.beatPlayable(beats[1])).toBe(false);
  });

  test("fillBar rebuilds timing for reused seed-beat bars", () => {
    const { bar } = createScoreGraph({
      tempo: 120,
      beatsCount: 1,
      duration: NoteDuration.Whole,
      repeatStatus: BarRepeatStatus.None,
      repeatCount: null,
    });

    fillBar(bar, {
      beatsCount: 1,
      beatsDuration: NoteDuration.Whole,
    });

    expect(bar.checkDurationsFit()).toBe(true);
    expect(bar.actualTicks).toBe(bar.barTicks);
  });
});
