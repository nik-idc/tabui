import { StaffLineElement, TrackController } from "@/notation/controller";
import { createSVGG, Point } from "@/shared";
import { SVGBarRenderer } from "./svg-bar-renderer";
import { SVGBeatRenderer } from "./svg-beat-renderer";
import { ElementRenderer } from "../element-renderer";
import { SVGNoteRenderer } from "./svg-note-renderer";
import { NotationStyleLineElement } from "@/notation/controller/element/staff/notation-style-line-element";
import { SVGTechGapRenderer } from "./svg-tech-gap-renderer";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";

/**
 * Class for rendering a notation style line element using SVG
 */
export class SVGStyleLineRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Style line element */
  styleLineElement: NotationStyleLineElement;
  /** Path to any assets */
  readonly assetsPath: ResolvedAssetConfig;

  // /** Parent SVG group element */
  // private _parentElement: SVGGElement;

  // /** Rendered bar elements map */
  // private _renderedBarElements: Map<number, SVGBarRenderer>;
  /** Rendered tech gap element */
  private _renderedTechGap?: SVGTechGapRenderer;

  /** Parent SVG group element */
  private _containerGroupSVG?: SVGGElement;

  /**
   * Class for rendering a staff line element using SVG
   * @param trackController Track controller
   * @param styleLineElement Style line element
   * @param assetsPath Path to assets
   */
  constructor(
    trackController: TrackController,
    styleLineElement: NotationStyleLineElement,
    assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this.styleLineElement = styleLineElement;

    this.assetsPath = assetsPath;
    // this._parentElement = parentElement;
    //
    // this._renderedBarElements = new Map();
  }

  /**
   * Ensures renderer's container group exists and returns it.
   * @returns Renderer's container SVG group element
   */
  public ensureContainerGroup(): SVGGElement {
    if (this._containerGroupSVG !== undefined) {
      return this._containerGroupSVG;
    }

    const styleLineUUID = this.styleLineElement.uuid;
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute("id", `style-line-${styleLineUUID}`);

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
   * data about the style line element
   */
  private renderGroup(): void {
    this.ensureContainerGroup();
  }

  // /**
  //  * Renders tech gap element
  //  * @returns Active renderers as a result of the render
  //  */
  // private renderTechGap(): ElementRenderer[] {
  //   if (this._containerGroupSVG === undefined) {
  //     throw Error("Tried to render tech gap when SVG group undefined");
  //   }
  //
  //   let techGapRendererWasUndefined: boolean = false;
  //   if (this._renderedTechGap === undefined) {
  //     this._renderedTechGap = new SVGTechGapRenderer(
  //       this.trackController,
  //       this.styleLineElement.techGapElement,
  //       this.assetsPath,
  //       this._containerGroupSVG
  //     );
  //     techGapRendererWasUndefined = true;
  //   }
  //
  //   const activeRenderers = [];
  //   activeRenderers.push(...this._renderedTechGap.render());
  //   if (techGapRendererWasUndefined) {
  //     activeRenderers.push(this._renderedTechGap);
  //   }
  //
  //   return activeRenderers;
  // }
  //
  // /**
  //  * Unrenders tech gap element
  //  */
  // private unrenderTechGap(): void {
  //   if (this._containerGroupSVG === undefined) {
  //     throw Error("Tried to unrender tech gap when SVG group undefined");
  //   }
  //
  //   if (this._renderedTechGap === undefined) {
  //     throw Error("Tried to unrender tech gap when gap renderer undefined");
  //   }
  //
  //   this._renderedTechGap.unrender();
  //   this._renderedTechGap = undefined;
  // }

  // /**
  //  * Renders bar elements
  //  * @returns Active renderers as a result of the render
  //  */
  // private renderBarElements(): ElementRenderer[] {
  //   if (this._containerGroupSVG === undefined) {
  //     throw Error("Tried to render bar elements when SVG group undefined");
  //   }
  //
  //   // Check if there are any bar elements to remove
  //   const curBarElementUUIDs = new Set(
  //     this.styleLineElement.barElements.map((b) => b.bar.uuid)
  //   );
  //   for (const [uuid, renderer] of this._renderedBarElements) {
  //     if (!curBarElementUUIDs.has(uuid)) {
  //       renderer.unrender();
  //       this._renderedBarElements.delete(uuid);
  //     }
  //   }
  //
  //   const activeRenderers: ElementRenderer[] = [];
  //
  //   // Add & render new bar element AND re-render existing bar element
  //   for (const barElement of this.styleLineElement.barElements) {
  //     const renderedBar = this._renderedBarElements.get(barElement.bar.uuid);
  //     if (renderedBar === undefined) {
  //       const renderer = new SVGBarRenderer(
  //         this.trackController,
  //         barElement,
  //         this.assetsPath,
  //         this._containerGroupSVG
  //       );
  //       activeRenderers.push(renderer);
  //       activeRenderers.push(...renderer.render());
  //       this._renderedBarElements.set(barElement.bar.uuid, renderer);
  //     } else {
  //       activeRenderers.push(renderedBar);
  //       activeRenderers.push(...renderedBar.render());
  //     }
  //   }
  //
  //   return activeRenderers;
  // }
  //
  // /**
  //  * Unrenders bar elements
  //  * @returns Active renderers as a result of the render
  //  */
  // private unrenderBarElements(): void {
  //   for (const [uuid, renderer] of this._renderedBarElements) {
  //     renderer.unrender();
  //     this._renderedBarElements.delete(uuid);
  //   }
  // }

  /**
   * Render staff line element
   */
  public render(): void {
    this.renderGroup();

    if (this._containerGroupSVG === undefined) {
      throw Error("Bar group SVG undefined after render group call");
    }

    // const activeRenderes: ElementRenderer[] = [];
    // this.renderBarElements();
    // this.renderTechGap();
  }

  /**
   * Unrender all staff line element's DOM element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    // this.unrenderTechGap();
    // this.unrenderBarElements();
    //
    // this._parentElement.removeChild(this._containerGroupSVG);
    // this._containerGroupSVG = undefined;
  }

  // /** Bar renderers getter */
  // public get barRenderers(): SVGBarRenderer[] {
  //   return this._renderedBarElements.values().toArray();
  // }

  // /** Rendered tech gap element */
  // public get renderedTechGap(): SVGTechGapRenderer | undefined {
  //   return this._renderedTechGap;
  // }
}
