import { GuitarTechnique } from "@/notation/model";
import { Point, Rect } from "@/shared";
import { BeatElement } from "../beat-element";
import { TechGapLineElement } from "../tech-gap-line-element";
import { NotationElement } from "../notation-element";

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
