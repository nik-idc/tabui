import { NoteDuration } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";
import { TimeSigControlsTemplate } from "./time-sig-controls-template";

export interface TimeSigControlsEventHandler {
  readonly beatsCountErrorText: string;
  readonly durationErrorText: string;

  onDialogClicked(template: TimeSigControlsTemplate, event: MouseEvent): void;
  onBeatsChanged(
    event: InputEvent,
    notationComponent: NotationComponent,
    template: TimeSigControlsTemplate
  ): void;
  onDurationChanged(
    event: InputEvent,
    notationComponent: NotationComponent,
    template: TimeSigControlsTemplate
  ): void;
  onConfirmClicked(
    notationComponent: NotationComponent,
    template: TimeSigControlsTemplate
  ): void;
  onCancelClicked(
    notationComponent: NotationComponent,
    template: TimeSigControlsTemplate
  ): void;
}

export class TimeSigControlsDefaultEventHandler
  implements TimeSigControlsEventHandler
{
  readonly beatsCountErrorText: string = "Invalid beats count";
  readonly durationErrorText: string = "Invalid duration";

  private _minBeatsCount = 1;
  private _maxBeatsCount = 32;
  private _beatsCount: number = 4;
  private _availableDurations = [1, 2, 4, 8, 16, 32];
  private _duration: NoteDuration = NoteDuration.Quarter;

  private beatsCountValid(beatsCountValue: string): boolean {
    const beatsCountNum = Number(beatsCountValue);
    if (
      Number.isNaN(beatsCountNum) ||
      beatsCountNum < this._minBeatsCount ||
      beatsCountNum > this._maxBeatsCount
    ) {
      return false;
    }

    return true;
  }

  private durationValid(durationValue: string): boolean {
    const durationNum = Number(durationValue);
    if (
      Number.isNaN(durationNum) ||
      !this._availableDurations.includes(durationNum)
    ) {
      return false;
    }

    return true;
  }

  onDialogClicked(template: TimeSigControlsTemplate, event: MouseEvent): void {
    if (!template.timeSigDialogContent.contains(event.target as Node)) {
      template.timeSigDialog.close();
    }
  }

  onBeatsChanged(
    event: InputEvent,
    notationComponent: NotationComponent,
    template: TimeSigControlsTemplate
  ): void {
    if (!this.beatsCountValid(template.beatsInput.value)) {
      template.beatsErrorText.textContent = this.beatsCountErrorText;
      template.confirmButton.disabled = true;
    } else {
      template.beatsErrorText.textContent = " ";
      template.confirmButton.disabled = false;
      this._beatsCount = Number(template.beatsInput.value);
    }
  }

  onDurationChanged(
    event: InputEvent,
    notationComponent: NotationComponent,
    template: TimeSigControlsTemplate
  ): void {
    if (!this.durationValid(template.durationInput.value)) {
      template.durationErrorText.textContent = this.durationErrorText;
      template.confirmButton.disabled = true;
    } else {
      template.durationErrorText.textContent = " ";
      template.confirmButton.disabled = false;
      this._duration = 1 / Number(template.durationInput.value);
    }
  }

  onConfirmClicked(
    notationComponent: NotationComponent,
    template: TimeSigControlsTemplate
  ): void {
    notationComponent.tabController.changeSelectedBarBeats(this._beatsCount);
    notationComponent.tabController.changeSelectedBarDuration(this._duration);
    notationComponent.renderAndBind();

    template.timeSigDialog.close();
  }

  onCancelClicked(
    notationComponent: NotationComponent,
    template: TimeSigControlsTemplate
  ): void {
    template.timeSigDialog.close();
  }
}
