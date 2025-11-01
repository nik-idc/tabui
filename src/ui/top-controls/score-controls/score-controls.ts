import {
  createDiv,
  createImage,
  createLabel,
  createSelect,
  createButton,
  createInput,
} from "@/shared";
import { NotationView } from "@/notation/notation-view";
import {
  bindScoreControlsEvents,
  ScoreControlsDefaultEventHandler,
  ScoreControlsTemplate,
  setupScoreControls,
} from ".";

export function initScoreControls(
  notationView: NotationView,
  template: ScoreControlsTemplate
): void {
  setupScoreControls(notationView.rootDiv, notationView, template);

  const defEventHandlers = new ScoreControlsDefaultEventHandler();
  bindScoreControlsEvents(notationView, template, defEventHandlers);
}
