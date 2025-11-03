import { NoteDuration } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";
import { TempoControlsTemplate } from "./tempo-controls-template";

export interface TempoControlsEventHandler {
  readonly beatsCountErrorText: string;
  readonly durationErrorText: string;

  onDialogClicked(template: TempoControlsTemplate, event: MouseEvent): void;
  onTempoChanged(
    event: InputEvent,
    notationComponent: NotationComponent,
    template: TempoControlsTemplate
  ): void;
  onConfirmClicked(
    notationComponent: NotationComponent,
    template: TempoControlsTemplate
  ): void;
  onCancelClicked(
    notationComponent: NotationComponent,
    template: TempoControlsTemplate
  ): void;
}

export class TempoControlsDefaultEventHandler
  implements TempoControlsEventHandler
{
  readonly beatsCountErrorText: string = "Invalid beats count";
  readonly durationErrorText: string = "Invalid duration";

  private _minTempo = 1;
  private _maxTempo = 999;
  private _tempo = 120;

  private tempoValid(tempoValue: string): boolean {
    const tempoNum = Number(tempoValue);
    if (
      Number.isNaN(tempoNum) ||
      tempoNum < this._minTempo ||
      tempoNum > this._maxTempo
    ) {
      return false;
    }

    return true;
  }

  onDialogClicked(template: TempoControlsTemplate, event: MouseEvent): void {
    if (!template.tempoDialogContent.contains(event.target as Node)) {
      template.tempoDialog.close();
    }
  }

  onTempoChanged(
    event: InputEvent,
    notationComponent: NotationComponent,
    template: TempoControlsTemplate
  ): void {
    if (!this.tempoValid(template.tempoInput.value)) {
      template.tempoErrorText.textContent = this.beatsCountErrorText;
      template.confirmButton.disabled = true;
    } else {
      template.tempoErrorText.textContent = " ";
      template.confirmButton.disabled = false;
      this._tempo = Number(template.tempoInput.value);
    }
  }

  onConfirmClicked(
    notationComponent: NotationComponent,
    template: TempoControlsTemplate
  ): void {
    notationComponent.tabController.changeSelectedBarTempo(this._tempo);
    notationComponent.renderAndBind();

    template.tempoDialog.close();
  }

  onCancelClicked(
    notationComponent: NotationComponent,
    template: TempoControlsTemplate
  ): void {
    template.tempoDialog.close();
  }
}
