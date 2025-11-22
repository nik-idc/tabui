import { Beat, GuitarNote } from "@/notation/model";
import { Rect, randomInt } from "@/shared";
import { BeatElement } from "./beat-element";
import { TabLayoutDimensions } from "../tab-controller-dim";
import { NoteElement } from "./note-element";
import { GuitarNoteElement } from "./guitar-note-element";

/**
 * In-between class for containing only note element of a beat element
 */
export class BeatNotesElement {
  /** Beat-notes element's unique identifier */
  readonly uuid: number;
  /** The beat */
  readonly beat: Beat;
  /** Parent beat element */
  readonly beatElement: BeatElement;

  /** Rectangle */
  private _rect: Rect;
  /** Note element */
  private _noteElements: NoteElement[];

  /**
   * In-between class for containing only note element of a beat element
   * @param beat Beat
   * @param beatElement Parent beat element
   */
  constructor(beat: Beat, beatElement: BeatElement) {
    this.uuid = randomInt();
    this.beat = beat;
    this.beatElement = beatElement;

    TabLayoutDimensions.DURATIONS_HEIGHT;
    this._rect = new Rect(
      0,
      TabLayoutDimensions.DURATIONS_HEIGHT +
        this.beatElement.techniqueLabelsRect.height,
      beatElement.rect.width,
      TabLayoutDimensions.NOTE_RECT_HEIGHT *
        this.beat.trackContext.instrument.maxPolyphony
    );
    this._noteElements = new Array<NoteElement>(
      this.beat.trackContext.instrument.maxPolyphony
    );

    this.calc();
  }

  /**
   * Calculate the note element
   */
  public calc(): void {
    const newNoteElements = new Array<NoteElement>(
      this.beat.trackContext.instrument.maxPolyphony
    );
    const oldNoteElements = this._noteElements;

    for (let i = 0; i < this.beat.notes.length; i++) {
      const note = this.beat.notes[i];
      if (note === undefined) continue; // !! Not sure if this is necessary

      const oldElement = oldNoteElements[i];

      if (oldElement !== undefined && oldElement.note.uuid === note.uuid) {
        // If the current note is the same note as before,
        // just update it's dimensions
        oldElement.rect.width = this._rect.width;
        oldElement.calc();
        newNoteElements[i] = oldElement;
      } else {
        // If the current note is new,
        // create a new note element for it

        // VERY BAD!!! but for now will do. as always lol
        if (note instanceof GuitarNote) {
          newNoteElements[i] = new GuitarNoteElement(note, this);
        }
      }
    }

    this._noteElements = newNoteElements;
  }

  /**
   * Scales the element & it's children horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    this._rect.x *= scale;
    this._rect.width *= scale;

    for (const noteElement of this._noteElements) {
      noteElement.scaleHorBy(scale);
    }
  }

  /** Beat-notes element main rectangle */
  public get rect(): Rect {
    return this._rect;
  }

  /** Note element */
  public get noteElements(): NoteElement[] {
    return this._noteElements;
  }
}
