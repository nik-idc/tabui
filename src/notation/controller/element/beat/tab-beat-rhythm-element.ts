import {
  Beat,
  DURATION_TO_FLAG_COUNT,
  NoteDuration,
  VoiceNumber,
} from "../../../model";
import { TabBeatElement } from "../beat/tab-beat-element";
import { Point, randomInt, Rect } from "../../../../shared";
import { TrackElement } from "../track-element";
import { HorLine, VertLine } from "../../../../shared/rendering/geometry/line";
import { Circle } from "../../../../shared/rendering/geometry/circle";
import { NotationElement } from "../notation-element";
import { EditorLayoutDimensions } from "../../editor-layout-dimensions";
import { VoiceBarRhythmElement } from "../bar/voice-bar-rhythm-element";
import type { BarElement } from "../bar/bar-element";
import type { TrackLineElement } from "../track/track-line-element";

export class TabBeatRhythmElement implements NotationElement {
  public static createStableIdentity(beat: Beat): string {
    return `tab-beat-rhythm:${beat.uuid}`;
  }

  /** Beat element's unique identifier */
  readonly uuid: number;
  /** The beat */
  readonly beat: Beat;
  /** Parent bar element */
  readonly voiceBarRhythmElement: VoiceBarRhythmElement;
  /** Parent beat element */
  readonly beatElement: TabBeatElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  public get voiceNumber(): VoiceNumber {
    return this.voiceBarRhythmElement.voiceNumber;
  }

  public get owningTrackLineElement(): TrackLineElement {
    return this.voiceBarRhythmElement.owningTrackLineElement;
  }

  public get owningBarElement(): BarElement {
    return this.voiceBarRhythmElement.barElement;
  }

  /** This beat's rect */
  private _boundingBox: Rect;
  /** Duration stem vertical line */
  private _durationStemLine?: VertLine;
  /** Duration flags horizontal lines (for durations like 1/8, 1/16 etc) */
  private _durationFlagLines?: HorLine[];
  /** This beat's dot rect */
  private _dot1Circle?: Circle;
  /** This beat's dot rect */
  private _dot2Circle?: Circle;

  constructor(
    voiceBarRhythmElement: VoiceBarRhythmElement,
    beatElement: TabBeatElement
  ) {
    this.uuid = randomInt();
    this.voiceBarRhythmElement = voiceBarRhythmElement;
    this.beat = beatElement.beat;
    this.beatElement = beatElement;
    this.trackElement = this.beatElement.trackElement;

    this._boundingBox = new Rect();

    this.build();
  }

  public build(): void {
    if (this.beat.voiceBar.bar.staff.showClassicNotation) {
      // Only show durations & else if classical notation is not enabled
      this._durationStemLine = undefined;
      this._durationFlagLines = undefined;
      this._dot1Circle = undefined;
      this._dot2Circle = undefined;
      return;
    }

    if (this.beat.baseDuration !== NoteDuration.Whole) {
      this._durationStemLine = new VertLine();
    } else {
      this._durationStemLine = undefined;
    }

    const hasValidBeamGroup =
      this.beat.beamGroupId !== null &&
      this.beat.beamGroupId < this.beat.voiceBar.beamingGroups.length;

    if (this.beat.baseDuration <= NoteDuration.Eighth && !hasValidBeamGroup) {
      // Flag lines should only be visible for beats
      // outside of valid beam groups AND of duration smaller than 8ths
      this._durationFlagLines = Array.from(
        { length: DURATION_TO_FLAG_COUNT[this.beat.baseDuration] },
        () => new HorLine()
      );
    } else {
      this._durationFlagLines = undefined;
    }

    if (this.beat.dots === 0) {
      this._dot1Circle = undefined;
      this._dot2Circle = undefined;
    } else if (this.beat.dots === 1) {
      this._dot1Circle = new Circle();
      this._dot2Circle = undefined;
    } else {
      this._dot1Circle = new Circle();
      this._dot2Circle = new Circle();
    }
  }

  measure(): void {
    const notesHeight =
      this.beatElement.noteElements.length *
      EditorLayoutDimensions.NOTE_RECT_HEIGHT;
    const height = notesHeight + EditorLayoutDimensions.DURATIONS_HEIGHT;
    this._boundingBox.setDimensions(this.beatElement.boundingBox.width, height);

    if (this._dot1Circle !== undefined) {
      this._dot1Circle.diameter = EditorLayoutDimensions.DOT_DIAMETER;
    }
    if (this._dot2Circle !== undefined) {
      this._dot2Circle.diameter = EditorLayoutDimensions.DOT_DIAMETER;
    }
  }

  private layoutDuration(): void {
    if (this._durationStemLine === undefined) {
      return;
    }
    const stemY1 = 0;
    const stemY2 = stemY1 + EditorLayoutDimensions.DURATIONS_HEIGHT;
    this._durationStemLine.set(this.beatElement.attackLocalX, stemY1, stemY2);
    if (this.beat.baseDuration === NoteDuration.Half) {
      this._durationStemLine.y1 += EditorLayoutDimensions.DURATIONS_HEIGHT / 2;
    }

    if (this._durationFlagLines === undefined) {
      return;
    }
    let y = this._durationStemLine.y2;
    for (const flagLine of this._durationFlagLines) {
      const x1 = this.beatElement.attackLocalX;
      const flagWidth = this._boundingBox.width / 4;
      flagLine.set(x1, x1 + flagWidth, y);
      y -= EditorLayoutDimensions.DURATION_FLAG_HEIGHT * 2;
    }
  }

  private getDurationFlagCount(): number {
    if (this._durationFlagLines !== undefined) {
      return this._durationFlagLines.length;
    }

    const hasValidBeamGroup =
      this.beat.beamGroupId !== null &&
      this.beat.beamGroupId < this.beat.voiceBar.beamingGroups.length;
    if (!hasValidBeamGroup) {
      return 0;
    }

    return DURATION_TO_FLAG_COUNT[this.beat.baseDuration];
  }

  private getTopDurationDecorationY(): number | undefined {
    if (this._durationFlagLines !== undefined) {
      return this._durationFlagLines[this._durationFlagLines.length - 1]?.y;
    }

    const durationLevelCount = this.getDurationFlagCount();
    if (durationLevelCount === 0) {
      return undefined;
    }

    return (
      EditorLayoutDimensions.TUPLET_RECT_HEIGHT -
      EditorLayoutDimensions.DURATION_FLAG_HEIGHT -
      (durationLevelCount - 1) * EditorLayoutDimensions.DURATION_FLAG_HEIGHT * 2
    );
  }

  /**
   * Calculates the coordinates of the dots
   */
  private layoutDots(): void {
    if (this._dot1Circle === undefined) {
      return;
    }

    const newDot1X =
      this.beatElement.attackLocalX + EditorLayoutDimensions.DOT_DIAMETER * 2;

    let newDotY =
      EditorLayoutDimensions.DURATIONS_HEIGHT -
      EditorLayoutDimensions.DOT_DIAMETER / 2;
    const topDurationDecorationY = this.getTopDurationDecorationY();
    if (topDurationDecorationY !== undefined) {
      newDotY = topDurationDecorationY - EditorLayoutDimensions.DOT_DIAMETER;
    }
    this._dot1Circle.setCoords(newDot1X, newDotY);

    if (this._dot2Circle === undefined) {
      return;
    }
    this._dot2Circle.setCoords(
      newDot1X + EditorLayoutDimensions.DOT_DIAMETER,
      newDotY
    );
  }

  layout(): void {
    this._boundingBox.setCoords(this.beatElement.boundingBox.x, 0);
    this.layoutDuration();
    this.layoutDots();
  }

  update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  get stateHash(): string {
    const hashArr: string[] = [
      `${this.barLocalBoundingBox.x}` +
        `${this.barLocalBoundingBox.y}` +
        `${this.barLocalBoundingBox.width}` +
        `${this.barLocalBoundingBox.height}`,
    ];

    if (this._dot1Circle !== undefined) {
      hashArr.push(`${this._dot1Circle.centerX}`);
      hashArr.push(`${this._dot1Circle.centerY}`);
      hashArr.push(`${this._dot1Circle.diameter}`);
    }
    if (this._dot2Circle !== undefined) {
      hashArr.push(`${this._dot2Circle.centerX}`);
      hashArr.push(`${this._dot2Circle.centerY}`);
      hashArr.push(`${this._dot2Circle.diameter}`);
    }
    if (this._durationStemLine !== undefined) {
      hashArr.push(`${this._durationStemLine.x}`);
      hashArr.push(`${this._durationStemLine.y1}`);
      hashArr.push(`${this._durationStemLine.y2}`);
    }
    if (this._durationFlagLines !== undefined) {
      for (const line of this._durationFlagLines) {
        hashArr.push(`${line.x1}${line.x2}${line.y}`);
      }
    }

    return hashArr.join("");
  }

  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  public get durationStemLine(): VertLine | undefined {
    return this._durationStemLine;
  }

  public get durationStemLineBarLocal(): VertLine | undefined {
    if (this._durationStemLine === undefined) {
      return undefined;
    }

    const coords = this.barLocalCoords;
    return new VertLine(
      coords.x + this._durationStemLine.x,
      coords.y + this._durationStemLine.y1,
      coords.y + this._durationStemLine.y2
    );
  }

  public get durationFlagLines(): HorLine[] | undefined {
    return this._durationFlagLines;
  }

  public get durationFlagLinesBarLocal(): HorLine[] | undefined {
    if (this._durationFlagLines === undefined) {
      return undefined;
    }

    const coords = this.barLocalCoords;
    return this._durationFlagLines.map(
      (line) =>
        new HorLine(coords.x + line.x1, coords.x + line.x2, coords.y + line.y)
    );
  }

  public get dot1CircleBarLocal(): Circle | undefined {
    if (this._dot1Circle === undefined) {
      return undefined;
    }

    const coords = this.barLocalCoords;
    return new Circle(
      coords.x + this._dot1Circle.centerX,
      coords.y + this._dot1Circle.centerY,
      this._dot1Circle.diameter
    );
  }

  public get dot2CircleBarLocal(): Circle | undefined {
    if (this._dot2Circle === undefined) {
      return undefined;
    }

    const coords = this.barLocalCoords;
    return new Circle(
      coords.x + this._dot2Circle.centerX,
      coords.y + this._dot2Circle.centerY,
      this._dot2Circle.diameter
    );
  }

  /** Coords of this element in bar-local coordinates */
  public get barLocalCoords(): Point {
    return new Point(
      this.voiceBarRhythmElement.boundingBox.x + this._boundingBox.x,
      this.voiceBarRhythmElement.boundingBox.y + this._boundingBox.y
    );
  }

  /** Bounding box of this element in bar-local coordinates */
  public get barLocalBoundingBox(): Rect {
    return new Rect(
      this.barLocalCoords.x,
      this.barLocalCoords.y,
      this._boundingBox.width,
      this._boundingBox.height
    );
  }

  public get lineLocalCoords(): Point {
    return new Point(
      this.voiceBarRhythmElement.lineLocalCoords.x + this._boundingBox.x,
      this.voiceBarRhythmElement.lineLocalCoords.y + this._boundingBox.y
    );
  }

  public get lineLocalBoundingBox(): Rect {
    return new Rect(
      this.lineLocalCoords.x,
      this.lineLocalCoords.y,
      this._boundingBox.width,
      this._boundingBox.height
    );
  }

  public get globalCoords(): Point {
    return new Point(
      this.voiceBarRhythmElement.globalCoords.x + this._boundingBox.x,
      this.voiceBarRhythmElement.globalCoords.y + this._boundingBox.y
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

  public getStableIdentity(): string {
    return TabBeatRhythmElement.createStableIdentity(this.beat);
  }

  public refreshOwnedNotationElements(): NotationElement[] {
    return [this];
  }
}
