import { Note } from "@/notation/model";
import { Point, Rect } from "@/shared";
import { GuitarTechniqueElement } from "./technique";
import { BeatElement } from "./beat-element";
import { NotationElement } from "./notation-element";

/**
 * Interface describing the basic visually relevant
 * info of a note element
 */
export interface NoteElement extends NotationElement {
  readonly note: Note;
  readonly beatElement: BeatElement;

  get guitarTechniqueElements(): GuitarTechniqueElement[];
}
