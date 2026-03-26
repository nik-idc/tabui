import { Bar, Staff } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { TrackLineElement } from "./track-line-element";
import { NotationStyleLineElement } from "./notation-style-line-element";
import { NotationElement } from "./notation-element";
import { TrackElement } from "./track-element";

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

// TODO: Implement showing selection somehow

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
  private _rect: Rect;
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

    this._rect = new Rect();

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
      width = classicNot.rect.width;
    } else if (tablatureNot !== null) {
      width = tablatureNot.rect.width;
    }
    const height =
      (classicNot?.rect.height ?? 0) + (tablatureNot?.rect.height ?? 0);
    this._rect.setDimensions(width, height);
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

    this._stateHash = hashArr.join("");

    // // Prompt the track element to check if this element has changed
    // this.trackElement.checkIfDirty(this);
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
      prevStaffLine?.rect.bottom ??
      this.trackLineElement.trackLineInfoElement?.rect.bottom ??
      0;
    this._rect.setCoords(0, y);

    this._notationStyleLineElements[NotationStyle.Classic]?.layout();
    this._notationStyleLineElements[NotationStyle.Tablature]?.layout();

    // this.justifyStyleLines();

    // Calculating state hash at the last step of
    // element's update process - layout
    // this.calcStateHash();
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
      width = classicNot.rect.width;
    } else if (tablatureNot !== null) {
      width = tablatureNot.rect.width;
    }
    this._rect.width = width;

    // // Calculating state hash at the last step of
    // // element's update process - layout
    // this.calcStateHash();
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this._stateHash;
  }

  public getModelUUID(): number {
    return this.staff.uuid;
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

  /** Line encapsulating rectangle getter */
  public get rect(): Rect {
    return this._rect;
  }

  /** Global coords of the staff line element (in most cases X will be 0) */
  public get globalCoords(): Point {
    return new Point(
      this.trackLineElement.globalCoords.x + this._rect.x,
      this.trackLineElement.globalCoords.y + this._rect.y
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
}

// // ==== MAYBE WILL BE USEFULL LATER ====
// /**
//  * Calc staff line element
//  */
// public calc(): void {
//   const prevStaffLineElement =
//     this.trackLineElement.getPrevStaffLineElement(this);
//   const x = prevStaffLineElement?._rect.x ?? 0;
//   const y = prevStaffLineElement?._rect.y ?? 0;

//   this._rect = new Rect(
//     x,
//     y,
//     0,
//     TabLayoutDimensions.getStaffLineMinHeight(
//       this.staff.trackContext.instrument
//     )
//   );
//   this._techniqueLabelsRect = new Rect(x, y, 0, 0);

//   // this._barElements = [];
//   // for (const bar of this.staff.bars) {
//   //   const barElement = new BarElement(bar, this);
//   //   this._barElements.push(barElement);
//   // }

//   this.calcTechniqueGap();
// }
// /**
//  * Justifies element by scaling all their widths
//  */
// public justifyElements(): void {
//   for (const barsLine of this._barElements) {
//     barsLine.justifyElements();
//   }
// }

// /**
//  * Checks if bar fits
//  * @param bar Bar
//  * @returns True if fits, false otherwise
//  */
// public barFits(bar: Bar): boolean {
//   const barWidth = getBarWidth(bar);
//   return this._rect.rightTop.x + barWidth <= TabLayoutDimensions.WIDTH;
// }

// /**
//  * Add master bar to the line (assumes the bar fits)
//  * @param masterBarIndex Index of the master bar to add
//  */
// public addBar(masterBarIndex: number): boolean {
//   const bar = this.staff.bars[masterBarIndex];
//   if (!this.barFits(bar)) {
//     for (const barsLine of this._barElements) {
//       barsLine.justifyElements();
//       barsLine.calcTechniqueGap();
//     }
//     return false;
//   }

//   for (const barsLine of this._barElements) {
//     barsLine.addBar(bar);
//   }

//   return true;
// }
