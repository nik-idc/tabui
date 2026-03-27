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

export class TopControlsCallbacks {
  private _topComponent: TopControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;

  private _scoreCallbacks: ScoreControlsCallbacks;
  private _playCallbacks: PlayControlsCallbacks;

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
  }

  public bind(): void {
    this._scoreCallbacks.bind();
    this._playCallbacks.bind();
  }

  public unbind(): void {
    this._scoreCallbacks.unbind();
  }
}
