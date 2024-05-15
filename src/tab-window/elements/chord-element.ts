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
    // Calc chord rectangle
    // 1/32 - 100%, 1/16 - 110%, 1/8 - 120%, 1/4 - 130%, 1/2 - 140%, 1 - 150%
    const add = Math.log2(this.chord.duration / NoteDuration.ThirtySecond);
    const perc = (100 + add * 10) / 100;
    let chordWidth = perc * this.dim.minNoteSize;
    this.rect.width = chordWidth;
    this.rect.height = this.dim.lineHeight;

    // Calc note elements
    let notes = this.chord.notes;
    for (let strNum = 0; strNum < notes.length; strNum++) {
      this.noteElements[strNum] = new NoteElement(
        this.dim,
        this.rect,
        notes[strNum]
      );
    }

    // Calc duration position
    this.durationRect.width = this.rect.width;
    this.durationRect.height = this.dim.durationsHeight;
    this.durationRect.x = this.rect.x;
    this.durationRect.y = this.rect.x;
  }

  /**
   * Checks if it's possible to scale down without hurting readability
   * @param scale Scale factor
   * @returns True if can be scaled down, false otherwise
   */
  public canBeScaledDown(scale: number): boolean {
    if (scale >= 1) {
      return true;
    }

    for (let noteElement of this.noteElements) {
      if (!noteElement.canBeScaledDown(scale)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Scales chord element horizontally
   * @param scale Scale factor
   * @returns True if can be scaled down, false otherwise
   */
  public scaleChordHorBy(scale: number): boolean {
    if (scale <= 0) {
      throw new Error(`${scale} is an invalid scale: scale must be positive`);
    }

    // Check if can be scaled down
    if (scale > 0 && scale < 1 && !this.canBeScaledDown(scale)) {
      return false;
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
