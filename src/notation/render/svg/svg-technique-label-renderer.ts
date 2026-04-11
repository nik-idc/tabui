import { TechniqueLabelElement, TrackController } from "@/notation/controller";
import { createSVGG, createSVGPath, createSVGText } from "@/shared";
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
  /** Technique label path nodes */
  private _labelPathsSVG?: SVGPathElement[];
  /** Technique label text nodes */
  private _labelTextsSVG?: SVGTextElement[];

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

    if (this._labelPathsSVG === undefined) {
      this._labelPathsSVG = [];
    }
    if (this._labelTextsSVG === undefined) {
      this._labelTextsSVG = [];
    }

    const pathDescriptors = this.techniqueLabelElement.pathDescriptors ?? [];
    const textDescriptors = this.techniqueLabelElement.textDescriptors ?? [];

    while (this._labelPathsSVG.length < pathDescriptors.length) {
      const pathIndex = this._labelPathsSVG.length;
      const pathElement = createSVGPath();
      pathElement.setAttribute(
        "id",
        `technique-label-path-${techniqueUUID}-${pathIndex}`
      );
      this._techniqueLabelSVG.appendChild(pathElement);
      this._labelPathsSVG.push(pathElement);
    }

    while (this._labelPathsSVG.length > pathDescriptors.length) {
      const pathElement = this._labelPathsSVG.pop();
      if (pathElement !== undefined) {
        this._techniqueLabelSVG.removeChild(pathElement);
      }
    }

    while (this._labelTextsSVG.length < textDescriptors.length) {
      const textIndex = this._labelTextsSVG.length;
      const textElement = createSVGText();
      textElement.setAttribute(
        "id",
        `technique-label-text-${techniqueUUID}-${textIndex}`
      );
      this._techniqueLabelSVG.appendChild(textElement);
      this._labelTextsSVG.push(textElement);
    }

    while (this._labelTextsSVG.length > textDescriptors.length) {
      const textElement = this._labelTextsSVG.pop();
      if (textElement !== undefined) {
        this._techniqueLabelSVG.removeChild(textElement);
      }
    }

    const x = this.techniqueLabelElement.descriptorOrigin.x;
    const y = this.techniqueLabelElement.descriptorOrigin.y;
    const transform = `translate(${x}, ${y})`;
    this._techniqueLabelSVG.setAttribute("transform", transform);

    for (let i = 0; i < pathDescriptors.length; i++) {
      const pathElement = this._labelPathsSVG[i];
      const descriptor = pathDescriptors[i];
      pathElement.setAttribute("d", descriptor.d);
      if (descriptor.attrs !== undefined) {
        for (const [key, value] of Object.entries(descriptor.attrs)) {
          pathElement.setAttribute(key, value);
        }
      }
    }

    for (let i = 0; i < textDescriptors.length; i++) {
      const textElement = this._labelTextsSVG[i];
      const descriptor = textDescriptors[i];
      textElement.textContent = descriptor.text;
      if (descriptor.attrs !== undefined) {
        for (const [key, value] of Object.entries(descriptor.attrs)) {
          textElement.setAttribute(key, value);
        }
      }
    }
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

    if (this._labelPathsSVG !== undefined) {
      for (const pathElement of this._labelPathsSVG) {
        this._techniqueLabelSVG.removeChild(pathElement);
      }
      this._labelPathsSVG = undefined;
    }

    if (this._labelTextsSVG !== undefined) {
      for (const textElement of this._labelTextsSVG) {
        this._techniqueLabelSVG.removeChild(textElement);
      }
      this._labelTextsSVG = undefined;
    }

    this._containerGroupSVG.removeChild(this._techniqueLabelSVG);
    this._techniqueLabelSVG = undefined;
  }
}
