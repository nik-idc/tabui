import { UIComponent } from "@/ui";
import { SideControlsCallbacks } from "./side-callbacks";
import { TopControlsCallbacks } from "./top-callbacks";
import { TabController } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";

export class UICallbacks {
  private _uiComponent: UIComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;

  private _topCallbacks: TopControlsCallbacks;
  private _sideCallbacks: SideControlsCallbacks;

  constructor(
    uiComponent: UIComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._uiComponent = uiComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;

    this._topCallbacks = new TopControlsCallbacks(
      this._uiComponent.topComponent,
      this._notationComponent,
      this._renderFunc.bind(this)
    );
    this._sideCallbacks = new SideControlsCallbacks(
      this._uiComponent.sideComponent,
      this._notationComponent,
      this._renderFunc.bind(this)
    );
  }

  public bind(): void {
    this._topCallbacks.bind();
    this._sideCallbacks.bind();
  }

  public unbind(): void {
    this._topCallbacks.unbind();
    this._sideCallbacks.unbind();
  }
}
