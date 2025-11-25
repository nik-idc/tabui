import { TechniqueLabelElement } from "@/notation/controller";
import { Point, createSVGG } from "@/shared";
import { ElementRenderer } from "../element-renderer";

/**
 * Class for rendering an technique label using SVG
 */
export class SVGTechniqueLabelRenderer implements ElementRenderer {
  /** Technique label element */
  private _techniqueLabelElement: TechniqueLabelElement;
  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _parentElement: SVGGElement;

  /** Container SVG group */
  private _groupSVG?: SVGGElement;
  /** Technique label SVG group */
  private _techniqueLabelSVG?: SVGGElement;

  /**
   * Class for rendering an technique label using SVG
   * @param techniqueLabelElement Technique label element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a beat element in this case)
   */
  constructor(
    techniqueLabelElement: TechniqueLabelElement,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this._techniqueLabelElement = techniqueLabelElement;
    this._assetsPath = assetsPath;
    this._parentElement = parentElement;
  }

  /**
   * Renders the group element which will contain all the
   * data about the technique label
   */
  private renderGroup(): void {
    if (this._groupSVG !== undefined) {
      return;
    }

    const noteUUID = this._techniqueLabelElement.technique.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `technique-label-${noteUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Render an technique label
   * @param beatOffset Global offset of the beat
   * @param this._techniqueLabelElement Technique label element to render
   */
  public render(): void {
    this.renderGroup();

    if (this._groupSVG === undefined) {
      throw Error("Tried to render technique label when SVG group undefined");
    }

    if (this._techniqueLabelElement.svgPath === undefined) {
      throw Error("Technique label render error: technique HTML undefined");
    }

    const techniqueUUID = this._techniqueLabelElement.technique.uuid;
    if (this._techniqueLabelSVG === undefined) {
      this._techniqueLabelSVG = createSVGG();

      // Set id
      this._techniqueLabelSVG.setAttribute(
        "id",
        `technique-label-${techniqueUUID}`
      );

      // Add element to root SVG element
      this._groupSVG.appendChild(this._techniqueLabelSVG);
    }

    const x = this._techniqueLabelElement.globalCoords.x;
    const y = this._techniqueLabelElement.globalCoords.y;
    const transform = `translate(${x}, ${y})`;
    this._techniqueLabelSVG.setAttribute("transform", transform);
    this._techniqueLabelSVG.innerHTML = `${this._techniqueLabelElement.svgPath}`;
  }

  /**
   * Unrender all technique label element's DOM element
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender technique label when SVG group undefined");
    }

    if (this._techniqueLabelSVG === undefined) {
      throw Error("Tried to unrender technique label when label SVG undefined");
    }

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }
}
