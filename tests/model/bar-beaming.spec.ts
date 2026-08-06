import { BarRepeatStatus, NoteDuration } from "../../src/notation/model";
import { createBarWithBeats, createBeat, createScoreGraph } from "./helpers";

describe("Bar beaming", () => {
  test.each([
    ["1/1", NoteDuration.Whole, NoteDuration.Eighth, 8],
    ["1/2", NoteDuration.Half, NoteDuration.Eighth, 4],
    ["1/4", NoteDuration.Quarter, NoteDuration.Eighth, 2],
    ["1/8", NoteDuration.Eighth, NoteDuration.Sixteenth, 2],
    ["1/16", NoteDuration.Sixteenth, NoteDuration.ThirtySecond, 2],
    ["1/32", NoteDuration.ThirtySecond, NoteDuration.SixtyFourth, 2],
  ])(
    "%s accepts a complete subdivision",
    (_signature, meterDuration, beatDuration, beatCount) => {
      const { bar } = createScoreGraph({
        tempo: 120,
        beatsCount: 1,
        duration: meterDuration,
        repeatStatus: BarRepeatStatus.None,
        repeatCount: null,
      });
      const voiceBar = bar.getVoiceBar(1);
      if (voiceBar === null) {
        throw Error("Expected voice 1 bar");
      }
      const beats = Array.from({ length: beatCount }, () =>
        createBeat(voiceBar, beatDuration)
      );

      voiceBar.replaceBeats(beats);

      expect(voiceBar.getActualBarDuration()).toBe(meterDuration);
      expect(beats.map((beat) => beat.beamGroupId)).toEqual(
        Array(beatCount).fill(0)
      );
      expect(beats.map((beat) => beat.lastInBeamGroup)).toEqual([
        ...Array(beatCount - 1).fill(false),
        true,
      ]);
    }
  );

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

  test("single-beat bars expose no beaming groups", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);

    expect(beats[0].beamGroupId).toBeNull();
    expect(beats[0].lastInBeamGroup).toBe(false);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    expect(voiceBar.beamingGroups).toEqual([]);
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

  test("13/8 creates deterministic beam groups", () => {
    const { beats } = createBarWithBeats(
      [
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
        { baseDuration: NoteDuration.Eighth },
      ],
      {
        tempo: 120,
        beatsCount: 13,
        duration: NoteDuration.Eighth,
        repeatStatus: BarRepeatStatus.None,
        repeatCount: null,
      }
    );

    expect(beats.map((beat) => beat.beamGroupId)).toEqual([
      0,
      0,
      0,
      1,
      1,
      1,
      2,
      2,
      2,
      3,
      3,
      3,
      null,
    ]);
    expect(beats[2].lastInBeamGroup).toBe(true);
    expect(beats[5].lastInBeamGroup).toBe(true);
    expect(beats[8].lastInBeamGroup).toBe(true);
    expect(beats[11].lastInBeamGroup).toBe(true);
  });
});
