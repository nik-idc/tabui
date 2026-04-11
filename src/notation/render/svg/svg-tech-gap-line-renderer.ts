import { TrackController } from "@/notation/controller";
import { TechGapLineElement } from "@/notation/controller/element/staff/tech-gap-line-element";
import { createSVGG } from "@/shared";
import { ElementRenderer } from "../element-renderer";
import { SVGTechniqueLabelRenderer } from "./svg-technique-label-renderer";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";

/**
 * Class for rendering a tech gap line element using SVG
 */
export class SVGTechGapLineRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Tech gap line element */
  techGapLineElement: TechGapLineElement;
  /** Path to any assets */
  readonly assetsPath: ResolvedAssetConfig;

  /** Container SVG group */
  private _containerGroupSVG?: SVGGElement;

  /**
   * Class for rendering a tech gap line element using SVG
   * @param trackController Track controller
   * @param techGapLineElement Tech gap line element
   * @param assetsPath Path to assets
   */
  constructor(
    trackController: TrackController,
    techGapLineElement: TechGapLineElement,
    assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this.techGapLineElement = techGapLineElement;

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

    const techGapLineUUID = this.techGapLineElement.uuid;
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute(
      "id",
      `tech-gap-line-${techGapLineUUID}`
    );

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
   * data about the technique gap
   */
  private renderGroup(): void {
    this.ensureContainerGroup();
  }

  /**
   * Renders the technique gap line element
   */
  public render(): void {
    this.renderGroup();

    if (this._containerGroupSVG === undefined) {
      throw Error("Bar group SVG undefined after render group call");
    }
  }

  /**
   * Unenders the technique gap line element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }
  }
}
