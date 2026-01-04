import {
  NoteElement,
  TabLayoutDimensions,
  TrackController,
} from "@/notation/controller";
import { createSVG, createSVGRect, Rect } from "@/shared";
import { EditorRenderer } from "../editor-renderer";
import { TrackPlayerSVGAnimator } from "./player-svg-animator";
import { SVGTrackLineRenderer } from "./svg-track-line-renderer";
import { ElementRenderer } from "../element-renderer";
import { TabNoteElement } from "@/notation/controller/element/tab-note-element";

/**
 * TODO: Update to re-render everything ONLY
 * after an update. Use dirty markers
 */

/**
 * Render a track window using SVG
 */
export class EditorSVGRenderer implements EditorRenderer {
  /** Root DIV element */
  readonly rootDiv: HTMLDivElement;

  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _groupSVG: SVGSVGElement;
  /** Player cursor SVG rectangle */
  private _playerCursorRect?: SVGRectElement;
  /** Selection preview SVG rectangle */
  private _selectionPreviewRect?: SVGRectElement;
  /** Beat selection rectangles */
  private _selectionRects?: SVGRectElement[];

  /** Rendered track line elements */
  private _renderedTrackLineElements: Map<number, SVGTrackLineRenderer>;

  /** Player animator */
  private _playerAnimator?: TrackPlayerSVGAnimator;

  /**
   * Render a track window using SVG
   * @param assetsPath Path to assets
   * @param svgRoot SVG root element
   */
  constructor(rootDiv: HTMLDivElement, assetsPath: string) {
    this.rootDiv = rootDiv;
    this._groupSVG = createSVG();
    this._groupSVG.classList.add("tu-root-svg");
    this.rootDiv.appendChild(this._groupSVG);

    this._assetsPath = assetsPath;

    this._renderedTrackLineElements = new Map();
  }

  /**
   * Render all track lines
   */
  public renderTrackLines(trackController: TrackController): ElementRenderer[] {
    const trackLineElements = trackController.trackElement.trackLineElements;

    // Check if there are any bar element to remove
    const curBarElementUUIDs = new Set(trackLineElements.map((t) => t.uuid));
    for (const [uuid, renderer] of this._renderedTrackLineElements) {
      if (!curBarElementUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedTrackLineElements.delete(uuid);
      }
    }

    const activeRenderers: ElementRenderer[] = [];

    // Add & render new bar element
    for (const trackLineElement of trackLineElements) {
      const renderedTLE = this._renderedTrackLineElements.get(
        trackLineElement.uuid
      );
      if (renderedTLE === undefined) {
        const renderer = new SVGTrackLineRenderer(
          trackController,
          trackLineElement,
          this._assetsPath,
          this._groupSVG
        );
        activeRenderers.push(...renderer.render());
        this._renderedTrackLineElements.set(trackLineElement.uuid, renderer);
      } else {
        activeRenderers.push(...renderedTLE.render());
      }
    }
    return activeRenderers;
  }

  /**
   * Shows note selection preview
   * @param noteElement Note element to preview
   */
  public showSelectionPreview(noteElement: NoteElement): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to show selection preview when SVG group undefined");
    }

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
      this._groupSVG.appendChild(this._selectionPreviewRect);
    }

    let x: string;
    let y: string;
    let width: string;
    let height: string;
    if (noteElement instanceof TabNoteElement) {
      x = `${noteElement.selectionRect.x}`;
      y = `${noteElement.selectionRect.y}`;
      width = `${noteElement.selectionRect.width}`;
      height = `${noteElement.selectionRect.height}`;
    } else {
      throw Error("Unsupported note style");
    }

    this._selectionPreviewRect.setAttribute("x", x);
    this._selectionPreviewRect.setAttribute("y", y);
    this._selectionPreviewRect.setAttribute("width", width);
    this._selectionPreviewRect.setAttribute("height", height);
    this._selectionPreviewRect.setAttribute("display", "block");
  }

  /**
   * Hide selectin preview (but keep in the DOM)
   */
  public hideSelectionPreview(): void {
    if (this._selectionPreviewRect) {
      this._selectionPreviewRect.setAttribute("display", "none");
    }
  }

  /**
   * Remove selection preview rectangle from the DOM
   */
  public unrenderSelectionPreview(): void {
    if (this._groupSVG === undefined) {
      throw Error(
        "Tried to unrender selection preview when SVG group undefined"
      );
    }

    if (this._selectionPreviewRect === undefined) {
      return;
    }
    this._groupSVG.removeChild(this._selectionPreviewRect);
    this._selectionPreviewRect = undefined;
  }

  /**
   * Renders track elements selection rects
   * @param trackController Track controller
   */
  private renderSelectionRects(trackController: TrackController): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render selection rects when SVG group undefined");
    }

    this.unrenderSelectionRects();

    const selectionRects = trackController.getSelectionRects();
    if (selectionRects.length === 0) {
      return;
    }

    if (this._selectionRects === undefined) {
      this._selectionRects = Array.from({ length: selectionRects.length }, () =>
        createSVGRect()
      );

      for (let i = 0; i < this._selectionRects.length; i++) {
        const id = `selection-rect-${i + 1}`;
        this._selectionRects[i].setAttribute("id", id);

        this._selectionRects[i].setAttribute("fill", "gray");
        this._selectionRects[i].setAttribute("stroke-width", "1");
        this._selectionRects[i].setAttribute("fill-opacity", "0.5");
        this._selectionRects[i].setAttribute("stroke-opacity", "0.5");
        this._selectionRects[i].setAttribute("pointer-events", "none");
        this._groupSVG.appendChild(this._selectionRects[i]);
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
      // this._selectionRects[i].setAttribute("display", "block");
    }
  }

  /**
   * Unrenders track elements selection rects
   */
  private unrenderSelectionRects(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender selection rects when SVG group undefined");
    }

    if (this._selectionRects === undefined) {
      return;
    }

    for (let i = 0; i < this._selectionRects.length; i++) {
      this._groupSVG.removeChild(this._selectionRects[i]);
    }

    this._selectionRects = undefined;
  }

  /**
   * Render player overlay
   */
  public renderPlayerOverlay(trackController: TrackController): void {
    /**
     * TODO: PLAYER CURSOR NEEDS TO BE RENDERED ON TOP OF
     * EVERYTHING ELSE. THAT MEANS THAT EVERY PAUSE UNRENDERS IT
     * AND EVERY START RENDERS IT
     */

    if (this._playerCursorRect === undefined) {
      this._playerCursorRect = createSVGRect();
      this._playerCursorRect.setAttribute("id", "playerCursor");
    }
    this._groupSVG.appendChild(this._playerCursorRect);

    if (this._playerAnimator === undefined) {
      this._playerAnimator = new TrackPlayerSVGAnimator(
        this._playerCursorRect,
        trackController
      );
      this._playerAnimator.bindToBeatChanged();
    }

    const currentBeatElement = trackController.playerCurrentBeatElement;

    let cursorRect: Rect;
    if (currentBeatElement === undefined) {
      cursorRect = new Rect(0, 0, 0, 0);
    } else {
      const beatElementCoords = currentBeatElement.globalCoords;

      const playerCursorWidth = 5;
      const playerCursorAddHeight = 10;

      cursorRect = new Rect(
        beatElementCoords.x + currentBeatElement.rect.width / 2,
        beatElementCoords.y - playerCursorAddHeight,
        playerCursorWidth,
        currentBeatElement.rect.height + playerCursorAddHeight
      );
    }

    this._playerCursorRect.setAttribute("x", `${cursorRect.x}`);
    this._playerCursorRect.setAttribute("y", `${cursorRect.y}`);
    this._playerCursorRect.setAttribute("width", `${cursorRect.width}`);
    this._playerCursorRect.setAttribute("height", `${cursorRect.height}`);
    this._playerCursorRect.setAttribute("stroke", "black");
    this._playerCursorRect.setAttribute("fill", "purple");
  }

  /**
   * Hide player overlay when not playing
   */
  public hidePlayerOverlay(trackController: TrackController): void {
    if (this._playerCursorRect === undefined) {
      this._playerCursorRect = createSVGRect();
      this._playerCursorRect.setAttribute("id", "playerCursor");
    }
    this._groupSVG.appendChild(this._playerCursorRect);

    this._playerCursorRect.setAttribute("width", "0");
    this._playerCursorRect.setAttribute("height", "0");
  }

  activeRenderers: ElementRenderer[] = [];
  /**
   * Render track window using SVG
   */
  public render(trackController: TrackController): ElementRenderer[] {
    console.log("RENDER TRIGGERED", trackController.track);

    // Render lines first
    if (trackController.trackElement.isDirty) {
      this.activeRenderers = [];
      this.activeRenderers.push(...this.renderTrackLines(trackController));
      trackController.trackElement.isDirty = false;
    }

    // Player overlay rect
    if (trackController.isPlaying) {
      this.renderPlayerOverlay(trackController);
    } else {
      this.hidePlayerOverlay(trackController);
    }
    // this.renderSelectionRects(trackController);

    // Update SVG root dimensions
    const trackWindowHeight = trackController.trackElement.height;
    const VB = `0 0 ${TabLayoutDimensions.WIDTH} ${trackWindowHeight}`;
    this._groupSVG.setAttribute("viewBox", VB);
    this._groupSVG.setAttribute("width", `${TabLayoutDimensions.WIDTH}`);
    this._groupSVG.setAttribute("height", `${trackWindowHeight}`);

    return this.activeRenderers;
  }

  /**
   * Unrender the entire track window
   */
  public unrender(): void {
    // console.log("UNRENDER TRIGGERED");

    for (const renderer of this._renderedTrackLineElements.values()) {
      renderer.unrender();
    }
    this._renderedTrackLineElements.clear();
    if (this._playerCursorRect) {
      this._playerCursorRect.remove();
    }
    // this.unrenderSelectionRects();

    this._groupSVG.replaceChildren();
  }

  /** Track line renderers getter */
  public get lineRenderers(): SVGTrackLineRenderer[] {
    return this._renderedTrackLineElements.values().toArray();
  }
}
