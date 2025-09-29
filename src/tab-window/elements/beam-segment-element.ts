import { randomInt } from "../../misc/random-int";
import { Point } from "../shapes/point";
import { Rect } from "../shapes/rect";
import { BeatElement } from "./beat-element";

export class BeamSegmentElement {
  readonly uuid: number;
  readonly prevBeatElement?: BeatElement;
  readonly curBeatElement: BeatElement;
  readonly nextBeatElement: BeatElement;
  public longRect: Rect;
  public shortRect?: Rect;

  constructor(
    curBeatElement: BeatElement,
    nextBeatElement: BeatElement,
    prevBeatElement?: BeatElement
  ) {
    this.uuid = randomInt();
    this.prevBeatElement = prevBeatElement;
    this.curBeatElement = curBeatElement;
    this.nextBeatElement = nextBeatElement;
    this.longRect = new Rect();
    // this.shortRect = new Rect();

    this.calc();
  }

  public calc(): void {
    const prevRightX =
      this.curBeatElement.rect.x + this.curBeatElement.durationRect.right;
    const nextRightX =
      this.nextBeatElement.rect.x + this.nextBeatElement.durationRect.right;
    const longX = prevRightX;
    const longWidth = nextRightX - prevRightX;
    const y = this.curBeatElement.rect.y;
    const height = this.curBeatElement.dim.durationsHeight;

    const curDuration = this.curBeatElement.beat.duration;
    const nextDuration = this.nextBeatElement.beat.duration;
    if (curDuration < nextDuration) {
      // In this case:
      // - the SHORT BEAM displays current beat's duration
      // - the LONG BEAM connects and/or displays the next beat's duration
      // Example: current is 16th, next is 8th

      this.longRect.set(longX, y, longWidth, height);

      const shortWidth = 10;
      const shortX =
        this.prevBeatElement !== undefined ? longX - shortWidth : longX;
      this.shortRect = new Rect(shortX, y, shortWidth, height);
    }

    if (curDuration >= nextDuration) {
      // In this case:
      // - the LONG BEAM displays current beat's duration
      // - the SHORT BEAM is undefined
      // Example: current is 8th, next is 32nd
      this.longRect.set(longX, y, longWidth, height);
      this.shortRect = undefined;
    }
  }

  public scaleHorBy(scale: number): void {
    this.longRect.x *= scale;
    this.longRect.width *= scale;
    if (this.shortRect === undefined) {
      return;
    }

    this.shortRect.x *= scale;
    this.shortRect.width *= scale;
  }
}
