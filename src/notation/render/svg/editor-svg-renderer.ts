import { TabController, NoteElement } from "@/notation/element";
import { createSVG, createSVGRect, Rect } from "@/shared";
import { EditorRenderer } from "../editor-renderer";
import { SVGBarRenderer } from "./svg-bar-renderer";
import { SVGBeatRenderer } from "./svg-beat-renderer";
import { SVGNoteRenderer } from "./svg-note-renderer";
import { SVGTabLineRenderer } from "./svg-tab-line-renderer";
import { TabPlayerSVGAnimator } from "./player-svg-animator";

/**
 * Render a tab window using SVG
 */
export class EditorSVGRenderer implements EditorRenderer {
  // readonly tabController: TabController;
  readonly rootDiv: HTMLDivElement;
  private _assetsPath: string;
  private _svgRoot: SVGSVGElement;
  private _playerCursor?: SVGRectElement;
  private _selectionPreviewRect?: SVGRectElement;

  private _renderedTabLineElements: Map<number, SVGTabLineRenderer>;

  private _playerAnimator?: TabPlayerSVGAnimator;

  /**
   * Render a tab window using SVG
   * @param tabController Tab window
   * @param assetsPath Path to assets
   * @param svgRoot SVG root element
   */
  constructor(
    // tabController: TabController,
    rootDiv: HTMLDivElement,
    assetsPath: string
    // svgRoot: SVGSVGElement
  ) {
    // this.tabController = tabController;

    this.rootDiv = rootDiv;
    this._svgRoot = createSVG();
    this._svgRoot.classList.add("tu-root-svg");
    this.rootDiv.appendChild(this._svgRoot);

    this._assetsPath = assetsPath;

    this._renderedTabLineElements = new Map();
  }

  /**
   * Render all tab lines
   */
  public renderTabLines(
    tabController: TabController
  ): (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[] {
    const tabLineElements = tabController.getTabLineElements();

    // Check if there are any bar elements to remove
    const curBarElementUUIDs = new Set(tabLineElements.map((t) => t.uuid));
    for (const [uuid, renderer] of this._renderedTabLineElements) {
      if (!curBarElementUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedTabLineElements.delete(uuid);
      }
    }

    const activeRenderers: (
      | SVGBarRenderer
      | SVGBeatRenderer
      | SVGNoteRenderer
    )[] = [];

    // Add & render new bar elements
    for (const tabLineElement of tabLineElements) {
      const renderedTLE = this._renderedTabLineElements.get(
        tabLineElement.uuid
      );
      if (renderedTLE === undefined) {
        const renderer = new SVGTabLineRenderer(
          tabController,
          tabLineElement,
          this._assetsPath,
          this._svgRoot
        );
        activeRenderers.push(...renderer.render());
        this._renderedTabLineElements.set(tabLineElement.uuid, renderer);
      } else {
        activeRenderers.push(...renderedTLE.render());
      }
    }
    return activeRenderers;
  }

  public showSelectionPreview(
    tabController: TabController,
    noteElement: NoteElement
  ): void {
    const selectedNote = tabController.getSelectedNote();
    if (
      selectedNote &&
      selectedNote.note.uuid === noteElement.note.uuid
    ) {
      return;
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
      this._svgRoot.appendChild(this._selectionPreviewRect);
    }

    const noteTextCoords = tabController.getNoteTextGlobalCoords(noteElement);
    const padding = 2;
    const width = `${noteElement.textRect.width + padding * 2}`;
    const height = `${noteElement.textRect.height + padding * 2}`;
    this._selectionPreviewRect.setAttribute(
      "x",
      `${noteTextCoords.x - padding}`
    );
    this._selectionPreviewRect.setAttribute(
      "y",
      `${noteTextCoords.y - padding}`
    );
    this._selectionPreviewRect.setAttribute("width", width);
    this._selectionPreviewRect.setAttribute("height", height);
    this._selectionPreviewRect.setAttribute("display", "block");
  }

  public hideSelectionPreview(): void {
    if (this._selectionPreviewRect) {
      this._selectionPreviewRect.setAttribute("display", "none");
    }
  }

  public unrenderSelectionPreview(): void {
    if (this._selectionPreviewRect === undefined) {
      return;
    }
    this._svgRoot.removeChild(this._selectionPreviewRect);
    this._selectionPreviewRect = undefined;
  }

  /**
   * Render player overlay
   */
  public renderPlayerOverlay(tabController: TabController): void {
    /**
     * TODO: PLAYER CURSOR NEEDS TO BE RENDERED ON TOP OF
     * EVERYTHING ELSE. THAT MEANS THAT EVERY PAUSE UNRENDERS IT
     * AND EVERY START RENDERS IT
     */

    if (this._playerCursor === undefined) {
      this._playerCursor = createSVGRect();
      this._playerCursor.setAttribute("id", "playerCursor");
    }
    this._svgRoot.appendChild(this._playerCursor);

    if (this._playerAnimator === undefined) {
      this._playerAnimator = new TabPlayerSVGAnimator(
        this._playerCursor,
        tabController
      );
      this._playerAnimator.bindToBeatChanged();
    }

    const currentBeatElement = tabController.getPlayerCurrentBeatElement();

    let cursorRect: Rect;
    if (currentBeatElement === undefined) {
      cursorRect = new Rect(0, 0, 0, 0);
    } else {
      const beatElementCoords =
        tabController.getBeatElementGlobalCoords(currentBeatElement);

      const playerCursorWidth = 5;
      const playerCursorAddHeight = 10;

      cursorRect = new Rect(
        beatElementCoords.x + currentBeatElement.rect.width / 2,
        beatElementCoords.y - playerCursorAddHeight,
        playerCursorWidth,
        currentBeatElement.rect.height + playerCursorAddHeight
      );
    }

    this._playerCursor.setAttribute("x", `${cursorRect.x}`);
    this._playerCursor.setAttribute("y", `${cursorRect.y}`);
    this._playerCursor.setAttribute("width", `${cursorRect.width}`);
    this._playerCursor.setAttribute("height", `${cursorRect.height}`);
    this._playerCursor.setAttribute("stroke", "black");
    this._playerCursor.setAttribute("fill", "purple");
  }

  /**
   * Hide player overlay when not playing
   */
  public hidePlayerOverlay(tabController: TabController): void {
    if (this._playerCursor === undefined) {
      this._playerCursor = createSVGRect();
      this._playerCursor.setAttribute("id", "playerCursor");
    }
    this._svgRoot.appendChild(this._playerCursor);

    this._playerCursor.setAttribute("width", "0");
    this._playerCursor.setAttribute("height", "0");
  }

  /**
   * Render tab window using SVG
   */
  public render(
    tabController: TabController
  ): (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[] {
    // Render lines first
    const activeRenderers = this.renderTabLines(tabController);

    // Player overlay rect
    if (tabController.getIsPlaying()) {
      this.renderPlayerOverlay(tabController);
    } else {
      this.hidePlayerOverlay(tabController);
    }

    // Update SVG root dimensions
    const tabWindowHeight = tabController.getWindowHeight();
    const VB = `0 0 ${tabController.dim.width} ${tabWindowHeight}`;
    this._svgRoot.setAttribute("viewBox", VB);
    this._svgRoot.setAttribute("width", `${tabController.dim.width}`);
    this._svgRoot.setAttribute("height", `${tabWindowHeight}`);

    return activeRenderers;
  }

  /**
   * Unrender the entire tab window
   */
  public unrender(): void {
    for (const renderer of this._renderedTabLineElements.values()) {
      renderer.unrender();
    }
    this._renderedTabLineElements.clear();
    if (this._playerCursor) {
      this._playerCursor.remove();
    }
    // if (this._selectionPreviewRect) {
    //   this._selectionPreviewRect.remove();
    // }

    this.unrenderSelectionPreview();

    this._svgRoot.replaceChildren();
  }

  public get lineRenderers(): SVGTabLineRenderer[] {
    return this._renderedTabLineElements.values().toArray();
  }
}
