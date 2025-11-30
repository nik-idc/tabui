import {
  GuitarTechniqueElement,
  TechniqueElement,
  TrackController,
} from "@/notation/controller";
import { Point, createSVGG, createSVGRect } from "@/shared";
import { ElementRenderer } from "../element-renderer";

/**
 * Class for rendering a guitar technique element using SVG
 */
export class SVGTechniqueRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Technique element to render */
  readonly techniqueElement: TechniqueElement;

  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _parentElement: SVGGElement;

  /** Container SVG group  */
  private _groupSVG?: SVGGElement;
  /** Technique rect SVG */
  private _techniqueRectSVG?: SVGRectElement;
  /** Technique SVG path */
  private _techniqueSVGPath?: SVGGElement;

  /**
   * Class for rendering a guitar technique element using SVG
   * @param trackController Track controller
   * @param techniqueElement Guitar technique element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a note element in this case)
   */
  constructor(
    trackController: TrackController,
    techniqueElement: GuitarTechniqueElement,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this.trackController = trackController;
    this.techniqueElement = techniqueElement;

    this._assetsPath = assetsPath;
    this._parentElement = parentElement;
  }

  /**
   * Renders the group element which will contain all the
   * data about the technique
   */
  private renderGroup(): void {
    if (this._groupSVG !== undefined) {
      return;
    }

    const noteUUID = this.techniqueElement.technique.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `technique-${noteUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Render technique's outer rect
   */
  private renderTechniqueRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render technique rect when SVG group undefined");
    }

    if (this.techniqueElement.rect === undefined) {
      throw Error("Tried to render technique rect with undefined rect");
    }

    const techniqueUUID = this.techniqueElement.technique.uuid;
    if (this._techniqueRectSVG === undefined) {
      this._techniqueRectSVG = createSVGRect();
      // Set only-set-once attributes
      this._techniqueRectSVG.setAttribute("fill", "white");
      this._techniqueRectSVG.setAttribute("stroke-opacity", "0");

      // Set id
      this._techniqueRectSVG.setAttribute(
        "id",
        `technique-rect-${techniqueUUID}`
      );

      // Add element to root SVG element
      this._groupSVG.appendChild(this._techniqueRectSVG);
    }

    const x = `${this.techniqueElement.globalCoords.x}`;
    const y = `${this.techniqueElement.globalCoords.y}`;
    const width = `${this.techniqueElement.rect.width}`;
    const height = `${this.techniqueElement.rect.height}`;
    this._techniqueRectSVG.setAttribute("x", x);
    this._techniqueRectSVG.setAttribute("y", y);
    this._techniqueRectSVG.setAttribute("width", width);
    this._techniqueRectSVG.setAttribute("height", height);
  }

  /**
   * Unrenders technique rect
   */
  private unrenderTechniqueRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender technique rect when SVG group undefined");
    }

    if (this._techniqueRectSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._techniqueRectSVG);
    this._techniqueRectSVG = undefined;
  }

  /**
   * Render technique's raw SVG
   */
  private renderTechniqueHTML(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render technique HTML when SVG group undefined");
    }

    if (this.techniqueElement.svgPath === undefined) {
      throw Error("Tried to render technique HTML with undefined HTML");
    }

    const techniqueUUID = this.techniqueElement.technique.uuid;
    if (this._techniqueSVGPath === undefined) {
      this._techniqueSVGPath = createSVGG();

      // Set id
      this._techniqueSVGPath.setAttribute(
        "id",
        `technique-html-${techniqueUUID}`
      );

      // Add element to root SVG element
      this._groupSVG.appendChild(this._techniqueSVGPath);
    }

    // const x = `${this.techniqueElement.globalCoords.x}`;
    // const y = `${this.techniqueElement.globalCoords.y}`;
    const x = `${this.techniqueElement.guitarNoteElement.globalCoords.x}`;
    const y = `${this.techniqueElement.guitarNoteElement.globalCoords.y}`;
    const transform = `translate(${x}, ${y})`;
    this._techniqueSVGPath.setAttribute("transform", transform);
    this._techniqueSVGPath.innerHTML = this.techniqueElement.svgPath; // May lead to performance issues
  }

  /**
   * Unrender technique's custom HTML (like bend curves, palm mute text etc)
   */
  private unrenderTechniqueHTML(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender technique HTML when SVG group undefined");
    }

    if (this._techniqueSVGPath === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._techniqueSVGPath);
    this._techniqueSVGPath = undefined;
  }

  /**
   * Render a note's technique
   */
  public render(): void {
    this.renderGroup();

    // The reason for 2 ifs: bends DO NOT have a rect, but DO have full HTML

    // Render technique rect if necessary, remove it otherwise
    if (this.techniqueElement.rect !== undefined) {
      this.renderTechniqueRect();
    } else {
      this.unrenderTechniqueRect();
    }

    // Render technique custom HTML if necessary, remove it otherwise
    if (this.techniqueElement.svgPath !== undefined) {
      this.renderTechniqueHTML();
    } else {
      this.unrenderTechniqueHTML();
    }
  }

  /**
   * Unrender all technique element's DOM element
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender technique when SVG group undefined");
    }

    this.unrenderTechniqueRect();
    this.unrenderTechniqueHTML();

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }
}
