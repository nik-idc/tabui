/**
 * Interface defining the template of track controls:
 * - Track name
 * - Volume input
 * - Panning input
 */
export interface TrackControlsTemplate {
  readonly trackControlsContainer: HTMLDivElement;

  readonly trackName: HTMLButtonElement;
  readonly removeButton: HTMLImageElement;
  readonly volumeInput: HTMLInputElement;
  readonly panningInput: HTMLInputElement;
  readonly muteButton: HTMLImageElement;
  readonly soloButton: HTMLImageElement;
  readonly settingsButton: HTMLImageElement;
}
