import { NotationComponent } from "../../../../notation/notation-component";
import {
  DEFAULT_MASTER_BAR,
  MAX_MASTER_BAR_TEMPO,
  MIN_MASTER_BAR_TEMPO,
} from "../../../../notation/model";
import { MeasureControlsComponent } from "../../..";
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
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;
  private _listeners = new ListenerManager();

  readonly beatsCountErrorText: string = "Invalid beats count";
  readonly durationErrorText: string = "Invalid duration";

  constructor(
    tempoComponent: TempoControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._tempoComponent = tempoComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;
  }

  private tempoValid(tempoValue: string): boolean {
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

  onDialogClicked(event: MouseEvent): void {
    if (
      !this._tempoComponent.template.dialogContent.contains(
        event.target as Node
      )
    ) {
      this._tempoComponent.template.dialog.close();
    }
  }

  onTempoStep(delta: number): void {
    const template = this._tempoComponent.template;
    const parsedTempo = Number(template.value.textContent);
    const currentTempo = Number.isFinite(parsedTempo)
      ? parsedTempo
      : DEFAULT_MASTER_BAR.tempo;
    const tempo = Math.max(
      MIN_MASTER_BAR_TEMPO,
      Math.min(MAX_MASTER_BAR_TEMPO, currentTempo + delta)
    );
    template.value.textContent = `${tempo}`;
    template.decreaseTenButton.disabled = tempo <= MIN_MASTER_BAR_TEMPO;
    template.decreaseButton.disabled = tempo <= MIN_MASTER_BAR_TEMPO;
    template.increaseButton.disabled = tempo >= MAX_MASTER_BAR_TEMPO;
    template.increaseTenButton.disabled = tempo >= MAX_MASTER_BAR_TEMPO;
    template.errorText.textContent = " ";
    template.confirmButton.disabled = false;
  }

  onConfirmClicked(): void {
    const template = this._tempoComponent.template;
    const tempoValue = template.value.textContent;
    const tempo = Number(tempoValue);
    if (!this.tempoValid(tempoValue)) {
      template.errorText.textContent = this.beatsCountErrorText;
      template.confirmButton.disabled = true;
      return;
    }
    this._notationComponent.trackController.setSelectedBarTempo(tempo);
    this._renderFunc();

    this._tempoComponent.template.dialog.close();
  }

  onCancelClicked(): void {
    this._tempoComponent.template.dialog.close();
  }

  onKeydown(event: KeyboardEvent): void {
    const template = this._tempoComponent.template;
    const canConfirm =
      event.target === template.dialog ||
      event.target === template.confirmButton;
    if (
      event.key === "Enter" &&
      canConfirm &&
      !template.confirmButton.disabled
    ) {
      event.preventDefault();
      this.onConfirmClicked();
    }
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.onTempoStep(event.deltaY < 0 ? 1 : -1);
  }

  bind(): void {
    this._listeners.bindAll([
      {
        element: this._tempoComponent.template.dialog,
        event: "click",
        handler: (event: Event) => this.onDialogClicked(event as MouseEvent),
      },
      {
        element: this._tempoComponent.template.dialog,
        event: "close",
        handler: () => this._freeKeyboard(),
      },
      {
        element: this._tempoComponent.template.dialog,
        event: "keydown",
        handler: (event: KeyboardEvent) => this.onKeydown(event),
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
        element: this._tempoComponent.template.confirmButton,
        event: "click",
        handler: () => this.onConfirmClicked(),
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
