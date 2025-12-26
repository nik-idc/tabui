import { Technique } from "@/notation/model";
import { NoteElement } from "../note-element";
import { Point, Rect } from "@/shared";

/**
 * Class that handles geometry & visually relevant info
 * of a note technique. Represents specifically a UI element
 * near the note to which the technique is applied
 */
export interface TechniqueElement {
  readonly uuid: number;
  readonly technique: Technique;
  readonly noteElement: NoteElement;

  build(): void;
  // measure(): void;
  // layout(): void;

  scaleHorBy(scale: number): void;

  get svgPath(): string | undefined;
  get startPoint(): Point;
  get svgPathGlobalCoords(): Point;
  get globalCoords(): Point;
}
