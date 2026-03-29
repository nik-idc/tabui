import { NoteDuration, ScoreEditor } from "../../src/notation/model";
import { createBarWithBeats } from "./helpers";

describe("Bar tuplets", () => {
  test("contiguous beats with matching tuplet settings form one complete group", () => {
    const { bar } = createBarWithBeats([
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

    expect(bar.tupletGroups).toHaveLength(1);
    expect(bar.tupletGroups[0].complete).toBe(true);
  });

  test("incomplete tuplet groups stay marked incomplete", () => {
    const { bar } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);

    expect(bar.tupletGroups).toHaveLength(1);
    expect(bar.tupletGroups[0].complete).toBe(false);
  });

  test("dotted tuplets recalculate group durations after dot changes", () => {
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

    ScoreEditor.setDots([beats[1]], 1);

    expect(bar.tupletGroups[0].getCalculatedDurationAt(1)).toBe(
      beats[1].fullDuration * (2 / 3)
    );
  });

  test("tuplet settings change beat fullDuration with expected ratio", () => {
    const { beats } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
      },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);

    expect(beats[0].fullDuration).toBeCloseTo(1 / 8, 10);
    expect(beats[1].fullDuration).toBeCloseTo(1 / 12, 10);
    expect(beats[1].fullDuration / beats[0].fullDuration).toBeCloseTo(
      2 / 3,
      10
    );
  });

  test("tuplet grouping splits when contiguous settings are interrupted", () => {
    const { bar } = createBarWithBeats([
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

    expect(bar.tupletGroups).toHaveLength(2);
    expect(bar.tupletGroups[0].beats).toHaveLength(2);
    expect(bar.tupletGroups[1].beats).toHaveLength(2);
    expect(bar.tupletGroups[0].complete).toBe(false);
    expect(bar.tupletGroups[1].complete).toBe(false);
  });
});
