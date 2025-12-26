import {
  BeamSegmentElement,
  BeatElement,
  TabLayoutDimensions,
  TrackController,
} from "@/notation/controller";
import { Point, createSVGG, createSVGRect, createSVGText } from "@/shared";
import { ElementRenderer } from "../element-renderer";

/**
 * Class for rendering a tuplet segment using SVG
 */
export class SVGBeamSegmentRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Beam segment element */
  readonly beamSegment: BeamSegmentElement;
  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _parentElement: SVGGElement;

  /** Container SVG group */
  private _groupSVG?: SVGGElement;
  /** Long beam rectangle */
  private _longRectSVG?: SVGRectElement[];
  /** Short beam rectangle */
  private _shortRectSVG?: SVGRectElement;

  /**
   * Class for rendering a tuplet segment using SVG
   * @param trackController Track controller
   * @param beamSegment Beam segment element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a bar element in this case)
   */
  constructor(
    trackController: TrackController,
    beamSegment: BeamSegmentElement,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this.trackController = trackController;
    this.beamSegment = beamSegment;

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

    const beamUUID = this.beamSegment.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `beam-segment-${beamUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Renders beam segment's long rectangle
   */
  private renderLongRect(index: number): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render beam long rect when SVG group undefined");
    }

    if (this._longRectSVG === undefined) {
      throw Error("Tried to render beam long rect when SVG group undefined");
    }

    const beamUUID = this.beamSegment.uuid;
    if (this._longRectSVG[index] === undefined) {
      this._longRectSVG[index] = createSVGRect();

      // Set id
      const id = `beam-long-rect-${beamUUID}-rect`;
      this._longRectSVG[index].setAttribute("id", id);
      this._longRectSVG[index].setAttribute("fill", "black");

      // Add element to root SVG element
      this._groupSVG.appendChild(this._longRectSVG[index]);
    }

    const x = `${this.beamSegment.longRectsGlobal[index].x}`;
    const y = `${this.beamSegment.longRectsGlobal[index].y}`;
    const width = `${this.beamSegment.longRectsGlobal[index].width}`;
    const height = `${this.beamSegment.longRectsGlobal[index].height}`;
    this._longRectSVG[index].setAttribute("x", x);
    this._longRectSVG[index].setAttribute("y", y);
    this._longRectSVG[index].setAttribute("width", width);
    this._longRectSVG[index].setAttribute("height", height);
  }

  /**
   * Unrenders beam segment's long rectangle
   */
  private unrenderLongRect(index: number): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender beam long rect when SVG group undefined");
    }

    if (
      this._longRectSVG === undefined ||
      this._longRectSVG[index] === undefined
    ) {
      return;
    }

    this._groupSVG.removeChild(this._longRectSVG[index]);
    this._longRectSVG.splice(index, 1);
  }

  /**
   * Renders beam segment's long rectangles
   */
  private renderLongRects(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render beam long rect when SVG group undefined");
    }

    this._longRectSVG = [];
    for (let i = 0; i < this.beamSegment.longRects.length; i++) {
      this.renderLongRect(i);
    }
  }

  /**
   * Unrenders beam segment's long rectangles
   */
  private unrenderLongRects(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender beam long rect when SVG group undefined");
    }

    if (this._longRectSVG === undefined) {
      return;
    }

    for (let i = 0; i < this.beamSegment.longRects.length; i++) {
      this.unrenderLongRect(i);
    }

    this._longRectSVG = undefined;
  }

  /**
   * Renders beam segment's short rectangle
   */
  private renderShortRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render beam short rect when SVG group undefined");
    }

    if (this.beamSegment.shortRectGlobal === undefined) {
      throw Error("Tried to render undefined short rect");
    }

    const beamUUID = this.beamSegment.uuid;
    if (this._shortRectSVG === undefined) {
      this._shortRectSVG = createSVGRect();

      // Set id
      const id = `beam-short-rect-${beamUUID}-rect`;
      this._shortRectSVG.setAttribute("id", id);
      this._shortRectSVG.setAttribute("fill", "black");

      // Add element to root SVG element
      this._groupSVG.appendChild(this._shortRectSVG);
    }

    const x = `${this.beamSegment.shortRectGlobal.x}`;
    const y = `${this.beamSegment.shortRectGlobal.y}`;
    const width = `${this.beamSegment.shortRectGlobal.width}`;
    const height = `${this.beamSegment.shortRectGlobal.height}`;
    this._shortRectSVG.setAttribute("x", x);
    this._shortRectSVG.setAttribute("y", y);
    this._shortRectSVG.setAttribute("width", width);
    this._shortRectSVG.setAttribute("height", height);
  }

  /**
   * Renders beam segment's short rectangle
   */
  private unrenderShortRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender tuplet segment when SVG group undefined");
    }

    if (this.beamSegment.shortRect === undefined) {
      throw Error("Tried to unrender undefined short rect");
    }

    if (this._shortRectSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._shortRectSVG);
    this._shortRectSVG = undefined;
  }

  /**
   * Render tuplet segment
   */
  public render(): void {
    this.renderGroup();
    this.renderLongRects();
    if (this.beamSegment.shortRect !== undefined) {
      this.renderShortRect();
    }
  }

  /**
   * Unrender everything
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender tuplet elem when SVG group undefined");
    }

    this.unrenderLongRects();
    if (this.beamSegment.shortRect !== undefined) {
      this.unrenderShortRect();
    }

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }
}
