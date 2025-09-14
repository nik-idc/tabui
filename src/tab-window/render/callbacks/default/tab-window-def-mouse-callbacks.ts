import { BeatElement } from "../../../elements/beat-element";
import { NoteElement } from "../../../elements/note-element";
import { Point } from "../../../shapes/point";
import { TabWindowSVGRenderer } from "../../tab-window-svg-renderer";
import { TabWindowMouseCallbacks } from "../tab-window-mouse-callbacks";
import { SVGBarRenderer } from "../../svg/svg-bar-renderer";
import { SVGBeatRenderer } from "../../svg/svg-beat-renderer";
import { SVGNoteRenderer } from "../../svg/svg-note-renderer";

export class TabWindowMouseDefCallbacks implements TabWindowMouseCallbacks {
  private _renderer: TabWindowSVGRenderer;
  private _renderAndBind: (
    newRenderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
  ) => void;

  private _selectingBeats: boolean = false;
  private _selectionStartPoint?: Point;

  constructor(
    renderer: TabWindowSVGRenderer,
    renderAndBind: (
      newRenderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
    ) => void
  ) {
    this._renderer = renderer;
    this._renderAndBind = renderAndBind;
  }

  public onNoteClick(event: MouseEvent, noteElement: NoteElement): void {
    console.log("Default note click event");
    console.log(
      `Selected element is ${
        this._renderer.tabWindow.getSelectedElement() === undefined
          ? "undefined"
          : "defined"
      }`
    );

    this._renderer.tabWindow.selectNoteElement(noteElement);
    this._renderAndBind(this._renderer.render());
  }

  public onBeatMouseDown(event: MouseEvent, beatElement: BeatElement): void {
    // console.log("Default beat mouse down event");

    this._renderer.tabWindow.clearSelection();
    this._renderer.tabWindow.recalcBeatElementSelection();
    this._selectingBeats = true;

    this._renderAndBind(this._renderer.render());
  }

  public onBeatMouseEnter(event: MouseEvent, beatElement: BeatElement): void {
    if (this._selectingBeats) {
      this._renderer.tabWindow.selectBeat(beatElement);
      this._renderAndBind(this._renderer.render());
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

    this._renderAndBind(this._renderer.render());
  }

  public onBeatMouseUp(): void {
    this._selectingBeats = false;
    this._selectionStartPoint = undefined;

    this._renderAndBind(this._renderer.render());
  }
}