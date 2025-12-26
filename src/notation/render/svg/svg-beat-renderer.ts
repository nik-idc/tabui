import { DURATION_TO_NAME, GuitarNote, NoteDuration } from "@/notation/model";
import { Point, createSVGG, createSVGImage, createSVGRect } from "@/shared";
import { ElementRenderer } from "../element-renderer";
import {
  BeatElement,
  TabLayoutDimensions,
  TrackController,
} from "@/notation/controller";
import { SVGTechniqueLabelRenderer } from "./svg-technique-label-renderer";
import { SVGNoteRenderer } from "./svg-note-renderer";
import { SVGGuitarNoteRenderer } from "./svg-guitar-note-renderer";

/**
 * Class for rendering a beat element using SVG
 */
export interface SVGBeatRenderer {
  readonly trackController: TrackController;
  readonly beatElement: BeatElement;

  render(): ElementRenderer[];
  unrender(): void;

  attachMouseEvent<K extends keyof SVGElementEventMap>(
    eventType: K,
    eventHandler: (
      event: SVGElementEventMap[K],
      beatElement: BeatElement
    ) => void
  ): void;
}
