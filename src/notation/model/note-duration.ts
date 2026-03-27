export enum NoteDuration {
  Whole = 1,
  Half = 1 / 2,
  Quarter = 1 / 4,
  Eighth = 1 / 8,
  Sixteenth = 1 / 16,
  ThirtySecond = 1 / 32,
  SixtyFourth = 1 / 64,
}

/** Duration to name map */
export const DURATION_TO_NAME: Record<NoteDuration, string> = {
  [NoteDuration.Whole]: "1",
  [NoteDuration.Half]: "2",
  [NoteDuration.Quarter]: "4",
  [NoteDuration.Eighth]: "8",
  [NoteDuration.Sixteenth]: "16",
  [NoteDuration.ThirtySecond]: "32",
  [NoteDuration.SixtyFourth]: "64",
};

export const DURATION_TO_DESC: Record<NoteDuration, string> = {
  [NoteDuration.Whole]: "Whole",
  [NoteDuration.Half]: "Half",
  [NoteDuration.Quarter]: "Quarter",
  [NoteDuration.Eighth]: "Eighth",
  [NoteDuration.Sixteenth]: "Sixteenth",
  [NoteDuration.ThirtySecond]: "Thirty-second",
  [NoteDuration.SixtyFourth]: "Sixty-fourth",
};

export const MAX_FLAG_COUNT = 4;
export const DURATION_TO_FLAG_COUNT: Record<NoteDuration, number> = {
  [NoteDuration.Whole]: 0,
  [NoteDuration.Half]: 0,
  [NoteDuration.Quarter]: 0,
  [NoteDuration.Eighth]: 1,
  [NoteDuration.Sixteenth]: 2,
  [NoteDuration.ThirtySecond]: 3,
  [NoteDuration.SixtyFourth]: 4,
};
