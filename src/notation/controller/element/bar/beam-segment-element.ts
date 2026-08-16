import { Point, Rect, randomInt } from "../../../../shared";
import { TrackElement } from "../track-element";
import { NotationElement, NotationNodeType } from "../notation-element";
import { TabBeatElement } from "../beat/tab-beat-element";
import { DURATION_TO_FLAG_COUNT, VoiceNumber } from "../../../model";
import { VoiceBarRhythmElement } from "./voice-bar-rhythm-element";
import { VoiceBarElement } from "./voice-bar-element";
import type { BarElement } from "./bar-element";
import type { TrackLineElement } from "../track/track-line-element";

type ShortTailDirection = "left" | "right";

/**
 * Class that handles geometry & visually relevant info of a beam segment
 */
export class BeamSegmentElement implements NotationElement {
  readonly nodeType = NotationNodeType.Element;

  public static createStableIdentity(
    voiceBarElement: VoiceBarRhythmElement,
    curBeatElement: TabBeatElement,
    nextBeatElement?: TabBeatElement,
    prevBeatElement?: TabBeatElement
  ): string {
    const prevUUID = prevBeatElement?.beat.uuid ?? 0;
    const curUUID = curBeatElement.beat.uuid;
    const nextUUID = nextBeatElement?.beat.uuid ?? 0;
    const terminalFlag = nextBeatElement === undefined ? 1 : 0;

    return `beam:${voiceBarElement.voiceNumber}:${prevUUID}:${curUUID}:${nextUUID}:${terminalFlag}`;
  }

  /** Unique identifier for the beam segment element */
  readonly uuid: number;
  /** Parent bar element */
  readonly voiceBarRhythmElement: VoiceBarRhythmElement;
  /** Parent voice bar element */
  readonly voiceBarElement: VoiceBarElement;
  /** Previous beat element */
  readonly prevBeatElement?: TabBeatElement;
  /** Current beat element */
  readonly curBeatElement: TabBeatElement;
  /** Next beat element */
  readonly nextBeatElement?: TabBeatElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  public get voiceNumber(): VoiceNumber {
    return this.voiceBarRhythmElement.voiceNumber;
  }

  public get owningTrackLineElement(): TrackLineElement {
    return this.voiceBarRhythmElement.owningTrackLineElement;
  }

  public get owningBarElement(): BarElement {
    return this.voiceBarRhythmElement.barElement;
  }

  /** Rectangle of the long beam */
  private _longRects: Rect[];
  /** Rectangles of short tails */
  private _shortRects: Rect[];
  /**
   * Class that handles geometry & visually relevant info of a beam segment
   * @param voiceBarRhythmElement Parent bar element
   * @param curBeatElement Previous beat element
   * @param nextBeatElement Current beat element
   * @param prevBeatElement Next beat element
   */
  constructor(
    voiceBarRhythmElement: VoiceBarRhythmElement,
    curBeatElement: TabBeatElement,
    nextBeatElement?: TabBeatElement,
    prevBeatElement?: TabBeatElement
  ) {
    if (DURATION_TO_FLAG_COUNT[curBeatElement.beat.baseDuration] === 0) {
      throw Error("Beam segment for a beat with a non-beamable duration");
    }

    this.uuid = randomInt();
    this.voiceBarRhythmElement = voiceBarRhythmElement;
    if (voiceBarRhythmElement.voiceBarElement === undefined) {
      throw Error("Beam segment requires a non-empty voice bar rhythm row");
    }
    this.voiceBarElement = voiceBarRhythmElement.voiceBarElement;
    this.trackElement = this.voiceBarRhythmElement.trackElement;
    this.prevBeatElement = prevBeatElement;
    this.curBeatElement = curBeatElement;
    this.nextBeatElement = nextBeatElement;

    this._longRects = [];
    this._shortRects = [];

    this.build();
  }

  /**
   * Gets the amount of flag levels for a beat element
   */
  private getFlagCount(beatElement?: TabBeatElement): number {
    if (beatElement === undefined) {
      return 0;
    }

    return DURATION_TO_FLAG_COUNT[beatElement.beat.baseDuration];
  }

  /**
   * Determines the direction of short tails for this segment
   */
  private getShortTailDirection(): ShortTailDirection {
    if (this.nextBeatElement === undefined) {
      return "left";
    }

    const prevFlags = this.getFlagCount(this.prevBeatElement);
    const nextFlags = this.getFlagCount(this.nextBeatElement);

    if (prevFlags > nextFlags) {
      return "left";
    }

    return "right";
  }

  /**
   * Checks if beam level should be rendered as long rectangle
   */
  private isLongRectLevel(level: number): boolean {
    if (this.nextBeatElement === undefined) {
      return false;
    }

    const nextFlags = this.getFlagCount(this.nextBeatElement);
    return level <= nextFlags;
  }

  /**
   * Checks if beam level should be rendered as short tail
   */
  private isShortRectLevel(level: number): boolean {
    const prevFlags = this.getFlagCount(this.prevBeatElement);

    if (this.isLongRectLevel(level)) {
      return false;
    }

    // Beam level already represented by previous segment
    if (level <= prevFlags) {
      return false;
    }

    return true;
  }

  /**
   * Initializes the long and short rectangles for this segment
   */
  public build(): void {
    this._longRects = [];
    this._shortRects = [];

    const curFlags = this.getFlagCount(this.curBeatElement);
    for (let level = 1; level <= curFlags; level++) {
      if (this.isLongRectLevel(level)) {
        this._longRects.push(new Rect());
        continue;
      }

      if (this.isShortRectLevel(level)) {
        this._shortRects.push(new Rect());
      }
    }
  }

  /**
   * Calculates the dimensions of long & short rectangles
   */
  public measure(): void {
    if (this.nextBeatElement !== undefined) {
      for (const rect of this._longRects) {
        rect.setDimensions(
          0,
          this.trackElement.layoutDimensions.DURATION_FLAG_HEIGHT
        );
      }
    }

    const shortWidth = 10; // Should put this in tab layout dimensions
    for (const rect of this._shortRects) {
      rect.setDimensions(
        shortWidth,
        this.trackElement.layoutDimensions.DURATION_FLAG_HEIGHT
      );
    }
  }

  /**
   * Calculates the coordinates of long and short beam rectangles.
   *
   * Beam levels are processed from first to last flag level:
   * - Shared with next beat -> long rectangle
   * - Already shared by previous segment -> skipped
   * - Otherwise -> short tail rectangle
   */
  public layout(): void {
    const longX = this.curBeatElement.attackX;
    const longWidth =
      this.nextBeatElement === undefined
        ? 0
        : this.nextBeatElement.attackX - longX;
    const shortTailDirection = this.getShortTailDirection();
    const shortWidth = 10;

    const baseY = this.trackElement.layoutDimensions.DURATIONS_HEIGHT;

    const curFlags = this.getFlagCount(this.curBeatElement);
    let longRectIndex = 0;
    let shortRectIndex = 0;
    for (let level = 1; level <= curFlags; level++) {
      const y =
        baseY -
        (level - 1) *
          this.trackElement.layoutDimensions.DURATION_FLAG_HEIGHT *
          2;

      if (this.isLongRectLevel(level)) {
        // Width depends on laid-out beat attack columns, not measure-time data.
        this._longRects[longRectIndex]?.setDimensions(
          longWidth,
          this.trackElement.layoutDimensions.DURATION_FLAG_HEIGHT
        );
        this._longRects[longRectIndex]?.setCoords(longX, y);
        longRectIndex++;
        continue;
      }

      if (!this.isShortRectLevel(level)) {
        continue;
      }

      const shortX = shortTailDirection === "left" ? longX - shortWidth : longX;
      this._shortRects[shortRectIndex]?.setCoords(shortX, y);
      shortRectIndex++;
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

  /** String encoding the state of this element */
  public get stateHash(): string {
    const hashArr: string[] = [
      `${this.barLocalBoundingBox.x}` +
        `${this.barLocalBoundingBox.y}` +
        `${this.barLocalBoundingBox.width}` +
        `${this.barLocalBoundingBox.height}`,
    ];

    for (const longRect of this._longRects) {
      hashArr.push(`${longRect.x}`);
      hashArr.push(`${longRect.y}`);
      hashArr.push(`${longRect.width}`);
      hashArr.push(`${longRect.height}`);
    }

    for (const shortRect of this._shortRects) {
      hashArr.push(`${shortRect.x}`);
      hashArr.push(`${shortRect.y}`);
      hashArr.push(`${shortRect.width}`);
      hashArr.push(`${shortRect.height}`);
    }

    return hashArr.join("");
  }

  public refreshOwnedNotationNodes(): NotationElement[] {
    return [this];
  }

  public getStableIdentity(): string {
    return BeamSegmentElement.createStableIdentity(
      this.voiceBarRhythmElement,
      this.curBeatElement,
      this.nextBeatElement,
      this.prevBeatElement
    );
  }

  /** Beam segment layout bounding box */
  public get boundingBox(): Rect {
    const allRects = [...this._longRects, ...this._shortRects];
    if (allRects.length === 0) {
      return new Rect();
    }

    let minX = allRects[0].x;
    let minY = allRects[0].y;
    let maxX = allRects[0].right;
    let maxY = allRects[0].bottom;
    for (const rect of allRects) {
      if (rect.x < minX) {
        minX = rect.x;
      }
      if (rect.y < minY) {
        minY = rect.y;
      }
      if (rect.right > maxX) {
        maxX = rect.right;
      }
      if (rect.bottom > maxY) {
        maxY = rect.bottom;
      }
    }

    return new Rect(minX, minY, maxX - minX, maxY - minY);
  }

  /** Coords of this element in bar-local coordinates */
  public get barLocalCoords(): Point {
    // return new Point(this.boundingBox.x, this.boundingBox.y);
    return new Point(
      this.voiceBarRhythmElement.boundingBox.x + this.boundingBox.x,
      this.voiceBarRhythmElement.boundingBox.bottom + this.boundingBox.y
    );
  }

  /** Bounding box of this element in bar-local coordinates */
  public get barLocalBoundingBox(): Rect {
    return new Rect(
      this.barLocalCoords.x,
      this.barLocalCoords.y,
      this.boundingBox.width,
      this.boundingBox.height
    );
  }

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(
      this.voiceBarElement.lineLocalCoords.x + this.barLocalCoords.x,
      this.voiceBarElement.lineLocalCoords.y + this.barLocalCoords.y
    );
  }

  /** Bounding box of this element in track line-local coordinates */
  public get lineLocalBoundingBox(): Rect {
    return new Rect(
      this.lineLocalCoords.x,
      this.lineLocalCoords.y,
      this.boundingBox.width,
      this.boundingBox.height
    );
  }

  /** Beam segment layout bounding box in global coordinates */
  public get globalBoundingBox(): Rect {
    return new Rect(
      this.globalCoords.x,
      this.globalCoords.y,
      this.boundingBox.width,
      this.boundingBox.height
    );
  }

  public get rect(): Rect {
    return this.boundingBox;
  }

  public get globalRect(): Rect {
    return this.globalBoundingBox;
  }

  /** Rectangle of the long beam */
  public get longRects(): Rect[] {
    return this._longRects;
  }

  /** Rectangle of the long beam in track-line-local coords */
  public get longRectsBarLocal(): Rect[] {
    const result = [];
    for (const rect of this._longRects) {
      result.push(
        new Rect(
          this.voiceBarRhythmElement.boundingBox.x + rect.x,
          this.voiceBarRhythmElement.boundingBox.y + rect.y,
          rect.width,
          rect.height
        )
      );
    }
    return result;
  }

  /** Rectangle of the long beam in track-line-local coords */
  public get longRectsLineLocal(): Rect[] {
    const result = [];
    for (const rect of this._longRects) {
      result.push(
        new Rect(
          this.voiceBarElement.lineLocalCoords.x + rect.x,
          this.voiceBarElement.lineLocalCoords.y + rect.y,
          rect.width,
          rect.height
        )
      );
    }
    return result;
  }

  /** Rectangle of the long beam in global coords */
  public get longRectsGlobal(): Rect[] {
    const result = [];
    for (const rect of this._longRects) {
      result.push(
        new Rect(
          this.voiceBarElement.globalCoords.x + rect.x,
          this.voiceBarElement.globalCoords.y + rect.y,
          rect.width,
          rect.height
        )
      );
    }
    return result;
  }

  /** Rectangles of the short tails */
  public get shortRects(): Rect[] {
    return this._shortRects;
  }

  /** Rectangles of the short tails in global coords */
  public get shortRectsBarLocal(): Rect[] {
    const result = [];
    for (const rect of this._shortRects) {
      result.push(
        new Rect(
          this.voiceBarRhythmElement.boundingBox.x + rect.x,
          this.voiceBarRhythmElement.boundingBox.y + rect.y,
          rect.width,
          rect.height
        )
      );
    }
    return result;
  }

  /** Rectangles of the short tails in global coords */
  public get shortRectsLineLocal(): Rect[] {
    const result = [];
    for (const rect of this._shortRects) {
      result.push(
        new Rect(
          this.voiceBarElement.lineLocalCoords.x + rect.x,
          this.voiceBarElement.lineLocalCoords.y + rect.y,
          rect.width,
          rect.height
        )
      );
    }
    return result;
  }

  /** Rectangles of the short tails in global coords */
  public get shortRectsGlobal(): Rect[] {
    const result = [];
    for (const rect of this._shortRects) {
      result.push(
        new Rect(
          this.voiceBarElement.globalCoords.x + rect.x,
          this.voiceBarElement.globalCoords.y + rect.y,
          rect.width,
          rect.height
        )
      );
    }
    return result;
  }

  /** Global coords of the beam segment element */
  public get globalCoords(): Point {
    return new Point(
      this.voiceBarElement.globalCoords.x + this.barLocalCoords.x,
      this.voiceBarElement.globalCoords.y + this.barLocalCoords.y
    );
  }
}
