import {
  Beat,
  DURATION_TO_FLAG_COUNT,
  GuitarNote,
  NoteDuration,
} from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
import { HorLine, VertLine } from "@/shared/rendering/geometry/line";
import { Circle } from "@/shared/rendering/geometry/circle";
import { TrackElement } from "@/notation/controller/element/track-element";
import { TabNoteElement } from "../note/tab-note-element";
import { BeatElement, getBeatWidth } from "./beat-element";
import { BarElement } from "../bar/bar-element";
import { NoteElement } from "../note/note-element";
import { NotationElement } from "../notation-element";

/**
 * Class that handles geometry & visually relevant info of a beat
 */
export class TabBeatElement implements BeatElement {
  public static createStableIdentity(
    barElement: BarElement,
    beat: Beat
  ): string {
    const trackLineStableIdentity =
      barElement.notationStyleLineElement.staffLineElement.trackLineElement.getStableIdentity();
    return `beat:${trackLineStableIdentity}:${beat.uuid}`;
  }

  /** Beat element's unique identifier */
  readonly uuid: number;
  /** The beat */
  readonly beat: Beat;
  /** Parent bar element */
  readonly barElement: BarElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  /** Note elements */
  private _noteElements: TabNoteElement[];

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

  /**
   * Class that handles geometry & visually relevant info of a beat
   * @param beat Beat
   * @param barElement Parent bar element
   */
  constructor(beat: Beat, barElement: BarElement) {
    this.uuid = randomInt();
    this.beat = beat;
    this.barElement = barElement;
    this.trackElement = this.barElement.trackElement;

    this._noteElements = [];

    const width = getBeatWidth(this.beat, this.beat.bar);
    this._boundingBox = new Rect(0, 0, width, 0);

    this.build();

    this.trackElement.registerElement(this);
  }

  /**
   * Initializes tab beat element state:
   * - Fills the note elements array
   * - Sets duration stem & flags
   * - Sets dot circles
   */
  public build(): void {
    this.trackElement.registerElement(this);

    const prevNoteElements = this.trackElement.useElementReuse
      ? new Map(
          this._noteElements.map((element) => [
            element.getStableIdentity(),
            element,
          ])
        )
      : new Map<string, TabNoteElement>();
    this._noteElements = [];
    for (const note of this.beat.notes) {
      const existingNoteElement = prevNoteElements.get(
        TabNoteElement.createStableIdentity(this, note as GuitarNote)
      );
      if (existingNoteElement !== undefined) {
        existingNoteElement.build();
        this._noteElements.push(existingNoteElement);
        continue;
      }

      this._noteElements.push(new TabNoteElement(note as GuitarNote, this));
    }

    if (this.beat.bar.staff.showClassicNotation) {
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
      this.beat.beamGroupId < this.beat.bar.beamingGroups.length;

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

  /**
   * Calculates the dimensions of the tab beat element & it's children
   */
  public measure(): void {
    const width = getBeatWidth(this.beat, this.beat.bar);
    this._boundingBox.width = width;

    for (const noteElement of this._noteElements) {
      noteElement.measure();
    }

    const notesHeight =
      this._noteElements.length * EditorLayoutDimensions.NOTE_RECT_HEIGHT;
    const height = notesHeight + EditorLayoutDimensions.DURATIONS_HEIGHT;
    this._boundingBox.setDimensions(width, height);

    if (this._dot1Circle !== undefined) {
      this._dot1Circle.diameter = EditorLayoutDimensions.DOT_DIAMETER;
    }
    if (this._dot2Circle !== undefined) {
      this._dot2Circle.diameter = EditorLayoutDimensions.DOT_DIAMETER;
    }
  }

  /**
   * Calculates the rectangles coordinates
   */
  private layoutRect(): void {
    const prevBeatElement = this.barElement.getPrevBeatElement(this);
    const x =
      prevBeatElement?.boundingBox.right ?? this.barElement.startGap.right;

    this._boundingBox.setCoords(x, 0);
  }

  /**
   * Calculates the coordinates of the duration stem & flags
   */
  private layoutDuration(): void {
    if (this._durationStemLine === undefined) {
      return;
    }
    const stemY1 =
      this._boundingBox.height - EditorLayoutDimensions.DURATIONS_HEIGHT;
    const stemY2 = stemY1 + EditorLayoutDimensions.DURATIONS_HEIGHT;
    this._durationStemLine.set(this._boundingBox.width / 2, stemY1, stemY2);
    if (this.beat.baseDuration === NoteDuration.Half) {
      this._durationStemLine.y1 += EditorLayoutDimensions.DURATIONS_HEIGHT / 2;
    }

    if (this._durationFlagLines === undefined) {
      return;
    }
    let y = this._durationStemLine.y2;
    for (const flagLine of this._durationFlagLines) {
      const x1 = this._boundingBox.width / 2;
      flagLine.set(x1, x1 + this._boundingBox.width / 4, y);
      y -= EditorLayoutDimensions.DURATION_FLAG_HEIGHT * 2;
    }
  }

  private getDurationLevelCount(): number {
    if (this._durationFlagLines !== undefined) {
      return this._durationFlagLines.length;
    }

    const hasValidBeamGroup =
      this.beat.beamGroupId !== null &&
      this.beat.beamGroupId < this.beat.bar.beamingGroups.length;
    if (!hasValidBeamGroup) {
      return 0;
    }

    return DURATION_TO_FLAG_COUNT[this.beat.baseDuration];
  }

  private getTopDurationDecorationY(): number | undefined {
    if (this._durationFlagLines !== undefined) {
      return this._durationFlagLines[this._durationFlagLines.length - 1]?.y;
    }

    const durationLevelCount = this.getDurationLevelCount();
    if (durationLevelCount === 0) {
      return undefined;
    }

    return (
      this.barElement.boundingBox.height -
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
      this._boundingBox.width / 2 + EditorLayoutDimensions.DOT_DIAMETER * 2;
    let newDotY =
      this._boundingBox.height - EditorLayoutDimensions.DOT_DIAMETER / 2;
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

  /**
   * Calculates all note element's & their childrens' coordinates
   */
  private layoutNotes(): void {
    for (const noteElement of this._noteElements) {
      noteElement.layout();
    }
  }

  private buildStateHash(): string {
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

  /**
   * Calculates the coordinates of tab beat element & it's child note elements
   */
  public layout(): void {
    this.layoutRect();
    this.layoutDuration();
    this.layoutDots();

    this.layoutNotes();
  }

  /**
   * Updates the element fully
   */
  public update(): void {
    this.build();

    this.measure();
    this.layout();
  }

  public refreshOwnedNotationElements(): NotationElement[] {
    const elements: NotationElement[] = [this];

    for (const noteElement of this._noteElements) {
      elements.push(...noteElement.refreshOwnedNotationElements());
    }

    return elements;
  }

  /**
   * Scales beat element & all it's children horizontally
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    this._boundingBox.x *= scale;
    this._boundingBox.width *= scale;

    if (this._durationStemLine !== undefined) {
      this._durationStemLine.x *= scale;
    }
    if (this._durationFlagLines !== undefined) {
      for (const line of this._durationFlagLines) {
        line.x1 *= scale;
        line.x2 *= scale;
      }
    }

    if (this._dot1Circle !== undefined) {
      this._dot1Circle.centerX =
        this._boundingBox.width / 2 + EditorLayoutDimensions.DOT_DIAMETER; //HERE!!~!
    }
    if (this._dot1Circle !== undefined && this._dot2Circle !== undefined) {
      this._dot2Circle.centerX =
        this._dot1Circle.right + EditorLayoutDimensions.DOT_DIAMETER;
    }

    for (const noteElement of this._noteElements) {
      noteElement.scaleHorBy(scale);
    }
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this.buildStateHash();
  }

  public getStableIdentity(): string {
    return TabBeatElement.createStableIdentity(this.barElement, this.beat);
  }

  /**
   * Gets next note element
   * @param noteElement Note element
   * @returns Next note element or null
   */
  public getNextNoteElement(
    noteElement: TabNoteElement
  ): TabNoteElement | null {
    const noteIndex = this._noteElements.indexOf(noteElement);
    const nextNote = this._noteElements[noteIndex + 1];
    return nextNote ?? null;
  }

  /**
   * Gets prev note element
   * @param noteElement Note element
   * @returns Prev note element or null
   */
  public getPrevNoteElement(
    noteElement: TabNoteElement
  ): TabNoteElement | null {
    const noteIndex = this._noteElements.indexOf(noteElement);
    const prevNote = this._noteElements[noteIndex - 1];
    return prevNote ?? null;
  }

  /** Beat's note element */
  public get noteElements(): TabNoteElement[] {
    return this._noteElements;
  }

  /** This beat's layout bounding box */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** Coords of this element in bar-local coordinates */
  public get barLocalCoords(): Point {
    return new Point(this._boundingBox.x, this._boundingBox.y);
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

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(
      this.barElement.lineLocalCoords.x + this.barLocalCoords.x,
      this.barElement.lineLocalCoords.y + this.barLocalCoords.y
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

  /** This beat's layout bounding box in global coordinates */
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

  /** Duration stem vertical line */
  public get durationStemLine(): VertLine | undefined {
    return this._durationStemLine;
  }

  /** Duration stem vertical line in bar-local coords */
  public get durationStemLineBarLocal(): VertLine | undefined {
    if (this._durationStemLine === undefined) {
      return undefined;
    }

    return new VertLine(
      this.barLocalCoords.x + this._durationStemLine.x,
      this.barLocalCoords.y + this._durationStemLine.y1,
      this.barLocalCoords.y + this._durationStemLine.y2
    );
  }

  /** Duration stem vertical line in track-line-local coords */
  public get durationStemLineLineLocal(): VertLine | undefined {
    if (this._durationStemLine === undefined) {
      return undefined;
    }

    return new VertLine(
      this.lineLocalCoords.x + this._durationStemLine.x,
      this.lineLocalCoords.y + this._durationStemLine.y1,
      this.lineLocalCoords.y + this._durationStemLine.y2
    );
  }

  /** Duration stem vertical line in global coords */
  public get durationStemLineGlobal(): VertLine | undefined {
    if (this._durationStemLine === undefined) {
      return undefined;
    }

    return new VertLine(
      this.globalCoords.x + this._durationStemLine.x,
      this.globalCoords.y + this._durationStemLine.y1,
      this.globalCoords.y + this._durationStemLine.y2
    );
  }

  /** Duration flags horizontal lines (for durations like 1/8, 1/16 etc) */
  public get durationFlagLines(): HorLine[] | undefined {
    return this._durationFlagLines;
  }

  /** Duration flags horizontal lines (in bar-local coords) */
  public get durationFlagLinesBarLocal(): HorLine[] | undefined {
    if (this._durationFlagLines === undefined) {
      return undefined;
    }

    const result = [];
    for (const flagLine of this._durationFlagLines) {
      result.push(
        new HorLine(
          this.barLocalCoords.x + flagLine.x1,
          this.barLocalCoords.x + flagLine.x2,
          this.barLocalCoords.y + flagLine.y
        )
      );
    }
    return result;
  }

  /** Duration flags horizontal lines (in track-line-local coords) */
  public get durationFlagLinesLineLocal(): HorLine[] | undefined {
    if (this._durationFlagLines === undefined) {
      return undefined;
    }

    const result = [];
    for (const flagLine of this._durationFlagLines) {
      result.push(
        new HorLine(
          this.lineLocalCoords.x + flagLine.x1,
          this.lineLocalCoords.x + flagLine.x2,
          this.lineLocalCoords.y + flagLine.y
        )
      );
    }
    return result;
  }

  /** Duration flags horizontal lines (for durations like 1/8, 1/16 etc) */
  public get durationFlagLinesGlobal(): HorLine[] | undefined {
    if (this._durationFlagLines === undefined) {
      return undefined;
    }

    const result = [];
    for (const flagLine of this._durationFlagLines) {
      result.push(
        new HorLine(
          this.globalCoords.x + flagLine.x1,
          this.globalCoords.x + flagLine.x2,
          this.globalCoords.y + flagLine.y
        )
      );
    }
    return result;
  }

  /** This beat's first dot circle */
  public get dot1Circle(): Circle | undefined {
    return this._dot1Circle;
  }

  /** This beat's first dot circle in bar-local coords */
  public get dot1CircleBarLocal(): Circle | undefined {
    if (this._dot1Circle === undefined) {
      return undefined;
    }

    return new Circle(
      this.barLocalCoords.x + this._dot1Circle.centerX,
      this.barLocalCoords.y + this._dot1Circle.centerY,
      this._dot1Circle.diameter
    );
  }

  /** This beat's first dot circle in track-line-local coords */
  public get dot1CircleLineLocal(): Circle | undefined {
    if (this._dot1Circle === undefined) {
      return undefined;
    }

    return new Circle(
      this.lineLocalCoords.x + this._dot1Circle.centerX,
      this.lineLocalCoords.y + this._dot1Circle.centerY,
      this._dot1Circle.diameter
    );
  }

  /** This beat's first dot circle in global coords */
  public get dot1CircleGlobal(): Circle | undefined {
    if (this._dot1Circle === undefined) {
      return undefined;
    }

    return new Circle(
      this.globalCoords.x + this._dot1Circle.centerX,
      this.globalCoords.y + this._dot1Circle.centerY,
      this._dot1Circle.diameter
    );
  }

  /** This beat's second dot circle */
  public get dot2Circle(): Circle | undefined {
    return this._dot2Circle;
  }

  /** This beat's second dot circle in bar-local coords */
  public get dot2CircleBarLocal(): Circle | undefined {
    if (this._dot2Circle === undefined) {
      return undefined;
    }

    return new Circle(
      this.barLocalCoords.x + this._dot2Circle.centerX,
      this.barLocalCoords.y + this._dot2Circle.centerY,
      this._dot2Circle.diameter
    );
  }

  /** This beat's second dot circle in track-line-local coords */
  public get dot2CircleLineLocal(): Circle | undefined {
    if (this._dot2Circle === undefined) {
      return undefined;
    }

    return new Circle(
      this.lineLocalCoords.x + this._dot2Circle.centerX,
      this.lineLocalCoords.y + this._dot2Circle.centerY,
      this._dot2Circle.diameter
    );
  }

  /** This beat's second dot circle in global coords */
  public get dot2CircleGlobal(): Circle | undefined {
    if (this._dot2Circle === undefined) {
      return undefined;
    }

    return new Circle(
      this.globalCoords.x + this._dot2Circle.centerX,
      this.globalCoords.y + this._dot2Circle.centerY,
      this._dot2Circle.diameter
    );
  }

  /** Global coords of the tab beat element */
  public get globalCoords(): Point {
    return new Point(
      this.barElement.globalCoords.x + this.barLocalCoords.x,
      this.barElement.globalCoords.y + this.barLocalCoords.y
    );
  }
}
