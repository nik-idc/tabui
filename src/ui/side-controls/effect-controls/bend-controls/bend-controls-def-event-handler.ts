import { NotationView } from "@/notation/notation-view";
import { BendControlsEventHandler } from "./bend-controls-event-handler";
import { BendControlsTemplate } from "./bend-controls-template";
import { BendSelectorManager } from "./bend-selectors";

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
    notationView: NotationView,
    bendSelectorManager: BendSelectorManager
  ): void {
    const effect = bendSelectorManager.getCurrentEffect();

    notationView.tabController.setEffect(effect.effectType, effect.options);
    notationView.renderAndBind();

    template.bendControlsDialog.close();
  }

  onCancelClicked(template: BendControlsTemplate): void {
    template.bendControlsDialog.close();
  }
}
