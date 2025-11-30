import {
  BeatElement,
  TabLayoutDimensions,
  TrackController,
} from "@/notation/controller";
import { Point, createSVGG, createSVGRect, createSVGText } from "@/shared";
import { ElementRenderer } from "../../element-renderer";

/**
 * Class for rendering a tuplet segment using SVG
 */
export class SVGTupletSegmentRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Beat element */
  readonly beatElement: BeatElement;
  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _parentElement: SVGGElement;

  /** Container SVG group */
  private _groupSVG?: SVGGElement;
  /** Tuplet segment SVG text */
  private _tupletSegmentTextSVG?: SVGTextElement;
  /** Tuplet segment SVG rectangle */
  private _tupletSegmentRectSVG?: SVGRectElement;

  /**
   * Class for rendering a tuplet segment using SVG
   * @param trackController Track controller
   * @param beatElement Beat element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a bar element in this case)
   */
  constructor(
    trackController: TrackController,
    beatElement: BeatElement,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this.trackController = trackController;
    this.beatElement = beatElement;

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

    const beatUUID = this.beatElement.beat.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `tuplet-segment-${beatUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Renders tuplet segment rectangle
   */
  private renderTupletSegmentRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render tuplet segment when SVG group undefined");
    }

    const beatUUID = this.beatElement.beat.uuid;
    if (this._tupletSegmentRectSVG === undefined) {
      this._tupletSegmentRectSVG = createSVGRect();

      // Set id
      const id = `tuplet-segment-${beatUUID}-rect`;
      this._tupletSegmentRectSVG.setAttribute("id", id);
      this._tupletSegmentRectSVG.setAttribute("fill", "black");

      // Add element to root SVG element
      this._groupSVG.appendChild(this._tupletSegmentRectSVG);
    }

    const x = `${this.beatElement.globalCoords.x}`;
    const y = `${this.beatElement.globalCoords.y - 10}`;
    const width = `${this.beatElement.rect.width}`;
    const height = `2`;
    this._tupletSegmentRectSVG.setAttribute("x", x);
    this._tupletSegmentRectSVG.setAttribute("y", y);
    this._tupletSegmentRectSVG.setAttribute("width", width);
    this._tupletSegmentRectSVG.setAttribute("height", height);
  }

  /**
   * Renders tuplet segment rectangle
   */
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

  /**
   * Renders tuplet segment text
   * @param isStandard True if tuplet settings are standard (4:3, 3:2 etc)
   */
  private renderTupletSegmentText(isStandard: boolean): void {
    if (this._groupSVG === undefined) {
      throw Error(
        "Tried to render tuplet segment text when SVG group undefined"
      );
    }

    const settings = this.beatElement.beat.tupletSettings;
    if (settings === null) {
      throw Error(
        "Tried to render tuplet segment text when tuplet settings null"
      );
    }

    const beatUUID = this.beatElement.beat.uuid;
    if (this._tupletSegmentTextSVG === undefined) {
      this._tupletSegmentTextSVG = createSVGText();

      // Set id
      const id = `tuplet-segment-${beatUUID}-text`;
      const fontSize = `${TabLayoutDimensions.TEMPO_TEXT_SIZE}`;
      this._tupletSegmentTextSVG.setAttribute("id", id);
      this._tupletSegmentTextSVG.setAttribute("text-anchor", "middle");
      this._tupletSegmentTextSVG.setAttribute("dominant-baseline", "middle");
      this._tupletSegmentTextSVG.setAttribute("font-size", fontSize);

      // Add element to root SVG element
      this._groupSVG.appendChild(this._tupletSegmentTextSVG);
    }

    const x = `${
      this.beatElement.globalCoords.x + this.beatElement.rect.middleX
    }`;
    const y = `${
      this.beatElement.globalCoords.y + TabLayoutDimensions.TUPLET_RECT_HEIGHT
    }`;
    this._tupletSegmentTextSVG.setAttribute("x", x);
    this._tupletSegmentTextSVG.setAttribute("y", y);
    this._tupletSegmentTextSVG.textContent = isStandard
      ? `${settings.normalCount}`
      : `${settings.normalCount}:${settings.tupletCount}`;
  }

  /**
   * Unrenders tuplet segment text
   */
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

  /**
   * Render tuplet segment
   * @param complete True if tuplet is complete
   * @param isStandard True if tuplet settings are standard (4:3, 3:2 etc)
   */
  public render(complete: boolean, isStandard: boolean): void {
    this.renderGroup();

    if (complete) {
      this.unrenderTupletSegmentText();
      // this.renderTupletSegmentRect();
    } else {
      // this.unrenderTupletSegmentRect();
      this.renderTupletSegmentText(isStandard);
    }
  }

  /**
   * Unrender everything
   */
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
