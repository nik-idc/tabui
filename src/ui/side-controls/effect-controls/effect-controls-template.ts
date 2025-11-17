import { createDiv, createImage } from "@/shared";
import { BendControlsTemplate } from "./bend-controls/bend-controls-template";

/**
 * Interface defining the template of technique controls:
 * - Vibrato
 * - P.M.
 * - NH
 * - PH
 * - Hammer-on
 * - Pull-off
 * - Slide
 * - Bend
 */
export class TechniqueControlsTemplate {
  readonly container: HTMLDivElement = createDiv();

  readonly vibratoButton: HTMLImageElement = createImage();
  readonly palmMuteButton: HTMLImageElement = createImage();
  readonly nhButton: HTMLImageElement = createImage();
  readonly phButton: HTMLImageElement = createImage();
  readonly hammerOnButton: HTMLImageElement = createImage();
  readonly pullOffButton: HTMLImageElement = createImage();
  readonly slideButton: HTMLImageElement = createImage();
  readonly bendButton: HTMLImageElement = createImage();
}
