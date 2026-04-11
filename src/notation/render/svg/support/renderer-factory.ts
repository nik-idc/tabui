import {
  NotationElement,
  NotationElementClass,
  TrackController,
} from "@/notation/controller";
import { TrackLineElement } from "@/notation/controller/element/track/track-line-element";
import { TrackLineInfoElement } from "@/notation/controller/element/track/track-line-info-element";
import { StaffLineElement } from "@/notation/controller/element/staff/staff-line-element";
import { NotationStyleLineElement } from "@/notation/controller/element/staff/notation-style-line-element";
import { TechGapElement } from "@/notation/controller/element/staff/tech-gap-element";
import { BarElement } from "@/notation/controller/element/bar/bar-element";
import { TabBeatElement } from "@/notation/controller/element/beat/tab-beat-element";
import { TabNoteElement } from "@/notation/controller/element/note/tab-note-element";
import { GuitarTechniqueElement } from "@/notation/controller/element/technique/guitar-technique/guitar-technique-element";
import { GuitarTechniqueLabelElement } from "@/notation/controller/element/technique/guitar-technique/guitar-technique-label-element";
import { BeamSegmentElement } from "@/notation/controller/element/bar/beam-segment-element";
import { BarTupletGroupElement } from "@/notation/controller/element/bar/bar-tuplet-group-element";
import { TechGapLineElement } from "@/notation/controller/element/staff/tech-gap-line-element";
import {
  ElementRenderer,
  ElementRendererClass,
} from "@/notation/render/element-renderer";
import { SVGTrackLineRenderer } from "../svg-track-line-renderer";
import { SVGTrackLineInfoRenderer } from "../svg-track-line-info-renderer";
import { SVGStaffLineRenderer } from "../svg-staff-line-renderer";
import { SVGStyleLineRenderer } from "../svg-style-line-renderer";
import { SVGTechGapRenderer } from "../svg-tech-gap-renderer";
import { SVGBarRenderer } from "../svg-bar-renderer";
import { SVGTabBeatRenderer } from "../svg-tab-beat-renderer";
import { SVGTabNoteRenderer } from "../svg-tab-note-renderer";
import { SVGTechniqueRenderer } from "../svg-technique-renderer";
import { SVGTechniqueLabelRenderer } from "../svg-technique-label-renderer";
import { SVGBeamSegmentRenderer } from "../svg-beam-segment-renderer";
import { SVGTupletRenderer } from "../tuplet/svg-tuplet-renderer";
import { SVGTechGapLineRenderer } from "../svg-tech-gap-line-renderer";
import { RendererCtor } from "./renderer-types";

const RENDERER_CTORS = new Map<NotationElementClass, ElementRendererClass>([
  [TrackLineElement, SVGTrackLineRenderer],
  [TrackLineInfoElement, SVGTrackLineInfoRenderer],
  [StaffLineElement, SVGStaffLineRenderer],
  [NotationStyleLineElement, SVGStyleLineRenderer],
  [TechGapElement, SVGTechGapRenderer],
  [BarElement, SVGBarRenderer],
  [TabBeatElement, SVGTabBeatRenderer],
  [TabNoteElement, SVGTabNoteRenderer],
  [GuitarTechniqueElement, SVGTechniqueRenderer],
  [GuitarTechniqueLabelElement, SVGTechniqueLabelRenderer],
  [BeamSegmentElement, SVGBeamSegmentRenderer],
  [BarTupletGroupElement, SVGTupletRenderer],
  [TechGapLineElement, SVGTechGapLineRenderer],
]);

export function createRendererForElement(
  trackController: TrackController,
  element: NotationElement,
  assetsPath: string
): ElementRenderer | undefined {
  const ctor = RENDERER_CTORS.get(element.constructor as NotationElementClass);
  if (ctor === undefined) {
    return undefined;
  }

  return new ctor(trackController, element as any, assetsPath);
}
