import { NoteType, NoteValue, shiftNoteValue } from "../../note";
import { DEFAULT_TUNINGS } from "./default-tunings";

/**
 * 🚨🚨🚨 !!! AI SLOP !!! 🚨🚨🚨
 * Checks if the provided string fits format:
 * "*note_1* *note_2* ... *note_N*" where N is the string count
 * Example of valid tuning: "A# B A# f# G# c"
 * Example of invalid tuning: "A## b# ff iamanidiot"
 * @param input Input string
 * @param stringCount String count
 * @returns True if tuning is valid, false otherwise
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
 * 🚨🚨🚨 !!! AI SLOP !!! 🚨🚨🚨
 * Parses tuning string
 * @param tuning Tuning string
 * @returns Parsed array of note objects
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

export function shiftTuningWhole(tuning: string, semitones: number): string {
  return tuning
    .trim()
    .split(/\s+/) // Split on one or more whitespace characters between note names.
    .map((note) => shiftNoteValue(note as NoteValue, semitones))
    .join(" ");
}
