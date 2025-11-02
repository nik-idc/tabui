import { NotationComponent } from "@/notation/notation-component";
import { TrackControlsTemplate } from "./track-controls-template";

export interface TrackControlsEventHandler {
  onTrackVolumeChanged(
    template: TrackControlsTemplate,
    notationComponent: NotationComponent
  ): void;
  onTrackPanningChanged(
    template: TrackControlsTemplate,
    notationComponent: NotationComponent
  ): void;
  onMuteButtonClicked(
    template: TrackControlsTemplate,
    notationComponent: NotationComponent
  ): void;
  onSoloButtonClicked(
    template: TrackControlsTemplate,
    notationComponent: NotationComponent
  ): void;
  onTrackSettingsClicked(
    template: TrackControlsTemplate,
    notationComponent: NotationComponent
  ): void;
}

export class TrackControlsDefaultEventHandler
  implements TrackControlsEventHandler
{
  onTrackVolumeChanged(
    template: TrackControlsTemplate,
    notationComponent: NotationComponent
  ): void {
    throw new Error("Method not implemented");
  }

  onTrackPanningChanged(
    template: TrackControlsTemplate,
    notationComponent: NotationComponent
  ): void {
    throw new Error("Method not implemented");
  }

  onMuteButtonClicked(
    template: TrackControlsTemplate,
    notationComponent: NotationComponent
  ): void {
    throw new Error("Method not implemented");
  }

  onSoloButtonClicked(
    template: TrackControlsTemplate,
    notationComponent: NotationComponent
  ): void {
    throw new Error("Method not implemented");
  }

  onTrackSettingsClicked(
    template: TrackControlsTemplate,
    notationComponent: NotationComponent
  ): void {
    throw new Error("Method not implemented");
  }
}
