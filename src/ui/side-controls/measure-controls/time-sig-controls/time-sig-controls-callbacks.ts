import { NoteDuration } from "../../../../notation/model";
import { NotationComponent } from "../../../../notation/notation-component";
import { TimeSigControlsComponent } from "./";
import { ListenerManager } from "../../../../shared/misc";

export interface TimeSigControlsCallbacks {
  readonly beatsCountErrorText: string;
  readonly durationErrorText: string;

  onDialogClicked(event: MouseEvent): void;
  onBeatsStep(delta: number): void;
  onDurationChanged(): void;
  onConfirmClicked(): void;
  onCancelClicked(): void;
  bind(): void;
  unbind(): void;
}

export class TimeSigControlsDefaultCallbacks implements TimeSigControlsCallbacks {
  private _timeSigComponent: TimeSigControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;
  private _listeners = new ListenerManager();

  readonly beatsCountErrorText: string = "Invalid beats count";
  readonly durationErrorText: string = "Invalid duration";

  private _minBeatsCount = 1;
  private _maxBeatsCount = 32;
  private _availableDurations = [1, 2, 4, 8, 16, 32];

  constructor(
    timeSigComponent: TimeSigControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._timeSigComponent = timeSigComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;
  }

  private beatsCountValid(beatsCountValue: string): boolean {
    const beatsCountNum = Number(beatsCountValue);
    if (
      !Number.isInteger(beatsCountNum) ||
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

  onDialogClicked(event: MouseEvent): void {
    if (
      !this._timeSigComponent.template.dialogContent.contains(
        event.target as Node
      )
    ) {
      this._timeSigComponent.template.dialog.close();
    }
  }

  onBeatsStep(delta: number): void {
    const template = this._timeSigComponent.template;
    const parsedValue = Number(template.beatsValue.textContent);
    const currentValue = Number.isInteger(parsedValue)
      ? parsedValue
      : this._minBeatsCount;
    const value = Math.max(
      this._minBeatsCount,
      Math.min(this._maxBeatsCount, currentValue + delta)
    );
    template.beatsValue.textContent = `${value}`;
    template.beatsDownButton.disabled = value <= this._minBeatsCount;
    template.beatsUpButton.disabled = value >= this._maxBeatsCount;
    template.beatsErrorText.textContent = " ";
    template.confirmButton.disabled = false;
  }

  onDurationChanged(): void {
    const template = this._timeSigComponent.template;
    const inputValue = template.durationSelect.value;
    const durationValid = this.durationValid(inputValue);
    if (!durationValid) {
      template.durationErrorText.textContent = this.durationErrorText;
    } else {
      template.durationErrorText.textContent = " ";
    }
    template.confirmButton.disabled = !durationValid;
  }

  onConfirmClicked(): void {
    const template = this._timeSigComponent.template;
    const beatsValue = template.beatsValue.textContent;
    const durationValue = template.durationSelect.value;
    if (
      !this.beatsCountValid(beatsValue) ||
      !this.durationValid(durationValue)
    ) {
      template.beatsErrorText.textContent = this.beatsCountErrorText;
      template.durationErrorText.textContent = this.durationErrorText;
      template.confirmButton.disabled = true;
      return;
    }
    this._notationComponent.trackController.setSelectedBarTimeSignature(
      Number(beatsValue),
      1 / Number(durationValue)
    );
    this._renderFunc();

    this._timeSigComponent.template.dialog.close();
  }

  onCancelClicked(): void {
    this._timeSigComponent.template.dialog.close();
  }

  onKeydown(event: KeyboardEvent): void {
    const template = this._timeSigComponent.template;
    const canConfirm =
      event.target === template.dialog ||
      event.target === template.durationSelect ||
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
    this.onBeatsStep(event.deltaY < 0 ? 1 : -1);
  }

  bind(): void {
    this._listeners.bindAll([
      {
        element: this._timeSigComponent.template.dialog,
        event: "click",
        handler: (event: Event) => this.onDialogClicked(event as MouseEvent),
      },
      {
        element: this._timeSigComponent.template.dialog,
        event: "close",
        handler: () => this._freeKeyboard(),
      },
      {
        element: this._timeSigComponent.template.dialog,
        event: "keydown",
        handler: (event: KeyboardEvent) => this.onKeydown(event),
      },
      {
        element: this._timeSigComponent.template.beatsDownButton,
        event: "click",
        handler: () => this.onBeatsStep(-1),
      },
      {
        element: this._timeSigComponent.template.beatsUpButton,
        event: "click",
        handler: () => this.onBeatsStep(1),
      },
      {
        element: this._timeSigComponent.template.beatsControl,
        event: "wheel",
        handler: (event: WheelEvent) => this.onWheel(event),
      },
      {
        element: this._timeSigComponent.template.durationSelect,
        event: "change",
        handler: () => this.onDurationChanged(),
      },
      {
        element: this._timeSigComponent.template.confirmButton,
        event: "click",
        handler: () => this.onConfirmClicked(),
      },
      {
        element: this._timeSigComponent.template.cancelButton,
        event: "click",
        handler: () => this.onCancelClicked(),
      },
    ]);
  }

  unbind(): void {
    this._listeners.unbindAll();
  }
}
