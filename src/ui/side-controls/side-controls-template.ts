import {
  createDiv,
  createImage,
  createDialog,
  createButton,
  createSVG,
} from "@/shared";
import { TechniqueControlsTemplate } from "./technique-controls";
import { BendControlsTemplate } from "./technique-controls/bend-controls/bend-controls-template";
import { MeasureControlsTemplate } from "./measure-controls";
import { NoteControlsTemplate } from "./note-controls";

/**
 * Interface defining the template of side controls:
 * - Note controls
 * - Technique controls
 * - Measure controls
 */
export class SideControlsTemplate {
  readonly container: HTMLDivElement = createDiv();
}
