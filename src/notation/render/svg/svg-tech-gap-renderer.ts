import { TrackController } from "@/notation/controller";
import { TechGapElement } from "@/notation/controller/element/staff/tech-gap-element";
import { createSVGG } from "@/shared";
import { ElementRenderer } from "../element-renderer";
import { SVGTechGapLineRenderer } from "./svg-tech-gap-line-renderer";

/**
 * Class for rendering a bar element using SVG
 */
export class SVGTechGapRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Bar element */
  techGapElement: TechGapElement;
  /** Path to any assets */
  readonly assetsPath: string;

  // /** Rendered gap line elements map: gap line UUID => gap line renderer */
  // private _renderedGapLineElements: Map<number, SVGTechGapLineRenderer>;

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
    assetsPath: string
  ) {
    this.trackController = trackController;
    this.techGapElement = techGapElement;

    this.assetsPath = assetsPath;
    // this._parentElement = parentElement;
    //
    // this._renderedGapLineElements = new Map();
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

  // /**
  //  * Render new & re-render existing gap line elements
  //  * @returns
  //  */
  // private renderGapLineElements(): ElementRenderer[] {
  //   if (this._containerGroupSVG === undefined) {
  //     throw Error("Tried to render gap lines when SVG group undefined");
  //   }
  //
  //   const activeRenderers: ElementRenderer[] = [];
  //
  //   // Check if there are any gap lines to remove
  //   const linesArray = this.techGapElement.techGapLinesAsArray;
  //   const curNoteUUIDs = new Set(linesArray.map((gl) => gl.uuid));
  //   for (const [uuid, renderer] of this._renderedGapLineElements) {
  //     if (!curNoteUUIDs.has(uuid)) {
  //       renderer.unrender();
  //       this._renderedGapLineElements.delete(uuid);
  //     }
  //   }
  //
  //   // Add & render new gap line elements AND re-render existing lines
  //   for (const gapLineElement of linesArray) {
  //     const renderedGapLine = this._renderedGapLineElements.get(
  //       gapLineElement.uuid
  //     );
  //     if (renderedGapLine === undefined) {
  //       const renderer = new SVGTechGapLineRenderer(
  //         this.trackController,
  //         gapLineElement,
  //         this.assetsPath,
  //         this._containerGroupSVG
  //       );
  //       renderer.render();
  //       this._renderedGapLineElements.set(gapLineElement.uuid, renderer);
  //       activeRenderers.push(renderer);
  //     } else {
  //       activeRenderers.push(renderedGapLine);
  //       renderedGapLine.render();
  //     }
  //   }
  //   return activeRenderers;
  // }
  //
  // /**
  //  * Unrender all tech gap lines
  //  */
  // private unrenderGapLineElements(): void {
  //   if (this._containerGroupSVG === undefined) {
  //     throw Error("Tried to unrender note element when SVG group undefined");
  //   }
  //
  //   for (const [uuid, renderer] of this._renderedGapLineElements) {
  //     renderer.unrender();
  //   }
  // }

  /**
   * Renders the technique gap element
   */
  public render(): void {
    this.renderGroup();

    if (this._containerGroupSVG === undefined) {
      throw Error("Bar group SVG undefined after render group call");
    }

    // return this.renderGapLineElements();
  }

  /**
   * Unenders the technique gap element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    // this.unrenderGapLineElements();
    //
    // this._parentElement.removeChild(this._containerGroupSVG);
    // this._containerGroupSVG = undefined;
  }
}
