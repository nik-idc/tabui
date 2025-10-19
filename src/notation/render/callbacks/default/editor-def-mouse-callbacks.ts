import { NoteElement, BeatElement } from "@/notation/element";
import { Point } from "@/shared";
import {
  EditorSVGRenderer,
  SVGBarRenderer,
  SVGBeatRenderer,
  SVGNoteRenderer,
} from "../../svg";
import { EditorMouseCallbacks } from "../editor-mouse-callbacks";

export class EditorMouseDefCallbacks implements EditorMouseCallbacks {
  private _renderer: EditorSVGRenderer;
  private _renderAndBind: (
    activeRenderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
  ) => void;

  private _selectingBeats: boolean = false;
  private _selectionStartPoint?: Point;

  constructor(
    renderer: EditorSVGRenderer,
    renderAndBind: (
      activeRenderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
    ) => void
  ) {
    this._renderer = renderer;
    this._renderAndBind = renderAndBind;
  }

  public onNoteClick(event: MouseEvent, noteElement: NoteElement): void {
    this._renderer.hideSelectionPreview();
    this._renderer.tabController.selectNoteElement(noteElement);
    this._renderAndBind(this._renderer.render());
  }

  public onNoteMouseEnter(event: MouseEvent, noteElement: NoteElement): void {
    if (this._selectingBeats) {
      return;
    }
    this._renderer.showSelectionPreview(noteElement);
  }

  public onNoteMouseLeave(event: MouseEvent, noteElement: NoteElement): void {
    this._renderer.hideSelectionPreview();
  }

  public onBeatMouseDown(event: MouseEvent, beatElement: BeatElement): void {
    // console.log("Default beat mouse down event");

    this._renderer.tabController.clearSelection();
    this._renderer.tabController.recalcBeatElementSelection();
    this._selectingBeats = true;

    this._renderAndBind(this._renderer.render());
  }

  public onBeatMouseEnter(event: MouseEvent, beatElement: BeatElement): void {
    const isLeftPressed = (event.buttons & 1) === 1;
    if (isLeftPressed && !this._selectingBeats) {
      this.onBeatMouseDown(event, beatElement);
    }

    if (this._selectingBeats) {
      this._renderer.tabController.selectBeat(beatElement);
      this._renderAndBind(this._renderer.render());
    }
  }

  public onBeatMouseMove(event: MouseEvent, beatElement: BeatElement): void {
    if (
      !this._selectingBeats ||
      this._renderer.tabController.getSelectionBeats().length !== 0
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
      this._renderer.tabController.selectBeat(beatElement);
    }

    this._renderAndBind(this._renderer.render());
  }

  public onBeatMouseUp(): void {
    this._selectingBeats = false;
    this._selectionStartPoint = undefined;

    this._renderAndBind(this._renderer.render());
  }

  public onWindowMouseUp(): void {
    this.onBeatMouseUp();
  }
}
