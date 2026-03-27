import { NotationComponent } from "@/notation/notation-component";
import { ListenerManager } from "@/shared/misc";
import { YesNoComponent } from "@/ui/shared/yes-no";

export interface YesNoCallbacks {
  onDialogClicked(event: MouseEvent): void;
  onConfirmClicked(): void;
  onCancelClicked(): void;
  bind(): void;
  unbind(): void;
}

export class YesNoDefaultCallbacks implements YesNoCallbacks {
  private _yesNoComponent: YesNoComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;
  private _onConfirm: () => void;

  private _listeners = new ListenerManager();

  constructor(
    trackComponent: YesNoComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void,
    onConfirm: () => void
  ) {
    this._yesNoComponent = trackComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;
    this._onConfirm = onConfirm;
  }

  onDialogClicked(event: MouseEvent): void {
    if (
      !this._yesNoComponent.template.yesNoDialogContent.contains(
        event.target as Node
      )
    ) {
      this._yesNoComponent.template.yesNoDialog.close();
      this._freeKeyboard();
    }
  }

  onConfirmClicked(): void {
    this._onConfirm();
    this._renderFunc();

    this._yesNoComponent.template.yesNoDialog.close();
    this._freeKeyboard();
  }

  onCancelClicked(): void {
    this._yesNoComponent.template.yesNoDialog.close();
    this._freeKeyboard();
  }

  bind(): void {
    this._listeners.bindAll([
      {
        element: this._yesNoComponent.template.yesNoDialog,
        event: "click",
        handler: (event: MouseEvent) => this.onDialogClicked(event),
      },
      {
        element: this._yesNoComponent.template.confirmButton,
        event: "click",
        handler: () => this.onConfirmClicked(),
      },
      {
        element: this._yesNoComponent.template.cancelButton,
        event: "click",
        handler: () => this.onCancelClicked(),
      },
    ]);
  }

  unbind(): void {
    this._listeners.unbindAll();
  }
}
