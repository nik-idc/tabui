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

/** Technique visual drawn as SVG paths whose coordinates are local to an origin. */
export interface TechniquePathElement extends NotationElement {
  /** Path descriptors, or undefined when nothing is drawn. */
  get pathDescriptors(): SVGPathDescriptor[] | undefined;
  /** Bar-local origin of the path descriptor coordinates. */
  get pathOriginBarLocal(): Point;
}

/**
 * Class that handles geometry & visually relevant info
 * of a note technique. Represents specifically a UI element
 * near the note to which the technique is applied
 */
export interface TechniqueElement extends TechniquePathElement {
  readonly technique: Technique;
  readonly noteElement: NoteElement;
  readonly barLocalCoords: Point;
  readonly barLocalBoundingBox: Rect;

  get startPoint(): Point;
  get pathOriginLineLocal(): Point;
  get pathOrigin(): Point;
  get globalCoords(): Point;
}
