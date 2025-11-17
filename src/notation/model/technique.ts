import { Note } from "./note";
import {
  TechniqueType,
} from "./technique-type";

/** Technique JSON format */
export interface TechniqueJSON {
  type: TechniqueType;
}

/**
 * Note level technique
 */
export interface Technique {
  readonly type: TechniqueType;
  readonly note: Note;

  deepCopy(): Technique;

  toJSON(): TechniqueJSON;
}
