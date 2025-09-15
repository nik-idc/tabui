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
  private _renderer: TabWindowSVGRenderer;
  private _mouseCallbacks: TabWindowMouseCallbacks;
  private _keyboardCallbacks: TabWindowKeyboardCallbacks;
  private _keyboardBound = false;

  constructor(
    renderer: TabWindowSVGRenderer,
    mouseCallbacks: TabWindowMouseCallbacks,
    keyboardCallbacks: TabWindowKeyboardCallbacks
  ) {
    this._renderer = renderer;
    this._mouseCallbacks = mouseCallbacks;
    this._keyboardCallbacks = keyboardCallbacks;
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
      }
    }
  }

  private bindKeyboardEvents(): void {
    if (this._keyboardBound) {
      return;
    }
    document.addEventListener("keydown", (event: KeyboardEvent) => {
      // console.log(event.key);
      const key = event.key.toLowerCase(); // normalize

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
    });
    this._keyboardBound = true;
  }

  public bind(
    renderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
  ): void {
    this.bindMouseEvents(renderers);
    this.bindKeyboardEvents();
  }
}
