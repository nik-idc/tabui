import { ElementRenderer } from "../element-renderer";
import { TrackLineElement } from "@/notation/controller/element/track/track-line-element";
import { TrackController } from "@/notation/controller";
import { createSVGG, createSVGLine } from "@/shared";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";

type OutlineLinesRendered = {
  left: SVGLineElement;
  right: SVGLineElement;
};

/**
 * Class for rendering a track element using SVG
 */
export class SVGTrackLineRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Track line element */
  trackLineElement: TrackLineElement;
  /** Path to any assets */
  readonly assetsPath: ResolvedAssetConfig;

  /** Rendered outlines lines */
  private _renderedOutlineLines?: OutlineLinesRendered;

  /** Container SVG group */
  private _containerGroupSVG?: SVGGElement;

  /**
   * Class for rendering a track element using SVG
   * @param trackController Track controller
   * @param trackLineElement Track line element
   * @param assetsPath Path to assets
   */
  constructor(
    trackController: TrackController,
    trackLineElement: TrackLineElement,
    assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this.trackLineElement = trackLineElement;

    this.assetsPath = assetsPath;
  }

  /**
   * Ensures renderer's container group exists and returns it.
   * @returns Renderer's container SVG group element
   */
  public ensureContainerGroup(): SVGGElement {
    if (this._containerGroupSVG !== undefined) {
      return this._containerGroupSVG;
    }

    const trackLineUUID = this.trackLineElement.uuid;
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute("id", `track-line-${trackLineUUID}`);

    return this._containerGroupSVG;
  }

  public detachContainerGroup(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    this._containerGroupSVG.parentNode?.removeChild(this._containerGroupSVG);
  }

  /**
   * Renders the group element which will contain all the
   * data about the track line element
   */
  private renderGroup(): void {
    this.ensureContainerGroup();
  }

  /**
   * Renders the left & right outline lines
   */
  private renderOutlines(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render staff lines when SVG group undefined");
    }

    const lines = this.trackLineElement.outlineLinesGlobal;
    if (lines === undefined) {
      this.unrenderOutlines();
      return;
    }

    const lineUUID = this.trackLineElement.uuid;
    if (this._renderedOutlineLines === undefined) {
      this._renderedOutlineLines = {
        left: createSVGLine(),
        right: createSVGLine(),
      };

      // Set only-set-once attributes
      this._renderedOutlineLines.left.setAttribute(
        "stroke",
        "var(--tu-notation-ink)"
      );
      this._renderedOutlineLines.right.setAttribute(
        "stroke",
        "var(--tu-notation-ink)"
      );

      // Set id
      const idLeft = `track-outline-left-${lineUUID}`;
      const idRight = `track-outline-right-${lineUUID}`;
      this._renderedOutlineLines.left.setAttribute("id", idLeft);
      this._renderedOutlineLines.right.setAttribute("id", idRight);

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(this._renderedOutlineLines.left);
      this._containerGroupSVG.appendChild(this._renderedOutlineLines.right);
    }

    this._renderedOutlineLines.left.setAttribute("x1", `${lines.left.x}`);
    this._renderedOutlineLines.left.setAttribute("x2", `${lines.left.x}`);
    this._renderedOutlineLines.left.setAttribute("y1", `${lines.left.y1}`);
    this._renderedOutlineLines.left.setAttribute("y2", `${lines.left.y2}`);

    this._renderedOutlineLines.right.setAttribute("x1", `${lines.right.x}`);
    this._renderedOutlineLines.right.setAttribute("x2", `${lines.right.x}`);
    this._renderedOutlineLines.right.setAttribute("y1", `${lines.right.y1}`);
    this._renderedOutlineLines.right.setAttribute("y2", `${lines.right.y2}`);
  }

  /**
   * Unrenders the left & right outline lines
   */
  private unrenderOutlines(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render staff lines when SVG group undefined");
    }

    if (this._renderedOutlineLines === undefined) {
      return;
    }

    this._containerGroupSVG.removeChild(this._renderedOutlineLines.left);
    this._containerGroupSVG.removeChild(this._renderedOutlineLines.right);

    this._renderedOutlineLines = undefined;
  }

  /**
   * Render track line element
   */
  public render(): void {
    this.renderGroup();
    this.renderOutlines();
  }

  /**
   * Unrender all track line element's DOM element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }
    this.unrenderOutlines();
  }
}
