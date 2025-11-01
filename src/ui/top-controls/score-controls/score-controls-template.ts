import { TrackControlsTemplate } from "./track-controls/track-controls-template";

/**
 * Interface defining the template of score controls:
 * - Master controls
 * - Track controls
 */
export interface ScoreControlsTemplate {
  readonly scoreControlsContainer: HTMLDivElement;

  readonly masterContainer: HTMLDivElement;
  readonly newTrackButton: HTMLImageElement;
  readonly masterVolumeInput: HTMLInputElement;
  readonly masterPanningInput: HTMLInputElement;
  readonly scoreSettingsButton: HTMLImageElement;

  readonly tracksContainer: HTMLDivElement;
  tracksTemplates: TrackControlsTemplate[];
}
