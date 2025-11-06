import { TabController } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";
import {
  BendControlsComponent,
  BendControlsTemplate,
  BendSelectorManager,
} from "@/ui";

export interface BendControlsCallbacks {
  onDialogClicked(event: MouseEvent): void;
  onBendTypeClicked(
    bendType: "bend" | "prebend" | "bend-release" | "prebend-release"
  ): void;
  onConfirmClicked(): void;
  onCancelClicked(): void;
  bind(): void;
}

export class BendControlsDefaultCallbacks implements BendControlsCallbacks {
  private _bendComponent: BendControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;

  constructor(
    bendComponent: BendControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._bendComponent = bendComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
  }

  onDialogClicked(event: MouseEvent): void {
    if (
      !this._bendComponent.template.bendControlsDialogContent.contains(
        event.target as Node
      )
    ) {
      this._bendComponent.template.bendControlsDialog.close();
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
    // Problem:
    // Need to render AND bind
    // Rendering can be called from the notation component
    // But the binding happens at the top level
    // Possible solution: move UI event handlers to the top as well

    this._bendComponent.template.bendControlsDialog.close();
  }

  onCancelClicked(): void {
    this._bendComponent.template.bendControlsDialog.close();
  }

  public bind(): void {
    this._bendComponent.template.bendControlsDialog.addEventListener(
      "click",
      (event: MouseEvent) => {
        this.onDialogClicked(event);
      }
    );

    this._bendComponent.template.bendTypesButtons[0].addEventListener(
      "click",
      () => {
        this.onBendTypeClicked("bend");
      }
    );
    this._bendComponent.template.bendTypesButtons[1].addEventListener(
      "click",
      () => {
        this.onBendTypeClicked("prebend");
      }
    );
    this._bendComponent.template.bendTypesButtons[2].addEventListener(
      "click",
      () => {
        this.onBendTypeClicked("bend-release");
      }
    );
    this._bendComponent.template.bendTypesButtons[3].addEventListener(
      "click",
      () => {
        this.onBendTypeClicked("prebend-release");
      }
    );

    this._bendComponent.template.confirmButton.addEventListener("click", () => {
      this.onConfirmClicked();
    });
    this._bendComponent.template.cancelButton.addEventListener("click", () => {
      this.onCancelClicked();
    });
  }
}
