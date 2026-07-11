import { SVGTabNoteRenderer } from "@/notation";
import { ElementRenderer } from "@/notation/render/element-renderer";
import { EditorKeyboardCallbacks } from "./editor-keyboard-callbacks";
import { EditorMouseCallbacks } from "./editor-mouse-callbacks";
import { SVGTabBeatRenderer } from "@/notation/render/svg/svg-tab-beat-renderer";

export class EditorCallbackBinder {
  private _globalMouseEventsBound = false;
  private _keyboardBound = false;
  private _boundOnWindowMouseUp?: (event: MouseEvent) => void;
  private _boundOnKeyDown?: (event: KeyboardEvent) => void;

  private bindGlobalMouseEvents(mouseCallbacks: EditorMouseCallbacks): void {
    if (this._globalMouseEventsBound) {
      return;
    }

    this._boundOnWindowMouseUp =
      mouseCallbacks.onWindowMouseUp.bind(mouseCallbacks);
    window.addEventListener("mouseup", this._boundOnWindowMouseUp);
    this._globalMouseEventsBound = true;
  }

  public bindMouseEvents(
    mouseCallbacks: EditorMouseCallbacks,
    renderers: ElementRenderer[]
  ): void {
    for (const renderer of renderers) {
      if (renderer instanceof SVGTabBeatRenderer) {
        renderer.attachMouseEvent(
          "mousedown",
          mouseCallbacks.onBeatMouseDown.bind(mouseCallbacks)
        );
        renderer.attachMouseEvent(
          "mouseenter",
          mouseCallbacks.onBeatMouseEnter.bind(mouseCallbacks)
        );
        renderer.attachMouseEvent(
          "mousemove",
          mouseCallbacks.onBeatMouseMove.bind(mouseCallbacks)
        );
        renderer.attachMouseEvent(
          "mouseup",
          mouseCallbacks.onBeatMouseUp.bind(mouseCallbacks)
        );
      } else if (renderer instanceof SVGTabNoteRenderer) {
        renderer.attachMouseEvent(
          "click",
          mouseCallbacks.onNoteClick.bind(mouseCallbacks)
        );
        renderer.attachMouseEvent(
          "mouseenter",
          mouseCallbacks.onNoteMouseEnter.bind(mouseCallbacks)
        );
        renderer.attachMouseEvent(
          "mouseleave",
          mouseCallbacks.onNoteMouseLeave.bind(mouseCallbacks)
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
    if (!this._globalMouseEventsBound) {
      this.bindGlobalMouseEvents(mouseCallbacks);
    }

    this.bindMouseEvents(mouseCallbacks, renderers);
    this.bindKeyboardEvents(keyboardCallbacks);
  }

  public dispose(): void {
    if (
      this._globalMouseEventsBound &&
      this._boundOnWindowMouseUp !== undefined
    ) {
      window.removeEventListener("mouseup", this._boundOnWindowMouseUp);

      this._boundOnWindowMouseUp = undefined;
      this._globalMouseEventsBound = false;
    }
    if (this._keyboardBound && this._boundOnKeyDown !== undefined) {
      document.removeEventListener("keydown", this._boundOnKeyDown);

      this._boundOnKeyDown = undefined;
      this._keyboardBound = false;
    }
  }
}
