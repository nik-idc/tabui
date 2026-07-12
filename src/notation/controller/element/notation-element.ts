import { Point, Rect } from "../../../shared";
import { TrackElement } from "./track-element";
import { VoiceNumber } from "../../model";
import type { BarElement } from "./bar/bar-element";
import type { TrackLineElement } from "./track/track-line-element";

export interface NotationElement {
  readonly uuid: number;
  readonly trackElement: TrackElement;
  readonly voiceNumber: VoiceNumber | null;
  readonly owningTrackLineElement: TrackLineElement;
  readonly owningBarElement: BarElement | null;

  build(): void;
  measure(): void;
  layout(): void;
  update(): void;

  get stateHash(): string;

  get boundingBox(): Rect;
  readonly lineLocalCoords: Point;
  readonly lineLocalBoundingBox: Rect;
  get globalCoords(): Point;
  get globalBoundingBox(): Rect;

  // Transitional aliases while Pass 2.A migrates active paths.
  get rect(): Rect;
  get globalRect(): Rect;

  getStableIdentity(): string;
  refreshOwnedNotationElements(): NotationElement[];
}

export type NotationElementClass = new (...args: any[]) => NotationElement;
