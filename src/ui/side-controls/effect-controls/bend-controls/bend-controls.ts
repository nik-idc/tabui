import { NotationView } from "@/notation/notation-view";
import { createButton, createDialog, createDiv, createSVG } from "@/shared";
import { BendControlsDefaultEventHandler } from "./bend-controls-def-event-handler";
import { bindBendControlsEvents } from "./bend-controls-event-binder";
import { BendControlsTemplate } from "./bend-controls-template";
import { setupBendControls } from "./bend-controls-template-setup";
import { BendSelectorManager } from "./bend-selectors";

let bendSelectorManager: BendSelectorManager;

export function initBendControls(
  template: BendControlsTemplate,
  notationView: NotationView
): void {
  setupBendControls(notationView.rootDiv, template);

  const defEventHandlers = new BendControlsDefaultEventHandler();

  bendSelectorManager = new BendSelectorManager(template.bendSelectorGraphSVG);
  bendSelectorManager.init();

  bindBendControlsEvents(
    notationView,
    template,
    defEventHandlers,
    bendSelectorManager
  );
}

export function showBendControls(template: BendControlsTemplate): void {
  template.bendControlsDialog.showModal();
}
