import { GuitarEffect, GuitarEffectType } from "../../models/guitar-effect";
import { Point } from "../shapes/point";
import { Rect } from "../shapes/rect";
import { TabWindowDim } from "../tab-window-dim";

/**
 * Class that represents a guitar effect.
 * Note that this '-Element' class does not have tests
 * That is because 100% of this class is building svg paths
 * which amounts to placing numbers into predetermined path strings.
 * The checking of whether this element class works correctly happens
 * when examining render results
 */
export class GuitarEffectElement {
  /**
   * Width of an arrow (applicable to bends)
   */
  readonly arrowWidth: number = 5;
  /**
   * Height of an arrow (applicable to bends)
   */
  readonly arrowHeight: number = 8;
  /**
   * Effect
   */
  readonly effect: GuitarEffect;
  /**
   * String number (for bends)
   */
  readonly stringNum: number;
  /**
   * Rect
   */
  readonly dim: TabWindowDim;
  /**
   * Starting point (center of the provided rect)
   */
  private _startPoint: Point;
  /**
   * Effect rect
   */
  private _rect?: Rect;
  /**
   * Image source
   */
  private _src?: string;
  /**
   * SVG path (full path HTML including styling,
   * i.e. transparent/non-transparent)
   */
  private _pathFullHTML?: string;

  /**
   * Class that represents a guitar effect
   * @param effect Effect
   * @param stringNum String number
   * @param rect Rect
   * @param dim Tab window dimensions
   */
  constructor(
    effect: GuitarEffect,
    stringNum: number,
    rect: Rect,
    dim: TabWindowDim
  ) {
    this.effect = effect;
    this.stringNum = stringNum;
    this._rect = rect;
    this.dim = dim;

    this._startPoint = new Point(
      this._rect.x + this._rect.width / 2,
      this._rect.y + this._rect.height / 2
    );

    this.calc();
  }

  /**
   * Builds a full HTML SVG path of a vertical arrow
   * @param dx Distance to move by initially on the X-axis
   * @param dy Distance to move by initially on the Y-axis
   * @param pointTop True if arrow points up, false otherwise. Defaults to true
   * @returns A full HTML SVG path of a vertical arrow
   */
  private verticalArrowSVGHTML(
    dx: number,
    dy: number,
    pointTop: boolean = true
  ): string {
    const topCoef = pointTop ? 1 : -1;
    return (
      // Path opening tag #2
      ' <path d="' +
      // Arrow
      `m ${dx} ${dy}` +
      ` l ${this.arrowWidth / 2} 0` +
      ` l -${this.arrowWidth / 2} ${(this.arrowHeight / 2) * -1 * topCoef}` +
      ` l -${this.arrowWidth / 2} ${(this.arrowHeight / 2) * topCoef}` +
      ` l ${this.arrowWidth / 2} 0` +
      '" stroke="black" fill="black"/>'
    );
  }

  /**
   * Builds a path for an up aimed curve (used for bends)
   * @param dx How much to move on the X-axis prior to building
   * @param dy How much to move on the Y-axis prior to building
   * @param width Width of the effect
   * @param verticalOffset Vertical distance to the top string line
   * @returns Constructed SVG path HTML element
   */
  private upCurve(
    dx: number,
    dy: number,
    width: number,
    verticalOffset: number
  ): string {
    // const curveBeginX = dx + this._rect.width / 2;
    const curveBeginX = dx + width;
    const curveBeginY = dy;
    const curveMiddleX = curveBeginX;
    const curveMiddleY = dy - verticalOffset;
    const curveEndX = curveMiddleX;
    const curveEndY = curveMiddleY;

    return (
      // Path opening tag
      '<path d="' +
      // Bend curve
      `m ${dx} ${dy} ` +
      ` C ${curveBeginX} ${curveBeginY}` +
      ` ${curveMiddleX} ${curveMiddleY}` +
      ` ${curveEndX} ${curveEndY}` +
      // Bend styling & tag close
      '" stroke="black" fill="transparent"/>'
    );
  }

  /**
   * Builds a path for a down aimed curve (used for bends)
   * @param dx How much to move on the X-axis prior to building
   * @param dy How much to move on the Y-axis prior to building
   * @param width Width of the effect
   * @param height Height for the curve building
   * @param verticalOffset Vertical distance to the top string line
   * @returns Constructed SVG path HTML element
   */
  private downCurve(
    dx: number,
    dy: number,
    width: number,
    height: number,
    verticalOffset: number
  ): string {
    const curveBeginX = dx + width;
    const curveBeginY = dy - height;
    const curveMiddleX = curveBeginX;
    const curveMiddleY = curveBeginY + verticalOffset;
    const curveEndX = curveMiddleX;
    const curveEndY = curveMiddleY + height;

    return (
      '<path d="' +
      `m ${dx} ${dy} ` +
      ` C ${curveBeginX} ${curveBeginY} ` +
      ` ${curveMiddleX} ${curveMiddleY} ` +
      ` ${curveEndX} ${curveEndY}` +
      // Bend styling & tag close
      '" stroke="black" fill="transparent"/>'
    );
  }

  /**
   * Builds a regular straight line
   * @param dx How much to move on the X-axis prior to building
   * @param dy How much to move on the Y-axis prior to building
   * @param height Height of the line
   * @param pointTop Where should the line point to, i.e. where to draw: up or down
   * @returns Constructed SVG path HTML element
   */
  private vertLine(
    dx: number,
    dy: number,
    height: number,
    pointTop: boolean = true
  ): string {
    const topCoef = pointTop ? -1 : 1;

    return (
      '<path d="' +
      `m ${dx} ${dy} ` +
      ` l 0 ${height * topCoef}` +
      '" stroke="black" fill="transparent"/>'
    );
  }

  /**
   * Build a regular bend path SVG path HTML element
   */
  private calcBendPath(): void {
    const verticalOffset =
      this._rect.height * (this.stringNum - 1) + this._rect.height / 2;

    const x = this._startPoint.x;
    const y = this._startPoint.y;
    const curve = this.upCurve(x, y, this._rect.width / 2, verticalOffset);

    const arrowX = x + this._rect.width / 2;
    const arrowY = y - verticalOffset;
    const arrow = this.verticalArrowSVGHTML(arrowX, arrowY);

    this._pathFullHTML = curve + arrow;
  }

  /**
   * Build a bend-and-release path SVG path HTML element
   */
  private calcBendAndReleasePath(): void {
    const verticalOffset =
      this._rect.height * (this.stringNum - 1) + this._rect.height / 2;

    // Step 1: build bend curve
    const bendX = this._startPoint.x;
    const bendY = this._startPoint.y;
    const bendCurve = this.upCurve(
      bendX,
      bendY,
      this._rect.width / 2,
      verticalOffset
    );

    // Step 2: build bend arrow
    const bendArrowX = bendX + this._rect.width / 2;
    const bendArrowY = bendY - verticalOffset;
    const bendArrow = this.verticalArrowSVGHTML(bendArrowX, bendArrowY);

    // Step 3: build release curve
    const releaseX = bendX + this._rect.width / 2;
    const releaseY = bendY - verticalOffset;
    const releaseCurve = this.downCurve(
      releaseX,
      releaseY,
      this._rect.width / 4,
      this._rect.height / 4,
      verticalOffset
    );

    // Step 4: build release arrow
    const releaseArrowX = releaseX + this._rect.width / 4;
    const releaseArrowY = releaseY + verticalOffset;
    const releaseArrow = this.verticalArrowSVGHTML(
      releaseArrowX,
      releaseArrowY,
      false
    );

    this._pathFullHTML = bendCurve + bendArrow + releaseCurve + releaseArrow;
  }

  /**
   * Build a prebend path SVG path HTML element
   */
  private calcPrebendPath(): void {
    const verticalOffset =
      this._rect.height * (this.stringNum - 1) + this._rect.height / 2;

    // Step 1: build line
    const prebendLineX = this._startPoint.x + this._rect.width / 4;
    const prebendLineY = this._startPoint.y;
    const lineHeight = verticalOffset;
    const prebendLine = this.vertLine(prebendLineX, prebendLineY, lineHeight);

    // Step 2: build line arrow
    const lineArrowX = prebendLineX;
    const lineArrowY = prebendLineY - lineHeight;
    const lineArrow = this.verticalArrowSVGHTML(lineArrowX, lineArrowY);

    this._pathFullHTML = prebendLine + lineArrow;
  }

  /**
   * Build a prebend-and-release path SVG path HTML element
   */
  private calcPrebendAndReleasePath(): void {
    const verticalOffset =
      this._rect.height * (this.stringNum - 1) + this._rect.height / 2;

    // Step 1: build line
    const prebendLineX = this._startPoint.x + this._rect.width / 4;
    const prebendLineY = this._startPoint.y;
    const lineHeight = verticalOffset;
    const prebendLine = this.vertLine(prebendLineX, prebendLineY, lineHeight);

    // Step 2: build line arrow
    const lineArrowX = prebendLineX;
    const lineArrowY = prebendLineY - lineHeight;
    const lineArrow = this.verticalArrowSVGHTML(lineArrowX, lineArrowY);

    // Step 3: build release curve
    const releaseX = lineArrowX;
    const releaseY = lineArrowY;
    const releaseCurve = this.downCurve(
      releaseX,
      releaseY,
      this._rect.width / 4,
      this._rect.height / 4,
      verticalOffset
    );

    // Step 4: build release arrow
    const releaseArrowX = releaseX + this._rect.width / 4;
    const releaseArrowY = releaseY + verticalOffset;
    const releaseArrow = this.verticalArrowSVGHTML(
      releaseArrowX,
      releaseArrowY,
      false
    );

    this._pathFullHTML = prebendLine + lineArrow + releaseCurve + releaseArrow;
  }

  /**
   * Calculates rectangle depending on effect type
   */
  private calc(): void {
    // Calc offsets & assign image paths
    switch (this.effect.effectType) {
      case GuitarEffectType.Bend:
        this.calcBendPath();
        break;
      case GuitarEffectType.BendAndRelease:
        this.calcBendAndReleasePath();
        break;
      case GuitarEffectType.Prebend:
        this.calcPrebendPath();
        break;
      case GuitarEffectType.PrebendAndRelease:
        this.calcPrebendAndReleasePath();
        break;
      case GuitarEffectType.Vibrato:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.SlideStart:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.SlideEnd:
        this._rect = undefined;
        this._src = undefined;
        break;
      case GuitarEffectType.HammerOnStart:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.HammerOnEnd:
        this._rect = undefined;
        this._src = undefined;
        break;
      case GuitarEffectType.PullOffStart:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.PullOffEnd:
        this._rect = undefined;
        this._src = undefined;
        break;
      case GuitarEffectType.PinchHarmonic:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.NaturalHarmonic:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.PalmMute:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
    }
  }

  /**
   * Scales guitar effect element horizontally
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    if (scale <= 0) {
      // if (scale <= 0 || (scale > 0 && scale < 1)) {
      throw Error(
        `${scale} is an invalid scale: scale must be positive AND >= 1`
      );
    }

    this.rect.x *= scale;
    this.rect.width *= scale;
  }

  /**
   * Effect rect
   */
  public get rect(): Rect {
    return this._rect;
  }

  /**
   * Image source
   */
  public get src(): string {
    return this._src;
  }

  /**
   * SVG Path
   */
  public get pathFullHTML(): string | undefined {
    return this._pathFullHTML;
  }
}
