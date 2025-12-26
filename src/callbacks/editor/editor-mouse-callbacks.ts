import { SVGGuitarNoteRenderer } from "@/notation";
import { NoteElement, BeatElement } from "@/notation/controller";
import { NotationComponent } from "@/notation/notation-component";
import { ElementRenderer } from "@/notation/render/element-renderer";
import { Point } from "@/shared";
import { UIComponent } from "@/ui";
import { EditorCallbackBinder } from "./editor-callback-binder";
import { SVGTabBeatRenderer } from "@/notation/render/svg/svg-tab-beat-renderer";

export interface EditorMouseCallbacks {
  onNoteClick(event: MouseEvent, noteElement: NoteElement): void;
  onNoteMouseEnter(event: MouseEvent, noteElement: NoteElement): void;
  onNoteMouseLeave(event: MouseEvent, noteElement: NoteElement): void;
  onBeatMouseDown(event: MouseEvent, beatElement: BeatElement): void;
  onBeatMouseEnter(event: MouseEvent, beatElement: BeatElement): void;
  onBeatMouseMove(event: MouseEvent, beatElement: BeatElement): void;
  onBeatMouseUp(): void;
  onWindowMouseUp(): void;
  bind(activeRenderers: ElementRenderer[]): void;
}

export class EditorMouseDefCallbacks implements EditorMouseCallbacks {
  private _uiComponent: UIComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;

  private _binder: EditorCallbackBinder;
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
    uiComponent: UIComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._uiComponent = uiComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;

    this._binder = new EditorCallbackBinder();
  }

  public onNoteClick(event: MouseEvent, noteElement: NoteElement): void {
    this._notationComponent.renderer.hideSelectionPreview();
    this._notationComponent.trackController.trackControllerEditor.selectNoteElement(
      noteElement
    );

    this._renderFunc();
  }

  public onNoteMouseEnter(event: MouseEvent, noteElement: NoteElement): void {
    if (this._selectingBeats) {
      return;
    }

    this._notationComponent.renderer.showSelectionPreview(noteElement);
  }

  public onNoteMouseLeave(event: MouseEvent, noteElement: NoteElement): void {
    this._notationComponent.renderer.hideSelectionPreview();
  }

  public onBeatMouseDown(event: MouseEvent, beatElement: BeatElement): void {
    this._notationComponent.trackController.trackControllerEditor.clearSelection();

    this._selectingBeats = true;

    this._renderFunc();
  }

  public onBeatMouseEnter(event: MouseEvent, beatElement: BeatElement): void {
    const isLeftPressed = (event.buttons & 1) === 1;
    if (isLeftPressed && !this._selectingBeats) {
      this.onBeatMouseDown(event, beatElement);
    }

    if (this._selectingBeats) {
      this._notationComponent.trackController.trackControllerEditor.selectBeat(
        beatElement
      );

      this._renderFunc();
    }
  }

  public onBeatMouseMove(event: MouseEvent, beatElement: BeatElement): void {
    // const selection =
    //   this._notationComponent.trackController.trackControllerEditor
    //     .selectionManager.selectionAsBeats;
    const selectedNote =
      this._notationComponent.trackController.trackControllerEditor
        .selectionManager.selectedNote;
    if (!this._selectingBeats || selectedNote === undefined) {
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
      this._notationComponent.trackController.trackControllerEditor.selectBeat(
        beatElement
      );
      this._renderFunc();
    }
  }

  public onBeatMouseUp(): void {
    this._selectingBeats = false;
    this._selectionStartPoint = undefined;

    this._renderFunc();
  }

  public onWindowMouseUp(): void {
    this.onBeatMouseUp();
  }

  public bind(activeRenderers: ElementRenderer[]): void {
    for (const renderer of activeRenderers) {
      if (renderer instanceof SVGTabBeatRenderer) {
        renderer.attachMouseEvent("mousedown", this.onBeatMouseDown.bind(this));
        renderer.attachMouseEvent(
          "mouseenter",
          this.onBeatMouseEnter.bind(this)
        );
        renderer.attachMouseEvent("mousemove", this.onBeatMouseMove.bind(this));
        renderer.attachMouseEvent("mouseup", this.onBeatMouseUp.bind(this));
      } else if (renderer instanceof SVGGuitarNoteRenderer) {
        renderer.attachMouseEvent("click", this.onNoteClick.bind(this));
        renderer.attachMouseEvent(
          "mouseenter",
          this.onNoteMouseEnter.bind(this)
        );
        renderer.attachMouseEvent(
          "mouseleave",
          this.onNoteMouseLeave.bind(this)
        );
      }
    }
  }
}
