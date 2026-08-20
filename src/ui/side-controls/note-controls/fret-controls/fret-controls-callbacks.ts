import { NotationComponent } from "../../../../notation/notation-component";
import { ListenerManager } from "../../../../shared/misc";
import { FretControlsComponent } from "./fret-controls-component";

/** Handles user input for the fret editor dialog. */
export class FretControlsDefaultCallbacks {
  private _fretComponent: FretControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;
  private _listeners = new ListenerManager();

  constructor(
    fretComponent: FretControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._fretComponent = fretComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;
  }

  private applyFret(fret: number | null): void {
    if (!this._notationComponent.trackController.hasSelectedNote) {
      return;
    }

    this._notationComponent.trackController.setSelectedNoteFret(fret);
    this._renderFunc();
    this._fretComponent.template.dialog.close();
  }

  public onDialogClicked(event: MouseEvent): void {
    const target = event.target;
    if (
      !(typeof Node !== "undefined" && target instanceof Node) ||
      !this._fretComponent.template.dialogContent.contains(target)
    ) {
      this._fretComponent.template.dialog.close();
    }
  }

  public onNoFretClicked(): void {
    this.applyFret(null);
  }

  public onDeadClicked(): void {
    this.applyFret(-1);
  }

  public onInput(): void {
    this._fretComponent.template.confirmButton.disabled =
      this._fretComponent.template.input.value === "";
  }

  public onConfirmClicked(): void {
    const input = this._fretComponent.template.input;
    if (input.value === "") {
      return;
    }
    this.applyFret(Number(input.value));
  }

  public onCancelClicked(): void {
    this._fretComponent.template.dialog.close();
  }

  public onDialogClosed(): void {
    this._freeKeyboard();
  }

  public bind(): void {
    const template = this._fretComponent.template;
    this._listeners.bindAll([
      {
        element: template.dialog,
        event: "click",
        handler: (event: MouseEvent) => this.onDialogClicked(event),
      },
      {
        element: template.dialog,
        event: "close",
        handler: () => this.onDialogClosed(),
      },
      {
        element: template.noFretButton,
        event: "click",
        handler: () => this.onNoFretClicked(),
      },
      {
        element: template.deadButton,
        event: "click",
        handler: () => this.onDeadClicked(),
      },
      {
        element: template.input,
        event: "input",
        handler: () => this.onInput(),
      },
      {
        element: template.confirmButton,
        event: "click",
        handler: () => this.onConfirmClicked(),
      },
      {
        element: template.cancelButton,
        event: "click",
        handler: () => this.onCancelClicked(),
      },
    ]);
  }

  public unbind(): void {
    this._listeners.unbindAll();
  }

  public onFretButtonClicked(): void {
    if (!this._notationComponent.trackController.hasSelectedNote) {
      return;
    }
    this._captureKeyboard();
    this._fretComponent.showControls();
  }
}
