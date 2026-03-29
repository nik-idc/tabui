import { MasterBar, Track } from "@/notation/model";
import { Point, Rect, randomInt } from "@/shared";
import { TabLayoutDimensions } from "@/notation/controller/tab-layout-dimensions";
import { TrackElement } from "@/notation/controller/element/track-element";
import { NotationElement } from "@/notation/controller/element/notation-element";
import { BarElement } from "../bar/bar-element";
import { TrackLineBarData, TrackLineElement } from "./track-line-element";

/**
 * Class representing the visual info about all
 * info that needs to be on this track line element
 */
export class TrackLineInfoElement implements NotationElement {
  /** Unique identifier for the track line element */
  readonly uuid: number;
  /** Parent track line element */
  readonly trackLineElement: TrackLineElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  /** Track line encapsulating rectangle */
  private _rect: Rect;
  /** Stores all the bars whose tempo to display & the tempo rect */
  private _barTempoRectsMap: Map<BarElement, Rect>;
  /** String encoding the state of this element */
  private _stateHash: string;

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

    this._rect = new Rect(0, 0, TabLayoutDimensions.WIDTH, 0);
    this._barTempoRectsMap = new Map();

    this._stateHash = "";

    this.build();

    this.trackElement.registerElement(this);
  }

  /**
   * Fills the tempo rectangles map
   */
  public build(): void {
    this._rect.height = 0;
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
          barElement.rect.x,
          0,
          TabLayoutDimensions.TEMPO_RECT_WIDTH,
          TabLayoutDimensions.TEMPO_RECT_HEIGHT
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
        ? TabLayoutDimensions.TEMPO_RECT_HEIGHT
        : 0;
    this._rect.setDimensions(TabLayoutDimensions.WIDTH, height);
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

    const barRectsEntries = this._barTempoRectsMap.entries();
    for (const [barElement, rect] of barRectsEntries) {
      hashArr.push(`${rect.x}`);
      hashArr.push(`${rect.y}`);
      hashArr.push(`${rect.width}`);
      hashArr.push(`${rect.height}`);
    }

    this._stateHash = hashArr.join("");

    // // Prompt the track element to check if this element has changed
    // this.trackElement.checkIfDirty(this);
  }

  /**
   * Sets the coordinates of the outer rectangle & all the tempo rectangles
   */
  public layout(): void {
    this._rect.setCoords(0, 0);

    for (const [barElement, rect] of this._barTempoRectsMap) {
      rect.setCoords(barElement.rect.x, 0);
    }

    // Calculating state hash at the last step of
    // element's update process - layout
    this.calcStateHash();
  }

  public update(): void {
    this.build();

    this.measure();
    this.layout();
  }

  /**
   * Scales the element & its children horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number, scaleOuterX: boolean = true): void {
    if (scaleOuterX) {
      this._rect.x *= scale;
    }
    this._rect.width *= scale;

    for (const [barElement, rect] of this._barTempoRectsMap) {
      rect.x *= scale;
      rect.width *= scale;
    }

    // // Calculating state hash at the last step of
    // // element's update process - layout
    // this.calcStateHash();
  }

  /**
   * Gets a tempo rectangle for a specific bar element
   */
  public getBarTempoRect(barElement: BarElement): Rect | undefined {
    return this._barTempoRectsMap.get(barElement);
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
      TabLayoutDimensions.TEMPO_TEXT_SIZE
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
      this.trackLineElement.globalCoords.y + TabLayoutDimensions.TEMPO_TEXT_SIZE
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
    return this._stateHash;
  }

  public getModelUUID(): number {
    return this.trackLineElement.getModelUUID() + 1000001;
  }

  /** Track line encapsulating rectangle */
  public get rect(): Rect {
    return this._rect;
  }

  /** Global coords of the track line element (in most cases X will be 0) */
  public get globalCoords(): Point {
    return new Point(
      this.trackElement.globalCoords.x + this._rect.x,
      this.trackElement.globalCoords.y + this._rect.y
    );
  }

  /** This element's rect in global coords */
  public get globalRect(): Rect {
    return new Rect(
      this.globalCoords.x,
      this.globalCoords.y,
      this._rect.width,
      this._rect.height
    );
  }

  /** Stores all the bars whose tempo to display & the tempo rect */
  public get barTempoRectsMap(): Map<BarElement, Rect> {
    return this._barTempoRectsMap;
  }
}
