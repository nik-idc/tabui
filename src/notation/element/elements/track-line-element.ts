import { Bar, GuitarTechniqueType, MasterBar, Track } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { BarElement } from "./bar-element";
import { StaffLineElement } from "./staff-line-element";
import { TabLayoutDimensions } from "../tab-controller-dim";
import { TrackElement } from "./track-element";

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

  /** Staff line elements on this track line */
  private _staffLineElements: StaffLineElement[];
  /** Track line encapsulating rectangle */
  private _rect: Rect;

  /**
   * Class that handles all geometry & visually relevant info of a track line
   * @param track Track
   * @param trackElement Parent track element
   */
  constructor(track: Track, trackElement: TrackElement) {
    this.uuid = randomInt();
    this.track = track;
    this.trackElement = trackElement;

    this._rect = new Rect();
    this._staffLineElements = [];

    this.calc();
  }

  /**
   * Checks if bar fits
   * @param masterBarIndex Index of the master bar
   * @returns True if firs, false otherwise
   */
  public masterBarFits(masterBarIndex: number): boolean {
    for (const staffLineElement of this._staffLineElements) {
      if (!staffLineElement.masterBarFits(masterBarIndex)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Add master bar to the line (assumes the bar fits)
   * @param masterBarIndex Index of the master bar to add
   */
  public addBar(masterBarIndex: number): boolean {
    if (!this.masterBarFits(masterBarIndex)) {
      return false;
    }

    // Magic ...
    for (const staffLineElement of this._staffLineElements) {
      staffLineElement.addBar(masterBarIndex);
    }

    return true;
  }

  /**
   * Justifies elements by scaling all their widths
   */
  public justifyStaves(): void {
    for (const staffLineElement of this._staffLineElements) {
      staffLineElement.justifyElements();
    }
  }

  /**
   * Calculates track line element
   */
  public calc(): void {
    const prevTrackLineElement =
      this.trackElement.getPrevTrackLineElement(this);
    const x = prevTrackLineElement?._rect.x ?? 0;
    const y = prevTrackLineElement?._rect.y ?? 0;
    this._rect = new Rect(
      x,
      y,
      0,
      TabLayoutDimensions.getStaffLineMinHeight(this.track.context.instrument)
    );

    this._staffLineElements = [];
    for (const staff of this.track.staves) {
      const staffLineElement = new StaffLineElement(staff, this);
      this._staffLineElements.push(staffLineElement);
    }
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

  /** Staff line elements on this track line */
  public get staffLineElements(): StaffLineElement[] {
    return this._staffLineElements;
  }

  /** Track line encapsulating rectangle */
  public get rect(): Rect {
    return this._rect;
  }
}
