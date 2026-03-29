import { GuitarTechnique } from "@/notation/model";
import { Point, Rect } from "@/shared";
import { NotationElement } from "@/notation/controller/element/notation-element";
import { BeatElement } from "@/notation/controller/element/beat/beat-element";
import { TechGapLineElement } from "@/notation/controller/element/staff/tech-gap-line-element";

/**
 * Interface describing a technique label element.
 * Specifically the label above the staff lines
 */
export interface TechniqueLabelElement extends NotationElement {
  readonly technique: GuitarTechnique;
  readonly gapLineElement: TechGapLineElement;
  readonly beatElement: BeatElement;

  createPath(): void;

  get svgPath(): string | undefined;
}
