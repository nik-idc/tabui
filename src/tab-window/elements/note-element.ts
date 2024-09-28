import { Rect } from "../shapes/rect";
import { Point } from "../shapes/point";
import { GuitarNote } from "./../../models/guitar-note";
import { TabWindowDim } from "../tab-window-dim";

/**
 * Class that handles drawing note element in the tab
 */
export class NoteElement {
  /**
   * Tab window dimensions
   */
  readonly dim: TabWindowDim;
  /**
   * Rectangle of the chord the note belongs to
   */
  readonly chordRect: Rect;
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
   * Class that handles drawing note element in the tab
   * @param dim Tab window dimensions
   * @param chordRect Chord rectangle
   * @param note Note
   */
  constructor(dim: TabWindowDim, chordRect: Rect, note: GuitarNote) {
    this.dim = dim;
    this.chordRect = chordRect;
    this.note = note;

    this.calc();
  }

  /**
   * Calculate dimensions of the note element
   */
  public calc(): void {
    this.rect.width = this.chordRect.width;
    this.rect.height = this.dim.noteRectHeight;
    this.rect.x = this.chordRect.x;
    const topY = this.chordRect.y + this.dim.durationsHeight;
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
  }

  /**
   * Scales note element horizontally
   * @param scale Scale factor
   * @returns True if scaled, false if no more room to scale
   */
  public scaleNoteHorBy(scale: number): void {
    if (scale <= 0) {
      // if (scale <= 0 || (scale > 0 && scale < 1)) {
      throw new Error(
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
  }
}
