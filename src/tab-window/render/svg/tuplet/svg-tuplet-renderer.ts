import {
  createSVGG,
  createSVGPath,
  createSVGText,
} from "../../../../misc/svg-creators";
import { BarElement } from "../../../elements/bar-element";
import { TupletElement } from "../../../elements/tuplet-element";
import { Point } from "../../../shapes/point";
import { TabWindow } from "../../../tab-window";
import { SVGBeatRenderer } from "../svg-beat-renderer";
import { SVGTupletSegmentRenderer } from "./svg-tuplet-segment-renderer";

export class SVGTupletRenderer {
  private _tabWindow: TabWindow;
  private _tupletElement: TupletElement;
  private _barOffset: Point;
  private _assetsPath: string;
  private _parentElement: SVGGElement;

  private _renderedTupletSegments: Map<number, SVGTupletSegmentRenderer>;

  private _groupSVG?: SVGGElement;
  private _completeTupletPath?: SVGPathElement;
  private _completeTupletTextSVG?: SVGTextElement;

  /**
   * Class for rendering a beat element using SVG
   * @param tabWindow Tab window
   * @param tupletElement Tuplet element
   * @param barOffset Global offset of the bar element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a bar element in this case)
   */
  constructor(
    tabWindow: TabWindow,
    tupletElement: TupletElement,
    barOffset: Point,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this._tabWindow = tabWindow;
    this._tupletElement = tupletElement;
    this._barOffset = barOffset;
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

    const tupletUUID = this._tupletElement.tupletGroup.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `tuplet-${tupletUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  private renderCompleteTupletPath(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render tuplet text when SVG group undefined");
    }

    const tupletUUID = this._tupletElement.tupletGroup.uuid;
    if (this._completeTupletPath === undefined) {
      this._completeTupletPath = createSVGPath();

      // Set only-set-once attributes
      this._completeTupletPath.setAttribute("stroke", "black");
      this._completeTupletPath.setAttribute("stroke-width", "3");
      this._completeTupletPath.setAttribute("fill", "none");

      // Set id
      const id = `tuplet-path-${tupletUUID}`;
      this._completeTupletPath.setAttribute("id", id);

      // Add elements to root SVG element
      this._groupSVG.appendChild(this._completeTupletPath);
    }

    const pathWidth = this._tupletElement.rect.width;
    const pathHeight = 7;
    const startX = this._barOffset.x + this._tupletElement.rect.x;
    const startY = this._barOffset.y + this._tupletElement.rect.y - pathHeight;
    const pathD = `
      M ${startX} ${startY} l 0 -${pathHeight} l ${pathWidth} 0 l 0 ${pathHeight}
    `.trim();
    this._completeTupletPath.setAttribute("d", pathD);
  }

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

  private renderCompleteTupletText(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render tuplet text when SVG group undefined");
    }

    const tupletUUID = this._tupletElement.tupletGroup.uuid;
    if (this._completeTupletTextSVG === undefined) {
      this._completeTupletTextSVG = createSVGText();

      // Set only-set-once attributes
      const fontSize = `${this._tabWindow.dim.tempoTextSize}`;
      this._completeTupletTextSVG.setAttribute("text-anchor", "middle");
      this._completeTupletTextSVG.setAttribute("dominant-baseline", "middle");
      this._completeTupletTextSVG.setAttribute("font-size", fontSize);

      // Set id
      const id = `tuplet-text-${tupletUUID}`;
      this._completeTupletTextSVG.setAttribute("id", id);

      // Add elements to root SVG element
      this._groupSVG.appendChild(this._completeTupletTextSVG);
    }

    const x = `${this._barOffset.x + this._tupletElement.rect.middleX}`;
    const y = `${this._barOffset.y + this._tupletElement.rect.height}`;
    const tupletGroup = this._tupletElement.tupletGroup;
    this._completeTupletTextSVG.setAttribute("x", x);
    this._completeTupletTextSVG.setAttribute("y", y);
    this._completeTupletTextSVG.textContent = tupletGroup.isStandard
      ? `${tupletGroup.normalCount}`
      : `${tupletGroup.normalCount}:${tupletGroup.tupletCount}`;
  }

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

  private renderTupletSegments(): SVGTupletSegmentRenderer[] {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render tuplet segments when SVG group undefined");
    }

    const activeRenderers: SVGTupletSegmentRenderer[] = [];

    // Check if there are any beat elements to remove
    const curBeatElementUUIDs = new Set(
      this._tupletElement.beatElements.map((b) => b.beat.uuid)
    );
    for (const [uuid, renderer] of this._renderedTupletSegments) {
      if (!curBeatElementUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedTupletSegments.delete(uuid);
      }
    }

    // Add & render new tuplet segments AND re-render existing ones
    for (const beatElement of this._tupletElement.beatElements) {
      const renderedTupletSegment = this._renderedTupletSegments.get(
        beatElement.beat.uuid
      );
      if (renderedTupletSegment === undefined) {
        const renderer = new SVGTupletSegmentRenderer(
          this._tabWindow,
          beatElement,
          this._barOffset,
          this._assetsPath,
          this._groupSVG
        );
        renderer.render(
          this._tupletElement.tupletGroup.complete,
          this._tupletElement.tupletGroup.isStandard
        );
        activeRenderers.push(renderer);
        this._renderedTupletSegments.set(beatElement.beat.uuid, renderer);
      } else {
        renderedTupletSegment.render(
          this._tupletElement.tupletGroup.complete,
          this._tupletElement.tupletGroup.isStandard
        );
        activeRenderers.push(renderedTupletSegment);
      }
    }
    return activeRenderers;
  }

  private unrenderTupletSegments(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender tuplet segments when SVG group undefined");
    }

    for (const [uuid, renderer] of this._renderedTupletSegments) {
      renderer.unrender();
      this._renderedTupletSegments.delete(uuid);
    }
  }

  public render(newBarOffset?: Point): SVGTupletSegmentRenderer[] {
    if (newBarOffset !== undefined) {
      this._barOffset = new Point(newBarOffset.x, newBarOffset.y);
    }

    this.renderGroup();

    if (this._tupletElement.tupletGroup.complete) {
      this.renderCompleteTupletText();
      this.renderCompleteTupletPath();
    } else {
      this.unrenderCompleteTupletText();
      this.unrenderCompleteTupletPath();
    }

    return this.renderTupletSegments();
  }

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
