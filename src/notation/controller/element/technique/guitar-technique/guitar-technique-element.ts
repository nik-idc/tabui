import {
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
} from "@/notation/model";
import { Point, Rect, randomInt } from "@/shared";
import { SVGUtils } from "./guitar-technique-html";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
import { TrackElement } from "@/notation/controller/element/track-element";
import { TechniqueElement } from "../technique-element";
import { TabNoteElement } from "../../note/tab-note-element";
import { TECHNIQUE_IS_INLINE } from "./guitar-technique-element-lists";

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
  readonly noteElement: TabNoteElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  /** Starting point (center of the provided rect) */
  private _startPoint: Point;
  /** SVG path */
  private _svgPath?: string;
  /** String encoding the state of this element */
  private _stateHash: string;

  /**
   * Class that represents a guitar technique
   * @param technique Technique
   * @param noteElement Parent note element
   */
  constructor(technique: GuitarTechnique, noteElement: TabNoteElement) {
    this.uuid = randomInt();
    this.technique = technique;
    this.noteElement = noteElement;
    this.trackElement = this.noteElement.trackElement;

    this._startPoint = new Point(
      this.noteElement.boundingBox.x + this.noteElement.boundingBox.width / 2,
      this.noteElement.boundingBox.y + this.noteElement.boundingBox.height / 2
    );

    this._stateHash = "";

    this.createPath();

    this.trackElement.registerElement(this);
  }

  /**
   * Build a regular bend path SVG path HTML element
   */
  private createBendPath(): void {
    const stringNum = this.noteElement.note.stringNum;
    const verticalOffset =
      this.noteElement.boundingBox.height * (stringNum - 1) +
      this.noteElement.boundingBox.height / 2;

    const x = this._startPoint.x;
    const y = this._startPoint.y;
    const curve = SVGUtils.upCurveSVGHTML(
      x,
      y,
      this.noteElement.boundingBox.width / 2,
      verticalOffset
    );

    const arrowX = x + this.noteElement.boundingBox.width / 2;
    const arrowY = y - verticalOffset;
    const arrow = SVGUtils.verticalArrowSVGHTML(arrowX, arrowY);

    this._svgPath = curve + arrow;
  }

  /**
   * Build a bend-and-release path SVG path HTML element
   */
  private createBendAndReleasePath(): void {
    const stringNum = this.noteElement.note.stringNum;
    const verticalOffset =
      this.noteElement.boundingBox.height * (stringNum - 1) +
      this.noteElement.boundingBox.height / 2;

    // Step 1: build bend curve
    const bendX = this._startPoint.x;
    const bendY = this._startPoint.y;
    const bendCurve = SVGUtils.upCurveSVGHTML(
      bendX,
      bendY,
      this.noteElement.boundingBox.width / 2,
      verticalOffset
    );

    // Step 2: build bend arrow
    const bendArrowX = bendX + this.noteElement.boundingBox.width / 2;
    const bendArrowY = bendY - verticalOffset;
    const bendArrow = SVGUtils.verticalArrowSVGHTML(bendArrowX, bendArrowY);

    // Step 3: build release curve
    const releaseX = bendX + this.noteElement.boundingBox.width / 2;
    const releaseY = bendY - verticalOffset;
    const releaseCurve = SVGUtils.downCurveSVGHTML(
      releaseX,
      releaseY,
      this.noteElement.boundingBox.width / 4,
      this.noteElement.boundingBox.height / 4,
      verticalOffset
    );

    // Step 4: build release arrow
    const releaseArrowX = releaseX + this.noteElement.boundingBox.width / 4;
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
  private createPrebendPath(): void {
    const stringNum = this.noteElement.note.stringNum;
    const verticalOffset =
      this.noteElement.boundingBox.height * (stringNum - 1) +
      this.noteElement.boundingBox.height / 2;

    // Step 1: build line
    const prebendLineX =
      this._startPoint.x + this.noteElement.boundingBox.width / 4;
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
  private createPrebendAndReleasePath(): void {
    const stringNum = this.noteElement.note.stringNum;
    const verticalOffset =
      this.noteElement.boundingBox.height * (stringNum - 1) +
      this.noteElement.boundingBox.height / 2;

    // Step 1: build line
    const prebendLineX =
      this._startPoint.x + this.noteElement.boundingBox.width / 4;
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
      this.noteElement.boundingBox.width / 4,
      this.noteElement.boundingBox.height / 4,
      verticalOffset
    );

    // Step 4: build release arrow
    const releaseArrowX = releaseX + this.noteElement.boundingBox.width / 4;
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
  private createSlidePath(): void {
    if (this.noteElement.note.fret === null) {
      return;
    }

    const staff = this.noteElement.note.beat.bar.staff;
    const nextBeat = staff.getNextBeat(this.noteElement.note.beat);
    if (nextBeat === null) {
      return;
    }

    const nextNote = nextBeat.notes[
      this.noteElement.note.stringNum - 1
    ] as GuitarNote;
    if (nextNote.fret === null) {
      return;
    }

    const upCoef = nextNote.fret >= this.noteElement.note.fret ? 1 : -1;

    const slideWidth =
      this.noteElement.boundingBox.width -
      EditorLayoutDimensions.NOTE_TEXT_SIZE;
    const slideHeight = this.noteElement.boundingBox.height / 3;
    const slideStartX =
      this._startPoint.x + EditorLayoutDimensions.NOTE_TEXT_SIZE / 2;
    const slideStartY = this._startPoint.y + (slideHeight / 2) * upCoef;
    const slideEndX = slideStartX + slideWidth;
    const slideEndY = slideStartY - slideHeight * upCoef;
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
  private createHammerOnOrPullOffPath(): void {
    const hpStartX = this._startPoint.x;
    const hpStartY = this._startPoint.y;
    const hpWidth = this.noteElement.boundingBox.width;
    const hpHeight = this.noteElement.boundingBox.height / 2;
    const slideLine = SVGUtils.horizontalCurveSVGHTML(
      hpStartX,
      hpStartY,
      hpWidth,
      hpHeight
    );

    // this._rect = new Rect(hpStartX, hpStartY, hpWidth, hpHeight);

    this._svgPath = slideLine;
  }

  /**
   * Calc natural harmonic path
   */
  private createNaturalHarmonicPath(): void {
    const nhStartX =
      this._startPoint.x - 5 * (EditorLayoutDimensions.NOTE_TEXT_SIZE / 4);
    const nhStartY = this._startPoint.y;
    const nhWidth = EditorLayoutDimensions.NOTE_TEXT_SIZE / 2;
    const nhHeight = EditorLayoutDimensions.NOTE_TEXT_SIZE / 2;
    const nhLine = SVGUtils.harmonicShapeSVGHTML(
      nhStartX,
      nhStartY,
      nhWidth,
      nhHeight,
      false
    );

    // this._rect = new Rect(nhStartX, nhStartY - nhHeight / 2, nhWidth, nhHeight);

    this._svgPath = nhLine;
  }

  /**
   * Calc pinch harmonic path
   */
  private createPinchHarmonicPath(): void {
    const phStartX =
      this._startPoint.x - 5 * (EditorLayoutDimensions.NOTE_TEXT_SIZE / 4);
    const phStartY = this._startPoint.y;
    const phWidth = EditorLayoutDimensions.NOTE_TEXT_SIZE / 2;
    const phHeight = EditorLayoutDimensions.NOTE_TEXT_SIZE / 2;
    const phLine = SVGUtils.harmonicShapeSVGHTML(
      phStartX,
      phStartY,
      phWidth,
      phHeight,
      true
    );

    // this._rect = new Rect(phStartX, phStartY - phHeight / 2, phWidth, phHeight);

    this._svgPath = phLine;
  }

  /**
   * Calculate path for a specific bend type
   */
  private createBendTechPath(): void {
    switch (this.technique.bendOptions?.type) {
      case BendType.Bend:
        this.createBendPath();
        break;
      case BendType.BendAndRelease:
        this.createBendAndReleasePath();
        break;
      case BendType.Prebend:
        this.createPrebendPath();
        break;
      case BendType.PrebendAndRelease:
        this.createPrebendAndReleasePath();
        break;
      default:
        throw Error("Bend without optoons");
    }
  }

  /**
   * Creates technique SVG path
   */
  private createPath(): void {
    // Calc offsets & assign image paths
    switch (this.technique.type) {
      case GuitarTechniqueType.Bend:
        this.createBendTechPath();
        break;
      case GuitarTechniqueType.Slide:
        this.createSlidePath();
        break;
      case GuitarTechniqueType.HammerOnOrPullOff:
        this.createHammerOnOrPullOffPath();
        break;
      case GuitarTechniqueType.PinchHarmonic:
        this.createPinchHarmonicPath();
        break;
      case GuitarTechniqueType.NaturalHarmonic:
        this.createNaturalHarmonicPath();
        break;
      default:
        this._svgPath = undefined;
        break;
    }
  }

  /**
   * Initializes the svgPath to either a string or undefined
   */
  build(): void {
    if (TECHNIQUE_IS_INLINE[this.technique.type]) {
      this._svgPath = "";
    } else {
      this._svgPath = undefined;
    }
  }

  /**
   * Empty measure to comply with the TechniqueElement & NotationElement interfaces
   */
  measure(): void {}

  /**
   * Calculates the state hash of the element
   * */
  private calcStateHash(): void {
    this._stateHash =
      `${this.globalBoundingBox.x}` +
      `${this.globalBoundingBox.y}` +
      `${this._startPoint.x}` +
      `${this._startPoint.y}` +
      `${this._svgPath}`;

    // checkIfDirty removed - now handled by checkAllDirty() in TrackElement
    // this.trackElement.checkIfDirty(this);
  }

  /**
   * Calculates the coordinates of the technique & it's path string
   */
  layout(): void {
    this._startPoint = new Point(
      this.noteElement.boundingBox.width / 2,
      this.noteElement.boundingBox.height / 2
    );

    this.createPath();

    // Calculating state hash at the last step of
    // element's update process - layout
    this.calcStateHash();
  }

  /**
   * Updates the guitar technique element fully
   */
  update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  /**
   * Scales the technique element horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    this._startPoint.x *= scale;

    this.layout();
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this._stateHash;
  }

  public getModelUUID(): number {
    return this.technique.uuid;
  }

  /** Start point */
  public get startPoint(): Point {
    return this._startPoint;
  }

  /** SVG Path */
  public get svgPath(): string | undefined {
    return this._svgPath;
  }

  /** SVG Path coords */
  public get svgPathGlobalCoords(): Point {
    return this.noteElement.globalCoords;
  }

  /** Placeholder layout bounding box for this path-only visual */
  public get boundingBox(): Rect {
    // Placeholder bounding box used to satisfy the notation element interface.
    // This element currently does not persist a dedicated box.
    return new Rect(this._startPoint.x, this._startPoint.y, 0, 0);
  }

  /** Global coords of the guitar technique element */
  public get globalCoords(): Point {
    return new Point(
      this.noteElement.globalCoords.x + this._startPoint.x,
      this.noteElement.globalCoords.y + this._startPoint.y
    );
  }

  /** Placeholder layout bounding box in global coordinates */
  public get globalBoundingBox(): Rect {
    // Placeholder bounding box used to satisfy the notation element interface.
    // This element currently does not persist a dedicated box.
    return new Rect(this.globalCoords.x, this.globalCoords.y, 0, 0);
  }

  public get rect(): Rect {
    return this.boundingBox;
  }

  public get globalRect(): Rect {
    return this.globalBoundingBox;
  }
}
