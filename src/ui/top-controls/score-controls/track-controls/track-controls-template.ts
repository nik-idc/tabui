import { createButton, createDiv, createInput } from "../../../../shared";

/**
 * Interface defining the template of track controls:
 * - Track name
 * - Volume input
 * - Panning input
 */
export class TrackControlsTemplate {
  readonly container: HTMLDivElement = createDiv();
  readonly selectButton: HTMLButtonElement = createButton();
  readonly moveUpButton: HTMLButtonElement = createButton();
  readonly moveDownButton: HTMLButtonElement = createButton();
  readonly trackNameInput: HTMLInputElement = createInput();
  readonly removeButton: HTMLButtonElement = createButton();
  readonly volumeInput: HTMLInputElement = createInput();
  readonly panningInput: HTMLInputElement = createInput();
  readonly muteButton: HTMLButtonElement = createButton();
  readonly soloButton: HTMLButtonElement = createButton();
  readonly settingsButton: HTMLButtonElement = createButton();
}
