import { createDiv, createImage } from "../../../shared";

/**
 * Interface defining the template of technique controls:
 * - Vibrato
 * - P.M.
 * - Let Ring
 * - NH
 * - PH
 * - Legato
 * - Slide
 * - Bend
 */
export class TechniqueControlsTemplate {
  readonly container: HTMLDivElement = createDiv();

  readonly vibratoButton: HTMLImageElement = createImage();
  readonly palmMuteButton: HTMLImageElement = createImage();
  readonly letRingButton: HTMLImageElement = createImage();
  readonly nhButton: HTMLImageElement = createImage();
  readonly phButton: HTMLImageElement = createImage();
  readonly legatoButton: HTMLImageElement = createImage();
  readonly slideButton: HTMLImageElement = createImage();
  readonly bendButton: HTMLImageElement = createImage();
}
