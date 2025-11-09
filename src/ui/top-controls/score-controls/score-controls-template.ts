import { createButton, createDiv, createImage, createInput } from "@/shared";
import { TrackControlsTemplate } from "./track-controls/track-controls-template";

/**
 * Interface defining the template of score controls:
 * - Master controls
 * - Track controls
 */
export class ScoreControlsTemplate {
  readonly scoreControlsContainer: HTMLDivElement = createDiv();
  readonly showTracksButton: HTMLButtonElement = createButton();
  readonly masterContainer: HTMLDivElement = createDiv();
  readonly newTrackButton: HTMLImageElement = createImage();
  readonly masterVolumeInput: HTMLInputElement = createInput();
  readonly masterPanningInput: HTMLInputElement = createInput();
  readonly tracksContainer: HTMLDivElement = createDiv();
  readonly scoreNameInput: HTMLInputElement = createInput();
  tracksTemplates: TrackControlsTemplate[] = [];
}
