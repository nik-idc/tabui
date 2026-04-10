import { TopControlsComponent } from "@/ui";
import { NotationComponent } from "@/notation/notation-component";
import {
  PlayControlsCallbacks,
  PlayControlsDefaultCallbacks,
} from "./play-controls-callbacks";
import {
  ScoreControlsCallbacks,
  ScoreControlsDefaultCallbacks,
} from "./score-controls-callbacks";
import { trackEvent, TrackEventType } from "@/shared/events";

export class TopControlsCallbacks {
  private _topComponent: TopControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;

  private _scoreCallbacks: ScoreControlsCallbacks;
  private _playCallbacks: PlayControlsCallbacks;
  /** Bound playback state listener used to rerender controls */
  private _onPlayerStateChanged: () => void;
  private _bound = false;

  constructor(
    topComponent: TopControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._topComponent = topComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;

    this._scoreCallbacks = new ScoreControlsDefaultCallbacks(
      this._topComponent.scoreComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard
    );
    this._playCallbacks = new PlayControlsDefaultCallbacks(
      this._topComponent.playComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard
    );
    this._onPlayerStateChanged = () => this._renderFunc();
  }

  public bind(): void {
    if (this._bound) {
      return;
    }

    this._scoreCallbacks.bind();
    this._playCallbacks.bind();
    trackEvent.on(
      TrackEventType.PlayerStateChanged,
      this._onPlayerStateChanged
    );
    this._bound = true;
  }

  public unbind(): void {
    if (!this._bound) {
      return;
    }

    this._scoreCallbacks.unbind();
    this._playCallbacks.unbind();
    trackEvent.off(
      TrackEventType.PlayerStateChanged,
      this._onPlayerStateChanged
    );
    this._bound = false;
  }
}
