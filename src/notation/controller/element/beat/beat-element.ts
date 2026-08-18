import { Bar, Beat, VoiceBar } from "../../../model";
import { Rect, Point } from "../../../../shared";
import { EditorLayoutDimensions } from "../../editor-layout-dimensions";
import { NotationNode } from "../notation-element";
import { BarElement } from "../bar/bar-element";
import { NoteElement } from "../note/note-element";
import { VoiceBarContainer } from "../bar/voice-bar-container";

/**
 * Interface representing a specific notation styleА beat element
 */
export interface BeatElement extends NotationNode {
  readonly beat: Beat;
  readonly voiceBarContainer: VoiceBarContainer;
  readonly barElement: BarElement;
  readonly barLocalCoords: Point;
  readonly barLocalBoundingBox: Rect;

  getNextNoteElement(noteElement: NoteElement): NoteElement | null;
  getPrevNoteElement(noteElement: NoteElement): NoteElement | null;

  get noteElements(): NoteElement[];
}

/**
 * Calculates the beat element base width
 * @param beat Beat
 * @param bar Owning bar context for width calculation
 * @returns Beat element base width
 */
export function getBeatWidth(
  beat: Beat,
  layoutDimensions: EditorLayoutDimensions
): number {
  // Calc rect base width by duration
  let width = layoutDimensions.WIDTH_MAPPING[beat.baseDuration];

  // Scale rect width based on number of dots
  width *= layoutDimensions.DOT_WIDTH_FACTORS[beat.dots];

  // Scale the rect width based on tuplet settings
  if (beat.tupletSettings !== null) {
    const tupletScale =
      beat.tupletSettings.tupletCount / beat.tupletSettings.normalCount;
    width *= tupletScale;
    if (width < layoutDimensions.NOTE_RECT_WIDTH_MIN) {
      // To make sure beats don't get too small causing UI errors
      width = layoutDimensions.NOTE_RECT_WIDTH_MIN;
    }
  }

  return width;
}
