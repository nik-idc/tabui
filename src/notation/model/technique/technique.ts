import { Beat } from "../beat";
import { Note } from "../note/note";
import {
  BeatTechniqueType,
  NoteTechniqueType,
  TechniqueType,
} from "./technique-type";

/** Technique JSON format */
export interface TechniqueJSON {
  type: TechniqueType;
}

/**
 * Note level technique
 */
export interface NoteTechnique {
  readonly type: NoteTechniqueType;
  readonly note: Note;

  deepCopy(): NoteTechnique;

  toJSON(): TechniqueJSON;
}

/**
 * Beat level technique
 */
export interface BeatTechnique {
  readonly type: BeatTechniqueType;
  readonly beat: Beat;

  deepCopy(): BeatTechnique;

  toJSON(): TechniqueJSON;
}
