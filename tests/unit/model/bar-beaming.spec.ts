import { NoteDuration } from "../../../src/notation/model";
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
        isRepeatStart: false,
        isRepeatEnd: false,
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
      expect(beats.map((b) => b.beamGroupId)).toEqual(Array(beatCount).fill(0));
      expect(beats.map((b) => b.lastInBeamGroup)).toEqual([
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

    expect(beats.map((b) => b.beamGroupId)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(beats.map((b) => b.lastInBeamGroup)).toEqual([
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
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      }
    );

    expect(beats.map((b) => b.beamGroupId)).toEqual([0, 0, 0, null, 1, 1, 1]);
    expect(beats.map((b) => b.lastInBeamGroup)).toEqual([
      false,
      false,
      true,
      false,
      false,
      false,
      true,
    ]);
  });

  test("unbeamed beats do not get stray last-in-group markers", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);

    expect(beats.map((b) => b.beamGroupId)).toEqual([null, null, null, null]);
    expect(beats.map((b) => b.lastInBeamGroup)).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  test("single-beat bars expose no beaming groups or metadata", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);

    expect(beats[0].beamGroupId).toBeNull();
    expect(beats[0].lastInBeamGroup).toBe(false);
    expect(bar.getVoiceBar(1)?.beamingGroups).toEqual([]);
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
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      }
    );

    expect(beats.map((b) => b.beamGroupId)).toEqual([0, 0, 1, 1, 2, 2]);
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
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      }
    );

    expect(beats.map((b) => b.beamGroupId)).toEqual([0, 0, 0, 1, 1, 1]);
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

    expect(beats.map((b) => b.beamGroupId)).toEqual([
      0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3,
    ]);
  });

  test("13/8 groups four compound pulses and leaves the final eighth unbeamed", () => {
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
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      }
    );

    expect(beats.map((b) => b.beamGroupId)).toEqual([
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
    expect(beats.map((b) => b.lastInBeamGroup)).toEqual([
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
    ]);
  });
});
