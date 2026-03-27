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
  techniqueElement: TechniqueElement;

  // /** Path to any assets */
  // private _assetsPath: string;
  // /** Parent SVG group element */
  // private _parentElement: SVGGElement;

  /** Container SVG group  */
  private _containerGroupSVG?: SVGGElement;

  /** Technique SVG path */
  private _techniqueSVGPath?: SVGGElement;

  /**
   * Class for rendering a guitar technique element using SVG
   * @param trackController Track controller
   * @param techniqueElement Guitar technique element
   * @param assetsPath Unused. Kept for uniform renderer constructor signature.
   */
  constructor(
    trackController: TrackController,
    techniqueElement: GuitarTechniqueElement,
    assetsPath: string
  ) {
    this.trackController = trackController;
    this.techniqueElement = techniqueElement;
    void assetsPath;
  }

  /**
   * Ensures renderer's container group exists and returns it.
   * @returns Renderer's container SVG group element
   */
  public ensureContainerGroup(): SVGGElement {
    if (this._containerGroupSVG !== undefined) {
      return this._containerGroupSVG;
    }

    const techniqueUUID = this.techniqueElement.technique.uuid;
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute("id", `technique-${techniqueUUID}`);

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
   * data about the technique
   */
  private renderGroup(): void {
    this.ensureContainerGroup();
  }

  /**
   * Render technique's raw SVG
   */
  private renderTechniquePath(): void {
    if (this._containerGroupSVG === undefined) {
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
        `technique-path-${techniqueUUID}`
      );

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(this._techniqueSVGPath);
    }

    const x = `${this.techniqueElement.svgPathGlobalCoords.x}`;
    const y = `${this.techniqueElement.svgPathGlobalCoords.y}`;
    const transform = `translate(${x}, ${y})`;
    this._techniqueSVGPath.setAttribute("transform", transform);
    this._techniqueSVGPath.innerHTML = this.techniqueElement.svgPath; // May lead to performance issues
  }

  /**
   * Unrender technique's custom HTML (like bend curves, palm mute text etc)
   */
  private unrenderTechniquePath(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender technique HTML when SVG group undefined");
    }

    if (this._techniqueSVGPath === undefined) {
      return;
    }

    this._containerGroupSVG.removeChild(this._techniqueSVGPath);
    this._techniqueSVGPath = undefined;
  }

  /**
   * Render a note's technique
   */
  public render(): void {
    this.renderGroup();

    // The reason for 2 ifs: bends DO NOT have a rect, but DO have full HTML

    // Render technique custom HTML if necessary, remove it otherwise
    if (this.techniqueElement.svgPath !== undefined) {
      this.renderTechniquePath();
    } else {
      this.unrenderTechniquePath();
    }
  }

  /**
   * Unrender all technique element's DOM element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    this.unrenderTechniquePath();
  }
}

// // =====================================
// // ==== MAYBE WILL BE USEFULL LATER ====
//
// /**
//  * Render technique's outer rect
//  */
// private renderTechniqueRect(): void {
//   if (this._containerGroupSVG === undefined) {
//     throw Error("Tried to render technique rect when SVG group undefined");
//   }

//   if (this.techniqueElement.rect === undefined) {
//     throw Error("Tried to render technique rect with undefined rect");
//   }

//   const techniqueUUID = this.techniqueElement.technique.uuid;
//   if (this._techniqueRectSVG === undefined) {
//     this._techniqueRectSVG = createSVGRect();
//     // Set only-set-once attributes
//     this._techniqueRectSVG.setAttribute("fill", "white");
//     this._techniqueRectSVG.setAttribute("stroke-opacity", "0");

//     // Set id
//     this._techniqueRectSVG.setAttribute(
//       "id",
//       `technique-rect-${techniqueUUID}`
//     );

//     // Add element to root SVG element
//     this._containerGroupSVG.appendChild(this._techniqueRectSVG);
//   }

//   const x = `${this.techniqueElement.globalCoords.x}`;
//   const y = `${this.techniqueElement.globalCoords.y}`;
//   const width = `${this.techniqueElement.rect.width}`;
//   const height = `${this.techniqueElement.rect.height}`;
//   this._techniqueRectSVG.setAttribute("x", x);
//   this._techniqueRectSVG.setAttribute("y", y);
//   this._techniqueRectSVG.setAttribute("width", width);
//   this._techniqueRectSVG.setAttribute("height", height);
// }
//
// /**
//  * Unrenders technique rect
//  */
// private unrenderTechniqueRect(): void {
//   if (this._containerGroupSVG === undefined) {
//     throw Error("Tried to unrender technique rect when SVG group undefined");
//   }

//   if (this._techniqueRectSVG === undefined) {
//     return;
//   }

//   this._containerGroupSVG.removeChild(this._techniqueRectSVG);
//   this._techniqueRectSVG = undefined;
// }
//
// // ==== MAYBE WILL BE USEFULL LATER ====
// // =====================================
