import { NoteElement, TrackController } from "@/notation/controller";
import { TabNoteElement } from "@/notation/controller/element/note/tab-note-element";
import { createSVGRect } from "@/shared";

/**
 * Renders all selection-layer overlays (preview, selected note, beat selection)
 * inside the provided selection SVG group.
 */
export class SelectionOverlayRenderer {
  /** Root SVG group for selection visuals. */
  private _selectionGroup: SVGGElement;
  /** Hover preview rectangle for note selection. */
  private _selectionPreviewRect?: SVGRectElement;
  /** Outline rectangle for currently selected note. */
  private _selectedNoteRect?: SVGRectElement;
  /** Beat selection rectangles reused across renders. */
  private _selectionRects?: SVGRectElement[];

  /**
   * Creates selection overlay renderer for a selection layer group.
   */
  constructor(selectionGroup: SVGGElement) {
    this._selectionGroup = selectionGroup;
  }

  /**
   * Resolves currently selected tab note element from track element registry.
   */
  private getSelectedTabNoteElement(
    trackController: TrackController
  ): TabNoteElement | undefined {
    const selectedNote =
      trackController.trackControllerEditor.selectionManager.selectedNote;
    if (selectedNote === undefined) {
      return undefined;
    }

    const registeredElements =
      trackController.trackElement.getElementRegistry();
    const selectedNoteElement = registeredElements.get(selectedNote.note.uuid);
    if (
      selectedNoteElement === undefined ||
      !(selectedNoteElement instanceof TabNoteElement) ||
      selectedNoteElement.note !== selectedNote.note
    ) {
      return undefined;
    }

    return selectedNoteElement;
  }

  /**
   * Renders or clears selected-note outline rectangle.
   */
  private renderSelectedNoteOverlay(trackController: TrackController): void {
    const selectedNoteElement = this.getSelectedTabNoteElement(trackController);

    if (selectedNoteElement === undefined) {
      if (this._selectedNoteRect !== undefined) {
        this._selectionGroup.removeChild(this._selectedNoteRect);
        this._selectedNoteRect = undefined;
      }
      return;
    }

    if (this._selectedNoteRect === undefined) {
      this._selectedNoteRect = createSVGRect();
      this._selectedNoteRect.setAttribute("fill", "none");
      this._selectedNoteRect.setAttribute("stroke", "orange");
      this._selectedNoteRect.setAttribute("stroke-width", "1");
      this._selectedNoteRect.setAttribute("rx", "3");
      this._selectedNoteRect.setAttribute("ry", "3");
      this._selectedNoteRect.setAttribute("pointer-events", "none");
      this._selectionGroup.appendChild(this._selectedNoteRect);
    }

    const rect = selectedNoteElement.textRectGlobal;
    this._selectedNoteRect.setAttribute("x", `${rect.x}`);
    this._selectedNoteRect.setAttribute("y", `${rect.y}`);
    this._selectedNoteRect.setAttribute("width", `${rect.width}`);
    this._selectedNoteRect.setAttribute("height", `${rect.height}`);
  }

  /**
   * Renders beat selection rectangles with pooling (grow/shrink/update in place).
   */
  private renderSelectionRects(trackController: TrackController): void {
    const selectionRects = trackController.getSelectionRects();
    if (this._selectionRects === undefined) {
      this._selectionRects = [];
    }

    while (this._selectionRects.length < selectionRects.length) {
      const rect = createSVGRect();
      const id = `selection-rect-${this._selectionRects.length + 1}`;
      rect.setAttribute("id", id);
      rect.setAttribute("fill", "gray");
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
      this._selectionPreviewRect.setAttribute("fill", "white");
      this._selectionPreviewRect.setAttribute("stroke", "orange");
      this._selectionPreviewRect.setAttribute("stroke-width", "1");
      this._selectionPreviewRect.setAttribute("rx", "3");
      this._selectionPreviewRect.setAttribute("ry", "3");
      this._selectionPreviewRect.setAttribute("fill-opacity", "0.5");
      this._selectionPreviewRect.setAttribute("stroke-opacity", "0.5");
      this._selectionPreviewRect.setAttribute("pointer-events", "none");
      this._selectionGroup.appendChild(this._selectionPreviewRect);
    }

    if (!(noteElement instanceof TabNoteElement)) {
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
  public render(trackController: TrackController): void {
    this.renderSelectedNoteOverlay(trackController);
    this.renderSelectionRects(trackController);
  }

  /**
   * Clears all selection-layer visuals from the selection group.
   */
  public clear(): void {
    if (this._selectionPreviewRect !== undefined) {
      this._selectionGroup.removeChild(this._selectionPreviewRect);
      this._selectionPreviewRect = undefined;
    }

    if (this._selectedNoteRect !== undefined) {
      this._selectionGroup.removeChild(this._selectedNoteRect);
      this._selectedNoteRect = undefined;
    }

    this.unrenderSelectionRects();
  }
}
