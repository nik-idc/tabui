import { Beat } from "@/notation/model";
import { Rect, Point } from "@/shared";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
import { NotationElement } from "@/notation/controller/element/notation-element";
import { BarElement } from "../bar/bar-element";
import { NoteElement } from "../note/note-element";

/**
 * Interface representing a specific notation styleА beat element
 */
export interface BeatElement extends NotationElement {
  readonly beat: Beat;
  readonly barElement: BarElement;

  getNextNoteElement(noteElement: NoteElement): NoteElement | null;
  getPrevNoteElement(noteElement: NoteElement): NoteElement | null;

  get noteElements(): NoteElement[];
}

/**
 * Calculates the beat element base width
 * @param beat Beat
 * @returns Beat element base width
 */
export function getBeatWidth(beat: Beat): number {
  // Calc rect base width by duration
  let width = EditorLayoutDimensions.WIDTH_MAPPING[beat.baseDuration];

  // Scale rect width based on number of dots
  width *= EditorLayoutDimensions.DOT_WIDTH_FACTORS[beat.dots];

  // Scale the rect width based on tuplet settings
  if (beat.tupletSettings !== null) {
    const tupletScale =
      beat.tupletSettings.tupletCount / beat.tupletSettings.normalCount;
    width *= tupletScale;
    if (width < EditorLayoutDimensions.NOTE_RECT_WIDTH_MIN) {
      // To make sure beats don't get too small causing UI errors
      width = EditorLayoutDimensions.NOTE_RECT_WIDTH_MIN;
    }
  }

  return width;
}
