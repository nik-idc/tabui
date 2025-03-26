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
   * Rectangle of the beat the note belongs to
   */
  readonly beatRect: Rect;
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
   * @param beatRect Beat rectangle
   * @param note Note
   */
  constructor(dim: TabWindowDim, beatRect: Rect, note: GuitarNote) {
    this.dim = dim;
    this.beatRect = beatRect;
    this.note = note;

    this.calc();
  }

  /**
   * Calculate dimensions of the note element
   */
  public calc(): void {
    this.rect.width = this.beatRect.width;
    this.rect.height = this.dim.noteRectHeight;
    this.rect.x = this.beatRect.x;
    const topY = this.beatRect.y + this.dim.durationsHeight;
    const stringYOffset = this.dim.noteRectHeight * (this.note.stringNum - 1);
    this.rect.y = topY + stringYOffset;

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

  /**
   * Scales note element horizontally
   * @param scale Scale factor
   * @returns True if scaled, false if no more room to scale
   */
  public scaleNoteHorBy(scale: number): void {
    if (scale <= 0) {
      // if (scale <= 0 || (scale > 0 && scale < 1)) {
      throw Error(
        `${scale} is an invalid scale: scale must be positive AND >= 1`
      );
    }

    this.rect.width *= scale;
    this.rect.x *= scale;
    // this.textRect.width *= scale;
    this.textRect.x =
      this.rect.x + this.rect.width / 2 - this.dim.noteTextSize / 2;
    this.textCoords.x = this.textRect.x + this.dim.noteTextSize / 2;
  }

  /**
   * Translates note element by a specified dstance
   * @param dx Horizontal distance
   * @param dy Vertical distance
   */
  public translateBy(dx: number, dy: number): void {
    this.rect.x += Math.floor(dx);
    this.rect.y += Math.floor(dy);
    this.textRect.x += Math.floor(dx);
    this.textRect.y += Math.floor(dy);
    this.textCoords.x += Math.floor(dx);
    this.textCoords.y += Math.floor(dy);

    for (const effectElement of this._guitarEffectElements) {
      effectElement.translateBy(dx, dy);
    }
  }

  public get guitarEffectElements(): GuitarEffectElement[] {
    return this._guitarEffectElements;
  }
}
