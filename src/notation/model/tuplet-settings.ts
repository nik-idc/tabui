import { Beat } from "./beat";
import { MusicInstrument } from "./instrument/instrument";

export type TupletSettings = {
  normalCount: number;
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

/** True when `settings` falls within the storage layer's accepted range. */
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

export function beatsTupletSettingsEqual<I extends MusicInstrument>(
  beat1: Beat<I>,
  beat2: Beat<I>
): boolean {
  return (
    beat1.tupletSettings?.normalCount === beat2.tupletSettings?.normalCount &&
    beat1.tupletSettings?.tupletCount === beat2.tupletSettings?.tupletCount
  );
}

export function tupletSettingsEqual(
  settings1: TupletSettings | null,
  settings2: TupletSettings | null
): boolean {
  return (
    settings1?.normalCount === settings2?.normalCount &&
    settings1?.tupletCount === settings2?.tupletCount
  );
}
