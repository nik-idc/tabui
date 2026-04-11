import { GuitarNote } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
import { TrackElement } from "@/notation/controller/element/track-element";
import { GuitarTechniqueElement } from "../technique/guitar-technique/guitar-technique-element";
import { TechniqueElement } from "../technique/technique-element";
import { NoteElement } from "./note-element";
import { TabBeatElement } from "../beat/tab-beat-element";

/**
 * Class that handles geometry & visually relevant info of a tab note
 */
export class TabNoteElement implements NoteElement {
  /** Guitar note element's unique identifier */
  readonly uuid: number;
  /** The note */
  readonly note: GuitarNote;
  /** Parent beat element */
  readonly beatElement: TabBeatElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  /** Array of technique elements */
  private _techniqueElements: TechniqueElement[];

  /** Bounding box of the main clickable area */
  private _boundingBox: Rect = new Rect();
  /** Rectangle of the note text rectangle (needed to cover the text background) */
  private _textRect: Rect = new Rect();
  /** Coordinates of the note text */
  private _textCoords: Point = new Point();
  /** String encoding the state of this element */
  private _stateHash: string;

  /**
   * Class that handles geometry & visually relevant info of a guitar note
   * @param note Guitar note
   * @param beatElement Parent beat element
   */
  constructor(note: GuitarNote, beatElement: TabBeatElement) {
    this.uuid = randomInt();
    this.note = note;
    this.beatElement = beatElement;
    this.trackElement = this.beatElement.trackElement;

    this._boundingBox = new Rect();
    this._techniqueElements = [];

    this._stateHash = "";

    this.build();

    this.trackElement.registerElement(this);
  }

  /**
   * Fills the technique element array
   */
  public build(): void {
    this._techniqueElements = [];
    for (const technique of this.note.techniques) {
      const techniqueElement = new GuitarTechniqueElement(technique, this);
      this._techniqueElements.push(techniqueElement);
    }
  }

  /**
   * Calculates the dimensions for the note element and it's children
   */
  public measure(): void {
    this._boundingBox.setDimensions(
      this.beatElement.boundingBox.width,
      EditorLayoutDimensions.NOTE_RECT_HEIGHT
    );

    this._textRect.setDimensions(
      EditorLayoutDimensions.NOTE_TEXT_SIZE,
      EditorLayoutDimensions.NOTE_TEXT_SIZE
    );
  }

  /**
   * Calculates the state hash of the element
   * */
  private calcStateHash(): void {
    this._stateHash =
      `${this.note.fret}` +
      `${this.globalBoundingBox.x}` +
      `${this.globalBoundingBox.y}` +
      `${this.globalBoundingBox.width}` +
      `${this.globalBoundingBox.height}` +
      `${this._textRect.x}` +
      `${this._textRect.y}` +
      `${this._textRect.width}` +
      `${this._textRect.height}` +
      `${this._textCoords.x}` +
      `${this._textCoords.y}`;

    // checkIfDirty removed - now handled by checkAllDirty() in TrackElement
    // this.trackElement.checkIfDirty(this);
  }

  /**
   * Calculates the coordinates for the note element and it's children
   */
  public layout(): void {
    const prevNoteElement = this.beatElement.getPrevNoteElement(this);
    const y = prevNoteElement?.boundingBox.bottom ?? 0;
    this._boundingBox.setCoords(0, y);

    this._textRect.setCoords(
      this._boundingBox.width / 2 - EditorLayoutDimensions.NOTE_TEXT_SIZE / 2,
      this._boundingBox.height / 2 - EditorLayoutDimensions.NOTE_TEXT_SIZE / 2
    );

    this._textCoords.set(
      this._textRect.x + EditorLayoutDimensions.NOTE_TEXT_SIZE / 2,
      this._textRect.y + EditorLayoutDimensions.NOTE_TEXT_SIZE / 2
    );

    for (const techniqueElement of this._techniqueElements) {
      techniqueElement.layout();
    }

    // Calculating state hash at the last step of
    // element's update process - layout
    // this.calcStateHash();
  }

  /**
   * Updates the guitar technique element fully
   */
  public update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  /**
   * Scales the guitar note element & all it's children horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    this._boundingBox.x *= scale;
    this._boundingBox.width *= scale;

    this._textRect.x =
      this._boundingBox.x +
      this._boundingBox.width / 2 -
      EditorLayoutDimensions.NOTE_TEXT_SIZE / 2;
    // this._textRect.x *= scale;
    // this._textRect.width *= scale;
    this._textCoords.x *= scale;

    for (const techniqueElement of this._techniqueElements) {
      techniqueElement.scaleHorBy(scale);
    }

    this.calcStateHash();
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this._stateHash;
  }

  public getModelUUID(): number {
    return this.note.uuid;
  }

  /** Main clickable-area bounding box */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** Main clickable-area bounding box in global coordinates */
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

  /** Rectangle of the note text rectangle */
  public get textRect(): Rect {
    return this._textRect;
  }

  /** Rectangle of the note text rectangle in global coords */
  public get textRectGlobal(): Rect {
    return new Rect(
      this.globalCoords.x + this.textRect.x,
      this.globalCoords.y + this.textRect.y,
      this.textRect.width,
      this.textRect.height
    );
  }

  /** Coordinates of the note text */
  public get textCoords(): Point {
    return this._textCoords;
  }

  /** Global coordinates of the note text */
  public get textCoordsGlobal(): Point {
    return new Point(
      this.globalCoords.x + this.textCoords.x,
      this.globalCoords.y + this.textCoords.y
    );
  }

  /** Array of technique elements */
  public get techniqueElements(): TechniqueElement[] {
    return this._techniqueElements;
  }

  /** Note selection rectangle */
  public get selectionRect(): Rect {
    const padding = 2;
    return new Rect(
      this.globalCoords.x + this.textRect.x - padding,
      this.globalCoords.y + this.textRect.y - padding,
      this.textRect.width + padding * 2,
      this.textRect.height + padding * 2
    );
  }

  /** Global coords of the note element */
  public get globalCoords(): Point {
    return new Point(
      this.beatElement.globalCoords.x + this._boundingBox.x,
      this.beatElement.globalCoords.y + this._boundingBox.y
    );
  }
}
