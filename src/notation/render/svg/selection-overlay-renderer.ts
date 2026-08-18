import {
  NoteElement,
  TabBeatElement,
  TrackController,
  TrackLineIdentity,
} from "../../controller";
import { TabNoteSlotElement } from "../../controller/element/note/tab-note-slot-element";
import { createSVGRect } from "../../../shared";

/**
 * Renders all selection-layer overlays (preview, selected note, beat selection)
 * inside the provided selection SVG group.
 */
export class SelectionOverlayRenderer {
  readonly trackController: TrackController;

  /** Root SVG group for selection visuals. */
  private _selectionGroup: SVGGElement;
  /** Hover preview rectangle for note selection. */
  private _selectionPreviewRect?: SVGRectElement;
  /** Outline rectangle for currently selected note. */
  private _selectionCursorRect?: SVGRectElement;
  /** Beat selection rectangles reused across renders. */
  private _selectionRects?: SVGRectElement[];

  /**
   * Creates selection overlay renderer for a selection layer group.
   */
  constructor(selectionGroup: SVGGElement, trackController: TrackController) {
    this.trackController = trackController;

    this._selectionGroup = selectionGroup;
  }

  /**
   * NOTE: Could (and probably should) be extracted to TrackController
   * Resolves currently selected tab note element from track element registry.
   */
  private getSelectedTabNoteElement(): TabNoteSlotElement | undefined {
    const selectionCursor = this.trackController.selectionCursor;
    if (selectionCursor === undefined) {
      return undefined;
    }

    const beatElement = this.trackController.getBeatElementByUUID(
      selectionCursor.beat.uuid
    );
    if (!(beatElement instanceof TabBeatElement)) {
      return undefined;
    }

    const identity = TabNoteSlotElement.createStableIdentity(
      beatElement,
      selectionCursor.noteIndex + 1
    );
    const selectionCursorElement =
      this.trackController.trackElement.getMaterializedElementByIdentity(
        identity
      );

    if (
      selectionCursorElement === undefined ||
      !(selectionCursorElement instanceof TabNoteSlotElement)
    ) {
      return undefined;
    }

    return selectionCursorElement;
  }

  /**
   * Renders or clears the selection cursor outline rectangle.
   */
  private renderSelectedNoteOverlay(): void {
    const selectionCursorElement = this.getSelectedTabNoteElement();

    if (selectionCursorElement === undefined) {
      if (this._selectionCursorRect !== undefined) {
        this._selectionGroup.removeChild(this._selectionCursorRect);
        this._selectionCursorRect = undefined;
      }
      return;
    }

    if (this._selectionCursorRect === undefined) {
      this._selectionCursorRect = createSVGRect();
      this._selectionCursorRect.setAttribute("fill", "none");
      this._selectionCursorRect.setAttribute(
        "stroke",
        "var(--tu-notation-selection-stroke)"
      );
      this._selectionCursorRect.setAttribute("stroke-width", "1");
      this._selectionCursorRect.setAttribute("rx", "3");
      this._selectionCursorRect.setAttribute("ry", "3");
      this._selectionCursorRect.setAttribute("pointer-events", "none");
      this._selectionGroup.appendChild(this._selectionCursorRect);
    }

    const rect = selectionCursorElement.selectionRect;
    this._selectionCursorRect.setAttribute("x", `${rect.x}`);
    this._selectionCursorRect.setAttribute("y", `${rect.y}`);
    this._selectionCursorRect.setAttribute("width", `${rect.width}`);
    this._selectionCursorRect.setAttribute("height", `${rect.height}`);
  }

  /**
   * Renders beat selection rectangles with pooling (grow/shrink/update in place).
   */
  private renderSelectionRects(): void {
    const selectionRects = this.trackController.getSelectionRects();
    if (this._selectionRects === undefined) {
      this._selectionRects = [];
    }

    while (this._selectionRects.length < selectionRects.length) {
      const rect = createSVGRect();
      const id = `selection-rect-${this._selectionRects.length + 1}`;
      rect.setAttribute("id", id);
      rect.setAttribute("fill", "var(--tu-notation-selection-block-fill)");
      rect.setAttribute("stroke-width", "1");
      rect.setAttribute("fill-opacity", "0.5");
      rect.setAttribute("stroke-opacity", "0.5");
      rect.setAttribute("pointer-events", "none");
      this._selectionGroup.appendChild(rect);
      this._selectionRects.push(rect);
    }

    while (this._selectionRects.length > selectionRects.length) {
      const rect = this._selectionRects.pop();
      if (rect !== undefined) {
        this._selectionGroup.removeChild(rect);
      }
    }

    for (let i = 0; i < this._selectionRects.length; i++) {
      const x = `${selectionRects[i].x}`;
      const y = `${selectionRects[i].y}`;
      const width = `${selectionRects[i].width}`;
      const height = `${selectionRects[i].height}`;
      this._selectionRects[i].setAttribute("x", x);
      this._selectionRects[i].setAttribute("y", y);
      this._selectionRects[i].setAttribute("width", width);
      this._selectionRects[i].setAttribute("height", height);
      this._selectionRects[i].setAttribute("display", "block");
    }
  }

  /**
   * Removes all rendered beat selection rectangles.
   */
  private unrenderSelectionRects(): void {
    if (
      this._selectionRects === undefined ||
      this._selectionRects.length === 0
    ) {
      return;
    }

    for (const rect of this._selectionRects) {
      this._selectionGroup.removeChild(rect);
    }

    this._selectionRects = undefined;
  }

  /**
   * Shows selection preview for hovered note.
   */
  public showSelectionPreview(noteElement: NoteElement): void {
    if (this._selectionPreviewRect === undefined) {
      this._selectionPreviewRect = createSVGRect();
      this._selectionPreviewRect.setAttribute("id", "selectionPreview");
      this._selectionPreviewRect.setAttribute(
        "fill",
        "var(--tu-notation-selection-fill)"
      );
      this._selectionPreviewRect.setAttribute(
        "stroke",
        "var(--tu-notation-selection-stroke)"
      );
      this._selectionPreviewRect.setAttribute("stroke-width", "1");
      this._selectionPreviewRect.setAttribute("rx", "3");
      this._selectionPreviewRect.setAttribute("ry", "3");
      this._selectionPreviewRect.setAttribute("fill-opacity", "0.5");
      this._selectionPreviewRect.setAttribute("stroke-opacity", "0.5");
      this._selectionPreviewRect.setAttribute("pointer-events", "none");
      this._selectionGroup.appendChild(this._selectionPreviewRect);
    }

    if (!(noteElement instanceof TabNoteSlotElement)) {
      throw Error("Unsupported note style");
    }

    this._selectionPreviewRect.setAttribute(
      "x",
      `${noteElement.selectionRect.x}`
    );
    this._selectionPreviewRect.setAttribute(
      "y",
      `${noteElement.selectionRect.y}`
    );
    this._selectionPreviewRect.setAttribute(
      "width",
      `${noteElement.selectionRect.width}`
    );
    this._selectionPreviewRect.setAttribute(
      "height",
      `${noteElement.selectionRect.height}`
    );
    this._selectionPreviewRect.setAttribute("display", "block");
  }

  /**
   * Hides selection preview without removing the DOM node.
   */
  public hideSelectionPreview(): void {
    if (this._selectionPreviewRect !== undefined) {
      this._selectionPreviewRect.setAttribute("display", "none");
    }
  }

  /**
   * Renders full selection layer state for the current track controller.
   */
  public render(): void {
    this.renderSelectedNoteOverlay();
    this.renderSelectionRects();
  }

  /**
   * Clears all selection-layer visuals from the selection group.
   */
  public unrender(): void {
    if (this._selectionPreviewRect !== undefined) {
      this._selectionGroup.removeChild(this._selectionPreviewRect);
      this._selectionPreviewRect = undefined;
    }

    if (this._selectionCursorRect !== undefined) {
      this._selectionGroup.removeChild(this._selectionCursorRect);
      this._selectionCursorRect = undefined;
    }

    this.unrenderSelectionRects();
  }
}
