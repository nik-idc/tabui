import { createButton, createDiv } from "../../../shared";

/**
 * Interface defining the template of play controls:
 * - First bar button
 * - Prev bar button
 * - Play/pause button
 * - Next bar button
 * - Last bar button
 */
export class PlayControlsTemplate {
  readonly container: HTMLDivElement = createDiv();
  readonly firstButton: HTMLButtonElement = createButton();
  readonly prevButton: HTMLButtonElement = createButton();
  readonly playButton: HTMLButtonElement = createButton();
  readonly nextButton: HTMLButtonElement = createButton();
  readonly lastButton: HTMLButtonElement = createButton();
  readonly loopButton: HTMLButtonElement = createButton();
  readonly rangeButton: HTMLButtonElement = createButton();
}
