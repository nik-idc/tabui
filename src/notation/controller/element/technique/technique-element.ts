import { Technique } from "../../../model";
import { NoteElement } from "../note/note-element";
import { Point, Rect } from "../../../../shared";
import { NotationElement } from "../notation-element";

export interface SVGPathDescriptor {
  d: string;
  attrs?: Record<string, string>;
}

export interface SVGTextDescriptor {
  text: string;
  attrs?: Record<string, string>;
}

/**
 * Class that handles geometry & visually relevant info
 * of a note technique. Represents specifically a UI element
 * near the note to which the technique is applied
 */
export interface TechniqueElement extends NotationElement {
  readonly technique: Technique;
  readonly noteElement: NoteElement;
  readonly barLocalCoords: Point;
  readonly barLocalBoundingBox: Rect;

  get pathDescriptors(): SVGPathDescriptor[] | undefined;
  get startPoint(): Point;
  get pathOriginBarLocal(): Point;
  get pathOriginLineLocal(): Point;
  get pathOrigin(): Point;
  get globalCoords(): Point;
}
