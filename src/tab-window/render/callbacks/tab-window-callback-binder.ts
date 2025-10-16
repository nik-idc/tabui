import { BeatElement } from "../../elements/beat-element";
import { NoteElement } from "../../elements/note-element";
import { Point } from "../../shapes/point";
import { TabWindowRenderer } from "../tab-window-renderer";
import { TabWindowSVGRenderer } from "../tab-window-svg-renderer";
import { SVGBarRenderer } from "../svg/svg-bar-renderer";
import { SVGBeatRenderer } from "../svg/svg-beat-renderer";
import { SVGNoteRenderer } from "../svg/svg-note-renderer";
import { TabWindowKeyboardCallbacks } from "./tab-window-keyboard-callbacks";
import { TabWindowMouseCallbacks } from "./tab-window-mouse-callbacks";

export class TabWindowCallbackBinder {
  private _mouseCallbacks: TabWindowMouseCallbacks;
  private _keyboardCallbacks: TabWindowKeyboardCallbacks;
  private _keyboardBound = false;
  private _globalMouseEventsBound = false;

  private _boundOnWindowMouseUp: (this: TabWindowMouseCallbacks, ev: MouseEvent) => any;
  private _boundOnKeyDown: (event: KeyboardEvent) => void;

  constructor(
    mouseCallbacks: TabWindowMouseCallbacks,
    keyboardCallbacks: TabWindowKeyboardCallbacks
  ) {
    this._mouseCallbacks = mouseCallbacks;
    this._keyboardCallbacks = keyboardCallbacks;

    this._boundOnWindowMouseUp = this._mouseCallbacks.onWindowMouseUp.bind(this._mouseCallbacks);
    this._boundOnKeyDown = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase(); // normalize
        if (key.length !== 1 && key[0] === "f") {
            return;
        }

        if (event.ctrlKey && !event.shiftKey) {
            if (key === "c") {
            this._keyboardCallbacks.ctrlCEvent(event);
            } else if (key === "v") {
            this._keyboardCallbacks.ctrlVEvent(event);
            } else if (key === "z") {
            this._keyboardCallbacks.ctrlZEvent(event);
            } else if (key === "y") {
            this._keyboardCallbacks.ctrlYEvent(event);
            }
        } else if (!event.ctrlKey && event.shiftKey) {
            if (key === "v") {
            this._keyboardCallbacks.shiftVEvent(event);
            } else if (key === "p") {
            this._keyboardCallbacks.shiftPEvent(event);
            } else if (key === "b") {
            this._keyboardCallbacks.shiftBEvent(event);
            }
        } else if (!event.ctrlKey && !event.shiftKey) {
            if (key === "Delete") {
            this._keyboardCallbacks.deleteEvent(event);
            } else if (key === " ") {
            this._keyboardCallbacks.spaceEvent(event);
            } else {
            this._keyboardCallbacks.onKeyDown(event);
            }
        }
    };
  }

  private bindGlobalMouseEvents(): void {
    window.addEventListener(
      "mouseup",
      this._boundOnWindowMouseUp
    );

    this._globalMouseEventsBound = true;
  }

  private bindMouseEvents(
    renderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
  ): void {
    for (const renderer of renderers) {
      if (renderer instanceof SVGBeatRenderer) {
        renderer.attachMouseEvent(
          "mousedown",
          this._mouseCallbacks.onBeatMouseDown.bind(this._mouseCallbacks)
        );
        renderer.attachMouseEvent(
          "mouseenter",
          this._mouseCallbacks.onBeatMouseEnter.bind(this._mouseCallbacks)
        );
        renderer.attachMouseEvent(
          "mousemove",
          this._mouseCallbacks.onBeatMouseMove.bind(this._mouseCallbacks)
        );
        renderer.attachMouseEvent(
          "mouseup",
          this._mouseCallbacks.onBeatMouseUp.bind(this._mouseCallbacks)
        );
      } else if (renderer instanceof SVGNoteRenderer) {
        renderer.attachMouseEvent(
          "click",
          this._mouseCallbacks.onNoteClick.bind(this._mouseCallbacks)
        );
        renderer.attachMouseEvent(
          "mouseenter",
          this._mouseCallbacks.onNoteMouseEnter.bind(this._mouseCallbacks)
        );
        renderer.attachMouseEvent(
          "mouseleave",
          this._mouseCallbacks.onNoteMouseLeave.bind(this._mouseCallbacks)
        );
      }
    }
  }

  private bindKeyboardEvents(): void {
    if (this._keyboardBound) {
      return;
    }
    document.addEventListener("keydown", this._boundOnKeyDown);
    this._keyboardBound = true;
  }

  public bind(
    renderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
  ): void {
    if (!this._globalMouseEventsBound) {
      this.bindGlobalMouseEvents();
    }

    this.bindMouseEvents(renderers);
    this.bindKeyboardEvents();
  }

  public dispose(): void {
    if (this._globalMouseEventsBound) {
        window.removeEventListener("mouseup", this._boundOnWindowMouseUp);
        this._globalMouseEventsBound = false;
    }
    if (this._keyboardBound) {
        document.removeEventListener("keydown", this._boundOnKeyDown);
        this._keyboardBound = false;
    }
  }
}
