import { NoteDuration, TabController } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";
import {
  TimeSigControlsComponent,
  TimeSigControlsTemplate,
} from "@/ui/side-controls/measure-controls/time-sig-controls";
import { ListenerManager } from "@/shared/misc";

export interface TimeSigControlsCallbacks {
  readonly beatsCountErrorText: string;
  readonly durationErrorText: string;

  onDialogClicked(event: MouseEvent): void;
  onBeatsChanged(event: InputEvent): void;
  onDurationChanged(event: InputEvent): void;
  onConfirmClicked(): void;
  onCancelClicked(): void;
  bind(): void;
  unbind(): void;
}

export class TimeSigControlsDefaultCallbacks
  implements TimeSigControlsCallbacks
{
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
  private _beatsCount: number = 4;
  private _availableDurations = [1, 2, 4, 8, 16, 32];
  private _duration: NoteDuration = NoteDuration.Quarter;

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

  onDialogClicked(event: MouseEvent): void {
    if (
      !this._timeSigComponent.template.timeSigDialogContent.contains(
        event.target as Node
      )
    ) {
      this._timeSigComponent.template.timeSigDialog.close();
      this._freeKeyboard();
    }
  }

  onBeatsChanged(event: InputEvent): void {
    const inputValue = this._timeSigComponent.template.beatsInput.value;
    if (!this.beatsCountValid(inputValue)) {
      this._timeSigComponent.template.beatsErrorText.textContent =
        this.beatsCountErrorText;
      this._timeSigComponent.template.confirmButton.disabled = true;
    } else {
      this._timeSigComponent.template.beatsErrorText.textContent = " ";
      this._timeSigComponent.template.confirmButton.disabled = false;
      this._beatsCount = Number(inputValue);
    }
  }

  onDurationChanged(event: InputEvent): void {
    const inputValue = this._timeSigComponent.template.durationInput.value;
    if (!this.durationValid(inputValue)) {
      this._timeSigComponent.template.durationErrorText.textContent =
        this.durationErrorText;
      this._timeSigComponent.template.confirmButton.disabled = true;
    } else {
      this._timeSigComponent.template.durationErrorText.textContent = " ";
      this._timeSigComponent.template.confirmButton.disabled = false;
      this._duration = 1 / Number(inputValue);
    }
  }

  onConfirmClicked(): void {
    this._notationComponent.tabController.changeSelectedBarBeats(
      this._beatsCount
    );
    this._notationComponent.tabController.changeSelectedBarDuration(
      this._duration
    );
    this._renderFunc();

    this._timeSigComponent.template.timeSigDialog.close();
    this._freeKeyboard();
  }

  onCancelClicked(): void {
    this._timeSigComponent.template.timeSigDialog.close();
    this._freeKeyboard();
  }

  bind(): void {
    this._listeners.bindAll([
      {
        element: this._timeSigComponent.template.timeSigDialogContent,
        event: "click",
        handler: (event: Event) => this.onDialogClicked(event as MouseEvent),
      },
      {
        element: this._timeSigComponent.template.beatsInput,
        event: "input",
        handler: (event: Event) => this.onBeatsChanged(event as InputEvent),
      },
      {
        element: this._timeSigComponent.template.durationInput,
        event: "input",
        handler: (event: Event) => this.onDurationChanged(event as InputEvent),
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
