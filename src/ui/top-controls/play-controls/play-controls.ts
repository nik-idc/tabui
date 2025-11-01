import {
  createDiv,
  createImage,
  createLabel,
  createSelect,
  createButton,
} from "@/shared";
import { NotationView } from "@/notation/notation-view";
import { PlayControlsDefaultEventHandler } from "./play-controls-def-event-handler";
import { bindPlayControlsEvents } from "./play-controls-event-binder";
import { PlayControlsTemplate } from "./play-controls-template";
import { setupPlayControls } from "./play-controls-template-setup";

export function initPlayControls(
  notationView: NotationView,
  template: PlayControlsTemplate
): void {
  setupPlayControls(notationView.rootDiv, notationView, template);

  const defEventHandlers = new PlayControlsDefaultEventHandler();
  bindPlayControlsEvents(notationView, template, defEventHandlers);
}
