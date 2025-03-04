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
   * Note's rect
   */
  private _noteRect?: Rect;
  /**
   * Effect element's rect
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
  private _fullHTML?: string;

  /**
   * Class that represents a guitar effect
   * @param effect Effect
   * @param stringNum String number
   * @param noteRect Note rectangle
   * @param dim Tab window dimensions
   */
  constructor(
    effect: GuitarEffect,
    stringNum: number,
    noteRect: Rect,
    dim: TabWindowDim
  ) {
    this.effect = effect;
    this.stringNum = stringNum;
    this._noteRect = noteRect;
    this._rect = undefined;
    this.dim = dim;

    this._startPoint = new Point(
      this._noteRect.x + this._noteRect.width / 2,
      this._noteRect.y + this._noteRect.height / 2
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
    // const curveBeginX = dx + this._noteRect.width / 2;
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
   * Builds a path for a horizontal curve (used for hammer-ons/pull-offs)
   * @param dx How much to move on the X-axis prior to building
   * @param dy How much to move on the Y-axis prior to building
   * @param width Width of the effect
   * @param height Height for the curve building
   * @returns Constructed SVG path HTML element
   */
  private horizontalCurve(
    dx: number,
    dy: number,
    width: number,
    height: number
  ): string {
    const curveBeginX = dx;
    const curveBeginY = dy - height;
    const curveMiddleX = curveBeginX + width;
    const curveMiddleY = curveBeginY;
    const curveEndX = curveMiddleX;
    const curveEndY = curveMiddleY + height;

    return (
      '<path d="' +
      `m ${dx} ${dy} ` +
      ` C ${curveBeginX} ${curveBeginY} ` +
      ` ${curveMiddleX} ${curveMiddleY} ` +
      ` ${curveEndX} ${curveEndY}` +
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
   * Builds a straight line
   * @param dx1 Point 1 X (start)
   * @param dy1 Point 1 Y (start)
   * @param dx2 Point 2 X (end)
   * @param dy2 Point 2 Y (end)
   * @returns Constructed SVG path HTML element
   */
  private line(dx1: number, dy1: number, dx2: number, dy2: number): string {
    return (
      '<path d="' +
      `m ${dx1} ${dy1} ` +
      `L ${dx2} ${dy2} ` +
      '" stroke="black" fill="transparent" stroke-linecap="round"/>'
    );
  }

  /**
   * Builds a harmonic shape
   * @param dx How much to move on the X-axis prior to building
   * @param dy How much to move on the Y-axis prior to building
   * @param width Width of the effect
   * @param height Height for the curve building
   * @param fill True if the shape should be filled, false otherwise
   * @returns Constructed SVG path HTML element
   */
  private harmonicShape(
    dx: number,
    dy: number,
    width: number,
    height: number,
    fill: boolean
  ): string {
    const line1X = dx + width / 2;
    const line1Y = dy - height / 2;
    const line2X = line1X + width / 2;
    const line2Y = line1Y + height / 2;
    const line3X = line2X - width / 2;
    const line3Y = line2Y + height / 2;
    const line4X = line3X - width / 2;
    const line4Y = line3Y - height / 2;
    const fillColor = fill ? "black" : "transparent";

    return (
      '<path d="' +
      `m ${dx} ${dy} ` +
      ` L ${line1X} ${line1Y} ` +
      ` L ${line2X} ${line2Y} ` +
      ` L ${line3X} ${line3Y} ` +
      ` L ${line4X} ${line4Y}` +
      `" stroke="black" fill="${fillColor}"/>`
    );
  }

  /**
   * Builds a vibrato shape
   * @param dx How much to move on the X-axis prior to building
   * @param dy How much to move on the Y-axis prior to building
   * @param width Width of the effect
   * @param height Height for the curve building
   * @returns Constructed SVG path HTML element
   */
  private vibratoShape(
    dx: number,
    dy: number,
    width: number,
    height: number
  ): string {
    const lines = [
      [dx + width / 8, dy - height / 2],
      [dx + 2 * (width / 8), dy + height / 2],
      [dx + 3 * (width / 8), dy - height / 2],
      [dx + 4 * (width / 8), dy + height / 2],
      [dx + 5 * (width / 8), dy - height / 2],
      [dx + 6 * (width / 8), dy + height / 2],
      [dx + 7 * (width / 8), dy - height / 2],
      [dx + 8 * (width / 8), dy + height / 2],
    ];

    return (
      '<path d="' +
      `m ${dx} ${dy + height / 2} ` +
      ` L ${lines[0][0]} ${lines[0][1]} ` +
      ` L ${lines[1][0]} ${lines[1][1]} ` +
      ` L ${lines[2][0]} ${lines[2][1]} ` +
      ` L ${lines[3][0]} ${lines[3][1]} ` +
      ` L ${lines[4][0]} ${lines[4][1]} ` +
      ` L ${lines[5][0]} ${lines[5][1]} ` +
      ` L ${lines[6][0]} ${lines[6][1]} ` +
      ` L ${lines[7][0]} ${lines[7][1]}` +
      '" stroke="black" fill="transparent" stroke-linecap="round"/>'
    );
  }

  /**
   * Build a regular bend path SVG path HTML element
   */
  private calcBendPath(): void {
    const verticalOffset =
      this._noteRect.height * (this.stringNum - 1) + this._noteRect.height / 2;

    const x = this._startPoint.x;
    const y = this._startPoint.y;
    const curve = this.upCurve(x, y, this._noteRect.width / 2, verticalOffset);

    const arrowX = x + this._noteRect.width / 2;
    const arrowY = y - verticalOffset;
    const arrow = this.verticalArrowSVGHTML(arrowX, arrowY);

    this._fullHTML = curve + arrow;
  }

  /**
   * Build a bend-and-release path SVG path HTML element
   */
  private calcBendAndReleasePath(): void {
    const verticalOffset =
      this._noteRect.height * (this.stringNum - 1) + this._noteRect.height / 2;

    // Step 1: build bend curve
    const bendX = this._startPoint.x;
    const bendY = this._startPoint.y;
    const bendCurve = this.upCurve(
      bendX,
      bendY,
      this._noteRect.width / 2,
      verticalOffset
    );

    // Step 2: build bend arrow
    const bendArrowX = bendX + this._noteRect.width / 2;
    const bendArrowY = bendY - verticalOffset;
    const bendArrow = this.verticalArrowSVGHTML(bendArrowX, bendArrowY);

    // Step 3: build release curve
    const releaseX = bendX + this._noteRect.width / 2;
    const releaseY = bendY - verticalOffset;
    const releaseCurve = this.downCurve(
      releaseX,
      releaseY,
      this._noteRect.width / 4,
      this._noteRect.height / 4,
      verticalOffset
    );

    // Step 4: build release arrow
    const releaseArrowX = releaseX + this._noteRect.width / 4;
    const releaseArrowY = releaseY + verticalOffset;
    const releaseArrow = this.verticalArrowSVGHTML(
      releaseArrowX,
      releaseArrowY,
      false
    );

    this._fullHTML = bendCurve + bendArrow + releaseCurve + releaseArrow;
  }

  /**
   * Build a prebend path SVG path HTML element
   */
  private calcPrebendPath(): void {
    const verticalOffset =
      this._noteRect.height * (this.stringNum - 1) + this._noteRect.height / 2;

    // Step 1: build line
    const prebendLineX = this._startPoint.x + this._noteRect.width / 4;
    const prebendLineY = this._startPoint.y;
    const lineHeight = verticalOffset;
    const prebendLine = this.vertLine(prebendLineX, prebendLineY, lineHeight);

    // Step 2: build line arrow
    const lineArrowX = prebendLineX;
    const lineArrowY = prebendLineY - lineHeight;
    const lineArrow = this.verticalArrowSVGHTML(lineArrowX, lineArrowY);

    this._fullHTML = prebendLine + lineArrow;
  }

  /**
   * Build a prebend-and-release path SVG path HTML element
   */
  private calcPrebendAndReleasePath(): void {
    const verticalOffset =
      this._noteRect.height * (this.stringNum - 1) + this._noteRect.height / 2;

    // Step 1: build line
    const prebendLineX = this._startPoint.x + this._noteRect.width / 4;
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
      this._noteRect.width / 4,
      this._noteRect.height / 4,
      verticalOffset
    );

    // Step 4: build release arrow
    const releaseArrowX = releaseX + this._noteRect.width / 4;
    const releaseArrowY = releaseY + verticalOffset;
    const releaseArrow = this.verticalArrowSVGHTML(
      releaseArrowX,
      releaseArrowY,
      false
    );

    this._fullHTML = prebendLine + lineArrow + releaseCurve + releaseArrow;
  }

  /**
   * Calc vibrato path
   */
  private calcVibratoPath(): void {
    const vibratoWidth = this.dim.noteTextSize * 2;
    const vibratoHeight = this.dim.noteTextSize / 4;
    const vibratoStartX = this._startPoint.x + (3 * this.dim.noteTextSize) / 4;
    const vibratoStartY = this._startPoint.y;
    const vibratoLine = this.vibratoShape(
      vibratoStartX,
      vibratoStartY,
      vibratoWidth,
      vibratoHeight
    );

    this._rect = new Rect(
      vibratoStartX,
      vibratoStartY - vibratoHeight / 2,
      vibratoWidth,
      vibratoHeight
    );

    this._fullHTML = vibratoLine;
  }

  /**
   * Calc slide path
   */
  private calcSlidePath(): void {
    if (
      this.effect.options === undefined ||
      this.effect.options.nextHigher === undefined
    ) {
      throw Error("Slide effect has no options or next note pitch indicator");
    }

    const upCoef = this.effect.options.nextHigher ? 1 : -1;

    const slideWidth = this._noteRect.width - this.dim.noteTextSize;
    const slideHeight = this._noteRect.height / 3;
    const slideStartX = this._startPoint.x + this.dim.noteTextSize / 2;
    const slideStartY = this._startPoint.y - (slideHeight / 2) * upCoef;
    const slideEndX = slideStartX + slideWidth;
    const slideEndY = slideStartY + slideHeight * upCoef;
    const slideLine = this.line(slideStartX, slideStartY, slideEndX, slideEndY);

    this._fullHTML = slideLine;
  }

  /**
   * Calc hammer-on or pull-off path
   */
  private calcHammerOnOrPullOffPath(): void {
    const hpStartX = this._startPoint.x;
    const hpStartY = this._startPoint.y;
    const hpWidth = this._noteRect.width;
    const hpHeight = this._noteRect.height / 2;
    const slideLine = this.horizontalCurve(
      hpStartX,
      hpStartY,
      hpWidth,
      hpHeight
    );

    this._rect = new Rect(hpStartX, hpStartY, hpWidth, hpHeight);

    this._fullHTML = slideLine;
  }

  /**
   * Calc natural harmonic path
   */
  private calcNaturalHarmonicPath(): void {
    const nhStartX = this._startPoint.x - 5 * (this.dim.noteTextSize / 4);
    const nhStartY = this._startPoint.y;
    const nhWidth = this.dim.noteTextSize / 2;
    const nhHeight = this.dim.noteTextSize / 2;
    const nhLine = this.harmonicShape(
      nhStartX,
      nhStartY,
      nhWidth,
      nhHeight,
      false
    );

    this._rect = new Rect(nhStartX, nhStartY - nhHeight / 2, nhWidth, nhHeight);

    this._fullHTML = nhLine;
  }

  /**
   * Calc pinch harmonic path
   */
  private calcPinchHarmonicPath(): void {
    const phStartX = this._startPoint.x - 5 * (this.dim.noteTextSize / 4);
    const phStartY = this._startPoint.y;
    const phWidth = this.dim.noteTextSize / 2;
    const phHeight = this.dim.noteTextSize / 2;
    const phLine = this.harmonicShape(
      phStartX,
      phStartY,
      phWidth,
      phHeight,
      true
    );

    this._rect = new Rect(phStartX, phStartY - phHeight / 2, phWidth, phHeight);

    this._fullHTML = phLine;
  }

  /**
   * Calc palm mute HTML
   */
  private calcPalmMuteHTML(): void {
    const pmX = this._startPoint.x + this.dim.noteTextSize;
    const pmY = this._startPoint.y - this.dim.noteTextSize / 2;

    this._rect = new Rect(
      pmX,
      pmY,
      this.dim.noteTextSize * 2,
      this.dim.noteTextSize
    );

    this._fullHTML =
      `<text x="${pmX}" y="${pmY}" ` +
      ` fill="black" font-size="${this.dim.noteTextSize}" font-style="oblique"` +
      `text-anchor="start" dominant-baseline="hanging">P.M.</text>`;
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
        this.calcVibratoPath();
        break;
      case GuitarEffectType.Slide:
        this.calcSlidePath();
        break;
      case GuitarEffectType.HammerOnOrPullOff:
        this.calcHammerOnOrPullOffPath();
        break;
      case GuitarEffectType.PinchHarmonic:
        this.calcPinchHarmonicPath();
        break;
      case GuitarEffectType.NaturalHarmonic:
        this.calcNaturalHarmonicPath();
        break;
      case GuitarEffectType.PalmMute:
        this.calcPalmMuteHTML();
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
  public get fullHTML(): string | undefined {
    return this._fullHTML;
  }
}
