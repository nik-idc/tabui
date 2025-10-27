import { createDiv, createImage } from "@/shared";
import { EffectControlsTemplate } from "./effect-controls-template";
import { setupEffectControls } from "./effect-controls-template-setup";
import { EffectControlsDefaultEventHandler } from "./effect-controls-def-event-handler";
import { bindEffectControlsEvents } from "./effect-controls-event-binder";
import { NotationView } from "@/notation/notation-view";

export function initEffectControls(
  notationView: NotationView,
  template: EffectControlsTemplate
): void {
  setupEffectControls(notationView.rootDiv, template);

  const defEventHandlers = new EffectControlsDefaultEventHandler();
  bindEffectControlsEvents(notationView, template, defEventHandlers);
}
