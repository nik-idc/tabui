import { Point, randomInt, Rect } from "../../../../shared";
import { TrackElement } from "../track-element";
import {
  NotationContainer,
  NotationNode,
  NotationNodeType,
} from "../notation-element";
import { BarElement } from "../bar/bar-element";
import { NotationStyle, StaffLineElement } from "./staff-line-element";
import { TechGapElement } from "./tech-gap-element";
import { TrackLineBar, TrackLineElement } from "../track/track-line-element";
import {
  TechLineNumber,
  TECHNIQUE_TO_LINE_NUMBER,
} from "../technique/guitar-technique/guitar-technique-element-lists";

/**
 * Class that handles geometry of a single notation style line in the staff
 * line. E.g., a staff line with tab & sheet notations both enabled: in that
 * case the StaffLineElement will contain 2 notation style line elements -
 * NotationStyleLineElement for the tab and the other for sheet notation
 */
export class NotationStyleLineElement implements NotationContainer {
  readonly nodeType = NotationNodeType.Container;

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
  readonly voiceNumber = null;

  public get owningTrackLineElement(): TrackLineElement {
    return this.staffLineElement.trackLineElement;
  }

  public get owningBarElement(): BarElement | null {
    return null;
  }

  /** Bar elements on this line */
  private _barElements: BarElement[];
  /** Bar placement data shared by every staff on this track line. */
  private _trackLineBars: TrackLineBar[];
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
    trackLineBars: TrackLineBar[]
  ) {
    this.uuid = randomInt();
    this.staffLineElement = staffLineElement;
    this.trackElement = this.staffLineElement.trackElement;
    this.notationStyle = notationStyle;

    this._barElements = [];
    this._trackLineBars = trackLineBars;
    this._techGapElement = new TechGapElement(this);
    this._techGapElement.build();

    this._boundingBox = new Rect();

    this.build();
  }

  /**
   * Builds the bar elements array for this notation style line
   */
  public build(): void {
    this._techGapElement = new TechGapElement(this);

    this._barElements = this._trackLineBars.map(
      (lineBar) =>
        new BarElement(
          this.staffLineElement.staff.bars[lineBar.masterBarIndex],
          this.trackElement,
          this.notationStyle,
          lineBar.finalizedWidth,
          lineBar.contentEndFraction,
          lineBar.x,
          this
        )
    );

    this._techGapElement.build();
  }

  /**
   * Calculates the dimensions for all bar elements & their children
   */
  public measure(): void {
    this._boundingBox.width =
      this.staffLineElement.trackLineElement.boundingBox.width;

    for (const barElement of this._barElements) {
      barElement.measure();
    }

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
    this._techGapElement.layout();
    for (const barElement of this._barElements) {
      barElement.layout();
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

  public refreshOwnedNotationNodes(): NotationNode[] {
    const elements: NotationNode[] = [this];

    elements.push(...this._techGapElement.refreshOwnedNotationNodes());
    for (const barElement of this._barElements) {
      elements.push(...barElement.refreshOwnedNotationNodes());
    }

    return elements;
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

  /** Bar placement data used to build this notation style line. */
  public get trackLineBars(): TrackLineBar[] {
    return this._trackLineBars;
  }

  /** True when complete line ownership reserves this technique-label row. */
  public hasTechniqueLine(lineNumber: TechLineNumber): boolean {
    for (const { masterBarIndex } of this.staffLineElement.trackLineBars) {
      const bar = this.staffLineElement.staff.bars[masterBarIndex];
      for (const voiceBar of bar.voiceBarsAsArray) {
        for (const beat of voiceBar.beats) {
          for (const note of beat.notes ?? []) {
            for (const technique of note.techniques) {
              if (TECHNIQUE_TO_LINE_NUMBER[technique.type] === lineNumber) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
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
