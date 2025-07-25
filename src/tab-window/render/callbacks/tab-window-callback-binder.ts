import { BeatElement } from "../../elements/beat-element";
import { NoteElement } from "../../elements/note-element";
import { Point } from "../../shapes/point";
import { TabWindowRenderer } from "../tab-window-renderer";
import { TabWindowSVGRenderer } from "../tab-window-svg-renderer";
import { TabWindowKeyboardCallbacks } from "./tab-window-keyboard-callbacks";
import { TabWindowMouseCallbacks } from "./tab-window-mouse-callbacks";

export class TabWindowCallbackBinder {
  private _renderer: TabWindowSVGRenderer;
  private _mouseCallbacks: TabWindowMouseCallbacks;
  private _keyboardCallbacks: TabWindowKeyboardCallbacks;

  constructor(
    renderer: TabWindowSVGRenderer,
    mouseCallbacks: TabWindowMouseCallbacks,
    keyboardCallbacks: TabWindowKeyboardCallbacks
  ) {
    this._renderer = renderer;
    this._mouseCallbacks = mouseCallbacks;
    this._keyboardCallbacks = keyboardCallbacks;
  }

  private bindMouseEvents(): void {
    for (const tleRenderer of this._renderer.lineRenderers) {
      for (const barRenderer of tleRenderer.barRenderers) {
        for (const beatRenderer of barRenderer.beatRenderers) {
          // Beat level mouse events
          beatRenderer.attachMouseEvent(
            "mousedown",
            this._mouseCallbacks.onBeatMouseDown.bind(this)
          );
          beatRenderer.attachMouseEvent(
            "mouseenter",
            this._mouseCallbacks.onBeatMouseEnter.bind(this)
          );
          beatRenderer.attachMouseEvent(
            "mousemove",
            this._mouseCallbacks.onBeatMouseMove.bind(this)
          );
          beatRenderer.attachMouseEvent(
            "mouseup",
            this._mouseCallbacks.onBeatMouseUp.bind(this)
          );

          for (const noteRenderer of beatRenderer.noteRenderers) {
            // Note level mouse events
            noteRenderer.attachMouseEvent(
              "click",
              this._mouseCallbacks.onNoteClick.bind(this)
            );
          }
        }
      }
    }
  }

  private bindKeyboardEvents(): void {
    document.addEventListener("keydown", (event: KeyboardEvent) => {
      console.log(event.key);
      if (event.ctrlKey && !event.shiftKey) {
        if (event.key === "c") {
          this._keyboardCallbacks.ctrlCEvent(event);
        } else if (event.key === "v") {
          this._keyboardCallbacks.ctrlVEvent(event);
        } else if (event.key === "z") {
          this._keyboardCallbacks.ctrlZEvent(event);
        } else if (event.key === "y") {
          this._keyboardCallbacks.ctrlYEvent(event);
        }
      } else if (!event.ctrlKey && event.shiftKey) {
        if (event.key === "v") {
          this._keyboardCallbacks.shiftVEvent(event);
        } else if (event.key === "p") {
          this._keyboardCallbacks.shiftPEvent(event);
        } else if (event.key === "b") {
          this._keyboardCallbacks.shiftBEvent(event);
        }
      } else if (!event.ctrlKey && !event.shiftKey) {
        if (event.key === "Delete") {
          this._keyboardCallbacks.deleteEvent(event);
        } else if (event.key === " ") {
          this._keyboardCallbacks.spaceEvent(event);
        } else {
          this._keyboardCallbacks.onKeyDown(event);
        }
      }
    });
  }

  public bind(): void {
    this.bindMouseEvents();
    this.bindKeyboardEvents();
  }
}
