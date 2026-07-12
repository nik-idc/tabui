import {
  Beat,
  Guitar,
  GuitarTechnique,
  TECHNIQUE_TYPE_TO_LABEL,
} from "../../../model";
import { Rect, Point, randomInt } from "../../../../shared";
import { EditorLayoutDimensions } from "../../editor-layout-dimensions";
import { TrackElement } from "../track-element";
import { GuitarTechniqueLabelElement } from "../technique/guitar-technique/guitar-technique-label-element";
import { TechniqueLabelElement } from "../technique/technique-label-element";
import { NoteElement } from "../note/note-element";
import { Circle } from "../../../../shared/rendering/geometry/circle";
import { VertLine, HorLine } from "../../../../shared/rendering/geometry/line";
import { BeatElement } from "./beat-element";
import { BarElement } from "../bar/bar-element";
import { NotationElement } from "../notation-element";
import { VoiceBarElement } from "../bar/voice-bar-element";
import type { TrackLineElement } from "../track/track-line-element";

/**
 * Class that handles geometry & visually relevant info of a beat
 */
export class SheetBeatElement implements BeatElement {
  public static createStableIdentity(
    voiceBarElement: VoiceBarElement,
    beat: Beat
  ): string {
    const trackLineStableIdentity =
      voiceBarElement.barElement.notationStyleLineElement.staffLineElement.trackLineElement.getStableIdentity();
    return `beat:${trackLineStableIdentity}:${beat.uuid}`;
  }

  /** Beat element's unique identifier */
  readonly uuid: number;
  /** The beat */
  readonly beat: Beat;
  /** Parent beat element */
  readonly voiceBarElement: VoiceBarElement;
  /** Reference to track element */
  readonly trackElement: TrackElement;
  readonly voiceNumber = null;

  public get owningTrackLineElement(): TrackLineElement {
    return this.barElement.owningTrackLineElement;
  }

  public get owningBarElement(): BarElement {
    return this.barElement;
  }

  /** Note elements */
  private _noteElements: NoteElement[];
  /** Technique label elements */
  private _techniqueLabelElements: TechniqueLabelElement[];

  /** This beat's rect */
  private _boundingBox: Rect;
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
  constructor(beat: Beat, voiceBarElement: VoiceBarElement) {
    this.uuid = randomInt();
    this.beat = beat;
    this.voiceBarElement = voiceBarElement;
    this.trackElement = voiceBarElement.trackElement;

    this._noteElements = [];
    this._techniqueLabelElements = [];

    this._boundingBox = new Rect();
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

  public get noteElements(): NoteElement[] {
    return this._noteElements;
  }

  public get techniqueLabelElements(): TechniqueLabelElement[] {
    return this._techniqueLabelElements;
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
      this.voiceBarElement.lineLocalCoords.x + this.barLocalCoords.x,
      this.voiceBarElement.lineLocalCoords.y + this.barLocalCoords.y
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

  public getStableIdentity(): string {
    return SheetBeatElement.createStableIdentity(
      this.voiceBarElement,
      this.beat
    );
  }

  public get barElement(): BarElement {
    return this.voiceBarElement.barElement;
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
      this.voiceBarElement.globalCoords.x + this.barLocalCoords.x,
      this.voiceBarElement.globalCoords.y + this.barLocalCoords.y
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

  public get stateHash(): string {
    return this.uuid.toString();
  }

  public update(): void {}

  public refreshOwnedNotationElements(): NotationElement[] {
    return [this];
  }

  public getNextNoteElement(noteElement: NoteElement): NoteElement | null {
    return null;
  }

  public getPrevNoteElement(noteElement: NoteElement): NoteElement | null {
    return null;
  }
}
