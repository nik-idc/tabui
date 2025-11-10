import { createButton, createDiv, createImage, createInput } from "@/shared";

/**
 * Interface defining the template of track controls:
 * - Track name
 * - Volume input
 * - Panning input
 */
export class TrackControlsTemplate {
  readonly container: HTMLDivElement = createDiv();
  readonly trackButton: HTMLButtonElement = createButton();
  readonly removeButton: HTMLImageElement = createImage();
  readonly volumeInput: HTMLInputElement = createInput();
  readonly panningInput: HTMLInputElement = createInput();
  readonly muteButton: HTMLImageElement = createImage();
  readonly soloButton: HTMLImageElement = createImage();
  readonly settingsButton: HTMLImageElement = createImage();
}
