import { Point, createSVGG, createSVGPath, createSVGText } from "@/shared";
import { SVGTupletSegmentRenderer } from "./svg-tuplet-segment-renderer";
import { ElementRenderer } from "../../element-renderer";
import {
  BarTupletGroupElement,
  TabLayoutDimensions,
  TrackController,
} from "@/notation/controller";

/**
 * Class for rendering a tuplet element using SVG
 */
export class SVGTupletRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Tuplet element */
  readonly tupletElement: BarTupletGroupElement;
  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _parentElement: SVGGElement;

  /** Rendered segments map */
  private _renderedTupletSegments: Map<number, SVGTupletSegmentRenderer>;

  /** Container SVG group */
  private _groupSVG?: SVGGElement;
  /** SVG path for if the tuplet is complete */
  private _completeTupletPath?: SVGPathElement;
  /** SVG text for if the tuplet is complete */
  private _completeTupletTextSVG?: SVGTextElement;

  /**
   * Class for rendering a tuplet element using SVG
   * @param trackController Track controller
   * @param tupletElement Tuplet element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a bar element in this case)
   */
  constructor(
    trackController: TrackController,
    tupletElement: BarTupletGroupElement,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this.trackController = trackController;
    this.tupletElement = tupletElement;

    this._assetsPath = assetsPath;
    this._parentElement = parentElement;

    this._renderedTupletSegments = new Map();
  }

  /**
   * Renders the group element which will contain all the
   * data about the bar
   */
  private renderGroup(): void {
    if (this._groupSVG !== undefined) {
      return;
    }

    const tupletUUID = this.tupletElement.tupletGroup.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `tuplet-${tupletUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  private renderCompleteTupletPath(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render tuplet text when SVG group undefined");
    }

    const tupletUUID = this.tupletElement.tupletGroup.uuid;
    if (this._completeTupletPath === undefined) {
      this._completeTupletPath = createSVGPath();

      // Set only-set-once attributes
      this._completeTupletPath.setAttribute("stroke", "black");
      this._completeTupletPath.setAttribute("stroke-width", "3");
      this._completeTupletPath.setAttribute("fill", "none");

      // Set id
      const id = `tuplet-path-${tupletUUID}`;
      this._completeTupletPath.setAttribute("id", id);

      // Add element to root SVG element
      this._groupSVG.appendChild(this._completeTupletPath);
    }

    const pathWidth = this.tupletElement.rect.width;
    const pathHeight = 7;
    const startX =
      this.tupletElement.globalCoords.x + this.tupletElement.rect.x;
    const startY =
      this.tupletElement.globalCoords.y +
      this.tupletElement.rect.y -
      pathHeight;
    const pathD = `
      M ${startX} ${startY} l 0 -${pathHeight} l ${pathWidth} 0 l 0 ${pathHeight}
    `.trim();
    this._completeTupletPath.setAttribute("d", pathD);
  }

  /**
   * Unender the group
   */
  private unrenderCompleteTupletPath(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender tuplet text when SVG group undefined");
    }

    if (this._completeTupletPath === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._completeTupletPath);
    this._completeTupletPath = undefined;
  }

  /**
   * Render complete-tuplet text
   */
  private renderCompleteTupletText(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render tuplet text when SVG group undefined");
    }

    const tupletUUID = this.tupletElement.tupletGroup.uuid;
    if (this._completeTupletTextSVG === undefined) {
      this._completeTupletTextSVG = createSVGText();

      // Set only-set-once attributes
      const fontSize = `${TabLayoutDimensions.TEMPO_TEXT_SIZE}`;
      this._completeTupletTextSVG.setAttribute("text-anchor", "middle");
      this._completeTupletTextSVG.setAttribute("dominant-baseline", "middle");
      this._completeTupletTextSVG.setAttribute("font-size", fontSize);

      // Set id
      const id = `tuplet-text-${tupletUUID}`;
      this._completeTupletTextSVG.setAttribute("id", id);

      // Add element to root SVG element
      this._groupSVG.appendChild(this._completeTupletTextSVG);
    }

    const x = `${
      this.tupletElement.globalCoords.x + this.tupletElement.rect.middleX
    }`;
    const y = `${
      this.tupletElement.globalCoords.y + this.tupletElement.rect.height
    }`;
    const tupletGroup = this.tupletElement.tupletGroup;
    this._completeTupletTextSVG.setAttribute("x", x);
    this._completeTupletTextSVG.setAttribute("y", y);
    this._completeTupletTextSVG.textContent = tupletGroup.isStandard
      ? `${tupletGroup.normalCount}`
      : `${tupletGroup.normalCount}:${tupletGroup.tupletCount}`;
  }

  /**
   * Unrender complete-tuplet text
   */
  private unrenderCompleteTupletText(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender tuplet text when SVG group undefined");
    }

    if (this._completeTupletTextSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._completeTupletTextSVG);
    this._completeTupletTextSVG = undefined;
  }

  /**
   * Render tuplet segments
   */
  private renderTupletSegments(): SVGTupletSegmentRenderer[] {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render tuplet segments when SVG group undefined");
    }

    const activeRenderers: SVGTupletSegmentRenderer[] = [];

    // Check if there are any beat element to remove
    const curBeatElementUUIDs = new Set(
      this.tupletElement.beatElements.map((b) => b.beat.uuid)
    );
    for (const [uuid, renderer] of this._renderedTupletSegments) {
      if (!curBeatElementUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedTupletSegments.delete(uuid);
      }
    }

    // Add & render new tuplet segments AND re-render existing ones
    for (const beatElement of this.tupletElement.beatElements) {
      const renderedTupletSegment = this._renderedTupletSegments.get(
        beatElement.beat.uuid
      );
      if (renderedTupletSegment === undefined) {
        const renderer = new SVGTupletSegmentRenderer(
          this.trackController,
          beatElement,
          this._assetsPath,
          this._groupSVG
        );
        renderer.render(
          this.tupletElement.tupletGroup.complete,
          this.tupletElement.tupletGroup.isStandard
        );
        activeRenderers.push(renderer);
        this._renderedTupletSegments.set(beatElement.beat.uuid, renderer);
      } else {
        renderedTupletSegment.render(
          this.tupletElement.tupletGroup.complete,
          this.tupletElement.tupletGroup.isStandard
        );
        activeRenderers.push(renderedTupletSegment);
      }
    }
    return activeRenderers;
  }

  /**
   * Unrender tuplet segments
   */
  private unrenderTupletSegments(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender tuplet segments when SVG group undefined");
    }

    for (const [uuid, renderer] of this._renderedTupletSegments) {
      renderer.unrender();
      this._renderedTupletSegments.delete(uuid);
    }
  }

  /**
   * Render tuplet using SVG
   * @returns Active renderers
   */
  public render(): SVGTupletSegmentRenderer[] {
    this.renderGroup();

    if (this.tupletElement.tupletGroup.complete) {
      this.renderCompleteTupletText();
      this.renderCompleteTupletPath();
    } else {
      this.unrenderCompleteTupletText();
      this.unrenderCompleteTupletPath();
    }

    return this.renderTupletSegments();
  }

  /**
   * Unrender tuplet
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender tuplet elem when SVG group undefined");
    }

    this.unrenderCompleteTupletText();
    this.unrenderCompleteTupletPath();
    this.unrenderTupletSegments();

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }
}
