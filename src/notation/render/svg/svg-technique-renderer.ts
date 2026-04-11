import { TechniqueElement, TrackController } from "@/notation/controller";
import { createSVGG, createSVGPath } from "@/shared";
import { ElementRenderer } from "../element-renderer";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";

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

  // /** Technique SVG path */
  // private _techniqueSVGPath?: SVGGElement;
  /** Technique SVG paths */
  private _techniquePathsSVG?: SVGPathElement[];

  /**
   * Class for rendering a guitar technique element using SVG
   * @param trackController Track controller
   * @param techniqueElement Guitar technique element
   * @param assetsPath Unused. Kept for uniform renderer constructor signature.
   */
  constructor(
    trackController: TrackController,
    techniqueElement: TechniqueElement,
    assetsPath: ResolvedAssetConfig
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
  private renderTechniquePaths(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render technique paths when SVG group undefined");
    }

    const pathDescriptors = this.techniqueElement.pathDescriptors;
    if (pathDescriptors === undefined) {
      throw Error("Tried to render technique paths when descriptors undefined");
    }

    const techniqueUUID = this.techniqueElement.technique.uuid;
    if (this._techniquePathsSVG === undefined) {
      this._techniquePathsSVG = [];
    }

    while (this._techniquePathsSVG.length < pathDescriptors.length) {
      const pathIndex = this._techniquePathsSVG.length;
      const pathElement = createSVGPath();
      pathElement.setAttribute(
        "id",
        `technique-path-${techniqueUUID}-${pathIndex}`
      );
      this._containerGroupSVG.appendChild(pathElement);
      this._techniquePathsSVG.push(pathElement);
    }

    while (this._techniquePathsSVG.length > pathDescriptors.length) {
      const pathElement = this._techniquePathsSVG.pop();
      if (pathElement !== undefined) {
        this._containerGroupSVG.removeChild(pathElement);
      }
    }

    const x = `${this.techniqueElement.pathOrigin.x}`;
    const y = `${this.techniqueElement.pathOrigin.y}`;
    const transform = `translate(${x}, ${y})`;

    for (let i = 0; i < pathDescriptors.length; i++) {
      const pathElement = this._techniquePathsSVG[i];
      const descriptor = pathDescriptors[i];
      pathElement.setAttribute("transform", transform);
      pathElement.setAttribute("d", descriptor.d);

      if (descriptor.attrs !== undefined) {
        for (const [option, value] of Object.entries(descriptor.attrs)) {
          pathElement.setAttribute(option, value);
        }
      }
    }
  }

  /**
   * Unrender technique's custom HTML (like bend curves, palm mute text etc)
   */
  private unrenderTechniquePaths(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender technique paths when SVG group undefined");
    }

    if (this._techniquePathsSVG === undefined) {
      return;
    }

    for (const pathElement of this._techniquePathsSVG) {
      this._containerGroupSVG.removeChild(pathElement);
    }
    this._techniquePathsSVG = undefined;
  }

  /**
   * Render a note's technique
   */
  public render(): void {
    this.renderGroup();

    // The reason for 2 ifs: bends DO NOT have a rect, but DO have full HTML

    // Render technique custom HTML if necessary, remove it otherwise
    if (this.techniqueElement.pathDescriptors !== undefined) {
      this.renderTechniquePaths();
    } else {
      this.unrenderTechniquePaths();
    }
  }

  /**
   * Unrender all technique element's DOM element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    this.unrenderTechniquePaths();
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
