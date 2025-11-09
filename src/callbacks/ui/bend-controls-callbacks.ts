import { TabController } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";
import {
  BendControlsComponent,
  BendControlsTemplate,
  BendSelectorManager,
} from "@/ui";
import { ListenerManager } from "@/shared/misc";

export interface BendControlsCallbacks {
  onDialogClicked(event: MouseEvent): void;
  onBendTypeClicked(
    bendType: "bend" | "prebend" | "bend-release" | "prebend-release"
  ): void;
  onConfirmClicked(): void;
  onCancelClicked(): void;
  bind(): void;
  unbind(): void;
}

export class BendControlsDefaultCallbacks implements BendControlsCallbacks {
  private _bendComponent: BendControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;

  private _listeners = new ListenerManager();

  constructor(
    bendComponent: BendControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._bendComponent = bendComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;
  }

  onDialogClicked(event: MouseEvent): void {
    if (
      !this._bendComponent.template.bendControlsDialogContent.contains(
        event.target as Node
      )
    ) {
      this._bendComponent.template.bendControlsDialog.close();
      this._freeKeyboard();
    }
  }

  onBendTypeClicked(
    bendType: "bend" | "prebend" | "bend-release" | "prebend-release"
  ): void {
    this._bendComponent.bendSelectorManager.changeBendType(bendType);
  }

  onConfirmClicked(): void {
    const effect = this._bendComponent.bendSelectorManager.getCurrentEffect();

    this._notationComponent.tabController.setEffect(
      effect.effectType,
      effect.options
    );
    this._renderFunc();

    this._bendComponent.template.bendControlsDialog.close();
    this._freeKeyboard();
  }

  onCancelClicked(): void {
    this._bendComponent.template.bendControlsDialog.close();
    this._freeKeyboard();
  }

  public bind(): void {
    this._listeners.bindAll([
      {
        element: this._bendComponent.template.bendControlsDialog,
        event: "click",
        handler: (event: MouseEvent) => {
          this.onDialogClicked(event);
        },
      },
      {
        element: this._bendComponent.template.bendTypesButtons[0],
        event: "click",
        handler: () => {
          this.onBendTypeClicked("bend");
        },
      },
      {
        element: this._bendComponent.template.bendTypesButtons[1],
        event: "click",
        handler: () => {
          this.onBendTypeClicked("prebend");
        },
      },
      {
        element: this._bendComponent.template.bendTypesButtons[2],
        event: "click",
        handler: () => {
          this.onBendTypeClicked("bend-release");
        },
      },
      {
        element: this._bendComponent.template.bendTypesButtons[3],
        event: "click",
        handler: () => {
          this.onBendTypeClicked("prebend-release");
        },
      },
      {
        element: this._bendComponent.template.confirmButton,
        event: "click",
        handler: () => {
          this.onConfirmClicked();
        },
      },
      {
        element: this._bendComponent.template.cancelButton,
        event: "click",
        handler: () => {
          this.onCancelClicked();
        },
      },
    ]);
  }

  public unbind(): void {
    this._listeners.unbindAll();
  }
}
