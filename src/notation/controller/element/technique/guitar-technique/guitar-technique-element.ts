import {
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
} from "@/notation/model";
import { Point, Rect, randomInt } from "@/shared";
import { SVGUtils } from "./guitar-technique-html";
import { GuitarNoteElement } from "../../guitar-note-element";
import { TabLayoutDimensions } from "@/notation/controller/tab-controller-dim";
import { TechniqueElement } from "../technique-element";

/**
 * Class that handles geometry & visually relevant
 * info of a guitar note technique.
 * Represents specifically a UI element near the note
 * to which the technique is applied
 */
export class GuitarTechniqueElement implements TechniqueElement {
  /** Guitar note element's unique identifier */
  readonly uuid: number;
  /** Technique */
  readonly technique: GuitarTechnique;
  /** Parent guitar note element */
  readonly guitarNoteElement: GuitarNoteElement;

  /** Starting point (center of the provided rect) */
  private _startPoint: Point;
  /** Technique element's rect */
  private _rect?: Rect;
  /** Image source */
  private _src?: string;
  /** SVG path */
  private _svgPath?: string;

  /**
   * Class that represents a guitar technique
   * @param technique Technique
   * @param guitarNoteElement Parent note element
   */
  constructor(
    technique: GuitarTechnique,
    guitarNoteElement: GuitarNoteElement
  ) {
    this.uuid = randomInt();
    this.technique = technique;
    this.guitarNoteElement = guitarNoteElement;

    this._rect = new Rect();

    this._startPoint = new Point(
      this.guitarNoteElement.rect.x + this.guitarNoteElement.rect.width / 2,
      this.guitarNoteElement.rect.y + this.guitarNoteElement.rect.height / 2
    );

    this.calc();
  }

  /**
   * Build a regular bend path SVG path HTML element
   */
  private calcBendPath(): void {
    const stringNum = this.guitarNoteElement.note.stringNum;
    const verticalOffset =
      this.guitarNoteElement.rect.height * (stringNum - 1) +
      this.guitarNoteElement.rect.height / 2;

    const x = this._startPoint.x;
    const y = this._startPoint.y;
    const curve = SVGUtils.upCurveSVGHTML(
      x,
      y,
      this.guitarNoteElement.rect.width / 2,
      verticalOffset
    );

    const arrowX = x + this.guitarNoteElement.rect.width / 2;
    const arrowY = y - verticalOffset;
    const arrow = SVGUtils.verticalArrowSVGHTML(arrowX, arrowY);

    this._svgPath = curve + arrow;
  }

  /**
   * Build a bend-and-release path SVG path HTML element
   */
  private calcBendAndReleasePath(): void {
    const stringNum = this.guitarNoteElement.note.stringNum;
    const verticalOffset =
      this.guitarNoteElement.rect.height * (stringNum - 1) +
      this.guitarNoteElement.rect.height / 2;

    // Step 1: build bend curve
    const bendX = this._startPoint.x;
    const bendY = this._startPoint.y;
    const bendCurve = SVGUtils.upCurveSVGHTML(
      bendX,
      bendY,
      this.guitarNoteElement.rect.width / 2,
      verticalOffset
    );

    // Step 2: build bend arrow
    const bendArrowX = bendX + this.guitarNoteElement.rect.width / 2;
    const bendArrowY = bendY - verticalOffset;
    const bendArrow = SVGUtils.verticalArrowSVGHTML(bendArrowX, bendArrowY);

    // Step 3: build release curve
    const releaseX = bendX + this.guitarNoteElement.rect.width / 2;
    const releaseY = bendY - verticalOffset;
    const releaseCurve = SVGUtils.downCurveSVGHTML(
      releaseX,
      releaseY,
      this.guitarNoteElement.rect.width / 4,
      this.guitarNoteElement.rect.height / 4,
      verticalOffset
    );

    // Step 4: build release arrow
    const releaseArrowX = releaseX + this.guitarNoteElement.rect.width / 4;
    const releaseArrowY = releaseY + verticalOffset;
    const releaseArrow = SVGUtils.verticalArrowSVGHTML(
      releaseArrowX,
      releaseArrowY,
      false
    );

    this._svgPath = bendCurve + bendArrow + releaseCurve + releaseArrow;
  }

  /**
   * Build a prebend path SVG path HTML element
   */
  private calcPrebendPath(): void {
    const stringNum = this.guitarNoteElement.note.stringNum;
    const verticalOffset =
      this.guitarNoteElement.rect.height * (stringNum - 1) +
      this.guitarNoteElement.rect.height / 2;

    // Step 1: build line
    const prebendLineX =
      this._startPoint.x + this.guitarNoteElement.rect.width / 4;
    const prebendLineY = this._startPoint.y;
    const lineHeight = verticalOffset;
    const prebendLine = SVGUtils.vertLineSVGHTML(
      prebendLineX,
      prebendLineY,
      lineHeight
    );

    // Step 2: build line arrow
    const lineArrowX = prebendLineX;
    const lineArrowY = prebendLineY - lineHeight;
    const lineArrow = SVGUtils.verticalArrowSVGHTML(lineArrowX, lineArrowY);

    this._svgPath = prebendLine + lineArrow;
  }

  /**
   * Build a prebend-and-release path SVG path HTML element
   */
  private calcPrebendAndReleasePath(): void {
    const stringNum = this.guitarNoteElement.note.stringNum;
    const verticalOffset =
      this.guitarNoteElement.rect.height * (stringNum - 1) +
      this.guitarNoteElement.rect.height / 2;

    // Step 1: build line
    const prebendLineX =
      this._startPoint.x + this.guitarNoteElement.rect.width / 4;
    const prebendLineY = this._startPoint.y;
    const lineHeight = verticalOffset;
    const prebendLine = SVGUtils.vertLineSVGHTML(
      prebendLineX,
      prebendLineY,
      lineHeight
    );

    // Step 2: build line arrow
    const lineArrowX = prebendLineX;
    const lineArrowY = prebendLineY - lineHeight;
    const lineArrow = SVGUtils.verticalArrowSVGHTML(lineArrowX, lineArrowY);

    // Step 3: build release curve
    const releaseX = lineArrowX;
    const releaseY = lineArrowY;
    const releaseCurve = SVGUtils.downCurveSVGHTML(
      releaseX,
      releaseY,
      this.guitarNoteElement.rect.width / 4,
      this.guitarNoteElement.rect.height / 4,
      verticalOffset
    );

    // Step 4: build release arrow
    const releaseArrowX = releaseX + this.guitarNoteElement.rect.width / 4;
    const releaseArrowY = releaseY + verticalOffset;
    const releaseArrow = SVGUtils.verticalArrowSVGHTML(
      releaseArrowX,
      releaseArrowY,
      false
    );

    this._svgPath = prebendLine + lineArrow + releaseCurve + releaseArrow;
  }

  /**
   * Calc slide path
   */
  private calcSlidePath(): void {
    if (this.guitarNoteElement.note.fret === null) {
      return;
    }

    const staff = this.guitarNoteElement.note.beat.bar.staff;
    const nextBeat = staff.getNextBeat(this.guitarNoteElement.note.beat);
    if (nextBeat === null) {
      return;
    }

    const nextNote = nextBeat.notes[
      this.guitarNoteElement.note.stringNum - 1
    ] as GuitarNote;
    if (nextNote.fret === null) {
      return;
    }

    const upCoef = nextNote.fret >= this.guitarNoteElement.note.fret ? 1 : -1;

    const slideWidth =
      this.guitarNoteElement.rect.width - TabLayoutDimensions.NOTE_TEXT_SIZE;
    const slideHeight = this.guitarNoteElement.rect.height / 3;
    const slideStartX =
      this._startPoint.x + TabLayoutDimensions.NOTE_TEXT_SIZE / 2;
    const slideStartY = this._startPoint.y - (slideHeight / 2) * upCoef;
    const slideEndX = slideStartX + slideWidth;
    const slideEndY = slideStartY + slideHeight * upCoef;
    const slideLine = SVGUtils.lineSVGHTML(
      slideStartX,
      slideStartY,
      slideEndX,
      slideEndY
    );

    this._svgPath = slideLine;
  }

  /**
   * Calc hammer-on or pull-off path
   */
  private calcHammerOnOrPullOffPath(): void {
    const hpStartX = this._startPoint.x;
    const hpStartY = this._startPoint.y;
    const hpWidth = this.guitarNoteElement.rect.width;
    const hpHeight = this.guitarNoteElement.rect.height / 2;
    const slideLine = SVGUtils.horizontalCurveSVGHTML(
      hpStartX,
      hpStartY,
      hpWidth,
      hpHeight
    );

    this._rect = new Rect(hpStartX, hpStartY, hpWidth, hpHeight);

    this._svgPath = slideLine;
  }

  /**
   * Calc natural harmonic path
   */
  private calcNaturalHarmonicPath(): void {
    const nhStartX =
      this._startPoint.x - 5 * (TabLayoutDimensions.NOTE_TEXT_SIZE / 4);
    const nhStartY = this._startPoint.y;
    const nhWidth = TabLayoutDimensions.NOTE_TEXT_SIZE / 2;
    const nhHeight = TabLayoutDimensions.NOTE_TEXT_SIZE / 2;
    const nhLine = SVGUtils.harmonicShapeSVGHTML(
      nhStartX,
      nhStartY,
      nhWidth,
      nhHeight,
      false
    );

    this._rect = new Rect(nhStartX, nhStartY - nhHeight / 2, nhWidth, nhHeight);

    this._svgPath = nhLine;
  }

  /**
   * Calc pinch harmonic path
   */
  private calcPinchHarmonicPath(): void {
    const phStartX =
      this._startPoint.x - 5 * (TabLayoutDimensions.NOTE_TEXT_SIZE / 4);
    const phStartY = this._startPoint.y;
    const phWidth = TabLayoutDimensions.NOTE_TEXT_SIZE / 2;
    const phHeight = TabLayoutDimensions.NOTE_TEXT_SIZE / 2;
    const phLine = SVGUtils.harmonicShapeSVGHTML(
      phStartX,
      phStartY,
      phWidth,
      phHeight,
      true
    );

    this._rect = new Rect(phStartX, phStartY - phHeight / 2, phWidth, phHeight);

    this._svgPath = phLine;
  }

  /**
   * Calculate path for a specific bend type
   */
  private calcBendTechPath(): void {
    switch (this.technique.bendOptions?.type) {
      case BendType.Bend:
        this.calcBendPath();
        break;
      case BendType.BendAndRelease:
        this.calcBendAndReleasePath();
        break;
      case BendType.Prebend:
        this.calcPrebendPath();
        break;
      case BendType.PrebendAndRelease:
        this.calcPrebendAndReleasePath();
        break;
      default:
        throw Error("Bend without optoons");
    }
  }

  /**
   * Calculates rectangle depending on technique type
   */
  public calc(): void {
    this._startPoint = new Point(
      this.guitarNoteElement.rect.x + this.guitarNoteElement.rect.width / 2,
      this.guitarNoteElement.rect.y + this.guitarNoteElement.rect.height / 2
    );

    // Calc offsets & assign image paths
    switch (this.technique.type) {
      case GuitarTechniqueType.Bend:
        this.calcBendTechPath();
        break;
      case GuitarTechniqueType.Slide:
        this.calcSlidePath();
        break;
      case GuitarTechniqueType.HammerOnOrPullOff:
        this.calcHammerOnOrPullOffPath();
        break;
      case GuitarTechniqueType.PinchHarmonic:
        this.calcPinchHarmonicPath();
        break;
      case GuitarTechniqueType.NaturalHarmonic:
        this.calcNaturalHarmonicPath();
        break;
      default:
        this._svgPath = undefined;
        break;
    }
  }

  /**
   * Scales the technique element horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    this._startPoint.x *= scale;

    this.calc();
  }

  /** Technique rect */
  public get rect(): Rect | undefined {
    return this._rect;
  }

  /** Image source */
  public get src(): string | undefined {
    return this._src;
  }

  /** SVG Path */
  public get svgPath(): string | undefined {
    return this._svgPath;
  }

  /** Global coords of the guitar technique element */
  public get globalCoords(): Point {
    if (this._rect === undefined) {
      return new Point(
        this.guitarNoteElement.globalCoords.x,
        this.guitarNoteElement.globalCoords.y
      );
    }

    return new Point(
      this.guitarNoteElement.globalCoords.x + this._rect.x,
      this.guitarNoteElement.globalCoords.y + this._rect.y
    );
  }
}
