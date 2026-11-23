import {
  getNoteFromSemitones,
  getSemitonesFromNote,
  HIGHEST_OCTAVE,
  LOWEST_OCTAVE,
  NoteType,
  NoteValue,
} from "../../note";

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
 * Shifts a pitch by semitones and carries the octave, so B4 + 1 is C5.
 * Returns the note unchanged when it has no pitch or the result would leave
 * the supported octaves.
 */
export function shiftPitch(note: NoteType, semitones: number): NoteType {
  if (
    note.octave === null ||
    note.noteValue === NoteValue.Dead ||
    note.noteValue === NoteValue.None
  ) {
    return note;
  }
  const shifted = getNoteFromSemitones(
    getSemitonesFromNote(note.noteValue, note.octave) + semitones
  );
  if (shifted.octave < LOWEST_OCTAVE || shifted.octave > HIGHEST_OCTAVE) {
    return note;
  }
  return shifted;
}

/** Copies a tuning, so it can change without changing the source. */
export function copyTuning(tuning: readonly NoteType[]): NoteType[] {
  return tuning.map((note) => ({ ...note }));
}

/** True when both tunings have the same pitches, octaves included. */
export function tuningsEqual(
  a: readonly NoteType[],
  b: readonly NoteType[]
): boolean {
  return (
    a.length === b.length &&
    a.every(
      (note, i) =>
        note.noteValue === b[i].noteValue && note.octave === b[i].octave
    )
  );
}
