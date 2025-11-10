import { createDiv, createImage } from "@/shared";

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
  readonly firstButton: HTMLImageElement = createImage();
  readonly prevButton: HTMLImageElement = createImage();
  readonly playButton: HTMLImageElement = createImage();
  readonly nextButton: HTMLImageElement = createImage();
  readonly lastButton: HTMLImageElement = createImage();
  readonly loopButton: HTMLImageElement = createImage();
}
