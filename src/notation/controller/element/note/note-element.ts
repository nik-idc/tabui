import { Note } from "../../../model";
import { Point, Rect } from "../../../../shared";
import { TechniqueElement } from "../technique";
import { NotationElement } from "../notation-element";
import { BeatElement } from "../beat/beat-element";

/**
 * Interface describing the basic visually relevant
 * info of a note element
 */
export interface NoteElement extends NotationElement {
  readonly note: Note | null;
  readonly beatElement: BeatElement;
  readonly barLocalCoords: Point;
  readonly barLocalBoundingBox: Rect;

  get techniqueElements(): TechniqueElement[];
}
