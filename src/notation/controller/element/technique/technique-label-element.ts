import { Technique } from "../../../model";
import { Point, Rect } from "../../../../shared";
import { NotationElement } from "../notation-element";
import { BeatElement } from "../beat/beat-element";
import { TechGapLineContainer } from "../staff/tech-gap-line-container";
import { SVGPathDescriptor, SVGTextDescriptor } from "./technique-element";

/**
 * Interface describing a technique label element.
 * Specifically the label above the staff lines
 */
export interface TechniqueLabelElement extends NotationElement {
  readonly technique: Technique;
  readonly gapLineContainer: TechGapLineContainer;
  readonly beatElement: BeatElement;

  createPath(): void;

  get pathDescriptors(): SVGPathDescriptor[] | undefined;
  get textDescriptors(): SVGTextDescriptor[] | undefined;
  get descriptorOriginBarLocal(): Point;
  get descriptorOriginLineLocal(): Point;
  get descriptorOrigin(): Point;
}
