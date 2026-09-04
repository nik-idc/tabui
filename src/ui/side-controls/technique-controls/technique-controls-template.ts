import { createButton, createDiv } from "../../../shared";

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
  readonly vibratoButton: HTMLButtonElement = createButton();
  readonly palmMuteButton: HTMLButtonElement = createButton();
  readonly letRingButton: HTMLButtonElement = createButton();
  readonly nhButton: HTMLButtonElement = createButton();
  readonly phButton: HTMLButtonElement = createButton();
  readonly legatoButton: HTMLButtonElement = createButton();
  readonly slideButton: HTMLButtonElement = createButton();
  readonly bendButton: HTMLButtonElement = createButton();
}
