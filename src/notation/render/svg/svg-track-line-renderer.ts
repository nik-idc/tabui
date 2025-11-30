import { ElementRenderer } from "../element-renderer";
import { TrackLineElement } from "@/notation/controller/element/track-line-element";
import { SVGStaffLineRenderer } from "./svg-staff-line-renderer";
import { TrackController } from "@/notation/controller";

/**
 * Class for rendering a track element using SVG
 */
export class SVGTrackLineRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Track line element */
  readonly trackLineElement: TrackLineElement;

  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _groupSVG: SVGSVGElement;

  /** Rendered staff line elements map */
  private _renderedStaffLines: Map<number, SVGStaffLineRenderer>;

  /**
   * Class for rendering a track element using SVG
   * @param trackController Track controller
   * @param trackLineElement Track line element
   * @param assetsPath Path to assets
   * @param svgRoot SVG root element
   */
  constructor(
    trackController: TrackController,
    trackLineElement: TrackLineElement,
    assetsPath: string,
    svgRoot: SVGSVGElement
  ) {
    this.trackController = trackController;
    this.trackLineElement = trackLineElement;

    this._assetsPath = assetsPath;
    this._groupSVG = svgRoot;

    this._renderedStaffLines = new Map();
  }

  /**
   * Render track line element
   */
  public render(): ElementRenderer[] {
    // Check if there are any staff element to remove
    const curStaffLineElementUUIDs = new Set(
      this.trackLineElement.staffLineElements.map((s) => s.staff.uuid)
    );
    for (const [uuid, renderer] of this._renderedStaffLines) {
      if (!curStaffLineElementUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedStaffLines.delete(uuid);
      }
    }

    const activeRenderers: ElementRenderer[] = [];

    // Add & render new staff element AND re-render existing staff element
    for (const staffLineElement of this.trackLineElement.staffLineElements) {
      const renderedStaff = this._renderedStaffLines.get(
        staffLineElement.staff.uuid
      );
      if (renderedStaff === undefined) {
        const renderer = new SVGStaffLineRenderer(
          this.trackController,
          staffLineElement,
          this._assetsPath,
          this._groupSVG
        );
        activeRenderers.push(renderer);
        activeRenderers.push(...renderer.render());
        this._renderedStaffLines.set(staffLineElement.staff.uuid, renderer);
      } else {
        activeRenderers.push(renderedStaff);
        activeRenderers.push(...renderedStaff.render());
      }
    }

    return activeRenderers;
  }

  /**
   * Unrender all track line element's DOM element
   */
  public unrender(): void {
    for (const [uuid, renderer] of this._renderedStaffLines) {
      renderer.unrender();
      this._renderedStaffLines.delete(uuid);
    }
  }

  public get staffRenderers(): SVGStaffLineRenderer[] {
    return this._renderedStaffLines.values().toArray();
  }
}
