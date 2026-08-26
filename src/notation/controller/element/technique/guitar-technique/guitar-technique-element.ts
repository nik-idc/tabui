import {
  Beat,
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  VoiceNumber,
} from "../../../../model";
import { Point, Rect, randomInt } from "../../../../../shared";
import { GuitarTechniqueDescriptors } from "./guitar-technique-descriptors";
import { NotationElement, NotationNodeType } from "../../notation-element";
import { TrackElement } from "../../track-element";
import { SVGPathDescriptor, TechniqueElement } from "../technique-element";
import { TabNoteSlotElement } from "../../note/tab-note-slot-element";
import { TECHNIQUE_IS_INLINE } from "./guitar-technique-element-lists";
import type { BarElement } from "../../bar/bar-element";
import type { TrackLineElement } from "../../track/track-line-element";

/**
 * Class that handles geometry & visually relevant
 * info of a guitar note technique.
 * Represents specifically a UI element near the note
 * to which the technique is applied
 */
export class GuitarTechniqueElement implements TechniqueElement {
  readonly nodeType = NotationNodeType.Element;

  public static createStableIdentity(technique: GuitarTechnique): string {
    return `technique:${technique.uuid}`;
  }

  /** Guitar note element's unique identifier */
  readonly uuid: number;
  /** Technique */
  readonly technique: GuitarTechnique;
  /** Parent guitar note element */
  readonly noteElement: TabNoteSlotElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  public get voiceNumber(): VoiceNumber {
    return this.noteElement.voiceNumber;
  }

  public get owningTrackLineElement(): TrackLineElement {
    return this.noteElement.owningTrackLineElement;
  }

  public get owningBarElement(): BarElement {
    return this.noteElement.owningBarElement;
  }

  /** Starting point (center of the provided rect) */
  private _startPoint: Point;
  /** SVG path descriptors rendered from this origin */
  private _pathDescriptors?: SVGPathDescriptor[];

  /**
   * Class that represents a guitar technique
   * @param technique Technique
   * @param noteElement Parent note element
   */
  constructor(technique: GuitarTechnique, noteElement: TabNoteSlotElement) {
    this.uuid = randomInt();
    this.technique = technique;
    this.noteElement = noteElement;
    this.trackElement = this.noteElement.trackElement;

    this._startPoint = new Point(
      this.noteElement.boundingBox.width / 2,
      this.noteElement.boundingBox.height / 2
    );

    this.createPath();
  }

  private get note(): GuitarNote {
    if (this.noteElement.note === null) {
      throw Error("Guitar technique element requires a backing note");
    }

    return this.noteElement.note;
  }

  /** Calculates curve-end X coordinates in pitch-label order. */
  public calculateBendCurveEndXs(type: BendType): number[] {
    const startX =
      this.noteElement.beatElement.attackLocalX +
      this.noteElement.textRect.width / 2;
    const quarterWidth = this.noteElement.boundingBox.width / 4;
    switch (type) {
      case BendType.Bend:
      case BendType.Release:
        return [startX + quarterWidth * 2];
      case BendType.BendAndRelease:
        return [startX + quarterWidth * 2, startX + quarterWidth * 3];
      case BendType.Prebend:
        return [startX + quarterWidth];
      case BendType.PrebendAndRelease:
      case BendType.PrebendBend:
        return [startX + quarterWidth, startX + quarterWidth * 2];
      case BendType.Hold:
        return [];
    }
  }

  /**
   * Build a regular bend path SVG path HTML element
   */
  private createBendPath(): void {
    const stringNum = this.note.stringNum;
    const verticalOffset =
      this.noteElement.boundingBox.height * (stringNum - 1) +
      this.noteElement.boundingBox.height / 2;

    const x = this._startPoint.x;
    const y = this._startPoint.y;
    const curve = GuitarTechniqueDescriptors.createUpCurvePath(
      x,
      y,
      this.noteElement.boundingBox.width / 2,
      verticalOffset
    );

    const arrowX = this.calculateBendCurveEndXs(BendType.Bend)[0];
    const arrowY = y - verticalOffset;
    const arrow = GuitarTechniqueDescriptors.createVerticalArrowPath(
      arrowX,
      arrowY
    );

    this._pathDescriptors = [curve, arrow];
  }

  /**
   * Build a bend-and-release path SVG path HTML element
   */
  private createBendAndReleasePath(): void {
    const stringNum = this.note.stringNum;
    const verticalOffset =
      this.noteElement.boundingBox.height * (stringNum - 1) +
      this.noteElement.boundingBox.height / 2;

    // Step 1: build bend curve
    const bendX = this._startPoint.x;
    const bendY = this._startPoint.y;
    const bendCurve = GuitarTechniqueDescriptors.createUpCurvePath(
      bendX,
      bendY,
      this.noteElement.boundingBox.width / 2,
      verticalOffset
    );

    // Step 2: build bend arrow
    const [bendArrowX, releaseArrowX] = this.calculateBendCurveEndXs(
      BendType.BendAndRelease
    );
    const bendArrowY = bendY - verticalOffset;
    const bendArrow = GuitarTechniqueDescriptors.createVerticalArrowPath(
      bendArrowX,
      bendArrowY
    );

    // Step 3: build release curve
    const releaseX = bendX + this.noteElement.boundingBox.width / 2;
    const releaseY = bendY - verticalOffset;
    const releaseCurve = GuitarTechniqueDescriptors.createDownCurvePath(
      releaseX,
      releaseY,
      this.noteElement.boundingBox.width / 4,
      this.noteElement.boundingBox.height / 4,
      verticalOffset
    );

    // Step 4: build release arrow
    const releaseArrowY = releaseY + verticalOffset;
    const releaseArrow = GuitarTechniqueDescriptors.createVerticalArrowPath(
      releaseArrowX,
      releaseArrowY,
      false
    );

    this._pathDescriptors = [bendCurve, bendArrow, releaseCurve, releaseArrow];
  }

  /**
   * Build a prebend path SVG path HTML element
   */
  private createPrebendPath(): void {
    const stringNum = this.note.stringNum;
    const verticalOffset =
      this.noteElement.boundingBox.height * (stringNum - 1) +
      this.noteElement.boundingBox.height / 2;

    // Step 1: build line
    const prebendLineX = this.calculateBendCurveEndXs(BendType.Prebend)[0];
    const prebendLineY = this._startPoint.y;
    const lineHeight = verticalOffset;
    const prebendLine = GuitarTechniqueDescriptors.createVerticalLinePath(
      prebendLineX,
      prebendLineY,
      lineHeight
    );

    // Step 2: build line arrow
    const lineArrowX = prebendLineX;
    const lineArrowY = prebendLineY - lineHeight;
    const lineArrow = GuitarTechniqueDescriptors.createVerticalArrowPath(
      lineArrowX,
      lineArrowY
    );

    this._pathDescriptors = [prebendLine, lineArrow];
  }

  /**
   * Build a prebend-and-release path SVG path HTML element
   */
  private createPrebendAndReleasePath(): void {
    const stringNum = this.note.stringNum;
    const verticalOffset =
      this.noteElement.boundingBox.height * (stringNum - 1) +
      this.noteElement.boundingBox.height / 2;

    // Step 1: build line
    const [prebendLineX, releaseArrowX] = this.calculateBendCurveEndXs(
      BendType.PrebendAndRelease
    );
    const prebendLineY = this._startPoint.y;
    const lineHeight = verticalOffset;
    const prebendLine = GuitarTechniqueDescriptors.createVerticalLinePath(
      prebendLineX,
      prebendLineY,
      lineHeight
    );

    // Step 2: build line arrow
    const lineArrowX = prebendLineX;
    const lineArrowY = prebendLineY - lineHeight;
    const lineArrow = GuitarTechniqueDescriptors.createVerticalArrowPath(
      lineArrowX,
      lineArrowY
    );

    // Step 3: build release curve
    const releaseX = lineArrowX;
    const releaseY = lineArrowY;
    const releaseCurve = GuitarTechniqueDescriptors.createDownCurvePath(
      releaseX,
      releaseY,
      this.noteElement.boundingBox.width / 4,
      this.noteElement.boundingBox.height / 4,
      verticalOffset
    );

    // Step 4: build release arrow
    const releaseArrowY = releaseY + verticalOffset;
    const releaseArrow = GuitarTechniqueDescriptors.createVerticalArrowPath(
      releaseArrowX,
      releaseArrowY,
      false
    );

    this._pathDescriptors = [
      prebendLine,
      lineArrow,
      releaseCurve,
      releaseArrow,
    ];
  }

  private createHoldPath(): void {
    this._pathDescriptors = [];
  }

  private createReleasePath(): void {
    const verticalOffset =
      this.noteElement.boundingBox.height * (this.note.stringNum - 1) +
      this.noteElement.boundingBox.height / 2;
    const releaseX = this._startPoint.x;
    const releaseY = this._startPoint.y - verticalOffset;
    const releaseWidth = this.noteElement.boundingBox.width / 2;
    const releaseCurve = GuitarTechniqueDescriptors.createDownCurvePath(
      releaseX,
      releaseY,
      releaseWidth,
      this.noteElement.boundingBox.height / 4,
      verticalOffset
    );
    const releaseArrowX = this.calculateBendCurveEndXs(BendType.Release)[0];
    const releaseArrow = GuitarTechniqueDescriptors.createVerticalArrowPath(
      releaseArrowX,
      releaseY + verticalOffset,
      false
    );
    this._pathDescriptors = [releaseCurve, releaseArrow];
  }

  private createPrebendBendPath(): void {
    const verticalOffset =
      this.noteElement.boundingBox.height * (this.note.stringNum - 1) +
      this.noteElement.boundingBox.height / 2;

    const [prebendX, bendArrowX] = this.calculateBendCurveEndXs(
      BendType.PrebendBend
    );
    const prebendY = this._startPoint.y;
    const prebendLine = GuitarTechniqueDescriptors.createVerticalLinePath(
      prebendX,
      prebendY,
      verticalOffset
    );
    const prebendTopY = prebendY - verticalOffset;
    const prebendArrow = GuitarTechniqueDescriptors.createVerticalArrowPath(
      prebendX,
      prebendTopY
    );
    const bendHeight = this.noteElement.boundingBox.height / 4;
    const bendCurve = GuitarTechniqueDescriptors.createUpCurvePath(
      prebendX,
      prebendTopY,
      this.noteElement.boundingBox.width / 4,
      bendHeight
    );
    const bendArrow = GuitarTechniqueDescriptors.createVerticalArrowPath(
      bendArrowX,
      prebendTopY - bendHeight
    );
    this._pathDescriptors = [prebendLine, prebendArrow, bendCurve, bendArrow];
  }

  /** Returns the next same-string note element when it is on this track line. */
  private getNextNoteElement(nextBeat: Beat): TabNoteSlotElement | null {
    const styleLine =
      this.noteElement.beatElement.barElement.notationStyleLineContainer;
    const nextBeatElement = styleLine.getBeatElement(nextBeat);
    const nextNoteElement =
      nextBeatElement?.noteElements[this.note.stringNum - 1];
    return nextNoteElement instanceof TabNoteSlotElement
      ? nextNoteElement
      : null;
  }

  /** Returns a transition endpoint in the source note's local coordinates. */
  private getTransitionEndX(
    nextNoteElement: TabNoteSlotElement | null
  ): number {
    if (nextNoteElement !== null) {
      return (
        nextNoteElement.textRectGlobal.left - this.noteElement.globalCoords.x
      );
    }

    return (
      this.owningTrackLineElement.lineLocalBoundingBox.right -
      this.noteElement.lineLocalCoords.x
    );
  }

  /**
   * Calc slide path
   */
  private createSlidePath(): void {
    this._pathDescriptors = undefined;

    const note = this.note;
    if (note.fret === null) {
      return;
    }

    const staff = note.beat.voiceBar.bar.staff;
    const nextBeat = staff.getNextBeat(note.beat);
    if (nextBeat === null) {
      return;
    }

    if (nextBeat.notes === null) {
      return;
    }

    const nextNote = nextBeat.notes[note.stringNum - 1];
    if (!(nextNote instanceof GuitarNote)) {
      return;
    }
    if (nextNote.fret === null) {
      return;
    }

    const upCoef = nextNote.fret >= note.fret ? 1 : -1;

    const slideHeight = this.noteElement.boundingBox.height / 3;
    const slideStartX = this._startPoint.x;
    const slideStartY = this._startPoint.y + (slideHeight / 2) * upCoef;
    const nextNoteElement = this.getNextNoteElement(nextBeat);
    const slideEndX = this.getTransitionEndX(nextNoteElement);
    const slideEndY = slideStartY - slideHeight * upCoef;
    const slideLine = GuitarTechniqueDescriptors.createLinePath(
      slideStartX,
      slideStartY,
      slideEndX,
      slideEndY
    );

    this._pathDescriptors = [slideLine];
  }

  /**
   * Calc hammer-on or pull-off path
   */
  private createLegatoPath(): void {
    const nextBeat = this.note.beat.voiceBar.bar.staff.getNextBeat(
      this.note.beat
    );
    const nextNote = nextBeat?.notes?.[this.note.stringNum - 1];
    if (
      nextBeat === null ||
      !(nextNote instanceof GuitarNote) ||
      nextNote.fret === null
    ) {
      this._pathDescriptors = undefined;
      return;
    }
    const nextNoteElement = this.getNextNoteElement(nextBeat);

    const legatoStartX = this._startPoint.x;
    const legatoStartY = this._startPoint.y;
    const legatoEndX = this.getTransitionEndX(nextNoteElement);
    const legatoWidth = legatoEndX - legatoStartX;
    const legatoHeight = this.noteElement.boundingBox.height / 2;
    const legatoCurve = GuitarTechniqueDescriptors.createHorizontalCurvePath(
      legatoStartX,
      legatoStartY,
      legatoWidth,
      legatoHeight
    );

    // this._rect = new Rect(hpStartX, hpStartY, hpWidth, hpHeight);

    this._pathDescriptors = [legatoCurve];
  }

  /**
   * Calc natural harmonic path
   */
  private createNaturalHarmonicPath(): void {
    const nhWidth = this.trackElement.layoutDimensions.NOTE_TEXT_SIZE / 2;
    const harmonicGap = this.trackElement.layoutDimensions.NOTE_TEXT_SIZE / 4;
    const nhStartX = this.noteElement.textRect.left - nhWidth - harmonicGap;
    const nhStartY = this._startPoint.y;
    const nhHeight = this.trackElement.layoutDimensions.NOTE_TEXT_SIZE / 2;
    const nhLine = GuitarTechniqueDescriptors.createHarmonicDiamondPath(
      nhStartX,
      nhStartY,
      nhWidth,
      nhHeight,
      false
    );

    // this._rect = new Rect(nhStartX, nhStartY - nhHeight / 2, nhWidth, nhHeight);

    this._pathDescriptors = [nhLine];
  }

  /**
   * Calc pinch harmonic path
   */
  private createPinchHarmonicPath(): void {
    const phWidth = this.trackElement.layoutDimensions.NOTE_TEXT_SIZE / 2;
    const harmonicGap = this.trackElement.layoutDimensions.NOTE_TEXT_SIZE / 4;
    const phStartX = this.noteElement.textRect.left - phWidth - harmonicGap;
    const phStartY = this._startPoint.y;
    const phHeight = this.trackElement.layoutDimensions.NOTE_TEXT_SIZE / 2;
    const phLine = GuitarTechniqueDescriptors.createHarmonicDiamondPath(
      phStartX,
      phStartY,
      phWidth,
      phHeight,
      true
    );

    // this._rect = new Rect(phStartX, phStartY - phHeight / 2, phWidth, phHeight);

    this._pathDescriptors = [phLine];
  }

  /**
   * Calculate path for a specific bend type
   */
  private createBendTechPath(): void {
    const bendOptions = this.technique.bendOptions;
    if (bendOptions === null) {
      throw Error("Bend technique requires options");
    }
    switch (bendOptions.type) {
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
      case BendType.Hold:
        this.createHoldPath();
        break;
      case BendType.PrebendBend:
        this.createPrebendBendPath();
        break;
      case BendType.Release:
        this.createReleasePath();
        break;
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
      case GuitarTechniqueType.Legato:
        this.createLegatoPath();
        break;
      case GuitarTechniqueType.PinchHarmonic:
        this.createPinchHarmonicPath();
        break;
      case GuitarTechniqueType.NaturalHarmonic:
        this.createNaturalHarmonicPath();
        break;
      default:
        this._pathDescriptors = undefined;
        break;
    }
  }

  /**
   * Initializes the path descriptors for non-inline techniques.
   */
  build(): void {
    if (TECHNIQUE_IS_INLINE[this.technique.type]) {
      this._pathDescriptors = [];
    } else {
      this._pathDescriptors = undefined;
    }
  }

  /**
   * Empty measure to comply with the TechniqueElement & NotationElement interfaces
   */
  measure(): void {}

  private buildStateHash(): string {
    return (
      `${this.barLocalCoords.x}` +
      `${this.barLocalCoords.y}` +
      `${this._startPoint.x}` +
      `${this._startPoint.y}` +
      `${JSON.stringify(this._pathDescriptors)}`
    );
  }

  /**
   * Calculates the coordinates of the technique & it's path string
   */
  layout(): void {
    this._startPoint = new Point(
      this.noteElement.textRect.right,
      this.noteElement.textRect.middleY
    );

    this.createPath();
  }

  /**
   * Updates the guitar technique element fully
   */
  update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  public refreshOwnedNotationNodes(): NotationElement[] {
    return [this];
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this.buildStateHash();
  }

  public getStableIdentity(): string {
    return GuitarTechniqueElement.createStableIdentity(this.technique);
  }

  /** Start point */
  public get startPoint(): Point {
    return this._startPoint;
  }

  /** Start point in bar-local coordinates */
  public get startPointBarLocal(): Point {
    return new Point(
      this.noteElement.barLocalCoords.x + this._startPoint.x,
      this.noteElement.barLocalCoords.y + this._startPoint.y
    );
  }

  /** SVG path descriptors */
  public get pathDescriptors(): SVGPathDescriptor[] | undefined {
    return this._pathDescriptors;
  }

  /** Track line-local origin for local path descriptor coordinates */
  public get pathOriginBarLocal(): Point {
    return this.noteElement.barLocalCoords;
  }

  /** Track line-local origin for local path descriptor coordinates */
  public get pathOriginLineLocal(): Point {
    return new Point(
      this.noteElement.beatElement.barElement.lineLocalCoords.x +
        this.noteElement.barLocalCoords.x,
      this.noteElement.beatElement.barElement.lineLocalCoords.y +
        this.noteElement.barLocalCoords.y
    );
  }

  /** Global origin for local path descriptor coordinates */
  public get pathOrigin(): Point {
    return this.noteElement.globalCoords;
  }

  /** Placeholder layout bounding box for this path-only visual */
  public get boundingBox(): Rect {
    // Placeholder bounding box used to satisfy the notation element interface.
    // This element currently does not persist a dedicated box.
    return new Rect(this._startPoint.x, this._startPoint.y, 0, 0);
  }

  /** Coords of this element in bar-local coordinates */
  public get barLocalCoords(): Point {
    return this.startPointBarLocal;
  }

  /** Bounding box of this element in bar-local coordinates */
  public get barLocalBoundingBox(): Rect {
    return new Rect(this.barLocalCoords.x, this.barLocalCoords.y, 0, 0);
  }

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(
      this.noteElement.beatElement.barElement.lineLocalCoords.x +
        this.barLocalCoords.x,
      this.noteElement.beatElement.barElement.lineLocalCoords.y +
        this.barLocalCoords.y
    );
  }

  /** Bounding box of this element in track line-local coordinates */
  public get lineLocalBoundingBox(): Rect {
    return new Rect(this.lineLocalCoords.x, this.lineLocalCoords.y, 0, 0);
  }

  /** Global coords of the guitar technique element */
  public get globalCoords(): Point {
    return new Point(
      this.noteElement.beatElement.barElement.globalCoords.x +
        this.barLocalCoords.x,
      this.noteElement.beatElement.barElement.globalCoords.y +
        this.barLocalCoords.y
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
