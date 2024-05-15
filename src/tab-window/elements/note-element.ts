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
   * Rectangle of the note input rectangle
   */
  readonly noteRect: Rect = new Rect();
  /**
   * Coords of the text
   */
  readonly textCoords: Point = new Point();

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
    this.rect.height = this.dim.minNoteSize;
    this.rect.x = this.chordRect.x;

    const topY = this.chordRect.y - this.dim.minNoteSize / 2;
    const stringYOffset = this.dim.minNoteSize * (this.note.strNum - 1);
    this.rect.y = topY + stringYOffset;

    this.noteRect.x = this.rect.x + this.rect.width / 2;
    this.noteRect.y = this.rect.y;
    this.noteRect.width = this.dim.minNoteSize;
    this.noteRect.height = this.rect.height;

    this.textCoords.x = this.chordRect.x + this.chordRect.width / 2;
    this.textCoords.y = this.rect.y + this.dim.minNoteSize / 2;
  }

  /**
   * Checks if it's possible to scale down without hurting readability
   * @param scale Scale factor
   * @returns True if can be scaled down, false otherwise
   */
  public canBeScaledDown(scale: number): boolean {
    return this.rect.width * scale >= this.dim.minNoteSize;
  }

  /**
   * Scales note element horizontally
   * @param scale Scale factor
   * @returns True if scaled, false if no more room to scale
   */
  public scaleNoteHorBy(scale: number): boolean {
    if (scale <= 0) {
      throw new Error(`${scale} is an invalid scale: scale must be positive`);
    }

    if (scale > 0 && scale < 1 && !this.canBeScaledDown(scale)) {
      return false;
    }

    this.rect.width *= scale;
    this.rect.x *= scale;
    this.noteRect.width *= scale;
    this.noteRect.x *= scale;
    this.textCoords.x *= scale;

    return true;
  }

  /**
   * Translates note element by a specified dstance
   * @param dx Horizontal distance
   * @param dy Vertical distance
   */
  public translateBy(dx: number, dy: number): void {
    this.rect.x += Math.floor(dx);
    this.rect.y += Math.floor(dy);
    this.noteRect.x += Math.floor(dx);
    this.noteRect.y += Math.floor(dy);
    this.textCoords.x += Math.floor(dx);
    this.textCoords.y += Math.floor(dy);
  }
}
