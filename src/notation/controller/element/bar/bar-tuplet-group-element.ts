import { BarTupletGroup } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
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
  private _boundingBox: Rect;
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

    this._boundingBox = new Rect();

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
      sumWidth += beatElement.boundingBox.width;
    }

    // // Adjust the coords and dimensions for better UI/UX
    // sumWidth -=
    //   this.beatElements[this.beatElements.length - 1].boundingBox.width * (3 / 4);

    const height = EditorLayoutDimensions.TUPLET_RECT_HEIGHT;
    this._boundingBox.setDimensions(sumWidth, height);

    if (this._incompleteRects === undefined) {
      return;
    }
    for (let i = 0; i < this.beatElements.length; i++) {
      this._incompleteRects[i].setDimensions(
        this.beatElements[i].boundingBox.width,
        height
      );
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
    const x = this.beatElements[0].boundingBox.x;
    const y =
      this.barElement.boundingBox.height -
      EditorLayoutDimensions.TUPLET_RECT_HEIGHT;

    this._boundingBox.setCoords(x, y);

    if (this._incompleteRects === undefined) {
      return;
    }
    for (let i = 0; i < this.beatElements.length; i++) {
      const x = this._incompleteRects[i - 1]?.right ?? 0;
      const y = this._boundingBox.y;

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
    this._boundingBox.x *= scale;
    this._boundingBox.width *= scale;

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

  /** Tuplet element's outer layout bounding box */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** This tuplet element's layout bounding box in global coordinates */
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
            EditorLayoutDimensions.TUPLET_PATH_HEIGHT * 2
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

    return this._boundingBox.middle;
  }

  /** Complete tuplet group text coordinates (or undefined if tuplet group incomplete) */
  public get comleteTextCoordsGlobal(): Point | undefined {
    if (!this.tupletGroup.complete) {
      return undefined;
    }

    return new Point(
      this.globalCoords.x + this._boundingBox.width / 2,
      this.globalCoords.y +
        this._boundingBox.height / 2 +
        EditorLayoutDimensions.TUPLET_PATH_HEIGHT * 2
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
      this._boundingBox.width -
      lastBeatElement.boundingBox.width / 2 -
      firstBeatElement.boundingBox.width / 2;
    const height = EditorLayoutDimensions.TUPLET_PATH_HEIGHT;
    return new Rect(
      this.globalCoords.x + firstBeatElement.boundingBox.width / 2,
      this.globalCoords.y + height, // '- height' is due to SVG path calculation
      width,
      height
    );
  }

  /** Global coords of the bar tuplet group element */
  public get globalCoords(): Point {
    return new Point(
      this.barElement.globalCoords.x + this._boundingBox.x,
      this.barElement.globalCoords.y + this._boundingBox.y
    );
  }
}
