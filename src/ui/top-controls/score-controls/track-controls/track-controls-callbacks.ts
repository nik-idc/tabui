import { NotationComponent } from "../../../../notation/notation-component";
import { TrackControlsComponent } from "../../..";
import { ListenerManager } from "../../../../shared/misc";

export interface TrackControlsCallbacks {
  onTrackRemoveClicked(): void;
  onTrackSelected(): void;
  onTrackMoveUpClicked(): void;
  onTrackMoveDownClicked(): void;
  onTrackNameChanged(): void;
  onTrackNameFocusGained(): void;
  onTrackNameFocusLost(): void;
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
    const controller = this._notationComponent.trackController;
    if (controller.isPlaying) {
      return;
    }
    this._captureKeyboard();
    this._showTrackRemove();
  }

  onTrackSelected(): void {
    this._notationComponent.loadTrack(this._trackComponent.track);
    this._renderFunc();
  }

  onTrackMoveUpClicked(): void {
    this.moveTrack(-1);
  }

  onTrackMoveDownClicked(): void {
    this.moveTrack(1);
  }

  private moveTrack(offset: number): void {
    const controller = this._notationComponent.trackController;
    if (controller.isPlaying) {
      return;
    }
    const track = this._trackComponent.track;
    const trackIndex = this._notationComponent.score.tracks.indexOf(track);
    const targetIndex = trackIndex + offset;
    if (this._notationComponent.trackController.moveTrack(track, targetIndex)) {
      this._renderFunc();
    }
  }

  onTrackNameChanged(): void {
    const controller = this._notationComponent.trackController;
    if (controller.isPlaying) {
      return;
    }
    this._notationComponent.trackController.setTrackName(
      this._trackComponent.track,
      this._trackComponent.template.trackNameInput.value
    );
  }

  onTrackNameFocusGained(): void {
    this._captureKeyboard();
  }

  onTrackNameFocusLost(): void {
    this._freeKeyboard();
  }

  onTrackVolumeChanged(event: InputEvent): void {
    const input = event.target as HTMLInputElement;
    this._notationComponent.trackController.setTrackVolume(
      this._trackComponent.track,
      Number(input.value) / 100
    );
  }

  onTrackPanningChanged(event: InputEvent): void {
    const input = event.target as HTMLInputElement;
    this._notationComponent.trackController.setTrackPan(
      this._trackComponent.track,
      Number(input.value)
    );
  }

  onMuteButtonClicked(): void {
    if (
      this._notationComponent.trackController.toggleTrackMuted(
        this._trackComponent.track
      )
    ) {
      this._renderFunc();
    }
  }

  onSoloButtonClicked(): void {
    if (
      this._notationComponent.trackController.toggleTrackSoloed(
        this._trackComponent.track
      )
    ) {
      this._renderFunc();
    }
  }

  onTrackSettingsClicked(): void {
    const controller = this._notationComponent.trackController;
    if (controller.isPlaying) {
      return;
    }
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
        element: this._trackComponent.template.selectButton,
        event: "click",
        handler: () => this.onTrackSelected(),
      },
      {
        element: this._trackComponent.template.moveUpButton,
        event: "click",
        handler: () => this.onTrackMoveUpClicked(),
      },
      {
        element: this._trackComponent.template.moveDownButton,
        event: "click",
        handler: () => this.onTrackMoveDownClicked(),
      },
      {
        element: this._trackComponent.template.trackNameInput,
        event: "input",
        handler: () => this.onTrackNameChanged(),
      },
      {
        element: this._trackComponent.template.trackNameInput,
        event: "focus",
        handler: () => this.onTrackNameFocusGained(),
      },
      {
        element: this._trackComponent.template.trackNameInput,
        event: "focusout",
        handler: () => this.onTrackNameFocusLost(),
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
