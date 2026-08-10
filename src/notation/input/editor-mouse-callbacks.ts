import { SVGTabNoteRenderer } from "../render/svg/svg-tab-note-renderer";
import { NoteElement, BeatElement } from "../controller";
import { NotationComponent } from "../notation-component";
import { ElementRenderer } from "../render/element-renderer";
import { Point } from "../../shared";
import { UIComponent } from "../../ui";
import { RenderType } from "./render-type";
import { SelectionDragController } from "./selection-drag-controller";

export interface EditorMouseCallbacks {
  onNoteClick(event: MouseEvent, noteElement: NoteElement): void;
  onNotePointerDown(event: PointerEvent, noteElement: NoteElement): void;
  onNotePointerEnter(event: PointerEvent, noteElement: NoteElement): void;
  onNotePointerMove(event: PointerEvent, noteElement: NoteElement): void;
  onNotePointerLeave(event: PointerEvent, noteElement: NoteElement): void;
  onBeatClick(event: MouseEvent, beatElement: BeatElement): void;
  onBeatPointerDown(event: PointerEvent, beatElement: BeatElement): void;
  onBeatPointerMove(event: PointerEvent, beatElement: BeatElement): void;
  onBeatPointerUp(event: PointerEvent): void;
  onWindowPointerUp(event: PointerEvent): void;
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

  /** True once global pointer completion handlers are attached. */
  private _globalPointerCompletionBound: boolean = false;
  /** True once delegated beat interaction handlers are attached. */
  private _beatInteractionBound: boolean = false;
  /** Note renderers that already have note pointer handlers attached. */
  private _boundNoteRenderers: Set<SVGTabNoteRenderer>;
  /** Bound global pointer completion listener reference. */
  private _boundOnWindowPointerUp?: (event: PointerEvent) => void;
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
    this._selectionDragController = new SelectionDragController();
  }

  private detachNoteRenderer(renderer: SVGTabNoteRenderer): void {
    renderer.detachMouseEvent("pointerdown");
    renderer.detachMouseEvent("click");
    renderer.detachMouseEvent("pointerenter");
    renderer.detachMouseEvent("pointermove");
    renderer.detachMouseEvent("pointerleave");
  }

  private isPrimarySelectionPointer(event: PointerEvent): boolean {
    return (
      event.isPrimary && (event.pointerType !== "mouse" || event.button === 0)
    );
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
    const tc = this.notationComponent.trackController;

    this.notationComponent.renderer.hideSelectionPreview();
    if (tc.isPlaying) {
      this._selectionDragController.reset();
      tc.restartPlayerFromBeat(noteElement.beatElement.beat);
      this.renderFunc(RenderType.SelectionRefresh);
      return;
    }

    const prevActiveVoiceNumber = tc.activeVoiceNumber;
    tc.selectNoteElement(noteElement);

    this.renderFunc(
      prevActiveVoiceNumber === tc.activeVoiceNumber
        ? RenderType.SelectionRefresh
        : RenderType.ActiveVoiceSelection
    );
  }

  /**
   * Starts drag-selection from note pointer-down.
   */
  public onNotePointerDown(
    event: PointerEvent,
    noteElement: NoteElement
  ): void {
    if (this.notationComponent.trackController.isPlaying) {
      return;
    }

    if (
      noteElement.beatElement.beat.voiceBar.voiceNumber !==
      this.notationComponent.trackController.activeVoiceNumber
    ) {
      return;
    }

    if (!this.isPrimarySelectionPointer(event)) {
      return;
    }

    this._selectionDragController.begin(
      noteElement.beatElement,
      new Point(event.pageX, event.pageY),
      event.pointerId
    );
  }

  /**
   * Handles note hover/enter for preview or drag-selection continuation.
   */
  public onNotePointerEnter(
    event: PointerEvent,
    noteElement: NoteElement
  ): void {
    const tc = this.notationComponent.trackController;
    if (tc.isPlaying) {
      this._selectionDragController.reset();
      this.notationComponent.renderer.hideSelectionPreview();
      return;
    }

    const isActiveVoice =
      noteElement.beatElement.beat.voiceBar.voiceNumber ===
      tc.activeVoiceNumber;

    if (this._selectionDragController.isSelectingBeats && isActiveVoice) {
      tc.selectBeat(noteElement.beatElement);
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
  public onNotePointerLeave(
    event: PointerEvent,
    noteElement: NoteElement
  ): void {
    void event;
    void noteElement;
    this.notationComponent.renderer.hideSelectionPreview();
  }

  /**
   * Forwards note pointer movement to beat drag-selection logic.
   */
  public onNotePointerMove(
    event: PointerEvent,
    noteElement: NoteElement
  ): void {
    if (this.notationComponent.trackController.isPlaying) {
      this._selectionDragController.reset();
      return;
    }

    if (
      noteElement.beatElement.beat.voiceBar.voiceNumber !==
      this.notationComponent.trackController.activeVoiceNumber
    ) {
      return;
    }

    if (
      !this._selectionDragController.isSelectingBeats &&
      !this._selectionDragController.isDragPending
    ) {
      return;
    }

    this.onBeatPointerMove(event, noteElement.beatElement);
  }

  /**
   * Seeks active playback to a clicked beat without selecting it for editing.
   */
  public onBeatClick(event: MouseEvent, beatElement: BeatElement): void {
    void event;
    const tc = this.notationComponent.trackController;
    if (!tc.isPlaying) {
      return;
    }

    this._selectionDragController.reset();
    this.notationComponent.renderer.hideSelectionPreview();
    tc.restartPlayerFromBeat(beatElement.beat);
    this.renderFunc(RenderType.SelectionRefresh);
  }

  /**
   * Starts drag-selection from beat pointer-down.
   */
  public onBeatPointerDown(
    event: PointerEvent,
    beatElement: BeatElement
  ): void {
    if (this.notationComponent.trackController.isPlaying) {
      return;
    }

    if (!this.isPrimarySelectionPointer(event)) {
      return;
    }

    this._selectionDragController.begin(
      beatElement,
      new Point(event.pageX, event.pageY),
      event.pointerId
    );
  }

  /**
   * Handles beat pointer movement and drag-selection threshold transitions.
   */
  public onBeatPointerMove(
    event: PointerEvent,
    beatElement: BeatElement
  ): void {
    const tc = this.notationComponent.trackController;
    if (tc.isPlaying) {
      this._selectionDragController.reset();
      return;
    }

    const dragMoveResult = this._selectionDragController.handleMove(
      new Point(event.pageX, event.pageY),
      beatElement,
      event.pointerId
    );

    if (dragMoveResult.startedSelection) {
      tc.clearSelection();
      if (dragMoveResult.anchorBeat !== undefined) {
        tc.selectBeat(dragMoveResult.anchorBeat);
      }
      this.renderFunc(RenderType.DragSelection);
    }

    if (dragMoveResult.shouldSelectCurrentBeat) {
      tc.selectBeat(beatElement);
      this.renderFunc(RenderType.DragSelection);
    }
  }

  /**
   * Finalizes current drag-selection interaction.
   */
  public onBeatPointerUp(event: PointerEvent): void {
    const interactionActive =
      this._selectionDragController.isSelectingBeats ||
      this._selectionDragController.isDragPending;
    if (
      this._selectionDragController.finish(event.pointerId) &&
      interactionActive
    ) {
      this.renderFunc(RenderType.DragSelection);
    }
  }

  /**
   * Binds one-time global/delegated handlers and note renderer handlers.
   */
  public bind(activeRenderers: ElementRenderer[]): void {
    this.reconcileNoteRenderers(activeRenderers);

    if (!this._globalPointerCompletionBound) {
      this._boundOnWindowPointerUp = this.onWindowPointerUp.bind(this);
      window.addEventListener("pointerup", this._boundOnWindowPointerUp);
      window.addEventListener("pointercancel", this._boundOnWindowPointerUp);
      this._globalPointerCompletionBound = true;
    }

    if (!this._beatInteractionBound) {
      const onBeatClick = this.onBeatClick.bind(this);
      const onBeatPointerDown = this.onBeatPointerDown.bind(this);
      const onBeatPointerMove = this.onBeatPointerMove.bind(this);
      const onBeatPointerUp = this.onBeatPointerUp.bind(this);
      this.notationComponent.renderer.attachBeatInteractionEvent(
        "click",
        onBeatClick
      );
      this.notationComponent.renderer.attachBeatInteractionEvent(
        "pointerdown",
        onBeatPointerDown
      );
      this.notationComponent.renderer.attachBeatInteractionEvent(
        "pointermove",
        onBeatPointerMove
      );
      this.notationComponent.renderer.attachBeatInteractionEvent(
        "pointerup",
        onBeatPointerUp
      );
      this.notationComponent.renderer.attachBeatInteractionEvent(
        "pointercancel",
        onBeatPointerUp
      );
      this._beatInteractionBound = true;
    }

    for (const renderer of activeRenderers) {
      if (renderer instanceof SVGTabNoteRenderer) {
        if (this._boundNoteRenderers.has(renderer)) {
          continue;
        }

        renderer.attachMouseEvent(
          "pointerdown",
          this.onNotePointerDown.bind(this)
        );
        renderer.attachMouseEvent("click", this.onNoteClick.bind(this));
        renderer.attachMouseEvent(
          "pointerenter",
          this.onNotePointerEnter.bind(this)
        );
        renderer.attachMouseEvent(
          "pointermove",
          this.onNotePointerMove.bind(this)
        );
        renderer.attachMouseEvent(
          "pointerleave",
          this.onNotePointerLeave.bind(this)
        );
        this._boundNoteRenderers.add(renderer);
      }
    }
  }

  public unbind(): void {
    if (
      this._globalPointerCompletionBound &&
      this._boundOnWindowPointerUp !== undefined
    ) {
      window.removeEventListener("pointerup", this._boundOnWindowPointerUp);
      window.removeEventListener("pointercancel", this._boundOnWindowPointerUp);
      this._boundOnWindowPointerUp = undefined;
      this._globalPointerCompletionBound = false;
    }

    if (this._beatInteractionBound) {
      this.notationComponent.renderer.detachBeatInteractionEvent("click");
      this.notationComponent.renderer.detachBeatInteractionEvent("pointerdown");
      this.notationComponent.renderer.detachBeatInteractionEvent("pointermove");
      this.notationComponent.renderer.detachBeatInteractionEvent("pointerup");
      this.notationComponent.renderer.detachBeatInteractionEvent(
        "pointercancel"
      );
      this._beatInteractionBound = false;
    }

    for (const renderer of this._boundNoteRenderers) {
      this.detachNoteRenderer(renderer);
    }
    this._boundNoteRenderers.clear();
    this._selectionDragController.reset();
  }

  /**
   * Maps global pointer completion to beat pointer completion flow.
   */
  public onWindowPointerUp(event: PointerEvent): void {
    this.onBeatPointerUp(event);
  }
}
