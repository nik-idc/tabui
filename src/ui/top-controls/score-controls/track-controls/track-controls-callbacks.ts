import { NotationComponent } from "@/notation/notation-component";
import { TrackControlsComponent } from "@/ui";
import { ListenerManager } from "@/shared/misc";

export interface TrackControlsCallbacks {
  onTrackRemoveClicked(): void;
  onTrackClicked(): void;
  onTrackVolumeChanged(event: InputEvent): void;
  onTrackPanningChanged(event: InputEvent): void;
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
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;
  private _showTrackSettings: () => void;
  private _showTrackRemove: () => void;

  private _listeners = new ListenerManager();
  private _bound = false;

  constructor(
    trackComponent: TrackControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void,
    showTrackSettings: () => void,
    showTrackRemove: () => void
  ) {
    this._trackComponent = trackComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;
    this._showTrackSettings = showTrackSettings;
    this._showTrackRemove = showTrackRemove;
  }

  onTrackRemoveClicked(): void {
    this._captureKeyboard();
    this._showTrackRemove();
  }

  onTrackClicked(): void {
    this._notationComponent.loadTrack(this._trackComponent.track);
    this._renderFunc();
  }

  onTrackVolumeChanged(event: InputEvent): void {
    const input = event.target as HTMLInputElement;
    this._trackComponent.track.volume = Number(input.value) / 100;
    this._notationComponent.trackController.syncTrackPlaybackState();
  }

  onTrackPanningChanged(event: InputEvent): void {
    const input = event.target as HTMLInputElement;
    this._trackComponent.track.pan = Number(input.value);
    this._notationComponent.trackController.syncTrackPlaybackState();
  }

  onMuteButtonClicked(): void {
    const track = this._trackComponent.track;
    track.muted = !track.muted;
    this._notationComponent.trackController.syncTrackPlaybackState();
    this._renderFunc();
  }

  onSoloButtonClicked(): void {
    const track = this._trackComponent.track;
    track.soloed = !track.soloed;
    this._notationComponent.trackController.syncTrackPlaybackState();
    this._renderFunc();
  }

  onTrackSettingsClicked(): void {
    this._captureKeyboard();
    this._showTrackSettings();
  }

  bind(): void {
    if (this._bound) {
      return;
    }

    this._listeners.bindAll([
      {
        element: this._trackComponent.template.removeButton,
        event: "click",
        handler: () => this.onTrackRemoveClicked(),
      },
      {
        element: this._trackComponent.template.trackButton,
        event: "click",
        handler: () => this.onTrackClicked(),
      },
      {
        element: this._trackComponent.template.volumeInput,
        event: "input",
        handler: (event: InputEvent) => {
          this.onTrackVolumeChanged(event);
        },
      },
      {
        element: this._trackComponent.template.panningInput,
        event: "input",
        handler: (event: InputEvent) => {
          this.onTrackPanningChanged(event);
        },
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

    this._bound = true;
  }

  unbind(): void {
    if (!this._bound) {
      return;
    }

    this._listeners.unbindAll();
    this._bound = false;
  }
}
