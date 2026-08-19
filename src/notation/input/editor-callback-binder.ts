import { SVGTabNoteRenderer } from "..";
import { ElementRenderer } from "../render/element-renderer";
import { EditorKeyboardCallbacks } from "./editor-keyboard-callbacks";
import { EditorMouseCallbacks } from "./editor-mouse-callbacks";
import { SVGTabBeatRenderer } from "../render/svg/svg-tab-beat-renderer";

export class EditorCallbackBinder {
  private _globalPointerEventsBound = false;
  private _keyboardBound = false;
  private _boundOnWindowPointerUp?: (event: MouseEvent) => void;
  private _boundOnKeyDown?: (event: KeyboardEvent) => void;

  private bindGlobalPointerEvents(mouseCallbacks: EditorMouseCallbacks): void {
    if (this._globalPointerEventsBound) {
      return;
    }

    this._boundOnWindowPointerUp =
      mouseCallbacks.onWindowPointerUp.bind(mouseCallbacks);
    window.addEventListener("mouseup", this._boundOnWindowPointerUp);
    this._globalPointerEventsBound = true;
  }

  public bindMouseEvents(
    mouseCallbacks: EditorMouseCallbacks,
    renderers: ElementRenderer[]
  ): void {
    for (const renderer of renderers) {
      if (renderer instanceof SVGTabBeatRenderer) {
        renderer.attachMouseEvent(
          "mousedown",
          mouseCallbacks.onBeatPointerDown.bind(mouseCallbacks)
        );
        renderer.attachMouseEvent(
          "mousemove",
          mouseCallbacks.onBeatPointerMove.bind(mouseCallbacks)
        );
        renderer.attachMouseEvent(
          "mouseup",
          mouseCallbacks.onBeatPointerUp.bind(mouseCallbacks)
        );
      } else if (renderer instanceof SVGTabNoteRenderer) {
        renderer.attachMouseEvent(
          "click",
          mouseCallbacks.onNoteClick.bind(mouseCallbacks)
        );
        renderer.attachMouseEvent(
          "pointerenter",
          mouseCallbacks.onNotePointerEnter.bind(mouseCallbacks)
        );
        renderer.attachMouseEvent(
          "pointerleave",
          mouseCallbacks.onNotePointerLeave.bind(mouseCallbacks)
        );
      }
    }
  }

  public bindKeyboardEvents(keyboardCallbacks: EditorKeyboardCallbacks): void {
    if (this._keyboardBound) {
      return;
    }

    this._boundOnKeyDown = keyboardCallbacks.onKeyDown.bind(keyboardCallbacks);
    document.addEventListener("keydown", this._boundOnKeyDown);
    this._keyboardBound = true;
  }

  public bind(
    mouseCallbacks: EditorMouseCallbacks,
    keyboardCallbacks: EditorKeyboardCallbacks,
    renderers: ElementRenderer[]
  ): void {
    if (!this._globalPointerEventsBound) {
      this.bindGlobalPointerEvents(mouseCallbacks);
    }

    this.bindMouseEvents(mouseCallbacks, renderers);
    this.bindKeyboardEvents(keyboardCallbacks);
  }

  public dispose(): void {
    if (
      this._globalPointerEventsBound &&
      this._boundOnWindowPointerUp !== undefined
    ) {
      window.removeEventListener("mouseup", this._boundOnWindowPointerUp);

      this._boundOnWindowPointerUp = undefined;
      this._globalPointerEventsBound = false;
    }
    if (this._keyboardBound && this._boundOnKeyDown !== undefined) {
      document.removeEventListener("keydown", this._boundOnKeyDown);

      this._boundOnKeyDown = undefined;
      this._keyboardBound = false;
    }
  }
}
