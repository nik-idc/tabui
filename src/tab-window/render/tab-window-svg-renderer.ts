import { TabWindow } from "../tab-window";
import { TabWindowRenderer } from "./tab-window-renderer";
import { SVGTabLineRenderer } from "./svg/svg-tab-line-renderer";
import { Rect } from "../shapes/rect";
import { createSVGRect } from "../../misc/svg-creators";
import { TabPlayerSVGAnimator } from "../player/tab-player-svg-animator";

/**
 * Render a tab window using SVG
 */
export class TabWindowSVGRenderer implements TabWindowRenderer {
  readonly tabWindow: TabWindow;
  private _assetsPath: string;
  private _svgRoot: SVGSVGElement;
  private _playerCursor?: SVGRectElement;

  private _renderedTabLineElements: Map<number, SVGTabLineRenderer>;

  private _playerAnimator?: TabPlayerSVGAnimator;

  /**
   * Render a tab window using SVG
   * @param tabWindow Tab window
   * @param assetsPath Path to assets
   * @param svgRoot SVG root element
   */
  constructor(
    tabWindow: TabWindow,
    assetsPath: string,
    svgRoot: SVGSVGElement
  ) {
    this.tabWindow = tabWindow;
    this._assetsPath = assetsPath;
    this._svgRoot = svgRoot;

    this._renderedTabLineElements = new Map();
  }

  /**
   * Render all tab lines
   */
  public renderTabLines(): void {
    const tabLineElements = this.tabWindow.getTabLineElements();

    // Check if there are any bar elements to remove
    const curBarElementUUIDs = new Set(tabLineElements.map((t) => t.uuid));
    for (const [uuid, renderer] of this._renderedTabLineElements) {
      if (!curBarElementUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedTabLineElements.delete(uuid);
      }
    }

    // Add & render new bar elements
    for (const tabLineElement of tabLineElements) {
      const renderedTLE = this._renderedTabLineElements.get(
        tabLineElement.uuid
      );
      if (renderedTLE === undefined) {
        const renderer = new SVGTabLineRenderer(
          this.tabWindow,
          tabLineElement,
          this._assetsPath,
          this._svgRoot
        );
        renderer.renderTabLine();
        this._renderedTabLineElements.set(tabLineElement.uuid, renderer);
      } else {
        renderedTLE.renderTabLine();
      }
    }
  }

  /**
   * Render player overlay
   */
  public renderPlayerOverlay(): void {
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
        this.tabWindow
      );
      this._playerAnimator.bindToBeatChanged();
    }

    const currentBeatElement = this.tabWindow.getPlayerCurrentBeatElement();

    let cursorRect: Rect;
    if (currentBeatElement === undefined) {
      cursorRect = new Rect(0, 0, 0, 0);
    } else {
      const beatElementCoords =
        this.tabWindow.getBeatElementGlobalCoords(currentBeatElement);

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
  public hidePlayerOverlay(): void {
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
  public render(): void {
    // Render lines first
    this.renderTabLines();

    // Player overlay rect
    this.renderPlayerOverlay();
    if (this.tabWindow.getIsPlaying()) {
      this.renderPlayerOverlay();
    } else {
      this.hidePlayerOverlay();
    }
  }

  public get lineRenderers(): SVGTabLineRenderer[] {
    return this._renderedTabLineElements.values().toArray();
  }
}
