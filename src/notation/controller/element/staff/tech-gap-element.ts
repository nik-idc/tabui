import { Point, randomInt, Rect } from "@/shared";
import { TrackElement } from "@/notation/controller/element/track-element";
import { NotationElement } from "@/notation/controller/element/notation-element";
import {
  TechLineNumber,
  TECHNIQUE_TO_LINE_NUMBER,
} from "@/notation/controller/element/technique/guitar-technique/guitar-technique-element-lists";
import { TechGapLineElement } from "./tech-gap-line-element";
import { NotationStyleLineElement } from "./notation-style-line-element";

/**
 * Class that handles all visually relevant info of a technique gap
 */
export class TechGapElement implements NotationElement {
  /** Unique identifier for this element */
  readonly uuid: number;
  /** Parent notation style line element */
  readonly notationStyleLineElement: NotationStyleLineElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  /** Child tech gap line elements */
  private _techGapLines: Record<TechLineNumber, TechGapLineElement | null>;

  /** Outer rectangle */
  private _rect: Rect;
  /** String encoding the state of this element */
  private _stateHash: string;

  /**
   * Class that handles all visually relevant info of a technique gap
   * @param notationStyleLineElement Parent notation style line element
   */
  constructor(notationStyleLineElement: NotationStyleLineElement) {
    this.uuid = randomInt();
    this.notationStyleLineElement = notationStyleLineElement;
    this.trackElement = this.notationStyleLineElement.trackElement;

    this._techGapLines = {
      1: null,
      2: null,
      3: null,
    };

    this._stateHash = "";

    this._rect = new Rect();

    this.trackElement.registerElement(this);
  }

  /** Dummy build function to comply with the interface
   * TODO: Rethink this element's update process
   */
  public build(): void {}

  /**
   * Sets the dimensions of all child tech gap line elements
   */
  public measure(): void {
    for (const barElement of this.notationStyleLineElement.barElements) {
      for (const beatElement of barElement.beatElements) {
        for (const note of beatElement.beat.notes) {
          for (const technique of note.techniques) {
            const lineNumber = TECHNIQUE_TO_LINE_NUMBER[technique.type];
            if (lineNumber === null) {
              continue;
            }

            let gapLine = this._techGapLines[lineNumber];
            if (gapLine === null) {
              gapLine = new TechGapLineElement(this, lineNumber);
              gapLine.build();
              gapLine.measure();
              this._techGapLines[lineNumber] = gapLine;
            }

            gapLine.addTechnique(beatElement, technique);
            gapLine.measure();
          }
        }
      }
    }

    const height =
      (this._techGapLines[1]?.rect?.height ?? 0) +
      (this._techGapLines[2]?.rect?.height ?? 0) +
      (this._techGapLines[3]?.rect?.height ?? 0);
    this._rect.setDimensions(this.notationStyleLineElement.rect.width, height);
  }

  /**
   * Calculates the state hash of the element
   * */
  private calcStateHash(): void {
    const hashArr: string[] = [];

    if (this.globalRect.width !== undefined) {
      hashArr.push(`${this.globalRect.x}`);
      hashArr.push(`${this.globalRect.y}`);
      hashArr.push(`${this.globalRect.width}`);
      hashArr.push(`${this.globalRect.height}`);
    }

    this._stateHash = hashArr.join("");

    // // Prompt the track element to check if this element has changed
    // this.trackElement.checkIfDirty(this);
  }

  /**
   * Sets the coordinates of all child tech gap line elements
   */
  public layout(): void {
    this._rect.setCoords(0, 0);

    this._techGapLines[1]?.layout();
    this._techGapLines[2]?.layout();
    this._techGapLines[3]?.layout();

    // Calculating state hash at the last step of
    // element's update process - layout
    this.calcStateHash();
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
  public scaleHorBy(scale: number): void {
    this._rect.x *= scale;
    this._rect.width *= scale;

    this._techGapLines[1]?.scaleHorBy(scale);
    this._techGapLines[2]?.scaleHorBy(scale);
    this._techGapLines[3]?.scaleHorBy(scale);

    // // Calculating state hash at the last step of
    // // element's update process - layout
    // this.calcStateHash();
  }

  public getPrevGapLine(
    techGapLine: TechGapLineElement
  ): TechGapLineElement | null {
    switch (techGapLine.techLineNumber) {
      case 1:
        return null;
      case 2:
        return this._techGapLines[1];
      case 3:
        return this._techGapLines[2];
    }
  }

  public getNextGapLine(
    techGapLine: TechGapLineElement
  ): TechGapLineElement | null {
    switch (techGapLine.techLineNumber) {
      case 1:
        return this._techGapLines[2];
      case 2:
        return this._techGapLines[3];
      case 3:
        return null;
    }
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this._stateHash;
  }

  public getModelUUID(): number {
    return this.notationStyleLineElement.getModelUUID() + 1000002;
  }

  /** This tech gap line's global coords */
  public get globalCoords(): Point {
    return new Point(
      this.notationStyleLineElement.globalCoords.x + this._rect.x,
      this.notationStyleLineElement.globalCoords.y + this._rect.y
    );
  }

  /** Outer rectangle */
  public get rect(): Rect {
    return this._rect;
  }

  /** This element's rect in global coords */
  public get globalRect(): Rect {
    return new Rect(
      this.globalCoords.x,
      this.globalCoords.y,
      this._rect?.width,
      this._rect?.height
    );
  }

  /** Child tech gap line elements */
  public get techGapLines(): Record<TechLineNumber, TechGapLineElement | null> {
    return this._techGapLines;
  }

  /** Child tech gap line elements */
  public get techGapLinesAsArray(): TechGapLineElement[] {
    const result = [];
    if (this._techGapLines[1] !== null) {
      result.push(this._techGapLines[1]);
    }
    if (this._techGapLines[2] !== null) {
      result.push(this._techGapLines[2]);
    }
    if (this._techGapLines[3] !== null) {
      result.push(this._techGapLines[3]);
    }

    return result;
  }
}
