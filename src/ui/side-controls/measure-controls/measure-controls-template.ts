import { createButton, createDiv } from "../../../shared";
import { TimeSigControlsTemplate } from "./time-sig-controls";
import { TempoControlsTemplate } from "./tempo-controls";

/**
 * Interface defining the template of measure controls:
 * - Tempo change
 * - Time signature change
 * - Repeat start/end
 */
export class MeasureControlsTemplate {
  readonly container: HTMLDivElement = createDiv();
  readonly tempoButton: HTMLButtonElement = createButton();
  readonly timeSignatureButton: HTMLButtonElement = createButton();
  readonly repeatStartButton: HTMLButtonElement = createButton();
  readonly repeatEndButton: HTMLButtonElement = createButton();
  readonly insertBarBeforeButton: HTMLButtonElement = createButton();
  readonly insertBarAfterButton: HTMLButtonElement = createButton();
  readonly removeBarButton: HTMLButtonElement = createButton();
}
