import { GuitarTechnique } from "@/notation/model";
import { Point, Rect } from "@/shared";
import { BeatElement } from "../beat-element";

/**
 * Interface describing a technique label element.
 * Specifically the label above the staff lines
 */
export interface TechniqueLabelElement {
  readonly uuid: number;
  readonly technique: GuitarTechnique;
  readonly beatElement: BeatElement;
  readonly rect: Rect;
  readonly svgPath?: string;

  calc(): void;
  scaleHorBy(scale: number): void;

  get globalCoords(): Point;
}
