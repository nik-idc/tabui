import { NoteType, NoteValue, shiftNoteValue } from "../../note";
import { DEFAULT_TUNINGS } from "./default-tunings";

/**
 * Checks whitespace-separated, case-insensitive A–G pitch classes against a string count, without octave suffixes.
 * Accepts ASCII # except E#/B#, and Unicode ♭ except C♭/F♭; this spelling contract differs from parseTuning().
 * @param input Pitch-class tokens to check.
 * @param stringCount Required token count.
 * @returns True if all tokens and the count match.
 */
export function isValidGuitarTuning(
  input: string,
  stringCount: number
): boolean {
  // Split on one or more whitespace characters between note names.
  const notes = input.trim().split(/\s+/);
  if (notes.length !== stringCount) {
    return false;
  }

  return notes.every((n) => {
    const note = n.trim();

    // Base note A–G
    const base = note[0]?.toUpperCase();
    const accidental = note[1];

    // Reject anything beyond two characters (e.g. A##, Abb)
    if (note.length > 2) {
      return false;
    }
    if (!/[A-G]/.test(base)) {
      return false;
    }

    // Handle accidentals
    if (!accidental) {
      return true;
    }

    if (accidental === "#") {
      // E/B have no sharps
      return !"EB".includes(base);
    }
    if (accidental === "♭") {
      // C/F have no flats
      return !"CF".includes(base);
    }
    return false;
  });
}

/**
 * Parses whitespace-separated, case-insensitive pitch classes in input order, accepting #, ♯, and X (dead), but not flats.
 * Unknown tokens become None; octaves are inferred as 2 + floor(index / 6), even for dead or empty values.
 * @param tuning Pitch-class tokens, without parsed octave suffixes.
 * @returns New pitch objects; no validation of playable tuning is performed.
 */
export function parseTuning(tuning: string): NoteType[] {
  // Split on one or more whitespace characters between note names.
  const notes = tuning.trim().split(/\s+/);

  const normalize = (n: string): keyof typeof NoteValue => {
    const upper = n.toUpperCase();
    switch (upper) {
      case "A":
        return "A";
      case "A#":
      case "A♯":
        return "ASharp";
      case "B":
        return "B";
      case "C":
        return "C";
      case "C#":
      case "C♯":
        return "CSharp";
      case "D":
        return "D";
      case "D#":
      case "D♯":
        return "DSharp";
      case "E":
        return "E";
      case "F":
        return "F";
      case "F#":
      case "F♯":
        return "FSharp";
      case "G":
        return "G";
      case "G#":
      case "G♯":
        return "GSharp";
      case "X":
        return "Dead";
      default:
        return "None";
    }
  };

  // Base octave for lowest string (adjustable)
  const BASE_OCTAVE = 2;

  // Most stringed instruments rise in pitch every 1–2 strings by an octave.
  // This logic assumes roughly one octave per 6 strings.
  const octaveForString = (index: number): number =>
    BASE_OCTAVE + Math.floor(index / 6);

  return notes.map((n, i) => {
    const noteValue = NoteValue[normalize(n)];
    const octave = octaveForString(i);
    return { noteValue, octave };
  });
}

/**
 * Parses pitch-class tokens into reversed string order, without reading octave suffixes.
 * Uses octaves from the first preset with the same string count when available;
 * otherwise keeps parseTuning's inferred octaves. Unknown tokens become None.
 */
export function parseTuningStrSimple(tuning: string): NoteType[] {
  const parsed = parseTuning(tuning).reverse();
  const defaultTuning = Object.values(DEFAULT_TUNINGS)
    .flatMap((tunings) => Object.values(tunings))
    .find((defaultTuning) => defaultTuning.length === parsed.length);

  if (defaultTuning === undefined) {
    return parsed;
  }

  return parsed.map((note, index) => ({
    noteValue: note.noteValue,
    octave: defaultTuning[index].octave,
  }));
}

/** Returns the first matching preset as reversed, space-separated pitch classes, or null if none matches. */
export function getDefaultTuningStrSimple(stringCount: number): string | null {
  const defaultTuning = Object.values(DEFAULT_TUNINGS)
    .flatMap((tunings) => Object.values(tunings))
    .find((defaultTuning) => defaultTuning.length === stringCount);

  if (defaultTuning === undefined) {
    return null;
  }

  return defaultTuning
    .map((note) => note.noteValue)
    .reverse()
    .join(" ");
}

/**
 * Shifts one pitch-class token and returns space-separated tuning text.
 * @param stringIndex Zero-based token position in the supplied text, not internal tuning order.
 * @param semitones Integer pitch-class offset; use values from -12 through 12.
 * @throws If the index is outside the tokens or the selected token is not an exact playable NoteValue.
 */
export function shiftTuningString(
  tuning: string,
  stringIndex: number,
  semitones: number
): string {
  // Split on one or more whitespace characters between note names.
  const notes = tuning.trim().split(/\s+/);
  if (stringIndex < 0 || stringIndex >= notes.length) {
    throw new Error(`${stringIndex} is invalid tuning string index`);
  }

  notes[stringIndex] = shiftNoteValue(
    notes[stringIndex] as NoteValue,
    semitones
  );
  return notes.join(" ");
}

/**
 * Shifts every pitch-class token, preserving text order and joining with single spaces.
 * @param semitones Integer pitch-class offset; use values from -12 through 12.
 * @throws If any token is not an exact playable NoteValue (uppercase with optional ASCII #).
 */
export function shiftTuningWhole(tuning: string, semitones: number): string {
  return tuning
    .trim()
    .split(/\s+/) // Split on one or more whitespace characters between note names.
    .map((note) => shiftNoteValue(note as NoteValue, semitones))
    .join(" ");
}
