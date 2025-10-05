import { Bar, BarRepeatStatus } from "./../../models/bar";
import { Rect } from "../shapes/rect";
import { BeatElement } from "./beat-element";
import { TabWindow } from "../tab-window";
import { Point } from "../shapes/point";
import { Beat } from "./../../models/beat";
import { TabWindowDim } from "../tab-window-dim";
import { NoteDuration } from "../../models/note-duration";
import { randomInt } from "../../misc/random-int";
import { BeamSegmentElement } from "./beam-segment-element";
import { TupletElement } from "./tuplet-element";

/**
 * Class that handles drawing beat element in the tab
 */
export class BarElement {
  readonly uuid: number;
  /**
   * Tab window dimensions
   */
  readonly dim: TabWindowDim;
  /**
   * This bar's beat elements
   */
  public beatElements: BeatElement[];
  /**
   * If signature is to be shown in the bar
   */
  public showSignature: boolean;
  /**
   * If tempo is to be shown in the bar
   */
  public showTempo: boolean;
  /**
   * Tempo rectangle
   */
  public tempoRect: Rect;
  /**
   * Time signature rectangle
   */
  public timeSigRect: Rect;
  /**
   * Repeat sign rectangle
   */
  public repeatRect: Rect;
  /**
   * The height of the gap between durations and notes for effect labels
   */
  private _labelsGapHeight: number;
  /**
   * Beam segments of this bar element
   */
  public beamSegments: BeamSegmentElement[];
  /**
   * All tuplet elements
   */
  public tupletElements: TupletElement[];
  /**
   * Bar element rectangle
   */
  public rect: Rect;
  /**
   * Bar element's lines
   * The reason they are here and not in 'TabLineElement' is
   * because, if a bar's durations don't fit the lines of that
   * specific bar, then they need to be red. No way to do that
   * in 'TabLineElement'
   */
  public staffLines: Point[][];
  /**
   * The bar
   */
  readonly bar: Bar;

  /**
   * Class that handles drawing beat element in the tab
   * @param dim Tab window dimensions
   * @param barCoords Bar element coords
   * @param bar Bar
   * @param showSignature Whether to show signature
   * @param showTempo Whether to show tempo
   */

  constructor(
    dim: TabWindowDim,
    // barCoords: Point,
    bar: Bar,
    showSignature: boolean,
    showTempo: boolean,
    horizontalBarOffset: number = 0,
    labelGapHeight: number = 0
  ) {
    this.uuid = randomInt();
    this.dim = dim;
    this.beatElements = [];
    this.showSignature = showSignature;
    this.showTempo = showTempo;
    this.tempoRect = new Rect();
    this.timeSigRect = new Rect();
    this.repeatRect = new Rect();
    this.beamSegments = [];
    this.tupletElements = [];
    this._labelsGapHeight = labelGapHeight;
    this.rect = new Rect(
      horizontalBarOffset,
      0,
      0,
      this.dim.tabLineMinHeight + this._labelsGapHeight
    );
    this.bar = bar;
    this.staffLines = [];

    this.calc();
  }

  public update(prevBar?: Bar, horizontalBarOffset: number = 0): void {
    this.showSignature =
      prevBar !== undefined ? this.bar.signature !== prevBar.signature : true;
    this.showTempo =
      prevBar !== undefined ? this.bar.tempo !== prevBar.tempo : true;
    this.rect.x = horizontalBarOffset;
    this.calc();
  }

  /**
   * TODO: Change all elements except TabLineElement to use local coords
   * Later adjust the render function
   */

  private calcTempoRect(): void {
    // Tempo rectangle
    const tempoRectWidth = this.showTempo ? this.dim.tempoRectWidth : 0;
    this.tempoRect.x = 0;
    this.tempoRect.y = 0;
    this.tempoRect.width = tempoRectWidth;
    this.tempoRect.height = this.dim.tempoRectHeight;
  }

  private calcTimeSigRect(): void {
    // Time signature rectangle
    const timeSigWidth = this.showSignature ? this.dim.timeSigRectWidth : 0;
    this.timeSigRect.x =
      this.bar.repeatStatus === BarRepeatStatus.Start
        ? this.dim.repeatSignWidth
        : 0;
    this.timeSigRect.y =
      this.tempoRect.leftBottom.y +
      this.dim.tupletRectHeight +
      this.dim.durationsHeight +
      this._labelsGapHeight +
      this.dim.noteRectHeight / 2;
    this.timeSigRect.width = timeSigWidth;
    this.timeSigRect.height = this.dim.timeSigRectHeight;
  }

  private calcBeatsAndRect(): void {
    // Set main rectangle
    this.rect.width =
      this.bar.repeatStatus === BarRepeatStatus.Start
        ? this.dim.repeatSignWidth
        : 0;
    this.rect.width += this.showSignature ? this.timeSigRect.width : 0;

    // Calculate beats
    const newBeatElements: BeatElement[] = [];
    const oldBeatElements = [...this.beatElements];

    let startX = 0;
    if (this.bar.repeatStatus === BarRepeatStatus.Start) {
      startX += this.dim.repeatSignWidth;
    }
    if (this.showSignature) {
      startX += this.dim.timeSigRectWidth;
    }

    const beatCoords = new Point(
      startX,
      this.rect.y + this.tempoRect.height + this.dim.tupletRectHeight
    );
    for (const beat of this.bar.beats) {
      const oldElementIndex = oldBeatElements.findIndex(
        (e) => e.beat.uuid === beat.uuid
      );
      let beatElement: BeatElement;

      if (oldElementIndex !== -1) {
        // Beat already present in the bar and calc-ed,
        // need to just update it
        beatElement = oldBeatElements.splice(oldElementIndex, 1)[0];
        beatElement.rect.x = beatCoords.x;
        beatElement.rect.y = beatCoords.y;
        beatElement.calc();
      } else {
        // New beat added to the bar, not yet calc-ed,
        // so need to create a new beat element and add it
        beatElement = new BeatElement(
          this.dim,
          beatCoords,
          beat,
          this._labelsGapHeight
        );
      }

      newBeatElements.push(beatElement);

      beatCoords.x += beatElement.rect.width;
      this.rect.width += beatElement.rect.width;
    }
    this.beatElements = newBeatElements;

    if (this.bar.repeatStatus === BarRepeatStatus.End) {
      this.rect.width += this.dim.repeatSignWidth;
    }
  }

  private calcBeamGroups(): void {
    this.beamSegments = [];
    for (let i = 0; i < this.bar.beamingGroups.length; i++) {
      const beamGroupBeats = this.beatElements.filter(
        (beatEl) => beatEl.beat.beamGroupId === i
      );

      if (beamGroupBeats.length <= 1) {
        continue;
      }

      for (let j = 0; j < beamGroupBeats.length - 1; j++) {
        const curBeatElement = beamGroupBeats[j];
        const nextBeatElement = beamGroupBeats[j + 1];
        const prevBeatElement = j === 0 ? undefined : beamGroupBeats[j - 1];
        this.beamSegments.push(
          new BeamSegmentElement(
            curBeatElement,
            nextBeatElement,
            prevBeatElement
          )
        );
      }
    }
  }

  private calcTupletElements(): void {
    this.tupletElements = [];
    for (const tupletGroup of this.bar.tupletGroups) {
      const startBeatElement = this.beatElements.find((be) => {
        return be.beat.uuid === tupletGroup.beats[0].actualBeat.uuid;
      });
      if (startBeatElement === undefined) {
        throw Error("Could not find starting beat element of tuplet group");
      }

      const tupletGroupCoords = new Point(
        startBeatElement.rect.x,
        startBeatElement.rect.y
      );

      const tupletBeatElements = this.beatElements.filter((b) =>
        tupletGroup.beats.some((tb) => tb.actualBeat.uuid === b.beat.uuid)
      );

      this.tupletElements.push(
        new TupletElement(
          this.dim,
          tupletGroup,
          tupletBeatElements,
          tupletGroupCoords
        )
      );
    }

    // console.log(this.tupletElements);
  }

  private calcRepeatRect(): void {
    if (this.bar.repeatStatus === BarRepeatStatus.None) {
      this.repeatRect.reset();
    } else if (this.bar.repeatStatus === BarRepeatStatus.Start) {
      this.repeatRect.set(
        0,
        this.timeSigRect.y,
        this.dim.repeatSignWidth,
        this.dim.repeatSignHeight
      );
    } else if (this.bar.repeatStatus === BarRepeatStatus.End) {
      this.repeatRect.set(
        this.rect.width - this.dim.repeatSignWidth,
        this.timeSigRect.y,
        this.dim.repeatSignWidth,
        this.dim.repeatSignHeight
      );
    }
  }

  private calcStaffLines(): void {
    // Make lines
    this.staffLines = [];
    let y =
      this.rect.leftBottom.y -
      this.dim.timeSigRectHeight -
      this.dim.noteRectHeight / 2;
    for (let i = 0; i < this.bar.guitar.stringsCount; i++) {
      this.staffLines.push([new Point(0, y), new Point(this.rect.width, y)]);

      y += this.dim.noteRectHeight;
    }
  }

  /**
   * Calculates this bar element
   */
  calc(): void {
    this.calcTempoRect();
    this.calcTimeSigRect();
    this.calcBeatsAndRect();
    this.calcBeamGroups();
    this.calcTupletElements();
    this.calcRepeatRect();
    this.calcStaffLines();
  }

  public setEffectGap(newGapHeight: number): void {
    // Apply the necessary gap height
    const oldGapHeight = this._labelsGapHeight;

    this.rect.height += newGapHeight - oldGapHeight;
    this.timeSigRect.y += newGapHeight - oldGapHeight;

    this._labelsGapHeight = newGapHeight;

    for (const beatElement of this.beatElements) {
      beatElement.setEffectGap(newGapHeight);
    }

    this.calcStaffLines();
  }

  /**
   * Calculates & applies the effect gap of the current
   * bar element
   */
  public calcEffectGap(): void {
    // Reset labels gap height to 0
    this.timeSigRect.y -= this._labelsGapHeight;
    this.rect.height -= this._labelsGapHeight;
    this._labelsGapHeight = 0;

    // Figure out which beat element
    // is supposed to be the tallest one
    let mostLabelsBeatHeight = this.rect.height;
    let mostLabelsCount = 0;
    for (const beatElement of this.beatElements) {
      if (beatElement.effectLabelElements.length > mostLabelsCount) {
        mostLabelsCount = beatElement.effectLabelElements.length;
        mostLabelsBeatHeight = beatElement.rect.height;
      }
    }

    // Apply the necessary gap height
    const newGapHeight = mostLabelsBeatHeight - this.rect.height;
    this._labelsGapHeight = newGapHeight;
    this.rect.height += this._labelsGapHeight;
    this.timeSigRect.y += this._labelsGapHeight;

    for (const beatElement of this.beatElements) {
      beatElement.setEffectGap(newGapHeight);
    }

    this.calcStaffLines();
  }

  public scaleHorBy(scale: number): void {
    this.rect.x *= scale;
    this.tempoRect.x *= scale;
    this.repeatRect.x *= scale;
    this.timeSigRect.x *= scale;
    this.rect.width *= scale;
    this.tempoRect.width *= scale;
    this.repeatRect.width *= scale;
    this.timeSigRect.width *= scale;

    for (const line of this.staffLines) {
      line[0].x *= scale;
      line[1].x *= scale;
    }

    for (const beatElement of this.beatElements) {
      beatElement.scaleHorBy(scale);
    }

    for (const beamSegment of this.beamSegments) {
      // beamSegment.scaleHorBy(scale);
      beamSegment.calc();
    }

    for (const tupletElement of this.tupletElements) {
      tupletElement.scaleHorBy(scale);
    }
  }

  /**
   * Insert empty beat
   * @param index Insertion index
   */
  insertEmptyBeat(index: number): void {
    this.bar.insertEmptyBeat(index);

    this.calc();
  }

  /**
   * Prepend empty beat
   */
  prependBeat(): void {
    this.bar.prependBeat();

    this.calc();
  }

  /**
   * Append empty beat
   */
  appendBeat(): void {
    this.bar.appendBeat();

    this.calc();
  }

  /**
   * Remove beat at index
   * @param index Removal index
   */
  removeBeat(index: number): void {
    this.bar.removeBeat(index);

    this.calc();
  }

  /**
   * Remove beat using its UUID
   * @param uuid Beat's UUID
   */
  removeBeatByUUID(uuid: number): void {
    this.bar.removeBeatByUUID(uuid);

    this.calc();
  }

  /**
   * Change beat's duration
   * @param beat Beat
   * @param duration New duration
   */
  changeBeatDuration(beat: Beat, duration: number): void {
    this.bar.changeBeatDuration(beat, duration);

    this.calc();
  }

  /**
   * True if durations fit according to signature values
   */
  public get durationsFit(): boolean {
    return this.bar.durationsFit;
  }

  /**
   * Time signature beats rectangle
   */
  get beatsRect(): Rect {
    return new Rect(
      this.timeSigRect.x,
      this.timeSigRect.y,
      this.timeSigRect.width,
      this.timeSigRect.height / 2
    );
  }

  /**
   * Time signature beats text coords
   */
  get beatsTextCoords(): Point {
    return new Point(
      this.timeSigRect.x + this.timeSigRect.width / 2,
      this.timeSigRect.y + this.timeSigRect.height / 3
    );
  }

  /**
   * Time signature measure text rectangle
   */
  get measureRect(): Rect {
    return new Rect(
      this.timeSigRect.x,
      this.timeSigRect.y + this.timeSigRect.height / 2,
      this.timeSigRect.width,
      this.timeSigRect.height / 2
    );
  }

  /**
   * Time signature measure text coords
   */
  get measureTextCoords(): Point {
    return new Point(
      this.timeSigRect.x + this.timeSigRect.width / 2,
      this.beatsRect.leftBottom.y + this.timeSigRect.height / 3
    );
  }

  /**
   * Tempo image coords
   */
  get tempoImageRect(): Rect {
    return new Rect(
      this.tempoRect.x,
      this.tempoRect.y + this.dim.tempoTextSize / 4,
      this.dim.tempoTextSize,
      this.dim.tempoTextSize
    );
  }

  /**
   * Tempo text coords
   */
  get tempoTextCoords(): Point {
    return new Point(
      this.tempoRect.x + this.dim.tempoTextSize,
      this.tempoRect.y + this.dim.tempoTextSize
    );
  }

  /**
   * Bar left border line (array of 2 points)
   */
  get barLeftBorderLine(): Point[] {
    return [
      new Point(0, this.beatsRect.y),
      new Point(0, this.measureRect.leftBottom.y),
    ];
  }

  /**
   * Bar right border line (array of 2 points)
   */
  get barRightBorderLine(): Point[] {
    return [
      new Point(this.rect.width, this.beatsRect.y),
      new Point(this.rect.width, this.measureRect.leftBottom.y),
    ];
  }

  /**
   * Creates a new bar element
   * @param dim Tab window dimensions
   * @param bar Bar
   * @param prevBar Previous bar
   * @returns Created bar element
   */
  static createBarElement(
    dim: TabWindowDim,
    bar: Bar,
    prevBar?: Bar,
    horizontalBarOffset: number = 0,
    labelGapHeight: number = 0
  ): BarElement {
    const showSignature =
      prevBar !== undefined ? bar.signature !== prevBar.signature : true;
    const showTempo =
      prevBar !== undefined ? bar.tempo !== prevBar.tempo : true;

    const barElement = new BarElement(
      dim,
      bar,
      showSignature,
      showTempo,
      horizontalBarOffset,
      labelGapHeight
    );

    return barElement;
  }
}
