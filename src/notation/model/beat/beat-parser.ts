import { TabContext } from "../context/tab-context";
import { TrackContext } from "../context/track-context";
import { Guitar } from "../instrument/guitar/guitar";
import { MusicInstrument } from "../instrument/instrument";
import { MusicInstrumentKind } from "../instrument/instrument-kind";
import { GuitarNote } from "../note/guitar-note";
import { BeatGuitarTechnique } from "../technique";
import { Beat } from "./beat";
import { isTupletSettings, TupletSettings } from "./tuplet-settings";

/**
 * Constructs a beat of type Beat<Guitar> from an object
 * @param tabContext Tab context
 * @param obj Object
 * @returns Beat built from the object
 */
export function guitarBeatFromJSON(
  tabContext: TabContext,
  obj: Record<string, unknown>
): Beat<Guitar> {
  if (
    obj.notes === undefined ||
    obj.techniques === undefined ||
    obj.duration === undefined ||
    obj.dots === undefined ||
    obj.beamGroupId === undefined ||
    obj.lastInBeamGroup === undefined
  ) {
    throw Error("Invalid JSON to parse into beat");
  }

  const typeChecks: Record<string, string> = {
    duration: "number",
    dots: "number",
    beamGroupId: "number",
    lastInBeamGroup: "boolean",
  };
  for (const [key, expected] of Object.entries(typeChecks)) {
    if (typeof obj[key] !== expected) {
      throw new Error(
        `Invalid '${key}' type: ` +
          `expected '${expected}', got '${typeof obj[key]}'`
      );
    }
  }

  if (!Array.isArray(obj.notes)) {
    throw Error("Notes not an array");
  }

  if (!Array.isArray(obj.techniques)) {
    throw Error("Techniques not an array");
  }

  const notes = [];
  for (const note of obj.notes) {
    const guitarNote = GuitarNote.fromJSON(tabContext, note);
    notes.push(guitarNote);
  }

  const techniques = [];
  for (const technique of obj.techniques) {
    const beatGuitarTechnique = BeatGuitarTechnique.fromJSON(technique);
    techniques.push(beatGuitarTechnique);
  }

  const tupletSettings = isTupletSettings(obj.tupletSettings)
    ? obj.tupletSettings
    : null;

  return new Beat<Guitar>(
    tabContext,
    notes,
    techniques,
    obj.duration as number,
    obj.dots as number,
    tupletSettings,
    obj.beamGroupId as number | null,
    obj.lastInBeamGroup as boolean
  );
}
