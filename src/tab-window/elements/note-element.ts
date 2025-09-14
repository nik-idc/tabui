import { Rect } from "../shapes/rect";
import { Point } from "../shapes/point";
import { GuitarNote } from "./../../models/guitar-note";
import { TabWindowDim } from "../tab-window-dim";
import { GuitarEffectElement } from "./effects/guitar-effect-element";
import { randomInt } from "../../misc/random-int";

/**
 * Class that handles drawing note element in the tab
 */
export class NoteElement {
  readonly uuid: number;
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
  public rect: Rect = new Rect();
  /**
   * Rectangle of the note text rectangle
   */
  public textRect: Rect = new Rect();
  /**
   * Rectangle of the note text rectangle
   */
  public textCoords: Point = new Point();
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
    this.uuid = randomInt();
    this.dim = dim;
    this.note = note;
    this.rect = new Rect(
      0,
      this.dim.noteRectHeight * (this.note.stringNum - 1),
      width,
      this.dim.noteRectHeight
    );
    this._guitarEffectElements = [];

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

    const newGuitarEffectElements: GuitarEffectElement[] = [];
    const oldGuitarEffectElements = [...this._guitarEffectElements];

    for (const effect of this.note.effects) {
      const oldElementIndex = oldGuitarEffectElements.findIndex(
        (e) => e.effect.uuid === effect.uuid
      );
      let element: GuitarEffectElement;

      if (oldElementIndex !== -1) {
        // Effect already applied to the note and calc-ed,
        // so just need to update the effect's dimensions
        element = oldGuitarEffectElements.splice(oldElementIndex, 1)[0];
        element.update(this.rect);
      } else {
        // Effect applied but not calc-ed yet,
        // so need to create a new guitar effect element
        element = new GuitarEffectElement(
          effect,
          this.note.stringNum,
          this.rect,
          this.dim
        );
      }
      newGuitarEffectElements.push(element);
    }
    this._guitarEffectElements = newGuitarEffectElements;
  }

  public scaleHorBy(scale: number): void {
    this.rect.x *= scale;
    this.rect.width *= scale;

    this.textRect.x =
      this.rect.x + this.rect.width / 2 - this.dim.noteTextSize / 2;
    // this.textRect.x *= scale;
    // this.textRect.width *= scale;
    this.textCoords.x *= scale;

    for (const effectElement of this._guitarEffectElements) {
      effectElement.scaleHorBy(scale);
    }
  }

  public get guitarEffectElements(): GuitarEffectElement[] {
    return this._guitarEffectElements;
  }
}
