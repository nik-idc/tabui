import { NotationComponent } from "@/notation/notation-component";
import { Tab, TabController } from "@/notation";
import { TrackControlsComponent, TrackControlsTemplate } from "@/ui";

export interface TrackControlsCallbacks {
  onTrackVolumeChanged(): void;
  onTrackClicked(): void;
  onTrackPanningChanged(): void;
  onMuteButtonClicked(): void;
  onSoloButtonClicked(): void;
  onTrackSettingsClicked(): void;
  bind(): void;
}

export class TrackControlsDefaultCallbacks implements TrackControlsCallbacks {
  private _trackComponent: TrackControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;

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
    this._trackComponent.template.volumeInput.addEventListener("change", () => {
      this.onTrackVolumeChanged();
    });

    this._trackComponent.template.volumeInput.addEventListener("change", () => {
      this.onTrackVolumeChanged();
    });

    this._trackComponent.template.trackButton.addEventListener("click", () => {
      this.onTrackClicked();
    });

    this._trackComponent.template.muteButton.addEventListener("click", () => {
      this.onMuteButtonClicked();
    });

    this._trackComponent.template.soloButton.addEventListener("click", () => {
      this.onSoloButtonClicked();
    });

    this._trackComponent.template.settingsButton.addEventListener(
      "click",
      () => {
        this.onTrackSettingsClicked();
      }
    );
  }
}
