import { NotationComponent } from "../../../../notation/notation-component";
import {
  DEFAULT_MASTER_BAR,
  MAX_MASTER_BAR_TEMPO,
  MIN_MASTER_BAR_TEMPO,
} from "../../../../notation/model";
import { TempoControlsComponent } from "./";
import { ListenerManager } from "../../../../shared/misc";

export interface TempoControlsCallbacks {
  readonly beatsCountErrorText: string;
  readonly durationErrorText: string;

  onDialogClicked(event: MouseEvent): void;
  onTempoStep(delta: number): void;
  onConfirmClicked(): void;
  onCancelClicked(): void;
  bind(): void;
  unbind(): void;
}

export class TempoControlsDefaultCallbacks implements TempoControlsCallbacks {
  private _tempoComponent: TempoControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _listeners = new ListenerManager();

  readonly beatsCountErrorText: string = "Invalid beats count";
  readonly durationErrorText: string = "Invalid duration";

  constructor(
    tempoComponent: TempoControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._tempoComponent = tempoComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
  }

  private tempoValid(tempoValue: string): boolean {
    if (tempoValue.trim() === "") {
      return false;
    }
    const tempoNum = Number(tempoValue);
    if (
      !Number.isFinite(tempoNum) ||
      tempoNum < MIN_MASTER_BAR_TEMPO ||
      tempoNum > MAX_MASTER_BAR_TEMPO
    ) {
      return false;
    }

    return true;
  }

  private updateValidation(): void {
    const template = this._tempoComponent.template;
    const isValid = this.tempoValid(template.valueInput.value);
    const tempo = Number(template.valueInput.value);
    template.errorText.textContent = isValid ? " " : this.beatsCountErrorText;
    template.confirmButton.disabled = !isValid;
    template.decreaseTenButton.disabled =
      isValid && tempo <= MIN_MASTER_BAR_TEMPO;
    template.decreaseButton.disabled = isValid && tempo <= MIN_MASTER_BAR_TEMPO;
    template.increaseButton.disabled = isValid && tempo >= MAX_MASTER_BAR_TEMPO;
    template.increaseTenButton.disabled =
      isValid && tempo >= MAX_MASTER_BAR_TEMPO;
  }

  onDialogClicked(event: MouseEvent): void {
    const target = event.target;
    if (
      !(typeof Node !== "undefined" && target instanceof Node) ||
      !this._tempoComponent.template.dialogContent.contains(target)
    ) {
      this._tempoComponent.dialog.close();
    }
  }

  onTempoStep(delta: number): void {
    const template = this._tempoComponent.template;
    const parsedTempo = Number(template.valueInput.value);
    const originalTempo =
      this._notationComponent.trackController.getTempoEditBars()[0]?.tempo ??
      DEFAULT_MASTER_BAR.tempo;
    const currentTempo = this.tempoValid(template.valueInput.value)
      ? parsedTempo
      : originalTempo;
    const tempo = Math.max(
      MIN_MASTER_BAR_TEMPO,
      Math.min(MAX_MASTER_BAR_TEMPO, currentTempo + delta)
    );
    template.valueInput.value = `${tempo}`;
    this.updateValidation();

    this._tempoComponent.announceValue();
  }

  onConfirmClicked(): void {
    const template = this._tempoComponent.template;
    const tempoValue = template.valueInput.value;
    const tempo = Number(tempoValue);
    if (!this.tempoValid(tempoValue)) {
      this.updateValidation();
      return;
    }
    this._notationComponent.trackController.setSelectedBarTempo(tempo);
    this._renderFunc();

    this._tempoComponent.dialog.close();
  }

  onCancelClicked(): void {
    this._tempoComponent.dialog.close();
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.onTempoStep(event.deltaY < 0 ? 1 : -1);
  }

  bind(): void {
    this._listeners.bindAll([
      {
        element: this._tempoComponent.template.dialogContainer,
        event: "click",
        handler: (event: MouseEvent) => this.onDialogClicked(event),
      },
      {
        element: this._tempoComponent.template.decreaseTenButton,
        event: "click",
        handler: () => this.onTempoStep(-10),
      },
      {
        element: this._tempoComponent.template.decreaseButton,
        event: "click",
        handler: () => this.onTempoStep(-1),
      },
      {
        element: this._tempoComponent.template.increaseButton,
        event: "click",
        handler: () => this.onTempoStep(1),
      },
      {
        element: this._tempoComponent.template.increaseTenButton,
        event: "click",
        handler: () => this.onTempoStep(10),
      },
      {
        element: this._tempoComponent.template.valueControl,
        event: "wheel",
        handler: (event: WheelEvent) => this.onWheel(event),
      },
      {
        element: this._tempoComponent.template.valueInput,
        event: "input",
        handler: () => this.updateValidation(),
      },
      {
        element: this._tempoComponent.template.dialogContent,
        event: "submit",
        handler: (event: SubmitEvent) => {
          event.preventDefault();
          const { dialog, template } = this._tempoComponent;
          if (!dialog.open || template.confirmButton.disabled) return;
          this.onConfirmClicked();
        },
      },
      {
        element: this._tempoComponent.template.cancelButton,
        event: "click",
        handler: () => this.onCancelClicked(),
      },
    ]);
  }

  unbind(): void {
    this._listeners.unbindAll();
  }
}
