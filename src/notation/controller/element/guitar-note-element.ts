import { GuitarNote } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { TabLayoutDimensions } from "../tab-controller-dim";
import { GuitarTechniqueElement } from "./technique/guitar-technique/guitar-technique-element";
import { BeatElement } from "./beat-element";
import { BeatNotesElement } from "./beat-notes-element";
import { NoteElement } from "./note-element";

/**
 * Class that handles geometry & visually relevant info of a guitar note
 */
export class GuitarNoteElement implements NoteElement {
  /** Guitar note element's unique identifier */
  readonly uuid: number;
  /** The note */
  readonly note: GuitarNote;
  /** Parent beat element */
  readonly beatNotesElement: BeatNotesElement;

  /** True if selected, false otherwise */
  private _selected: boolean = false;
  /** Rectangle of the main clickable-area rectangle */
  private _rect: Rect = new Rect();
  /** Rectangle of the note text rectangle */
  private _textRect: Rect = new Rect();
  /** Rectangle of the note text rectangle */
  private _textCoords: Point = new Point();
  /** Array of guitar technique element */
  private _guitarTechniqueElements: GuitarTechniqueElement[];

  /**
   * Class that handles geometry & visually relevant info of a guitar note
   * @param note Guitar note
   * @param beatNotesElement Parent beat-notes element
   */
  constructor(note: GuitarNote, beatNotesElement: BeatNotesElement) {
    this.uuid = randomInt();
    this.note = note;
    this.beatNotesElement = beatNotesElement;

    this._rect = new Rect(
      0,
      TabLayoutDimensions.NOTE_RECT_HEIGHT * (this.note.stringNum - 1),
      this.beatNotesElement.rect.width,
      TabLayoutDimensions.NOTE_RECT_HEIGHT
    );
    this._guitarTechniqueElements = [];

    this.calc();
  }

  /**
   * Calculate dimensions of the note element
   */
  public calc(): void {
    this._textRect.x =
      this._rect.x +
      this._rect.width / 2 -
      TabLayoutDimensions.NOTE_TEXT_SIZE / 2;
    this._textRect.y =
      this._rect.y +
      this._rect.height / 2 -
      TabLayoutDimensions.NOTE_TEXT_SIZE / 2;
    this._textRect.width = TabLayoutDimensions.NOTE_TEXT_SIZE;
    this._textRect.height = TabLayoutDimensions.NOTE_TEXT_SIZE;

    this._textCoords.x =
      this._textRect.x + TabLayoutDimensions.NOTE_TEXT_SIZE / 2;
    this._textCoords.y =
      this._textRect.y + TabLayoutDimensions.NOTE_TEXT_SIZE / 2;

    this._guitarTechniqueElements = [];
    for (const technique of this.note.techniques) {
      const techniqueElement = new GuitarTechniqueElement(technique, this);
      this._guitarTechniqueElements.push(techniqueElement);
    }
  }

  /**
   * Scales the guitar note element & all it's children horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    this._rect.x *= scale;
    this._rect.width *= scale;

    this._textRect.x =
      this._rect.x +
      this._rect.width / 2 -
      TabLayoutDimensions.NOTE_TEXT_SIZE / 2;
    // this._textRect.x *= scale;
    // this._textRect.width *= scale;
    this._textCoords.x *= scale;

    for (const techniqueElement of this._guitarTechniqueElements) {
      techniqueElement.scaleHorBy(scale);
    }
  }

  /** Selected setter */
  public set selected(newSelectedValue: boolean) {
    this._selected = newSelectedValue;
  }
  /** Selected getter */
  public get selected(): boolean {
    return this._selected;
  }

  /** Rectangle of the main clickable-area rectangle */
  public get rect(): Rect {
    return this._rect;
  }

  /** Rectangle of the note text rectangle */
  public get textRect(): Rect {
    return this._textRect;
  }

  /** Coordinates of the note text */
  public get textCoords(): Point {
    return this._textCoords;
  }

  /** Array of guitar technique element */
  public get guitarTechniqueElements(): GuitarTechniqueElement[] {
    return this._guitarTechniqueElements;
  }

  /** Global coords of the note element */
  public get globalCoords(): Point {
    return new Point(
      this.beatNotesElement.globalCoords.x + this._rect.x,
      this.beatNotesElement.globalCoords.y + this._rect.y
    );
  }
}
