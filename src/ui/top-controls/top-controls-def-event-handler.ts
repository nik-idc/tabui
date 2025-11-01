import { NoteDuration, TabController } from "@/notation";
import { NotationView } from "@/notation/notation-view";
import { TopControlsEventHandler } from "./top-controls-event-handler";
import { TopControlsTemplate } from "./top-controls-template";
import { initTrackControls } from "./score-controls/track-controls";
import { TrackControlsTemplate } from "./score-controls/track-controls/track-controls-template";
import {
  createButton,
  createDiv,
  createImage,
  createInput,
  createParagraph,
} from "@/shared";

function getTrackControlTemplate(): TrackControlsTemplate {
  return {
    trackControlsContainer: createDiv(),
    removeButton: createImage(),
    trackName: createButton(),
    volumeInput: createInput(),
    panningInput: createInput(),
    muteButton: createImage(),
    soloButton: createImage(),
    settingsButton: createImage(),
  };
}

export class TopControlsDefaultEventHandler implements TopControlsEventHandler {
  private _tracksDisplayed: boolean = true;

  onShowButtonClicked(
    template: TopControlsTemplate,
    notationView: NotationView
  ): void {
    this._tracksDisplayed = !this._tracksDisplayed;

    if (this._tracksDisplayed) {
      template.scoreControlsTemplate.tracksContainer.replaceChildren();
      template.scoreControlsTemplate.tracksTemplates = [];

      return;
    }

    for (const track of notationView.tabController.score.tracks) {
      const trackTemplate = getTrackControlTemplate();
      template.scoreControlsTemplate.tracksTemplates.push(trackTemplate);

      initTrackControls(notationView, trackTemplate, track);
      template.scoreControlsTemplate.tracksContainer.appendChild(
        trackTemplate.trackControlsContainer
      );
    }
  }
}
