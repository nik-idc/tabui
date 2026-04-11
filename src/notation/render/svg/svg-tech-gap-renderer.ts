import { TrackController } from "@/notation/controller";
import { TechGapElement } from "@/notation/controller/element/staff/tech-gap-element";
import { createSVGG } from "@/shared";
import { ElementRenderer } from "../element-renderer";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";

/**
 * Class for rendering a bar element using SVG
 */
export class SVGTechGapRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Bar element */
  techGapElement: TechGapElement;
  /** Path to any assets */
  readonly assetsPath: ResolvedAssetConfig;

  /** Container SVG group */
  private _containerGroupSVG?: SVGGElement;

  /**
   * Class for rendering a beat element using SVG
   * @param trackController Track controller
   * @param barElement Bar element
   * @param assetsPath Path to assets
   */
  constructor(
    trackController: TrackController,
    techGapElement: TechGapElement,
    assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this.techGapElement = techGapElement;

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

    const techGapUUID = this.techGapElement.uuid;
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute("id", `tech-gap-${techGapUUID}`);

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
   * Renders the technique gap element
   */
  public render(): void {
    this.renderGroup();

    if (this._containerGroupSVG === undefined) {
      throw Error("Bar group SVG undefined after render group call");
    }
  }

  /**
   * Unenders the technique gap element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }
  }
}
