import { Staff, VoiceNumber } from "../../../model";
import { Rect, Point, randomInt } from "../../../../shared";
import { TrackElement } from "../track-element";
import {
  NotationContainer,
  NotationNode,
  NotationNodeType,
} from "../notation-element";
import { TrackLineBar, TrackLineElement } from "../track/track-line-element";
import { NotationStyleLineElement } from "./notation-style-line-element";
import type { BarElement } from "../bar/bar-element";

/**
 * Supported notation styles
 */
export enum NotationStyle {
  Classic = "classic",
  Tablature = "tablature",
}

/**
 * Class that handles all geometry & visually relevant info of a staff line
 */
export class StaffLineElement implements NotationContainer {
  readonly nodeType = NotationNodeType.Container;

  public static createStableIdentity(
    trackLineElement: TrackLineElement,
    staff: Staff
  ): string {
    return `staff-line:${trackLineElement.getStableIdentity()}:${staff.uuid}`;
  }

  /** Unique identifier for the staff line element */
  readonly uuid: number;
  /** Staff */
  readonly staff: Staff;
  /** Parent track line element */
  readonly trackLineElement: TrackLineElement;
  /** Root track element */
  readonly trackElement: TrackElement;
  readonly voiceNumber = null;

  public get owningTrackLineElement(): TrackLineElement {
    return this.trackLineElement;
  }

  public get owningBarElement(): BarElement | null {
    return null;
  }

  /** Notation style line elements of this staff line */
  private _notationStyleLineElements: Record<
    NotationStyle,
    NotationStyleLineElement | null
  >;
  /** Bar placement data shared by every staff on this track line. */
  private _trackLineBars: TrackLineBar[];
  /** Non-empty voices present anywhere on this staff line. */
  private _lineNonEmptyVoiceNumbers: VoiceNumber[];

  /** Line encapsulating rectangle */
  private _boundingBox: Rect;

  /**
   * Class that handles all geometry & visually relevant info of a staff line
   * @param staff Staff
   * @param trackLineElement Parent track line element
   * @param trackLineBars Bar placement data for this track line
   */
  constructor(
    staff: Staff,
    trackLineElement: TrackLineElement,
    trackLineBars: TrackLineBar[]
  ) {
    this.uuid = randomInt();
    this.staff = staff;
    this.trackLineElement = trackLineElement;
    this.trackElement = this.trackLineElement.trackElement;
    this._trackLineBars = trackLineBars;
    this._lineNonEmptyVoiceNumbers = [];

    this._notationStyleLineElements = {
      [NotationStyle.Classic]: null,
      [NotationStyle.Tablature]: null,
    };

    this._boundingBox = new Rect();

    this.build();
  }

  private computeLineNonEmptyVoiceNumbers(): VoiceNumber[] {
    const voiceNumbers = new Set<VoiceNumber>();
    for (const { masterBarIndex } of this._trackLineBars) {
      const bar = this.staff.bars[masterBarIndex];
      for (const voiceBar of bar.voiceBarsAsArray) {
        if (!voiceBar.isEmpty()) {
          voiceNumbers.add(voiceBar.voiceNumber);
        }
      }
    }

    return [...voiceNumbers].sort((a, b) => a - b);
  }

  private getStyleLineBars(notationStyle: NotationStyle): TrackLineBar[] {
    if (notationStyle === NotationStyle.Classic) {
      return this.staff.showClassicNotation ? this._trackLineBars : [];
    }

    return this.staff.showTablature ? this._trackLineBars : [];
  }

  /**
   * Fills the notation style lines array
   */
  public build(): void {
    this._lineNonEmptyVoiceNumbers = this.computeLineNonEmptyVoiceNumbers();

    if (this.staff.showClassicNotation) {
      const styleLine = new NotationStyleLineElement(
        this,
        NotationStyle.Classic,
        this.getStyleLineBars(NotationStyle.Classic)
      );
      this._notationStyleLineElements[NotationStyle.Classic] = styleLine;
    } else {
      this._notationStyleLineElements[NotationStyle.Classic] = null;
    }

    if (this.staff.showTablature) {
      const styleLine = new NotationStyleLineElement(
        this,
        NotationStyle.Tablature,
        this.getStyleLineBars(NotationStyle.Tablature)
      );
      this._notationStyleLineElements[NotationStyle.Tablature] = styleLine;
    } else {
      this._notationStyleLineElements[NotationStyle.Tablature] = null;
    }
  }

  public setTrackLineBars(trackLineBars: TrackLineBar[]): void {
    this._trackLineBars = trackLineBars;
    this._lineNonEmptyVoiceNumbers = this.computeLineNonEmptyVoiceNumbers();
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

  public refreshOwnedNotationNodes(): NotationNode[] {
    const elements: NotationNode[] = [this];

    for (const styleLine of this.styleLinesAsArray) {
      elements.push(...styleLine.refreshOwnedNotationNodes());
    }

    return elements;
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this.buildStateHash();
  }

  public getStableIdentity(): string {
    return StaffLineElement.createStableIdentity(
      this.trackLineElement,
      this.staff
    );
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

  public get trackLineBars(): TrackLineBar[] {
    return this._trackLineBars;
  }

  public get lineNonEmptyVoiceNumbers(): VoiceNumber[] {
    return this._lineNonEmptyVoiceNumbers;
  }

  /** Line layout bounding box getter */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(this._boundingBox.x, this._boundingBox.y);
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
