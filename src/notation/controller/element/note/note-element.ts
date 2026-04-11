import { Note } from "@/notation/model";
import { Point, Rect } from "@/shared";
import { TechniqueElement } from "../technique";
import { NotationElement } from "@/notation/controller/element/notation-element";
import { BeatElement } from "../beat/beat-element";

/**
 * Interface describing the basic visually relevant
 * info of a note element
 */
export interface NoteElement extends NotationElement {
  readonly note: Note;
  readonly beatElement: BeatElement;

  get techniqueElements(): TechniqueElement[];
}
