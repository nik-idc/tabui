import { EditorRenderer, SVGBeatRenderer, SVGNoteRenderer } from "@/notation";
import { NoteElement, BeatElement, TabController } from "@/notation/element";
import { NotationComponent } from "@/notation/notation-component";
import { ElementRenderer } from "@/notation/render/element-renderer";
import { Point } from "@/shared";
import { UIComponent } from "@/ui";
import { EditorCallbackBinder } from "./editor-callback-binder";

export interface EditorMouseCallbacks {
  // readonly renderer: EditorRenderer;
  // readonly controller: TabController;
  // readonly bindAfterRender: (activeRenderers: ElementRenderer[]) => void;

  readonly uiComponent: UIComponent;
  readonly notationComponent: NotationComponent;

  onNoteClick(event: MouseEvent, noteElement: NoteElement): void;
  onNoteMouseEnter(event: MouseEvent, noteElement: NoteElement): void;
  onNoteMouseLeave(event: MouseEvent, noteElement: NoteElement): void;
  onBeatMouseDown(event: MouseEvent, beatElement: BeatElement): void;
  onBeatMouseEnter(event: MouseEvent, beatElement: BeatElement): void;
  onBeatMouseMove(event: MouseEvent, beatElement: BeatElement): void;
  onBeatMouseUp(): void;
  onWindowMouseUp(): void;
  bind(): void;
}

export class EditorMouseDefCallbacks implements EditorMouseCallbacks {
  // readonly renderer: EditorRenderer;
  // readonly controller: TabController;
  // readonly bindAfterRender: (activeRenderers: ElementRenderer[]) => void;

  readonly uiComponent: UIComponent;
  readonly notationComponent: NotationComponent;
  // readonly tabController: TabController;

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
    // renderer: EditorRenderer,
    // controller: TabController,
    // bindAfterRender: (activeRenderers: ElementRenderer[]) => void
    uiComponent: UIComponent,
    notationComponent: NotationComponent
    // tabController: TabController
  ) {
    // this.renderer = renderer;
    // this.controller = controller;
    // this.bindAfterRender = bindAfterRender;

    this.uiComponent = uiComponent;
    this.notationComponent = notationComponent;
    // this.tabController = tabController;
    this._binder = new EditorCallbackBinder();
  }

  public onNoteClick(event: MouseEvent, noteElement: NoteElement): void {
    this.notationComponent.renderer.hideSelectionPreview();
    this.notationComponent.tabController.selectNoteElement(noteElement);

    this.bind();

    // this.renderer.hideSelectionPreview();
    // this.controller.selectNoteElement(noteElement);

    // this.bindAfterRender(this.renderer.render(this.controller));

    this.uiComponent.render();
  }

  public onNoteMouseEnter(event: MouseEvent, noteElement: NoteElement): void {
    if (this._selectingBeats) {
      return;
    }

    this.notationComponent.renderer.showSelectionPreview(
      this.notationComponent.tabController,
      noteElement
    );

    // this.renderer.showSelectionPreview(this.controller, noteElement);
  }

  public onNoteMouseLeave(event: MouseEvent, noteElement: NoteElement): void {
    this.notationComponent.renderer.hideSelectionPreview();

    // this.renderer.hideSelectionPreview();
  }

  public onBeatMouseDown(event: MouseEvent, beatElement: BeatElement): void {
    // console.log("Default beat mouse down event");

    this.notationComponent.tabController.clearSelection();
    this.notationComponent.tabController.recalcBeatElementSelection();

    // this.controller.clearSelection();
    // this.controller.recalcBeatElementSelection();

    this._selectingBeats = true;

    this.bind();

    // this.bindAfterRender(this.renderer.render(this.controller));

    this.uiComponent.render();
  }

  public onBeatMouseEnter(event: MouseEvent, beatElement: BeatElement): void {
    const isLeftPressed = (event.buttons & 1) === 1;
    if (isLeftPressed && !this._selectingBeats) {
      this.onBeatMouseDown(event, beatElement);
    }

    if (this._selectingBeats) {
      this.notationComponent.tabController.selectBeat(beatElement);

      // this.controller.selectBeat(beatElement);

      this.bind();
      // const activeRenderers = this.renderer.render(this.controller);
      // this.bindAfterRender(activeRenderers);

      this.uiComponent.render();
    }
  }

  public onBeatMouseMove(event: MouseEvent, beatElement: BeatElement): void {
    if (
      !this._selectingBeats ||
      this.notationComponent.tabController.getSelectionBeats().length !== 0
      // this.controller.getSelectionBeats().length !== 0
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
      this.notationComponent.tabController.selectBeat(beatElement);

      // this.controller.selectBeat(beatElement);

      this.uiComponent.render();
    }

    this.bind();

    // this.bindAfterRender(this.renderer.render(this.controller));
  }

  public onBeatMouseUp(): void {
    this._selectingBeats = false;
    this._selectionStartPoint = undefined;

    this.bind();
    // this.bindAfterRender(this.renderer.render(this.controller));
  }

  public onWindowMouseUp(): void {
    this.onBeatMouseUp();
  }

  public bind(): void {
    const activeRenderers = this.notationComponent.render();

    for (const renderer of activeRenderers) {
      if (renderer instanceof SVGBeatRenderer) {
        renderer.attachMouseEvent("mousedown", this.onBeatMouseDown.bind(this));
        renderer.attachMouseEvent(
          "mouseenter",
          this.onBeatMouseEnter.bind(this)
        );
        renderer.attachMouseEvent("mousemove", this.onBeatMouseMove.bind(this));
        renderer.attachMouseEvent("mouseup", this.onBeatMouseUp.bind(this));
      } else if (renderer instanceof SVGNoteRenderer) {
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
