import { NotationView } from "@/notation/notation-view";
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
    notationView: NotationView,
    bendSelectorManager: BendSelectorManager
  ): void;
  onCancelClicked(template: BendControlsTemplate): void;
}
