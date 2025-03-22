import { Beat } from "../../models/beat";
import { Rect } from "../shapes/rect";
import { NoteElement } from "./note-element";
import { Point } from "../shapes/point";
import { TabWindowDim } from "../tab-window-dim";
import { NoteDuration } from "../../models/note-duration";

/**
 * Class that handles drawing beat element in the tab
 */
export class BeatElement {
  /**
   * Tab window dimensions
   */
  readonly dim: TabWindowDim;
  /**
   * This beat's note elements
   */
  readonly noteElements: NoteElement[];
  /**
   * This beat's duration rectangle
   */
  readonly durationRect: Rect;
  /**
   * This beat's rectangle
   */
  readonly rect: Rect;
  /**
   * The beat
   */
  readonly beat: Beat;

  /**
   * Class that handles drawing beat element in the tab
   * @param dim Tab window dimensions
   * @param beatCoords Beat element coords
   * @param beat Beat
   */
  constructor(dim: TabWindowDim, beatCoords: Point, beat: Beat) {
    this.dim = dim;
    this.noteElements = new Array<NoteElement>(beat.guitar.stringsCount);
    this.durationRect = new Rect();
    this.rect = new Rect(beatCoords.x, beatCoords.y);
    this.beat = beat;

    this.calc();
  }

  /**
   * Calculate dimensions of the beat element
   */
  public calc(): void {
    switch (this.beat.duration) {
      case NoteDuration.ThirtySecond:
        this.rect.width = this.dim.noteRectWidthThirtySecond;
        break;
      case NoteDuration.Sixteenth:
        this.rect.width = this.dim.noteRectWidthSixteenth;
        break;
      case NoteDuration.Eighth:
        this.rect.width = this.dim.noteRectWidthEighth;
        break;
      case NoteDuration.Quarter:
        this.rect.width = this.dim.noteRectWidthQuarter;
        break;
      case NoteDuration.Half:
        this.rect.width = this.dim.noteRectWidthHalf;
        break;
      case NoteDuration.Whole:
        this.rect.width = this.dim.noteRectWidthWhole;
        break;
      default:
        throw Error(`${this.beat.duration} is an invalid beat duration`);
    }
    this.rect.height = this.dim.tabLineHeight;

    // Calc note elements
    let notes = this.beat.notes;
    for (let stringNum = 1; stringNum <= notes.length; stringNum++) {
      this.noteElements[stringNum - 1] = new NoteElement(
        this.dim,
        this.rect,
        notes[stringNum - 1]
      );
    }

    // Calc duration transform
    this.durationRect.x = this.rect.x;
    this.durationRect.y = this.rect.y;
    this.durationRect.width = this.rect.width;
    this.durationRect.height = this.dim.durationsHeight;
  }

  /**
   * Scales beat element horizontally
   * @param scale Scale factor
   * @returns True if can be scaled down, false otherwise
   */
  public scaleBeatHorBy(scale: number): boolean {
    // Check if can be scaled down
    if (scale <= 0) {
    // if (scale <= 0 || (scale > 0 && scale < 1)) {
      throw Error(
        `${scale} is an invalid scale: scale must be positive AND >= 1`
      );
    }

    // Scale notes
    for (let noteElement of this.noteElements) {
      noteElement.scaleNoteHorBy(scale);
    }

    // Scale rectangle
    this.rect.width *= scale;
    this.rect.x *= scale;
    this.durationRect.width *= scale;
    this.durationRect.x *= scale;

    return true;
  }

  /**
   * Translates beat element by a specified dstance
   * @param dx Horizontal distance
   * @param dy Vertical distance
   */
  public translateBy(dx: number, dy: number): void {
    this.rect.x += dx;
    this.rect.y += dy;
    this.durationRect.x += dx;
    this.durationRect.y += dy;
    for (let noteElement of this.noteElements) {
      noteElement.translateBy(dx, dy);
    }
  }
}
