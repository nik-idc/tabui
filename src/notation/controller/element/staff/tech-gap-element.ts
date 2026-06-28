import { Point, randomInt, Rect } from "@/shared";
import { TrackElement } from "@/notation/controller/element/track-element";
import { NotationElement } from "@/notation/controller/element/notation-element";
import {
  TechLineNumber,
  TECHNIQUE_TO_LINE_NUMBER,
} from "@/notation/controller/element/technique/guitar-technique/guitar-technique-element-lists";
import { TechGapLineElement } from "./tech-gap-line-element";
import { NotationStyleLineElement } from "./notation-style-line-element";
import type { BarElement } from "../bar/bar-element";
import type { TrackLineElement } from "../track/track-line-element";

/**
 * Class that handles all visually relevant info of a technique gap
 */
export class TechGapElement implements NotationElement {
  public static createStableIdentity(
    notationStyleLineElement: NotationStyleLineElement
  ): string {
    return `tech-gap:${notationStyleLineElement.getStableIdentity()}`;
  }

  /** Unique identifier for this element */
  readonly uuid: number;
  /** Parent notation style line element */
  readonly notationStyleLineElement: NotationStyleLineElement;
  /** Root track element */
  readonly trackElement: TrackElement;
  readonly voiceNumber = null;

  public get owningTrackLineElement(): TrackLineElement {
    return this.notationStyleLineElement.staffLineElement.trackLineElement;
  }

  public get owningBarElement(): BarElement | null {
    return null;
  }

  /** Child tech gap line elements */
  private _techGapLines: Record<TechLineNumber, TechGapLineElement | null>;
  /** Stable key for each child gap line */
  private _techGapLinesByIdentity: Map<string, TechGapLineElement>;

  /** Outer rectangle */
  private _boundingBox: Rect;
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
    this._techGapLinesByIdentity = new Map();

    this._boundingBox = new Rect();
  }

  /**
   * Builds or reuses child gap line elements.
   */
  public build(): void {
    const prevGapLines = new Map(this._techGapLinesByIdentity);
    this._techGapLinesByIdentity.clear();

    for (const lineNumber of [1, 2, 3] as TechLineNumber[]) {
      const stableIdentity = TechGapLineElement.createStableIdentity(
        this,
        lineNumber
      );
      let gapLine = prevGapLines.get(stableIdentity);
      if (gapLine === undefined) {
        gapLine = new TechGapLineElement(this, lineNumber);
      }

      this._techGapLines[lineNumber] = gapLine;
      this._techGapLinesByIdentity.set(stableIdentity, gapLine);
      gapLine.build();
    }

    for (const barElement of this.notationStyleLineElement.barElements) {
      for (const beatElement of barElement.beatElements) {
        // TODO(rests): rest beats cannot own note techniques, but this should
        // become an explicit rest-aware traversal rather than a null fallback.
        for (const note of beatElement.beat.notes ?? []) {
          for (const technique of note.techniques) {
            const lineNumber = TECHNIQUE_TO_LINE_NUMBER[technique.type];
            if (lineNumber === null) {
              continue;
            }

            this._techGapLines[lineNumber]?.addTechnique(
              beatElement,
              technique
            );
          }
        }
      }
    }
  }

  /**
   * Sets the dimensions of all child tech gap line elements
   */
  public measure(): void {
    for (const lineNumber of [1, 2, 3] as TechLineNumber[]) {
      this._techGapLines[lineNumber]?.measure();
    }

    const height = this.techGapLinesAsArray.reduce(
      (sum, line) => sum + line.boundingBox.height,
      0
    );
    this._boundingBox.setDimensions(
      this.notationStyleLineElement.boundingBox.width,
      height
    );
  }

  private buildStateHash(): string {
    const hashArr: string[] = [];

    if (this.globalBoundingBox.width !== undefined) {
      hashArr.push(`${this.globalBoundingBox.x}`);
      hashArr.push(`${this.globalBoundingBox.y}`);
      hashArr.push(`${this.globalBoundingBox.width}`);
      hashArr.push(`${this.globalBoundingBox.height}`);
    }

    return hashArr.join("");
  }

  /**
   * Sets the coordinates of all child tech gap line elements
   */
  public layout(): void {
    this._boundingBox.setCoords(0, 0);

    this._techGapLines[1]?.layout();
    this._techGapLines[2]?.layout();
    this._techGapLines[3]?.layout();
  }

  public update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  public refreshOwnedNotationElements(): NotationElement[] {
    const elements: NotationElement[] = [this];

    for (const line of this.techGapLinesAsArray) {
      elements.push(...line.refreshOwnedNotationElements());
    }

    return elements;
  }

  public getPrevGapLine(
    techGapLine: TechGapLineElement
  ): TechGapLineElement | null {
    for (let i = techGapLine.techLineNumber - 1; i >= 1; i--) {
      const prevLine = this._techGapLines[i as TechLineNumber];
      if ((prevLine?.boundingBox.height ?? 0) > 0) {
        return prevLine;
      }
    }

    return null;
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
    return this.buildStateHash();
  }

  public getStableIdentity(): string {
    return TechGapElement.createStableIdentity(this.notationStyleLineElement);
  }

  /** This tech gap line's global coords */
  public get globalCoords(): Point {
    return new Point(
      this.notationStyleLineElement.globalCoords.x + this._boundingBox.x,
      this.notationStyleLineElement.globalCoords.y + this._boundingBox.y
    );
  }

  /** Outer layout bounding box */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(
      this.notationStyleLineElement.lineLocalCoords.x + this._boundingBox.x,
      this.notationStyleLineElement.lineLocalCoords.y + this._boundingBox.y
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
      this._boundingBox?.width,
      this._boundingBox?.height
    );
  }

  public get rect(): Rect {
    return this.boundingBox;
  }

  public get globalRect(): Rect {
    return this.globalBoundingBox;
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
