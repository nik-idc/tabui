import {
  SerializedDynamic,
  SerializedNoteDuration,
  SerializedStringInstrumentTone,
  SerializedStringInstrumentType,
} from "../tabui/v1/schema";

/** MusicXML `<type>` values for each note duration. */
export const DURATION_TO_TYPE: Record<SerializedNoteDuration, string> = {
  [SerializedNoteDuration.Whole]: "whole",
  [SerializedNoteDuration.Half]: "half",
  [SerializedNoteDuration.Quarter]: "quarter",
  [SerializedNoteDuration.Eighth]: "eighth",
  [SerializedNoteDuration.Sixteenth]: "16th",
  [SerializedNoteDuration.ThirtySecond]: "32nd",
  [SerializedNoteDuration.SixtyFourth]: "64th",
};

/** Note durations by MusicXML `<type>` value. */
export const TYPE_TO_DURATION: Record<string, SerializedNoteDuration> =
  Object.fromEntries(
    Object.entries(DURATION_TO_TYPE).map(([duration, type]) => [
      type,
      duration as SerializedNoteDuration,
    ])
  );

/** Note duration length in quarter notes, as [numerator, denominator]. */
export const DURATION_QUARTERS: Record<
  SerializedNoteDuration,
  [number, number]
> = {
  [SerializedNoteDuration.Whole]: [4, 1],
  [SerializedNoteDuration.Half]: [2, 1],
  [SerializedNoteDuration.Quarter]: [1, 1],
  [SerializedNoteDuration.Eighth]: [1, 2],
  [SerializedNoteDuration.Sixteenth]: [1, 4],
  [SerializedNoteDuration.ThirtySecond]: [1, 8],
  [SerializedNoteDuration.SixtyFourth]: [1, 16],
};

/** Time signature denominators for each note duration. */
export const DURATION_TO_BEAT_TYPE: Record<SerializedNoteDuration, number> = {
  [SerializedNoteDuration.Whole]: 1,
  [SerializedNoteDuration.Half]: 2,
  [SerializedNoteDuration.Quarter]: 4,
  [SerializedNoteDuration.Eighth]: 8,
  [SerializedNoteDuration.Sixteenth]: 16,
  [SerializedNoteDuration.ThirtySecond]: 32,
  [SerializedNoteDuration.SixtyFourth]: 64,
};

/** MusicXML dynamics element names that TabUI supports. */
export const DYNAMIC_NAMES: readonly SerializedDynamic[] =
  Object.values(SerializedDynamic);

/**
 * General MIDI programs (zero-based) written for each tone. Ukulele has no
 * General MIDI program, so it is written as a nylon guitar.
 */
export const TONE_TO_GM_PROGRAM: Record<
  SerializedStringInstrumentTone,
  number
> = {
  [SerializedStringInstrumentTone.Nylon]: 24,
  [SerializedStringInstrumentTone.Steel]: 25,
  [SerializedStringInstrumentTone.ElectricClean]: 27,
  [SerializedStringInstrumentTone.ElectricOverdrive]: 29,
  [SerializedStringInstrumentTone.ElectricDistortion]: 30,
  [SerializedStringInstrumentTone.BassAcoustic]: 32,
  [SerializedStringInstrumentTone.BassClean]: 33,
  [SerializedStringInstrumentTone.BassDistortion]: 36,
  [SerializedStringInstrumentTone.Banjo]: 105,
  [SerializedStringInstrumentTone.Ukulele]: 24,
};

/** TabUI program numbers (zero-based) for each tone, as the model expects. */
export const TONE_TO_TABUI_PROGRAM: Record<
  SerializedStringInstrumentTone,
  number
> = {
  ...TONE_TO_GM_PROGRAM,
  [SerializedStringInstrumentTone.Banjo]: 25,
};

/** Instrument type for each tone. */
export const TONE_TO_TYPE: Record<
  SerializedStringInstrumentTone,
  SerializedStringInstrumentType
> = {
  [SerializedStringInstrumentTone.Nylon]:
    SerializedStringInstrumentType.AcousticGuitar,
  [SerializedStringInstrumentTone.Steel]:
    SerializedStringInstrumentType.AcousticGuitar,
  [SerializedStringInstrumentTone.ElectricClean]:
    SerializedStringInstrumentType.ElectricGuitar,
  [SerializedStringInstrumentTone.ElectricOverdrive]:
    SerializedStringInstrumentType.ElectricGuitar,
  [SerializedStringInstrumentTone.ElectricDistortion]:
    SerializedStringInstrumentType.ElectricGuitar,
  [SerializedStringInstrumentTone.BassAcoustic]:
    SerializedStringInstrumentType.BassGuitar,
  [SerializedStringInstrumentTone.BassClean]:
    SerializedStringInstrumentType.BassGuitar,
  [SerializedStringInstrumentTone.BassDistortion]:
    SerializedStringInstrumentType.BassGuitar,
  [SerializedStringInstrumentTone.Banjo]: SerializedStringInstrumentType.Other,
  [SerializedStringInstrumentTone.Ukulele]:
    SerializedStringInstrumentType.Other,
};

/** Default highest fret for each tone, matching the default instruments. */
export const TONE_TO_FRETS: Record<SerializedStringInstrumentTone, number> = {
  [SerializedStringInstrumentTone.Nylon]: 18,
  [SerializedStringInstrumentTone.Steel]: 18,
  [SerializedStringInstrumentTone.ElectricClean]: 24,
  [SerializedStringInstrumentTone.ElectricOverdrive]: 24,
  [SerializedStringInstrumentTone.ElectricDistortion]: 24,
  [SerializedStringInstrumentTone.BassAcoustic]: 24,
  [SerializedStringInstrumentTone.BassClean]: 24,
  [SerializedStringInstrumentTone.BassDistortion]: 24,
  [SerializedStringInstrumentTone.Banjo]: 22,
  [SerializedStringInstrumentTone.Ukulele]: 15,
};

/** Greatest common divisor of two non-negative integers. */
export function gcd(a: number, b: number): number {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

/** Least common multiple of two positive integers. */
export function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

/**
 * Returns a beat's length in quarter notes as a reduced [numerator,
 * denominator] pair, including dots and tuplets.
 */
export function beatQuarters(
  duration: SerializedNoteDuration,
  dots: number,
  tuplet: { normalCount: number; tupletCount: number } | null
): [number, number] {
  let [numerator, denominator] = DURATION_QUARTERS[duration];
  const dotScale = 2 ** dots;
  numerator *= 2 * dotScale - 1;
  denominator *= dotScale;
  if (tuplet !== null) {
    numerator *= tuplet.tupletCount;
    denominator *= tuplet.normalCount;
  }
  const divisor = gcd(numerator, denominator);
  return [numerator / divisor, denominator / divisor];
}
