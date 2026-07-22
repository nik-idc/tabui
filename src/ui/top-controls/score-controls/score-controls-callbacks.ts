import { NotationComponent } from "../../../notation/notation-component";
import { Track } from "../../../notation";
import { ScoreControlsComponent } from "../..";
import { ListenerManager } from "../../../shared/misc";
import {
  TrackControlsCallbacks,
  TrackControlsDefaultCallbacks,
} from "./track-controls/track-controls-callbacks";
import {
  NewTrackControlsCallbacks,
  NewTrackControlsDefaultCallbacks,
} from "./new-track/new-track-controls-callbacks";
import {
  TrackSettingsControlsCallbacks,
  TrackSettingsControlsDefaultCallbacks,
} from "./track-controls/track-settings/track-settings-controls-callbacks";
import {
  YesNoCallbacks,
  YesNoDefaultCallbacks,
} from "../../shared/yes-no/yes-no-callbacks";

export interface ScoreControlsCallbacks {
  onShowTracksButtonClicked(): void;
  onNewTrackButtonClicked(): void;
  onMasterVolumeChanged(): void;
  onMasterPanningChanged(): void;
  onScoreNameChanged(): void;
  onScoreNameFocusGained(): void;
  onScoreNameFocusLost(): void;
  bind(): void;
  unbind(): void;
}

export class ScoreControlsDefaultCallbacks implements ScoreControlsCallbacks {
  private _scoreComponent: ScoreControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;
  private _showTrackSettings: (track: Track) => void;

  private _trackCallbacks: TrackControlsCallbacks[] = [];
  private _newTrackCallbacks: NewTrackControlsCallbacks;
  private _trackSettingsCallbacks: TrackSettingsControlsCallbacks;
  private _trackRemoveCallbacks: YesNoCallbacks;

  private _listeners = new ListenerManager();
  private _bound = false;
  private _minTrackNameLength = 1;
  private _maxTrackNameLength = 32;

  constructor(
    scoreComponent: ScoreControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void,
    showTrackSettings: (track: Track) => void
  ) {
    this._scoreComponent = scoreComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;
    this._showTrackSettings = showTrackSettings;

    this._newTrackCallbacks = new NewTrackControlsDefaultCallbacks(
      this._scoreComponent.newTrackComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard
    );
    this._trackSettingsCallbacks = new TrackSettingsControlsDefaultCallbacks(
      this._scoreComponent.trackSettingsComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard
    );
    this._trackRemoveCallbacks = new YesNoDefaultCallbacks(
      this._scoreComponent.trackRemoveComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard,
      () => this._scoreComponent.removeSelectedTrack()
    );
  }

  onShowTracksButtonClicked(): void {
    this._scoreComponent.changeTracksAreDisplayed();
    this._scoreComponent.render();

    if (this._scoreComponent.tracksAreDisplayed) {
      this.bindTracksCallbacks();
    }
  }

  onNewTrackButtonClicked(): void {
    if (this._notationComponent.trackController.isPlaying) {
      return;
    }
    this._captureKeyboard();
    this._scoreComponent.showNewTrackDialog();
  }

  onMasterVolumeChanged(): void {
    throw new Error("Method not implemented");
  }

  onMasterPanningChanged(): void {
    throw new Error("Method not implemented");
  }

  onScoreNameChanged(): void {
    if (this._notationComponent.trackController.isPlaying) {
      return;
    }
    this._scoreComponent.score.name =
      this._scoreComponent.template.scoreNameInput.value;
  }

  onScoreNameFocusGained(): void {
    this._captureKeyboard();
  }

  onScoreNameFocusLost(): void {
    this._freeKeyboard();
  }

  private bindTracksCallbacks(): void {
    for (const trackCallbacks of this._trackCallbacks) {
      trackCallbacks.unbind();
    }

    this._trackCallbacks = [];
    for (const trackComponent of this._scoreComponent.trackComponents) {
      const callbacks = new TrackControlsDefaultCallbacks(
        trackComponent,
        this._notationComponent,
        this._renderFunc,
        this._captureKeyboard,
        this._freeKeyboard,
        () => this._showTrackSettings(trackComponent.track),
        () => this._scoreComponent.showTrackRemoveDialog(trackComponent.track)
      );
      callbacks.bind();

      this._trackCallbacks.push(callbacks);
    }
  }

  bind(): void {
    if (this._bound) {
      return;
    }

    this._listeners.bindAll([
      {
        element: this._scoreComponent.template.showTracksButton,
        event: "click",
        handler: () => this.onShowTracksButtonClicked(),
      },
      {
        element: this._scoreComponent.template.newTrackButton,
        event: "click",
        handler: () => this.onNewTrackButtonClicked(),
      },
      {
        element: this._scoreComponent.template.masterVolumeInput,
        event: "change",
        handler: () => this.onMasterVolumeChanged(),
      },
      {
        element: this._scoreComponent.template.masterPanningInput,
        event: "change",
        handler: () => this.onMasterPanningChanged(),
      },
      {
        element: this._scoreComponent.template.scoreNameInput,
        event: "input",
        handler: () => this.onScoreNameChanged(),
      },
      {
        element: this._scoreComponent.template.scoreNameInput,
        event: "focus",
        handler: () => this.onScoreNameFocusGained(),
      },
      {
        element: this._scoreComponent.template.scoreNameInput,
        event: "focusout",
        handler: () => this.onScoreNameFocusLost(),
      },
    ]);

    this.bindTracksCallbacks();

    this._newTrackCallbacks.bind();
    this._trackSettingsCallbacks.bind();
    this._trackRemoveCallbacks.bind();
    this._bound = true;
  }

  unbind(): void {
    if (!this._bound) {
      return;
    }

    this._listeners.unbindAll();
    for (const trackCallbacks of this._trackCallbacks) {
      trackCallbacks.unbind();
    }
    this._newTrackCallbacks.unbind();
    this._trackSettingsCallbacks.unbind();
    this._trackRemoveCallbacks.unbind();
    this._trackCallbacks = [];
    this._bound = false;
  }
}
