import { Note } from "./note";
import { TechniqueType } from "./technique-type";

/** Technique JSON format */
export interface TechniqueJSON {
  type: TechniqueType;
}

/**
 * Note level technique
 */
export interface Technique {
  readonly uuid: number;
  readonly type: TechniqueType;
  readonly note: Note;

  deepCopy(note?: Note): Technique;

  toJSON(): TechniqueJSON;
}
