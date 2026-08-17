import { Track } from "../../../model";
import { Point, Rect, randomInt } from "../../../../shared";
import { TrackElement } from "../track-element";
import { StaffLineElement } from "../staff/staff-line-element";
import { TrackLineInfoElement } from "./track-line-info-element";
import { VertLine } from "../../../../shared/rendering/geometry/line";
import {
  isNotationElement,
  NotationElement,
  NotationNode,
  NotationNodeType,
} from "../notation-element";
import type { BarElement } from "../bar/bar-element";
import type { ScoreLayoutBar } from "../../layout/score-layout-plan";
/**
 * Bar placement data for one master bar inside a presentation track line.
 * Presentation shells create the actual BarElements from this placement data.
 */
export type TrackLineBar = ScoreLayoutBar;

export type TrackElementSkeletonLine = {
  trackLineBars: TrackLineBar[];
  finalLineHeight: number;
  finalLineWidth: number;
  y: number;
};

export type TrackElementSkeleton = {
  lines: TrackElementSkeletonLine[];
};

type OutlineLines = {
  left: VertLine;
  right: VertLine;
};

/**
 * Class that handles all geometry & visually relevant info of a track line
 */
export class TrackLineElement implements NotationElement {
  readonly nodeType = NotationNodeType.Element;

  public static createStableIdentity(track: Track, lineIndex: number): string {
    return `track-line:${track.uuid}:${lineIndex}`;
  }

  /** Unique identifier for the track line element */
  readonly uuid: number;
  /** Track */
  readonly track: Track;
  /** Parent track element */
  readonly trackElement: TrackElement;
  readonly voiceNumber = null;

  public get owningTrackLineElement(): TrackLineElement {
    return this;
  }

  public get owningBarElement(): BarElement | null {
    return null;
  }

  /** Staff line element on this track line */
  private _staffLineElements: StaffLineElement[];
  /** Track line info (tempo) */
  private _trackLineInfoElement: TrackLineInfoElement | null;
  /** Notation nodes owned by this track line in traversal order. */
  private _ownedNotationNodes: NotationNode[];
  /** Drawable nodes owned by this track line in paint traversal order. */
  private _drawableNotationElements: NotationElement[];

  /** Track line encapsulating rectangle */
  private _boundingBox: Rect;
  /** Left & right outline line for when there are more than 1 staves */
  private _outlineLines?: OutlineLines;
  /** Bar elements placed by TrackElement into this presentation line. */
  private _skeletonLine: TrackElementSkeletonLine;
  /** Stable ownership identity captured when the line data is assigned. */
  private _stableIdentity: string;

  /**
   * Class that handles all geometry & visually relevant info of a track line
   * @param trackElement Parent track element
   * @param trackLineBars Bar placement data for this track line
   */
  constructor(
    trackElement: TrackElement,
    skeletonLine: TrackElementSkeletonLine,
    lineIndex: number
  ) {
    this.uuid = randomInt();
    this.track = trackElement.track;
    this.trackElement = trackElement;

    this._staffLineElements = [];
    this._trackLineInfoElement = null;
    this._ownedNotationNodes = [];
    this._drawableNotationElements = [];

    this._boundingBox = new Rect();
    this._skeletonLine = skeletonLine;
    this._stableIdentity = TrackLineElement.createStableIdentity(
      this.track,
      lineIndex
    );

    // A new track line starts as a geometry-only shell until materialized.
    this._ownedNotationNodes = [this];
    this._drawableNotationElements = [this];
    this.setGeometryFromSkeleton(skeletonLine);
  }

  /** Applies whole-track skeleton geometry without building descendants. */
  public setGeometryFromSkeleton(skeletonLine: TrackElementSkeletonLine): void {
    this._skeletonLine = skeletonLine;
    this._boundingBox.set(
      0,
      skeletonLine.y,
      skeletonLine.finalLineWidth,
      skeletonLine.finalLineHeight
    );
  }

  /**
   * Fills staff lines array
   */
  public build(
    materializedTrackLineBars = this._skeletonLine.trackLineBars
  ): void {
    this._staffLineElements = [];
    for (const staff of this.track.staves) {
      this._staffLineElements.push(
        new StaffLineElement(
          staff,
          this,
          this._skeletonLine.trackLineBars,
          materializedTrackLineBars
        )
      );
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
    this.refreshOwnedNotationNodes();
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
  }

  private buildStateHash(): string {
    const hashArr: string[] = [
      `${this.globalBoundingBox.x}` +
        `${this.globalBoundingBox.y}` +
        `${this.globalBoundingBox.width}` +
        `${this.globalBoundingBox.height}`,
    ];

    if (this._outlineLines !== undefined) {
      hashArr.push(
        `${this._outlineLines.left.x}` +
          `${this._outlineLines.left.y1}` +
          `${this._outlineLines.left.y2}` +
          `${this._outlineLines.right.x}` +
          `${this._outlineLines.right.y1}` +
          `${this._outlineLines.right.y2}`
      );
    }

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

    const firstStaffLine = this._staffLineElements[0];
    const lastStaffLine =
      this._staffLineElements[this._staffLineElements.length - 1];
    const firstStyleLine = firstStaffLine.styleLinesAsArray[0];
    const lastStyleLine =
      lastStaffLine.styleLinesAsArray[
        lastStaffLine.styleLinesAsArray.length - 1
      ];
    const firstBar = firstStyleLine.barElements[0];
    const lastBar =
      lastStyleLine.barElements[lastStyleLine.barElements.length - 1];
    const firstMaterializedBarStaffLine = firstBar.staffLinesLineLocal[0];
    const lastMaterializedBarStaffLine =
      lastBar.staffLinesLineLocal[lastBar.staffLinesLineLocal.length - 1];
    const xLeft = firstMaterializedBarStaffLine.x1;
    const xRight = lastMaterializedBarStaffLine.x2;
    const y1 = firstMaterializedBarStaffLine.y;
    const y2 = lastMaterializedBarStaffLine.y;

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
   * Architecture debt: flattened traversal for viewport element collection.
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
  public refreshOwnedNotationNodes(): NotationNode[] {
    const elements: NotationNode[] = [this];

    if (this._trackLineInfoElement !== null) {
      elements.push(...this._trackLineInfoElement.refreshOwnedNotationNodes());
    }

    for (const staffLine of this._staffLineElements) {
      elements.push(...staffLine.refreshOwnedNotationNodes());
    }

    this._ownedNotationNodes = elements;
    this._drawableNotationElements = elements.filter(isNotationElement);
    return elements;
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this.buildStateHash();
  }

  public getStableIdentity(): string {
    return this._stableIdentity;
  }

  /** Staff line element on this track line */
  public get staffLineElements(): StaffLineElement[] {
    return this._staffLineElements;
  }

  public *allBarElements(): Generator<BarElement> {
    for (const staff of this._staffLineElements) {
      for (const style of staff.styleLinesAsArray) {
        yield* style.barElements;
      }
    }
  }

  /** Track line info (tempo) */
  public get trackLineInfoElement(): TrackLineInfoElement | null {
    return this._trackLineInfoElement;
  }

  public get ownedNotationNodes(): NotationNode[] {
    return this._ownedNotationNodes;
  }

  /** Drawable elements owned by this materialized track line. */
  public get drawableNotationElements(): NotationElement[] {
    return this._drawableNotationElements;
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

  /** Bar placement data for this rendered track line. */
  public get trackLineBars(): TrackLineBar[] {
    return this._skeletonLine.trackLineBars;
  }

  /** True when complete line ownership reserves a tempo row. */
  public get hasTempo(): boolean {
    return this._skeletonLine.trackLineBars.some(({ masterBarIndex }) => {
      const masterBar = this.track.score.masterBars[masterBarIndex];
      const previous = this.track.score.masterBars[masterBarIndex - 1];
      return previous === undefined || previous.tempo !== masterBar.tempo;
    });
  }

  public get skeletonLine(): TrackElementSkeletonLine {
    return this._skeletonLine;
  }
}
