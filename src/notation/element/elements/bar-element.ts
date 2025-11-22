import { Bar, BarRepeatStatus, Beat } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { BeamSegmentElement } from "./beam-segment-element";
import { BeatElement } from "./beat-element";
import { BarTupletGroupElement } from "./bar-tuplet-group-element";
import { TabLayoutDimensions } from "../tab-controller-dim";
import { StaffLineElement } from "./staff-line-element";

/**
 * Class that handles geometry & visually relevant info of a bar
 */
export class BarElement {
  /** Unique identifier for the bar element */
  readonly uuid: number;
  /** The bar */
  readonly bar: Bar;
  /** Parent staff line element */
  readonly staffLineElement: StaffLineElement;

  /** This bar's beat elements */
  private _beatElements: BeatElement[];
  /** Beam segments of this bar element */
  private _beamSegments: BeamSegmentElement[];
  /** All tuplet elements */
  private _tupletElements: BarTupletGroupElement[];
  /** Bar element rectangle */
  private _rect: Rect;
  /** Bar element's lines */
  private _staffLines: Point[][];
  /** Tempo rectangle */
  private _tempoRect: Rect;
  /** Time signature rectangle */
  private _timeSigRect: Rect;
  /** Repeat sign rectangle */
  private _repeatRect: Rect;
  /** If signature is to be shown in the bar */
  private _showSignature: boolean;
  /** If tempo is to be shown in the bar */
  private _showTempo: boolean;
  /** Technique label gap height */
  private _labelsGapHeight: number;

  /**
   * Class that handles geometry & visually relevant info of a bar
   * @param bar Bar
   * @param staffLineElement Parent staff line element
   */
  constructor(bar: Bar, staffLineElement: StaffLineElement) {
    this.uuid = randomInt();
    this.bar = bar;
    this.staffLineElement = staffLineElement;

    this._beatElements = [];
    this._showSignature = false;
    this._showTempo = false;
    this._tempoRect = new Rect();
    this._timeSigRect = new Rect();
    this._repeatRect = new Rect();
    this._beamSegments = [];
    this._tupletElements = [];
    this._labelsGapHeight = 0;
    this._rect = new Rect();
    this._staffLines = [];

    this.calc();
  }

  /**
   * Calculates time sig & tempo visibility
   */
  private calcVisibility(): void {
    const prevBar = this.bar.staff.getPrevBar(this.bar);

    this._showSignature =
      prevBar !== null
        ? this.bar.masterBar.maxDuration !== this.bar.masterBar.maxDuration
        : true;
    this._showTempo =
      prevBar !== null
        ? this.bar.masterBar.tempo !== prevBar.masterBar.tempo
        : true;
  }

  /**
   * Calc tempo rectangle
   */
  private calcTempoRect(): void {
    // Tempo rectangle
    const tempoRectWidth = this._showTempo
      ? TabLayoutDimensions.TEMPO_RECT_WIDTH
      : 0;
    this._tempoRect.x = 0;
    this._tempoRect.y = 0;
    this._tempoRect.width = tempoRectWidth;
    this._tempoRect.height = TabLayoutDimensions.TEMPO_RECT_HEIGHT;
  }

  /**
   * Calc time signature rectangle
   */
  private calcTimeSigRect(): void {
    // Time signature rectangle
    const timeSigWidth = this._showSignature
      ? TabLayoutDimensions.TIME_SIG_RECT_WIDTH
      : 0;
    this._timeSigRect.x =
      this.bar.masterBar.repeatStatus === BarRepeatStatus.Start
        ? TabLayoutDimensions.REPEAT_SIGN_WIDTH
        : 0;
    this._timeSigRect.y =
      this._tempoRect.leftBottom.y +
      TabLayoutDimensions.TUPLET_RECT_HEIGHT +
      TabLayoutDimensions.DURATIONS_HEIGHT +
      this._labelsGapHeight +
      TabLayoutDimensions.NOTE_RECT_HEIGHT / 2;
    this._timeSigRect.width = timeSigWidth;
    this._timeSigRect.height = TabLayoutDimensions.getStaffHeight(
      this.bar.trackContext.instrument
    );
  }

  /**
   * Calculates the bar outer rectangle & beat elements
   */
  private calcRectAndBeats(): void {
    // Set main rectangle
    const prevBarElement = this.staffLineElement.getPrevBarElement(this);
    this._rect.x = prevBarElement?._rect.x ?? 0;
    this._rect.y = 0;
    this._rect.width =
      this.bar.masterBar.repeatStatus === BarRepeatStatus.Start
        ? TabLayoutDimensions.REPEAT_SIGN_WIDTH
        : 0;
    this._rect.width += this._showSignature ? this._timeSigRect.width : 0;

    // Calculate beats
    this._beatElements = [];
    for (const beat of this.bar.beats) {
      const beatElement = new BeatElement(beat, this);
      this._beatElements.push(beatElement);

      this._rect.width += beatElement.rect.width;
    }

    if (this.bar.masterBar.repeatStatus === BarRepeatStatus.End) {
      this._rect.width += TabLayoutDimensions.REPEAT_SIGN_WIDTH;
    }
  }

  /**
   * Calculates beaming groups
   */
  private calcBeamGroups(): void {
    this._beamSegments = [];
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
            curBeatElement,
            nextBeatElement,
            prevBeatElement
          )
        );
      }
    }
  }

  /**
   * Calculates tuplet elements
   */
  private calcBarTupletGroupElements(): void {
    this._tupletElements = [];
    for (const tupletGroup of this.bar.tupletGroups) {
      const tupletBeatElements = this._beatElements.filter((b) =>
        tupletGroup.beats.some((tb) => tb.actualBeat.uuid === b.beat.uuid)
      );

      this._tupletElements.push(
        new BarTupletGroupElement(tupletGroup, this, tupletBeatElements)
      );
    }
  }

  /**
   * Calculates repeat rectangle
   */
  private calcRepeatRect(): void {
    if (this.bar.masterBar.repeatStatus === BarRepeatStatus.None) {
      this._repeatRect.reset();
    } else if (this.bar.masterBar.repeatStatus === BarRepeatStatus.Start) {
      this._repeatRect.set(
        0,
        this._timeSigRect.y,
        TabLayoutDimensions.REPEAT_SIGN_WIDTH,
        TabLayoutDimensions.getStaffHeight(this.bar.trackContext.instrument)
      );
    } else if (this.bar.masterBar.repeatStatus === BarRepeatStatus.End) {
      this._repeatRect.set(
        this._rect.width - TabLayoutDimensions.REPEAT_SIGN_WIDTH,
        this._timeSigRect.y,
        TabLayoutDimensions.REPEAT_SIGN_WIDTH,
        TabLayoutDimensions.getStaffHeight(this.bar.trackContext.instrument)
      );
    }
  }

  /**
   * Calculates bar's staff lines
   */
  private calcStaffLines(): void {
    // Make lines
    this._staffLines = [];
    let y =
      this._rect.leftBottom.y -
      TabLayoutDimensions.getStaffHeight(this.bar.trackContext.instrument) -
      TabLayoutDimensions.NOTE_RECT_HEIGHT / 2;
    for (let i = 0; i < this.bar.trackContext.instrument.maxPolyphony; i++) {
      this._staffLines.push([new Point(0, y), new Point(this._rect.width, y)]);

      y += TabLayoutDimensions.NOTE_RECT_HEIGHT;
    }
  }

  /**
   * Calculates this bar element
   */
  calc(): void {
    this.calcVisibility();
    this.calcTempoRect();
    this.calcTimeSigRect();
    this.calcRectAndBeats();
    this.calcBeamGroups();
    this.calcBarTupletGroupElements();
    this.calcRepeatRect();
    this.calcStaffLines();
  }

  /**
   * Sets technique gap height to the new provided value
   * @param newGapHeight New gap height
   */
  public setTechniqueGap(newGapHeight: number): void {
    // Apply the necessary gap height
    const oldGapHeight = this._labelsGapHeight;

    this._rect.height += newGapHeight - oldGapHeight;
    this._timeSigRect.y += newGapHeight - oldGapHeight;

    this._labelsGapHeight = newGapHeight;

    for (const beatElement of this._beatElements) {
      beatElement.setTechniqueGap(newGapHeight);
    }

    this.calcStaffLines();
  }

  /**
   * Calculates & applies the technique gap of the current
   * bar element
   */
  public calcTechniqueGap(): void {
    // Reset labels gap height to 0
    this._timeSigRect.y -= this._labelsGapHeight;
    this._rect.height -= this._labelsGapHeight;
    this._labelsGapHeight = 0;

    // Figure out which beat element
    // is supposed to be the tallest one
    let mostLabelsBeatHeight = this._rect.height;
    let mostLabelsCount = 0;
    for (const beatElement of this._beatElements) {
      if (beatElement.techniqueLabelElements.length > mostLabelsCount) {
        mostLabelsCount = beatElement.techniqueLabelElements.length;
        mostLabelsBeatHeight = beatElement.rect.height;
      }
    }

    // Apply the necessary gap height
    const newGapHeight = mostLabelsBeatHeight - this._rect.height;
    this._labelsGapHeight = newGapHeight;
    this._rect.height += this._labelsGapHeight;
    this._timeSigRect.y += this._labelsGapHeight;

    for (const beatElement of this._beatElements) {
      beatElement.setTechniqueGap(newGapHeight);
    }

    this.calcStaffLines();
  }

  /**
   * Scales the element & its children horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    this._rect.x *= scale;
    this._tempoRect.x *= scale;
    this._repeatRect.x *= scale;
    this._timeSigRect.x *= scale;
    this._rect.width *= scale;
    this._tempoRect.width *= scale;
    this._repeatRect.width *= scale;
    this._timeSigRect.width *= scale;

    for (const line of this._staffLines) {
      line[0].x *= scale;
      line[1].x *= scale;
    }

    for (const beatElement of this._beatElements) {
      beatElement.scaleHorBy(scale);
    }

    for (const beamSegment of this._beamSegments) {
      // beamSegment.scaleHorBy(scale);
      beamSegment.calc();
    }

    for (const tupletElement of this._tupletElements) {
      tupletElement.scaleHorBy(scale);
    }
  }

  /** Time signature beats rectangle */
  get beatsRect(): Rect {
    return new Rect(
      this._timeSigRect.x,
      this._timeSigRect.y,
      this._timeSigRect.width,
      this._timeSigRect.height / 2
    );
  }

  /** Time signature beats text coords */
  get beatsTextCoords(): Point {
    return new Point(
      this._timeSigRect.x + this._timeSigRect.width / 2,
      this._timeSigRect.y + this._timeSigRect.height / 3
    );
  }

  /** Time signature measure text rectangle */
  get measureRect(): Rect {
    return new Rect(
      this._timeSigRect.x,
      this._timeSigRect.y + this._timeSigRect.height / 2,
      this._timeSigRect.width,
      this._timeSigRect.height / 2
    );
  }

  /** Time signature measure text coords */
  get measureTextCoords(): Point {
    return new Point(
      this._timeSigRect.x + this._timeSigRect.width / 2,
      this.beatsRect.leftBottom.y + this._timeSigRect.height / 3
    );
  }

  /** Tempo image coords */
  get tempoImageRect(): Rect {
    return new Rect(
      this._tempoRect.x,
      this._tempoRect.y + TabLayoutDimensions.TEMPO_TEXT_SIZE / 4,
      TabLayoutDimensions.TEMPO_TEXT_SIZE,
      TabLayoutDimensions.TEMPO_TEXT_SIZE
    );
  }

  /** Tempo text coords */
  get tempoTextCoords(): Point {
    return new Point(
      this._tempoRect.x + TabLayoutDimensions.TEMPO_TEXT_SIZE,
      this._tempoRect.y + TabLayoutDimensions.TEMPO_TEXT_SIZE
    );
  }

  /** Bar left border line (array of 2 points) */
  get barLeftBorderLine(): Point[] {
    return [
      new Point(0, this.beatsRect.y),
      new Point(0, this.measureRect.leftBottom.y),
    ];
  }

  /** Bar right border line (array of 2 points) */
  get barRightBorderLine(): Point[] {
    return [
      new Point(this._rect.width, this.beatsRect.y),
      new Point(this._rect.width, this.measureRect.leftBottom.y),
    ];
  }

  /** This bar's beat elements */
  public get beatElements(): BeatElement[] {
    return this._beatElements;
  }

  /** Beam segments of this bar element */
  public get beamSegments(): BeamSegmentElement[] {
    return this._beamSegments;
  }

  /** All tuplet elements */
  public get tupletElements(): BarTupletGroupElement[] {
    return this._tupletElements;
  }

  /** Bar element rectangle */
  public get rect(): Rect {
    return this._rect;
  }

  /** Bar element's lines */
  public get staffLines(): Point[][] {
    return this._staffLines;
  }

  /** Tempo rectangle */
  public get tempoRect(): Rect {
    return this._tempoRect;
  }

  /** Time signature rectangle */
  public get timeSigRect(): Rect {
    return this._timeSigRect;
  }

  /** Repeat sign rectangle */
  public get repeatRect(): Rect {
    return this._repeatRect;
  }

  /** If signature is to be shown in the bar */
  public get showSignature(): boolean {
    return this._showSignature;
  }

  /** If tempo is to be shown in the bar */
  public get showTempo(): boolean {
    return this._showTempo;
  }

  /** Technique label gap height */
  public get labelsGapHeight(): number {
    return this._labelsGapHeight;
  }
}
