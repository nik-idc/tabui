export enum NoteDuration {
  Whole = 1,
  Half = 1 / 2,
  Quarter = 1 / 4,
  Eighth = 1 / 8,
  Sixteenth = 1 / 16,
  ThirtySecond = 1 / 32,
  SixtyFourth = 1 / 64,
}

export const DURATION_TO_NAME = {
  [NoteDuration.Whole]: "1",
  [NoteDuration.Half]: "2",
  [NoteDuration.Quarter]: "4",
  [NoteDuration.Eighth]: "8",
  [NoteDuration.Sixteenth]: "16",
  [NoteDuration.ThirtySecond]: "32",
  [NoteDuration.SixtyFourth]: "64",
};
