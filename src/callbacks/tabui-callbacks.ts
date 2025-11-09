import { NotationComponent } from "@/notation/notation-component";
import {
  EditorKeyboardCallbacks,
  EditorKeyboardDefCallbacks,
  EditorMouseCallbacks,
  EditorMouseDefCallbacks,
} from "./editor";
import { UIComponent } from "@/ui";
import { UICallbacks } from "./ui";

export class TabUICallbacks {
  private _uiComponent: UIComponent;
  private _notationComponent: NotationComponent;

  private _mouseCallbacks: EditorMouseCallbacks;
  private _keyboardCallbacks: EditorKeyboardCallbacks;
  private _uiCallbacks: UICallbacks;

  constructor(uiComponent: UIComponent, notationComponent: NotationComponent) {
    this._uiComponent = uiComponent;
    this._notationComponent = notationComponent;

    this._mouseCallbacks = new EditorMouseDefCallbacks(
      this._uiComponent,
      this._notationComponent
    );
    this._keyboardCallbacks = new EditorKeyboardDefCallbacks(
      this._uiComponent,
      this._notationComponent,
      this.renderAndBind.bind(this)
    );
    this._uiCallbacks = new UICallbacks(
      this._uiComponent,
      this._notationComponent,
      this.renderAndBind.bind(this)
    );
  }

  private renderAndBind(): void {
    this._mouseCallbacks.renderAndBind();

    this._uiCallbacks.unbind();
    this._uiComponent.render();
    this._uiCallbacks.bind();
  }

  public bind(): void {
    this._mouseCallbacks.renderAndBind();
    this._keyboardCallbacks.bind();
    this._uiCallbacks.bind();
  }

  public unbind(): void {
    this._uiCallbacks.unbind();
  }
}
