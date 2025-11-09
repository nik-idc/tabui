import { NotationComponent } from "@/notation/notation-component";
import { Tab, TabController } from "@/notation";
import { TrackControlsComponent, TrackControlsTemplate } from "@/ui";
import { ListenerManager } from "@/shared/misc";

export interface TrackControlsCallbacks {
  onTrackVolumeChanged(): void;
  onTrackClicked(): void;
  onTrackPanningChanged(): void;
  onMuteButtonClicked(): void;
  onSoloButtonClicked(): void;
  onTrackSettingsClicked(): void;
  bind(): void;
  unbind(): void;
}

export class TrackControlsDefaultCallbacks implements TrackControlsCallbacks {
  private _trackComponent: TrackControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _listeners = new ListenerManager();

  constructor(
    trackComponent: TrackControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._trackComponent = trackComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
  }

  onTrackVolumeChanged(): void {
    throw new Error("Method not implemented");
  }

  onTrackClicked(): void {
    this._notationComponent.loadTrack(this._trackComponent.track);
    this._renderFunc();

    // this._notationComponent.loadTrack(notationComponent);
    // throw new Error("Method not implemented");
  }

  onTrackPanningChanged(): void {
    throw new Error("Method not implemented");
  }

  onMuteButtonClicked(): void {
    throw new Error("Method not implemented");
  }

  onSoloButtonClicked(): void {
    throw new Error("Method not implemented");
  }

  onTrackSettingsClicked(): void {
    throw new Error("Method not implemented");
  }

  bind(): void {
    this._listeners.bindAll([
      {
        element: this._trackComponent.template.volumeInput,
        event: "change",
        handler: () => this.onTrackVolumeChanged(),
      },
      {
        element: this._trackComponent.template.trackButton,
        event: "click",
        handler: () => this.onTrackClicked(),
      },
      {
        element: this._trackComponent.template.muteButton,
        event: "click",
        handler: () => this.onMuteButtonClicked(),
      },
      {
        element: this._trackComponent.template.soloButton,
        event: "click",
        handler: () => this.onSoloButtonClicked(),
      },
      {
        element: this._trackComponent.template.settingsButton,
        event: "click",
        handler: () => this.onTrackSettingsClicked(),
      },
    ]);
  }

  unbind(): void {
    this._listeners.unbindAll();
  }
}
