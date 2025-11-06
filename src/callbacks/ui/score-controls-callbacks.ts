import { NotationComponent } from "@/notation/notation-component";
import { ScoreControlsComponent } from "@/ui";
import {
  TrackControlsCallbacks,
  TrackControlsDefaultCallbacks,
} from "./track-controls-callbacks";

export interface ScoreControlsCallbacks {
  onShowTracksButtonClicked(): void;
  onMasterVolumeChanged(): void;
  onMasterPanningChanged(): void;
  onScoreSettingsClicked(): void;
  bind(): void;
}

export class ScoreControlsDefaultCallbacks implements ScoreControlsCallbacks {
  private _scoreComponent: ScoreControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;

  private _trackCallbacks: TrackControlsCallbacks[] = [];

  constructor(
    scoreComponent: ScoreControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._scoreComponent = scoreComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
  }

  onShowTracksButtonClicked(): void {
    this._scoreComponent.changeTracksAreDisplayed();
    this._scoreComponent.render();

    if (this._scoreComponent.tracksAreDisplayed) {
      this.bindTracksCallbacks();
    }
  }

  onMasterVolumeChanged(): void {
    throw new Error("Method not implemented");
  }

  onMasterPanningChanged(): void {
    throw new Error("Method not implemented");
  }

  onScoreSettingsClicked(): void {
    throw new Error("Method not implemented");
  }

  private bindTracksCallbacks(): void {
    this._trackCallbacks = [];
    for (const trackComponent of this._scoreComponent.trackComponents) {
      const callbacks = new TrackControlsDefaultCallbacks(
        trackComponent,
        this._notationComponent,
        this._renderFunc
      );
      callbacks.bind();

      this._trackCallbacks.push(callbacks);
    }
  }

  bind(): void {
    this._scoreComponent.template.showTracksButton.addEventListener(
      "click",
      () => {
        this.onShowTracksButtonClicked();
      }
    );

    this._scoreComponent.template.masterVolumeInput.addEventListener(
      "change",
      () => {
        this.onMasterVolumeChanged();
      }
    );

    this._scoreComponent.template.masterPanningInput.addEventListener(
      "change",
      () => {
        this.onMasterPanningChanged();
      }
    );

    this._scoreComponent.template.scoreSettingsButton.addEventListener(
      "click",
      () => {
        this.onScoreSettingsClicked();
      }
    );

    this.bindTracksCallbacks();
  }
}
