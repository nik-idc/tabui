import { createDiv, createImage } from "@/shared";
import { MeasureControlsTemplate } from "./measure-controls-template";
import { setupMeasureControls } from "./measure-controls-template-setup";
import { MeasureControlsDefaultEventHandler } from "./measure-controls-def-event-handler";
import { bindMeasureControlsEvents } from "./measure-controls-event-binder";
import { NotationView } from "@/notation/notation-view";

export function initMeasureControls(
  notationView: NotationView,
  template: MeasureControlsTemplate
): void {
  setupMeasureControls(notationView.rootDiv, template);

  const defEventHandlers = new MeasureControlsDefaultEventHandler();
  bindMeasureControlsEvents(notationView, template, defEventHandlers);
}
