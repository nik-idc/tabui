import { NoteDuration, TabController } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";
import {
  TimeSigControlsComponent,
  TimeSigControlsTemplate,
} from "@/ui/side-controls/measure-controls/time-sig-controls";
import { TupletControlsComponent } from "@/ui/side-controls/note-controls/tuplet-controls";
import { ListenerConfig, ListenerManager } from "@/shared/misc";

export interface TupletControlsCallbacks {
  readonly normalCountErrorText: string;
  readonly tupletCountErrorText: string;

  onDialogClicked(event: MouseEvent): void;
  onNormalCountChanged(event: InputEvent): void;
  onTupletCountChanged(event: InputEvent): void;
  onConfirmClicked(): void;
  onCancelClicked(): void;
  bind(): void;
  unbind(): void;
}

export class TupletControlsDefaultCallbacks implements TupletControlsCallbacks {
  private _tupletComponent: TupletControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;

  private _listeners = new ListenerManager();

  readonly normalCountErrorText: string = "Invalid normal count";
  readonly tupletCountErrorText: string = "Invalid tuplet count";

  private _minNormalCount = 2;
  private _maxNormalCount = 256;
  private _normalCount: number = 3;
  private _minTupletCount = 2;
  private _maxTupletCount = 256;
  private _tupletCount: number = 2;

  constructor(
    tupletComponent: TupletControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._tupletComponent = tupletComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;
  }

  private normalCountValid(normalCountValue: string): boolean {
    const normalCountNum = Number(normalCountValue);
    if (
      Number.isNaN(normalCountNum) ||
      normalCountNum < this._minNormalCount ||
      normalCountNum > this._maxNormalCount
    ) {
      return false;
    }

    return true;
  }

  private tupletCountValid(tupletCountValue: string): boolean {
    const tupletCountNum = Number(tupletCountValue);
    if (
      Number.isNaN(tupletCountNum) ||
      tupletCountNum < this._minTupletCount ||
      tupletCountNum > this._maxTupletCount
    ) {
      return false;
    }

    return true;
  }

  onDialogClicked(event: MouseEvent): void {
    if (
      !this._tupletComponent.template.dialogContent.contains(
        event.target as Node
      )
    ) {
      this._tupletComponent.template.dialog.close();
      this._freeKeyboard();
    }
  }

  onNormalCountChanged(event: InputEvent): void {
    const inputValue = this._tupletComponent.template.normalInput.value;
    if (!this.normalCountValid(inputValue)) {
      this._tupletComponent.template.normalErrorText.textContent =
        this.normalCountErrorText;
      this._tupletComponent.template.confirmButton.disabled = true;
    } else {
      this._tupletComponent.template.normalErrorText.textContent = " ";
      this._tupletComponent.template.confirmButton.disabled = false;
      this._normalCount = Number(inputValue);
    }
  }

  onTupletCountChanged(event: InputEvent): void {
    const inputValue = this._tupletComponent.template.input.value;
    if (!this.tupletCountValid(inputValue)) {
      this._tupletComponent.template.tupletErrorText.textContent =
        this.tupletCountErrorText;
      this._tupletComponent.template.confirmButton.disabled = true;
    } else {
      this._tupletComponent.template.tupletErrorText.textContent = " ";
      this._tupletComponent.template.confirmButton.disabled = false;
      this._tupletCount = Number(inputValue);
    }
  }

  onConfirmClicked(): void {
    this._notationComponent.tabController.setSelectedBeatsTuplet(
      this._normalCount,
      this._tupletCount
    );
    this._renderFunc();

    this._tupletComponent.template.dialog.close();
    this._freeKeyboard();
  }

  onCancelClicked(): void {
    this._tupletComponent.template.dialog.close();
    this._freeKeyboard();
  }

  bind(): void {
    this._listeners.bindAll([
      {
        element: this._tupletComponent.template.dialog,
        event: "click",
        handler: (event: Event) => this.onDialogClicked(event as MouseEvent),
      },
      {
        element: this._tupletComponent.template.normalInput,
        event: "input",
        handler: (event: Event) =>
          this.onNormalCountChanged(event as InputEvent),
      },
      {
        element: this._tupletComponent.template.input,
        event: "input",
        handler: (event: Event) =>
          this.onTupletCountChanged(event as InputEvent),
      },
      {
        element: this._tupletComponent.template.confirmButton,
        event: "click",
        handler: () => this.onConfirmClicked(),
      },
      {
        element: this._tupletComponent.template.cancelButton,
        event: "click",
        handler: () => this.onCancelClicked(),
      },
    ]);
  }

  unbind(): void {
    this._listeners.unbindAll();
  }
}
