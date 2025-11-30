import { Technique } from "@/notation/model";
import { NoteElement } from "../note-element";
import { Point, Rect } from "@/shared";

/**
 * Class that handles geometry & visually relevant info
 *  of a note technique. Represents specifically a UI element
 *  near the note to which the technique is applied
 */
export interface TechniqueElement {
  readonly uuid: number;
  readonly technique: Technique;
  readonly guitarNoteElement: NoteElement;
  readonly rect?: Rect;
  readonly svgPath?: string;

  calc(): void;
  scaleHorBy(scale: number): void;

  get startPoint(): Point;
  get globalCoords(): Point;
}
