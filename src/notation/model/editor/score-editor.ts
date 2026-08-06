import {
  BendTechniqueOptions,
  MasterBar,
  MasterBarData,
  MasterBarArrayOperationOutput,
  Score,
  TechniqueType,
  TupletSettings,
  tupletSettingsEqual,
} from "..";
import { Bar } from "../bar";
import { Beat, BeatDots } from "../beat";
import { MusicInstrument } from "../instrument/instrument";
import { GuitarNote } from "../guitar-note";
import { Note, NoteValue } from "../note";
import { NoteDuration } from "../note-duration";
import { BeatRemovalOutput, VoiceBar } from "../voice-bar";
import { VoiceNumber } from "../voice-bar";

export type BeatRestoreSnapshot<I extends MusicInstrument = MusicInstrument> = {
  voiceBar: VoiceBar<I>;
  index: number;
  beat: Beat<I>;
};

export type BeatReplacementOutput<I extends MusicInstrument = MusicInstrument> =
  {
    insertedBeats: Beat<I>[];
    removalOutputs: BeatRemovalOutput<I>[];
  };

/**
 * Static class containing complex editing methods,
 * like replace beats across the staff, transpose note etc
 */
export class ScoreEditor {
  public static ensureVoiceBar(bar: Bar, voiceNumber: VoiceNumber): boolean {
    const voiceBarInserted = bar.getVoiceBar(voiceNumber) === null;
    bar.ensureVoiceBar(voiceNumber);
    return voiceBarInserted;
  }

  private static rebuildBars<I extends MusicInstrument>(
    voiceBars: Set<VoiceBar<I>>
  ): void {
    for (const voiceBar of voiceBars) {
      voiceBar.rebuildTiming();
    }
  }

  private static rebuildAffectedBars<I extends MusicInstrument>(
    beats: Beat<I>[]
  ): void {
    this.rebuildBars(new Set(beats.map((beat) => beat.voiceBar)));
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

    if (sourceBeat.notes === null) {
      targetBeat.makeRest();
      return;
    }

    targetBeat.makeBeatWithNotes();
    if (targetBeat.notes === null) {
      throw Error("Failed to convert rest beat to note beat");
    }

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
    voiceBar: VoiceBar<I>,
    sourceBeat: Beat<I>
  ): Beat<I> {
    const beat = new Beat<I>(
      voiceBar,
      voiceBar.trackContext,
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

  public static insertMasterBar(
    score: Score,
    index: number,
    masterBarData: MasterBarData,
    voiceNumber: VoiceNumber
  ): MasterBarArrayOperationOutput {
    return score.insertMasterBar(index, masterBarData, voiceNumber);
  }

  public static appendMasterBar(
    score: Score,
    masterBarData: MasterBarData,
    voiceNumber: VoiceNumber
  ): MasterBarArrayOperationOutput {
    return score.appendMasterBar(masterBarData, voiceNumber);
  }

  public static prependMasterBar(
    score: Score,
    masterBarData: MasterBarData,
    voiceNumber: VoiceNumber
  ): MasterBarArrayOperationOutput {
    return score.prependMasterBar(masterBarData, voiceNumber);
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

    const affectedVoiceBars = new Set<VoiceBar>();
    for (const track of score.tracks) {
      for (const staff of track.staves) {
        for (const bar of staff.bars) {
          if (bar.masterBar === masterBar) {
            for (const voiceBar of bar.voiceBarsAsArray) {
              affectedVoiceBars.add(voiceBar);
            }
          }
        }
      }
    }

    this.rebuildBars(affectedVoiceBars);
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
    const removeFromSelection = hasAnyWithTechnique && bendOptions === null;

    for (const note of notes) {
      if (!(note instanceof GuitarNote)) {
        continue;
      }

      if (removeFromSelection && !note.hasTechnique(type)) {
        continue;
      }

      if (note.setTechnique(type, bendOptions)) {
        changesMade = true;
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
    beat.voiceBar.rebuildTiming();
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
      beat.voiceBar.rebuildTiming();
      return;
    }

    beat.tupletSettings = {
      normalCount: newSettings.normalCount,
      tupletCount: newSettings.tupletCount,
    };
    beat.voiceBar.rebuildTiming();
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
  ): BeatRemovalOutput<I>[] {
    const outputs: BeatRemovalOutput<I>[] = [];
    for (const beat of beats) {
      const beatIndex = beat.voiceBar.beats.indexOf(beat);
      outputs.push(beat.voiceBar.removeBeat(beatIndex));
    }

    return outputs;
  }

  /**
   * Discards beats inserted by a prior removal to preserve model invariants.
   */
  public static discardBeatRemovalInsertions<I extends MusicInstrument>(
    outputs: BeatRemovalOutput<I>[]
  ): void {
    for (let i = outputs.length - 1; i >= 0; i--) {
      const output = outputs[i];
      for (let j = output.inserted.length - 1; j >= 0; j--) {
        const insertion = output.inserted[j];
        const voiceBar = insertion.beats[0].voiceBar;
        const presentBeats = insertion.beats.filter((beat) =>
          voiceBar.beats.includes(beat)
        );
        if (
          presentBeats.length !== 0 &&
          presentBeats.length === voiceBar.beats.length
        ) {
          voiceBar.bar.staff.recordVoiceBarRemoved(voiceBar);
        }
        for (const beat of presentBeats) {
          const beatIndex = voiceBar.beats.indexOf(beat);
          if (beatIndex !== -1) {
            voiceBar.beats.splice(beatIndex, 1);
          }
        }
        voiceBar.rebuildTiming();
      }
    }
  }

  /**
   * Removes beats as a setup step before restoring other beats into the same
   * location. Any default rest inserted by the removal invariant is discarded so
   * the restore does not leave extra content behind.
   */
  public static prepareBeatRestore<I extends MusicInstrument>(
    beats: Beat<I>[]
  ): BeatRemovalOutput<I>[] {
    const outputs = this.removeBeats(beats);
    this.discardBeatRemovalInsertions(outputs);

    return outputs;
  }

  /**
   * Undoes prior beat removals from recorded removal metadata. If a removal
   * inserted a default rest to keep the voice bar non-empty, that temporary rest
   * is removed before the original beats are restored.
   */
  public static undoBeatRemovals<I extends MusicInstrument>(
    outputs: BeatRemovalOutput<I>[]
  ): Beat<I>[] {
    const restoredBeats: Beat<I>[] = [];
    for (let i = outputs.length - 1; i >= 0; i--) {
      const output = outputs[i];
      this.discardBeatRemovalInsertions([output]);
      const voiceBar = output.removed.beats[0].voiceBar;
      if (output.removedVoiceNumbers !== null) {
        voiceBar.bar.restoreVoiceBar(voiceBar);
      }
      restoredBeats.unshift(
        ...voiceBar.insertBeats(output.removed.index, output.removed.beats)
      );
    }

    return restoredBeats;
  }

  /**
   * Reapplies prior beat removals from recorded removal metadata. Returns fresh
   * removal metadata because the redo may insert new default rests.
   */
  public static redoBeatRemovals<I extends MusicInstrument>(
    outputs: BeatRemovalOutput<I>[]
  ): BeatRemovalOutput<I>[] {
    const reappliedOutputs: BeatRemovalOutput<I>[] = [];
    for (const output of outputs) {
      const voiceBar = output.removed.beats[0].voiceBar;
      reappliedOutputs.push(voiceBar.removeBeat(output.removed.index));
    }

    return reappliedOutputs;
  }

  /**
   * Restores beat snapshots grouped by their original voice bar and insertion
   * index. Used by commands that snapshot beat content separately from a removal
   * operation, such as replacement undo.
   */
  public static restoreBeats<I extends MusicInstrument>(
    snapshots: BeatRestoreSnapshot<I>[]
  ): Beat<I>[] {
    const restoredBeats: Beat<I>[] = [];
    const voiceBars = new Set(snapshots.map((snapshot) => snapshot.voiceBar));
    for (const voiceBar of voiceBars) {
      const barSnapshots = snapshots
        .filter((snapshot) => snapshot.voiceBar === voiceBar)
        .sort((a, b) => a.index - b.index);
      const index = Math.min(...barSnapshots.map((snapshot) => snapshot.index));
      const beats = barSnapshots.map((snapshot) => snapshot.beat);
      if (voiceBar.bar.getVoiceBar(voiceBar.voiceNumber) !== voiceBar) {
        voiceBar.bar.restoreVoiceBar(voiceBar);
      }
      restoredBeats.push(...voiceBar.insertBeats(index, beats));
    }

    return restoredBeats;
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
    voiceBar: VoiceBar<I>,
    beatIndex: number,
    beats: Beat<I>[]
  ): Beat<I>[] {
    if (beats.length === 0) {
      return [];
    }

    const wasEmpty = voiceBar.isEmpty();
    const insertedBeats = beats.map((beat) =>
      this.createBeatCopyForBar(voiceBar, beat)
    );
    voiceBar.beats.splice(beatIndex, 0, ...insertedBeats);
    if (wasEmpty) {
      voiceBar.bar.staff.recordVoiceBarAdded(voiceBar);
    }
    voiceBar.rebuildTiming();

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
  ): BeatReplacementOutput<I> {
    if (oldBeats.length === 0 || newBeats.length === 0) {
      return { insertedBeats: [], removalOutputs: [] };
    }

    const startBeatIndex = oldBeats[0].voiceBar.beats.indexOf(oldBeats[0]);
    const startVoiceBar = oldBeats[0].voiceBar;
    const affectedVoiceBars = new Set(oldBeats.map((beat) => beat.voiceBar));

    const removalOutputs = this.removeBeats(oldBeats);
    const startBarOutputs = removalOutputs.filter(
      (o) => o.removed.beats[0].voiceBar.bar === startVoiceBar.bar
    );
    this.discardBeatRemovalInsertions(startBarOutputs);
    if (
      startVoiceBar.bar.getVoiceBar(startVoiceBar.voiceNumber) !== startVoiceBar
    ) {
      startVoiceBar.bar.restoreVoiceBar(startVoiceBar);
    }
    for (const voiceBar of affectedVoiceBars) {
      voiceBar.rebuildTiming();
    }

    return {
      insertedBeats: this.insertBeats(startVoiceBar, startBeatIndex, newBeats),
      removalOutputs,
    };
  }
}
