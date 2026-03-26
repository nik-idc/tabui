import { NotationComponent } from "@/notation/notation-component";
import { TrackControlsComponent, TrackControlsTemplate } from "@/ui";
import { ListenerManager } from "@/shared/misc";
import { YesNoCallbacks, YesNoDefaultCallbacks } from "./yes-no-callbacks";
import {
  TrackSettingsControlsCallbacks,
  TrackSettingsControlsDefaultCallbacks,
} from "./track-settings-callbacks";

export interface TrackControlsCallbacks {
  onTrackRemoveClicked(): void;
  onTrackClicked(): void;
  onTrackVolumeChanged(): void;
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
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;

  private _listeners = new ListenerManager();

  private _yesNoCallbacks: YesNoCallbacks;
  private _trackSettingsCallbacks: TrackSettingsControlsCallbacks;

  constructor(
    trackComponent: TrackControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._trackComponent = trackComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;

    this._yesNoCallbacks = new YesNoDefaultCallbacks(
      this._trackComponent.yesNoComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard,
      () => this._notationComponent.removeTrack(this._trackComponent.track)
    );

    this._trackSettingsCallbacks = new TrackSettingsControlsDefaultCallbacks(
      this._trackComponent.trackSettingsComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard
    );
  }

  onTrackRemoveClicked(): void {
    this._captureKeyboard();
    this._trackComponent.showRemoveDialog();
  }

  onTrackClicked(): void {
    this._notationComponent.loadTrack(this._trackComponent.track);
    this._renderFunc();
  }

  onTrackVolumeChanged(): void {
    throw new Error("Method not implemented");
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
    this._captureKeyboard();
    this._trackComponent.showTrackSettings();
  }

  bind(): void {
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
        event: "change",
        handler: () => this.onTrackVolumeChanged(),
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

    this._yesNoCallbacks.bind();
    this._trackSettingsCallbacks.bind();
  }

  unbind(): void {
    this._listeners.unbindAll();
    this._yesNoCallbacks.unbind();
    this._trackSettingsCallbacks.unbind();
  }
}
