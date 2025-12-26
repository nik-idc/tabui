import {
  BendOptionsData,
  BendTechniqueOptions,
  GuitarTechnique,
  Score,
  Technique,
  TECHNIQUES_INCOMPATIBILITY,
  TechniqueType,
  Track,
  TupletSettings,
  tupletSettingsEqual,
} from "..";
import { Bar, BeatArrayOperationOutput } from "../bar";
import { MasterBar, MasterBarData } from "../master-bar";
import { Beat } from "../beat";
import { Guitar } from "../instrument/guitar/guitar";
import { MusicInstrument } from "../instrument/instrument";
import { GuitarNote } from "../guitar-note";
import {
  NOTES_ARR,
  NOTES_PER_OCTAVE,
  LOWEST_OCTAVE,
  HIGHEST_OCTAVE,
  Note,
  NoteValue,
} from "../note";
import { NoteDuration } from "../note-duration";

/**
 * Static class containing complex editing methods,
 * like replace beats across the staff, transpose note etc
 */
export class ScoreEditor {
  /**
   * Transposes note value by the specified semitone count
   * @param semitones Semitone count
   */
  public static transpose<I extends MusicInstrument>(
    note: Note<I>,
    semitones: number
  ): void {
    if (note.octave === null) {
      throw Error("Tried to transpose a non-transposable note");
    }

    const currentIndex = NOTES_ARR.indexOf(note.noteValue);
    const totalSemitones =
      note.octave * NOTES_PER_OCTAVE + currentIndex + semitones;

    const newOctave = Math.floor(totalSemitones / NOTES_PER_OCTAVE);
    const newIndex =
      ((totalSemitones % NOTES_PER_OCTAVE) + NOTES_PER_OCTAVE) %
      NOTES_PER_OCTAVE;

    if (newOctave < LOWEST_OCTAVE || newOctave > HIGHEST_OCTAVE) {
      throw new Error("Octave out of range");
    }

    note.noteValue = NOTES_ARR[newIndex];
    note.octave = newOctave;
  }

  /**
   * Raise note by the specified semitone count
   * @param semitones Semitone count
   */
  public static raiseNote<I extends MusicInstrument>(
    note: Note<I>,
    semitones: number
  ): void {
    this.transpose(note, semitones);
  }

  /**
   * Lower note by the specified semitone count
   * @param semitones Semitone count
   */
  public static lowerNote<I extends MusicInstrument>(
    note: Note<I>,
    semitones: number
  ): void {
    this.transpose(note, -semitones);
  }

  /**
   * Sets note fret value
   * @param note Note
   * @param fret New fret value
   */
  public static setNoteFret(note: GuitarNote, fret: number): void {
    note.fret = fret;
    note.beat.bar.computeBeaming();
  }

  /**
   * Apply bend technique to a guitar note
   * @param note Note
   * @param bendOptions Bend options
   */
  public static applyBend(
    note: GuitarNote,
    bendOptions?: BendOptionsData
  ): void {}

  /**
   * Apply technique to note
   * @param note Note
   * @param techniqueType Technique type
   * @param bendOptions Bend options (if applicable)
   * @returns True if technique applied, false otherwise
   */
  public static applyTechniqueToNote<I extends MusicInstrument>(
    note: Note<I>,
    techniqueType: TechniqueType,
    bendOptions: BendTechniqueOptions | null
  ): boolean {
    // TEMPORARY LACK OF SUPPORT FOR NON-GUITAR NOTES
    if (!(note instanceof GuitarNote)) {
      throw Error("No support for non guitar notes");
    }

    if (
      note.noteValue === NoteValue.None ||
      note.noteValue === NoteValue.Dead
    ) {
      // No techniques can be applied to a dead note or an abscense of a note
      return false;
    }

    note.addTechnique(new GuitarTechnique(note, techniqueType, bendOptions));
    note.sortTechniques();

    return true;
  }

  /**
   * Adds new technique to the note
   * @param technique Technique to add
   * @returns True if technique added succesfully, false if can't add this technique
   */
  public static addTechniqueToNote<I extends MusicInstrument>(
    note: Note<I>,
    technique: Technique
  ): boolean {
    // Check if technique to be added is compatible with all the other techniques
    for (const technique of note.techniques) {
      const curIncompatibility = TECHNIQUES_INCOMPATIBILITY[technique.type];
      if (
        curIncompatibility.some((incompatibleType) => {
          return incompatibleType === technique.type;
        })
      ) {
        // One of the techniques is incompatible with the
        // to be added technique => discard and return false
        return false;
      }
    }

    // All techniques are compatible with each
    // other => add new technique and return true
    note.addTechnique(technique);
    return true;
  }

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
   * Applies techniques to all notes in specified beats
   * @param beats Beats array
   * @param technique Technique to apply
   * @returns True if the technique applied to all notes
   */
  public static applyTechniqueToBeatsNotes<I extends MusicInstrument>(
    beats: Beat<I>[],
    type: TechniqueType
  ): void {
    const notesArr: Note<I>[] = beats.flatMap((b) => b.notes);
    this.setTechniqueNotes(notesArr, type);
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
      beat.bar.computeBeaming();
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
    const sameSettings =
      newSettings?.normalCount === beat.tupletSettings?.normalCount ||
      newSettings?.tupletCount === beat.tupletSettings?.tupletCount;

    if (newSettings === null || sameSettings) {
      beat.tupletSettings = null;
      return;
    }

    beat.tupletSettings = {
      normalCount: newSettings.normalCount,
      tupletCount: newSettings.tupletCount,
    };
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
}
