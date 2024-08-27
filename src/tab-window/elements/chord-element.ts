import { Chord } from "./../../models/chord";
import { Rect } from "../shapes/rect";
import { NoteElement } from "./note-element";
import { Point } from "../shapes/point";
import { TabWindowDim } from "../tab-window-dim";
import { NoteDuration } from "../../models/note-duration";

/**
 * Class that handles drawing chord element in the tab
 */
export class ChordElement {
  /**
   * Tab window dimensions
   */
  readonly dim: TabWindowDim;
  /**
   * This chord's note elements
   */
  readonly noteElements: NoteElement[];
  /**
   * This chord's duration rectangle
   */
  readonly durationRect: Rect;
  /**
   * This chord's rectangle
   */
  readonly rect: Rect;
  /**
   * The chord
   */
  readonly chord: Chord;

  constructor(dim: TabWindowDim, chordCoords: Point, chord: Chord) {
    this.dim = dim;
    this.noteElements = new Array<NoteElement>(chord.guitar.stringsCount);
    this.durationRect = new Rect();
    this.rect = new Rect(chordCoords.x, chordCoords.y);
    this.chord = chord;

    this.calc();
  }

  /**
   * Calculate dimensions of the chord element
   */
  public calc(): void {
    switch (this.chord.duration) {
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
        throw new Error(`${this.chord.duration} is an invalid chord duration`);
    }
    this.rect.height = this.dim.tabLineHeight;

    // Calc note elements
    let notes = this.chord.notes;
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
   * Scales chord element horizontally
   * @param scale Scale factor
   * @returns True if can be scaled down, false otherwise
   */
  public scaleChordHorBy(scale: number): boolean {
    // Check if can be scaled down
    if (scale <= 0 || (scale > 0 && scale < 1)) {
      throw new Error(
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
   * Translates chord element by a specified dstance
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
