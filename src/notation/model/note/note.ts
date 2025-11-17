import { NoteTechniqueType, TechniqueType } from "../technique/technique-type";
import { TrackContext } from "../context/track-context";
import { MusicInstrument } from "../instrument/instrument";
import { MusicInstrumentType } from "../instrument/instrument-type";
import { NoteTechnique } from "../technique";
import { Beat } from "../beat";

/**
 * Musical notes
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

/**
 * Base note JSON format
 */
export interface NoteJSON {
  instrumentType: MusicInstrumentType;
  noteValue: NoteValue;
  octave: number | null;
}

/**
 * Note interface
 */
export interface Note<I extends MusicInstrument = MusicInstrument> {
  readonly uuid: number;
  readonly beat: Beat<I>;
  readonly trackContext: TrackContext<I>;
  noteValue: NoteValue;
  octave: number | null;
  techniques: NoteTechnique[];

  getNoteStr(): string;

  addTechnique(technique: NoteTechnique): void;
  removeTechnique(type: NoteTechniqueType): void;
  clearTechniques(): void;
  sortTechniques(): void;
  hasTechnique(type: NoteTechniqueType): boolean;
  techniqueApplicable(type: NoteTechniqueType): boolean;
  
  compare(otherNote: Note<I>): boolean;

  deepCopy(): Note<I>;
  toJSON(): NoteJSON | null;
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
/** Highest supported octaveS */
export const HIGHEST_OCTAVE = 9;

/**
 * Verifies if provided nota value & octave values make a valid note
 * @param noteValue Note value
 * @param octave Octave value
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
