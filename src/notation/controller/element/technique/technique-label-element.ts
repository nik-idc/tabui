import { GuitarTechnique } from "@/notation/model";
import { Point, Rect } from "@/shared";
import { BeatElement } from "../beat-element";
import { TechGapLineElement } from "../tech-gap-line-element";

/**
 * Interface describing a technique label element.
 * Specifically the label above the staff lines
 */
export interface TechniqueLabelElement {
  readonly uuid: number;
  readonly technique: GuitarTechnique;
  readonly gapLineElement: TechGapLineElement;
  readonly beatElement: BeatElement;

  measure(): void;
  layout(): void;
  createPath(): void;

  scaleHorBy(scale: number): void;

  get globalCoords(): Point;
  get rect(): Rect;
  get svgPath(): string | undefined;
}
