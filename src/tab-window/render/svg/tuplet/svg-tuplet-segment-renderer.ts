import {
  createSVGG,
  createSVGRect,
  createSVGText,
} from "../../../../misc/svg-creators";
import { BarElement } from "../../../elements/bar-element";
import { BeatElement } from "../../../elements/beat-element";
import { TupletElement } from "../../../elements/tuplet-element";
import { Point } from "../../../shapes/point";
import { TabWindow } from "../../../tab-window";
import { SVGBeatRenderer } from "../svg-beat-renderer";

export class SVGTupletSegmentRenderer {
  private _tabWindow: TabWindow;
  private _beatElement: BeatElement;
  private _barOffset: Point;
  private _assetsPath: string;
  private _parentElement: SVGGElement;

  private _groupSVG?: SVGGElement;
  private _tupletSegmentTextSVG?: SVGTextElement;
  private _tupletSegmentRectSVG?: SVGRectElement;

  /**
   * Class for rendering a beat element using SVG
   * @param tabWindow Tab window
   * @param beatElement Beat element
   * @param barOffset Global offset of the bar element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a bar element in this case)
   */
  constructor(
    tabWindow: TabWindow,
    beatElement: BeatElement,
    barOffset: Point,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this._tabWindow = tabWindow;
    this._beatElement = beatElement;
    this._barOffset = barOffset;
    this._assetsPath = assetsPath;
    this._parentElement = parentElement;
  }

  /**
   * Renders the group element which will contain all the
   * data about the bar
   */
  private renderGroup(): void {
    if (this._groupSVG !== undefined) {
      return;
    }

    const beatUUID = this._beatElement.beat.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `tuplet-segment-${beatUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  private renderTupletSegmentRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render tuplet segment when SVG group undefined");
    }

    const beatUUID = this._beatElement.beat.uuid;
    if (this._tupletSegmentRectSVG === undefined) {
      this._tupletSegmentRectSVG = createSVGRect();

      // Set id
      const id = `tuplet-segment-${beatUUID}-rect`;
      this._tupletSegmentRectSVG.setAttribute("id", id);
      this._tupletSegmentRectSVG.setAttribute("fill", "black");

      // Add elements to root SVG element
      this._groupSVG.appendChild(this._tupletSegmentRectSVG);
    }

    const x = `${this._barOffset.x + this._beatElement.rect.x}`;
    const y = `${this._barOffset.y + this._beatElement.rect.y - 10}`;
    const width = `${this._beatElement.rect.width}`;
    const height = `2`;
    // const width = `${this._beatElement.dim.noteTextSize * 4}`;
    // const height = `${this._beatElement.dim.tupletRectHeight}`;
    this._tupletSegmentRectSVG.setAttribute("x", x);
    this._tupletSegmentRectSVG.setAttribute("y", y);
    this._tupletSegmentRectSVG.setAttribute("width", width);
    this._tupletSegmentRectSVG.setAttribute("height", height);
  }

  private unrenderTupletSegmentRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender tuplet segment when SVG group undefined");
    }

    if (this._tupletSegmentRectSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._tupletSegmentRectSVG);
    this._tupletSegmentRectSVG = undefined;
  }

  private renderTupletSegmentText(isStandard: boolean): void {
    if (this._groupSVG === undefined) {
      throw Error(
        "Tried to render tuplet segment text when SVG group undefined"
      );
    }

    const settings = this._beatElement.beat.tupletSettings;
    if (settings === undefined) {
      throw Error(
        "Tried to render tuplet segment text when tuplet settings undefined"
      );
    }

    const beatUUID = this._beatElement.beat.uuid;
    if (this._tupletSegmentTextSVG === undefined) {
      this._tupletSegmentTextSVG = createSVGText();

      // Set id
      const id = `tuplet-segment-${beatUUID}-text`;
      const fontSize = `${this._tabWindow.dim.tempoTextSize}`;
      this._tupletSegmentTextSVG.setAttribute("id", id);
      this._tupletSegmentTextSVG.setAttribute("text-anchor", "middle");
      this._tupletSegmentTextSVG.setAttribute("dominant-baseline", "middle");
      this._tupletSegmentTextSVG.setAttribute("font-size", fontSize);

      // Add elements to root SVG element
      this._groupSVG.appendChild(this._tupletSegmentTextSVG);
    }

    const x = `${this._barOffset.x + this._beatElement.rect.middleX}`;
    const y = `${this._barOffset.y + this._beatElement.dim.tupletRectHeight}`;
    this._tupletSegmentTextSVG.setAttribute("x", x);
    this._tupletSegmentTextSVG.setAttribute("y", y);
    this._tupletSegmentTextSVG.textContent = isStandard
      ? `${settings.normalCount}`
      : `${settings.normalCount}:${settings.tupletCount}`;
  }

  private unrenderTupletSegmentText(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender tuplet segment when SVG group undefined");
    }

    if (this._tupletSegmentTextSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._tupletSegmentTextSVG);
    this._tupletSegmentTextSVG = undefined;
  }

  public render(
    complete: boolean,
    isStandard: boolean,
    newBarOffset?: Point
  ): void {
    if (newBarOffset !== undefined) {
      this._barOffset = newBarOffset;
    }

    this.renderGroup();

    if (complete) {
      this.unrenderTupletSegmentText();
      // this.renderTupletSegmentRect();
    } else {
      // this.unrenderTupletSegmentRect();
      this.renderTupletSegmentText(isStandard);
    }
  }

  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender tuplet elem when SVG group undefined");
    }

    this.unrenderTupletSegmentRect();
    this.unrenderTupletSegmentText();

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }
}
