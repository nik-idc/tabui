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
  public static createStableIdentity(
    staffLineElement: StaffLineElement,
    notationStyle: NotationStyle
  ): string {
    return `style-line:${staffLineElement.getStableIdentity()}:${notationStyle}`;
  }

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
  /** Bar data placed into this presentation line. */
  private _staffLineData: StaffLineData;
  /** Tech gap element */
  private _techGapElement: TechGapElement;

  /** Line encapsulating rectangle */
  private _boundingBox: Rect;

  /**
   * Class that handles geometry of a single notation style line in the staff line
   * @param staffLineElement Parent staff element
   * @param notationStyle Notation style
   */
  constructor(
    staffLineElement: StaffLineElement,
    notationStyle: NotationStyle,
    staffLineData: StaffLineData
  ) {
    this.uuid = randomInt();
    this.staffLineElement = staffLineElement;
    this.trackElement = this.staffLineElement.trackElement;
    this.notationStyle = notationStyle;

    this._barElements = [];
    this._staffLineData = staffLineData;
    this._techGapElement = new TechGapElement(this);
    this._techGapElement.build();

    this._boundingBox = new Rect();

    this.build();

    this.trackElement.registerElement(this);
  }

  /**
   * Builds the bar elements array for this notation style line
   */
  public build(): void {
    this.trackElement.registerElement(this);
    this._techGapElement = new TechGapElement(this);
    this._techGapElement.build();

    this._barElements = this._staffLineData.map(
      (data) =>
        new BarElement(
          data.bar,
          this.trackElement,
          this.notationStyle,
          data.finalizedWidth,
          this
        )
    );
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

  private buildStateHash(): string {
    const hashArr: string[] = [
      `${this.globalBoundingBox.x}` +
        `${this.globalBoundingBox.y}` +
        `${this.globalBoundingBox.width}` +
        `${this.globalBoundingBox.height}`,
    ];

    return hashArr.join("");
  }

  /**
   * Calculates the coordinates for all bar elements & their children
   */
  public layout(): void {
    let sumWidth = 0;
    this._techGapElement.layout();
    for (const barElement of this._barElements) {
      barElement.layout();
      sumWidth += barElement.boundingBox.width;
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
    const elements: NotationElement[] = [this];

    elements.push(...this._techGapElement.refreshOwnedNotationElements());
    for (const barElement of this._barElements) {
      elements.push(...barElement.refreshOwnedNotationElements());
    }

    return elements;
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
    return this.buildStateHash();
  }

  public getStableIdentity(): string {
    return NotationStyleLineElement.createStableIdentity(
      this.staffLineElement,
      this.notationStyle
    );
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

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(
      this.staffLineElement.lineLocalCoords.x + this._boundingBox.x,
      this.staffLineElement.lineLocalCoords.y + this._boundingBox.y
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
