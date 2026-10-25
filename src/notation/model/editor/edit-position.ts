import { Beat } from "../beat";
import { GuitarNote } from "../guitar-note";
import { Note } from "../note";
import type { VoiceBar } from "../voice-bar";

/** A beat address resolved against live content after later history restores its position. */
export type BeatPosition = {
  /** Voice that owns the beat. */
  voiceBar: VoiceBar;
  /** Beat position restored before this edit is undone or redone. */
  index: number;
};

/** A string slot address, including on a rest, without retaining a live note. */
export type NotePosition = BeatPosition & {
  /** One-based string to edit without replacing other strings. */
  stringNumber: number;
};

/** Internal position helpers shared by score-editing rules. */
export class EditPosition {
  /** Records a live beat's address without retaining its object identity. */
  public static getBeatPosition(beat: Beat): BeatPosition {
    return {
      voiceBar: beat.voiceBar,
      index: beat.voiceBar.beats.indexOf(beat),
    };
  }

  /** Resolves an address against the current voice content, not a detached history copy. */
  public static resolveBeatPosition(position: BeatPosition): Beat {
    const beat = position.voiceBar.beats[position.index];
    if (beat === undefined) {
      throw Error("Cannot resolve saved note content outside its voice");
    }
    return beat;
  }

  /** Records explicit note positions without treating them as whole-beat edits. */
  public static getTechniqueTargetsForNotes(notes: Note[]): NotePosition[] {
    return notes.map((n) => ({
      ...this.getBeatPosition(n.beat),
      stringNumber:
        n instanceof GuitarNote
          ? n.stringNum
          : (n.beat.notes?.indexOf(n) ?? -1) + 1,
    }));
  }
}
