import { NotationComponent } from "@/notation/notation-component";
import { BendControlsTemplate } from "./bend-controls-template";
import { BendSelectorManager } from "./bend-selectors";

export interface BendControlsEventHandler {
  onDialogClicked(template: BendControlsTemplate, event: MouseEvent): void;
  onBendTypeClicked(
    bendType: "bend" | "prebend" | "bend-release" | "prebend-release",
    bendSelectorManager: BendSelectorManager
  ): void;
  onConfirmClicked(
    template: BendControlsTemplate,
    notationComponent: NotationComponent,
    bendSelectorManager: BendSelectorManager
  ): void;
  onCancelClicked(template: BendControlsTemplate): void;
}

export class BendControlsDefaultEventHandler
  implements BendControlsEventHandler
{
  onDialogClicked(template: BendControlsTemplate, event: MouseEvent): void {
    if (!template.bendControlsDialogContent.contains(event.target as Node)) {
      template.bendControlsDialog.close();
    }
  }

  onBendTypeClicked(
    bendType: "bend" | "prebend" | "bend-release" | "prebend-release",
    bendSelectorManager: BendSelectorManager
  ): void {
    bendSelectorManager.changeBendType(bendType);
  }

  onConfirmClicked(
    template: BendControlsTemplate,
    notationComponent: NotationComponent,
    bendSelectorManager: BendSelectorManager
  ): void {
    const effect = bendSelectorManager.getCurrentEffect();

    notationComponent.tabController.setEffect(effect.effectType, effect.options);
    notationComponent.renderAndBind();

    template.bendControlsDialog.close();
  }

  onCancelClicked(template: BendControlsTemplate): void {
    template.bendControlsDialog.close();
  }
}
