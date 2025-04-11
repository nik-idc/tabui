import { GuitarEffect } from "../../../models/guitar-effect/guitar-effect";
import { GuitarEffectType } from "../../../models/guitar-effect/guitar-effect-type";
import { Point } from "../../shapes/point";
import { Rect } from "../../shapes/rect";
import { TabWindowDim } from "../../tab-window-dim";
import { SVGUtils } from "./effects-html";

/**
 * Class that represents a guitar effect.
 * Represents specifically a UI element near the note
 * to which the effect is applied
 */
export class GuitarEffectElement {
  /**
   * Effect
   */
  readonly effect: GuitarEffect;
  /**
   * String number (for bends)
   */
  readonly stringNum: number;
  /**
   * Tab window dimensions
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
   * Effects HTML generator
   */
  private _svgUtils: SVGUtils;

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
    this._svgUtils = new SVGUtils();

    this._startPoint = new Point(
      this._noteRect.x + this._noteRect.width / 2,
      this._noteRect.y + this._noteRect.height / 2
    );

    this.calc();
  }

  /**
   * Build a regular bend path SVG path HTML element
   */
  private calcBendPath(): void {
    const verticalOffset =
      this._noteRect.height * (this.stringNum - 1) + this._noteRect.height / 2;

    const x = this._startPoint.x;
    const y = this._startPoint.y;
    const curve = this._svgUtils.upCurveSVGHTML(
      x,
      y,
      this._noteRect.width / 2,
      verticalOffset
    );

    const arrowX = x + this._noteRect.width / 2;
    const arrowY = y - verticalOffset;
    const arrow = this._svgUtils.verticalArrowSVGHTML(arrowX, arrowY);

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
    const bendCurve = this._svgUtils.upCurveSVGHTML(
      bendX,
      bendY,
      this._noteRect.width / 2,
      verticalOffset
    );

    // Step 2: build bend arrow
    const bendArrowX = bendX + this._noteRect.width / 2;
    const bendArrowY = bendY - verticalOffset;
    const bendArrow = this._svgUtils.verticalArrowSVGHTML(
      bendArrowX,
      bendArrowY
    );

    // Step 3: build release curve
    const releaseX = bendX + this._noteRect.width / 2;
    const releaseY = bendY - verticalOffset;
    const releaseCurve = this._svgUtils.downCurveSVGHTML(
      releaseX,
      releaseY,
      this._noteRect.width / 4,
      this._noteRect.height / 4,
      verticalOffset
    );

    // Step 4: build release arrow
    const releaseArrowX = releaseX + this._noteRect.width / 4;
    const releaseArrowY = releaseY + verticalOffset;
    const releaseArrow = this._svgUtils.verticalArrowSVGHTML(
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
    const prebendLine = this._svgUtils.vertLineSVGHTML(
      prebendLineX,
      prebendLineY,
      lineHeight
    );

    // Step 2: build line arrow
    const lineArrowX = prebendLineX;
    const lineArrowY = prebendLineY - lineHeight;
    const lineArrow = this._svgUtils.verticalArrowSVGHTML(
      lineArrowX,
      lineArrowY
    );

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
    const prebendLine = this._svgUtils.vertLineSVGHTML(
      prebendLineX,
      prebendLineY,
      lineHeight
    );

    // Step 2: build line arrow
    const lineArrowX = prebendLineX;
    const lineArrowY = prebendLineY - lineHeight;
    const lineArrow = this._svgUtils.verticalArrowSVGHTML(
      lineArrowX,
      lineArrowY
    );

    // Step 3: build release curve
    const releaseX = lineArrowX;
    const releaseY = lineArrowY;
    const releaseCurve = this._svgUtils.downCurveSVGHTML(
      releaseX,
      releaseY,
      this._noteRect.width / 4,
      this._noteRect.height / 4,
      verticalOffset
    );

    // Step 4: build release arrow
    const releaseArrowX = releaseX + this._noteRect.width / 4;
    const releaseArrowY = releaseY + verticalOffset;
    const releaseArrow = this._svgUtils.verticalArrowSVGHTML(
      releaseArrowX,
      releaseArrowY,
      false
    );

    this._fullHTML = prebendLine + lineArrow + releaseCurve + releaseArrow;
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
    const slideLine = this._svgUtils.lineSVGHTML(
      slideStartX,
      slideStartY,
      slideEndX,
      slideEndY
    );

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
    const slideLine = this._svgUtils.horizontalCurveSVGHTML(
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
    const nhLine = this._svgUtils.harmonicShapeSVGHTML(
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
    const phLine = this._svgUtils.harmonicShapeSVGHTML(
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
      default:
        this._fullHTML = undefined;
        break;
    }
  }

  public scaleHorBy(scale: number): void {
    this._startPoint.x *= scale;

    this.calc();
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
