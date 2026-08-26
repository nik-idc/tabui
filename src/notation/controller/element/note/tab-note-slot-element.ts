import { GuitarNote, GuitarTechniqueType, VoiceNumber } from "../../../model";
import { Rect, Point, randomInt } from "../../../../shared";
import { TrackElement } from "../track-element";
import { GuitarTechniqueElement } from "../technique/guitar-technique/guitar-technique-element";
import { TechniqueElement } from "../technique/technique-element";
import { NoteElement } from "./note-element";
import { TabBeatElement } from "../beat/tab-beat-element";
import { NotationNode, NotationNodeType } from "../notation-element";
import type { BarElement } from "../bar/bar-element";
import type { TrackLineElement } from "../track/track-line-element";

/** Class that handles geometry & visually relevant info of a tab note slot. */
export class TabNoteSlotElement implements NoteElement {
  readonly nodeType = NotationNodeType.Element;

  // TODO: Remove dependence on beatElement - just beat is enough
  public static createStableIdentity(
    beatElement: TabBeatElement,
    stringNumber: number
  ): string {
    return `note-slot:${beatElement.beat.uuid}:${stringNumber}`;
  }

  /** Guitar note element's unique identifier */
  readonly uuid: number;
  /** Backing note for this slot. */
  note: GuitarNote | null;
  readonly stringNumber: number;
  /** Parent beat element */
  readonly beatElement: TabBeatElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  public get voiceNumber(): VoiceNumber {
    return this.beatElement.voiceNumber;
  }

  public get owningTrackLineElement(): TrackLineElement {
    return this.beatElement.owningTrackLineElement;
  }

  public get owningBarElement(): BarElement {
    return this.beatElement.barElement;
  }

  /** Array of technique elements */
  private _techniqueElements: TechniqueElement[];

  /** Bounding box of the main clickable area */
  private _boundingBox: Rect = new Rect();
  /** State of the note value at `build` */
  private _noteValueState: string = "";
  /** Rectangle of the note text rectangle (needed to cover the text background) */
  private _textRect: Rect = new Rect();
  /** Coordinates of the note text */
  private _textCoords: Point = new Point();
  /**
   * Class that handles geometry & visually relevant info of a guitar note
   * @param note Guitar note
   * @param beatElement Parent beat element
   */
  constructor(
    beatElement: TabBeatElement,
    stringNumber: number,
    note: GuitarNote | null
  ) {
    this.uuid = randomInt();
    this.note = note;
    this.stringNumber = stringNumber;
    this.beatElement = beatElement;
    this.trackElement = this.beatElement.trackElement;

    this._boundingBox = new Rect();
    this._techniqueElements = [];

    this.build();
  }

  /**
   * Fills the technique element array
   */
  public build(): void {
    this._noteValueState = `${this.noteText}${this.stringNumber}`;

    const prevTechniqueElements = new Map(
      this._techniqueElements.map((element) => [
        element.getStableIdentity(),
        element,
      ])
    );
    this._techniqueElements = [];
    for (const technique of this.note?.techniques ?? []) {
      const techniqueElement =
        prevTechniqueElements.get(
          GuitarTechniqueElement.createStableIdentity(technique)
        ) ?? new GuitarTechniqueElement(technique, this);
      techniqueElement.build();
      this._techniqueElements.push(techniqueElement);
    }
  }

  /**
   * Calculates the dimensions for the note element and it's children
   */
  public measure(): void {
    this._boundingBox.setDimensions(
      this.beatElement.boundingBox.width,
      this.trackElement.layoutDimensions.NOTE_RECT_HEIGHT
    );

    const textSize = this.trackElement.layoutDimensions.NOTE_TEXT_SIZE;
    const textWidth = Math.max(textSize, this.noteText.length * textSize * 0.6);
    this._textRect.setDimensions(textWidth, textSize);
  }

  /**
   * Calculates the coordinates for the note element and it's children
   */
  public layout(): void {
    const prevNoteElement = this.beatElement.getPrevNoteElement(this);
    const y = prevNoteElement?.boundingBox.bottom ?? 0;
    this._boundingBox.setCoords(0, y);

    this._textRect.setCoords(
      this.beatElement.attackLocalX - this._textRect.width / 2,
      this._boundingBox.height / 2 -
        this.trackElement.layoutDimensions.NOTE_TEXT_SIZE / 2
    );

    this._textCoords.set(
      this.beatElement.attackLocalX,
      this._textRect.y + this.trackElement.layoutDimensions.NOTE_TEXT_SIZE / 2
    );

    for (const techniqueElement of this._techniqueElements) {
      techniqueElement.layout();
    }
  }

  /**
   * Updates the guitar technique element fully
   */
  public update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  public setNote(note: GuitarNote | null): void {
    this.note = note;
  }

  public get noteText(): string {
    if (this.note === null || this.note.fret === null) {
      return "";
    }
    if (this.note.fret === -1) {
      return "x";
    }

    const fret = `${this.note.fret}`;
    return this.note.hasTechnique(GuitarTechniqueType.LetRing)
      ? `(${fret})`
      : fret;
  }

  public refreshOwnedNotationNodes(): NotationNode[] {
    return [
      this,
      ...this._techniqueElements.flatMap((technique) =>
        technique.refreshOwnedNotationNodes()
      ),
    ];
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return (
      `${this._noteValueState}` +
      `${this.barLocalBoundingBox.x}` +
      `${this.barLocalBoundingBox.y}` +
      `${this.barLocalBoundingBox.width}` +
      `${this.barLocalBoundingBox.height}` +
      `${this._textRect.x}` +
      `${this._textRect.y}` +
      `${this._textRect.width}` +
      `${this._textRect.height}` +
      `${this._textCoords.x}` +
      `${this._textCoords.y}`
    );
  }

  public getStableIdentity(): string {
    return TabNoteSlotElement.createStableIdentity(
      this.beatElement,
      this.stringNumber
    );
  }

  public get hasBackingNote(): boolean {
    return this.note !== null;
  }

  /** Main clickable-area bounding box */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** Coords of this element in bar-local coordinates */
  public get barLocalCoords(): Point {
    return new Point(
      this.beatElement.barLocalCoords.x + this._boundingBox.x,
      this.beatElement.barLocalCoords.y + this._boundingBox.y
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

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(
      this.beatElement.lineLocalCoords.x + this._boundingBox.x,
      this.beatElement.lineLocalCoords.y + this._boundingBox.y
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

  /** Rectangle of the note text rectangle in bar-local coords */
  public get textRectBarLocal(): Rect {
    return new Rect(
      this.barLocalCoords.x + this.textRect.x,
      this.barLocalCoords.y + this.textRect.y,
      this.textRect.width,
      this.textRect.height
    );
  }

  /** Rectangle of the note text rectangle in track line-local coords */
  public get textRectLineLocal(): Rect {
    return new Rect(
      this.lineLocalCoords.x + this.textRect.x,
      this.lineLocalCoords.y + this.textRect.y,
      this.textRect.width,
      this.textRect.height
    );
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

  /** Bar-local coordinates of the note text */
  public get textCoordsBarLocal(): Point {
    return new Point(
      this.barLocalCoords.x + this.textCoords.x,
      this.barLocalCoords.y + this.textCoords.y
    );
  }

  /** Track line-local coordinates of the note text */
  public get textCoordsLineLocal(): Point {
    return new Point(
      this.lineLocalCoords.x + this.textCoords.x,
      this.lineLocalCoords.y + this.textCoords.y
    );
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
    const size = this.trackElement.layoutDimensions.NOTE_TEXT_SIZE * 1.5;
    return new Rect(
      this.globalCoords.x + this.textCoords.x - size / 2,
      this.globalCoords.y + this.textCoords.y - size / 2,
      size,
      size
    );
  }

  /** Global coords of the note element */
  public get globalCoords(): Point {
    return new Point(
      this.beatElement.barElement.globalCoords.x + this.barLocalCoords.x,
      this.beatElement.barElement.globalCoords.y + this.barLocalCoords.y
    );
  }
}
