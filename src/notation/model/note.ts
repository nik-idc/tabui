import { TrackContext } from "./track-context";
import { MusicInstrument } from "./instrument/instrument";
import { Beat } from "./beat";
import { Technique } from "./technique";
import { TechniqueType } from "./technique-type";

/**
 * Pitch classes plus Dead (an unpitched strike) and None (an empty note slot).
 */
export enum NoteValue {
  A = "A",
  ASharp = "A#",
  B = "B",
  C = "C",
  CSharp = "C#",
  D = "D",
  DSharp = "D#",
  E = "E",
  F = "F",
  FSharp = "F#",
  G = "G",
  GSharp = "G#",
  Dead = "X",
  None = "",
}

/** Pitch data; dead and empty notes use a null octave. */
export type NoteType = {
  /** Pitch class, dead-note marker, or empty-note marker. */
  noteValue: NoteValue;
  /** Scientific pitch octave, or null for an unpitched note. */
  octave: number | null;
};

/**
 * Note interface
 */
export interface Note<I extends MusicInstrument = MusicInstrument> {
  /** Unique model identifier. */
  readonly uuid: number;
  /** Owning beat. */
  readonly beat: Beat<I>;
  /** Shared instrument context of the owning track. */
  readonly trackContext: TrackContext<I>;
  /** Pitch class, or the dead/empty marker. */
  noteValue: NoteValue;
  /** Pitch octave, or null for dead and empty notes. */
  octave: number | null;
  /** Live collection of note-level techniques. */
  techniques: Technique[];

  /**
   * Changes pitch and updates instrument-specific note data.
   * @throws If the pitch or its instrument-specific representation is invalid.
   */
  setNote(newNoteValue: NoteValue, newOctave: number | null): void;
  /** Returns pitch text with octave, "x" for a dead note, or empty text for an empty note. */
  getNoteStr(): string;

  /**
   * Adds an applicable, compatible technique; returns whether it was added. This note must belong to its beat.
   * @throws If transition lookup fails because this note's beat is a rest or an adjacent voice has no beats.
   */
  addTechnique(technique: Technique): boolean;
  /** Removes the first technique of this type; returns whether one was removed. */
  removeTechnique(type: TechniqueType): boolean;
  /** Removes all techniques from this note. */
  clearTechniques(): void;
  /** Sorts techniques in descending technique-type order. */
  sortTechniques(): void;
  /** Returns whether a technique of this type is present. */
  hasTechnique(type: TechniqueType): boolean;
  /**
   * Checks note state, transition targets, and technique compatibility. This note must belong to its beat.
   * @throws If transition lookup fails because this note's beat is a rest or an adjacent voice has no beats.
   */
  isTechniqueApplicable(type: TechniqueType): boolean;

  /** Compares pitch and instrument-specific position, ignoring UUID and techniques. */
  compare(otherNote: Note<I>): boolean;

  /**
   * Copies this note and its techniques into the given beat, or its current beat by default.
   * @throws If copied note or technique data is invalid for the destination instrument.
   */
  deepCopy(beat?: Beat<I>): Note<I>;
}

/** Array of all 12 musical notes */
export const NOTES_ARR: NoteValue[] = [
  NoteValue.A,
  NoteValue.ASharp,
  NoteValue.B,
  NoteValue.C,
  NoteValue.CSharp,
  NoteValue.D,
  NoteValue.DSharp,
  NoteValue.E,
  NoteValue.F,
  NoteValue.FSharp,
  NoteValue.G,
  NoteValue.GSharp,
];

/** Array of all possible note values */
export const NOTE_VALUES_ARR: NoteValue[] = [
  NoteValue.A,
  NoteValue.ASharp,
  NoteValue.B,
  NoteValue.C,
  NoteValue.CSharp,
  NoteValue.D,
  NoteValue.DSharp,
  NoteValue.E,
  NoteValue.F,
  NoteValue.FSharp,
  NoteValue.G,
  NoteValue.GSharp,
  NoteValue.Dead,
  NoteValue.None,
];

/** Number of notes per octave */
export const NOTES_PER_OCTAVE = NOTES_ARR.length;
/** Lowest supported octave */
export const LOWEST_OCTAVE = 0;
/** Highest supported octave. */
export const HIGHEST_OCTAVE = 9;

/**
 * Shifts a playable pitch class without tracking octave changes.
 * @param semitones Integer offset; use -12 through 12 for a full octave in either direction.
 * Larger negative offsets are not normalized reliably.
 * @throws If noteValue is not one of the twelve playable pitch classes.
 */
export function shiftNoteValue(
  noteValue: NoteValue,
  semitones: number
): NoteValue {
  const index = NOTES_ARR.indexOf(noteValue);
  if (index === -1) {
    throw new Error(`Unsupported note value: ${noteValue}`);
  }

  const nextIndex = (index + semitones + NOTES_ARR.length) % NOTES_ARR.length;
  return NOTES_ARR[nextIndex];
}

/**
 * Maps our NoteValue enum to its semitone offset from C
 */
const SEMITONE_MAP: Record<string, number> = {
  [NoteValue.C]: 0,
  [NoteValue.CSharp]: 1,
  [NoteValue.D]: 2,
  [NoteValue.DSharp]: 3,
  [NoteValue.E]: 4,
  [NoteValue.F]: 5,
  [NoteValue.FSharp]: 6,
  [NoteValue.G]: 7,
  [NoteValue.GSharp]: 8,
  [NoteValue.A]: 9,
  [NoteValue.ASharp]: 10,
  [NoteValue.B]: 11,
};

/**
 * Converts a pitch class and octave into semitones from C0, without validation.
 * Dead, None, or unknown pitch values produce NaN.
 */
export function getSemitonesFromNote(
  noteValue: NoteValue,
  octave: number
): number {
  return octave * NOTES_PER_OCTAVE + SEMITONE_MAP[noteValue];
}

/**
 * Converts a finite integer offset from C0 into pitch data, including negative octaves.
 * Does not enforce model octave bounds.
 * @throws If the offset has no matching pitch class, such as fractional or non-finite input.
 */
export function getNoteFromSemitones(semitonesFromC0: number): {
  noteValue: NoteValue;
  octave: number;
} {
  const octave = Math.floor(semitonesFromC0 / NOTES_PER_OCTAVE);
  const semitone =
    ((semitonesFromC0 % NOTES_PER_OCTAVE) + NOTES_PER_OCTAVE) %
    NOTES_PER_OCTAVE;
  const noteValue = Object.entries(SEMITONE_MAP).find(
    ([, value]) => value === semitone
  )?.[0] as NoteValue | undefined;

  if (noteValue === undefined) {
    throw Error(`Invalid semitone offset: ${semitone}`);
  }

  return { noteValue, octave };
}

/** Returns equal-tempered Hz (A4 = 440), or zero for dead/empty notes or a null octave. */
export function getNoteFrequency(note: Note): number {
  // Handle Dead notes or None by returning 0 (silence)
  if (
    note.noteValue === NoteValue.Dead ||
    note.noteValue === NoteValue.None ||
    note.octave === null
  ) {
    return 0;
  }

  return getFrequencyFromNoteType(note);
}

/** A4 reference frequency in Hz, the equal-temperament tuning anchor. */
const A4_REFERENCE_FREQUENCY_HZ = 440;
/** Semitone offset of A4 from C0: 4 octaves * 12 + A's semitone offset (9). */
const A4_SEMITONES_FROM_C0 = getSemitonesFromNote(NoteValue.A, 4);

/** Returns equal-tempered Hz (A4 = 440), or zero for dead/empty pitch data or a null octave. */
export function getFrequencyFromNoteType(note: NoteType): number {
  if (note.noteValue === NoteValue.Dead || note.noteValue === NoteValue.None) {
    return 0;
  }

  if (note.octave === null) {
    return 0;
  }

  const semitonesFromC0 = getSemitonesFromNote(note.noteValue, note.octave);
  const semitonesFromA4 = semitonesFromC0 - A4_SEMITONES_FROM_C0;
  return (
    A4_REFERENCE_FREQUENCY_HZ * Math.pow(2, semitonesFromA4 / NOTES_PER_OCTAVE)
  );
}

/**
 * Checks pitch membership, octave presence, and supported octave bounds.
 * @param noteValue Playable pitch class, Dead, or None.
 * @param octave Required for playable pitches, omitted for Dead and None; bounds are 0–9, without an integer check.
 * @throws If the pitch is unknown, octave presence is wrong, or the octave is outside bounds.
 */
export function verifyNote(noteValue: NoteValue, octave?: number): void {
  if (!NOTE_VALUES_ARR.includes(noteValue)) {
    throw Error(`Invalid note value. Note value - ${noteValue}`);
  }

  if (
    octave !== undefined &&
    (octave < LOWEST_OCTAVE || octave > HIGHEST_OCTAVE)
  ) {
    throw Error(`Invalid octave. Provided octave - ${octave}`);
  }

  if (
    noteValue !== NoteValue.None &&
    noteValue !== NoteValue.Dead &&
    octave === undefined
  ) {
    throw Error("Octave not provided for a playable note");
  }

  if (
    (noteValue === NoteValue.None || noteValue === NoteValue.Dead) &&
    octave !== undefined
  ) {
    throw Error("Octave provided for an unplayable note");
  }
}
