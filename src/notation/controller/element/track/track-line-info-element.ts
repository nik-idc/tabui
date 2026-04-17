import { MasterBar, Track } from "@/notation/model";
import { Point, Rect, randomInt } from "@/shared";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
import { TrackElement } from "@/notation/controller/element/track-element";
import { NotationElement } from "@/notation/controller/element/notation-element";
import { BarElement } from "../bar/bar-element";
import { TrackLineBarData, TrackLineElement } from "./track-line-element";

/**
 * Class representing the visual info about all
 * info that needs to be on this track line element
 */
export class TrackLineInfoElement implements NotationElement {
  public static createStableIdentity(
    trackLineElement: TrackLineElement
  ): string {
    return `track-line-info:${trackLineElement.getStableIdentity()}`;
  }

  /** Unique identifier for the track line element */
  readonly uuid: number;
  /** Parent track line element */
  readonly trackLineElement: TrackLineElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  /** Track line encapsulating rectangle */
  private _boundingBox: Rect;
  /** Stores all the bars whose tempo to display & the tempo rect */
  private _barTempoRectsMap: Map<BarElement, Rect>;
  /**
   * Class representing the visual info about all
   * info that needs to be on this track line element
   * @param track Track
   * @param trackLineElement Parent track line element
   */
  constructor(trackLineElement: TrackLineElement) {
    this.uuid = randomInt();
    this.trackLineElement = trackLineElement;
    this.trackElement = this.trackLineElement.trackElement;

    this._boundingBox = new Rect(0, 0, EditorLayoutDimensions.WIDTH, 0);
    this._barTempoRectsMap = new Map();

    this.build();

    this.trackElement.registerElement(this);
  }

  /**
   * Fills the tempo rectangles map
   */
  public build(): void {
    this.trackElement.registerElement(this);

    this._boundingBox.height = 0;
    this._barTempoRectsMap.clear();

    const barElements =
      this.trackLineElement.staffLineElements[0].styleLinesAsArray[0]
        .barElements;
    if (barElements === undefined) {
      throw Error("Bar elements undefine in track line info build");
    }
    for (const barElement of barElements) {
      if (barElement.showTempo) {
        const rect = new Rect(
          barElement.boundingBox.x,
          0,
          EditorLayoutDimensions.TEMPO_RECT_WIDTH,
          EditorLayoutDimensions.TEMPO_RECT_HEIGHT
        );
        this._barTempoRectsMap.set(barElement, rect);
      }
    }
  }

  /**
   * Sets the dimensions of the outer rectangle
   */
  public measure(): void {
    const height =
      this._barTempoRectsMap.size !== 0
        ? EditorLayoutDimensions.TEMPO_RECT_HEIGHT
        : 0;
    this._boundingBox.setDimensions(EditorLayoutDimensions.WIDTH, height);
  }

  private buildStateHash(): string {
    const hashArr: string[] = [
      `${this.globalBoundingBox.x}` +
        `${this.globalBoundingBox.y}` +
        `${this.globalBoundingBox.width}` +
        `${this.globalBoundingBox.height}`,
    ];

    const barRectsEntries = this._barTempoRectsMap.entries();
    for (const [barElement, rect] of barRectsEntries) {
      hashArr.push(`${rect.x}`);
      hashArr.push(`${rect.y}`);
      hashArr.push(`${rect.width}`);
      hashArr.push(`${rect.height}`);
    }

    return hashArr.join("");
  }

  /**
   * Sets the coordinates of the outer rectangle & all the tempo rectangles
   */
  public layout(): void {
    this._boundingBox.setCoords(0, 0);

    for (const [barElement, rect] of this._barTempoRectsMap) {
      rect.setCoords(barElement.boundingBox.x, 0);
    }
  }

  public update(): void {
    this.build();

    this.measure();
    this.layout();
  }

  public refreshOwnedNotationElements(): NotationElement[] {
    return [this];
  }

  /**
   * Scales the element & its children horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number, scaleOuterX: boolean = true): void {
    if (scaleOuterX) {
      this._boundingBox.x *= scale;
    }
    this._boundingBox.width *= scale;

    for (const [barElement, rect] of this._barTempoRectsMap) {
      rect.x *= scale;
      rect.width *= scale;
    }
  }

  /**
   * Gets a tempo rectangle for a specific bar element
   */
  public getBarTempoRect(barElement: BarElement): Rect | undefined {
    return this._barTempoRectsMap.get(barElement);
  }

  /** Gets a tempo rectangle for a specific bar element in track line-local coords */
  public getBarTempoRectLineLocal(barElement: BarElement): Rect | undefined {
    const barRect = this._barTempoRectsMap.get(barElement);
    if (barRect === undefined) {
      return undefined;
    }

    return new Rect(
      barRect.x,
      this.lineLocalCoords.y,
      barRect.width,
      barRect.height
    );
  }

  /**
   * Gets a tempo rectangle for a specific bar element
   */
  public getBarTempoRectGlobal(barElement: BarElement): Rect | undefined {
    const barRect = this._barTempoRectsMap.get(barElement);
    if (barRect === undefined) {
      return undefined;
    }

    return new Rect(
      barRect.x,
      this.trackLineElement.globalCoords.y,
      barRect.width,
      barRect.height
    );
  }

  /**
   * Gets tempo text coordinates for a specific bar element
   */
  public getBarTempoTextCoords(barElement: BarElement): Point | undefined {
    const barTempoRect = this._barTempoRectsMap.get(barElement);
    if (barTempoRect === undefined) {
      return undefined;
    }

    return new Point(
      barTempoRect.x + barTempoRect.width,
      EditorLayoutDimensions.TEMPO_TEXT_SIZE
    );
  }

  /** Gets tempo text coordinates for a specific bar element in track line-local coords */
  public getBarTempoTextCoordsLineLocal(
    barElement: BarElement
  ): Point | undefined {
    const barTempoRect = this._barTempoRectsMap.get(barElement);
    if (barTempoRect === undefined) {
      return undefined;
    }

    return new Point(
      barTempoRect.x + barTempoRect.width,
      this.lineLocalCoords.y + EditorLayoutDimensions.TEMPO_TEXT_SIZE
    );
  }

  /**
   * Gets tempo text coordinates for a specific bar element
   */
  public getBarTempoTextCoordsGlobal(
    barElement: BarElement
  ): Point | undefined {
    const barTempoRect = this._barTempoRectsMap.get(barElement);
    if (barTempoRect === undefined) {
      return undefined;
    }

    return new Point(
      barTempoRect.x + barTempoRect.width,
      this.trackLineElement.globalCoords.y +
        EditorLayoutDimensions.TEMPO_TEXT_SIZE
    );
  }

  /**
   * Gets tempo text coordinates for a specific bar element
   */
  public getBarTempoText(barElement: BarElement): string | undefined {
    const barTempoRect = this._barTempoRectsMap.get(barElement);
    if (barTempoRect === undefined) {
      return undefined;
    }

    return `=${barElement.bar.masterBar.tempo}`;
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this.buildStateHash();
  }

  public getStableIdentity(): string {
    return TrackLineInfoElement.createStableIdentity(this.trackLineElement);
  }

  /** Track line info layout bounding box */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(this._boundingBox.x, this._boundingBox.y);
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

  /** Global coords of the track line element (in most cases X will be 0) */
  public get globalCoords(): Point {
    return new Point(
      this.trackLineElement.globalCoords.x + this._boundingBox.x,
      this.trackLineElement.globalCoords.y + this._boundingBox.y
    );
  }

  /** This element's layout bounding box in global coordinates */
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

  /** Stores all the bars whose tempo to display & the tempo rect */
  public get barTempoRectsMap(): Map<BarElement, Rect> {
    return this._barTempoRectsMap;
  }
}
