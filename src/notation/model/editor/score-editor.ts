import {
  BendTechniqueOptions,
  GuitarTechnique,
  MasterBar,
  MasterBarArrayOperationOutput,
  Score,
  TechniqueType,
  TupletSettings,
  tupletSettingsEqual,
} from "..";
import { Bar } from "../bar";
import { BeatArrayOperationOutput } from "../bar";
import { Beat, BeatDots } from "../beat";
import { MusicInstrument } from "../instrument/instrument";
import { GuitarNote } from "../guitar-note";
import { Note, NoteValue } from "../note";
import { NoteDuration } from "../note-duration";

/**
 * Static class containing complex editing methods,
 * like replace beats across the staff, transpose note etc
 */
export class ScoreEditor {
  private static rebuildBars<I extends MusicInstrument>(
    bars: Set<Bar<I>>
  ): void {
    for (const bar of bars) {
      bar.rebuildTiming();
    }
  }

  private static rebuildAffectedBars<I extends MusicInstrument>(
    beats: Beat<I>[]
  ): void {
    this.rebuildBars(new Set(beats.map((beat) => beat.bar)));
  }

  private static copyRhythmicData<I extends MusicInstrument>(
    targetBeat: Beat<I>,
    sourceBeat: Beat<I>
  ): void {
    targetBeat.baseDuration = sourceBeat.baseDuration;
    targetBeat.dots = sourceBeat.dots as BeatDots;
    targetBeat.tupletSettings =
      sourceBeat.tupletSettings !== null
        ? {
            normalCount: sourceBeat.tupletSettings.normalCount,
            tupletCount: sourceBeat.tupletSettings.tupletCount,
          }
        : null;
  }

  private static copyBeatContent<I extends MusicInstrument>(
    targetBeat: Beat<I>,
    sourceBeat: Beat<I>
  ): void {
    this.copyRhythmicData(targetBeat, sourceBeat);

    const smallerNoteCount = Math.min(
      targetBeat.notes.length,
      sourceBeat.notes.length
    );
    for (let i = 0; i < smallerNoteCount; i++) {
      targetBeat.notes[i].setNote(
        sourceBeat.notes[i].noteValue,
        sourceBeat.notes[i].octave
      );
    }
  }

  private static createBeatCopyForBar<I extends MusicInstrument>(
    bar: Bar<I>,
    sourceBeat: Beat<I>
  ): Beat<I> {
    const beat = new Beat<I>(
      bar,
      bar.trackContext,
      [],
      sourceBeat.baseDuration,
      sourceBeat.dots as BeatDots,
      sourceBeat.tupletSettings !== null
        ? {
            normalCount: sourceBeat.tupletSettings.normalCount,
            tupletCount: sourceBeat.tupletSettings.tupletCount,
          }
        : null
    );
    this.copyBeatContent(beat, sourceBeat);
    return beat;
  }

  public static setTimeSignature(
    score: Score,
    masterBar: MasterBar,
    beatsCount?: number,
    duration?: NoteDuration
  ): void {
    if (beatsCount !== undefined) {
      masterBar.beatsCount = beatsCount;
    }
    if (duration !== undefined) {
      masterBar.duration = duration;
    }

    const affectedBars = new Set<Bar>();
    for (const track of score.tracks) {
      for (const staff of track.staves) {
        for (const bar of staff.bars) {
          if (bar.masterBar === masterBar) {
            affectedBars.add(bar);
          }
        }
      }
    }

    this.rebuildBars(affectedBars);
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
   * Set beat duration
   * @param beat Beat
   * @param newDuration New duration
   */
  public static setDuration<I extends MusicInstrument>(
    beat: Beat<I>,
    newDuration: NoteDuration
  ): void {
    beat.baseDuration = newDuration;
    beat.bar.rebuildTiming();
  }

  public static setDurations<I extends MusicInstrument>(
    beats: Beat<I>[],
    newDuration: NoteDuration
  ): void {
    for (const beat of beats) {
      beat.baseDuration = newDuration;
    }

    this.rebuildAffectedBars(beats);
  }

  public static restoreDurations<I extends MusicInstrument>(
    beats: Beat<I>[],
    oldDurationMap: Map<number, NoteDuration>
  ): void {
    for (const beat of beats) {
      beat.baseDuration = oldDurationMap.get(beat.uuid) ?? NoteDuration.Quarter;
    }

    this.rebuildAffectedBars(beats);
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
    }

    this.rebuildAffectedBars(beats);
  }

  public static restoreDots<I extends MusicInstrument>(
    beats: Beat<I>[],
    oldDotsMap: Map<number, number>
  ): void {
    for (const beat of beats) {
      beat.dots = (oldDotsMap.get(beat.uuid) ?? 0) as BeatDots;
    }

    this.rebuildAffectedBars(beats);
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
      beat.bar.rebuildTiming();
      return;
    }

    beat.tupletSettings = {
      normalCount: newSettings.normalCount,
      tupletCount: newSettings.tupletCount,
    };
    beat.bar.rebuildTiming();
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
    }

    this.rebuildAffectedBars(beats);
  }

  public static restoreTuplets<I extends MusicInstrument>(
    beats: Beat<I>[],
    oldTupletMap: Map<number, TupletSettings | null>
  ): void {
    for (const beat of beats) {
      const oldTuplet = oldTupletMap.get(beat.uuid) ?? null;
      beat.tupletSettings =
        oldTuplet !== null
          ? {
              normalCount: oldTuplet.normalCount,
              tupletCount: oldTuplet.tupletCount,
            }
          : null;
    }

    this.rebuildAffectedBars(beats);
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

  public static removeBars(
    score: Score,
    indices: number[]
  ): MasterBarArrayOperationOutput[] {
    const uniqueIndices = Array.from(new Set(indices)).sort((a, b) => a - b);
    const outputs: MasterBarArrayOperationOutput[] = [];

    for (let i = uniqueIndices.length - 1; i >= 0; i--) {
      outputs.unshift(score.removeMasterBar(uniqueIndices[i]));
    }

    return outputs;
  }

  // Future direction: once TabUI has explicit rests/gaps and a clear invariant
  // for complete bars, paste/replacement can become rhythm-aware. Until then,
  // these operations intentionally match the liberal beat-editing model: they
  // insert/remove beats locally and allow bars to become underfilled/overfilled.
  public static insertBeats<I extends MusicInstrument>(
    bar: Bar<I>,
    beatIndex: number,
    beats: Beat<I>[],
    replaceSeedBeat: boolean = false
  ): Beat<I>[] {
    if (beats.length === 0) {
      return [];
    }

    if (replaceSeedBeat && bar.isEmpty()) {
      bar.beats.splice(0, 1);
      beatIndex = 0;
    }

    const insertedBeats = beats.map((beat) =>
      this.createBeatCopyForBar(bar, beat)
    );
    bar.beats.splice(beatIndex, 0, ...insertedBeats);
    bar.rebuildTiming();

    return insertedBeats;
  }

  /**
   * Replaces selected beats with new beats at the selection start. This is not
   * duration-aware: multi-bar selections may leave later bars underfilled and
   * longer clipboard content may overfill the first affected bar.
   * @param oldBeats Old beats
   * @param newBeats New beats
   */
  public static replaceBeats<I extends MusicInstrument>(
    oldBeats: Beat<I>[],
    newBeats: Beat<I>[]
  ): Beat<I>[] {
    if (oldBeats.length === 0 || newBeats.length === 0) {
      return [];
    }

    const startBeatIndex = oldBeats[0].bar.beats.indexOf(oldBeats[0]);
    const startBar = oldBeats[0].bar;
    const affectedBars = new Set(oldBeats.map((beat) => beat.bar));
    const replaceSeedBeat =
      startBeatIndex === 0 &&
      oldBeats.filter((b) => b.bar === startBar).length ===
        startBar.beats.length;

    this.removeBeats(oldBeats);
    for (const bar of affectedBars) {
      bar.rebuildTiming();
    }

    return this.insertBeats(
      startBar,
      startBeatIndex,
      newBeats,
      replaceSeedBeat
    );
  }
}
