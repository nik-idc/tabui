import { Rect, randomInt } from "@/shared";
import { BeatElement } from "./beat-element";
import { BarElement } from "./bar-element";
import { TabLayoutDimensions } from "../tab-controller-dim";

/**
 * Class that handles geometry & visually relevant info of a beam segment
 */
export class BeamSegmentElement {
  /** Unique identifier for the beam segment element */
  readonly uuid: number;
  /** Parent bar element */
  readonly barElement: BarElement;
  /** Previous beat element */
  readonly prevBeatElement?: BeatElement;
  /** Current beat element */
  readonly curBeatElement: BeatElement;
  /** Next beat element */
  readonly nextBeatElement: BeatElement;

  /** Rectangle of the long beam */
  private _longRect: Rect;
  /** Rectangle of the short rect */
  private _shortRect?: Rect;

  /**
   * Class that handles geometry & visually relevant info of a beam segment
   * @param barElement Parent bar element
   * @param curBeatElement Previous beat element
   * @param nextBeatElement Current beat element
   * @param prevBeatElement Next beat element
   */
  constructor(
    barElement: BarElement,
    curBeatElement: BeatElement,
    nextBeatElement: BeatElement,
    prevBeatElement?: BeatElement
  ) {
    this.uuid = randomInt();
    this.barElement = barElement;
    this.prevBeatElement = prevBeatElement;
    this.curBeatElement = curBeatElement;
    this.nextBeatElement = nextBeatElement;

    this._longRect = new Rect();

    this.calc();
  }

  /**
   * Calculates the beam segment element
   */
  public calc(): void {
    const prevRightX =
      this.curBeatElement.rect.x + this.curBeatElement.durationRect.right;
    const nextRightX =
      this.nextBeatElement.rect.x + this.nextBeatElement.durationRect.right;
    const longX = prevRightX;
    const longWidth = nextRightX - prevRightX;
    const y = this.curBeatElement.rect.y;
    const height = TabLayoutDimensions.DURATIONS_HEIGHT;

    const curDuration = this.curBeatElement.beat.baseDuration;
    const nextDuration = this.nextBeatElement.beat.baseDuration;
    if (curDuration < nextDuration) {
      // In this case:
      // - the SHORT BEAM displays current beat's duration
      // - the LONG BEAM connects and/or displays the next beat's duration
      // Example: current is 16th, next is 8th

      this._longRect.set(longX, y, longWidth, height);

      const shortWidth = 10;
      const shortX =
        this.prevBeatElement !== undefined ? longX - shortWidth : longX;
      this._shortRect = new Rect(shortX, y, shortWidth, height);
    }

    if (curDuration >= nextDuration) {
      // In this case:
      // - the LONG BEAM displays current beat's duration
      // - the SHORT BEAM is undefined
      // Example: current is 8th, next is 32nd
      this._longRect.set(longX, y, longWidth, height);
      this._shortRect = undefined;
    }
  }

  /**
   * Scales horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    this._longRect.x *= scale;
    this._longRect.width *= scale;
    if (this._shortRect === undefined) {
      return;
    }

    this._shortRect.x *= scale;
    this._shortRect.width *= scale;
  }

  /** Rectangle of the long beam */
  public get longRect(): Rect {
    return this._longRect;
  }

  /** Rectangle of the short rect */
  public get shortRect(): Rect | undefined {
    return this._shortRect;
  }
}
