import { ElementRenderer } from "../element-renderer";
import { TrackLineElement } from "@/notation/controller/element/track-line-element";
import { SVGStaffLineRenderer } from "./svg-staff-line-renderer";
import { TrackController } from "@/notation/controller";
import { SVGTrackLineInfoRenderer } from "./svg-track-line-info-renderer";
import { createSVGG, createSVGLine } from "@/shared";

type OutlineLinesRendered = {
  left: SVGLineElement;
  right: SVGLineElement;
};

/**
 * Class for rendering a track element using SVG
 */
export class SVGTrackLineRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Track line element */
  trackLineElement: TrackLineElement;
  /** Path to any assets */
  readonly assetsPath: string;

  // /** Parent SVG group element */
  // private _parentElement: SVGGElement;

  // /** Rendered track line infoe element */
  // private _renderedInfoElement?: SVGTrackLineInfoRenderer;
  // /** Rendered staff line elements map */
  // private _renderedStaffLines: Map<number, SVGStaffLineRenderer>;

  /** Rendered outlines lines */
  private _renderedOutlineLines?: OutlineLinesRendered;

  /** Container SVG group */
  private _containerGroupSVG?: SVGGElement;

  /**
   * Class for rendering a track element using SVG
   * @param trackController Track controller
   * @param trackLineElement Track line element
   * @param assetsPath Path to assets
   */
  constructor(
    trackController: TrackController,
    trackLineElement: TrackLineElement,
    assetsPath: string
  ) {
    this.trackController = trackController;
    this.trackLineElement = trackLineElement;

    this.assetsPath = assetsPath;
    // this._parentElement = parentElement;
    //
    // this._renderedStaffLines = new Map();
  }

  /**
   * Ensures renderer's container group exists and returns it.
   * @returns Renderer's container SVG group element
   */
  public ensureContainerGroup(): SVGGElement {
    if (this._containerGroupSVG !== undefined) {
      return this._containerGroupSVG;
    }

    const trackLineUUID = this.trackLineElement.uuid;
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute("id", `track-line-${trackLineUUID}`);

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
   * data about the track line element
   */
  private renderGroup(): void {
    this.ensureContainerGroup();
  }

  // /**
  //  * Renders track line info element
  //  */
  // private renderInfoElement(): void {
  //   if (this._containerGroupSVG === undefined) {
  //     throw Error("Tried to render tech gap when SVG group undefined");
  //   }
  //
  //   if (this.trackLineElement.trackLineInfoElement === null) {
  //     this.unrenderInfoElement();
  //     return;
  //   }
  //
  //   if (this._renderedInfoElement === undefined) {
  //     this._renderedInfoElement = new SVGTrackLineInfoRenderer(
  //       this.trackController,
  //       this.trackLineElement.trackLineInfoElement,
  //       this.assetsPath,
  //       this._containerGroupSVG
  //     );
  //   }
  //
  //   this._renderedInfoElement.render();
  // }
  //
  // /**
  //  * Unrenders track line info element
  //  */
  // private unrenderInfoElement(): void {
  //   if (this._containerGroupSVG === undefined) {
  //     throw Error("Tried to unrender track info line when SVG group undefined");
  //   }
  //
  //   if (this._renderedInfoElement === undefined) {
  //     return;
  //   }
  //
  //   this._renderedInfoElement.unrender();
  //   this._renderedInfoElement = undefined;
  // }

  // /**
  //  * Renders all new staff lines & re-renders existing ones
  //  * @returns Active renderers as a result of the render
  //  */
  // private renderStaffLines(): ElementRenderer[] {
  //   if (this._containerGroupSVG === undefined) {
  //     throw Error("Tried to render staff lines when SVG group undefined");
  //   }
  //
  //   // Check if there are any staff element to remove
  //   const curStaffLineElementUUIDs = new Set(
  //     this.trackLineElement.staffLineElements.map((s) => s.staff.uuid)
  //   );
  //   for (const [uuid, renderer] of this._renderedStaffLines) {
  //     if (!curStaffLineElementUUIDs.has(uuid)) {
  //       renderer.unrender();
  //       this._renderedStaffLines.delete(uuid);
  //     }
  //   }
  //
  //   const activeRenderers: ElementRenderer[] = [];
  //   // Add & render new staff element AND re-render existing staff element
  //   for (const staffLineElement of this.trackLineElement.staffLineElements) {
  //     const renderedStaff = this._renderedStaffLines.get(
  //       staffLineElement.staff.uuid
  //     );
  //     if (renderedStaff === undefined) {
  //       const renderer = new SVGStaffLineRenderer(
  //         this.trackController,
  //         staffLineElement,
  //         this.assetsPath,
  //         this._containerGroupSVG
  //       );
  //       activeRenderers.push(renderer);
  //       activeRenderers.push(...renderer.render());
  //       this._renderedStaffLines.set(staffLineElement.staff.uuid, renderer);
  //     } else {
  //       activeRenderers.push(renderedStaff);
  //       activeRenderers.push(...renderedStaff.render());
  //     }
  //   }
  //
  //   return activeRenderers;
  // }
  //
  // /**
  //  * Unrenders all staff lines
  //  */
  // private unrenderStaffLines(): void {
  //   for (const [uuid, renderer] of this._renderedStaffLines) {
  //     renderer.unrender();
  //     this._renderedStaffLines.delete(uuid);
  //   }
  // }

  /**
   * Renders the left & right outline lines
   */
  private renderOutlines(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render staff lines when SVG group undefined");
    }

    const lines = this.trackLineElement.outlineLinesGlobal;
    if (lines === undefined) {
      return;
    }

    const lineUUID = this.trackLineElement.uuid;
    if (this._renderedOutlineLines === undefined) {
      this._renderedOutlineLines = {
        left: createSVGLine(),
        right: createSVGLine(),
      };

      // Set only-set-once attributes
      this._renderedOutlineLines.left.setAttribute("stroke", "black");
      this._renderedOutlineLines.right.setAttribute("stroke", "black");

      // Set id
      const idLeft = `track-outline-left-${lineUUID}`;
      const idRight = `track-outline-right-${lineUUID}`;
      this._renderedOutlineLines.left.setAttribute("id", idLeft);
      this._renderedOutlineLines.right.setAttribute("id", idRight);

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(this._renderedOutlineLines.left);
      this._containerGroupSVG.appendChild(this._renderedOutlineLines.right);
    }

    this._renderedOutlineLines.left.setAttribute("x1", `${lines.left.x}`);
    this._renderedOutlineLines.left.setAttribute("x2", `${lines.left.x}`);
    this._renderedOutlineLines.left.setAttribute("y1", `${lines.left.y1}`);
    this._renderedOutlineLines.left.setAttribute("y2", `${lines.left.y2}`);

    this._renderedOutlineLines.right.setAttribute("x1", `${lines.right.x}`);
    this._renderedOutlineLines.right.setAttribute("x2", `${lines.right.x}`);
    this._renderedOutlineLines.right.setAttribute("y1", `${lines.right.y1}`);
    this._renderedOutlineLines.right.setAttribute("y2", `${lines.right.y2}`);
  }

  /**
   * Unrenders the left & right outline lines
   */
  private unrenderOutlines(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render staff lines when SVG group undefined");
    }

    if (this._renderedOutlineLines === undefined) {
      return;
    }

    this._containerGroupSVG.removeChild(this._renderedOutlineLines.left);
    this._containerGroupSVG.removeChild(this._renderedOutlineLines.right);

    this._renderedOutlineLines = undefined;
  }

  /**
   * Render track line element
   */
  public render(): void {
    this.renderGroup();
    // this.renderInfoElement();
    this.renderOutlines();
    // return this.renderStaffLines();
  }

  /**
   * Unrender all track line element's DOM element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    // this.unrenderInfoElement();
    // this.unrenderStaffLines();
    this.unrenderOutlines();

    // this._parentElement.removeChild(this._containerGroupSVG);
    // this._containerGroupSVG = undefined;
  }

  // public get staffRenderers(): SVGStaffLineRenderer[] {
  //   return this._renderedStaffLines.values().toArray();
  // }
}
