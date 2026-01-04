import { StaffLineElement, TrackController } from "@/notation/controller";
import { ElementRenderer } from "../element-renderer";
import { SVGStyleLineRenderer } from "./svg-style-line-renderer";
import { createSVGG, createSVGRect } from "@/shared";

/**
 * Class for rendering a staff line element using SVG
 */
export class SVGStaffLineRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Staff line element */
  readonly staffLineElement: StaffLineElement;

  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _parentElement: SVGGElement;

  /** Rendered style lines map: style line UUID -> style line renderer */
  private _renderedStyleLines: Map<number, SVGStyleLineRenderer>;
  /** Rendered selection rectangle if at least part of the line is inside the selection */
  private _renderedSelectionRect?: SVGRectElement;

  /** Parent SVG group element */
  private _groupSVG?: SVGGElement;

  /**
   * Class for rendering a staff line element using SVG
   * @param trackController Track controller
   * @param staffLineElement Staff line element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element
   */
  constructor(
    trackController: TrackController,
    staffLineElement: StaffLineElement,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this.trackController = trackController;
    this.staffLineElement = staffLineElement;

    this._assetsPath = assetsPath;
    this._parentElement = parentElement;

    this._renderedStyleLines = new Map();
  }

  /**
   * Renders the group element which will contain all the
   * data about the bar
   */
  private renderGroup(): void {
    if (this._groupSVG !== undefined) {
      return;
    }

    const staffLineUUID = this.staffLineElement.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `staff-line-${staffLineUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Renders style lines
   * @returns Rendered style line renderer instances
   */
  private renderStyleLines(): ElementRenderer[] {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render style lines when SVG group undefined");
    }

    const styleLinesArr = this.staffLineElement.styleLinesAsArray;

    // Check if there are any style lines to remove
    const curStyleLinesUUIDs = new Set(styleLinesArr.map((sl) => sl.uuid));
    for (const [uuid, renderer] of this._renderedStyleLines) {
      if (!curStyleLinesUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedStyleLines.delete(uuid);
      }
    }

    const activeRenderers: ElementRenderer[] = [];
    // Add & render new bar element AND re-render existing bar element
    for (const styleLine of styleLinesArr) {
      const renderedLine = this._renderedStyleLines.get(styleLine.uuid);
      if (renderedLine === undefined) {
        const renderer = new SVGStyleLineRenderer(
          this.trackController,
          styleLine,
          this._assetsPath,
          this._groupSVG
        );
        activeRenderers.push(renderer);
        activeRenderers.push(...renderer.render());
        this._renderedStyleLines.set(styleLine.uuid, renderer);
      } else {
        activeRenderers.push(renderedLine);
        activeRenderers.push(...renderedLine.render());
      }
    }

    return activeRenderers;
  }

  /**
   * Unrenders style lines
   */
  private unrenderStyleLines(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender style lines when SVG group undefined");
    }

    for (const [uuid, renderer] of this._renderedStyleLines) {
      renderer.unrender();
      this._renderedStyleLines.delete(uuid);
    }
  }

  /**
   * Renders the selection rectangle for the staff line (or unrenders it if no beats in the line selected)
   */
  private renderSelectionRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render selection rect when SVG group undefined");
    }

    const selectionBeats =
      this.trackController.trackControllerEditor.selectionManager
        .selectionBeats;
    if (selectionBeats.length === 0) {
      this.unrenderSelectionRect();
      return;
    }

    const selectionRect = this.staffLineElement.getSelectionRect(
      selectionBeats[0],
      selectionBeats[1]
    );
    if (selectionRect === undefined) {
      this.unrenderSelectionRect();
      return;
    }

    const staffLineUUID = this.staffLineElement.uuid;
    if (this._renderedSelectionRect === undefined) {
      this._renderedSelectionRect = createSVGRect();

      // Set only-set-once attributes
      this._renderedSelectionRect.setAttribute("fill", "gray");
      this._renderedSelectionRect.setAttribute("stroke-width", "1");
      this._renderedSelectionRect.setAttribute("fill-opacity", "0.5");
      this._renderedSelectionRect.setAttribute("stroke-opacity", "0.5");
      this._renderedSelectionRect.setAttribute("pointer-events", "none");

      // Set id
      this._renderedSelectionRect.setAttribute(
        "id",
        `selection-rect-${staffLineUUID}`
      );

      // Add element to root SVG element
      this._groupSVG.appendChild(this._renderedSelectionRect);
    }

    const x = `${selectionRect.x}`;
    const y = `${selectionRect.y}`;
    const width = `${selectionRect.width}`;
    const height = `${selectionRect.height}`;
    this._renderedSelectionRect.setAttribute("x", x);
    this._renderedSelectionRect.setAttribute("y", y);
    this._renderedSelectionRect.setAttribute("width", width);
    this._renderedSelectionRect.setAttribute("height", height);
  }

  /**
   * Unrenders the selection rectangle for the staff line
   */
  private unrenderSelectionRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender selection rects when SVG group undefined");
    }

    if (this._renderedSelectionRect === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._renderedSelectionRect);
    this._renderedSelectionRect = undefined;
  }

  /**
   * Render staff line element
   */
  public render(): ElementRenderer[] {
    const activeRenderers = [];

    this.renderGroup();
    activeRenderers.push(...this.renderStyleLines());
    this.renderSelectionRect();

    return activeRenderers;
  }

  /**
   * Unrender all staff line element's DOM element
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender staff line when SVG group undefined");
    }

    this.unrenderStyleLines();
    this.unrenderSelectionRect();

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }

  /** Style lines renderers getter */
  public get styleLinesRenderers(): SVGStyleLineRenderer[] {
    return this._renderedStyleLines.values().toArray();
  }
}
