import { Beat } from "../beat";
import { GuitarNote } from "../guitar-note";
import { MusicInstrument } from "../instrument/instrument";
import { LetRingEditing } from "./let-ring-editing";

/**
 * Shared scope and cleanup for edits that change note content. A slide or
 * legato points at the next beat, so an edit can make a technique on the
 * previous beat invalid. That beat is part of the scope, which also saves it
 * for undo.
 */
export class NoteContentEditing {
  /**
   * Finds the beats an edit can change: the edited beats, the beats before
   * them, and the following beats that Let Ring cleanup can reach.
   * @param stringNumber Limits the Let Ring search to one string.
   */
  public static getEditBeats<I extends MusicInstrument>(
    beats: Beat<I>[],
    stringNumber?: number
  ): Beat<I>[] {
    const affected = new Set<Beat<I>>();
    for (const beat of beats) {
      const previous = beat.voiceBar.bar.staff.getPrevBeat(beat);
      if (previous !== null) {
        affected.add(previous);
      }
    }
    for (const beat of LetRingEditing.getNoteEditBeats(beats, stringNumber)) {
      affected.add(beat);
    }
    return [...affected];
  }

  /** Removes Let Ring markers and techniques that the edit made invalid. */
  public static normalize(beats: Beat[]): void {
    LetRingEditing.normalizeNoteContent(beats);
    for (const beat of beats) {
      if (!beat.voiceBar.beats.includes(beat)) {
        continue;
      }
      for (const note of beat.notes ?? []) {
        if (note instanceof GuitarNote) {
          note.removeInvalidTechniques();
        }
      }
    }
  }
}
