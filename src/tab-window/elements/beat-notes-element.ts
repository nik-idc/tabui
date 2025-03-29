import { Beat } from "../../models/beat";
import { Rect } from "../shapes/rect";
import { TabWindowDim } from "../tab-window-dim";
import { NoteElement } from "./note-element";

/**
 * Class that handles drawing note elements of the beat
 */
export class BeatNotesElement {
  /**
   * Tab window dimensions
   */
  readonly dim: TabWindowDim;
  /**
   * Beat
   */
  readonly beat: Beat;
  /**
   * Rectangle
   */
  readonly rect: Rect;
  /**
   * Note elements
   */
  readonly noteElements: NoteElement[];

  /**
   * Class that handles drawing note elements of the beat
   * @param dim Tab window dimensions
   * @param beat Beat
   * @param width Width of the beat element
   */
  constructor(dim: TabWindowDim, beat: Beat, width: number) {
    this.dim = dim;
    this.beat = beat;
    this.rect = new Rect(
      0,
      this.dim.durationsHeight,
      width,
      this.dim.noteRectHeight * this.beat.guitar.stringsCount
    );
    this.noteElements = new Array<NoteElement>(this.beat.guitar.stringsCount);

    this.calc();
  }

  /**
   * Calculate the note elements
   */
  public calc(): void {
    // Calc note elements
    for (let stringNum = 1; stringNum <= this.beat.notes.length; stringNum++) {
      this.noteElements[stringNum - 1] = new NoteElement(
        this.dim,
        this.rect.width,
        this.beat.notes[stringNum - 1]
      );
    }
  }
}
