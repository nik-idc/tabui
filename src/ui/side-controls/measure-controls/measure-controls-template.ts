/**
 * Interface defining the template of measure controls:
 * - Tempo change
 * - Time signature change
 * - Repeat start/end
 */
export interface MeasureControlsTemplate {
  readonly measureControlsContainer: HTMLDivElement;

  readonly tempoButton: HTMLImageElement;
  readonly timeSignatureButton: HTMLImageElement;
  readonly repeatStartButton: HTMLImageElement;
  readonly repeatEndButton: HTMLImageElement;
}
