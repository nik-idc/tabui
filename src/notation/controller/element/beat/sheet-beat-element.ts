import { Beat, Guitar, GuitarTechnique } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { TabLayoutDimensions } from "@/notation/controller/tab-layout-dimensions";
import { TrackElement } from "@/notation/controller/element/track-element";
import { GuitarTechniqueLabelElement } from "../technique/guitar-technique/guitar-technique-label-element";
import { TECHNIQUE_TYPE_TO_LABEL } from "../technique/guitar-technique/guitar-technique-element-lists";
import { TechniqueLabelElement } from "../technique/technique-label-element";
import { NoteElement } from "../note/note-element";
import { Circle } from "@/shared/rendering/geometry/circle";
import { VertLine, HorLine } from "@/shared/rendering/geometry/line";
import { BeatElement } from "./beat-element";
import { BarElement } from "../bar/bar-element";

// TO BE IMPLEMENTED
// TO BE IMPLEMENTED
// TO BE IMPLEMENTED
// TO BE IMPLEMENTED

/**
 * Class that handles geometry & visually relevant info of a beat
 */
export class SheetBeatElement implements BeatElement {
  /** Beat element's unique identifier */
  readonly uuid: number;
  /** The beat */
  readonly beat: Beat;
  /** Parent beat element */
  readonly barElement: BarElement;
  /** Reference to track element */
  readonly trackElement: TrackElement;

  /** Note elements */
  private _noteElements: NoteElement[];
  /** Technique label elements */
  private _techniqueLabelElements: TechniqueLabelElement[];

  /** This beat's rect */
  private _rect: Rect;
  /** This beat's duration rect */
  private _durationRect: Rect;
  /** Duration stem vertical line */
  private _durationStemLine?: VertLine;
  /** Duration flags horizontal lines (for durations like 1/8, 1/16 etc) */
  private _durationFlagLines?: HorLine[];
  /** This beat's dot rect */
  private _dot1Circle: Circle;
  /** This beat's dot rect */
  private _dot2Circle: Circle;

  /**
   * Class that handles geometry & visually relevant info of a beat
   * @param beat Beat
   * @param beatElement Parent bar element
   */
  constructor(beat: Beat, barElement: BarElement) {
    this.uuid = randomInt();
    this.beat = beat;
    this.barElement = barElement;
    this.trackElement = barElement.trackElement;

    this._noteElements = [];
    this._techniqueLabelElements = [];

    this._rect = new Rect();
    this._durationRect = new Rect();
    this._dot1Circle = new Circle();
    this._dot2Circle = new Circle();
  }

  public build(): void {}

  public measure(): void {}

  public layout(): void {}

  /**
   * Calculates the sheet beat element
   */
  public calc(): void {}

  /**
   * Scales the element & all it's children horizontally
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {}

  public get noteElements(): NoteElement[] {
    return this._noteElements;
  }

  public get techniqueLabelElements(): TechniqueLabelElement[] {
    return this._techniqueLabelElements;
  }

  /** This beat's rectangle */
  public get rect(): Rect {
    return this._rect;
  }

  public getModelUUID(): number {
    return this.beat.uuid;
  }

  public get durationRect(): Rect {
    return this._durationRect;
  }

  public get durationStemLine(): VertLine | undefined {
    return this._durationStemLine;
  }

  public get durationFlagLines(): HorLine[] | undefined {
    return this._durationFlagLines;
  }

  public get dot1Circle(): Circle {
    return this._dot1Circle;
  }

  public get dot2Circle(): Circle {
    return this._dot2Circle;
  }

  public get globalCoords(): Point {
    return new Point(
      this.barElement.globalCoords.x + this._rect.x,
      this.barElement.globalCoords.y + this._rect.y
    );
  }

  public get globalRect(): Rect {
    return new Rect(
      this.globalCoords.x,
      this.globalCoords.y,
      this._rect.width,
      this._rect.height
    );
  }

  public get stateHash(): string {
    return this.uuid.toString();
  }

  public update(): void {}

  public getNextNoteElement(noteElement: NoteElement): NoteElement | null {
    return null;
  }

  public getPrevNoteElement(noteElement: NoteElement): NoteElement | null {
    return null;
  }
}
