import { Rect } from "../shapes/rect";
import { Point } from "../shapes/point";
import { GuitarNote } from "./../../models/guitar-note";
import { TabWindowDim } from "../tab-window-dim";
import { GuitarEffectElement } from "./effects/guitar-effect-element";

/**
 * Class that handles drawing note element in the tab
 */
export class NoteElement {
  /**
   * Tab window dimensions
   */
  readonly dim: TabWindowDim;
  /**
   * The note
   */
  readonly note: GuitarNote;
  /**
   * Rectangle of the main clickable-area rectangle
   */
  readonly rect: Rect = new Rect();
  /**
   * Rectangle of the note text rectangle
   */
  readonly textRect: Rect = new Rect();
  /**
   * Rectangle of the note text rectangle
   */
  readonly textCoords: Point = new Point();
  /**
   * Array of guitar effect elements
   */
  private _guitarEffectElements: GuitarEffectElement[];

  /**
   * Class that handles drawing note element in the tab
   * @param dim Tab window dimensions
   * @param width Width of the beat element
   * @param note Note
   */
  constructor(dim: TabWindowDim, width: number, note: GuitarNote) {
    this.dim = dim;
    this.note = note;
    this.rect = new Rect(
      0,
      this.dim.noteRectHeight * (this.note.stringNum - 1),
      width,
      this.dim.noteRectHeight
    );

    this.calc();
  }

  /**
   * Calculate dimensions of the note element
   */
  public calc(): void {
    this.textRect.x =
      this.rect.x + this.rect.width / 2 - this.dim.noteTextSize / 2;
    this.textRect.y =
      this.rect.y + this.rect.height / 2 - this.dim.noteTextSize / 2;
    this.textRect.width = this.dim.noteTextSize;
    this.textRect.height = this.dim.noteTextSize;

    this.textCoords.x = this.textRect.x + this.dim.noteTextSize / 2;
    this.textCoords.y = this.textRect.y + this.dim.noteTextSize / 2;

    this._guitarEffectElements = [];
    for (const effect of this.note.effects) {
      this._guitarEffectElements.push(
        new GuitarEffectElement(
          effect,
          this.note.stringNum,
          this.rect,
          this.dim
        )
      );
    }
  }

  public get guitarEffectElements(): GuitarEffectElement[] {
    return this._guitarEffectElements;
  }
}
