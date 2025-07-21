import { BeatElement } from "../../elements/beat-element";
import { NoteElement } from "../../elements/note-element";
import { Point } from "../../shapes/point";
import { TabWindowRenderer } from "../tab-window-renderer";
import { TabWindowSVGRenderer } from "../tab-window-svg-renderer";

export class TabWindowCallbackBinder {
  private _renderer: TabWindowSVGRenderer;

  // TEST TERRITORY, NEEDS TO BE EXTRACTED LATER
  private _selectingBeats: boolean = false;
  private _selectionStartPoint?: Point;

  /**
   *
   */
  constructor(renderer: TabWindowSVGRenderer) {
    this._renderer = renderer;
  }

  private onNoteClickTest(event: MouseEvent, noteElement: NoteElement): void {
    console.log("onNoteClickTest");

    this._renderer.tabWindow.selectNoteElement(noteElement);
    this._renderer.render();
  }

  private onBeatMouseDownTest(
    event: MouseEvent,
    beatElement: BeatElement
  ): void {
    console.log("onBeatMouseDownTest");

    this._renderer.tabWindow.clearSelection();
    this._renderer.tabWindow.recalcBeatElementSelection();
    this._selectingBeats = true;

    this._renderer.render();
  }

  private onBeatMouseEnterTest(
    event: MouseEvent,
    beatElement: BeatElement
  ): void {
    console.log("onBeatMouseEnterTest");

    if (this._selectingBeats) {
      this._renderer.tabWindow.selectBeat(beatElement);
      this._renderer.render();
    }
  }

  private onBeatMouseMoveTest(
    event: MouseEvent,
    beatElement: BeatElement
  ): void {
    console.log("onBeatMouseMove");

    if (
      !this._selectingBeats ||
      this._renderer.tabWindow.getSelectionBeats().length !== 0
    ) {
      return;
    }

    if (this._selectionStartPoint === undefined) {
      this._selectionStartPoint = new Point(event.pageX, event.pageY);
      return;
    }

    const dx = event.pageX - this._selectionStartPoint.x;
    const dy = event.pageY - this._selectionStartPoint.y;
    const distMoved = Math.sqrt(dx * dx + dy * dy);

    const rect = beatElement.rect;

    if (distMoved >= rect.width / 4) {
      this._renderer.tabWindow.selectBeat(beatElement);
    }

    this._renderer.render();
  }

  private onBeatMouseUpTest(): void {
    console.log("onBeatMouseMove");

    this._selectingBeats = false;
    this._selectionStartPoint = undefined;

    this._renderer.render();
  }

  public bind(): void {
    for (const tleRenderer of this._renderer.lineRenderers) {
      for (const barRenderer of tleRenderer.barRenderers) {
        for (const beatRenderer of barRenderer.beatRenderers) {
          // Beat level mouse events
          beatRenderer.attachMouseEvent(
            "mousedown",
            this.onBeatMouseDownTest.bind(this)
          );
          beatRenderer.attachMouseEvent(
            "mouseenter",
            this.onBeatMouseEnterTest.bind(this)
          );
          beatRenderer.attachMouseEvent(
            "mousemove",
            this.onBeatMouseMoveTest.bind(this)
          );
          beatRenderer.attachMouseEvent(
            "mouseup",
            this.onBeatMouseUpTest.bind(this)
          );

          for (const noteRenderer of beatRenderer.noteRenderers) {
            // Note level mouse events
            noteRenderer.attachMouseEvent(
              "click",
              this.onNoteClickTest.bind(this)
            );
          }
        }
      }
    }
  }
}
