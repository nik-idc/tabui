import {
  DEFAULT_MASTER_BAR,
  MasterBar,
  MeterType,
  NoteDuration,
} from "../../../src/notation/model";

describe("MasterBar.meterType", () => {
  // The same classification that beaming uses.
  test.each([
    ["6/8", 6, NoteDuration.Eighth, MeterType.Compound],
    ["9/8", 9, NoteDuration.Eighth, MeterType.Compound],
    ["12/8", 12, NoteDuration.Eighth, MeterType.Compound],
    ["3/4", 3, NoteDuration.Quarter, MeterType.Simple],
    ["3/8", 3, NoteDuration.Eighth, MeterType.Simple],
    ["4/4", 4, NoteDuration.Quarter, MeterType.Simple],
    ["6/4", 6, NoteDuration.Quarter, MeterType.Irregular],
    ["7/8", 7, NoteDuration.Eighth, MeterType.Irregular],
  ])("%s is %s", (_name, beatsCount, duration, expected) => {
    const bar = new MasterBar({ ...DEFAULT_MASTER_BAR, beatsCount, duration });
    expect(bar.meterType).toBe(expected);
  });
});
