import {
  NotationElement,
  NotationElementClass,
  TrackController,
} from "../../../controller";
import { TrackLineElement } from "../../../controller/element/track/track-line-element";
import { TrackLineInfoElement } from "../../../controller/element/track/track-line-info-element";
import { BarElement } from "../../../controller/element/bar/bar-element";
import { TabBeatElement } from "../../../controller/element/beat/tab-beat-element";
import { TabBeatRhythmElement } from "../../../controller/element/beat/tab-beat-rhythm-element";
import { TabNoteSlotElement } from "../../../controller/element/note/tab-note-slot-element";
import { GuitarTechniqueElement } from "../../../controller/element/technique/guitar-technique/guitar-technique-element";
import { GuitarTechniqueLabelElement } from "../../../controller/element/technique/guitar-technique/guitar-technique-label-element";
import { BeamSegmentElement } from "../../../controller/element/bar/beam-segment-element";
import { BarTupletGroupElement } from "../../../controller/element/bar/bar-tuplet-group-element";
import { ElementRenderer, ElementRendererClass } from "../../element-renderer";
import type { ResolvedAssetConfig } from "../../../../config/asset-url-resolver";
import { SVGTrackLineRenderer } from "../svg-track-line-renderer";
import { SVGTrackLineInfoRenderer } from "../svg-track-line-info-renderer";
import { SVGBarRenderer } from "../svg-bar-renderer";
import { SVGTabBeatRenderer } from "../svg-tab-beat-renderer";
import { SVGTabBeatRhythmRenderer } from "../svg-tab-beat-rhythm-renderer";
import { SVGTabNoteRenderer } from "../svg-tab-note-renderer";
import { SVGTechniqueRenderer } from "../svg-technique-renderer";
import { SVGTechniqueLabelRenderer } from "../svg-technique-label-renderer";
import { SVGBeamSegmentRenderer } from "../svg-beam-segment-renderer";
import { SVGTupletRenderer } from "../tuplet/svg-tuplet-renderer";

// WARNING: This heterogeneous map erases the relationship between each element
// class and its renderer constructor. The factory assertion below is therefore
// an intentional type-safety boundary until the registry receives a typed design.
const RENDERER_CTORS = new Map<NotationElementClass, ElementRendererClass>([
  [TrackLineElement, SVGTrackLineRenderer],
  [TrackLineInfoElement, SVGTrackLineInfoRenderer],
  [BarElement, SVGBarRenderer],
  [TabBeatElement, SVGTabBeatRenderer],
  [TabNoteSlotElement, SVGTabNoteRenderer],
  [GuitarTechniqueElement, SVGTechniqueRenderer],
  [GuitarTechniqueLabelElement, SVGTechniqueLabelRenderer],
  [TabBeatRhythmElement, SVGTabBeatRhythmRenderer],
  [BeamSegmentElement, SVGBeamSegmentRenderer],
  [BarTupletGroupElement, SVGTupletRenderer],
]);

export function createRendererForElement(
  trackController: TrackController,
  element: NotationElement,
  assetsPath: ResolvedAssetConfig
): ElementRenderer | undefined {
  const ctor = RENDERER_CTORS.get(element.constructor as NotationElementClass);
  if (ctor === undefined) {
    return undefined;
  }

  return new ctor(trackController, element as any, assetsPath);
}
