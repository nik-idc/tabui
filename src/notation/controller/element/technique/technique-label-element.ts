import { Technique } from "@/notation/model";
import { Point, Rect } from "@/shared";
import { NotationElement } from "@/notation/controller/element/notation-element";
import { BeatElement } from "@/notation/controller/element/beat/beat-element";
import { TechGapLineElement } from "@/notation/controller/element/staff/tech-gap-line-element";
import { SVGPathDescriptor, SVGTextDescriptor } from "./technique-element";

/**
 * Interface describing a technique label element.
 * Specifically the label above the staff lines
 */
export interface TechniqueLabelElement extends NotationElement {
  readonly technique: Technique;
  readonly gapLineElement: TechGapLineElement;
  readonly beatElement: BeatElement;

  createPath(): void;

  get pathDescriptors(): SVGPathDescriptor[] | undefined;
  get textDescriptors(): SVGTextDescriptor[] | undefined;
  get descriptorOrigin(): Point;
}
