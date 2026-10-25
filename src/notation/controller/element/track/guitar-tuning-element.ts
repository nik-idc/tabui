import { Point, Rect, randomInt } from "../../../../shared";
import type { TrackElement } from "../track-element";
import type { BarElement } from "../bar/bar-element";
import { NotationElement, NotationNodeType } from "../notation-element";
import { NotationStyle } from "../staff/staff-line-container";
import type { TrackLineElement } from "./track-line-element";

/** Displays open-string pitch classes beside the first tablature bar. */
export class GuitarTuningElement implements NotationElement {
  public static createStableIdentity(
    trackLineElement: TrackLineElement
  ): string {
    return `guitar-tuning:${trackLineElement.getStableIdentity()}`;
  }

  /** Identifies this notation element's node type */
  readonly nodeType = NotationNodeType.Element;
  /** Stable random identity used by renderer reconciliation. */
  readonly uuid = randomInt();
  /** Track line that owns this tuning label column. */
  readonly trackLineElement: TrackLineElement;
  /** Track containing the displayed tuning. */
  readonly trackElement: TrackElement;
  /** Tuning labels are not voice-specific. */
  readonly voiceNumber = null;
  /** Label column bounds in track-line-local coordinates. */
  private _boundingBox = new Rect();
  /** Cached label baselines in track-line-local coordinates for SVG rendering. */
  private _textYs: number[] = [];

  constructor(trackLineElement: TrackLineElement) {
    this.trackLineElement = trackLineElement;
    this.trackElement = trackLineElement.trackElement;
  }

  public build(): void {}

  public measure(): void {
    this._boundingBox.setDimensions(
      this.trackElement.layoutDimensions.noteTextSize * 1.5,
      this.trackElement.layoutDimensions.getStaffHeight(
        this.trackElement.track.context.instrument
      )
    );
  }

  public layout(): void {
    const tabLine = this.trackLineElement.staffLineContainers
      .flatMap((staff) => staff.styleLinesAsArray)
      .find((line) => line.notationStyle === NotationStyle.Tablature);
    const firstBar = tabLine?.barElements[0];
    if (tabLine === undefined || firstBar === undefined) {
      this._textYs = [];
      return;
    }

    this._boundingBox.setCoords(0, 0);
    this._textYs = firstBar.staffLinesLineLocal.map((line) => line.y);
    const labelExtent =
      Math.max(...this._textYs) +
      this.trackElement.layoutDimensions.noteTextSize / 2;
    this._boundingBox.setDimensions(this._boundingBox.width, labelExtent);
  }

  public update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  public refreshOwnedNotationNodes(): NotationElement[] {
    return [this];
  }

  public get owningTrackLineElement(): TrackLineElement {
    return this.trackLineElement;
  }

  public get owningBarElement(): BarElement | null {
    return null;
  }

  /** Returns uppercase pitch-class labels in high-string-first order. */
  public get texts(): string[] {
    return (
      this.trackElement.track.context.instrument.tuning?.map((note) =>
        note.noteValue.toUpperCase()
      ) ?? []
    );
  }

  /** Label baselines in track-line-local coordinates. */
  public get textYs(): number[] {
    return this._textYs;
  }

  public get stateHash(): string {
    return `${this.globalBoundingBox.x}${this.globalBoundingBox.y}${this.globalBoundingBox.width}${this.globalBoundingBox.height}${this.texts.join("")}${this._textYs.join(",")}`;
  }

  public getStableIdentity(): string {
    return GuitarTuningElement.createStableIdentity(this.trackLineElement);
  }

  public get boundingBox(): Rect {
    return this._boundingBox;
  }
  public get lineLocalCoords(): Point {
    return new Point(this._boundingBox.x, this._boundingBox.y);
  }
  public get lineLocalBoundingBox(): Rect {
    return this._boundingBox;
  }
  public get globalCoords(): Point {
    return new Point(
      this.trackLineElement.globalCoords.x + this._boundingBox.x,
      this.trackLineElement.globalCoords.y + this._boundingBox.y
    );
  }
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
