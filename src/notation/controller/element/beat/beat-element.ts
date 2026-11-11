import { Beat } from "../../../model";
import { Rect, Point } from "../../../../shared";
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
