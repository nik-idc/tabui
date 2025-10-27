import { NotationView } from "@/notation/notation-view";
import { EffectControlsTemplate, initEffectControls } from "./effect-controls";
import {
  initMeasureControls,
  MeasureControlsTemplate,
} from "./measure-controls";
import { initNoteControls, NoteControlsTemplate } from "./note-controls";
import { createDiv, createImage } from "@/shared";
import { SideControlsTemplate } from "./side-controls-template";
import { setupSideControls } from "./side-controls-template-setup";

function getNoteControlsTemplate(): NoteControlsTemplate {
  return {
    noteControlsContainer: createDiv(),
    noteDurationButtons: [
      createImage(),
      createImage(),
      createImage(),
      createImage(),
      createImage(),
      createImage(),
    ],
    dot1Button: createImage(),
    dot2Button: createImage(),
    tuplet2Button: createImage(),
    tuplet3Button: createImage(),
    tupletButton: createImage(),
  };
}

function getEffectControlsTemplate(): EffectControlsTemplate {
  return {
    effectControlsContainer: createDiv(),
    vibratoButton: createImage(),
    palmMuteButton: createImage(),
    nhButton: createImage(),
    phButton: createImage(),
    hammerOnButton: createImage(),
    pullOffButton: createImage(),
    slideButton: createImage(),
    bendButton: createImage(),
  };
}

function getMeasureControlsTemplate(): MeasureControlsTemplate {
  return {
    measureControlsContainer: createDiv(),
    tempoButton: createImage(),
    timeSignatureButton: createImage(),
    repeatStartButton: createImage(),
    repeatEndButton: createImage(),
  };
}

function getSideControlsTemplate(): SideControlsTemplate {
  return {
    sideControlsContainer: createDiv(),
    noteControlsTemplate: getNoteControlsTemplate(),
    effectControlsTemplate: getEffectControlsTemplate(),
    measureControlsTemplate: getMeasureControlsTemplate(),
  };
}

export function initSideControls(notationView: NotationView): void {
  const template = getSideControlsTemplate();

  initNoteControls(notationView, template.noteControlsTemplate);
  initEffectControls(notationView, template.effectControlsTemplate);
  initMeasureControls(notationView, template.measureControlsTemplate);

  setupSideControls(notationView.rootDiv, template);
}
