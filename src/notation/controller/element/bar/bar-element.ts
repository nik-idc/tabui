import { Bar, BarRepeatStatus, VoiceNumber } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
import { TrackElement } from "@/notation/controller/element/track-element";
import { NotationElement } from "@/notation/controller/element/notation-element";
import {
  NotationStyle,
  StaffLineElement,
} from "@/notation/controller/element/staff/staff-line-element";
import { NotationStyleLineElement } from "@/notation/controller/element/staff/notation-style-line-element";
import { HorLine, VertLine } from "@/shared/rendering/geometry/line";
import { VoiceBarElement } from "./voice-bar-element";
import { VoiceBarRhythmElement } from "./voice-bar-rhythm-element";
import { BeatElement } from "../beat/beat-element";
import type { TrackLineElement } from "../track/track-line-element";

/**
 * Class that handles geometry & visually relevant info of a bar
 */
export class BarElement implements NotationElement {
  private static readonly startRepeatWidthFactor = 2;
  private static readonly endRepeatWidthFactor = 1;

  public static createStableIdentity(
    notationStyle: NotationStyle,
    bar: Bar
  ): string {
    return `bar:${bar.uuid}:${notationStyle}`;
  }

  /** Unique identifier for the bar element */
  readonly uuid: number;
  /** The bar */
  readonly bar: Bar;
  /** Notation style for this bar element. */
  readonly notationStyle: NotationStyle;
  /** Parent bars line element */
  public notationStyleLineElement!: NotationStyleLineElement;
  /** Root track element */
  readonly trackElement: TrackElement;
  readonly voiceNumber = null;

  public get owningTrackLineElement(): TrackLineElement {
    return this.notationStyleLineElement.staffLineElement.trackLineElement;
  }

  public get owningBarElement(): BarElement {
    return this;
  }

  /** Finalized width for this bar's master bar as determined in the skeleton */
  private _finalizedWidth: number;

  /** Voice bar elements containing each voice bar's notation elements */
  private _voiceBarElements: VoiceBarElement[];
  /** Voice bar rhythm elements containing each voice bar's rhythm elements stacked vertically */
  private _voiceBarRhythmElements: VoiceBarRhythmElement[];

  /** Bar element rectangle */
  private _boundingBox: Rect;
  /** Bar element's lines */
  private _staffLines: HorLine[];
  /** Kept as separate because is part of geometry state that has to be fully stale pre-update */
  private _showTempo: boolean;
  /** Kept as separate because is part of geometry state that has to be fully stale pre-update */
  private _durationsFit: boolean;
  /** Repeat status captured during build for stale pre-update diffing. */
  private _repeatStatusState: BarRepeatStatus;
  /** Time signature rectangle */
  private _timeSigRect?: Rect;

  /**
   * Class that handles geometry & visually relevant info of a bar
   * @param bar Bar
   * @param notationStyleLineElement Parent notation style line element
   * @param finalizedWidth Finalized width for this bar's master bar as
   * determined in the skeleton
   */
  constructor(
    bar: Bar,
    trackElement: TrackElement,
    notationStyle: NotationStyle,
    finalizedWidth: number,
    notationStyleLineElement?: NotationStyleLineElement
  ) {
    this.uuid = randomInt();
    this.bar = bar;
    this.trackElement = trackElement;
    this.notationStyle = notationStyle;
    if (notationStyleLineElement !== undefined) {
      this.notationStyleLineElement = notationStyleLineElement;
    }
    this._finalizedWidth = finalizedWidth;

    this._showTempo = false;
    this._durationsFit = false;
    this._repeatStatusState = this.bar.masterBar.repeatStatus;

    this._voiceBarElements = [];
    this._voiceBarRhythmElements = [];

    this._boundingBox = new Rect();
    this._staffLines = Array.from(
      { length: this.bar.trackContext.instrument.maxPolyphony },
      () => new HorLine()
    );
    this._timeSigRect = new Rect();
    if (notationStyleLineElement !== undefined) {
      this.build();
    }
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
    this._durationsFit = this.bar.checkDurationsFit();
    this._repeatStatusState = this.bar.masterBar.repeatStatus;

    if (
      prevBar !== null &&
      prevBar.masterBar.maxDuration === this.bar.masterBar.maxDuration
    ) {
      this._timeSigRect = undefined;
    } else {
      this._timeSigRect = new Rect();
    }
  }

  private buildVoiceBarElements(): void {
    const prevVoiceBarElements = new Map(
      this._voiceBarElements.map((e) => [e.getStableIdentity(), e])
    );

    this._voiceBarElements = [];
    for (const voiceBar of this.bar.voiceBarsAsArray) {
      const existingVoiceBar = prevVoiceBarElements.get(
        VoiceBarElement.createStableIdentity(this.notationStyle, voiceBar)
      );
      if (existingVoiceBar) {
        existingVoiceBar.build();
        this._voiceBarElements.push(existingVoiceBar);
        continue;
      }

      this._voiceBarElements.push(new VoiceBarElement(voiceBar, this));
    }
  }

  private buildVoiceBarRhythmElements(): void {
    this._voiceBarRhythmElements = [];

    const nonEmptyVoices =
      this.notationStyleLineElement.staffLineElement.lineNonEmptyVoiceNumbers;
    for (const voiceNumber of nonEmptyVoices) {
      const voiceBarElement = this._voiceBarElements.find(
        (e) => e.voiceBar.voiceNumber === voiceNumber
      );

      this._voiceBarRhythmElements.push(
        new VoiceBarRhythmElement(this, voiceNumber, voiceBarElement)
      );
    }
  }

  public build(): void {
    this.buildStructuralElements();
    this.buildVoiceBarElements();
    this.buildVoiceBarRhythmElements();
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
   * Calc main outer rectangle dimensions
   */
  private measureRect(): void {
    const voiceBarElementsArr = Object.values(this._voiceBarElements);
    const rhythmRowsHeight = this._voiceBarRhythmElements.reduce(
      (sum, row) => sum + row.boundingBox.height,
      0
    );

    this._boundingBox.setDimensions(
      this._finalizedWidth,
      (voiceBarElementsArr[0]?.boundingBox.height ??
        EditorLayoutDimensions.getStaffHeight(
          this.bar.trackContext.instrument
        )) + rhythmRowsHeight
    );
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
    this.measureTimeSigRect();

    for (const voiceBarElement of this._voiceBarElements) {
      voiceBarElement.measure();
    }

    for (const voiceBarRhythmElement of this._voiceBarRhythmElements) {
      voiceBarRhythmElement.measure();
    }

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

    const staffHeight = this._voiceBarElements[0].boundingBox.bottom; // - EditorLayoutDimensions.DURATIONS_HEIGHT;
    const yOffset = (staffHeight - this._timeSigRect.height) / 2;
    this._timeSigRect.setCoords(0, yOffset);
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
   * Calculates layout for all child elements, i.e. their X and Y coordinates
   */
  public layout(): void {
    this.layoutRect();

    this.layoutTimeSigRect();
    this.layoutStaffLines();

    for (const voiceBarElement of this._voiceBarElements) {
      voiceBarElement.layout();
    }

    for (const voiceBarRhythmElement of this._voiceBarRhythmElements) {
      voiceBarRhythmElement.layout();
    }
  }

  /**
   * Updates the element fully
   */
  public update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  public getPrevVoiceBarRhythmElement(
    voiceBarRhythmElement: VoiceBarRhythmElement
  ): VoiceBarRhythmElement | null {
    const index = this._voiceBarRhythmElements.indexOf(voiceBarRhythmElement);
    const prevBarRhythmElement = this._voiceBarRhythmElements[index - 1];
    return prevBarRhythmElement ?? null;
  }

  public getNextVoiceBarRhythmElement(
    voiceBarRhythmElement: VoiceBarRhythmElement
  ): VoiceBarRhythmElement | null {
    const index = this._voiceBarRhythmElements.indexOf(voiceBarRhythmElement);
    const nextBarRhythmElement = this._voiceBarRhythmElements[index + 1];
    return nextBarRhythmElement ?? null;
  }

  public refreshOwnedNotationElements(): NotationElement[] {
    const elements: NotationElement[] = [this];

    elements.push(
      ...Object.values(this._voiceBarElements).flatMap((segment) =>
        segment.refreshOwnedNotationElements()
      )
    );
    elements.push(
      ...Object.values(this._voiceBarRhythmElements).flatMap((segment) =>
        segment.refreshOwnedNotationElements()
      )
    );

    return elements;
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    const hashArr: string[] = [
      `${this.globalBoundingBox.x}` +
        `${this.globalBoundingBox.y}` +
        `${this.globalBoundingBox.width}` +
        `${this.globalBoundingBox.height}`,
    ];

    hashArr.push(`${this._showTempo}`);
    hashArr.push(`${this._repeatStatusState}`);

    if (this._timeSigRect !== undefined) {
      hashArr.push(`${this._timeSigRect.x}`);
      hashArr.push(`${this._timeSigRect.y}`);
      hashArr.push(`${this._timeSigRect.width}`);
      hashArr.push(`${this._timeSigRect.height}`);
    }

    for (const line of this._staffLines) {
      hashArr.push(`${line.x1}${line.x2}${line.y}`);
    }

    hashArr.push(`${this._durationsFit ? 1 : 0}`);

    return hashArr.join("");
  }

  public get finalizedWidth(): number {
    return this._finalizedWidth;
  }

  public get voiceContentHeight(): number {
    return (
      this._voiceBarElements[0]?.boundingBox.height ??
      EditorLayoutDimensions.getStaffHeight(this.bar.trackContext.instrument)
    );
  }

  public get voiceContentWidth(): number {
    return this.finalizedWidth - this.startGap.width - this.endGap.width;
  }

  public get beatElements(): BeatElement[] {
    return this._voiceBarElements.flatMap((element) => element.beatElements);
  }

  public getStableIdentity(): string {
    return BarElement.createStableIdentity(this.notationStyle, this.bar);
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

    return new Point(this._timeSigRect.x, this._timeSigRect.y);
  }

  /** Time signature beats text coords in track line-local coordinates */
  get timeSigBeatsTextCoordsLineLocal(): Point | undefined {
    if (this.timeSigBeatsTextCoords === undefined) {
      return undefined;
    }

    return new Point(
      this.lineLocalCoords.x + this.timeSigBeatsTextCoords.x,
      this.lineLocalCoords.y + this.timeSigBeatsTextCoords.y
    );
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

    return new Point(this._timeSigRect.x, this._timeSigRect.middleY);
  }

  /** Time signature measure text coords in track line-local coordinates */
  get timeSigDurationTextCoordsLineLocal(): Point | undefined {
    if (this.timeSigDurationTextCoords === undefined) {
      return undefined;
    }

    return new Point(
      this.lineLocalCoords.x + this.timeSigDurationTextCoords.x,
      this.lineLocalCoords.y + this.timeSigDurationTextCoords.y
    );
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
  /** Bar left border line in track line-local coordinates */
  get barLeftBorderLineLineLocal(): VertLine {
    const line = this.barLeftBorderLine;
    return new VertLine(
      this.lineLocalCoords.x + line.x,
      this.lineLocalCoords.y + line.y1,
      this.lineLocalCoords.y + line.y2
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
      this._boundingBox.width,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2 +
        EditorLayoutDimensions.getStaffHeight(this.bar.trackContext.instrument)
    );
  }

  /** Bar right border line in track-line-local */
  get barRightBorderLineLineLocal(): VertLine {
    return new VertLine(
      this.lineLocalCoords.x + this._boundingBox.width,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2 + this.lineLocalCoords.y,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2 +
        this.lineLocalCoords.y +
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
    const y = this.showTempo ? EditorLayoutDimensions.TEMPO_RECT_HEIGHT : 0;
    let width =
      EditorLayoutDimensions.REPEAT_SIGN_WIDTH *
      BarElement.startRepeatWidthFactor;
    if (this._timeSigRect !== undefined) {
      width += this._timeSigRect.width;
    }
    const height = this._boundingBox.height;
    return new Rect(x, y, width, height);
  }

  /** Gap at the fron of the bar (time sig. and/or repeat start) in global coords */
  get startGapGlobal(): Rect {
    const x = 0;
    const y = this.showTempo ? EditorLayoutDimensions.TEMPO_RECT_HEIGHT : 0;
    let width =
      EditorLayoutDimensions.REPEAT_SIGN_WIDTH *
      BarElement.startRepeatWidthFactor;
    if (this._timeSigRect !== undefined) {
      width += this._timeSigRect.width;
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
    const width =
      EditorLayoutDimensions.REPEAT_SIGN_WIDTH *
      BarElement.endRepeatWidthFactor;
    const height = this._boundingBox.height;
    const x = this._boundingBox.right - width;
    const y = this.showTempo ? EditorLayoutDimensions.TEMPO_RECT_HEIGHT : 0;
    return new Rect(x, y, width, height);
  }

  /** Gap at the fron of the bar (repeat end) in global coords */
  get endGapGlobal(): Rect {
    const width =
      EditorLayoutDimensions.REPEAT_SIGN_WIDTH *
      BarElement.endRepeatWidthFactor;
    const height = this._boundingBox.height;
    const x = this._boundingBox.right - width;
    const y = this.showTempo ? EditorLayoutDimensions.TEMPO_RECT_HEIGHT : 0;
    return new Rect(
      this.globalCoords.x + x,
      this.globalCoords.y + y,
      width,
      height
    );
  }

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(
      this.notationStyleLineElement.lineLocalCoords.x + this._boundingBox.x,
      this.notationStyleLineElement.lineLocalCoords.y + this._boundingBox.y
    );
  }

  /** Bounding box of this element in track line-local coordinates */
  public get lineLocalBoundingBox(): Rect {
    return new Rect(
      this.lineLocalCoords.x,
      this.lineLocalCoords.y,
      this._boundingBox.width,
      this._boundingBox.height
    );
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
  public get staffLinesLineLocal(): HorLine[] {
    const result = [];
    for (const line of this._staffLines) {
      result.push(
        new HorLine(
          this.lineLocalCoords.x + line.x1,
          this.lineLocalCoords.x + line.x2,
          this.lineLocalCoords.y + line.y
        )
      );
    }

    return result;
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

  /** Time signature rectangle */
  public get timeSigRect(): Rect | undefined {
    return this._timeSigRect;
  }

  /** Repeat start sign rectangle */
  public get repeatStartRect(): Rect | undefined {
    if (this._repeatStatusState !== BarRepeatStatus.Start) {
      return undefined;
    }

    return new Rect(
      this._timeSigRect?.right ?? 0,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2,
      EditorLayoutDimensions.REPEAT_SIGN_WIDTH,
      EditorLayoutDimensions.getStaffHeight(this.bar.trackContext.instrument)
    );
  }

  /** Repeat start sign rectangle in global coords */
  public get repeatStartRectLineLocal(): Rect | undefined {
    const repeatStartRect = this.repeatStartRect;
    if (repeatStartRect === undefined) {
      return undefined;
    }

    return new Rect(
      this.lineLocalCoords.x + repeatStartRect.x,
      this.lineLocalCoords.y + repeatStartRect.y,
      repeatStartRect.width,
      repeatStartRect.height
    );
  }

  /** Repeat start sign rectangle in global coords */
  public get repeatStartRectGlobal(): Rect | undefined {
    const repeatStartRect = this.repeatStartRect;
    if (repeatStartRect === undefined) {
      return undefined;
    }

    return new Rect(
      this.globalCoords.x + repeatStartRect.x,
      this.globalCoords.y + repeatStartRect.y,
      repeatStartRect.width,
      repeatStartRect.height
    );
  }

  /** Repeat end sign rectangle */
  public get repeatEndRect(): Rect | undefined {
    if (this._repeatStatusState !== BarRepeatStatus.End) {
      return undefined;
    }

    return new Rect(
      this._boundingBox.width - EditorLayoutDimensions.REPEAT_SIGN_WIDTH,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2,
      EditorLayoutDimensions.REPEAT_SIGN_WIDTH,
      EditorLayoutDimensions.getStaffHeight(this.bar.trackContext.instrument)
    );
  }

  /** Repeat end sign rectangle in track-line-local coords */
  public get repeatEndRectLineLocal(): Rect | undefined {
    const repeatEndRect = this.repeatEndRect;
    if (repeatEndRect === undefined) {
      return undefined;
    }

    return new Rect(
      this.lineLocalCoords.x + repeatEndRect.x,
      this.lineLocalCoords.y + repeatEndRect.y,
      repeatEndRect.width,
      repeatEndRect.height
    );
  }

  /** Repeat end sign rectangle in global coords */
  public get repeatEndRectGlobal(): Rect | undefined {
    const repeatEndRect = this.repeatEndRect;
    if (repeatEndRect === undefined) {
      return undefined;
    }

    return new Rect(
      this.globalCoords.x + repeatEndRect.x,
      this.globalCoords.y + repeatEndRect.y,
      repeatEndRect.width,
      repeatEndRect.height
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
