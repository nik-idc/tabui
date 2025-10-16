import { Beat } from "../../models/index";
import { Rect } from "../shapes/rect";
import { TabWindowDim } from "../tab-window-dim";
import { NoteElement } from "./note-element";
import { randomInt } from "../../misc/random-int";

/**
 * Class that handles drawing note elements of the beat
 */
export class BeatNotesElement {
  readonly uuid: number;
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
  rect: Rect;
  /**
   * Note elements
   */
  noteElements: NoteElement[];

  /**
   * Class that handles drawing note elements of the beat
   * @param dim Tab window dimensions
   * @param beat Beat
   * @param width Width of the beat element
   * @param labelsGapHeight Height of the labels gap. Dictates the y-axis of the rect
   */
  constructor(
    dim: TabWindowDim,
    beat: Beat,
    width: number,
    labelsGapHeight: number = 0
  ) {
    this.uuid = randomInt();
    this.dim = dim;
    this.beat = beat;
    this.rect = new Rect(
      0,
      this.dim.durationsHeight + labelsGapHeight,
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
    const newNoteElements = new Array<NoteElement>(
      this.beat.guitar.stringsCount
    );
    const oldNoteElements = this.noteElements;

    for (let i = 0; i < this.beat.notes.length; i++) {
      const note = this.beat.notes[i];
      if (note === undefined) continue; // !! Not sure if this is necessary

      const stringNum = note.stringNum;
      const oldElement = oldNoteElements[stringNum - 1];

      if (oldElement !== undefined && oldElement.note.uuid === note.uuid) {
        // If the current note is the same note as before,
        // just update it's dimensions
        oldElement.rect.width = this.rect.width;
        oldElement.calc();
        newNoteElements[stringNum - 1] = oldElement;
      } else {
        // If the current note is new,
        // create a new note element for it
        newNoteElements[stringNum - 1] = new NoteElement(
          this.dim,
          this.rect.width,
          note
        );
      }
    }
    this.noteElements = newNoteElements;
  }

  public scaleHorBy(scale: number): void {
    this.rect.x *= scale;
    this.rect.width *= scale;

    for (const noteElement of this.noteElements) {
      noteElement.scaleHorBy(scale);
    }
  }
}
