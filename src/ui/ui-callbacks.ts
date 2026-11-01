import { UIComponent } from "./";
import { SideControlsCallbacks } from "./side-controls/side-controls-callbacks";
import { TopControlsCallbacks } from "./top-controls/top-controls-callbacks";
import { NotationComponent } from "../notation/notation-component";

export class UICallbacks {
  private _uiComponent: UIComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _renderActiveVoiceFunc: () => void;

  private _topCallbacks: TopControlsCallbacks;
  private _sideCallbacks: SideControlsCallbacks;
  private _bound = false;

  constructor(
    uiComponent: UIComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    renderActiveVoiceFunc: () => void
  ) {
    this._uiComponent = uiComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._renderActiveVoiceFunc = renderActiveVoiceFunc;
    this._topCallbacks = new TopControlsCallbacks(
      this._uiComponent.topComponent,
      this._notationComponent,
      this._renderFunc
    );
    this._sideCallbacks = new SideControlsCallbacks(
      this._uiComponent.sideComponent,
      this._notationComponent,
      this._renderFunc,
      this._renderActiveVoiceFunc
    );
  }

  public bind(): void {
    if (this._bound) {
      return;
    }

    this._topCallbacks.bind();
    this._sideCallbacks.bind();
    this._bound = true;
  }

  public unbind(): void {
    if (!this._bound) {
      return;
    }

    this._topCallbacks.unbind();
    this._sideCallbacks.unbind();
    this._bound = false;
  }
}
