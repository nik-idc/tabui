import {
  BendTechniqueOptions,
  BendType,
  GuitarTechniqueType,
} from "../../../../notation/model";
import { NotationComponent } from "../../../../notation/notation-component";
import { BendControlsComponent } from "../../..";
import { ListenerManager } from "../../../../shared/misc";
import { BEND_TYPE_BUTTON_ORDER } from "./bend-controls-template";

export interface BendControlsCallbacks {
  onDialogClicked(event: MouseEvent): void;
  onBendTypeClicked(bendType: BendType): void;
  onConfirmClicked(): void;
  onCancelClicked(): void;
  onRemoveClicked(): void;
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
  private _keyboardCaptured = false;

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
    const target = event.target;
    if (
      !(typeof Node !== "undefined" && target instanceof Node) ||
      !this._bendComponent.template.dialogContent.contains(target)
    ) {
      this._bendComponent.dialog.close();
    }
  }

  onBendTypeClicked(bendType: BendType): void {
    if (this._bendComponent.template.bendTypesButtons[bendType].disabled) {
      return;
    }
    this._bendComponent.bendSelectorManager.changeBendType(bendType);
    this._bendComponent.templateRenderer.setSelectedBendType(bendType);
  }

  onConfirmClicked(): void {
    const bendOptions =
      this._bendComponent.bendSelectorManager.getCurrentTechnique();

    let validatedOptions: BendTechniqueOptions;
    try {
      validatedOptions = new BendTechniqueOptions(bendOptions);
    } catch {
      return;
    }
    this._notationComponent.trackController.setTechnique(
      GuitarTechniqueType.Bend,
      validatedOptions
    );
    this._renderFunc();

    this._bendComponent.dialog.close();
  }

  onCancelClicked(): void {
    this._bendComponent.dialog.close();
  }

  onRemoveClicked(): void {
    if (this._bendComponent.template.removeButton.disabled) {
      return;
    }
    this._notationComponent.trackController.setTechnique(
      GuitarTechniqueType.Bend
    );
    this._renderFunc();
    this._bendComponent.dialog.close();
  }

  private onDialogFocus(): void {
    if (this._keyboardCaptured) {
      return;
    }
    this._captureKeyboard();
    this._keyboardCaptured = true;
  }

  private onDialogClosed(): void {
    this._bendComponent.bendSelectorManager.dispose();
    if (this._keyboardCaptured) {
      this._freeKeyboard();
      this._keyboardCaptured = false;
    }
  }

  public bind(): void {
    this._listeners.bindAll([
      ...BEND_TYPE_BUTTON_ORDER.map((bendType) => ({
        element: this._bendComponent.template.bendTypesButtons[bendType],
        event: "click" as const,
        handler: () => this.onBendTypeClicked(bendType),
      })),
      {
        element: this._bendComponent.template.dialogContainer,
        event: "click",
        handler: (event: MouseEvent) => {
          this.onDialogClicked(event);
        },
      },
      {
        element: this._bendComponent.template.dialogContainer,
        event: "focusin",
        handler: () => this.onDialogFocus(),
      },
      {
        element: this._bendComponent.template.dialogContainer,
        event: "close",
        handler: () => this.onDialogClosed(),
      },
      {
        element: this._bendComponent.template.dialogContent,
        event: "submit",
        handler: (event: SubmitEvent) => {
          event.preventDefault();
          const { dialog, template } = this._bendComponent;
          if (!dialog.open || template.confirmButton.disabled) return;
          this.onConfirmClicked();
        },
      },
      {
        element: this._bendComponent.template.removeButton,
        event: "click",
        handler: () => {
          this.onRemoveClicked();
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
    this.onDialogClosed();
  }
}
