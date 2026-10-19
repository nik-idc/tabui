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
import { Note } from "../note";
import { NoteDuration } from "../note-duration";
import { BeatRemovalOutput, VoiceBar } from "../voice-bar";
import { VoiceNumber } from "../voice-bar";

/** Beat content and original position recorded for a later restore operation. */
export type BeatRestoreSnapshot<I extends MusicInstrument = MusicInstrument> = {
  /** Original owning voice bar, kept by reference. */
  voiceBar: VoiceBar<I>;
  /** Zero-based insertion position in that voice. */
  index: number;
  /** Saved beat content to copy back into the voice. */
  beat: Beat<I>;
};

/** A complete meter value to apply to one master bar. */
export type TimeSignatureChange = {
  masterBar: MasterBar;
  beatsCount: number;
  duration: NoteDuration;
};

/** Live inserted beats and removal metadata needed to reverse a replacement. */
export type BeatReplacementOutput<I extends MusicInstrument = MusicInstrument> =
  {
    /** New copies installed at the selection start. */
    insertedBeats: Beat<I>[];
    /** Removal and fallback-rest changes for each removed beat. */
    removalOutputs: BeatRemovalOutput<I>[];
  };

/**
 * Standalone score-editing helpers that change models and rebuild affected timing.
 * Calls do not create editor undo history, redraw views, or guarantee host events; failures may leave partial changes.
 */
export class ScoreEditor {
  /**
   * Ensures a voice slot exists, initially with a quarter rest.
   * @returns True if a voice was created, false if it already existed.
   * @throws If the new voice's timing cannot be rebuilt.
   */
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
      targetBeat.setNote(i, sourceBeat.notes[i]);
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

  /**
   * Inserts a master bar and corresponding bars on every staff.
   * @param index Zero-based insertion position, using array-splice semantics.
   * @param masterBarData Meter, tempo, and repeat settings for the new master bar.
   * @param voiceNumber Voice slot to create with a quarter rest on each staff.
   * @returns Live master/staff bars and insertion position.
   * @throws If master-bar settings or new voice timing are invalid.
   */
  public static insertMasterBar(
    score: Score,
    index: number,
    masterBarData: MasterBarData,
    voiceNumber: VoiceNumber
  ): MasterBarArrayOperationOutput {
    return score.insertMasterBar(index, masterBarData, voiceNumber);
  }

  /**
   * Appends a master bar and corresponding bars on every staff.
   * @param voiceNumber Voice slot to create with a quarter rest on each staff.
   * @returns Live master/staff bars and their zero-based insertion position.
   * @throws If master-bar settings or new voice timing are invalid.
   */
  public static appendMasterBar(
    score: Score,
    masterBarData: MasterBarData,
    voiceNumber: VoiceNumber
  ): MasterBarArrayOperationOutput {
    return score.appendMasterBar(masterBarData, voiceNumber);
  }

  /**
   * Prepends a master bar and corresponding bars on every staff.
   * @param voiceNumber Voice slot to create with a quarter rest on each staff.
   * @returns Live master/staff bars at insertion index zero.
   * @throws If master-bar settings or new voice timing are invalid.
   */
  public static prependMasterBar(
    score: Score,
    masterBarData: MasterBarData,
    voiceNumber: VoiceNumber
  ): MasterBarArrayOperationOutput {
    return score.prependMasterBar(masterBarData, voiceNumber);
  }

  /**
   * Applies complete meters and rebuilds matching voices across all tracks, preserving note content even when overfull.
   * @param changes Master bars with numerator counts and written denominator durations.
   * @throws If a meter count is outside supported bounds or timing/beaming rebuild fails.
   */
  public static setTimeSignatures(
    score: Score,
    changes: TimeSignatureChange[]
  ): void {
    const masterBars = new Set(changes.map((v) => v.masterBar));
    for (const change of changes) {
      change.masterBar.beatsCount = change.beatsCount;
      change.masterBar.duration = change.duration;
    }

    const affectedVoiceBars = new Set<VoiceBar>();
    for (const track of score.tracks) {
      for (const staff of track.staves) {
        for (const bar of staff.bars) {
          if (masterBars.has(bar.masterBar)) {
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
   * Removes the technique if every non-empty guitar note in the selection has it and no bend options are supplied.
   * Otherwise, attempts to apply or update it on each guitar note.
   * @param notes Live selected notes; non-guitar notes are skipped and note-level applicability rules apply.
   * @param type Technique to toggle.
   * @param bendOptions Required when adding a bend; supplying options updates existing bends.
   * @returns True if any note changed.
   * @throws If bend options are missing when required or invalid for the technique. Transition lookup can also throw if a note's beat is a rest.
   */
  public static setTechniqueNotes<I extends MusicInstrument>(
    notes: Note<I>[],
    type: TechniqueType,
    bendOptions: BendTechniqueOptions | null = null
  ): boolean {
    let changesMade = false;
    const applicableNotes = notes.filter(
      (note) => note instanceof GuitarNote && note.fret !== null
    );
    const hasAllWithTechnique =
      applicableNotes.length > 0 &&
      applicableNotes.every((note) => note.hasTechnique(type));
    const removeFromSelection = hasAllWithTechnique && bendOptions === null;

    for (const note of notes) {
      if (!(note instanceof GuitarNote)) {
        continue;
      }

      if (removeFromSelection && !note.hasTechnique(type)) {
        continue;
      }

      if (
        !removeFromSelection &&
        bendOptions === null &&
        note.hasTechnique(type)
      ) {
        continue;
      }

      if (note.setTechnique(type, bendOptions)) {
        changesMade = true;
      }
    }

    return changesMade;
  }
  /**
   * Sets written duration and rebuilds the owning voice's timing and beaming.
   * @param beat Beat
   * @param newDuration New duration
   * @throws If timing or beaming cannot be rebuilt.
   */
  public static setDuration<I extends MusicInstrument>(
    beat: Beat<I>,
    newDuration: NoteDuration
  ): void {
    beat.baseDuration = newDuration;
    beat.voiceBar.rebuildTiming();
  }

  /**
   * Sets written durations and rebuilds each affected voice once.
   * @throws If updated rhythm or beaming cannot be rebuilt.
   */
  public static setDurations<I extends MusicInstrument>(
    beats: Beat<I>[],
    newDuration: NoteDuration
  ): void {
    for (const beat of beats) {
      beat.baseDuration = newDuration;
    }

    this.rebuildAffectedBars(beats);
  }

  /**
   * Restores written durations and rebuilds affected voices.
   * @param oldDurationMap Durations keyed by beat UUID; missing entries use a quarter note.
   * @throws If restored rhythm or beaming cannot be rebuilt.
   */
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
   * Sets dots on all selected beats, or clears them if all already have that count; rebuilds affected voices.
   * @param beats Live beats to update.
   * @param newDots Dot count: 0, 1, or 2.
   * @throws If the count is unsupported or timing/beaming rebuild fails.
   */
  public static setDots<I extends MusicInstrument>(
    beats: Beat<I>[],
    newDots: number
  ): void {
    if (newDots !== 0 && newDots !== 1 && newDots !== 2) {
      throw Error(`${newDots} is an invalid dots value`);
    }

    const removeDots =
      beats.length > 0 && beats.every((beat) => beat.dots === newDots);
    for (const beat of beats) {
      beat.dots = (removeDots ? 0 : newDots) as BeatDots;
    }

    this.rebuildAffectedBars(beats);
  }

  /**
   * Restores augmentation dots and rebuilds affected voices.
   * @param oldDotsMap Counts keyed by beat UUID; missing entries use zero dots.
   * @throws If a restored dot count is unsupported or timing/beaming rebuild fails.
   */
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
   * Updates only this beat's tuplet settings and rebuilds its voice's derived groups and timing.
   * @param beat Live beat to update.
   * @param newSettings Omitted, null, or matching settings clear the tuplet.
   * @throws If settings are outside supported bounds or timing/beaming rebuild fails.
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
   * Applies copied tuplet settings to selected beats and rebuilds affected voices.
   * @param beats Live beats to update.
   * @param tupletSettings Null or settings shared by every selected beat clear the tuplets.
   * @throws If settings are outside supported bounds or timing/beaming rebuild fails.
   */
  public static setTuplet<I extends MusicInstrument>(
    beats: Beat<I>[],
    tupletSettings: TupletSettings | null
  ): void {
    const removeTuplet =
      beats.length > 0 &&
      beats.every((b) => tupletSettingsEqual(b.tupletSettings, tupletSettings));
    for (const beat of beats) {
      beat.tupletSettings =
        removeTuplet || tupletSettings === null
          ? null
          : {
              normalCount: tupletSettings.normalCount,
              tupletCount: tupletSettings.tupletCount,
            };
    }

    this.rebuildAffectedBars(beats);
  }

  /**
   * Restores copied tuplet settings and rebuilds affected voices.
   * @param oldTupletMap Settings keyed by beat UUID; missing entries remove tuplets.
   * @throws If restored settings are outside supported bounds or timing/beaming rebuild fails.
   */
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
   * Removes live beats in input order, normalizing empty voices and rebuilding timing.
   * @param beats Beats still present in their owning voices; duplicates are not supported.
   * @returns Removal positions, removed beats, and fallback-rest/voice changes for restoration.
   * @throws If a beat is absent, staff counts are inconsistent, or timing rebuild fails.
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
   * Use only with matching live removal metadata before restoring content; voices can remain empty.
   * @throws If staff counts are inconsistent or timing rebuild fails.
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
   * @returns Live removal metadata; callers must complete restoration to refill empty voices.
   * @throws If a beat is absent, staff counts are inconsistent, or timing rebuild fails.
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
   * @param outputs Metadata from the matching removals, with owning voices still available.
   * @returns Live inserted copies in original removal order.
   * @throws If restoration indexes, note data, staff counts, or timing are invalid.
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
   * @param outputs Matching removal metadata after undo has restored the original positions.
   * @throws If recorded positions no longer exist or timing/bookkeeping fails.
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
   * Copies snapshots into each original voice, ordered by saved index and inserted together at its lowest saved index.
   * @param snapshots Matching saved content and live owning voices; remove replacement content first.
   * @returns Live inserted copies, grouped by voice in first-seen order.
   * @throws If restoration indexes, note data, staff counts, or timing are invalid.
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

  /**
   * Removes score-wide bars at unique indexes, processing from last to first.
   * @param indices Zero-based master-bar indexes before removal.
   * @returns Removal metadata ordered by ascending original index.
   * @throws If an index is outside the score or removal would leave no master/staff bar.
   */
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
  /**
   * Copies beat content into one voice and rebuilds timing, allowing underfill or overfill.
   * @param beatIndex Zero-based insertion position, using array-splice semantics.
   * @param beats Content to copy; an empty array has no effect.
   * @returns Live inserted copies, adapted to the destination's note-slot count.
   * @throws If copying note/rhythm data or rebuilding timing fails.
   */
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
   * @param oldBeats Live beats to remove, with the insertion location first.
   * @param newBeats Content to copy into the first affected voice.
   * @returns Inserted copies and removal metadata; both are empty if either input is empty.
   * @throws If a selected beat is absent or copying, bookkeeping, or timing rebuild fails.
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
