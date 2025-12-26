import { TrackController } from "@/notation/controller";
import { TechGapElement } from "@/notation/controller/element/tech-gap-element";
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
  readonly techGapElement: TechGapElement;

  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _parentElement: SVGGElement;

  /** Rendered gap line elements map: gap line UUID => gap line renderer */
  private _renderedGapLineElements: Map<number, SVGTechGapLineRenderer>;

  /** Container SVG group */
  private _groupSVG?: SVGGElement;

  /**
   * Class for rendering a beat element using SVG
   * @param trackController Track controller
   * @param barElement Bar element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element
   */
  constructor(
    trackController: TrackController,
    techGapElement: TechGapElement,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this.trackController = trackController;
    this.techGapElement = techGapElement;

    this._assetsPath = assetsPath;
    this._parentElement = parentElement;

    this._renderedGapLineElements = new Map();
  }

  /**
   * Renders the group element which will contain all the
   * data about the technique gap
   */
  private renderGroup(): void {
    if (this._groupSVG !== undefined) {
      return;
    }

    const gapLineUUID = this.techGapElement.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `tech-gap-${gapLineUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Render new & re-render existing gap line elements
   * @returns
   */
  private renderGapLineElements(): ElementRenderer[] {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render gap lines when SVG group undefined");
    }

    const activeRenderers: ElementRenderer[] = [];

    // Check if there are any gap lines to remove
    const linesArray = this.techGapElement.techGapLinesAsArray;
    const curNoteUUIDs = new Set(linesArray.map((gl) => gl.uuid));
    for (const [uuid, renderer] of this._renderedGapLineElements) {
      if (!curNoteUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedGapLineElements.delete(uuid);
      }
    }

    // Add & render new gap line elements AND re-render existing lines
    for (const gapLineElement of linesArray) {
      const renderedGapLine = this._renderedGapLineElements.get(
        gapLineElement.uuid
      );
      if (renderedGapLine === undefined) {
        const renderer = new SVGTechGapLineRenderer(
          this.trackController,
          gapLineElement,
          this._assetsPath,
          this._groupSVG
        );
        renderer.render();
        this._renderedGapLineElements.set(gapLineElement.uuid, renderer);
        activeRenderers.push(renderer);
      } else {
        activeRenderers.push(renderedGapLine);
        renderedGapLine.render();
      }
    }
    return activeRenderers;
  }

  /**
   * Unrender all tech gap lines
   */
  private unrenderGapLineElements(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender note element when SVG group undefined");
    }

    for (const [uuid, renderer] of this._renderedGapLineElements) {
      renderer.unrender();
    }
  }

  /**
   * Renders the technique gap element
   */
  public render(): ElementRenderer[] {
    this.renderGroup();

    if (this._groupSVG === undefined) {
      throw Error("Bar group SVG undefined after render group call");
    }

    return this.renderGapLineElements();
  }

  /**
   * Unenders the technique gap element
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender note elem when SVG group undefined");
    }

    this.unrenderGapLineElements();

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }
}
