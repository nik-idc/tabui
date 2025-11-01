/**
 * Interface defining the template of play controls:
 * - First bar button
 * - Prev bar button
 * - Play/pause button
 * - Next bar button
 * - Last bar button
 */
export interface PlayControlsTemplate {
  readonly playControlsContainer: HTMLDivElement;

  readonly firstButton: HTMLImageElement;
  readonly prevButton: HTMLImageElement;
  readonly playButton: HTMLImageElement;
  readonly nextButton: HTMLImageElement;
  readonly lastButton: HTMLImageElement;
  readonly loopButton: HTMLImageElement
}
