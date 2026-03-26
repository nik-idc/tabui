import { Point, Rect, randomInt } from "@/shared";
import { BeatElement } from "./beat-element";
import { BarElement } from "./bar-element";
import { TabLayoutDimensions } from "../tab-controller-dim";
import { TabBeatElement } from "./tab-beat-element";
import { DURATION_TO_FLAG_COUNT, MAX_FLAG_COUNT } from "@/notation/model";
import { NotationElement } from "./notation-element";
import { TrackElement } from "./track-element";

/**
 * Class that handles geometry & visually relevant info of a beam segment
 */
export class BeamSegmentElement implements NotationElement {
  /** Unique identifier for the beam segment element */
  readonly uuid: number;
  /** Parent bar element */
  readonly barElement: BarElement;
  /** Previous beat element */
  readonly prevBeatElement?: TabBeatElement;
  /** Current beat element */
  readonly curBeatElement: TabBeatElement;
  /** Next beat element */
  readonly nextBeatElement: TabBeatElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  /** Rectangle of the long beam */
  private _longRects: Rect[];
  /** Rectangle of the short rect */
  private _shortRect?: Rect;
  /** String encoding the state of this element */
  private _stateHash: string;

  /**
   * Class that handles geometry & visually relevant info of a beam segment
   * @param barElement Parent bar element
   * @param curBeatElement Previous beat element
   * @param nextBeatElement Current beat element
   * @param prevBeatElement Next beat element
   */
  constructor(
    barElement: BarElement,
    curBeatElement: TabBeatElement,
    nextBeatElement: TabBeatElement,
    prevBeatElement?: TabBeatElement
  ) {
    if (DURATION_TO_FLAG_COUNT[curBeatElement.beat.baseDuration] === 0) {
      throw Error("Beam segment for a beat with a non-beamable duration");
    }

    this.uuid = randomInt();
    this.barElement = barElement;
    this.trackElement = this.barElement.trackElement;
    this.prevBeatElement = prevBeatElement;
    this.curBeatElement = curBeatElement;
    this.nextBeatElement = nextBeatElement;

    this._longRects = [];

    this._stateHash = "";

    this.build();

    this.trackElement.registerElement(this);
  }

  /**
   * Initializes the long rectangles and the short rectangle
   */
  public build(): void {
    const count = DURATION_TO_FLAG_COUNT[this.curBeatElement.beat.baseDuration];
    for (let i = 0; i < count; i++) {
      this._longRects.push(new Rect());
    }

    const curDuration = this.curBeatElement.beat.baseDuration;
    const nextDuration = this.nextBeatElement.beat.baseDuration;
    if (curDuration >= nextDuration) {
      this._shortRect = undefined;
    } else {
      this._shortRect = new Rect();
    }
  }

  /**
   * Calculates the dimensions of long & short rectangles
   */
  public measure(): void {
    if (this.curBeatElement.durationStemLine === undefined) {
      throw Error("Cur duration stem line undefined in beam segment element");
    }
    if (this.nextBeatElement.durationStemLine === undefined) {
      throw Error("Next duration stem line undefined in beam segment element");
    }

    const longWidth =
      this.curBeatElement.rect.width / 2 + this.nextBeatElement.rect.width / 2;
    for (const rect of this._longRects) {
      rect.setDimensions(longWidth, TabLayoutDimensions.DURATION_FLAG_HEIGHT);
    }

    if (this._shortRect === undefined) {
      return;
    }

    const shortWidth = 10; // Should put this in tab layout dimensions
    this._shortRect.setDimensions(
      shortWidth,
      TabLayoutDimensions.DURATION_FLAG_HEIGHT
    );
  }

  /**
   * Calculates the state hash of the element
   * */
  private calcStateHash(): void {
    const hashArr: string[] = [
      `${this.globalRect.x}` +
        `${this.globalRect.y}` +
        `${this.globalRect.width}` +
        `${this.globalRect.height}`,
    ];

    for (const longRect of this._longRects) {
      hashArr.push(`${longRect.x}`);
      hashArr.push(`${longRect.y}`);
      hashArr.push(`${longRect.width}`);
      hashArr.push(`${longRect.height}`);
    }

    if (this._shortRect !== undefined) {
      hashArr.push(`${this._shortRect.x}`);
      hashArr.push(`${this._shortRect.y}`);
      hashArr.push(`${this._shortRect.width}`);
      hashArr.push(`${this._shortRect.height}`);
    }

    this._stateHash = hashArr.join("");

    // checkIfDirty removed - now handled by checkAllDirty() in TrackElement
    // this.trackElement.checkIfDirty(this);
  }

  /**
   * Calculates the coordinates of long & short rectangles.
   *
   * In case when current beat duration is < next beat duration:
   * - the SHORT BEAM displays current beat's duration
   * - the LONG BEAM connects and/or displays the next beat's duration
   * - Example: current is 16th, next is 8th
   *
   * In case when current beat duration is >= next beat duration:
   * - the LONG BEAM displays current beat's duration
   * - the SHORT BEAM is undefined
   * - Example: current is 8th, next is 32nd
   */
  public layout(): void {
    if (this.curBeatElement.durationStemLine === undefined) {
      throw Error("Cur duration stem line undefined in beam segment element");
    }
    if (this.nextBeatElement.durationStemLine === undefined) {
      throw Error("Next duration stem line undefined in beam segment element");
    }

    const prevRightX =
      this.curBeatElement.rect.x + this.curBeatElement.durationStemLine.x;
    const longX = prevRightX;
    let y =
      this.barElement.rect.height -
      TabLayoutDimensions.TUPLET_RECT_HEIGHT -
      this._longRects[0].height;
    for (const rect of this._longRects) {
      rect.setCoords(longX, y);
      y -= TabLayoutDimensions.DURATION_FLAG_HEIGHT * 2;
    }

    if (this._shortRect === undefined) {
      return;
    }

    // DEFINITELY Not the best way to do this
    const shortWidth = 10;
    const shortX =
      this.prevBeatElement !== undefined ? longX - shortWidth : longX;
    this._shortRect.setCoords(shortX, y);

    // Calculating state hash at the last step of
    // element's update process - layout
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
   * Scales horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    for (const rect of this._longRects) {
      rect.x *= scale;
      rect.width *= scale;
    }

    if (this._shortRect === undefined) {
      return;
    }

    this._shortRect.x *= scale;
    this._shortRect.width *= scale;

    // Calculating state hash at the last step of
    // element's update process - layout
    this.calcStateHash();
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this._stateHash;
  }

  public getModelUUID(): number {
    // EXPERIMENTAL: Beam segment is fundamentally about connecting two beats
    return this.curBeatElement.beat.uuid;
  }

  /** Bar element rectangle */
  public get rect(): Rect {
    return new Rect(
      this._longRects[0].x,
      this._longRects[0].y,
      this._longRects[0].width,
      TabLayoutDimensions.DURATION_FLAG_HEIGHT * this._longRects.length
    );
  }

  /** This bar's rect in global coords */
  public get globalRect(): Rect {
    return new Rect(
      this.globalCoords.x,
      this.globalCoords.y,
      this.rect.width,
      this.rect.height
    );
  }

  /** Rectangle of the long beam */
  public get longRects(): Rect[] {
    return this._longRects;
  }

  /** Rectangle of the long beam in global coords */
  public get longRectsGlobal(): Rect[] {
    const result = [];
    for (const rect of this._longRects) {
      result.push(
        new Rect(
          this.barElement.globalCoords.x + rect.x,
          this.barElement.globalCoords.y + rect.y,
          rect.width,
          rect.height
        )
      );
    }
    return result;
  }

  /** Rectangle of the short rect */
  public get shortRect(): Rect | undefined {
    return this._shortRect;
  }

  /** Rectangle of the short beam in global coords */
  public get shortRectGlobal(): Rect | undefined {
    if (this._shortRect === undefined) {
      return undefined;
    }

    return new Rect(
      this.barElement.globalCoords.x + this._shortRect.x,
      this.barElement.globalCoords.y + this._shortRect.y,
      this._shortRect.width,
      this._shortRect.height
    );
  }

  /** Global coords of the beam segment element */
  public get globalCoords(): Point {
    return new Point(
      this.barElement.globalCoords.x + this._longRects[0].x,
      this.barElement.globalCoords.y + this._longRects[0].y
    );
  }
}
