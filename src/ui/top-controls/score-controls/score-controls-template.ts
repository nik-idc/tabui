import { createButton, createDiv, createImage, createInput } from "@/shared";
import { TrackControlsTemplate } from "./track-controls/track-controls-template";

/**
 * Interface defining the template of score controls:
 * - Master controls
 * - Track controls
 */
export class ScoreControlsTemplate {
  readonly container: HTMLDivElement = createDiv();
  /**/ readonly masterContainer: HTMLDivElement = createDiv();
  /****/ readonly settingsContainer: HTMLDivElement = createDiv();
  /******/ readonly showTracksButton: HTMLButtonElement = createButton();
  /******/ readonly newTrackButton: HTMLImageElement = createImage();
  /******/ readonly masterVolumeInput: HTMLInputElement = createInput();
  /******/ readonly masterPanningInput: HTMLInputElement = createInput();
  /****/ readonly scoreNameInput: HTMLInputElement = createInput();
  /**/ readonly tracksContainer: HTMLDivElement = createDiv();
  /****/ tracksTemplates: TrackControlsTemplate[] = [];
}
