import { Bar, Staff } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { TrackElement } from "@/notation/controller/element/track-element";
import { NotationElement } from "@/notation/controller/element/notation-element";
import { TrackLineElement } from "../track/track-line-element";
import { NotationStyleLineElement } from "./notation-style-line-element";

/**
 * Supported notation styles
 */
export enum NotationStyle {
  Classic,
  Tablature,
}

/**
 * Data needed to build a staff line bar:
 * Width to match & the bar itself
 */
export type StaffLineBarData = {
  largestBarWidth: number;
  bar: Bar;
};

/**
 * Data needed to build a staff line:
 * Array of objects: Largest width for the bar at the specified index
 */
export type StaffLineData = StaffLineBarData[];

/**
 * Class that handles all geometry & visually relevant info of a staff line
 */
export class StaffLineElement implements NotationElement {
  /** Unique identifier for the staff line element */
  readonly uuid: number;
  /** Staff */
  readonly staff: Staff;
  /** Parent track line element */
  readonly trackLineElement: TrackLineElement;
  /** Data necessary to build a staff line */
  readonly staffLineData: StaffLineData;
  /** Root track element */
  readonly trackElement: TrackElement;

  /** Notation style line elements of this staff line */
  private _notationStyleLineElements: Record<
    NotationStyle,
    NotationStyleLineElement | null
  >;

  /** Line encapsulating rectangle */
  private _boundingBox: Rect;
  /** String encoding the state of this element */
  private _stateHash: string;

  /**
   * Class that handles all geometry & visually relevant info of a staff line
   * @param staff Staff
   * @param trackLineElement Parent track line element
   * @param staffLineData Data necessary to build a staff line
   */
  constructor(
    staff: Staff,
    trackLineElement: TrackLineElement,
    staffLineData: StaffLineData
  ) {
    this.uuid = randomInt();
    this.staff = staff;
    this.trackLineElement = trackLineElement;
    this.trackElement = this.trackLineElement.trackElement;
    this.staffLineData = staffLineData;

    this._notationStyleLineElements = {
      [NotationStyle.Classic]: null,
      [NotationStyle.Tablature]: null,
    };

    this._boundingBox = new Rect();

    this._stateHash = "";

    this.build();

    this.trackElement.registerElement(this);
  }

  /**
   * Fills the notation style lines array
   */
  public build(): void {
    this._notationStyleLineElements[NotationStyle.Classic] = this.staff
      .showClassicNotation
      ? new NotationStyleLineElement(this, NotationStyle.Classic)
      : null;

    this._notationStyleLineElements[NotationStyle.Tablature] = this.staff
      .showTablature
      ? new NotationStyleLineElement(this, NotationStyle.Tablature)
      : null;
  }

  /**
   * Calculates the dimensions of all sub elements of this staff line element
   */
  public measure(): void {
    const classicNot = this._notationStyleLineElements[NotationStyle.Classic];
    const tablatureNot =
      this._notationStyleLineElements[NotationStyle.Tablature];
    if (classicNot === null && tablatureNot === null) {
      throw Error("Both classic & tablature notations null at measure");
    }

    this._notationStyleLineElements[NotationStyle.Classic]?.measure();
    tablatureNot?.measure();

    let width = 0;
    if (classicNot !== null) {
      width = classicNot.boundingBox.width;
    } else if (tablatureNot !== null) {
      width = tablatureNot.boundingBox.width;
    }
    const height =
      (classicNot?.boundingBox.height ?? 0) +
      (tablatureNot?.boundingBox.height ?? 0);
    this._boundingBox.setDimensions(width, height);
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
  }

  /**
   * Calculates layout for all child elements, i.e. their X and Y coordinates
   */
  public layout(): void {
    const classicNot = this._notationStyleLineElements[NotationStyle.Classic];
    const tablatureNot =
      this._notationStyleLineElements[NotationStyle.Tablature];
    if (classicNot === null && tablatureNot === null) {
      throw Error("Both classic & tablature notations null at layout");
    }

    const prevStaffLine = this.trackLineElement.getPrevStaffLineElement(this);
    const y =
      prevStaffLine?.boundingBox.bottom ??
      this.trackLineElement.trackLineInfoElement?.boundingBox.bottom ??
      0;
    this._boundingBox.setCoords(0, y);

    this._notationStyleLineElements[NotationStyle.Classic]?.layout();
    this._notationStyleLineElements[NotationStyle.Tablature]?.layout();
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
      this._boundingBox.x *= scale;
    }
    this._boundingBox.width *= scale;

    const styleLinesEntries = Object.entries(this._notationStyleLineElements);
    for (const [style, styleLine] of styleLinesEntries) {
      if (styleLine === null) {
        continue;
      }
      styleLine.scaleHorBy(scale);
    }

    // Calculating state hash at the last step of
    // element's update process - layout
    this.calcStateHash();
  }

  /**
   * Justifies all the present lines
   */
  public justifyStyleLines(fakeJustify: boolean = false): void {
    const classicNot = this._notationStyleLineElements[NotationStyle.Classic];
    const tablatureNot =
      this._notationStyleLineElements[NotationStyle.Tablature];
    if (classicNot === null && tablatureNot === null) {
      throw Error("Both classic & tablature notations null at layout");
    }

    this._notationStyleLineElements[NotationStyle.Classic]?.justifyElements(
      fakeJustify
    );
    this._notationStyleLineElements[NotationStyle.Tablature]?.justifyElements(
      fakeJustify
    );

    let width = 0;
    if (classicNot !== null) {
      width = classicNot.boundingBox.width;
    } else if (tablatureNot !== null) {
      width = tablatureNot.boundingBox.width;
    }
    this._boundingBox.width = width;
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this._stateHash;
  }

  public getModelUUID(): number {
    return this.trackLineElement.getModelUUID() + this.staff.uuid;
  }

  /** Style line elements record object */
  public get notationStyleLineElements(): Record<
    NotationStyle,
    NotationStyleLineElement | null
  > {
    return this._notationStyleLineElements;
  }

  /** Style line elements as array */
  public get styleLinesAsArray(): NotationStyleLineElement[] {
    const result = [];
    if (this._notationStyleLineElements[NotationStyle.Classic] !== null) {
      result.push(this._notationStyleLineElements[NotationStyle.Classic]);
    }
    if (this._notationStyleLineElements[NotationStyle.Tablature] !== null) {
      result.push(this._notationStyleLineElements[NotationStyle.Tablature]);
    }

    return result;
  }

  /** Line layout bounding box getter */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** Global coords of the staff line element (in most cases X will be 0) */
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
}
