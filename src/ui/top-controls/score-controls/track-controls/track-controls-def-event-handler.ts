import { NoteDuration, TabController } from "@/notation";
import { NotationView } from "@/notation/notation-view";
import { TrackControlsEventHandler } from "./track-controls-event-handler";
import { TrackControlsTemplate } from "./track-controls-template";

export class TrackControlsDefaultEventHandler
  implements TrackControlsEventHandler
{
  onTrackVolumeChanged(
    template: TrackControlsTemplate,
    notationView: NotationView
  ): void {
    throw new Error("Method not implemented");
  }

  onTrackPanningChanged(
    template: TrackControlsTemplate,
    notationView: NotationView
  ): void {
    throw new Error("Method not implemented");
  }

  onMuteButtonClicked(
    template: TrackControlsTemplate,
    notationView: NotationView
  ): void {
    throw new Error("Method not implemented");
  }

  onSoloButtonClicked(
    template: TrackControlsTemplate,
    notationView: NotationView
  ): void {
    throw new Error("Method not implemented");
  }

  onTrackSettingsClicked(
    template: TrackControlsTemplate,
    notationView: NotationView
  ): void {
    throw new Error("Method not implemented");
  }
}
