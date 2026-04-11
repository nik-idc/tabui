import { TechniqueLabelElement, TrackController } from "@/notation/controller";
import { Point, createSVGG } from "@/shared";
import { ElementRenderer } from "../element-renderer";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";

/**
 * Class for rendering a technique label using SVG
 */
export class SVGTechniqueLabelRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Technique label element */
  techniqueLabelElement: TechniqueLabelElement;
  /** Path to any assets */
  readonly assetsPath: ResolvedAssetConfig;

  // /** Parent SVG group element */
  // private _parentElement: SVGGElement;

  /** Container SVG group */
  private _containerGroupSVG?: SVGGElement;
  /** Technique label SVG group */
  private _techniqueLabelSVG?: SVGGElement;

  /**
   * Class for rendering a technique label using SVG
   * @param trackController Track controller
   * @param techniqueLabelElement Technique label element
   * @param assetsPath Path to assets
   */
  constructor(
    trackController: TrackController,
    techniqueLabelElement: TechniqueLabelElement,
    assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this.techniqueLabelElement = techniqueLabelElement;

    this.assetsPath = assetsPath;
    // this._parentElement = parentElement;
  }

  /**
   * Ensures renderer's container group exists and returns it.
   * @returns Renderer's container SVG group element
   */
  public ensureContainerGroup(): SVGGElement {
    if (this._containerGroupSVG !== undefined) {
      return this._containerGroupSVG;
    }

    const techLabelUUID = this.techniqueLabelElement.uuid;
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute(
      "id",
      `technique-label-${techLabelUUID}`
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
   * data about the technique label
   */
  private renderGroup(): void {
    this.ensureContainerGroup();
  }

  /**
   * Render an technique label
   * @param beatOffset Global offset of the beat
   * @param this.techniqueLabelElement Technique label element to render
   */
  public render(): void {
    this.renderGroup();

    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render technique label when SVG group undefined");
    }

    if (this.techniqueLabelElement.svgPath === undefined) {
      throw Error("Technique label render error: technique HTML undefined");
    }

    const techniqueUUID = this.techniqueLabelElement.technique.uuid;
    if (this._techniqueLabelSVG === undefined) {
      this._techniqueLabelSVG = createSVGG();

      // Set id
      this._techniqueLabelSVG.setAttribute(
        "id",
        `technique-label-group-${techniqueUUID}`
      );

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(this._techniqueLabelSVG);
    }

    const x = this.techniqueLabelElement.globalCoords.x;
    const y = this.techniqueLabelElement.globalCoords.y;
    const transform = `translate(${x}, ${y})`;
    this._techniqueLabelSVG.setAttribute("transform", transform);
    this._techniqueLabelSVG.innerHTML = `${this.techniqueLabelElement.svgPath}`;
  }

  /**
   * Unrender all technique label element's DOM element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    if (this._techniqueLabelSVG === undefined) {
      return;
    }

    this._containerGroupSVG.removeChild(this._techniqueLabelSVG);
    this._techniqueLabelSVG = undefined;
  }
}
