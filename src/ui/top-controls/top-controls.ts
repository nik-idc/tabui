import {
  createDiv,
  createImage,
  createLabel,
  createSelect,
  createButton,
  createInput,
} from "@/shared";
import { TopControlsTemplate } from "./top-controls-template";
import { setupTopControls } from "./top-controls-template-setup";
import { NotationView } from "@/notation/notation-view";
import { initPlayControls, PlayControlsTemplate } from "./play-controls";
import { initScoreControls, ScoreControlsTemplate } from "./score-controls";
import { TopControlsDefaultEventHandler } from "./top-controls-def-event-handler";
import { bindTopControlsEvents } from "./top-controls-event-binder";

function getScoreControlsTemplate(): ScoreControlsTemplate {
  return {
    scoreControlsContainer: createDiv(),
    masterContainer: createDiv(),
    newTrackButton: createImage(),
    masterVolumeInput: createInput(),
    masterPanningInput: createInput(),
    scoreSettingsButton: createImage(),
    tracksContainer: createDiv(),
    tracksTemplates: [],
  };
}

function getPlayControlsTemplate(): PlayControlsTemplate {
  return {
    playControlsContainer: createDiv(),

    firstButton: createImage(),
    prevButton: createImage(),
    playButton: createImage(),
    nextButton: createImage(),
    lastButton: createImage(),
    loopButton: createImage(),
  };
}

function getTopControlsTemplate(): TopControlsTemplate {
  return {
    topControlsContainer: createDiv(),

    showTracksButton: createButton(),

    scoreControlsTemplate: getScoreControlsTemplate(),
    playControlsTemplate: getPlayControlsTemplate(),
  };
}

export function initTopControls(notationView: NotationView): void {
  const topControlsTemplate = getTopControlsTemplate();

  initScoreControls(notationView, topControlsTemplate.scoreControlsTemplate);
  initPlayControls(notationView, topControlsTemplate.playControlsTemplate);

  setupTopControls(notationView.rootDiv, notationView, topControlsTemplate);
  const defEventHandlers = new TopControlsDefaultEventHandler();
  bindTopControlsEvents(notationView, topControlsTemplate, defEventHandlers);
}
