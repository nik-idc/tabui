import { NotationView } from "@/notation/notation-view";
import { TrackControlsTemplate } from "./track-controls-template";

export interface TrackControlsEventHandler {
  onTrackVolumeChanged(
    template: TrackControlsTemplate,
    notationView: NotationView
  ): void;
  onTrackPanningChanged(
    template: TrackControlsTemplate,
    notationView: NotationView
  ): void;
  onMuteButtonClicked(
    template: TrackControlsTemplate,
    notationView: NotationView
  ): void;
  onSoloButtonClicked(
    template: TrackControlsTemplate,
    notationView: NotationView
  ): void;
  onTrackSettingsClicked(
    template: TrackControlsTemplate,
    notationView: NotationView
  ): void;
}
