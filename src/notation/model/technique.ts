import { Note } from "./note";
import { TechniqueType } from "./technique-type";

/**
 * Note level technique
 */
export interface Technique {
  readonly uuid: number;
  readonly type: TechniqueType;
  readonly note: Note;

  deepCopy(note?: Note): Technique;
}
