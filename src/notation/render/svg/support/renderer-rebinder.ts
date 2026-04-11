import { NotationElement } from "@/notation/controller";
import { TrackLineElement } from "@/notation/controller/element/track/track-line-element";
import { TrackLineInfoElement } from "@/notation/controller/element/track/track-line-info-element";
import { StaffLineElement } from "@/notation/controller/element/staff/staff-line-element";
import { NotationStyleLineElement } from "@/notation/controller/element/staff/notation-style-line-element";
import { TechGapElement } from "@/notation/controller/element/staff/tech-gap-element";
import { BarElement } from "@/notation/controller/element/bar/bar-element";
import { TabBeatElement } from "@/notation/controller/element/beat/tab-beat-element";
import { TabNoteElement } from "@/notation/controller/element/note/tab-note-element";
import { TechniqueElement } from "@/notation/controller/element/technique/technique-element";
import { GuitarTechniqueLabelElement } from "@/notation/controller/element/technique/guitar-technique/guitar-technique-label-element";
import { BeamSegmentElement } from "@/notation/controller/element/bar/beam-segment-element";
import { BarTupletGroupElement } from "@/notation/controller/element/bar/bar-tuplet-group-element";
import { TechGapLineElement } from "@/notation/controller/element/staff/tech-gap-line-element";
import { ElementRenderer } from "@/notation/render/element-renderer";
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

export function rebindRendererElement(
  renderer: ElementRenderer,
  element: NotationElement
): void {
  // HACK:
  // Temporary rebinding: TrackElement currently rebuilds element instances.
  // Once the element layer keeps stable identities, this should be replaced
  // with stricter renderer state management.
  if (renderer instanceof SVGTrackLineRenderer) {
    renderer.trackLineElement = element as TrackLineElement;
  } else if (renderer instanceof SVGTrackLineInfoRenderer) {
    renderer.trackLineInfoElement = element as TrackLineInfoElement;
  } else if (renderer instanceof SVGStaffLineRenderer) {
    renderer.staffLineElement = element as StaffLineElement;
  } else if (renderer instanceof SVGStyleLineRenderer) {
    renderer.styleLineElement = element as NotationStyleLineElement;
  } else if (renderer instanceof SVGTechGapRenderer) {
    renderer.techGapElement = element as TechGapElement;
  } else if (renderer instanceof SVGBarRenderer) {
    renderer.barElement = element as BarElement;
  } else if (renderer instanceof SVGTabBeatRenderer) {
    renderer.beatElement = element as TabBeatElement;
  } else if (renderer instanceof SVGTabNoteRenderer) {
    renderer.noteElement = element as TabNoteElement;
  } else if (renderer instanceof SVGTechniqueRenderer) {
    renderer.techniqueElement = element as TechniqueElement;
  } else if (renderer instanceof SVGTechniqueLabelRenderer) {
    renderer.techniqueLabelElement = element as GuitarTechniqueLabelElement;
  } else if (renderer instanceof SVGBeamSegmentRenderer) {
    renderer.beamSegment = element as BeamSegmentElement;
  } else if (renderer instanceof SVGTupletRenderer) {
    renderer.tupletElement = element as BarTupletGroupElement;
  } else if (renderer instanceof SVGTechGapLineRenderer) {
    renderer.techGapLineElement = element as TechGapLineElement;
  }
}
