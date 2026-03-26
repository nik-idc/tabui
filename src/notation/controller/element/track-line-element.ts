import { Guitar, MasterBar, Track } from "@/notation/model";
import { Point, Rect, randomInt } from "@/shared";
import { StaffLineData, StaffLineElement } from "./staff-line-element";
import { TabLayoutDimensions } from "../tab-controller-dim";
import { TrackElement } from "./track-element";
import { TrackLineInfoElement } from "./track-line-info-element";
import { getBarWidth } from "./bar-element";
import { VertLine } from "@/shared/rendering/geometry/line";

/**
 * Data needed to build a track bar:
 * Width to match & master bar index
 */
export type TrackLineBarData = {
  largestBarWidth: number;
  masterBarIndex: number;
};

/**
 * Data needed to build a track line:
 * Array of objects: Largest width for the master bar at the specified index
 */
export type TrackLineData = TrackLineBarData[];

type OutlineLines = {
  left: VertLine;
  right: VertLine;
};

/**
 * Class that handles all geometry & visually relevant info of a track line
 */
export class TrackLineElement {
  /** Unique identifier for the track line element */
  readonly uuid: number;
  /** Track */
  readonly track: Track;
  /** Parent track element */
  readonly trackElement: TrackElement;

  /** Staff line element on this track line */
  private _staffLineElements: StaffLineElement[];
  /** Track line info (tempo) */
  private _trackLineInfoElement: TrackLineInfoElement | null;

  /** Track line encapsulating rectangle */
  private _rect: Rect;
  /** Left & right outline line for when there are more than 1 staves */
  private _outlineLines?: OutlineLines;
  /** Data necessary to build a track line */
  private _trackLineData: TrackLineData;

  /**
   * Class that handles all geometry & visually relevant info of a track line
   * @param track Track
   * @param trackElement Parent track element
   * @param trackLineData Data necessary to build the track line element
   */
  constructor(
    track: Track,
    trackElement: TrackElement,
    trackLineData: TrackLineData
  ) {
    this.uuid = randomInt();
    this.track = track;
    this.trackElement = trackElement;

    this._staffLineElements = [];
    this._trackLineInfoElement = null;

    this._rect = new Rect();
    this._trackLineData = trackLineData;

    this.build();
  }

  /**
   * Fills staff lines array
   */
  public build(): void {
    this._staffLineElements = [];
    for (const staff of this.track.staves) {
      const data: StaffLineData = this._trackLineData.map((td) => {
        return {
          largestBarWidth: td.largestBarWidth,
          bar: staff.bars[td.masterBarIndex],
        };
      });

      const staffLineElement = new StaffLineElement(staff, this, data);
      this._staffLineElements.push(staffLineElement);
    }

    if (this.track.staves.length > 1) {
      this._outlineLines = {
        left: new VertLine(),
        right: new VertLine(),
      };
    } else {
      this._outlineLines = undefined;
    }

    this._trackLineInfoElement = new TrackLineInfoElement(this);
  }

  /**
   * Calculates the dimensions of all sub elements of this track line element
   */
  public measure(): void {
    if (this._staffLineElements.length === 0) {
      throw Error("Empty track line element's staff lines array at measure");
    }

    if (this._trackLineInfoElement === null) {
      throw Error("Info element is null at measure");
    }

    let sumStaffHeight = 0;
    for (const staffLine of this._staffLineElements) {
      staffLine.measure();
      sumStaffHeight += staffLine.rect.height;
    }

    this._trackLineInfoElement.measure();

    const width = this._staffLineElements[0].rect.width;
    const height = sumStaffHeight + this._trackLineInfoElement.rect.height;
    this._rect.setDimensions(width, height);
  }

  /**
   * Calculates coordinates for this & all child elements
   */
  public layout(): void {
    if (this._staffLineElements.length === 0) {
      throw Error("Empty track line element's staff lines array at layout");
    }

    if (this._trackLineInfoElement === null) {
      throw Error("Info element is null at layout");
    }

    const prevTrackLine = this.trackElement.getPrevTrackLineElement(this);
    const y = prevTrackLine?._rect.bottom ?? 0;
    this._rect.setCoords(0, y);

    this._trackLineInfoElement.layout();

    for (const staffLine of this._staffLineElements) {
      staffLine.layout();
    }

    if (this._outlineLines === undefined) {
      return;
    }
    const xLeft = 0;
    const xRight = this._rect.width;

    // TODO: Redo this outline layout to support multiple notation
    // styles since current calculation only works for tablature
    const y1 =
      this._trackLineInfoElement.rect.bottom +
      // Since visually the staff lines begin a bit lower than the element
      TabLayoutDimensions.NOTE_RECT_HEIGHT / 2 +
      this._staffLineElements[0].styleLinesAsArray[0].techGapElement.rect
        .bottom;
    const y2 =
      this._staffLineElements[this._staffLineElements.length - 1].rect.bottom -
      TabLayoutDimensions.TUPLET_RECT_HEIGHT -
      TabLayoutDimensions.DURATIONS_HEIGHT -
      TabLayoutDimensions.NOTE_RECT_HEIGHT / 2;

    this._outlineLines.left.set(xLeft, y1, y2);
    this._outlineLines.right.set(xRight, y1, y2);
  }

  /**
   * Justifies the info element & staff lines
   */
  public justifyElements(): void {
    if (this._staffLineElements.length === 0) {
      throw Error("Empty track line element's staff lines array at justify");
    }

    if (this._trackLineInfoElement === null) {
      throw Error("Info element is null at justify");
    }

    for (const staffLine of this._staffLineElements) {
      staffLine.justifyStyleLines();
    }

    // Calling layout since for info line that will have the same effect
    this._trackLineInfoElement.layout();

    const width = this._staffLineElements[0].rect.width;
    this._rect.width = width;

    if (this._outlineLines === undefined) {
      return;
    }
    this._outlineLines.right.x = this._rect.width;
  }

  /**
   * Gets next staff element
   * @param staffElement Staff element
   * @returns Next staff element or null
   */
  public getNextStaffLineElement(
    staffLineElement: StaffLineElement
  ): StaffLineElement | null {
    const staffIndex = this._staffLineElements.indexOf(staffLineElement);
    const nextStaff = this._staffLineElements[staffIndex + 1];
    return nextStaff ?? null;
  }

  /**
   * Gets prev staff element
   * @param staffElement Staff element
   * @returns Prev staff element or null
   */
  public getPrevStaffLineElement(
    staffLineElement: StaffLineElement
  ): StaffLineElement | null {
    const staffIndex = this._staffLineElements.indexOf(staffLineElement);
    const prevStaff = this._staffLineElements[staffIndex - 1];
    return prevStaff ?? null;
  }

  /** Staff line element on this track line */
  public get staffLineElements(): StaffLineElement[] {
    return this._staffLineElements;
  }

  /** Track line info (tempo) */
  public get trackLineInfoElement(): TrackLineInfoElement | null {
    return this._trackLineInfoElement;
  }

  /** Left & right outline line for when there are more than 1 staves */
  public get outlineLines(): OutlineLines | undefined {
    return this._outlineLines;
  }

  /** Left & right outline line for when there are more than 1 staves */
  public get outlineLinesGlobal(): OutlineLines | undefined {
    if (this._outlineLines === undefined) {
      return this._outlineLines;
    }

    const result = {
      left: new VertLine(
        this._outlineLines.left.x,
        this.globalCoords.y + this._outlineLines.left.y1,
        this.globalCoords.y + this._outlineLines.left.y2
      ),
      right: new VertLine(
        this._outlineLines.right.x,
        this.globalCoords.y + this._outlineLines.right.y1,
        this.globalCoords.y + this._outlineLines.right.y2
      ),
    };
    return result;
  }

  /** Track line encapsulating rectangle */
  public get rect(): Rect {
    return this._rect;
  }

  /** Data necessary to build a track line */
  public get trackLineData(): TrackLineData {
    return this._trackLineData;
  }

  /** Global coords of the track line element (in most cases X will be 0) */
  public get globalCoords(): Point {
    return new Point(
      this.trackElement.globalCoords.x + this._rect.x,
      this.trackElement.globalCoords.y + this._rect.y
    );
  }
}

// ==== TOO AFRAID TO DELETE ====
// /**
//  * Checks if bar fits in all the staff line elements
//  * @param masterBarIndex Index of the master bar
//  * @returns True if fits, false otherwise
//  */
// public masterBarFits(masterBarIndex: number): boolean {
//   for (const staffLineElement of this._staffLineElements) {
//     const bar = staffLineElement.staff.bars[masterBarIndex];
//     if (!staffLineElement.barFits(bar)) {
//       return false;
//     }
//   }

//   return true;
// }

// /**
//  * Add master bar to the line (assumes the bar fits)
//  * @param masterBarIndex Index of the master bar to add
//  */
// public addBar(masterBarIndex: number): boolean {
//   // Check if the bar fits in ALL the staff lines
//   const barsCountsPerStaff = [];
//   for (const staffLine of this._staffLineElements) {
//     const bar = staffLine.staff.bars[masterBarIndex];
//     const barWidth = getBarWidth(bar);

//     if (staffLine.rect.right + barWidth <= TabLayoutDimensions.WIDTH) {
//       barsCountsPerStaff.push();
//     }
//   }

//   if (!this.masterBarFits(masterBarIndex)) {
//     return false;
//   }

//   for (const staffLineElement of this._staffLineElements) {
//     if (!staffLineElement.addBar(masterBarIndex)) {
//       return false;
//     }
//   }

//   this._trackLineInfoElement.calc();

//   return true;
// }

// /**
//  * Justifies element by scaling all their widths
//  */
// public justifyStaves(): void {
//   for (const staffLineElement of this._staffLineElements) {
//     staffLineElement.justifyElements();
//   }
// }
//
//
// /**
//  * Calculates track line element
//  */
// public calc(): void {
//   const prevTrackLineElement =
//     this.trackElement.trackLineElements[
//       this.trackElement.trackLineElements.length - 1
//     ];
//   const y = prevTrackLineElement?._rect.bottom ?? 0;
//   this._rect = new Rect(
//     0,
//     y,
//     TabLayoutDimensions.WIDTH,
//     TabLayoutDimensions.getStaffLineMinHeight(this.track.context.instrument)
//   );

//   this._trackLineInfoElement.calc();
// }
