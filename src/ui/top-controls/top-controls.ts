import { createDiv, createImage, createLabel, createSelect, createButton } from "@/shared";
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
    newTrackButton: createButton(),
    playControlsContainer: createDiv(),
    playButton: createImage(),
    pauseButton: createImage(),
    stopButton: createImage(),
    loopButton: createImage(),
  };
}

export function initTopControls(notationView: NotationView): void {
  const topControlsTemplate = getTemplate();

  setupTopControls(notationView.rootDiv, notationView, topControlsTemplate);

  const defEventHandlers = new TopControlsDefaultEventHandler(topControlsTemplate);
  bindTopControlsEvents(notationView, topControlsTemplate, defEventHandlers);
}
