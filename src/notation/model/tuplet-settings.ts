import { Beat } from "./beat";
import { MusicInstrument } from "./instrument/instrument";

/** Tuplet ratio: normalCount notes occupy tupletCount written units, such as 3 in the time of 2. */
export type TupletSettings = {
  /** Number of notes in a complete group; supported integers are 1–256. */
  normalCount: number;
  /** Number of written units occupied by the group; supported integers are 1–256. */
  tupletCount: number;
};

/**
 * Lowest accepted tuplet normalCount. The storage layer accepts any positive
 * integer (matches serialization); the UI stepper intentionally offers 2+ to
 * avoid degenerate 1-tuplets. See `MIN_TUPLET_NORMAL_COUNT_UI`.
 */
export const MIN_TUPLET_NORMAL_COUNT = 1;
/** Highest accepted tuplet normalCount. Shared with serialization & UI. */
export const MAX_TUPLET_NORMAL_COUNT = 256;
/**
 * Lowest accepted tupletCount. `1` round-trips through serialization; the UI
 * stepper uses 2+ (see `MIN_TUPLET_TUPLET_COUNT_UI`).
 */
export const MIN_TUPLET_TUPLET_COUNT = 1;
/** Highest accepted tupletCount. Shared with serialization & UI. */
export const MAX_TUPLET_TUPLET_COUNT = 256;

/** Returns true only when both counts are safe integers in 1–256; null returns false. */
export function tupletSettingsInRange(
  settings: TupletSettings | null
): boolean {
  if (settings === null) {
    return false;
  }
  return (
    Number.isSafeInteger(settings.normalCount) &&
    Number.isSafeInteger(settings.tupletCount) &&
    settings.normalCount >= MIN_TUPLET_NORMAL_COUNT &&
    settings.normalCount <= MAX_TUPLET_NORMAL_COUNT &&
    settings.tupletCount >= MIN_TUPLET_TUPLET_COUNT &&
    settings.tupletCount <= MAX_TUPLET_TUPLET_COUNT
  );
}

/** Checks for two numeric count fields; does not check bounds, finiteness, or integers. */
export function isTupletSettings(
  value: Record<string, unknown> | unknown
): value is TupletSettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    typeof (value as Record<string, unknown>).normalCount === "number" &&
    typeof (value as Record<string, unknown>).tupletCount === "number"
  );
}

/** Compares both beats' tuplet counts; two beats without tuplets are equal. */
export function beatsTupletSettingsEqual<I extends MusicInstrument>(
  beat1: Beat<I>,
  beat2: Beat<I>
): boolean {
  return (
    beat1.tupletSettings?.normalCount === beat2.tupletSettings?.normalCount &&
    beat1.tupletSettings?.tupletCount === beat2.tupletSettings?.tupletCount
  );
}

/** Compares both ratio counts; two null settings are equal. */
export function tupletSettingsEqual(
  settings1: TupletSettings | null,
  settings2: TupletSettings | null
): boolean {
  return (
    settings1?.normalCount === settings2?.normalCount &&
    settings1?.tupletCount === settings2?.tupletCount
  );
}
