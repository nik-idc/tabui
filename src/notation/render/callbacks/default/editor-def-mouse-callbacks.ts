import { NoteElement, BeatElement, TabController } from "@/notation/element";
import { Point } from "@/shared";
import { EditorMouseCallbacks } from "../editor-mouse-callbacks";
import { ElementRenderer } from "../../element-renderer";
import { EditorRenderer } from "../../editor-renderer";

export class EditorMouseDefCallbacks implements EditorMouseCallbacks {
  readonly renderer: EditorRenderer;
  readonly controller: TabController;
  readonly bindAfterRender: (activeRenderers: ElementRenderer[]) => void;

  private _selectingBeats: boolean = false;
  private _selectionStartPoint?: Point;

  /**
   *
   * @param renderer
   * @param controller
   * @param bindAfterRender Function that will bind callbacks to all new renderers
   * I.e., a new bar has been added. After that bar is rendered,
   * the renderer returns a reference to it. This function is then called,
   * passing this reference so that all new events can be bound to
   * the bar/beat/note etc
   */
  constructor(
    renderer: EditorRenderer,
    controller: TabController,
    bindAfterRender: (activeRenderers: ElementRenderer[]) => void
  ) {
    this.renderer = renderer;
    this.controller = controller;
    this.bindAfterRender = bindAfterRender;
  }

  public onNoteClick(event: MouseEvent, noteElement: NoteElement): void {
    this.renderer.hideSelectionPreview();
    this.controller.selectNoteElement(noteElement);

    this.bindAfterRender(this.renderer.render(this.controller));
  }

  public onNoteMouseEnter(event: MouseEvent, noteElement: NoteElement): void {
    if (this._selectingBeats) {
      return;
    }
    this.renderer.showSelectionPreview(this.controller, noteElement);
  }

  public onNoteMouseLeave(event: MouseEvent, noteElement: NoteElement): void {
    this.renderer.hideSelectionPreview();
  }

  public onBeatMouseDown(event: MouseEvent, beatElement: BeatElement): void {
    // console.log("Default beat mouse down event");

    this.controller.clearSelection();
    this.controller.recalcBeatElementSelection();
    this._selectingBeats = true;

    this.bindAfterRender(this.renderer.render(this.controller));
  }

  public onBeatMouseEnter(event: MouseEvent, beatElement: BeatElement): void {
    const isLeftPressed = (event.buttons & 1) === 1;
    if (isLeftPressed && !this._selectingBeats) {
      this.onBeatMouseDown(event, beatElement);
    }

    if (this._selectingBeats) {
      this.controller.selectBeat(beatElement);

      const activeRenderers = this.renderer.render(this.controller);
      this.bindAfterRender(activeRenderers);
    }
  }

  public onBeatMouseMove(event: MouseEvent, beatElement: BeatElement): void {
    if (
      !this._selectingBeats ||
      this.controller.getSelectionBeats().length !== 0
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
      this.controller.selectBeat(beatElement);
    }

    this.bindAfterRender(this.renderer.render(this.controller));
  }

  public onBeatMouseUp(): void {
    this._selectingBeats = false;
    this._selectionStartPoint = undefined;

    this.bindAfterRender(this.renderer.render(this.controller));
  }

  public onWindowMouseUp(): void {
    this.onBeatMouseUp();
  }
}
