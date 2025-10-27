import { createDiv, createImage, createLabel, createSelect } from "@/shared";
import { TopControlsTemplate } from "./top-controls-template";
import { setupTopControls } from "./top-controls-template-setup";
import { bindTopControlsEvents } from "./top-controls-event-binder";
import { TopControlsDefaultEventHandler } from "./top-controls-def-event-handler";
import { NotationView } from "@/notation/notation-view";

function getTemplate(): TopControlsTemplate {
  return {
    topControlsContainer: createDiv(),
    trackSelectorContainer: createDiv(),
    trackSelectorLabel: createLabel(),
    trackSelector: createSelect(),
    playControlsContainer: createDiv(),
    playButton: createImage(),
    pauseButton: createImage(),
    stopButton: createImage(),
    loopButton: createImage(),
  };
}

export function initTopControls(notationView: NotationView): void {
  const topControlsTemplate = getTemplate();

  setupTopControls(notationView.rootDiv, topControlsTemplate);

  const defEventHandlers = new TopControlsDefaultEventHandler();
  bindTopControlsEvents(notationView, topControlsTemplate, defEventHandlers);
}
