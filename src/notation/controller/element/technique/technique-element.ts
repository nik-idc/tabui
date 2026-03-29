import { Technique } from "@/notation/model";
import { NoteElement } from "../note/note-element";
import { Point, Rect } from "@/shared";
import { NotationElement } from "@/notation/controller/element/notation-element";

/**
 * Class that handles geometry & visually relevant info
 * of a note technique. Represents specifically a UI element
 * near the note to which the technique is applied
 */
export interface TechniqueElement extends NotationElement {
  readonly technique: Technique;
  readonly noteElement: NoteElement;

  get svgPath(): string | undefined;
  get startPoint(): Point;
  get svgPathGlobalCoords(): Point;
  get globalCoords(): Point;
}
