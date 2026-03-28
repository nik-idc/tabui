import {
  BendTechniqueOptions,
  GuitarTechnique,
  TechniqueType,
  TupletSettings,
  tupletSettingsEqual,
} from "..";
import { BeatArrayOperationOutput } from "../bar";
import { Beat } from "../beat";
import { MusicInstrument } from "../instrument/instrument";
import { GuitarNote } from "../guitar-note";
import { Note } from "../note";
import { NoteDuration } from "../note-duration";

/**
 * Static class containing complex editing methods,
 * like replace beats across the staff, transpose note etc
 */
export class ScoreEditor {
  /**
   * Sets (applies/removes) technique from notes
   * @param notes Notes
   * @param type Technique type
   * @param bendOptions Bend options
   * @returns True if any changes had been made
   */
  public static setTechniqueNotes<I extends MusicInstrument>(
    notes: Note<I>[],
    type: TechniqueType,
    bendOptions: BendTechniqueOptions | null = null
  ): boolean {
    let changesMade = false;

    const hasAnyWithTechnique = notes.some((n) => n.hasTechnique(type));
    if (hasAnyWithTechnique) {
      for (const note of notes) {
        if (note.removeTechnique(type)) {
          changesMade = true;
        }
      }
    } else {
      for (const note of notes) {
        if (note instanceof GuitarNote) {
          if (note.addTechnique(new GuitarTechnique(note, type, bendOptions))) {
            changesMade = true;
          }
        }
      }
    }

    return changesMade;
  }

  /**
   * Set beat duration
   * @param beat Beat
   * @param newDuration New duration
   */
  public static setDuration<I extends MusicInstrument>(
    beat: Beat<I>,
    newDuration: NoteDuration
  ) {
    beat.baseDuration = newDuration;
    beat.bar.computeBarTupletGroups();
  }

  /**
   * Set beat's dot count (or reset it if setting the same dot)
   * @param newDots New dots value (can't be anything other than 0, 1 and 2)
   */
  public static setDots<I extends MusicInstrument>(
    beats: Beat<I>[],
    newDots: number
  ): void {
    if (newDots !== 0 && newDots !== 1 && newDots !== 2) {
      throw Error(`${newDots} is an invalid dots value`);
    }

    for (const beat of beats) {
      beat.dots = newDots === beat.dots ? 0 : newDots;
      beat.bar.computeBarTupletGroups();
    }
  }

  /**
   * Sets (or unsets) tuplet settings
   * @param newSettings Tuplet settings (unsets tuplet if undefined)
   */
  public static setTupletGroupSettings<I extends MusicInstrument>(
    beat: Beat<I>,
    newSettings: TupletSettings | null = null
  ): void {
    const sameSettings = tupletSettingsEqual(newSettings, beat.tupletSettings);

    if (newSettings === null || sameSettings) {
      beat.tupletSettings = null;
      beat.bar.computeBarTupletGroups();
      return;
    }

    beat.tupletSettings = {
      normalCount: newSettings.normalCount,
      tupletCount: newSettings.tupletCount,
    };
    beat.bar.computeBarTupletGroups();
  }

  /**
   * Sets tuplet settings for specified beats
   * @param beats Beats to apply tuplet settings for
   * @param normalCount Normal count
   * @param tupletCount Tuplet count
   */
  public static setTuplet<I extends MusicInstrument>(
    beats: Beat<I>[],
    tupletSettings: TupletSettings | null
  ): void {
    for (const beat of beats) {
      if (tupletSettingsEqual(beat.tupletSettings, tupletSettings)) {
        beat.tupletSettings = null;
      } else {
        beat.tupletSettings =
          tupletSettings !== null
            ? {
                normalCount: tupletSettings.normalCount,
                tupletCount: tupletSettings.tupletCount,
              }
            : null;
      }

      beat.bar.computeBarTupletGroups();
    }
  }

  /**
   * Removes beats from tab
   * @param beats Beats to remove
   */
  public static removeBeats<I extends MusicInstrument>(
    beats: Beat<I>[]
  ): BeatArrayOperationOutput<I>[][] {
    const outputs: BeatArrayOperationOutput<I>[][] = [];
    for (const beat of beats) {
      const beatIndex = beat.bar.beats.indexOf(beat);
      outputs.push(beat.bar.removeBeat(beatIndex));
    }

    return outputs;
  }

  /**
   * Replaces beat section with another beat section
   * @param oldBeats Old beats
   * @param newBeats New beats
   */
  public static replaceBeats<I extends MusicInstrument>(
    oldBeats: Beat<I>[],
    newBeats: Beat<I>[]
  ): void {
    if (oldBeats.length === 0 || newBeats.length === 0) {
      return;
    }

    const smallerNoteCount =
      oldBeats[0].notes.length > newBeats[0].notes.length
        ? newBeats[0].notes.length
        : oldBeats[0].notes.length;

    if (oldBeats.length > newBeats.length) {
      // Replace beats' notes values
      for (let i = 0; i < newBeats.length; i++) {
        oldBeats[i].baseDuration = newBeats[i].baseDuration;
        for (let j = 0; j < smallerNoteCount; j++) {
          oldBeats[i].notes[j].noteValue = newBeats[i].notes[j].noteValue;
          oldBeats[i].notes[j].octave = newBeats[i].notes[j].octave;
        }
      }

      // Remove 'excess' beats
      this.removeBeats(oldBeats.slice(newBeats.length, oldBeats.length));
    } else if (oldBeats.length < newBeats.length) {
      const bar = oldBeats[0].bar;
      const beatIndex = bar.beats.indexOf(oldBeats[0]);

      // Remove selected beats
      this.removeBeats(oldBeats);

      // Paste copied data into bar
      const newBeatsCopies = [];
      for (const beat of newBeats) {
        newBeatsCopies.push(beat.deepCopy());
      }
      // Beats inserted AFTER the index
      bar.insertBeats(beatIndex - 1, newBeatsCopies);
    } else {
      // Replace all notes in selection with copied beats
      for (let i = 0; i < oldBeats.length; i++) {
        oldBeats[i].baseDuration = newBeats[i].baseDuration;
        for (let j = 0; j < smallerNoteCount; j++) {
          oldBeats[i].notes[j].noteValue = newBeats[i].notes[j].noteValue;
          oldBeats[i].notes[j].octave = newBeats[i].notes[j].octave;
        }
      }
    }
  }

  // Unused helpers kept for later review.
  // public static transpose<I extends MusicInstrument>(
  //   note: Note<I>,
  //   semitones: number
  // ): void {}
  // public static raiseNote<I extends MusicInstrument>(
  //   note: Note<I>,
  //   semitones: number
  // ): void {}
  // public static lowerNote<I extends MusicInstrument>(
  //   note: Note<I>,
  //   semitones: number
  // ): void {}
  // public static setNoteFret(note: GuitarNote, fret: number): void {}
  // public static applyBend(
  //   note: GuitarNote,
  //   bendOptions?: BendTechniqueOptions
  // ): void {}
}
