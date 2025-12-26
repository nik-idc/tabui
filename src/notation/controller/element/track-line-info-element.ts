import { MasterBar, Track } from "@/notation/model";
import { Point, Rect, randomInt } from "@/shared";
import { BarElement } from "./bar-element";
import { TrackLineBarData, TrackLineElement } from "./track-line-element";
import { TabLayoutDimensions } from "../tab-controller-dim";

/**
 * Class representing the visual info about all
 * info that needs to be on this track line element
 */
export class TrackLineInfoElement {
  /** Unique identifier for the track line element */
  readonly uuid: number;
  /** Parent track line element */
  readonly trackLineElement: TrackLineElement;

  /** Track line encapsulating rectangle */
  private _rect: Rect; /** Stores all the bars whose tempo to display & the tempo rect */
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

    this._rect = new Rect(0, 0, TabLayoutDimensions.WIDTH, 0);
    this._barTempoRectsMap = new Map();

    this.build();
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
   * Sets the coordinates of the outer rectangle & all the tempo rectangles
   */
  public layout(): void {
    this._rect.setCoords(0, 0);

    for (const [barElement, rect] of this._barTempoRectsMap) {
      rect.setCoords(barElement.rect.x, 0);
    }
  }

  /**
   * Gets a tempo rectangle for a specific bar element
   */
  public getBarTempoRect(barElement: BarElement): Rect | undefined {
    return this._barTempoRectsMap.get(barElement);
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
      barTempoRect.y + TabLayoutDimensions.TEMPO_TEXT_SIZE
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

  /** Track line encapsulating rectangle */
  public get rect(): Rect {
    return this._rect;
  }

  /** Stores all the bars whose tempo to display & the tempo rect */
  public get barTempoRectsMap(): Map<BarElement, Rect> {
    return this._barTempoRectsMap;
  }
}
