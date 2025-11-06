import { createDiv, createImage } from "@/shared";
import { TimeSigControlsTemplate } from "../effect-controls/time-sig-controls";
import { TempoControlsTemplate } from "../effect-controls/tempo-controls";

/**
 * Interface defining the template of measure controls:
 * - Tempo change
 * - Time signature change
 * - Repeat start/end
 */
export class MeasureControlsTemplate {
  readonly measureControlsContainer: HTMLDivElement = createDiv();

  readonly tempoButton: HTMLImageElement = createImage();
  readonly timeSignatureButton: HTMLImageElement = createImage();
  readonly repeatStartButton: HTMLImageElement = createImage();
  readonly repeatEndButton: HTMLImageElement = createImage();
}
