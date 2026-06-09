import { BarTupletGroup } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
import { TrackElement } from "@/notation/controller/element/track-element";
import { NotationElement } from "@/notation/controller/element/notation-element";
import { BeatElement } from "../beat/beat-element";
import { TabBeatElement } from "../beat/tab-beat-element";
import { VoiceBarRhythmElement } from "./voice-bar-rhythm-element";

/**
 * Class that handles geometry & visually relevant info of a bar tuplet group
 */
export class BarTupletGroupElement implements NotationElement {
  public static createStableIdentity(
    voiceBarRhythmElement: VoiceBarRhythmElement,
    tupletGroup: BarTupletGroup
  ): string {
    const trackLineStableIdentity =
      voiceBarRhythmElement.barElement.notationStyleLineElement.staffLineElement.trackLineElement.getStableIdentity();
    return `tuplet:${trackLineStableIdentity}:${voiceBarRhythmElement.voiceNumber}:${tupletGroup.uuid}`;
  }

  /** UUID of the tuplet element */
  readonly uuid: number;
  /** Tuplet group this element represents */
  readonly tupletGroup: BarTupletGroup;
  /** Parent voice bar rhythm element */
  readonly voiceBarRhythmElement: VoiceBarRhythmElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  /** Tuplet element's outer rectangle */
  private _beatElements: TabBeatElement[];
  /** Tuplet element's outer rectangle */
  private _boundingBox: Rect;
  /** Individual tuplet signs if the tuplet group is incomplete */
  private _incompleteRects?: Rect[];
  /**
   * Class that handles geometry & visually relevant info of a bar tuplet group
   * @param tupletGroup Tuplet group
   * @param voiceBarRhythmElement Voice bar rhythm element
   * @param beatElements Beat elements
   */
  constructor(
    tupletGroup: BarTupletGroup,
    voiceBarRhythmElement: VoiceBarRhythmElement,
    beatElements: TabBeatElement[]
  ) {
    this.uuid = randomInt();
    this.tupletGroup = tupletGroup;
    this.voiceBarRhythmElement = voiceBarRhythmElement;
    this.trackElement = this.voiceBarRhythmElement.trackElement;
    this._beatElements = beatElements;

    this._boundingBox = new Rect();

    this.build();

    this.trackElement.registerElement(this);
  }

  /**
   * Initializes the incomplete rects to an array or undefined,
   * depending if the tuplet group is complete
   */
  public build(): void {
    this.trackElement.registerElement(this);

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
    const height = EditorLayoutDimensions.TUPLET_RECT_HEIGHT;
    this._boundingBox.setDimensions(0, height);

    if (this._incompleteRects === undefined) {
      return;
    }
    for (let i = 0; i < this.beatElements.length; i++) {
      this._incompleteRects[i].setDimensions(0, height);
    }
  }

  /**
   * Calculate the coordinates of this bar tuplet group element
   */
  public layout(): void {
    const baseX = this.beatElements[0].attackX;
    const lastBeatElement = this.beatElements[this.beatElements.length - 1];
    const tupletWidth =
      lastBeatElement.attackX + lastBeatElement.boundingBox.width - baseX;
    const y =
      this.voiceBarRhythmElement.boundingBox.height -
      EditorLayoutDimensions.TUPLET_RECT_HEIGHT;

    // Width depends on laid-out beat attack columns, not measure-time data.
    this._boundingBox.setDimensions(tupletWidth, this._boundingBox.height);
    this._boundingBox.setCoords(baseX, y);

    if (this._incompleteRects === undefined) {
      return;
    }
    for (let i = 0; i < this.beatElements.length; i++) {
      const nextBeatElement = this.beatElements[i + 1];
      const rectWidth =
        nextBeatElement === undefined
          ? this.beatElements[i].boundingBox.width
          : nextBeatElement.attackX - this.beatElements[i].attackX;
      const x = this.beatElements[i].attackX - baseX;
      const y = this._boundingBox.y;

      // Width depends on the next laid-out beat attack column.
      this._incompleteRects[i].setDimensions(
        rectWidth,
        this._incompleteRects[i].height
      );
      this._incompleteRects[i].setCoords(x, y);
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

  public refreshOwnedNotationElements(): NotationElement[] {
    return [this];
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

  /** String encoding the state of this element */
  public get stateHash(): string {
    const hashArr: string[] = [
      `${this.barLocalBoundingBox.x}` +
        `${this.barLocalBoundingBox.y}` +
        `${this.barLocalBoundingBox.width}` +
        `${this.barLocalBoundingBox.height}`,
    ];

    if (this._incompleteRects !== undefined) {
      for (const rect of this._incompleteRects) {
        hashArr.push(`${rect.x}`);
        hashArr.push(`${rect.y}`);
        hashArr.push(`${rect.width}`);
        hashArr.push(`${rect.height}`);
      }
    }

    return hashArr.join("");
  }

  public getStableIdentity(): string {
    return BarTupletGroupElement.createStableIdentity(
      this.voiceBarRhythmElement,
      this.tupletGroup
    );
  }

  public setBeatElements(beatElements: TabBeatElement[]): void {
    this._beatElements = beatElements;
  }

  public get beatElements(): TabBeatElement[] {
    return this._beatElements;
  }

  /** Tuplet element's outer layout bounding box */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** Coords of this element in bar-local coordinates */
  public get barLocalCoords(): Point {
    return new Point(
      this.voiceBarRhythmElement.boundingBox.x + this._boundingBox.x,
      this.voiceBarRhythmElement.boundingBox.y + this._boundingBox.y
    );
  }

  /** Bounding box of this element in bar-local coordinates */
  public get barLocalBoundingBox(): Rect {
    return new Rect(
      this.barLocalCoords.x,
      this.barLocalCoords.y,
      this._boundingBox.width,
      this._boundingBox.height
    );
  }

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(
      this.voiceBarRhythmElement.lineLocalCoords.x + this.barLocalCoords.x,
      this.voiceBarRhythmElement.lineLocalCoords.y + this.barLocalCoords.y
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

  /** Track line local coords of incomplete texts */
  public get incompleteTextsCoordsBarLocal(): Point[] | undefined {
    if (this._incompleteRects === undefined) {
      return this._incompleteRects;
    }

    const result = [];
    for (const rect of this._incompleteRects) {
      result.push(
        new Point(
          this.barLocalCoords.x + rect.middleX,
          this.barLocalCoords.y +
            rect.height / 2 +
            EditorLayoutDimensions.TUPLET_PATH_HEIGHT * 2
        )
      );
    }

    return result;
  }

  /** Track line local coords of incomplete texts */
  public get incompleteTextsCoordsLineLocal(): Point[] | undefined {
    if (this._incompleteRects === undefined) {
      return this._incompleteRects;
    }

    const result = [];
    for (const rect of this._incompleteRects) {
      result.push(
        new Point(
          this.lineLocalCoords.x + rect.middleX,
          this.lineLocalCoords.y +
            rect.height / 2 +
            EditorLayoutDimensions.TUPLET_PATH_HEIGHT * 2
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

  /** Complete tuplet group text coordinates in track line local space (or undefined if tuplet group incomplete) */
  public get completeTextCoordsBarLocal(): Point | undefined {
    if (!this.tupletGroup.complete) {
      return undefined;
    }

    const lastBeatElement = this._beatElements[this._beatElements.length - 1];
    const tupletPathMiddleX =
      (this.barLocalCoords.x + lastBeatElement.attackXBarLocal) / 2;
    return new Point(
      tupletPathMiddleX,
      this.barLocalCoords.y +
        this._boundingBox.height / 2 +
        EditorLayoutDimensions.TUPLET_PATH_HEIGHT * 2
    );
  }

  /** Complete tuplet group text coordinates in track line local space (or undefined if tuplet group incomplete) */
  public get completeTextCoordsLineLocal(): Point | undefined {
    if (!this.tupletGroup.complete) {
      return undefined;
    }

    return new Point(
      this.lineLocalCoords.x + this._boundingBox.width / 2,
      this.lineLocalCoords.y +
        this._boundingBox.height / 2 +
        EditorLayoutDimensions.TUPLET_PATH_HEIGHT * 2
    );
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

  /** Rect in track-line-local coords for the SVG path (if the tuplet is complete) */
  public get completePathRectBarLocal(): Rect | undefined {
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
      this.barLocalCoords.x,
      this.barLocalCoords.y + height,
      width,
      height
    );
  }

  /** Rect in track-line-local coords for the SVG path (if the tuplet is complete) */
  public get completePathRectLineLocal(): Rect | undefined {
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
      this.lineLocalCoords.x + firstBeatElement.boundingBox.width / 2,
      this.lineLocalCoords.y + height, // '- height' is due to SVG path calculation
      width,
      height
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
      this.voiceBarRhythmElement.globalCoords.x + this.barLocalCoords.x,
      this.voiceBarRhythmElement.globalCoords.y + this.barLocalCoords.y
    );
  }
}
