import { BendTechniqueOptions, BendType } from "../../../src/notation/model";

describe("BendTechniqueOptions", () => {
  test.each([
    { type: BendType.Bend, bendPitch: 1, bendDuration: 1 },
    {
      type: BendType.BendAndRelease,
      bendPitch: 1,
      releasePitch: 0,
      bendDuration: 0.5,
    },
    { type: BendType.Hold, holdPitch: 1, bendDuration: 1 },
    { type: BendType.Prebend, prebendPitch: 1 },
    {
      type: BendType.PrebendAndRelease,
      prebendPitch: 1,
      releasePitch: 0,
      bendDuration: 0.5,
    },
    {
      type: BendType.PrebendBend,
      prebendPitch: 0.5,
      bendPitch: 1,
      bendDuration: 0.5,
    },
    { type: BendType.Release, releasePitch: 0, bendDuration: 0.5 },
  ])("accepts complete options for bend type $type", (options) => {
    expect(new BendTechniqueOptions(options)).toMatchObject(options);
  });

  test.each([
    { type: BendType.Bend, bendDuration: 1 },
    { type: BendType.PrebendBend, prebendPitch: 1, bendDuration: 1 },
    {
      type: BendType.BendAndRelease,
      bendPitch: 1,
      releasePitch: Number.NaN,
      bendDuration: 1,
    },
    { type: BendType.Release, releasePitch: -1, bendDuration: 1 },
    { type: BendType.Bend, bendPitch: 1, bendDuration: 2 },
    { type: BendType.Bend, bendPitch: 1, bendDuration: 0 },
    { type: BendType.Bend, bendPitch: 3.5, bendDuration: 1 },
    {
      type: BendType.Prebend,
      prebendPitch: 1,
      bendPitch: 1,
    },
    { type: 99 as BendType, bendPitch: 1, bendDuration: 1 },
  ])("rejects malformed options %#", (options) => {
    expect(() => new BendTechniqueOptions(options)).toThrow();
  });

  test.each([
    [{ type: BendType.Bend, bendPitch: 1, bendDuration: 1 }, 1],
    [{ type: BendType.Prebend, prebendPitch: 0.5 }, 0.5],
    [{ type: BendType.Hold, holdPitch: 1, bendDuration: 1 }, 1],
    [
      {
        type: BendType.PrebendBend,
        prebendPitch: 0.5,
        bendPitch: 1.5,
        bendDuration: 0.5,
      },
      1.5,
    ],
    [
      {
        type: BendType.BendAndRelease,
        bendPitch: 1,
        releasePitch: 0,
        bendDuration: 1,
      },
      undefined,
    ],
    [
      {
        type: BendType.PrebendAndRelease,
        prebendPitch: 1,
        releasePitch: 0.5,
        bendDuration: 0.5,
      },
      undefined,
    ],
    [
      { type: BendType.Release, releasePitch: 0.5, bendDuration: 0.5 },
      undefined,
    ],
  ])("resolves terminal continuation pitch %#", (options, pitch) => {
    expect(new BendTechniqueOptions(options).terminalPitch).toBe(pitch);
  });
});
