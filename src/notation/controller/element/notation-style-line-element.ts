import { Staff } from "@/notation/model";
import { Point, randomInt, Rect } from "@/shared";
import { BarElement } from "./bar-element";
import {
  NotationStyle,
  StaffLineData,
  StaffLineElement,
} from "./staff-line-element";
import { TabLayoutDimensions } from "../tab-controller-dim";
import { TechGapElement } from "./tech-gap-element";

/**
 * Class that handles geometry of a single notation style line in the staff
 * line. E.g., a staff line with tab & sheet notations both enabled: in that
 * case the StaffLineElement will contain 2 notation style line elements -
 * NotationStyleLineElement for the tab and the other for sheet notation
 */
export class NotationStyleLineElement {
  /** Unique identifier for the staff line element */
  readonly uuid: number;
  /** Parent staff line element */
  readonly staffLineElement: StaffLineElement;
  /** Notation style for this particular line */
  readonly notationStyle: NotationStyle;

  /** Bar elements on this line */
  private _barElements: BarElement[];
  /** Tech gap element */
  private _techGapElement: TechGapElement;

  /** Line encapsulating rectangle */
  private _rect: Rect;

  /**
   * Class that handles geometry of a single notation style line in the staff line
   * @param staffLineElement Parent staff element
   * @param notationStyle Notation style
   */
  constructor(
    staffLineElement: StaffLineElement,
    notationStyle: NotationStyle
  ) {
    this.uuid = randomInt();
    this.staffLineElement = staffLineElement;
    this.notationStyle = notationStyle;

    this._barElements = [];
    this._techGapElement = new TechGapElement(this);

    this._rect = new Rect();

    this.build();
  }

  /**
   * Builds the bar elements array for this notation style line
   */
  public build(): void {
    this._barElements = [];
    for (const data of this.staffLineElement.staffLineData) {
      const barElement = new BarElement(data.bar, this, data.largestBarWidth);
      this._barElements.push(barElement);
    }
  }

  /**
   * Calculates the dimensions for all bar elements & their children
   */
  public measure(): void {
    this._rect.width = TabLayoutDimensions.WIDTH;

    let sumWidth = 0;
    for (const barElement of this._barElements) {
      barElement.measure();
      sumWidth += barElement.rect.width;
    }
    // // Set width BEFORE measure tech gap since gap's width = parent notation
    // // style line's width
    // this._rect.width = sumWidth;

    this._techGapElement.measure();
    // Set height AFTER tech gap measure since notation style line height
    // depends on both the height of bar elements & the height of the tech gap
    this._rect.height =
      this._techGapElement.rect.height + this._barElements[0].rect.height;
  }

  /**
   * Calculates the coordinates for all bar elements & their children
   */
  public layout(): void {
    // // Setting rect width in layout since
    // // bar element's layout justifies it to fit.
    // // This is NOT ideal
    // this._rect.width = sumWidth;

    let sumWidth = 0;
    this._techGapElement.layout();
    for (const barElement of this._barElements) {
      barElement.layout();
      sumWidth += barElement.rect.width;
    }
  }

  /**
   * Justifies element by scaling all their widths
   */
  public justifyElements(): void {
    // Calc width of empty space
    const gapWidth =
      TabLayoutDimensions.WIDTH -
      this._barElements[this._barElements.length - 1].rect.rightTop.x;

    if (gapWidth === 0) {
      return;
    }

    // Calc sum width of all bar element
    let sumWidth =
      this._barElements[this._barElements.length - 1].rect.rightTop.x;

    // Go through each bar element and increase their
    // width according to how their current width relates
    // to the width of the empty space
    const scale = TabLayoutDimensions.WIDTH / sumWidth;
    for (const barElement of this._barElements) {
      barElement.scaleHorBy(scale);
    }
    this._techGapElement.scaleHorBy(scale);
    this._rect.width *= scale;
  }

  /**
   * Gets next bar element
   * @param barElement Bar element
   * @returns Next bar element or null
   */
  public getNextBarElement(barElement: BarElement): BarElement | null {
    const barIndex = this._barElements.indexOf(barElement);
    const nextBar = this._barElements[barIndex + 1];
    return nextBar ?? null;
  }

  /**
   * Gets prev bar element
   * @param barElement Bar element
   * @returns Prev bar element or null
   */
  public getPrevBarElement(barElement: BarElement): BarElement | null {
    const barIndex = this._barElements.indexOf(barElement);
    const prevBar = this._barElements[barIndex - 1];
    return prevBar ?? null;
  }

  /** Bar elements on this line */
  public get barElements(): BarElement[] {
    return this._barElements;
  }

  /** Tech gap element */
  public get techGapElement(): TechGapElement {
    return this._techGapElement;
  }

  /** Line encapsulating rectangle */
  public get rect(): Rect {
    return this._rect;
  }

  /** Global coords of the notation style line element */
  public get globalCoords(): Point {
    return new Point(
      this.staffLineElement.globalCoords.x + this._rect.x,
      this.staffLineElement.globalCoords.y + this._rect.y
    );
  }
}
