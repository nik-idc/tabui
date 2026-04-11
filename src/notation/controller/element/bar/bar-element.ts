import {
  Bar,
  BarRepeatStatus,
  Beat,
  DURATION_TO_FLAG_COUNT,
  Guitar,
} from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
import { TrackElement } from "@/notation/controller/element/track-element";
import { NotationElement } from "@/notation/controller/element/notation-element";
import {
  NotationStyle,
  StaffLineElement,
} from "@/notation/controller/element/staff/staff-line-element";
import { NotationStyleLineElement } from "@/notation/controller/element/staff/notation-style-line-element";
import { BeamSegmentElement } from "./beam-segment-element";
import { BarTupletGroupElement } from "./bar-tuplet-group-element";
import { TabBeatElement } from "../beat/tab-beat-element";
import { SheetBeatElement } from "../beat/sheet-beat-element";
import { BeatElement, getBeatWidth } from "../beat/beat-element";
// import { BeatElement_old } from "./tab-beat-element_old";
import { HorLine, Line, VertLine } from "@/shared/rendering/geometry/line";

// TODO:: Fix repeat rects shifting when there are multple staves

/**
 * Class that handles geometry & visually relevant info of a bar
 */
export class BarElement implements NotationElement {
  /** Unique identifier for the bar element */
  readonly uuid: number;
  /** The bar */
  readonly bar: Bar;
  /** Parent bars line element */
  readonly notationStyleLineElement: NotationStyleLineElement;
  /** Desired width for this bar's master bar as determined in the TrackElement */
  readonly desiredWidth: number;
  /** Root track element */
  readonly trackElement: TrackElement;

  /** This bar's beat elements */
  private _beatElements: BeatElement[];
  /** Beam segments of this bar element */
  private _beamSegments: BeamSegmentElement[];
  /** All tuplet element */
  private _tupletElements: BarTupletGroupElement[];

  /** Bar element rectangle */
  private _boundingBox: Rect;
  /** Bar element's lines */
  private _staffLines: HorLine[];
  // /** Tempo rectangle */
  // private _tempoRect: Rect;
  /** Time signature rectangle */
  private _timeSigRect?: Rect;
  /** Repeat start sign rectangle */
  private _repeatStartRect?: Rect;
  /** Repeat end sign rectangle */
  private _repeatEndRect?: Rect;
  /** If tempo is to be shown in the bar */
  private _showTempo: boolean;
  /** String encoding the state of this element */
  private _stateHash: string;

  /**
   * Class that handles geometry & visually relevant info of a bar
   * @param bar Bar
   * @param notationStyleLineElement Parent notation style line element
   * @param desiredWidth Desired width for this bar's master bar as determined
   * in the TrackElement
   */
  constructor(
    bar: Bar,
    notationStyleLineElement: NotationStyleLineElement,
    desiredWidth: number
  ) {
    this.uuid = randomInt();
    this.bar = bar;
    this.notationStyleLineElement = notationStyleLineElement;
    this.trackElement = this.notationStyleLineElement.trackElement;
    this.desiredWidth = desiredWidth;

    this._beatElements = [];
    this._beamSegments = [];
    this._tupletElements = [];

    this._boundingBox = new Rect();
    this._staffLines = Array.from(
      { length: this.bar.trackContext.instrument.maxPolyphony },
      () => new HorLine()
    );
    this._timeSigRect = new Rect();
    this._repeatStartRect = new Rect();
    this._repeatEndRect = new Rect();
    this._showTempo = false;

    this._stateHash = "";

    this.build();

    this.trackElement.registerElement(this);
  }

  /**
   * Calculates tempo visibility and time sig & repeat rectangles
   */
  private buildStructuralElements(): void {
    const prevBar = this.bar.staff.getPrevBar(this.bar);

    this._showTempo =
      prevBar !== null
        ? this.bar.masterBar.tempo !== prevBar.masterBar.tempo
        : true;

    if (
      prevBar !== null &&
      prevBar.masterBar.maxDuration === this.bar.masterBar.maxDuration
    ) {
      this._timeSigRect = undefined;
    } else {
      this._timeSigRect = new Rect();
    }

    this._repeatStartRect = undefined;
    this._repeatEndRect = undefined;
    if (this.bar.masterBar.repeatStatus === BarRepeatStatus.Start) {
      this._repeatStartRect = new Rect();
    }
    if (this.bar.masterBar.repeatStatus === BarRepeatStatus.End) {
      this._repeatEndRect = new Rect();
    }
  }

  /**
   * Fills the beat elements array
   */
  public buildBeats(): void {
    const notationStyle = this.notationStyleLineElement.notationStyle;

    this._beatElements = [];
    for (const beat of this.bar.beats) {
      let beatElement: BeatElement;
      switch (notationStyle) {
        case NotationStyle.Classic:
          beatElement = new SheetBeatElement(beat, this);
          break;
        case NotationStyle.Tablature:
          beatElement = new TabBeatElement(beat, this);
          break;
        default:
          throw Error(`Unsupported notation style value: '${notationStyle}'`);
      }

      this._beatElements.push(beatElement);
    }
  }

  /**
   * Fills the beam segments array
   */
  public buildBeamSegments(): void {
    this._beamSegments = [];
    for (const beatElement of this._beatElements) {
      if (!(beatElement instanceof TabBeatElement)) {
        return;
      }
      // if (DURATION_TO_FLAG_COUNT[beatElement.beat.baseDuration] === 0) {
      //   return;
      // }
    }

    for (let i = 0; i < this.bar.beamingGroups.length; i++) {
      const beamGroupBeats = this._beatElements.filter(
        (beatEl) => beatEl.beat.beamGroupId === i
      );

      if (beamGroupBeats.length <= 1) {
        continue;
      }

      for (let j = 0; j < beamGroupBeats.length - 1; j++) {
        const curBeatElement = beamGroupBeats[j];
        const nextBeatElement = beamGroupBeats[j + 1];
        const prevBeatElement = j === 0 ? undefined : beamGroupBeats[j - 1];
        this._beamSegments.push(
          new BeamSegmentElement(
            this,
            curBeatElement as TabBeatElement,
            nextBeatElement as TabBeatElement,
            prevBeatElement as TabBeatElement
          )
        );
      }

      const lastBeatElement = beamGroupBeats[beamGroupBeats.length - 1];
      const prevLastBeatElement = beamGroupBeats[beamGroupBeats.length - 2];
      this._beamSegments.push(
        new BeamSegmentElement(
          this,
          lastBeatElement as TabBeatElement,
          undefined,
          prevLastBeatElement as TabBeatElement
        )
      );
    }
  }

  /**
   * Fills the bar tuplet groups array
   */
  public buildTupletGroupElements(): void {
    this._tupletElements = [];
    if (!this._beatElements.every((v) => v instanceof TabBeatElement)) {
      return;
    }

    for (const tupletGroup of this.bar.tupletGroups) {
      const tupletTabBeatElements = this._beatElements.filter((b) =>
        tupletGroup.beats.some((tb) => tb.uuid === b.beat.uuid)
      );

      this._tupletElements.push(
        new BarTupletGroupElement(tupletGroup, this, tupletTabBeatElements)
      );
    }
  }

  /**
   * Initializes the bar element:
   * - Calculates the tempo & time sig. visibility
   * - Fills the beat elements array
   * - Fills beam segments array
   * - Fills the tuplet group elements array
   */
  public build(): void {
    this.buildStructuralElements();
    this.buildBeats();
    this.buildBeamSegments();
    this.buildTupletGroupElements();
  }

  /**
   * Calculates time signature rectangle dimensions
   */
  private measureTimeSigRect(): void {
    if (this._timeSigRect === undefined) {
      return;
    }

    // Time signature rectangle
    this._timeSigRect.setDimensions(
      EditorLayoutDimensions.TIME_SIG_RECT_WIDTH,
      EditorLayoutDimensions.TIME_SIG_TEXT_SIZE * 2
    );
  }

  /**
   * Calculates repeat rectangles dimensions
   */
  private measureRepeatRects(): void {
    if (
      this._repeatStartRect === undefined &&
      this._repeatEndRect === undefined
    ) {
      return;
    }

    if (this._repeatStartRect !== undefined) {
      this._repeatStartRect.setDimensions(
        EditorLayoutDimensions.REPEAT_SIGN_WIDTH,
        EditorLayoutDimensions.getStaffHeight(this.bar.trackContext.instrument)
      );
    }
    if (this._repeatEndRect !== undefined) {
      this._repeatEndRect.setDimensions(
        EditorLayoutDimensions.REPEAT_SIGN_WIDTH,
        EditorLayoutDimensions.getStaffHeight(this.bar.trackContext.instrument)
      );
    }
  }

  /**
   * Calc main outer rectangle dimensions
   */
  private measureRect(): void {
    let beatsSumWidth = 0;
    for (const beatElement of this._beatElements) {
      beatsSumWidth += beatElement.boundingBox.width;
    }

    const barWidth =
      (this._repeatStartRect?.width ?? 0) +
      (this._timeSigRect?.width ?? 0) +
      beatsSumWidth +
      (this._repeatEndRect?.width ?? 0);
    const height =
      this._beatElements[0].boundingBox.height +
      EditorLayoutDimensions.TUPLET_RECT_HEIGHT;

    this._boundingBox.setDimensions(barWidth, height);
  }

  /**
   * Calculates staff lines' width by setting their x1 & x2 coords
   */
  private measureStaffLines(): void {
    for (let i = 0; i < this.bar.trackContext.instrument.maxPolyphony; i++) {
      this._staffLines[i].x1 = 0;
      this._staffLines[i].x2 = this._boundingBox.width;
    }
  }

  /**
   * Measure the dimensions of all sub elements of this track line element
   */
  public measure(): void {
    for (const beatElement of this._beatElements) {
      beatElement.measure();
    }

    for (const beamSegment of this._beamSegments) {
      beamSegment.measure();
    }

    for (const tupletElement of this._tupletElements) {
      tupletElement.measure();
    }

    this.measureTimeSigRect();
    this.measureRepeatRects();
    this.measureRect();
    this.measureStaffLines();
  }

  /**
   * Sets the outer rectangle coordinates
   */
  private layoutRect(): void {
    const prevBarElement =
      this.notationStyleLineElement.getPrevBarElement(this);
    const x = prevBarElement?.boundingBox.right ?? 0;
    const y = this.notationStyleLineElement.techGapElement.boundingBox.bottom;
    this._boundingBox.setCoords(x, y);
  }

  /**
   * Calc time signature rectangle
   */
  private layoutTimeSigRect(): void {
    if (this._timeSigRect === undefined) {
      return;
    }

    const staffHeight =
      this._boundingBox.height - EditorLayoutDimensions.DURATIONS_HEIGHT;
    const yOffset = (staffHeight - this._timeSigRect.height) / 2;
    this._timeSigRect.setCoords(0, yOffset);
  }

  /**
   * Calculates repeat rectangle
   */
  private layoutRepeatRects(): void {
    if (
      this._repeatStartRect === undefined &&
      this._repeatEndRect === undefined
    ) {
      return;
    }

    const y = EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2;
    if (this._repeatStartRect !== undefined) {
      const x = this._timeSigRect?.right ?? 0;
      this._repeatStartRect.setCoords(x, y);
    }
    if (this._repeatEndRect !== undefined) {
      this._repeatEndRect.setCoords(
        this._boundingBox.width - EditorLayoutDimensions.REPEAT_SIGN_WIDTH,
        y
      );
    }
  }

  /**
   * Calculates bar's staff lines
   */
  private layoutStaffLines(): void {
    // Make lines
    let y = EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2;
    for (let i = 0; i < this.bar.trackContext.instrument.maxPolyphony; i++) {
      this._staffLines[i].y = y;

      y += EditorLayoutDimensions.NOTE_RECT_HEIGHT;
    }
  }

  /**
   * Calculates the state hash of the element
   * */
  private calcStateHash(): void {
    const hashArr: string[] = [
      `${this.globalBoundingBox.x}` +
        `${this.globalBoundingBox.y}` +
        `${this.globalBoundingBox.width}` +
        `${this.globalBoundingBox.height}`,
    ];

    hashArr.push(`${this._showTempo}`);

    if (this._repeatEndRect !== undefined) {
      hashArr.push(`${this._repeatEndRect.x}`);
      hashArr.push(`${this._repeatEndRect.y}`);
      hashArr.push(`${this._repeatEndRect.width}`);
      hashArr.push(`${this._repeatEndRect.height}`);
    }
    if (this._repeatStartRect !== undefined) {
      hashArr.push(`${this._repeatStartRect.x}`);
      hashArr.push(`${this._repeatStartRect.y}`);
      hashArr.push(`${this._repeatStartRect.width}`);
      hashArr.push(`${this._repeatStartRect.height}`);
    }
    if (this._timeSigRect !== undefined) {
      hashArr.push(`${this._timeSigRect.x}`);
      hashArr.push(`${this._timeSigRect.y}`);
      hashArr.push(`${this._timeSigRect.width}`);
      hashArr.push(`${this._timeSigRect.height}`);
    }

    for (const line of this._staffLines) {
      hashArr.push(`${line.x1}${line.x2}${line.y}`);
    }

    hashArr.push(`${this.bar.checkDurationsFit() ? 1 : 0}`);

    this._stateHash = hashArr.join("");

    // checkIfDirty removed - now handled by checkAllDirty() in TrackElement
    // this.trackElement.checkIfDirty(this);
  }

  /**
   * Calculates layout for all child elements, i.e. their X and Y coordinates
   */
  public layout(): void {
    this.layoutRect();
    this.layoutRepeatRects();
    this.layoutTimeSigRect();
    this.layoutStaffLines();

    for (const beatElement of this._beatElements) {
      beatElement.layout();
    }

    for (const beamSegment of this._beamSegments) {
      beamSegment.layout();
    }

    for (const tupletElement of this._tupletElements) {
      tupletElement.layout();
    }

    this.justifyToFit();

    // Calculating state hash moved to scaleHorBy
    // this.calcStateHash();
  }

  /**
   * Updates the element fully
   */
  public update(): void {
    this.build();

    this.measure();
    this.layout();
  }

  /**
   * Justifies the bar element to be of the specified width
   * @param desiredWidth Desired width of the bar element
   */
  public justifyToFit(): void {
    if (this.desiredWidth - this.boundingBox.width === 0) {
      return;
    }

    const scale = this.desiredWidth / this.boundingBox.width;
    this.scaleHorBy(scale, false);
  }

  /**
   * Scales the element & its children horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number, scaleOuterX: boolean = true): void {
    if (scaleOuterX) {
      this._boundingBox.x *= scale;
    }
    this._boundingBox.width *= scale;
    // this._tempoRect.x *= scale;
    if (this._repeatStartRect !== undefined) {
      this._repeatStartRect.x *= scale;
      this._repeatStartRect.width *= scale;
    }
    if (this._timeSigRect !== undefined) {
      this._timeSigRect.x *= scale;
      this._timeSigRect.width *= scale;
    }
    if (this._repeatEndRect !== undefined) {
      this._repeatEndRect.x *= scale;
      this._repeatEndRect.width *= scale;
    }

    for (const line of this._staffLines) {
      line.x1 *= scale;
      line.x2 *= scale;
    }

    for (const beatElement of this._beatElements) {
      beatElement.scaleHorBy(scale);
    }

    for (const beamSegment of this._beamSegments) {
      beamSegment.scaleHorBy(scale);
    }

    for (const tupletElement of this._tupletElements) {
      tupletElement.scaleHorBy(scale);
    }

    // Calculating state hash at the last step of
    // element's update process - layout
    this.calcStateHash();
  }

  /**
   * Gets next beat element
   * @param beatElement Beat element
   * @returns Next beat element or null
   */
  public getNextBeatElement(beatElement: BeatElement): BeatElement | null {
    const beatIndex = this._beatElements.indexOf(beatElement);
    const nextBeat = this._beatElements[beatIndex + 1];
    return nextBeat ?? null;
  }

  /**
   * Gets prev beat element
   * @param beatElement Beat element
   * @returns Prev beat element or null
   */
  public getPrevBeatElement(beatElement: BeatElement): BeatElement | null {
    const beatIndex = this._beatElements.indexOf(beatElement);
    const prevBeat = this._beatElements[beatIndex - 1];
    return prevBeat ?? null;
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this._stateHash;
  }

  public getModelUUID(): number {
    return this.bar.uuid;
  }

  /** Time signature beats rectangle */
  get timeSigBeatsRect(): Rect | undefined {
    if (this._timeSigRect === undefined) {
      return undefined;
    }

    return new Rect(
      this._timeSigRect.x,
      this._timeSigRect.y,
      this._timeSigRect.width,
      this._timeSigRect.height / 2
    );
  }

  /** Time signature beats text coords */
  get timeSigBeatsTextCoords(): Point | undefined {
    if (this._timeSigRect === undefined) {
      return undefined;
    }

    const padding = 10;
    return new Point(this._timeSigRect.x + padding, this._timeSigRect.y);
  }

  /** Time signature beats text global coords */
  get timeSigBeatsTextCoordsGlobal(): Point | undefined {
    if (this.timeSigBeatsTextCoords === undefined) {
      return undefined;
    }

    return new Point(
      this.globalCoords.x + this.timeSigBeatsTextCoords.x,
      this.globalCoords.y + this.timeSigBeatsTextCoords.y
    );
  }

  /** Time signature measure text rectangle */
  get timeSigDurationRect(): Rect | undefined {
    if (this._timeSigRect === undefined) {
      return undefined;
    }

    return new Rect(
      this._timeSigRect.x,
      this._timeSigRect.y,
      this._timeSigRect.width,
      this._timeSigRect.middleY
    );
  }

  /** Time signature measure text coords */
  get timeSigDurationTextCoords(): Point | undefined {
    if (this._timeSigRect === undefined) {
      return undefined;
    }

    const padding = 10;
    return new Point(this._timeSigRect.x + padding, this._timeSigRect.middleY);
  }

  /** Time signature measure text global coords */
  get timeSigDurationTextCoordsGlobal(): Point | undefined {
    if (this.timeSigDurationTextCoords === undefined) {
      return undefined;
    }

    return new Point(
      this.globalCoords.x + this.timeSigDurationTextCoords.x,
      this.globalCoords.y + this.timeSigDurationTextCoords.y
    );
  }

  /** Bar left border line */
  get barLeftBorderLine(): VertLine {
    return new VertLine(
      0,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2 +
        EditorLayoutDimensions.getStaffHeight(this.bar.trackContext.instrument)
    );
  }

  /** Bar left border line in global coords */
  get barLeftBorderLineGlobal(): VertLine {
    return new VertLine(
      this.globalCoords.x,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2 + this.globalCoords.y,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2 +
        this.globalCoords.y +
        EditorLayoutDimensions.getStaffHeight(this.bar.trackContext.instrument)
    );
  }

  /** Bar right border line */
  get barRightBorderLine(): VertLine {
    return new VertLine(
      this._boundingBox.right,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2 +
        EditorLayoutDimensions.getStaffHeight(this.bar.trackContext.instrument)
    );
  }

  /** Bar right border line in global coords */
  get barRightBorderLineGlobal(): VertLine {
    return new VertLine(
      this.globalCoords.x + this._boundingBox.width,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2 + this.globalCoords.y,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2 +
        this.globalCoords.y +
        EditorLayoutDimensions.getStaffHeight(this.bar.trackContext.instrument)
    );
  }

  /** Gap at the fron of the bar (time sig. and/or repeat start) */
  get startGap(): Rect {
    const x = 0;
    const y = this._showTempo ? EditorLayoutDimensions.TEMPO_RECT_HEIGHT : 0;
    let width = 0;
    if (this._timeSigRect !== undefined) {
      width += this._timeSigRect.width;
    }
    if (this._repeatStartRect !== undefined) {
      width += this._repeatStartRect.width;
    }
    const height = this._boundingBox.height;
    return new Rect(x, y, width, height);
  }

  /** Gap at the fron of the bar (time sig. and/or repeat start) in global coords */
  get startGapGlobal(): Rect {
    const x = 0;
    const y = this._showTempo ? EditorLayoutDimensions.TEMPO_RECT_HEIGHT : 0;
    let width = 0;
    if (this._timeSigRect !== undefined) {
      width += this._timeSigRect.width;
    }
    if (this._repeatStartRect !== undefined) {
      width += this._repeatStartRect.width;
    }
    const height = this._boundingBox.height;
    return new Rect(
      this.globalCoords.x + x,
      this.globalCoords.y + y,
      width,
      height
    );
  }

  /** Gap at the fron of the bar (repeat end) */
  get endGap(): Rect {
    let width = 0;
    if (this._repeatEndRect !== undefined) {
      width += this._repeatEndRect.width;
    }
    const height = this._boundingBox.height;
    const x = this._boundingBox.right - width;
    const y = this._showTempo ? EditorLayoutDimensions.TEMPO_RECT_HEIGHT : 0;
    return new Rect(x, y, width, height);
  }

  /** Gap at the fron of the bar (repeat end) in global coords */
  get endGapGlobal(): Rect {
    let width = 0;
    if (this._repeatEndRect !== undefined) {
      width += this._repeatEndRect.width;
    }
    const height = this._boundingBox.height;
    const x = this._boundingBox.right - width;
    const y = this._showTempo ? EditorLayoutDimensions.TEMPO_RECT_HEIGHT : 0;
    return new Rect(
      this.globalCoords.x + x,
      this.globalCoords.y + y,
      width,
      height
    );
  }

  /** This bar's beat elements */
  public get beatElements(): BeatElement[] {
    return this._beatElements;
  }

  /** Beam segments of this bar element */
  public get beamSegments(): BeamSegmentElement[] {
    return this._beamSegments;
  }

  /** All tuplet element */
  public get tupletElements(): BarTupletGroupElement[] {
    return this._tupletElements;
  }

  /** Bar element layout bounding box */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** This bar's layout bounding box in global coordinates */
  public get globalBoundingBox(): Rect {
    return new Rect(
      this.globalCoords.x,
      this.globalCoords.y,
      this._boundingBox.width,
      this._boundingBox.height
    );
  }

  public get rect(): Rect {
    return this.boundingBox;
  }

  public get globalRect(): Rect {
    return this.globalBoundingBox;
  }

  /** Bar element's staff lines */
  public get staffLines(): HorLine[] {
    return this._staffLines;
  }

  /** Bar element's staff lines in global coords */
  public get staffLinesGlobal(): HorLine[] {
    const result = [];
    for (const line of this._staffLines) {
      result.push(
        new HorLine(
          this.globalCoords.x + line.x1,
          this.globalCoords.x + line.x2,
          this.globalCoords.y + line.y
        )
      );
    }

    return result;
  }

  // /** Tempo rectangle */
  // public get tempoRect(): Rect {
  //   return this._tempoRect;
  // }

  /** Time signature rectangle */
  public get timeSigRect(): Rect | undefined {
    return this._timeSigRect;
  }

  /** Repeat start sign rectangle */
  public get repeatStartRect(): Rect | undefined {
    return this._repeatStartRect;
  }

  /** Repeat start sign rectangle in global coords */
  public get repeatStartRectGlobal(): Rect | undefined {
    if (this._repeatStartRect === undefined) {
      return undefined;
    }

    return new Rect(
      this.globalCoords.x + this._repeatStartRect.x,
      this.globalCoords.y + this._repeatStartRect.y,
      this._repeatStartRect.width,
      this._repeatStartRect.height
    );
  }

  /** Repeat end sign rectangle */
  public get repeatEndRect(): Rect | undefined {
    return this._repeatEndRect;
  }

  /** Repeat end sign rectangle in global coords */
  public get repeatEndRectGlobal(): Rect | undefined {
    if (this._repeatEndRect === undefined) {
      return undefined;
    }

    return new Rect(
      this.globalCoords.x + this._repeatEndRect.x,
      this.globalCoords.y + this._repeatEndRect.y,
      this._repeatEndRect.width,
      this._repeatEndRect.height
    );
  }

  /** If tempo is to be shown in the bar */
  public get showTempo(): boolean {
    return this._showTempo;
  }

  /** Global coords of the bar element */
  public get globalCoords(): Point {
    return new Point(
      this.notationStyleLineElement.globalCoords.x + this._boundingBox.x,
      this.notationStyleLineElement.globalCoords.y + this._boundingBox.y
    );
  }
}

export function getBarWidth(bar: Bar): number {
  let width = 0;

  if (bar.masterBar.repeatStatus === BarRepeatStatus.Start) {
    width += EditorLayoutDimensions.REPEAT_SIGN_WIDTH;
  }

  const prevBar: Bar | null = bar.staff.getPrevBar(bar);
  if (
    prevBar === null ||
    prevBar.masterBar.maxDuration !== bar.masterBar.maxDuration
  ) {
    width += EditorLayoutDimensions.TIME_SIG_RECT_WIDTH;
  }

  for (const beat of bar.beats) {
    width += getBeatWidth(beat);
  }

  if (bar.masterBar.repeatStatus === BarRepeatStatus.End) {
    width += EditorLayoutDimensions.REPEAT_SIGN_WIDTH;
  }

  return width;
}

// ==== PROBABLY WILL BE USEFULL LATER ====
//
// /**
//  * Calculates beaming groups
//  */
// private calcBeamGroups(): void {
//   this._beamSegments = [];
//   for (let i = 0; i < this.bar.beamingGroups.length; i++) {
//     const beamGroupBeats = this.bar.beats.filter((b) => b.beamGroupId === i);

//     if (beamGroupBeats.length <= 1) {
//       continue;
//     }

//     for (let j = 0; j < beamGroupBeats.length - 1; j++) {
//       const curTabBeatElement = beamGroupBeats[j];
//       const nextTabBeatElement = beamGroupBeats[j + 1];
//       const prevTabBeatElement = j === 0 ? undefined : beamGroupBeats[j - 1];
//       this._beamSegments.push(
//         new BeamSegmentElement(
//           this,
//           curTabBeatElement,
//           nextTabBeatElement,
//           prevTabBeatElement
//         )
//       );
//     }
//   }
// }
//
// //
// /**
//  * Sets technique gap height to the new provided value
//  * @param newGapHeight New gap height
//  */
// public setTechniqueGap(newGapHeight: number): void {
//   // Apply the necessary gap height
//   const oldGapHeight = this._labelsGapHeight;

//   this._boundingBox.height += newGapHeight - oldGapHeight;
//   this._timeSigRect.y += newGapHeight - oldGapHeight;

//   this._labelsGapHeight = newGapHeight;

//   for (const tabBeatElement of this._beatElements) {
//     tabBeatElement.setTechniqueGap(newGapHeight);
//   }

//   this.calcStaffLines();
// }

// /**
//  * Calculates & applies the technique gap of the current
//  * bar element
//  */
// public calcTechniqueGap(): void {
//   // Reset labels gap height to 0
//   this._timeSigRect.y -= this._labelsGapHeight;
//   this._boundingBox.height -= this._labelsGapHeight;
//   this._labelsGapHeight = 0;

//   // Figure out which beat element
//   // is supposed to be the tallest one
//   let mostLabelsBeatHeight = this._boundingBox.height;
//   let mostLabelsCount = 0;
//   for (const tabBeatElement of this._tabBeatElements) {
//     if (tabBeatElement.techniqueLabelElements.length > mostLabelsCount) {
//       mostLabelsCount = tabBeatElement.techniqueLabelElements.length;
//       mostLabelsBeatHeight = tabBeatElement.boundingBox.height;
//     }
//   }

//   // Apply the necessary gap height
//   const newGapHeight = mostLabelsBeatHeight - this._boundingBox.height;
//   this._labelsGapHeight = newGapHeight;
//   this._boundingBox.height += this._labelsGapHeight;
//   this._timeSigRect.y += this._labelsGapHeight;

//   for (const tabBeatElement of this._tabBeatElements) {
//     tabBeatElement.setTechniqueGap(newGapHeight);
//   }

//   this.calcStaffLines();
// }
