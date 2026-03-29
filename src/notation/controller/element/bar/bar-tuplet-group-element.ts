import { BarTupletGroup } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { TabLayoutDimensions } from "@/notation/controller/tab-layout-dimensions";
import { TrackElement } from "@/notation/controller/element/track-element";
import { NotationElement } from "@/notation/controller/element/notation-element";
import { BeatElement } from "../beat/beat-element";
import { BarElement } from "./bar-element";
import { TabBeatElement } from "../beat/tab-beat-element";

/**
 * Class that handles geometry & visually relevant info of a bar tuplet group
 */
export class BarTupletGroupElement implements NotationElement {
  /** UUID of the tuplet element */
  readonly uuid: number;
  /** Tuplet group this element represents */
  readonly tupletGroup: BarTupletGroup;
  /** Parent bar element */
  readonly barElement: BarElement;
  /** Array of beat element included in this tuplet group */
  readonly beatElements: TabBeatElement[];
  /** Root track element */
  readonly trackElement: TrackElement;

  /** Tuplet element's outer rectangle */
  private _rect: Rect;
  /** Individual tuplet signs if the tuplet group is incomplete */
  private _incompleteRects?: Rect[];
  /** String encoding the state of this element */
  private _stateHash: string;

  /**
   * Class that handles geometry & visually relevant info of a bar tuplet group
   * @param tupletGroup Tuplet group
   * @param barElement Bar element
   * @param beatElements Beat elements
   */
  constructor(
    tupletGroup: BarTupletGroup,
    barElement: BarElement,
    beatElements: TabBeatElement[]
  ) {
    this.uuid = randomInt();
    this.tupletGroup = tupletGroup;
    this.barElement = barElement;
    this.trackElement = this.barElement.trackElement;
    this.beatElements = beatElements;

    this._rect = new Rect();

    this._stateHash = "";

    this.build();

    this.trackElement.registerElement(this);
  }

  /**
   * Initializes the incomplete rects to an array or undefined,
   * depending if the tuplet group is complete
   */
  public build(): void {
    if (!this.tupletGroup.complete) {
      this._incompleteRects = [];
      for (const _ of this.beatElements) {
        this._incompleteRects.push(new Rect());
      }
    } else {
      this._incompleteRects = undefined;
    }
  }

  /**
   * Calculates the dimensions of this bar tuplet group element
   */
  public measure(): void {
    let sumWidth = 0;
    for (const beatElement of this.beatElements) {
      sumWidth += beatElement.rect.width;
    }

    // // Adjust the coords and dimensions for better UI/UX
    // sumWidth -=
    //   this.beatElements[this.beatElements.length - 1].rect.width * (3 / 4);

    const height = TabLayoutDimensions.TUPLET_RECT_HEIGHT;
    this._rect.setDimensions(sumWidth, height);

    if (this._incompleteRects === undefined) {
      return;
    }
    for (let i = 0; i < this.beatElements.length; i++) {
      this._incompleteRects[i].setDimensions(
        this.beatElements[i].rect.width,
        height
      );
    }
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

    if (this._incompleteRects !== undefined) {
      for (const rect of this._incompleteRects) {
        hashArr.push(`${rect.x}`);
        hashArr.push(`${rect.y}`);
        hashArr.push(`${rect.width}`);
        hashArr.push(`${rect.height}`);
      }
    }

    this._stateHash = hashArr.join("");

    // checkIfDirty removed - now handled by checkAllDirty() in TrackElement
    // this.trackElement.checkIfDirty(this);
  }

  /**
   * Calculate the coordinates of this bar tuplet group element
   */
  public layout(): void {
    const x = this.beatElements[0].rect.x;
    const y =
      this.barElement.rect.height - TabLayoutDimensions.TUPLET_RECT_HEIGHT;

    this._rect.setCoords(x, y);

    if (this._incompleteRects === undefined) {
      return;
    }
    for (let i = 0; i < this.beatElements.length; i++) {
      const x = this._incompleteRects[i - 1]?.right ?? 0;
      const y = this._rect.y;

      this._incompleteRects[i].setCoords(x, y);
    }

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
   * Returns tuplet string. A single number if complete, full otherwise
   * @param beatIndex Index of the beat element
   */
  public getTupletString(beatIndex: number): string {
    if (this.tupletGroup.complete) {
      return this.tupletGroup.isStandard
        ? `${this.tupletGroup.normalCount}`
        : `${this.tupletGroup.normalCount}:${this.tupletGroup.tupletCount}`;
    }

    if (beatIndex < 0 || beatIndex >= this.beatElements.length) {
      throw Error(`Get tuplet string invalid index: ${beatIndex}`);
    }

    const beatElementTuplet = this.beatElements[beatIndex].beat.tupletSettings;
    if (beatElementTuplet === null) {
      throw Error("Non-tuplet beat inside tuplet element");
    }
    return this.tupletGroup.isStandard
      ? `${beatElementTuplet.normalCount}`
      : `${beatElementTuplet.normalCount}:${beatElementTuplet.tupletCount}`;
  }

  /**
   * Scales the bar tuplet group element horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    this._rect.x *= scale;
    this._rect.width *= scale;

    if (this._incompleteRects === undefined) {
      return;
    }
    for (const incompleteRect of this._incompleteRects) {
      incompleteRect.x *= scale;
      incompleteRect.width *= scale;
    }

    // Calculating state hash at the last step of
    // element's update process - layout
    this.calcStateHash();
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this._stateHash;
  }

  public getModelUUID(): number {
    return this.tupletGroup.uuid;
  }

  /** Tuplet element's outer rectangle */
  public get rect(): Rect {
    return this._rect;
  }

  /** This bar's rect in global coords */
  public get globalRect(): Rect {
    return new Rect(
      this.globalCoords.x,
      this.globalCoords.y,
      this._rect.width,
      this._rect.height
    );
  }

  /** Tuplet element's incomplete rectangles (defined if tuplet group is complete) */
  public get incompleteRects(): Rect[] | undefined {
    return this._incompleteRects;
  }

  /** Tuplet element's incomplete rectangles (defined if tuplet group is complete) in global coords */
  public get incompleteRectsGlobal(): Rect[] | undefined {
    if (this._incompleteRects === undefined) {
      return this._incompleteRects;
    }

    const result = [];
    for (const rect of this._incompleteRects) {
      result.push(
        new Rect(
          this.globalCoords.x + rect.x,
          this.globalCoords.y + rect.y,
          rect.width,
          rect.height
        )
      );
    }

    return result;
  }

  /** Global coords of incomplete texts */
  public get incompleteTextsCoordsGlobal(): Point[] | undefined {
    if (this._incompleteRects === undefined) {
      return this._incompleteRects;
    }

    const result = [];
    for (const rect of this._incompleteRects) {
      result.push(
        new Point(
          this.globalCoords.x + rect.middleX,
          this.globalCoords.y +
            rect.height / 2 +
            TabLayoutDimensions.TUPLET_PATH_HEIGHT * 2
        )
      );
    }

    return result;
  }

  /** Text for a complete tuplet */
  public get completeText(): string {
    return this.tupletGroup.isStandard
      ? `${this.tupletGroup.normalCount}`
      : `${this.tupletGroup.normalCount}:${this.tupletGroup.tupletCount}`;
  }

  /** Complete tuplet group text coordinates (or undefined if tuplet group incomplete) */
  public get comleteTextCoords(): Point | undefined {
    if (!this.tupletGroup.complete) {
      return undefined;
    }

    return this._rect.middle;
  }

  /** Complete tuplet group text coordinates (or undefined if tuplet group incomplete) */
  public get comleteTextCoordsGlobal(): Point | undefined {
    if (!this.tupletGroup.complete) {
      return undefined;
    }

    return new Point(
      this.globalCoords.x + this._rect.width / 2,
      this.globalCoords.y +
        this._rect.height / 2 +
        TabLayoutDimensions.TUPLET_PATH_HEIGHT * 2
    );
  }

  /** Rect in global coords for the SVG path (if the tuplet is complete) */
  public get completePathRectGlobal(): Rect | undefined {
    if (!this.tupletGroup.complete) {
      return undefined;
    }

    const firstBeatElement = this.beatElements[0];
    const lastBeatElement = this.beatElements[this.beatElements.length - 1];

    const width =
      this._rect.width -
      lastBeatElement.rect.width / 2 -
      firstBeatElement.rect.width / 2;
    const height = TabLayoutDimensions.TUPLET_PATH_HEIGHT;
    return new Rect(
      this.globalCoords.x + firstBeatElement.rect.width / 2,
      this.globalCoords.y + height, // '- height' is due to SVG path calculation
      width,
      height
    );
  }

  /** Global coords of the bar tuplet group element */
  public get globalCoords(): Point {
    return new Point(
      this.barElement.globalCoords.x + this._rect.x,
      this.barElement.globalCoords.y + this._rect.y
    );
  }
}
