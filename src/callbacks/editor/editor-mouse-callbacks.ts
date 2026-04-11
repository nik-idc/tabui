import { SVGTabNoteRenderer } from "@/notation/render/svg/svg-tab-note-renderer";
import { NoteElement, BeatElement } from "@/notation/controller";
import { NotationComponent } from "@/notation/notation-component";
import { ElementRenderer } from "@/notation/render/element-renderer";
import { Point } from "@/shared";
import { UIComponent } from "@/ui";
import { RenderType } from "../render-type";
import { SelectionDragController } from "./selection-drag-controller";

export interface EditorMouseCallbacks {
  onNoteClick(event: MouseEvent, noteElement: NoteElement): void;
  onNoteMouseDown(event: MouseEvent, noteElement: NoteElement): void;
  onNoteMouseEnter(event: MouseEvent, noteElement: NoteElement): void;
  onNoteMouseMove(event: MouseEvent, noteElement: NoteElement): void;
  onNoteMouseLeave(event: MouseEvent, noteElement: NoteElement): void;
  onBeatMouseDown(event: MouseEvent, beatElement: BeatElement): void;
  onBeatMouseEnter(event: MouseEvent, beatElement: BeatElement): void;
  onBeatMouseMove(event: MouseEvent, beatElement: BeatElement): void;
  onBeatMouseUp(): void;
  onWindowMouseUp(): void;
  bind(activeRenderers: ElementRenderer[]): void;
  unbind(): void;
}

/** Default mouse callbacks implementation for notation editor interactions. */
export class EditorMouseDefCallbacks implements EditorMouseCallbacks {
  /** UI Component reference */
  readonly uiComponent: UIComponent;
  /** Notation component containing renderer and track controller. */
  readonly notationComponent: NotationComponent;
  /** Render dispatcher callback. */
  readonly renderFunc: (type: RenderType) => void;

  /** True once global window mouseup handler is attached. */
  private _globalMouseUpBound: boolean = false;
  /** True once delegated beat interaction handlers are attached. */
  private _beatInteractionBound: boolean = false;
  /** Note renderers that already have note mouse handlers attached. */
  private _boundNoteRenderers: Set<SVGTabNoteRenderer>;
  /** Bound global window mouseup listener reference. */
  private _boundOnWindowMouseUp?: (event: MouseEvent) => void;
  /** Bound beat interaction handlers by event type. */
  private _boundBeatHandlers: Partial<
    Record<
      "mousedown" | "mousemove" | "mouseup",
      (event: MouseEvent, beatElement: BeatElement) => void
    >
  >;
  /** Selection drag state machine. */
  private _selectionDragController: SelectionDragController;

  /**
   * Creates mouse callbacks for note/beat interactions.
   */
  constructor(
    uiComponent: UIComponent,
    notationComponent: NotationComponent,
    renderFunc: (type: RenderType) => void
  ) {
    this.uiComponent = uiComponent;
    this.notationComponent = notationComponent;
    this.renderFunc = renderFunc;

    this._boundNoteRenderers = new Set();
    this._boundBeatHandlers = {};
    this._selectionDragController = new SelectionDragController();
  }

  private detachNoteRenderer(renderer: SVGTabNoteRenderer): void {
    renderer.detachMouseEvent("mousedown");
    renderer.detachMouseEvent("click");
    renderer.detachMouseEvent("mouseenter");
    renderer.detachMouseEvent("mousemove");
    renderer.detachMouseEvent("mouseleave");
  }

  private reconcileNoteRenderers(activeRenderers: ElementRenderer[]): void {
    const activeNoteRenderers = new Set<SVGTabNoteRenderer>();
    for (const renderer of activeRenderers) {
      if (renderer instanceof SVGTabNoteRenderer) {
        activeNoteRenderers.add(renderer);
      }
    }

    for (const renderer of this._boundNoteRenderers) {
      if (activeNoteRenderers.has(renderer)) {
        continue;
      }

      this.detachNoteRenderer(renderer);
      this._boundNoteRenderers.delete(renderer);
    }
  }

  /**
   * Handles note click selection (full render path).
   */
  public onNoteClick(event: MouseEvent, noteElement: NoteElement): void {
    void event;
    const editor = this.notationComponent.trackController.trackControllerEditor;

    this.notationComponent.renderer.hideSelectionPreview();
    editor.selectNoteElement(noteElement);

    this.renderFunc(RenderType.NoteSelection);
  }

  /**
   * Starts drag-selection from note pointer-down.
   */
  public onNoteMouseDown(event: MouseEvent, noteElement: NoteElement): void {
    this._selectionDragController.begin(
      noteElement.beatElement,
      new Point(event.pageX, event.pageY)
    );
  }

  /**
   * Handles note hover/enter for preview or drag-selection continuation.
   */
  public onNoteMouseEnter(event: MouseEvent, noteElement: NoteElement): void {
    const editor = this.notationComponent.trackController.trackControllerEditor;

    if (this._selectionDragController.isSelectingBeats) {
      editor.selectBeat(noteElement.beatElement);
      this.renderFunc(RenderType.DragSelection);
      return;
    }

    if (this._selectionDragController.isDragPending) {
      return;
    }

    this.notationComponent.renderer.showSelectionPreview(noteElement);
  }

  /**
   * Hides note selection preview when pointer leaves a note.
   */
  public onNoteMouseLeave(event: MouseEvent, noteElement: NoteElement): void {
    void event;
    void noteElement;
    this.notationComponent.renderer.hideSelectionPreview();
  }

  /**
   * Forwards note pointer movement to beat drag-selection logic.
   */
  public onNoteMouseMove(event: MouseEvent, noteElement: NoteElement): void {
    if (
      !this._selectionDragController.isSelectingBeats &&
      !this._selectionDragController.isDragPending
    ) {
      return;
    }

    this.onBeatMouseMove(event, noteElement.beatElement);
  }

  /**
   * Starts drag-selection from beat pointer-down.
   */
  public onBeatMouseDown(event: MouseEvent, beatElement: BeatElement): void {
    this._selectionDragController.begin(
      beatElement,
      new Point(event.pageX, event.pageY)
    );
  }

  /**
   * Continues drag-selection while entering beat hitboxes.
   */
  public onBeatMouseEnter(event: MouseEvent, beatElement: BeatElement): void {
    const editor = this.notationComponent.trackController.trackControllerEditor;
    const isLeftPressed = (event.buttons & 1) === 1;
    if (
      isLeftPressed &&
      !this._selectionDragController.isSelectingBeats &&
      !this._selectionDragController.isDragPending
    ) {
      this.onBeatMouseDown(event, beatElement);
    }

    if (this._selectionDragController.isSelectingBeats) {
      editor.selectBeat(beatElement);
      this.renderFunc(RenderType.DragSelection);
    }
  }

  /**
   * Handles beat pointer movement and drag-selection threshold transitions.
   */
  public onBeatMouseMove(event: MouseEvent, beatElement: BeatElement): void {
    const editor = this.notationComponent.trackController.trackControllerEditor;
    const dragMoveResult = this._selectionDragController.handleMove(
      new Point(event.pageX, event.pageY),
      beatElement
    );

    if (dragMoveResult.startedSelection) {
      editor.clearSelection();
      if (dragMoveResult.anchorBeat !== undefined) {
        editor.selectBeat(dragMoveResult.anchorBeat);
      }
      this.renderFunc(RenderType.DragSelection);
    }

    if (dragMoveResult.shouldSelectCurrentBeat) {
      editor.selectBeat(beatElement);
      this.renderFunc(RenderType.DragSelection);
    }
  }

  /**
   * Finalizes current drag-selection interaction.
   */
  public onBeatMouseUp(): void {
    this._selectionDragController.reset();
    this.renderFunc(RenderType.DragSelection);
  }

  /**
   * Binds one-time global/delegated handlers and note renderer handlers.
   */
  public bind(activeRenderers: ElementRenderer[]): void {
    this.reconcileNoteRenderers(activeRenderers);

    if (!this._globalMouseUpBound) {
      this._boundOnWindowMouseUp = this.onWindowMouseUp.bind(this);
      window.addEventListener("mouseup", this._boundOnWindowMouseUp);
      this._globalMouseUpBound = true;
    }

    if (!this._beatInteractionBound) {
      this._boundBeatHandlers.mousedown = this.onBeatMouseDown.bind(this);
      this._boundBeatHandlers.mousemove = this.onBeatMouseMove.bind(this);
      this._boundBeatHandlers.mouseup = this.onBeatMouseUp.bind(this);
      this.notationComponent.renderer.attachBeatInteractionEvent(
        "mousedown",
        this._boundBeatHandlers.mousedown
      );
      this.notationComponent.renderer.attachBeatInteractionEvent(
        "mousemove",
        this._boundBeatHandlers.mousemove
      );
      this.notationComponent.renderer.attachBeatInteractionEvent(
        "mouseup",
        this._boundBeatHandlers.mouseup
      );
      this._beatInteractionBound = true;
    }

    for (const renderer of activeRenderers) {
      if (renderer instanceof SVGTabNoteRenderer) {
        if (this._boundNoteRenderers.has(renderer)) {
          continue;
        }

        renderer.attachMouseEvent("mousedown", this.onNoteMouseDown.bind(this));
        renderer.attachMouseEvent("click", this.onNoteClick.bind(this));
        renderer.attachMouseEvent(
          "mouseenter",
          this.onNoteMouseEnter.bind(this)
        );
        renderer.attachMouseEvent("mousemove", this.onNoteMouseMove.bind(this));
        renderer.attachMouseEvent(
          "mouseleave",
          this.onNoteMouseLeave.bind(this)
        );
        this._boundNoteRenderers.add(renderer);
      }
    }
  }

  public unbind(): void {
    if (this._globalMouseUpBound && this._boundOnWindowMouseUp !== undefined) {
      window.removeEventListener("mouseup", this._boundOnWindowMouseUp);
      this._boundOnWindowMouseUp = undefined;
      this._globalMouseUpBound = false;
    }

    if (this._beatInteractionBound) {
      this.notationComponent.renderer.detachBeatInteractionEvent("mousedown");
      this.notationComponent.renderer.detachBeatInteractionEvent("mousemove");
      this.notationComponent.renderer.detachBeatInteractionEvent("mouseup");
      this._boundBeatHandlers = {};
      this._beatInteractionBound = false;
    }

    for (const renderer of this._boundNoteRenderers) {
      this.detachNoteRenderer(renderer);
    }
    this._boundNoteRenderers.clear();
    this._selectionDragController.reset();
  }

  /**
   * Legacy interface bridge: maps global mouseup to beat mouseup flow.
   */
  public onWindowMouseUp(): void {
    this.onBeatMouseUp();
  }
}
