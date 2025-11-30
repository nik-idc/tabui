import { Bar, GuitarTechniqueType, Staff } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { BarElement } from "./bar-element";
import { TabLayoutDimensions } from "../tab-controller-dim";
import { TrackLineElement } from "./track-line-element";

/**
 * Class that handles all geometry & visually relevant info of a staff line
 */
export class StaffLineElement {
  /** Unique identifier for the staff line element */
  readonly uuid: number;
  /** Staff */
  readonly staff: Staff;
  /** Parent track line element */
  readonly trackLineElement: TrackLineElement;

  /** Bar element on this line */
  private _barElements: BarElement[];
  /** Line encapsulating rectangle */
  private _rect: Rect;
  /** Techniques encapsulating rectangle (horizontal, as wide as 'rect') */
  private _techniqueLabelsRect: Rect;

  /**
   * Class that handles all geometry & visually relevant info of a staff line
   * @param staff Staff
   * @param trackLineElement Parent track line element
   */
  constructor(staff: Staff, trackLineElement: TrackLineElement) {
    this.uuid = randomInt();
    this.staff = staff;
    this.trackLineElement = trackLineElement;

    this._rect = new Rect();
    this._techniqueLabelsRect = new Rect();
    this._barElements = [];

    this.calc();
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
    // const scale = TabLayoutDimensions.WIDTH / this._rect.width;
    const scale = TabLayoutDimensions.WIDTH / sumWidth;
    this._techniqueLabelsRect.width *= scale;
    for (const barElement of this._barElements) {
      barElement.scaleHorBy(scale);
    }
  }

  /**
   * Changes the width of the encapsulating and techniques rectangles
   * @param dWidth Width by which to change
   */
  private changeWidth(dWidth: number): void {
    this._rect.width += dWidth;
    this._techniqueLabelsRect.width += dWidth;
  }

  /**
   * Checks if bar fits
   * @param masterBarIndex Index of the master bar
   * @returns True if fits, false otherwise
   */
  public masterBarFits(masterBarIndex: number): boolean {
    const barElement = new BarElement(this.staff.bars[masterBarIndex], this);
    return this.barElementFits(barElement);
  }

  /**
   * Checks if bar element fits
   * @param barElement Bar element
   * @returns True if fits, false otherwise
   */
  private barElementFits(barElement: BarElement): boolean {
    return (
      this._rect.rightTop.x + barElement.rect.width <= TabLayoutDimensions.WIDTH
    );
  }

  /**
   * Add master bar to the line
   * @param masterBarIndex Index of the master bar to add
   */
  public addBar(masterBarIndex: number): boolean {
    const barElement = new BarElement(this.staff.bars[masterBarIndex], this);
    if (!this.masterBarFits(masterBarIndex)) {
      return false;
    }

    if (!this.barElementFits(barElement)) {
      this.justifyElements();
      this.calcTechniqueGap();
      return false;
    }

    this._barElements.push(barElement);
    this.changeWidth(barElement.rect.width);
    return true;
  }

  /**
   * Calculates technique label gap
   */
  public calcTechniqueGap(): void {
    // Reset technique label gap height to 0
    this._techniqueLabelsRect.height = 0;
    this._rect.height = TabLayoutDimensions.getStaffLineMinHeight(
      this.staff.trackContext.instrument
    );

    // Figure out the tallest bar
    let tallestBar = 0;
    for (const barElement of this._barElements) {
      barElement.calcTechniqueGap();
      if (barElement.rect.height > tallestBar) {
        tallestBar = barElement.rect.height;
      }
    }

    // Figure out & apply new gap height
    const gapHeight = tallestBar - this._rect.height;
    this._rect.height += gapHeight;
    this._techniqueLabelsRect.height = gapHeight;

    for (const barElement of this._barElements) {
      barElement.setTechniqueGap(gapHeight);
    }
  }

  /**
   * Calc staff line element
   */
  public calc(): void {
    const prevStaffLineElement =
      this.trackLineElement.getPrevStaffLineElement(this);
    const x = prevStaffLineElement?._rect.x ?? 0;
    const y = prevStaffLineElement?._rect.y ?? 0;

    this._rect = new Rect(
      x,
      y,
      0,
      TabLayoutDimensions.getStaffLineMinHeight(
        this.staff.trackContext.instrument
      )
    );
    this._techniqueLabelsRect = new Rect(x, y, 0, 0);

    // this._barElements = [];
    // for (const bar of this.staff.bars) {
    //   const barElement = new BarElement(bar, this);
    //   this._barElements.push(barElement);
    // }

    this.calcTechniqueGap();
  }

  /**
   * Removes bar element
   * @param barElementId Index of the bar element in this line
   */
  public removeBarElement(barElementId: number): void {
    const barElement = this._barElements[barElementId];

    barElement.rect.x = 0;
    barElement.rect.y = 0;
    this._barElements.splice(barElementId, 1);

    this.changeWidth(-barElement.rect.width);
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

  /**
   * Finds bar element by it's bar's UUID
   * @param barUUID Bar element's bar UUID
   * @returns Bar element if found, undefined otherwise
   */
  public findBarElementByUUID(barUUID: number): BarElement | undefined {
    return this._barElements.find((be) => be.bar.uuid === barUUID);
  }

  /** Bar element on this line getter */
  public get barElements(): BarElement[] {
    return this._barElements;
  }

  /** Line encapsulating rectangle getter */
  public get rect(): Rect {
    return this._rect;
  }

  /** Techniques encapsulating rectangle getter */
  public get techniqueLabelsRect(): Rect {
    return this._techniqueLabelsRect;
  }

  /** Global coords of the staff line element (in most cases X will be 0) */
  public get globalCoords(): Point {
    return new Point(
      this.trackLineElement.globalCoords.x + this._rect.x,
      this.trackLineElement.globalCoords.y + this._rect.y
    );
  }
}
