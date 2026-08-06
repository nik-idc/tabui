import { NotationComponent } from "../../../../notation/notation-component";
import {
  MAX_TUPLET_NORMAL_COUNT,
  MAX_TUPLET_TUPLET_COUNT,
} from "../../../../notation/model";
import { TupletControlsComponent } from "./";
import { ListenerManager } from "../../../../shared/misc";

/**
 * Lowest normal-count offered by the tuplet stepper. The storage layer accepts
 * `MIN_TUPLET_NORMAL_COUNT` (1); the UI intentionally starts at 2 to avoid
 * degenerate 1-tuplets.
 */
export const MIN_NORMAL_COUNT = 2;
/** Highest normal-count offered by the tuplet stepper (matches the Model). */
export const MAX_NORMAL_COUNT = MAX_TUPLET_NORMAL_COUNT;
/**
 * Lowest tuplet-count offered by the tuplet stepper. Storage accepts 1; UI
 * intentionally starts at 2.
 */
export const MIN_TUPLET_COUNT = 2;
/** Highest tuplet-count offered by the tuplet stepper (matches the Model). */
export const MAX_TUPLET_COUNT = MAX_TUPLET_TUPLET_COUNT;
/** Default normal-count shown when no beat is selected. */
export const DEFAULT_NORMAL_COUNT = 3;
/** Default tuplet-count shown when no beat is selected. */
export const DEFAULT_TUPLET_COUNT = 2;

export interface TupletControlsCallbacks {
  readonly normalCountErrorText: string;
  readonly tupletCountErrorText: string;

  onDialogClicked(event: MouseEvent): void;
  onNormalCountStep(delta: number): void;
  onTupletCountStep(delta: number): void;
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
      !Number.isInteger(normalCountNum) ||
      normalCountNum < MIN_NORMAL_COUNT ||
      normalCountNum > MAX_NORMAL_COUNT
    ) {
      return false;
    }

    return true;
  }

  private tupletCountValid(tupletCountValue: string): boolean {
    const tupletCountNum = Number(tupletCountValue);
    if (
      !Number.isInteger(tupletCountNum) ||
      tupletCountNum < MIN_TUPLET_COUNT ||
      tupletCountNum > MAX_TUPLET_COUNT
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
    }
  }

  onNormalCountStep(delta: number): void {
    const template = this._tupletComponent.template;
    const parsedValue = Number(template.normalValue.textContent);
    const currentValue = Number.isInteger(parsedValue)
      ? parsedValue
      : MIN_NORMAL_COUNT;
    const value = Math.max(
      MIN_NORMAL_COUNT,
      Math.min(MAX_NORMAL_COUNT, currentValue + delta)
    );
    template.normalValue.textContent = `${value}`;
    template.normalDownButton.disabled = value <= MIN_NORMAL_COUNT;
    template.normalUpButton.disabled = value >= MAX_NORMAL_COUNT;
    template.normalErrorText.textContent = " ";
    template.confirmButton.disabled = false;
  }

  onTupletCountStep(delta: number): void {
    const template = this._tupletComponent.template;
    const parsedValue = Number(template.tupletValue.textContent);
    const currentValue = Number.isInteger(parsedValue)
      ? parsedValue
      : MIN_TUPLET_COUNT;
    const value = Math.max(
      MIN_TUPLET_COUNT,
      Math.min(MAX_TUPLET_COUNT, currentValue + delta)
    );
    template.tupletValue.textContent = `${value}`;
    template.tupletDownButton.disabled = value <= MIN_TUPLET_COUNT;
    template.tupletUpButton.disabled = value >= MAX_TUPLET_COUNT;
    template.tupletErrorText.textContent = " ";
    template.confirmButton.disabled = false;
  }

  onConfirmClicked(): void {
    const template = this._tupletComponent.template;
    const normalValue = template.normalValue.textContent;
    const tupletValue = template.tupletValue.textContent;
    if (
      !this.normalCountValid(normalValue) ||
      !this.tupletCountValid(tupletValue)
    ) {
      template.normalErrorText.textContent = this.normalCountErrorText;
      template.tupletErrorText.textContent = this.tupletCountErrorText;
      template.confirmButton.disabled = true;
      return;
    }
    this._notationComponent.trackController.setSelectedBeatsTuplet(
      Number(normalValue),
      Number(tupletValue)
    );
    this._renderFunc();

    this._tupletComponent.template.dialog.close();
  }

  onCancelClicked(): void {
    this._tupletComponent.template.dialog.close();
  }

  onKeydown(event: KeyboardEvent): void {
    const template = this._tupletComponent.template;
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

  onNormalWheel(event: WheelEvent): void {
    event.preventDefault();
    this.onNormalCountStep(event.deltaY < 0 ? 1 : -1);
  }

  onTupletWheel(event: WheelEvent): void {
    event.preventDefault();
    this.onTupletCountStep(event.deltaY < 0 ? 1 : -1);
  }

  bind(): void {
    this._listeners.bindAll([
      {
        element: this._tupletComponent.template.dialog,
        event: "click",
        handler: (event: Event) => this.onDialogClicked(event as MouseEvent),
      },
      {
        element: this._tupletComponent.template.dialog,
        event: "close",
        handler: () => this._freeKeyboard(),
      },
      {
        element: this._tupletComponent.template.dialog,
        event: "keydown",
        handler: (event: KeyboardEvent) => this.onKeydown(event),
      },
      {
        element: this._tupletComponent.template.normalDownButton,
        event: "click",
        handler: () => this.onNormalCountStep(-1),
      },
      {
        element: this._tupletComponent.template.normalUpButton,
        event: "click",
        handler: () => this.onNormalCountStep(1),
      },
      {
        element: this._tupletComponent.template.normalControl,
        event: "wheel",
        handler: (event: WheelEvent) => this.onNormalWheel(event),
      },
      {
        element: this._tupletComponent.template.tupletDownButton,
        event: "click",
        handler: () => this.onTupletCountStep(-1),
      },
      {
        element: this._tupletComponent.template.tupletUpButton,
        event: "click",
        handler: () => this.onTupletCountStep(1),
      },
      {
        element: this._tupletComponent.template.tupletControl,
        event: "wheel",
        handler: (event: WheelEvent) => this.onTupletWheel(event),
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
