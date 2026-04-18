import { Guitar, MasterBar, Track } from "@/notation/model";
import { Point, Rect, randomInt } from "@/shared";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
import { TrackElement } from "@/notation/controller/element/track-element";
import {
  StaffLineData,
  StaffLineElement,
} from "@/notation/controller/element/staff/staff-line-element";
import { TrackLineInfoElement } from "./track-line-info-element";
import { getBarWidth } from "@/notation/controller/element/bar/bar-element";
import { VertLine } from "@/shared/rendering/geometry/line";
import { NotationElement } from "@/notation/controller/element/notation-element";

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
export class TrackLineElement implements NotationElement {
  public static createStableIdentity(
    track: Track,
    trackLineData: TrackLineData
  ): string {
    const firstMasterBarIndex = trackLineData[0]?.masterBarIndex ?? 0;
    const lastMasterBarIndex =
      trackLineData[trackLineData.length - 1]?.masterBarIndex ?? 0;
    const totalWidth = trackLineData
      .map((data) => data.largestBarWidth)
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    return `track-line:${track.uuid}:${firstMasterBarIndex}:${lastMasterBarIndex}:${totalWidth}`;
  }

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
  /** Notation elements owned by this track line in traversal order. */
  private _ownedNotationElements: NotationElement[];

  /** Track line encapsulating rectangle */
  private _boundingBox: Rect;
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
    this._ownedNotationElements = [];

    this._boundingBox = new Rect();
    this._trackLineData = trackLineData;

    this.build();

    this.trackElement.registerElement(this);
  }

  /**
   * Fills staff lines array
   */
  public build(): void {
    this.trackElement.registerElement(this);

    const prevStaffLineElements = this.trackElement.useElementReuse
      ? new Map(
          this._staffLineElements.map((element) => [
            element.getStableIdentity(),
            element,
          ])
        )
      : new Map<string, StaffLineElement>();
    this._staffLineElements = [];
    for (const staff of this.track.staves) {
      const data: StaffLineData = this._trackLineData.map((td) => {
        return {
          largestBarWidth: td.largestBarWidth,
          bar: staff.bars[td.masterBarIndex],
        };
      });

      const stableIdentity = StaffLineElement.createStableIdentity(this, staff);
      const existingStaffLineElement =
        prevStaffLineElements.get(stableIdentity);
      if (existingStaffLineElement !== undefined) {
        existingStaffLineElement.setStaffLineData(data);
        existingStaffLineElement.build();
        this._staffLineElements.push(existingStaffLineElement);
        continue;
      }

      this._staffLineElements.push(new StaffLineElement(staff, this, data));
    }

    if (this.track.staves.length > 1) {
      this._outlineLines = {
        left: new VertLine(),
        right: new VertLine(),
      };
    } else {
      this._outlineLines = undefined;
    }

    const trackLineInfoStableIdentity =
      TrackLineInfoElement.createStableIdentity(this);
    if (
      this.trackElement.useElementReuse &&
      this._trackLineInfoElement !== null &&
      this._trackLineInfoElement.getStableIdentity() ===
        trackLineInfoStableIdentity
    ) {
      this._trackLineInfoElement.build();
    } else {
      this._trackLineInfoElement = new TrackLineInfoElement(this);
    }
  }

  public setTrackLineData(trackLineData: TrackLineData): void {
    this._trackLineData = trackLineData;
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
      sumStaffHeight += staffLine.boundingBox.height;
    }

    this._trackLineInfoElement.measure();

    const width = this._staffLineElements[0].boundingBox.width;
    const height =
      sumStaffHeight + this._trackLineInfoElement.boundingBox.height;
    this._boundingBox.setDimensions(width, height);

    this.refreshOwnedNotationElements();
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
    const y = prevTrackLine?._boundingBox.bottom ?? 0;
    this._boundingBox.setCoords(0, y);

    this._trackLineInfoElement.layout();

    for (const staffLine of this._staffLineElements) {
      staffLine.layout();
    }

    if (this._outlineLines === undefined) {
      return;
    }
    const xLeft = 0;
    // const xRight = this._boundingBox.width;
    const barElements =
      this._staffLineElements[0].styleLinesAsArray[0].barElements;
    const xRight = barElements[barElements.length - 1].globalBoundingBox.right;

    // TODO: Redo this outline layout to support multiple notation
    // styles since current calculation only works for tablature
    const y1 =
      this._trackLineInfoElement.boundingBox.bottom +
      // Since visually the staff lines begin a bit lower than the element
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2 +
      this._staffLineElements[0].styleLinesAsArray[0].techGapElement.boundingBox
        .bottom;
    const y2 =
      this._staffLineElements[this._staffLineElements.length - 1].boundingBox
        .bottom -
      EditorLayoutDimensions.TUPLET_RECT_HEIGHT -
      EditorLayoutDimensions.DURATIONS_HEIGHT -
      EditorLayoutDimensions.NOTE_RECT_HEIGHT / 2;

    this._outlineLines.left.set(xLeft, y1, y2);
    this._outlineLines.right.set(xRight, y1, y2);
  }

  public update(): void {
    this.build();

    this.measure();
    this.layout();
  }

  public layoutVerticalShift(): void {
    const prevTrackLine = this.trackElement.getPrevTrackLineElement(this);
    const y = prevTrackLine?._boundingBox.bottom ?? 0;
    this._boundingBox.y = y;
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

    for (const staffLineElement of this._staffLineElements) {
      staffLineElement.scaleHorBy(scale);
    }
  }

  /**
   * Justifies the info element & staff lines
   */
  public justifyElements(fakeJustify: boolean = false): void {
    if (this._staffLineElements.length === 0) {
      throw Error("Empty track line element's staff lines array at justify");
    }

    if (this._trackLineInfoElement === null) {
      throw Error("Info element is null at justify");
    }

    for (const staffLine of this._staffLineElements) {
      staffLine.justifyStyleLines(fakeJustify);
    }

    // Calling layout since for info line that will have the same effect
    this._trackLineInfoElement.layout();

    const width = this._staffLineElements[0].boundingBox.width;
    this._boundingBox.width = width;

    if (this._outlineLines === undefined) {
      return;
    }
    const barElements =
      this._staffLineElements[0].styleLinesAsArray[0].barElements;
    const lastBE = barElements[barElements.length - 1];
    const xRight = barElements[barElements.length - 1].globalBoundingBox.right;
    this._outlineLines.right.x = xRight;
    if (fakeJustify) {
      console.log("=== TRACK LINE FAKE JUSTIFY", {
        lineBB: JSON.parse(JSON.stringify(this._boundingBox)),
        staffBB: JSON.parse(
          JSON.stringify(
            lastBE.notationStyleLineElement.staffLineElement.boundingBox
          )
        ),
        styleBB: JSON.parse(
          JSON.stringify(lastBE.notationStyleLineElement.boundingBox)
        ),
        barBB: JSON.parse(JSON.stringify(lastBE.boundingBox)),
      });
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

  /**
   * HACK: Transitional flattened traversal for viewport element collection.
   * Current approach manually walks nested children to collect all notation
   * elements, which is brittle and tightly coupled to hierarchy shape.
   *
   * Proposed fix:
   * 1) Prefer TrackLineElement-owned registry (readonly Map/Set) of all
   *    descendant NotationElements; alternative is TrackElement-level map
   *    of track line -> elements.
   * 2) Promote TrackLineElement as the highest hierarchical owner by giving
   *    every NotationElement a direct TrackLineElement reference.
   *    TrackElement then remains an orchestrator/builder rather than
   *    traversal owner.
   */
  public refreshOwnedNotationElements(): NotationElement[] {
    const elements: NotationElement[] = [this];

    if (this._trackLineInfoElement !== null) {
      elements.push(
        ...this._trackLineInfoElement.refreshOwnedNotationElements()
      );
    }

    for (const staffLine of this._staffLineElements) {
      elements.push(...staffLine.refreshOwnedNotationElements());
    }

    this._ownedNotationElements = elements;
    return elements;
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this.buildStateHash();
  }

  public getStableIdentity(): string {
    return TrackLineElement.createStableIdentity(
      this.track,
      this._trackLineData
    );
  }

  /** Staff line element on this track line */
  public get staffLineElements(): StaffLineElement[] {
    return this._staffLineElements;
  }

  /** Track line info (tempo) */
  public get trackLineInfoElement(): TrackLineInfoElement | null {
    return this._trackLineInfoElement;
  }

  public get ownedNotationElements(): NotationElement[] {
    return this._ownedNotationElements;
  }

  /** Left & right outline line for when there are more than 1 staves */
  public get outlineLines(): OutlineLines | undefined {
    return this._outlineLines;
  }

  /** Left & right outline line in track line-local coordinates */
  public get outlineLinesLineLocal(): OutlineLines | undefined {
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

  /** Track line layout bounding box */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(0, 0);
  }

  /** Bounding box of this element in track line-local coordinates */
  public get lineLocalBoundingBox(): Rect {
    return new Rect(0, 0, this._boundingBox.width, this._boundingBox.height);
  }

  /** Global coords of the track line element (in most cases X will be 0) */
  public get globalCoords(): Point {
    return new Point(
      this.trackElement.globalCoords.x + this._boundingBox.x,
      this.trackElement.globalCoords.y + this._boundingBox.y
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

  /** Data necessary to build a track line */
  public get trackLineData(): TrackLineData {
    return this._trackLineData;
  }
}
