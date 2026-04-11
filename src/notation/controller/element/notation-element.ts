import { Point, Rect } from "@/shared";
import { TrackElement } from "./track-element";

export interface NotationElement {
  readonly uuid: number;
  readonly trackElement: TrackElement;

  build(): void;
  measure(): void;
  layout(): void;
  update(): void;

  scaleHorBy(scale: number): void;

  get stateHash(): string;

  get boundingBox(): Rect;
  get globalCoords(): Point;
  get globalBoundingBox(): Rect;

  // Transitional aliases while Pass 2.A migrates active paths.
  get rect(): Rect;
  get globalRect(): Rect;

  getModelUUID(): number;
}

export type NotationElementClass = new (...args: any[]) => NotationElement;
