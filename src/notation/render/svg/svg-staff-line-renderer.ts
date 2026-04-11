import { StaffLineElement, TrackController } from "@/notation/controller";
import { ElementRenderer } from "../element-renderer";
import { SVGStyleLineRenderer } from "./svg-style-line-renderer";
import { createSVGG } from "@/shared";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";

/**
 * Class for rendering a staff line element using SVG
 */
export class SVGStaffLineRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Staff line element */
  staffLineElement: StaffLineElement;
  /** Path to any assets */
  readonly assetsPath: ResolvedAssetConfig;

  // /** Parent SVG group element */
  // private _parentElement: SVGGElement;

  // /** Rendered style lines map: style line UUID -> style line renderer */
  // private _renderedStyleLines: Map<number, SVGStyleLineRenderer>;

  /** Parent SVG group element */
  private _containerGroupSVG?: SVGGElement;

  /**
   * Class for rendering a staff line element using SVG
   * @param trackController Track controller
   * @param staffLineElement Staff line element
   * @param assetsPath Path to assets
   */
  constructor(
    trackController: TrackController,
    staffLineElement: StaffLineElement,
    assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this.staffLineElement = staffLineElement;

    this.assetsPath = assetsPath;
    // this._parentElement = parentElement;
    //
    // this._renderedStyleLines = new Map();
  }

  /**
   * Ensures renderer's container group exists and returns it.
   * @returns Renderer's container SVG group element
   */
  public ensureContainerGroup(): SVGGElement {
    if (this._containerGroupSVG !== undefined) {
      return this._containerGroupSVG;
    }

    const staffLineUUID = this.staffLineElement.uuid;
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute("id", `staff-line-${staffLineUUID}`);

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
   * data about the style line element
   */
  private renderGroup(): void {
    this.ensureContainerGroup();
  }

  /**
   * Render staff line element
   */
  public render(): void {
    this.renderGroup();

    if (this._containerGroupSVG === undefined) {
      throw Error("Bar group SVG undefined after render group call");
    }

    // const styleLinesArr = this.staffLineElement.styleLinesAsArray;
    //
    // // Check if there are any style lines to remove
    // const curStyleLinesUUIDs = new Set(styleLinesArr.map((sl) => sl.uuid));
    // for (const [uuid, renderer] of this._renderedStyleLines) {
    //   if (!curStyleLinesUUIDs.has(uuid)) {
    //     renderer.unrender();
    //     this._renderedStyleLines.delete(uuid);
    //   }
    // }
    //
    // const activeRenderers: ElementRenderer[] = [];
    // // Add & render new bar element AND re-render existing bar element
    // for (const styleLine of styleLinesArr) {
    //   const renderedLine = this._renderedStyleLines.get(styleLine.uuid);
    //   if (renderedLine === undefined) {
    //     const renderer = new SVGStyleLineRenderer(
    //       this.trackController,
    //       styleLine,
    //       this.assetsPath,
    //       this._containerGroupSVG
    //     );
    //     activeRenderers.push(renderer);
    //     activeRenderers.push(...renderer.render());
    //     this._renderedStyleLines.set(styleLine.uuid, renderer);
    //   } else {
    //     activeRenderers.push(renderedLine);
    //     activeRenderers.push(...renderedLine.render());
    //   }
    // }
    //
    // return activeRenderers;
  }

  /**
   * Unrender all staff line element's DOM element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    // for (const [uuid, renderer] of this._renderedStyleLines) {
    //   renderer.unrender();
    //   this._renderedStyleLines.delete(uuid);
    // }
  }

  // /** Style lines renderers getter */
  // public get styleLinesRenderers(): SVGStyleLineRenderer[] {
  //   return this._renderedStyleLines.values().toArray();
  // }
}
