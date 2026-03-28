import { BarRepeatStatus, NoteDuration } from "../../src/notation/model";
import { createBarWithBeats } from "./helpers";

describe("Bar beaming", () => {
  test("simple-meter eighth notes beam into expected groups", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
    ]);

    expect(beats.map((beat) => beat.beamGroupId)).toEqual([
      0, 0, 1, 1, 2, 2, 3, 3,
    ]);
    expect(beats.map((beat) => beat.lastInBeamGroup)).toEqual([
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      true,
    ]);
  });

  test("regular beats around a complete tuplet keep separate beam behavior", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth },
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
      { baseDuration: NoteDuration.Eighth },
    ]);

    expect(beats[0].beamGroupId).not.toBe(beats[1].beamGroupId);
    expect(beats[1].beamGroupId).toBe(beats[2].beamGroupId);
    expect(beats[2].beamGroupId).toBe(beats[3].beamGroupId);
    expect(beats[3].beamGroupId).not.toBe(beats[4].beamGroupId);
    expect(beats[1].beamGroupId).toBe(0);
  });

  test("two isolated tuplets in one bar do not collapse into one beam group", () => {
    const { beats } = createBarWithBeats(
      [
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
        { baseDuration: NoteDuration.Quarter },
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
      ],
      {
        tempo: 120,
        beatsCount: 8,
        duration: NoteDuration.Eighth,
        repeatStatus: BarRepeatStatus.None,
        repeatCount: null,
      }
    );

    expect(beats[0].beamGroupId).not.toBeNull();
    expect(beats[4].beamGroupId).not.toBeNull();
    expect(beats[0].beamGroupId).not.toBe(beats[4].beamGroupId);
    expect([beats[0].beamGroupId, beats[4].beamGroupId]).toEqual([0, 1]);
  });

  test("beam group IDs start at zero", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth },
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
      { baseDuration: NoteDuration.Quarter },
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

    const uniqueNonNullIds = [
      ...new Set(
        beats
          .map((beat) => beat.beamGroupId)
          .filter((id): id is number => id !== null)
      ),
    ];

    expect(uniqueNonNullIds).toEqual([0, 1]);
  });

  test("unbeamed beats do not get stray last-in-group markers", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);

    expect(beats.every((beat) => beat.beamGroupId === null)).toBe(true);
    expect(beats.every((beat) => beat.lastInBeamGroup === false)).toBe(true);
  });

  test("3/4 beaming groups eighth notes by quarter-note beats", () => {
    const { beats } = createBarWithBeats(
      [
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
      ],
      {
        tempo: 120,
        beatsCount: 3,
        duration: NoteDuration.Quarter,
        repeatStatus: BarRepeatStatus.None,
        repeatCount: null,
      }
    );

    expect(beats.map((beat) => beat.beamGroupId)).toEqual([0, 0, 1, 1, 2, 2]);
  });

  test("6/8 beaming groups eighth notes in compound pulses", () => {
    const { beats } = createBarWithBeats(
      [
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
      ],
      {
        tempo: 120,
        beatsCount: 6,
        duration: NoteDuration.Eighth,
        repeatStatus: BarRepeatStatus.None,
        repeatCount: null,
      }
    );

    expect(beats.map((beat) => beat.beamGroupId)).toEqual([0, 0, 0, 1, 1, 1]);
  });

  test("mixed eighth and sixteenth durations keep dense beam IDs", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.Sixteenth },
    ]);

    expect(beats.map((beat) => beat.beamGroupId)).toEqual([
      0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3,
    ]);
  });
});
