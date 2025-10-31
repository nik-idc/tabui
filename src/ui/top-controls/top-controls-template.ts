/**
 * Interface defining the template of top controls:
 * - Track selector
 * - Play controls
 */
export interface TopControlsTemplate {
  readonly topControlsContainer: HTMLDivElement;

  readonly trackSelectorContainer: HTMLDivElement;
  readonly trackSelectorLabel: HTMLLabelElement;
  readonly trackSelector: HTMLSelectElement;

  readonly playControlsContainer: HTMLDivElement;
  readonly playButton: HTMLImageElement;
  readonly pauseButton: HTMLImageElement;
  readonly stopButton: HTMLImageElement;
  readonly loopButton: HTMLImageElement;
}
