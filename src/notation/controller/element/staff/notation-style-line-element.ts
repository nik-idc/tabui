import { Staff } from "@/notation/model";
import { Point, randomInt, Rect } from "@/shared";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
import { TrackElement } from "@/notation/controller/element/track-element";
import { NotationElement } from "@/notation/controller/element/notation-element";
import { BarElement } from "../bar/bar-element";
import {
  NotationStyle,
  StaffLineData,
  StaffLineElement,
} from "./staff-line-element";
import { TechGapElement } from "./tech-gap-element";

/**
 * Class that handles geometry of a single notation style line in the staff
 * line. E.g., a staff line with tab & sheet notations both enabled: in that
 * case the StaffLineElement will contain 2 notation style line elements -
 * NotationStyleLineElement for the tab and the other for sheet notation
 */
export class NotationStyleLineElement implements NotationElement {
  /** Unique identifier for the staff line element */
  readonly uuid: number;
  /** Parent staff line element */
  readonly staffLineElement: StaffLineElement;
  /** Notation style for this particular line */
  readonly notationStyle: NotationStyle;
  /** Root track element */
  readonly trackElement: TrackElement;

  /** Bar elements on this line */
  private _barElements: BarElement[];
  /** Tech gap element */
  private _techGapElement: TechGapElement;

  /** Line encapsulating rectangle */
  private _boundingBox: Rect;
  /** String encoding the state of this element */
  private _stateHash: string;

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
    this.trackElement = this.staffLineElement.trackElement;
    this.notationStyle = notationStyle;

    this._barElements = [];
    this._techGapElement = new TechGapElement(this);

    this._boundingBox = new Rect();

    this._stateHash = "";

    this.build();

    this.trackElement.registerElement(this);
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
    this._boundingBox.width = EditorLayoutDimensions.WIDTH;

    let sumWidth = 0;
    for (const barElement of this._barElements) {
      barElement.measure();
      sumWidth += barElement.boundingBox.width;
    }
    // // Set width BEFORE measure tech gap since gap's width = parent notation
    // // style line's width
    // this._boundingBox.width = sumWidth;

    this._techGapElement.measure();
    // Set height AFTER tech gap measure since notation style line height
    // depends on both the height of bar elements & the height of the tech gap
    this._boundingBox.height =
      this._techGapElement.boundingBox.height +
      this._barElements[0].boundingBox.height;
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

    this._stateHash = hashArr.join("");

    // Prompt the track element to check if this element has changed
    // this.trackElement.checkIfDirty(this);
  }

  /**
   * Calculates the coordinates for all bar elements & their children
   */
  public layout(): void {
    // // Setting rect width in layout since
    // // bar element's layout justifies it to fit.
    // // This is NOT ideal
    // this._boundingBox.width = sumWidth;

    let sumWidth = 0;
    this._techGapElement.layout();
    for (const barElement of this._barElements) {
      barElement.layout();
      sumWidth += barElement.boundingBox.width;
    }

    // Calculating state hash at the last step of
    // element's update process - layout
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
   * Scales the element & its children horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number, scaleOuterX: boolean = true): void {
    if (scaleOuterX) {
      this._boundingBox.x *= scale;
    }
    this._boundingBox.width *= scale;

    for (const barElement of this._barElements) {
      barElement.scaleHorBy(scale);
    }

    // Calculating state hash at the last step of
    // element's update process - layout
    this.calcStateHash();
  }

  /**
   * Justifies element by scaling all their widths
   */
  public justifyElements(fakeJustify: boolean = false): void {
    if (fakeJustify) {
      // For fake justify, use scale 1 (no actual scaling)
      // but still calculate state hash to capture final positions
      for (const barElement of this._barElements) {
        barElement.scaleHorBy(1);
      }
      this._techGapElement.scaleHorBy(1);

      // Calculating state hash at the last step of
      // element's update process - layout
      this.calcStateHash();
      return;
    }

    // Calc width of empty space
    const gapWidth =
      EditorLayoutDimensions.WIDTH -
      this._barElements[this._barElements.length - 1].boundingBox.rightTop.x;

    if (gapWidth === 0) {
      return;
    }

    // Calc sum width of all bar element
    let sumWidth =
      this._barElements[this._barElements.length - 1].boundingBox.rightTop.x;

    // Go through each bar element and increase their
    // width according to how their current width relates
    // to the width of the empty space
    const scale = EditorLayoutDimensions.WIDTH / sumWidth;
    for (const barElement of this._barElements) {
      barElement.scaleHorBy(scale);
    }
    this._techGapElement.scaleHorBy(scale);
    this._boundingBox.width *= scale;

    // Calculating state hash at the last step of
    // element's update process - layout
    this.calcStateHash();
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

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this._stateHash;
  }

  public getModelUUID(): number {
    return this.staffLineElement.getModelUUID() + this.notationStyle;
  }

  /** Bar elements on this line */
  public get barElements(): BarElement[] {
    return this._barElements;
  }

  /** Tech gap element */
  public get techGapElement(): TechGapElement {
    return this._techGapElement;
  }

  /** Line layout bounding box */
  public get boundingBox(): Rect {
    return this._boundingBox;
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

  /** Global coords of the notation style line element */
  public get globalCoords(): Point {
    return new Point(
      this.staffLineElement.globalCoords.x + this._boundingBox.x,
      this.staffLineElement.globalCoords.y + this._boundingBox.y
    );
  }
}
