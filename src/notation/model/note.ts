import { TrackContext } from "./track-context";
import { MusicInstrument } from "./instrument/instrument";
import { MusicInstrumentType } from "./instrument/instrument-type";
import { Beat } from "./beat";
import { Technique } from "./technique";
import { TechniqueType } from "./technique-type";

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

export type NoteType = Omit<NoteJSON, "instrumentType">;

/**
 * Note interface
 */
export interface Note<I extends MusicInstrument = MusicInstrument> {
  readonly uuid: number;
  readonly beat: Beat<I>;
  readonly trackContext: TrackContext<I>;
  noteValue: NoteValue;
  octave: number | null;
  techniques: Technique[];

  getNoteStr(): string;

  addTechnique(technique: Technique): boolean;
  removeTechnique(type: TechniqueType): boolean;
  clearTechniques(): void;
  sortTechniques(): void;
  hasTechnique(type: TechniqueType): boolean;
  techniqueApplicable(type: TechniqueType): boolean;

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
