import { StaffLineElement, TrackController } from "@/notation/controller";
import { ElementRenderer } from "../element-renderer";
import { SVGStyleLineRenderer } from "./svg-style-line-renderer";
import { createSVGG } from "@/shared";

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
  private _parentElement: SVGGElement;

  /** Rendered style lines map: style line UUID -> style line renderer */
  private _renderedStyleLines: Map<number, SVGStyleLineRenderer>;

  /** Parent SVG group element */
  private _groupSVG?: SVGGElement;

  /**
   * Class for rendering a staff line element using SVG
   * @param trackController Track controller
   * @param staffLineElement Staff line element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element
   */
  constructor(
    trackController: TrackController,
    staffLineElement: StaffLineElement,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this.trackController = trackController;
    this.staffLineElement = staffLineElement;

    this._assetsPath = assetsPath;
    this._parentElement = parentElement;

    this._renderedStyleLines = new Map();
  }

  /**
   * Render staff line element
   */
  public render(): ElementRenderer[] {
    if (this._groupSVG === undefined) {
      const gapLineUUID = this.staffLineElement.uuid;
      this._groupSVG = createSVGG();
      this._groupSVG.setAttribute("id", `staff-line-${gapLineUUID}`);
      this._parentElement.appendChild(this._groupSVG);
    }

    const styleLinesArr = this.staffLineElement.styleLinesAsArray;

    // Check if there are any style lines to remove
    const curStyleLinesUUIDs = new Set(styleLinesArr.map((sl) => sl.uuid));
    for (const [uuid, renderer] of this._renderedStyleLines) {
      if (!curStyleLinesUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedStyleLines.delete(uuid);
      }
    }

    const activeRenderers: ElementRenderer[] = [];
    // Add & render new bar element AND re-render existing bar element
    for (const styleLine of styleLinesArr) {
      const renderedLine = this._renderedStyleLines.get(styleLine.uuid);
      if (renderedLine === undefined) {
        const renderer = new SVGStyleLineRenderer(
          this.trackController,
          styleLine,
          this._assetsPath,
          this._groupSVG
        );
        activeRenderers.push(renderer);
        activeRenderers.push(...renderer.render());
        this._renderedStyleLines.set(styleLine.uuid, renderer);
      } else {
        activeRenderers.push(renderedLine);
        activeRenderers.push(...renderedLine.render());
      }
    }

    return activeRenderers;
  }

  /**
   * Unrender all staff line element's DOM element
   */
  public unrender(): void {
    for (const [uuid, renderer] of this._renderedStyleLines) {
      renderer.unrender();
      this._renderedStyleLines.delete(uuid);
    }
  }

  /** Style lines renderers getter */
  public get styleLinesRenderers(): SVGStyleLineRenderer[] {
    return this._renderedStyleLines.values().toArray();
  }
}
