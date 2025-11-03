import { NotationComponent } from "@/notation/notation-component";
import { TrackControlsTemplate } from "./track-controls-template";
import { Tab, TabController } from "@/notation";

export interface TrackControlsEventHandler {
  onTrackVolumeChanged(
    template: TrackControlsTemplate,
    notationComponent: NotationComponent
  ): void;
  onTrackClicked(
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
  private _track: Tab;

  constructor(track: Tab) {
    this._track = track;
  }

  onTrackVolumeChanged(
    template: TrackControlsTemplate,
    notationComponent: NotationComponent
  ): void {
    throw new Error("Method not implemented");
  }

  onTrackClicked(
    template: TrackControlsTemplate,
    notationComponent: NotationComponent
  ): void {
    const tabController = new TabController(
      notationComponent.tabController.score,
      this._track,
      notationComponent.tabController.dim
    );
    notationComponent.loadTrack(tabController);
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
