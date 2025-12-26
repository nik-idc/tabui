import { TrackController } from "@/notation/controller";
import { TechGapLineElement } from "@/notation/controller/element/tech-gap-line-element";
import { createSVGG } from "@/shared";
import { ElementRenderer } from "../element-renderer";
import { SVGTechniqueLabelRenderer } from "./svg-technique-label-renderer";

/**
 * Class for rendering a tech gap line element using SVG
 */
export class SVGTechGapLineRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Tech gap line element */
  readonly techGapLineElement: TechGapLineElement;

  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _parentElement: SVGGElement;

  /** Rendered technique label renderers map: label UUID => label renderer */
  private _renderedGapLineElements: Map<number, SVGTechniqueLabelRenderer>;

  /** Container SVG group */
  private _groupSVG?: SVGGElement;

  /**
   * Class for rendering a tech gap line element using SVG
   * @param trackController Track controller
   * @param techGapLineElement Tech gap line element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element
   */
  constructor(
    trackController: TrackController,
    techGapLineElement: TechGapLineElement,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this.trackController = trackController;
    this.techGapLineElement = techGapLineElement;

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

    const gapLineUUID = this.techGapLineElement.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `tech-gap-${gapLineUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Render new & re-render existing gap line elements
   * @returns
   */
  private renderLabelElements(): SVGTechniqueLabelRenderer[] {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render gap lines when SVG group undefined");
    }

    const activeRenderers: SVGTechniqueLabelRenderer[] = [];

    // Check if there are any gap lines to remove
    const curNoteUUIDs = new Set(
      this.techGapLineElement.labelElements.map((l) => l.uuid)
    );
    for (const [uuid, renderer] of this._renderedGapLineElements) {
      if (!curNoteUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedGapLineElements.delete(uuid);
      }
    }

    // Add & render new gap line elements AND re-render existing lines
    for (const labelElement of this.techGapLineElement.labelElements) {
      const renderedLabel = this._renderedGapLineElements.get(
        labelElement.uuid
      );
      if (renderedLabel === undefined) {
        const renderer = new SVGTechniqueLabelRenderer(
          this.trackController,
          labelElement,
          this._assetsPath,
          this._groupSVG
        );
        renderer.render();
        this._renderedGapLineElements.set(labelElement.uuid, renderer);
        activeRenderers.push(renderer);
      } else {
        activeRenderers.push(renderedLabel);
        renderedLabel.render();
      }
    }
    return activeRenderers;
  }

  /**
   * Unrender all labels
   */
  private unrenderLabelElements(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender note element when SVG group undefined");
    }

    for (const [uuid, renderer] of this._renderedGapLineElements) {
      renderer.unrender();
    }
  }

  /**
   * Renders the technique gap line element
   */
  public render(): void {
    this.renderGroup();

    if (this._groupSVG === undefined) {
      throw Error("Bar group SVG undefined after render group call");
    }

    this.renderLabelElements();
  }

  /**
   * Unenders the technique gap line element
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender note elem when SVG group undefined");
    }

    this.unrenderLabelElements();

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }
}
