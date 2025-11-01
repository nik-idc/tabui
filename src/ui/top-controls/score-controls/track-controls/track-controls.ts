import {
  createDiv,
  createImage,
  createLabel,
  createSelect,
  createButton,
  createInput,
} from "@/shared";
import { NotationView } from "@/notation/notation-view";
import { Tab, Track } from "@/notation";
import { TrackControlsDefaultEventHandler } from "./track-controls-def-event-handler";
import { bindTrackControlsEvents } from "./track-controls-event-binder";
import { TrackControlsTemplate } from "./track-controls-template";
import { setupTrackControls } from "./track-controls-template-setup";

export function initTrackControls(
  notationView: NotationView,
  template: TrackControlsTemplate,
  track: Tab
): void {
  setupTrackControls(notationView.rootDiv, notationView, template, track);

  const defEventHandlers = new TrackControlsDefaultEventHandler();
  bindTrackControlsEvents(notationView, template, defEventHandlers);
}
