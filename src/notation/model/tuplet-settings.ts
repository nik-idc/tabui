import { Beat } from "./beat";
import { MusicInstrument } from "./instrument/instrument";

export type TupletSettings = {
  normalCount: number;
  tupletCount: number;
};

export type TupletSettingsJSON = TupletSettings;

export function isTupletSettings(
  value: Record<string, unknown> | unknown
): value is TupletSettings {
  if (typeof value !== "object" || !value) {
    return false;
  }

  return (
    value &&
    typeof (value as Record<string, unknown>).normalCount === "number" &&
    typeof (value as Record<string, unknown>).tupletCount === "number"
  );
}

export function tupletSettingsEqual<I extends MusicInstrument>(
  beat1: Beat<I>,
  beat2: Beat<I>
): boolean {
  return (
    beat1.tupletSettings?.normalCount === beat2.tupletSettings?.normalCount &&
    beat1.tupletSettings?.tupletCount === beat2.tupletSettings?.tupletCount
  );
}
