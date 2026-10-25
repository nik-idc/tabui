import { Beat } from "../beat";
import { GuitarNote } from "../guitar-note";
import { Note } from "../note";
import { GuitarTechniqueType } from "../technique-type";

/** Internal passage support, inheritance, and cleanup for ScoreEditor edits. */
export class LetRingEditing {
  /** Combines local Let Ring restrictions with support from preceding marked slots. */
  public static isApplicable(note: Note): boolean {
    if (!note.isTechniqueApplicable(GuitarTechniqueType.LetRing)) {
      return false;
    }
    const empty = note instanceof GuitarNote && note.fret === null;
    return !empty || note.hasLetRingSupport();
  }

  /** Converts an appended rest to a blank only between marked passage neighbors. */
  public static inheritAppendMarkers(beats: Beat[]): void {
    const beat = beats[0];
    const staff = beat.voiceBar.bar.staff;
    const previous = staff.getPrevBeat(beat);
    const next = staff.getNextBeat(beat);
    const insidePassage = (previous?.notes ?? []).some(
      (n, i) =>
        n.hasTechnique(GuitarTechniqueType.LetRing) &&
        next?.notes?.[i]?.hasTechnique(GuitarTechniqueType.LetRing)
    );
    if (insidePassage) {
      beat.makeBeatWithNotes();
      this.inheritBlankMarkers(beats);
    }
  }

  /** Applies blank-insertion rules to a complete installed group without turning rests into notes. */
  public static inheritBlankMarkers(beats: Beat[]): void {
    const first = beats[0];
    const last = beats[beats.length - 1];
    const hasRest = beats.some((b) => b.notes === null);
    if (first === undefined || last === undefined || hasRest) {
      return;
    }
    const staff = first.voiceBar.bar.staff;
    const previous = staff.getPrevBeat(first);
    const next = staff.getNextBeat(last);
    for (const note of first.notes ?? []) {
      if (!(note instanceof GuitarNote)) {
        continue;
      }
      const string = note.stringNum;
      const hasMarkedNeighbors =
        previous?.notes?.[string - 1]?.hasTechnique(
          GuitarTechniqueType.LetRing
        ) === true &&
        next?.notes?.[string - 1]?.hasTechnique(GuitarTechniqueType.LetRing) ===
          true;
      if (!hasMarkedNeighbors) {
        continue;
      }

      for (const beat of beats) {
        const slot = beat.notes?.[string - 1];
        const empty = slot instanceof GuitarNote && slot.fret === null;
        if (!empty) {
          continue;
        }
        const applicable = this.isApplicable(slot);
        if (applicable) {
          slot.setTechnique(GuitarTechniqueType.LetRing);
        }
      }
    }
  }

  /** Finds next-beat ties and following empty markers that can lose support after a content edit. */
  public static getNoteEditBeats(beats: Beat[], stringNumber?: number): Beat[] {
    const affected = new Set(beats);
    for (const beat of beats) {
      const staff = beat.voiceBar.bar.staff;
      let next = staff.getNextBeat(beat);
      while (next !== null) {
        affected.add(next);
        if (!this.hasEmptyMarker(next, stringNumber)) {
          break;
        }
        next = staff.getNextBeat(next);
      }
    }
    return [...affected];
  }

  /** Finds empty marked slots whose saved content can change during passage cleanup. */
  public static hasEmptyMarker(beat: Beat, stringNumber?: number): boolean {
    return (beat.notes ?? []).some(
      (n, i) =>
        n instanceof GuitarNote &&
        (stringNumber === undefined || i === stringNumber - 1) &&
        n.fret === null &&
        n.hasTechnique(GuitarTechniqueType.LetRing)
    );
  }

  /** Removes unsupported empty markers after edits; playable marked notes start independent passages. */
  public static normalizeNoteContent(beats: Beat[]): void {
    for (const beat of beats) {
      for (const note of beat.notes ?? []) {
        if (!(note instanceof GuitarNote)) {
          continue;
        }
        if (note.fret === null) {
          note.removeTechnique(GuitarTechniqueType.PalmMute);
          if (!note.hasLetRingSupport()) {
            note.removeTechnique(GuitarTechniqueType.LetRing);
          }
        } else if (note.fret === -1) {
          note.removeTechnique(GuitarTechniqueType.LetRing);
        }
      }
    }
  }
}
