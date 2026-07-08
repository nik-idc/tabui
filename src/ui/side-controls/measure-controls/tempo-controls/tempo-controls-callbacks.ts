import { NotationComponent } from "@/notation/notation-component";
import { MeasureControlsComponent } from "@/ui";
import { TempoControlsComponent } from "@/ui/side-controls/measure-controls/tempo-controls";
import { ListenerManager } from "@/shared/misc";

export interface TempoControlsCallbacks {
  readonly beatsCountErrorText: string;
  readonly durationErrorText: string;

  onDialogClicked(event: MouseEvent): void;
  onTempoChanged(event: InputEvent): void;
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

  private _minTempo = 1;
  private _maxTempo = 999;
  private _tempo = 120;

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
      Number.isNaN(tempoNum) ||
      tempoNum < this._minTempo ||
      tempoNum > this._maxTempo
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
      this._freeKeyboard();
    }
  }

  onTempoChanged(event: InputEvent): void {
    if (!this.tempoValid(this._tempoComponent.template.input.value)) {
      this._tempoComponent.template.errorText.textContent =
        this.beatsCountErrorText;
      this._tempoComponent.template.confirmButton.disabled = true;
    } else {
      this._tempoComponent.template.errorText.textContent = " ";
      this._tempoComponent.template.confirmButton.disabled = false;
      this._tempo = Number(this._tempoComponent.template.input.value);
    }
  }

  onConfirmClicked(): void {
    this._notationComponent.trackController.setSelectedBarTempo(this._tempo);
    this._renderFunc();

    this._tempoComponent.template.dialog.close();
    this._freeKeyboard();
  }

  onCancelClicked(): void {
    this._tempoComponent.template.dialog.close();
    this._freeKeyboard();
  }

  bind(): void {
    this._listeners.bindAll([
      {
        element: this._tempoComponent.template.dialog,
        event: "click",
        handler: (event: Event) => this.onDialogClicked(event as MouseEvent),
      },
      {
        element: this._tempoComponent.template.input,
        event: "input",
        handler: (event: Event) => this.onTempoChanged(event as InputEvent),
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
