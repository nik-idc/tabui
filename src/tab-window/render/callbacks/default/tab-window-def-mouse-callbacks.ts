import { BeatElement } from "../../../elements/beat-element";
import { NoteElement } from "../../../elements/note-element";
import { Point } from "../../../shapes/point";
import { TabWindowSVGRenderer } from "../../tab-window-svg-renderer";
import { TabWindowMouseCallbacks } from "../tab-window-mouse-callbacks";

export class TabWindowMouseDefCallbacks implements TabWindowMouseCallbacks {
  private _renderer: TabWindowSVGRenderer;

  private _selectingBeats: boolean = false;
  private _selectionStartPoint?: Point;

  constructor(renderer: TabWindowSVGRenderer) {
    this._renderer = renderer;
  }

  public onNoteClick(event: MouseEvent, noteElement: NoteElement): void {
    this._renderer.tabWindow.selectNoteElement(noteElement);
    this._renderer.render();
  }

  public onBeatMouseDown(event: MouseEvent, beatElement: BeatElement): void {
    this._renderer.tabWindow.clearSelection();
    this._renderer.tabWindow.recalcBeatElementSelection();
    this._selectingBeats = true;

    this._renderer.render();
  }

  public onBeatMouseEnter(event: MouseEvent, beatElement: BeatElement): void {
    if (this._selectingBeats) {
      this._renderer.tabWindow.selectBeat(beatElement);
      this._renderer.render();
    }
  }

  public onBeatMouseMove(event: MouseEvent, beatElement: BeatElement): void {
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

  public onBeatMouseUp(): void {
    this._selectingBeats = false;
    this._selectionStartPoint = undefined;

    this._renderer.render();
  }
}
