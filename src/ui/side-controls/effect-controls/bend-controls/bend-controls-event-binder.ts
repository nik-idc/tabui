import { NotationView } from "@/notation/notation-view";
import { BendControlsEventHandler } from "./bend-controls-event-handler";
import { BendControlsTemplate } from "./bend-controls-template";
import { BendSelectorManager } from "./bend-selectors";

export function bindBendControlsEvents(
  notationView: NotationView,
  template: BendControlsTemplate,
  eventHandlers: BendControlsEventHandler,
  bendSelectorManager: BendSelectorManager
): void {
  template.bendControlsDialog.addEventListener("click", (event: MouseEvent) => {
    eventHandlers.onDialogClicked(template, event);
  });

  template.bendTypesButtons[0].addEventListener("click", () => {
    eventHandlers.onBendTypeClicked("bend", bendSelectorManager);
  });
  template.bendTypesButtons[1].addEventListener("click", () => {
    eventHandlers.onBendTypeClicked("prebend", bendSelectorManager);
  });
  template.bendTypesButtons[2].addEventListener("click", () => {
    eventHandlers.onBendTypeClicked("bend-release", bendSelectorManager);
  });
  template.bendTypesButtons[3].addEventListener("click", () => {
    eventHandlers.onBendTypeClicked("prebend-release", bendSelectorManager);
  });

  template.confirmButton.addEventListener("click", () => {
    eventHandlers.onConfirmClicked(template, notationView, bendSelectorManager);
  });
  template.cancelButton.addEventListener("click", () => {
    eventHandlers.onCancelClicked(template);
  });
}
