import { StaffLineElement, TrackController } from "@/notation/controller";
import { createSVGG, Point } from "@/shared";
import { SVGBarRenderer } from "./svg-bar-renderer";
import { SVGBeatRenderer } from "./svg-beat-renderer";
import { ElementRenderer } from "../element-renderer";
import { SVGNoteRenderer } from "./svg-note-renderer";
import { NotationStyleLineElement } from "@/notation/controller/element/notation-style-line-element";
import { SVGTechGapRenderer } from "./svg-tech-gap-renderer";

/**
 * Class for rendering a notation style line element using SVG
 */
export class SVGStyleLineRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Style line element */
  readonly styleLineElement: NotationStyleLineElement;

  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _parentElement: SVGGElement;

  /** Rendered bar elements map */
  private _renderedBarElements: Map<number, SVGBarRenderer>;
  /** Rendered tech gap element */
  private _renderedTechGap?: SVGTechGapRenderer;

  /** Parent SVG group element */
  private _groupSVG?: SVGGElement;

  /**
   * Class for rendering a staff line element using SVG
   * @param trackController Track controller
   * @param styleLineElement Style line element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element
   */
  constructor(
    trackController: TrackController,
    styleLineElement: NotationStyleLineElement,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this.trackController = trackController;
    this.styleLineElement = styleLineElement;

    this._assetsPath = assetsPath;
    this._parentElement = parentElement;

    this._renderedBarElements = new Map();
  }

  /**
   * Renders the group element which will contain all the
   * data about the technique gap
   */
  private renderGroup(): void {
    if (this._groupSVG !== undefined) {
      return;
    }

    const gapLineUUID = this.styleLineElement.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `tech-gap-${gapLineUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Renders tech gap element
   * @returns Active renderers as a result of the render
   */
  private renderTechGap(): ElementRenderer[] {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render tech gap when SVG group undefined");
    }

    let techGapRendererWasUndefined: boolean = false;
    if (this._renderedTechGap === undefined) {
      this._renderedTechGap = new SVGTechGapRenderer(
        this.trackController,
        this.styleLineElement.techGapElement,
        this._assetsPath,
        this._groupSVG
      );
      techGapRendererWasUndefined = true;
    }

    const activeRenderers = [];
    activeRenderers.push(...this._renderedTechGap.render());
    if (techGapRendererWasUndefined) {
      activeRenderers.push(this._renderedTechGap);
    }

    return activeRenderers;
  }

  /**
   * Unrenders tech gap element
   */
  private unrenderTechGap(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender tech gap when SVG group undefined");
    }

    if (this._renderedTechGap === undefined) {
      throw Error("Tried to unrender tech gap when gap renderer undefined");
    }

    this._renderedTechGap.unrender();
    this._renderedTechGap = undefined;
  }

  /**
   * Renders bar elements
   * @returns Active renderers as a result of the render
   */
  private renderBarElements(): ElementRenderer[] {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render bar elements when SVG group undefined");
    }

    // Check if there are any bar elements to remove
    const curBarElementUUIDs = new Set(
      this.styleLineElement.barElements.map((b) => b.bar.uuid)
    );
    for (const [uuid, renderer] of this._renderedBarElements) {
      if (!curBarElementUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedBarElements.delete(uuid);
      }
    }

    const activeRenderers: ElementRenderer[] = [];

    // Add & render new bar element AND re-render existing bar element
    for (const barElement of this.styleLineElement.barElements) {
      const renderedBar = this._renderedBarElements.get(barElement.bar.uuid);
      if (renderedBar === undefined) {
        const renderer = new SVGBarRenderer(
          this.trackController,
          barElement,
          this._assetsPath,
          this._groupSVG
        );
        activeRenderers.push(renderer);
        activeRenderers.push(...renderer.render());
        this._renderedBarElements.set(barElement.bar.uuid, renderer);
      } else {
        activeRenderers.push(renderedBar);
        activeRenderers.push(...renderedBar.render());
      }
    }

    return activeRenderers;
  }

  /**
   * Unrenders bar elements
   * @returns Active renderers as a result of the render
   */
  private unrenderBarElements(): void {
    for (const [uuid, renderer] of this._renderedBarElements) {
      renderer.unrender();
      this._renderedBarElements.delete(uuid);
    }
  }

  /**
   * Render staff line element
   */
  public render(): ElementRenderer[] {
    this.renderGroup();

    if (this._groupSVG === undefined) {
      throw Error("Bar group SVG undefined after render group call");
    }

    const activeRenderes: ElementRenderer[] = [];
    activeRenderes.push(...this.renderBarElements());
    activeRenderes.push(...this.renderTechGap());

    return activeRenderes;
  }

  /**
   * Unrender all staff line element's DOM element
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender note elem when SVG group undefined");
    }

    this.unrenderTechGap();
    this.unrenderBarElements();

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }

  /** Bar renderers getter */
  public get barRenderers(): SVGBarRenderer[] {
    return this._renderedBarElements.values().toArray();
  }

  /** Rendered tech gap element */
  public get renderedTechGap(): SVGTechGapRenderer | undefined {
    return this._renderedTechGap;
  }
}
