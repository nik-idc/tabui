import { NotationView } from "@/notation/notation-view";
import { TrackControlsEventHandler } from "./track-controls-event-handler";
import { TrackControlsTemplate } from "./track-controls-template";

export function bindTrackControlsEvents(
  notationView: NotationView,
  template: TrackControlsTemplate,
  eventHandlers: TrackControlsEventHandler
): void {
  template.volumeInput.addEventListener("change", () => {
    eventHandlers.onTrackVolumeChanged(template, notationView);
  });

  template.panningInput.addEventListener("change", () => {
    eventHandlers.onTrackPanningChanged(template, notationView);
  });

  template.muteButton.addEventListener("click", () => {
    eventHandlers.onMuteButtonClicked(template, notationView);
  });

  template.soloButton.addEventListener("click", () => {
    eventHandlers.onSoloButtonClicked(template, notationView);
  });

  template.settingsButton.addEventListener("click", () => {
    eventHandlers.onTrackSettingsClicked(template, notationView);
  });
}
