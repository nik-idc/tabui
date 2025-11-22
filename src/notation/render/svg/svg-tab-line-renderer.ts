import { TabController, TabLineElement } from "@/notation/controller";
import { Point } from "@/shared";
import { SVGBarRenderer } from "./svg-bar-renderer";
import { SVGBeatRenderer } from "./svg-beat-renderer";
import { SVGNoteRenderer } from "./svg-note-renderer";
import { ElementRenderer } from "../element-renderer";

/**
 * Class for rendering a bar element using SVG
 */
export class SVGTabLineRenderer implements ElementRenderer {
  private _tabWindow: TabController;
  private _tabLineElement: TabLineElement;
  private _assetsPath: string;
  private _svgRoot: SVGSVGElement;

  private _renderedBarElements: Map<number, SVGBarRenderer>;

  /**
   * Class for rendering a beat element using SVG
   * @param tabController Tab window
   * @param tabLineElement Tab line element
   * @param assetsPath Path to assets
   * @param svgRoot SVG root element
   */
  constructor(
    tabController: TabController,
    tabLineElement: TabLineElement,
    assetsPath: string,
    svgRoot: SVGSVGElement
  ) {
    this._tabWindow = tabController;
    this._tabLineElement = tabLineElement;
    this._assetsPath = assetsPath;
    this._svgRoot = svgRoot;

    this._renderedBarElements = new Map();
  }

  /**
   * Render tab line element
   */
  public render(): (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[] {
    const tleOffset = new Point(0, this._tabLineElement.rect.y);

    // Check if there are any bar element to remove
    const curBarElementUUIDs = new Set(
      this._tabLineElement.barElements.map((b) => b.bar.uuid)
    );
    for (const [uuid, renderer] of this._renderedBarElements) {
      if (!curBarElementUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedBarElements.delete(uuid);
      }
    }

    const activeRenderers: (
      | SVGBarRenderer
      | SVGBeatRenderer
      | SVGNoteRenderer
    )[] = [];

    // Add & render new bar element AND re-render existing bar element
    for (const barElement of this._tabLineElement.barElements) {
      const renderedBar = this._renderedBarElements.get(barElement.bar.uuid);
      if (renderedBar === undefined) {
        const renderer = new SVGBarRenderer(
          this._tabWindow,
          barElement,
          tleOffset,
          this._assetsPath,
          this._svgRoot
        );
        activeRenderers.push(renderer);
        activeRenderers.push(...renderer.render());
        this._renderedBarElements.set(barElement.bar.uuid, renderer);
      } else {
        activeRenderers.push(renderedBar);
        activeRenderers.push(...renderedBar.render(tleOffset));
      }
    }

    return activeRenderers;
  }

  /**
   * Unrender all tab line element's DOM element
   */
  public unrender(): void {
    for (const [uuid, renderer] of this._renderedBarElements) {
      renderer.unrender();
      this._renderedBarElements.delete(uuid);
    }
  }

  public get barRenderers(): SVGBarRenderer[] {
    return this._renderedBarElements.values().toArray();
  }
}
