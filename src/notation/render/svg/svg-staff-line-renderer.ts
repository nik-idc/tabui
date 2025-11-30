import { StaffLineElement, TrackController } from "@/notation/controller";
import { Point } from "@/shared";
import { SVGBarRenderer } from "./svg-bar-renderer";
import { SVGBeatRenderer } from "./svg-beat-renderer";
import { ElementRenderer } from "../element-renderer";
import { SVGNoteRenderer } from "./svg-note-renderer";

/**
 * Class for rendering a staff line element using SVG
 */
export class SVGStaffLineRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Staff line element */
  readonly staffLineElement: StaffLineElement;

  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _groupSVG: SVGSVGElement;

  /** Rendered bar elements map */
  private _renderedBarElements: Map<number, SVGBarRenderer>;

  /**
   * Class for rendering a staff line element using SVG
   * @param trackController Track controller
   * @param staffLineElement Staff line element
   * @param assetsPath Path to assets
   * @param svgRoot SVG root element
   */
  constructor(
    trackController: TrackController,
    staffLineElement: StaffLineElement,
    assetsPath: string,
    svgRoot: SVGSVGElement
  ) {
    this.trackController = trackController;
    this.staffLineElement = staffLineElement;

    this._assetsPath = assetsPath;
    this._groupSVG = svgRoot;

    this._renderedBarElements = new Map();
  }

  /**
   * Render staff line element
   */
  public render(): ElementRenderer[] {
    // Check if there are any bar element to remove
    const curBarElementUUIDs = new Set(
      this.staffLineElement.barElements.map((b) => b.bar.uuid)
    );
    for (const [uuid, renderer] of this._renderedBarElements) {
      if (!curBarElementUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedBarElements.delete(uuid);
      }
    }

    const activeRenderers: ElementRenderer[] = [];

    // Add & render new bar element AND re-render existing bar element
    for (const barElement of this.staffLineElement.barElements) {
      const renderedBar = this._renderedBarElements.get(barElement.bar.uuid);
      if (renderedBar === undefined) {
        const renderer = new SVGBarRenderer(
          this.trackController,
          barElement,
          this._assetsPath,
          this._groupSVG
        );
        activeRenderers.push(renderer);
        activeRenderers.push(...renderer.render());
        this._renderedBarElements.set(barElement.bar.uuid, renderer);
      } else {
        activeRenderers.push(renderedBar);
        activeRenderers.push(...renderedBar.render());
      }
    }

    return activeRenderers;
  }

  /**
   * Unrender all staff line element's DOM element
   */
  public unrender(): void {
    for (const [uuid, renderer] of this._renderedBarElements) {
      renderer.unrender();
      this._renderedBarElements.delete(uuid);
    }
  }

  /** Bar renderers getter */
  public get barRenderers(): SVGBarRenderer[] {
    return this._renderedBarElements.values().toArray();
  }
}
