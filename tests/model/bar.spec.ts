import { NoteDuration } from "../../src/notation/model";
import { createBarWithBeats, createBeat, createScoreGraph } from "./helpers";

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
});
