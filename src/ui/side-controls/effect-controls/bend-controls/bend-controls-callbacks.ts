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
    if (
      !this._bendComponent.template.dialogContent.contains(event.target as Node)
    ) {
      this._bendComponent.template.dialog.close();
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

    this._bendComponent.template.dialog.close();
  }

  onCancelClicked(): void {
    this._bendComponent.template.dialog.close();
  }

  onRemoveClicked(): void {
    if (this._bendComponent.template.removeButton.disabled) {
      return;
    }
    this._notationComponent.trackController.setTechnique(
      GuitarTechniqueType.Bend
    );
    this._renderFunc();
    this._bendComponent.template.dialog.close();
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

  private onDialogKeyDown(event: KeyboardEvent): void {
    if (
      event.key !== "Enter" ||
      this._bendComponent.template.confirmButton.disabled
    ) {
      return;
    }
    if (
      event.target === this._bendComponent.template.cancelButton ||
      event.target === this._bendComponent.template.removeButton ||
      BEND_TYPE_BUTTON_ORDER.some(
        (bendType) =>
          event.target ===
          this._bendComponent.template.bendTypesButtons[bendType]
      )
    ) {
      return;
    }
    event.preventDefault();
    this.onConfirmClicked();
  }

  public bind(): void {
    this._listeners.bindAll([
      ...BEND_TYPE_BUTTON_ORDER.map((bendType) => ({
        element: this._bendComponent.template.bendTypesButtons[bendType],
        event: "click" as const,
        handler: () => this.onBendTypeClicked(bendType),
      })),
      {
        element: this._bendComponent.template.dialog,
        event: "click",
        handler: (event: MouseEvent) => {
          this.onDialogClicked(event);
        },
      },
      {
        element: this._bendComponent.template.dialog,
        event: "focusin",
        handler: () => this.onDialogFocus(),
      },
      {
        element: this._bendComponent.template.dialog,
        event: "close",
        handler: () => this.onDialogClosed(),
      },
      {
        element: this._bendComponent.template.dialog,
        event: "keydown",
        handler: (event: KeyboardEvent) => this.onDialogKeyDown(event),
      },
      {
        element: this._bendComponent.template.confirmButton,
        event: "click",
        handler: () => {
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
