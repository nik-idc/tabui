import { Point, randomInt, Rect } from "@/shared";
import { TechGapLineElement } from "./tech-gap-line-element";
import { TechLineNumber, TECHNIQUE_TO_LINE_NUMBER } from "./technique";
import { NotationStyleLineElement } from "./notation-style-line-element";

/**
 * Class that handles all visually relevant info of a technique gap
 */
export class TechGapElement {
  /** Unique identifier for this element */
  readonly uuid: number;
  /** Parent notation style line element */
  readonly notationStyleLineElement: NotationStyleLineElement;

  /** Child tech gap line elements */
  private _techGapLines: Record<TechLineNumber, TechGapLineElement | null>;

  /** Outer rectangle */
  private _rect: Rect;

  /**
   * Class that handles all visually relevant info of a technique gap
   * @param notationStyleLineElement Parent notation style line element
   */
  constructor(notationStyleLineElement: NotationStyleLineElement) {
    this.uuid = randomInt();
    this.notationStyleLineElement = notationStyleLineElement;

    this._techGapLines = {
      1: null,
      2: null,
      3: null,
    };

    this._rect = new Rect();
  }

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
              gapLine = new TechGapLineElement(this);
              this._techGapLines[lineNumber] = gapLine;
            }

            gapLine.addTechnique(beatElement, technique);
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
   * Sets the coordinates of all child tech gap line elements
   */
  public layout(): void {
    this._rect.setCoords(0, 0);

    this._techGapLines[1]?.layout();
    this._techGapLines[2]?.layout();
    this._techGapLines[3]?.layout();
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
  }

  /** Outer rectangle */
  public get rect(): Rect {
    return this._rect;
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

  /** This tech gap line's global coords */
  public get globalCoords(): Point {
    return new Point(
      this.notationStyleLineElement.globalCoords.x + this._rect.x,
      this.notationStyleLineElement.globalCoords.y + this._rect.y
    );
  }
}
