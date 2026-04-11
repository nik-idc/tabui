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

  // /** Parent SVG group element */
  // private _parentElement: SVGGElement;

  // /** Rendered technique label renderers map: label UUID => label renderer */
  // private _renderedGapLineElements: Map<number, SVGTechniqueLabelRenderer>;

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

  // /**
  //  * Render new & re-render existing gap line elements
  //  * @returns
  //  */
  // private renderLabelElements(): SVGTechniqueLabelRenderer[] {
  //   if (this._containerGroupSVG === undefined) {
  //     throw Error("Tried to render gap lines when SVG group undefined");
  //   }
  //
  //   const activeRenderers: SVGTechniqueLabelRenderer[] = [];
  //
  //   // Check if there are any gap lines to remove
  //   const curNoteUUIDs = new Set(
  //     this.techGapLineElement.labelElements.map((l) => l.uuid)
  //   );
  //   for (const [uuid, renderer] of this._renderedGapLineElements) {
  //     if (!curNoteUUIDs.has(uuid)) {
  //       renderer.unrender();
  //       this._renderedGapLineElements.delete(uuid);
  //     }
  //   }
  //
  //   // Add & render new gap line elements AND re-render existing lines
  //   for (const labelElement of this.techGapLineElement.labelElements) {
  //     const renderedLabel = this._renderedGapLineElements.get(
  //       labelElement.uuid
  //     );
  //     if (renderedLabel === undefined) {
  //       const renderer = new SVGTechniqueLabelRenderer(
  //         this.trackController,
  //         labelElement,
  //         this.assetsPath,
  //         this._containerGroupSVG
  //       );
  //       renderer.render();
  //       this._renderedGapLineElements.set(labelElement.uuid, renderer);
  //       activeRenderers.push(renderer);
  //     } else {
  //       activeRenderers.push(renderedLabel);
  //       renderedLabel.render();
  //     }
  //   }
  //   return activeRenderers;
  // }
  //
  // /**
  //  * Unrender all labels
  //  */
  // private unrenderLabelElements(): void {
  //   if (this._containerGroupSVG === undefined) {
  //     throw Error("Tried to unrender note element when SVG group undefined");
  //   }
  //
  //   for (const [uuid, renderer] of this._renderedGapLineElements) {
  //     renderer.unrender();
  //   }
  // }

  /**
   * Renders the technique gap line element
   */
  public render(): void {
    this.renderGroup();

    if (this._containerGroupSVG === undefined) {
      throw Error("Bar group SVG undefined after render group call");
    }

    // this.renderLabelElements();
  }

  /**
   * Unenders the technique gap line element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    // this.unrenderLabelElements();
    //
    // this._parentElement.removeChild(this._containerGroupSVG);
    // this._containerGroupSVG = undefined;
  }
}
