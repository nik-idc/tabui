import {
  createDiv,
  createImage,
  createDialog,
  createButton,
  createSVG,
} from "@/shared";
import { EffectControlsTemplate } from "./effect-controls";
import { BendControlsTemplate } from "./effect-controls/bend-controls/bend-controls-template";
import { MeasureControlsTemplate } from "./measure-controls";
import { NoteControlsTemplate } from "./note-controls";

/**
 * Interface defining the template of side controls:
 * - Note controls
 * - Effect controls
 * - Measure controls
 */
export class SideControlsTemplate {
  readonly container: HTMLDivElement = createDiv();
}
