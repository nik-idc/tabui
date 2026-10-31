import { Bar, type VoiceBarContentSnapshot } from "../bar";
import { Beat } from "../beat";
import type { SetTechniqueOptions } from "./set-technique-options";
import { GuitarNote } from "../guitar-note";
import { MusicInstrument } from "../instrument/instrument";
import { type MasterBarData } from "../master-bar";
import {
  Note,
  NoteValue,
  LOWEST_OCTAVE,
  HIGHEST_OCTAVE,
  getNoteFromSemitones,
  getSemitonesFromNote,
} from "../note";
import { NoteDuration } from "../note-duration";
import type {
  Score,
  MasterBarArrayOperationOutput,
  TimeSignatureChange,
} from "../score";
import { GuitarTechniqueType, type TechniqueType } from "../technique-type";
import { TupletSettings, tupletSettingsEqual } from "../tuplet-settings";
import {
  BeatArrayOperationOutput,
  BeatRemovalOutput,
  VoiceBar,
  VoiceNumber,
} from "../voice-bar";
import { EditPosition } from "./edit-position";
import type { BeatPosition, NotePosition } from "./edit-position";
import { LetRingEditing } from "./let-ring-editing";
import { TechniqueEditing } from "./technique-editing";
import type { TechniqueEditPlan, TieEditPlan } from "./technique-edit-plan";
import { TieEditing } from "./tie-editing";
import {
  addDurations,
  fractionEq,
  fractionLt,
  getBeatDuration,
  subtractDurations,
} from "../timing";

export type { BeatPosition, NotePosition } from "./edit-position";
export type { TimeSignatureChange } from "../score";
export { TechniqueEditKind } from "./technique-edit-plan";
export type {
  TieEditPlan,
  OrdinaryTechniquePlan,
  TechniqueEditPlan,
} from "./technique-edit-plan";

/** Beat content and original position recorded for a later restore operation. */
export type BeatRestoreSnapshot<I extends MusicInstrument = MusicInstrument> = {
  /** Original owning voice bar, kept by reference. */
  voiceBar: VoiceBar<I>;
  /** Zero-based insertion position in that voice. */
  index: number;
  /** Saved beat content to copy back into the voice. */
  beat: Beat<I>;
};

/** Fixed note content addressed by voice and position, so history can replace beat objects. */
export type BeatSnapshot = BeatPosition & {
  /** Saved slot content, or null for an explicit rest. */
  notes: Note[] | null;
};

/** Saved bar content and the original voice bars needed for undo and redo. */
export type BarContentSnapshot<I extends MusicInstrument = MusicInstrument> = {
  /** Original bar, retained across history. */
  bar: Bar<I>;
  /** Present slots only; omitted slots must remain absent on restore. */
  voiceBars: VoiceBarContentSnapshot<I>[];
};

/** Bars, voice bars, and nearby beats that a paste may change. */
type PasteChanges<I extends MusicInstrument> = {
  beatsByBars: Map<Bar<I>, Beat<I>[]>;
  bars: Bar<I>[];
  changedVoiceBars: VoiceBar<I>[];
  affectedBeats: Set<Beat>;
  neighborBeats: Beat[];
  originalVoiceBars: Set<VoiceBar<I>>;
  createdContent: Bar[];
};

/** A copy of bar and nearby note content, saved before or after a paste. */
type PasteSnapshot<I extends MusicInstrument> = {
  bars: BarContentSnapshot<I>[];
  created: BarContentSnapshot[];
  neighbors: BeatSnapshot[];
};

/** Paste results and saved content used by commands for undo and redo. */
export type BeatPasteOutput<I extends MusicInstrument = MusicInstrument> = {
  /** Pasted clipboard beats, not including the original beats that followed them. */
  insertedBeats: Beat<I>[];
  /** Original affected bar contents. */
  before: BarContentSnapshot<I>[];
  /** Saved content after the paste, including all new bars. */
  after: BarContentSnapshot[];
  /** New bars and their matching staff bars, kept for undo and redo. */
  createdBars: MasterBarArrayOperationOutput[];
  /** Nearby notes saved before invalid techniques are removed. */
  neighborsBefore: BeatSnapshot[];
  /** Nearby notes saved after invalid techniques are removed. */
  neighborsAfter: BeatSnapshot[];
};

/**
 * Standalone score-editing helpers that change models and rebuild affected timing.
 * Calls do not create editor undo history, redraw views, or guarantee host events; failures may leave partial changes.
 */
export class ScoreEditor {
  // History and positions

  /** Records a live beat's address without retaining its object identity. */
  public static getBeatPosition<I extends MusicInstrument>(
    beat: Beat<I>
  ): BeatPosition {
    return EditPosition.getBeatPosition(beat);
  }

  /** Resolves an address against the current voice content, not a detached history copy. */
  public static resolveBeatPosition<I extends MusicInstrument>(
    position: BeatPosition & { voiceBar: VoiceBar<I> }
  ): Beat<I> {
    return EditPosition.resolveBeatPosition(position);
  }

  /** Resolves saved content positions against the live beats restored by later commands. */
  public static resolveBeatPositions<I extends MusicInstrument>(
    positions: (BeatPosition & { voiceBar: VoiceBar<I> })[]
  ): Beat<I>[] {
    return positions.map((p) => this.resolveBeatPosition(p));
  }

  /** Keeps only installed beats after a structural edit has removed some candidates. */
  public static getLiveBeats<I extends MusicInstrument>(
    beats: Beat<I>[]
  ): Beat<I>[] {
    return beats.filter(
      (b) =>
        b.voiceBar.bar.staff.bars.includes(b.voiceBar.bar) &&
        b.voiceBar.bar.getVoiceBar(b.voiceBar.voiceNumber) === b.voiceBar &&
        b.voiceBar.beats.includes(b)
    );
  }

  /** Finds next-beat ties and following empty markers that can lose support after a content edit. */
  public static getNoteEditBeats<I extends MusicInstrument>(
    beats: Beat<I>[],
    stringNumber?: number
  ): Beat<I>[] {
    return LetRingEditing.getNoteEditBeats(beats, stringNumber);
  }

  /** Finds existing boundary content at a normalized insertion index before clipboard beats shift it. */
  public static getInsertionEditBeats<I extends MusicInstrument>(
    voiceBar: VoiceBar<I>,
    index: number
  ): Beat<I>[] {
    const boundaryBeat = voiceBar.beats[index] ?? voiceBar.beats[index - 1];
    return boundaryBeat === undefined
      ? []
      : this.getNoteEditBeats([boundaryBeat]);
  }

  /** Finds written content at bar edit boundaries across all staves and voices. */
  public static getBarEditBeats(score: Score, indices: number[]): Beat[] {
    const beats = score.tracks.flatMap((t) =>
      t.staves.flatMap((s) =>
        indices.flatMap(
          (i) => s.bars[i]?.voiceBarsAsArray.flatMap((v) => v.beats) ?? []
        )
      )
    );
    return this.getNoteEditBeats(beats);
  }

  /** Saves fixed note content at positions that survive later beat replacement during history. */
  public static snapshotBeatNotes(beats: Beat[]): BeatSnapshot[] {
    return beats.map((b) => ({
      voiceBar: b.voiceBar,
      index: b.voiceBar.beats.indexOf(b),
      notes: b.notes?.map((n) => n.deepCopy(b)) ?? null,
    }));
  }

  /** Restores rests first, then fixed slot content, without repeating dependency discovery. */
  public static restoreBeatSnapshots(snapshots: BeatSnapshot[]): void {
    const beats = this.resolveBeatPositions(snapshots);
    for (const [i, snapshot] of snapshots.entries()) {
      if (snapshot.notes === null) {
        beats[i].makeRest();
      }
    }

    for (const [i, snapshot] of snapshots.entries()) {
      if (snapshot.notes === null) {
        continue;
      }

      beats[i].makeBeatWithNotes();
      for (const [j, note] of snapshot.notes.entries()) {
        beats[i].setNote(j, note);
      }
    }
  }

  // Note editing

  /** Enters a fret and normalizes the changed string's downstream content. */
  public static setFret(
    beat: Beat,
    stringNumber: number,
    fret: number | null
  ): void {
    const affected = this.getFretEditBeats(beat, stringNumber, fret);
    beat.makeBeatWithNotes();
    const note = beat.notes?.[stringNumber - 1];
    if (!(note instanceof GuitarNote)) {
      throw Error("Can't set fret of a non-guitar note");
    }
    const notes = this.getConnectedTieNotes(note);
    const editableNotes =
      typeof fret === "number" &&
      fret >= 0 &&
      note.fret !== null &&
      note.fret >= 0
        ? notes
        : [note];
    for (const chainNote of editableNotes) {
      chainNote.setFret(fret, false);
    }
    this.normalizeNoteContent(affected);
  }

  /** Finds the fixed beats affected by a fret edit before the target is materialized. */
  public static getFretEditBeats(
    beat: Beat,
    stringNumber: number,
    fret: number | null
  ): Beat[] {
    const note = beat.notes?.[stringNumber - 1];
    if (
      !(note instanceof GuitarNote) ||
      typeof fret !== "number" ||
      fret < 0 ||
      note.fret === null ||
      note.fret < 0
    ) {
      return this.getNoteEditBeats([beat], stringNumber);
    }
    return this.getConnectedTieEditBeats(note);
  }

  /** Enters pitch without inheriting markers from neighboring slots. */
  public static setNote(
    beat: Beat,
    stringNumber: number,
    value: NoteValue,
    octave: number | null
  ): void {
    const affected = this.getNoteEditBeats([beat], stringNumber);
    beat.makeBeatWithNotes();
    const note = beat.notes?.[stringNumber - 1];
    if (note === undefined) {
      throw Error("Can't set a note outside the beat's note lanes");
    }
    if (value === NoteValue.None || value === NoteValue.Dead) {
      note.noteValue = value;
      note.octave = octave;
    } else {
      note.setNote(value, octave);
    }
    this.normalizeNoteContent(affected);
  }

  private static validateShiftPitch(semitones: number): void {
    if (!Number.isFinite(semitones) || !Number.isInteger(semitones)) {
      throw Error("Pitch shift must be an integer");
    }
  }

  /** Expands guitar notes to their connected, valid same-string tie chains. */
  public static getConnectedTieNotes(target: Beat[] | Note): GuitarNote[] {
    const candidates = Array.isArray(target)
      ? target.flatMap((b) => b.notes ?? [])
      : [target];
    const notes = new Set<GuitarNote>();
    for (const candidate of candidates) {
      if (
        !(candidate instanceof GuitarNote) ||
        candidate.fret === null ||
        candidate.fret < 0
      ) {
        continue;
      }

      for (const chainNote of this.getConnectedTieChain(candidate)) {
        notes.add(chainNote);
      }
    }
    return [...notes];
  }

  private static getConnectedTieChain(note: GuitarNote): GuitarNote[] {
    const chain = new Set<GuitarNote>([note]);
    let current = note;
    while (current.isTieContinuation) {
      const previous = current.beat.voiceBar.bar.staff.getPrevBeat(current.beat)
        ?.notes?.[current.stringNum - 1];
      if (
        !(previous instanceof GuitarNote) ||
        previous.stringNum !== current.stringNum ||
        previous.fret !== current.fret
      ) {
        break;
      }
      chain.add(previous);
      current = previous;
    }

    current = note;
    while (true) {
      const next = current.beat.voiceBar.bar.staff.getNextBeat(current.beat)
        ?.notes?.[current.stringNum - 1];
      if (
        !(next instanceof GuitarNote) ||
        next.stringNum !== current.stringNum ||
        next.fret === null ||
        next.fret < 0 ||
        !next.isTieContinuation ||
        next.fret !== current.fret
      ) {
        break;
      }
      chain.add(next);
      current = next;
    }
    return [...chain];
  }

  /** Returns whether a target's playable notes are within shift limits */
  public static canShiftPitch(
    target: Beat[] | Note,
    semitones: number
  ): boolean {
    this.validateShiftPitch(semitones);
    const notes = this.getConnectedTieNotes(target);
    if (notes.length === 0 || semitones === 0) {
      return false;
    }

    return notes.every((note) => {
      const fret = (note.fret as number) + semitones;
      if (fret < 0 || fret > note.trackContext.instrument.fretsCount) {
        return false;
      }
      if (note.octave === null) {
        return false;
      }
      const pitch = getNoteFromSemitones(
        getSemitonesFromNote(note.noteValue, note.octave) + semitones
      );
      return pitch.octave >= LOWEST_OCTAVE && pitch.octave <= HIGHEST_OCTAVE;
    });
  }

  /** Finds beats that must be saved when a pitch edit can change ties or markers. */
  public static getConnectedTieEditBeats(target: Beat[] | Note): Beat[] {
    return this.getTieChainEditBeats(this.getConnectedTieNotes(target));
  }

  /** Finds history and normalization neighbors for an already expanded tie target. */
  public static getTieChainEditBeats(notes: GuitarNote[]): Beat[] {
    const beats = new Set<Beat>();
    for (const note of notes) {
      beats.add(note.beat);
      const previous = note.beat.voiceBar.bar.staff.getPrevBeat(note.beat);
      if (previous !== null) {
        beats.add(previous);
      }
      for (const beat of this.getNoteEditBeats([note.beat], note.stringNum)) {
        beats.add(beat);
      }
    }
    return [...beats];
  }

  /** Shifts selected playable guitar pitches and their connected valid tie chains atomically. */
  public static applyShift(target: Beat[] | Note, semitones: number): Beat[] {
    this.validateShiftPitch(semitones);
    if (!this.canShiftPitch(target, semitones)) {
      return [];
    }

    const notes = this.getConnectedTieNotes(target);
    const affectedBeats = this.getTieChainEditBeats(notes);
    for (const note of notes) {
      const pitch = getNoteFromSemitones(
        getSemitonesFromNote(note.noteValue, note.octave as number) + semitones
      );
      note.setNote(pitch.noteValue, pitch.octave, false);
    }
    this.normalizeNoteContent(affectedBeats);
    return affectedBeats;
  }

  /** Changes rest state in one voice and removes unsupported following markers. */
  public static setRest(beats: Beat[], rest: boolean): void {
    const affected = this.getNoteEditBeats(beats);
    for (const beat of beats) {
      if (rest) {
        beat.makeRest();
      } else {
        beat.makeBeatWithNotes();
      }
    }
    this.normalizeNoteContent(affected);
  }

  /**
   * Removes the technique if every eligible selected guitar slot has it and no bend options are supplied.
   * Otherwise, attempts to apply or update it on each guitar note.
   * Tie uses the previous beat unless earliest-source search is requested.
   * @param notes Live selected notes; non-guitar notes are skipped. Ordinary techniques use note-level applicability rules.
   * @param type Technique to toggle.
   * @param options Bend settings or Tie search mode; each applies only to its technique.
   * @returns True if any note changed.
   * @throws If bend options are missing when required or invalid for the technique. Transition lookup can also throw if a note's beat is a rest.
   */
  public static setTechniqueForNotes<I extends MusicInstrument>(
    notes: Note<I>[],
    type: TechniqueType,
    options: SetTechniqueOptions = {}
  ): boolean {
    return TechniqueEditing.setTechniqueForNotes(notes, type, options);
  }

  /** Resolves selected live slots; rests contribute no notes for ordinary techniques. */
  public static getTechniqueNotes(
    targets: (BeatPosition | NotePosition)[]
  ): Note[] {
    return TechniqueEditing.getTechniqueNotes(targets);
  }

  /** Records explicit note positions without treating them as whole-beat edits. */
  public static getTechniqueTargetsForNotes(notes: Note[]): NotePosition[] {
    return EditPosition.getTechniqueTargetsForNotes(notes);
  }

  /** Checks selection eligibility using the requested Tie search mode; applied techniques remain removable. */
  public static canSetTechnique(
    beats: Beat[],
    type: TechniqueType,
    stringNumber?: number,
    options: SetTechniqueOptions = {}
  ): boolean {
    return TechniqueEditing.canSetTechnique(beats, type, stringNumber, options);
  }

  /** Plans techniques using the requested Tie search mode, without changing content. */
  public static buildTechniquePlan(
    targets: (BeatPosition | NotePosition)[],
    type: TechniqueType,
    options: SetTechniqueOptions = {}
  ): TechniqueEditPlan {
    return TechniqueEditing.buildTechniquePlan(targets, type, options);
  }

  /** Applies fixed prepared operations; history redo should restore saved content instead. */
  public static applyTechniquePlan(plan: TechniqueEditPlan): boolean {
    return TechniqueEditing.applyTechniquePlan(plan);
  }

  /**
   * Joins notes to the previous beat, or removes ties when all selected playable notes have them.
   * @param beats Live selected beats, processed in input order; rests can become continuations, but stop backward searches.
   * @param stringNumber One-based string to edit; omitted copies whole chords, searching each string independently.
   * @param searchToEarliest Search through empty slots and matching frets instead of only the previous beat.
   * @returns Unique affected beats, including predecessors for tie display; empty if no playable source or tie to remove exists.
   */
  public static setTieBeats(
    beats: Beat[],
    stringNumber?: number,
    searchToEarliest = false
  ): Beat[] {
    return TieEditing.setTieBeats(beats, stringNumber, searchToEarliest);
  }

  /** Ties explicit slots to the previous beat or earliest source, preserving other strings. */
  public static setTieNotes(notes: Note[], searchToEarliest = false): Beat[] {
    return TieEditing.setTieNotes(notes, searchToEarliest);
  }

  /** Plans previous-beat or earliest-source ties; whole-beat targets replace chords, string targets preserve other strings. */
  public static buildTiePlan(
    targets: (BeatPosition | NotePosition)[],
    searchToEarliest = false
  ): TieEditPlan {
    return TieEditing.buildTiePlan(targets, searchToEarliest);
  }

  /** Plans beat/chord ties using the requested search mode; earlier targets inform later searches. */
  public static buildTiePlanForBeats(
    beats: Beat[],
    stringNumber?: number,
    searchToEarliest = false
  ): TieEditPlan {
    return TieEditing.buildTiePlanForBeats(
      beats,
      stringNumber,
      searchToEarliest
    );
  }

  /** Plans note-slot ties using the requested search mode, preserving other strings. */
  public static buildTiePlanForNotes(
    notes: Note[],
    searchToEarliest = false
  ): TieEditPlan {
    return TieEditing.buildTiePlanForNotes(notes, searchToEarliest);
  }

  /** Applies a prepared plan without searching again; save affected beats before this model boundary. */
  public static applyTiePlan(plan: TieEditPlan): Beat[] {
    return TieEditing.applyTiePlan(plan);
  }

  /** Removes unsupported empty markers after edits; playable marked notes start independent passages. */
  public static normalizeNoteContent(beats: Beat[]): void {
    LetRingEditing.normalizeNoteContent(beats);
  }

  // Beat structure

  /** Copies saved content into original voices while removing replacement content and recorded generated rests atomically per bar. */
  public static restoreBeats<I extends MusicInstrument>(
    snapshots: BeatRestoreSnapshot<I>[],
    replacedBeats: Beat<I>[] = [],
    normalization: Pick<BeatRemovalOutput<I>, "inserted">[] = []
  ): Beat<I>[] {
    const restoredBeats: Beat<I>[] = [];
    const bars = new Set([
      ...snapshots.map((s) => s.voiceBar.bar),
      ...replacedBeats.map((b) => b.voiceBar.bar),
      ...normalization.flatMap((o) =>
        o.inserted.flatMap((i) => i.beats.map((b) => b.voiceBar.bar))
      ),
    ]);
    for (const bar of bars) {
      const voices = new Set(
        snapshots.filter((s) => s.voiceBar.bar === bar).map((s) => s.voiceBar)
      );
      const insertions = [...voices].map((voiceBar) => {
        const voiceSnapshots = snapshots
          .filter((s) => s.voiceBar === voiceBar)
          .sort((a, b) => a.index - b.index);
        return {
          voiceBar,
          index: voiceSnapshots[0].index,
          beats: voiceSnapshots.map((s) => s.beat),
        };
      });
      restoredBeats.push(
        ...bar.restoreBeats(
          insertions,
          replacedBeats.filter((b) => b.voiceBar.bar === bar),
          normalization.map((o) => ({
            inserted: o.inserted.filter((i) => i.beats[0].voiceBar.bar === bar),
          }))
        )
      );
    }
    return restoredBeats;
  }

  /** Delegates restoration and generated-rest removal to each bar, retaining input removal order. */
  public static undoBeatRemovals<I extends MusicInstrument>(
    outputs: BeatRemovalOutput<I>[]
  ): Beat<I>[] {
    const restored = new Map<BeatRemovalOutput<I>, Beat<I>[]>();
    const bars = new Set(outputs.map((o) => o.removed.beats[0].voiceBar.bar));
    for (const bar of bars) {
      const removals = outputs.filter(
        (o) => o.removed.beats[0].voiceBar.bar === bar
      );
      const beats = bar.restoreBeatRemovals(removals);
      for (const removal of removals) {
        restored.set(removal, beats.splice(0, removal.removed.beats.length));
      }
    }
    return outputs.flatMap((o) => {
      const beats = restored.get(o);
      if (beats === undefined) {
        throw Error("Missing restored removal");
      }
      return beats;
    });
  }

  /** Resolves sequential removal coordinates before applying the model's atomic removal operation. */
  public static redoBeatRemovals<I extends MusicInstrument>(
    outputs: BeatRemovalOutput<I>[]
  ): BeatRemovalOutput<I>[] {
    const beats = outputs.map((o) => ({
      voiceBar: o.removed.beats[0].voiceBar,
      index: o.removed.index,
    }));
    // Recorded indexes include earlier removal shifts, not original coordinates.
    for (let i = 0; i < beats.length; i++) {
      for (let j = i - 1; j >= 0; j--) {
        const sameVoice = beats[i].voiceBar === beats[j].voiceBar;
        const followsRemoval = beats[i].index >= outputs[j].removed.index;
        if (sameVoice && followsRemoval) {
          beats[i].index += outputs[j].removed.beats.length;
        }
      }
    }
    return this.removeBeats(
      beats.map((position) => this.resolveBeatPosition(position))
    );
  }

  /** Inserts a blank beat at an index from zero through the beat count, inheriting Let Ring between marked neighbors. Other indexes throw. */
  public static insertBeat(
    voiceBar: VoiceBar,
    index: number
  ): BeatArrayOperationOutput {
    const result = voiceBar.insertBeat(index);
    LetRingEditing.inheritBlankMarkers(result.beats);
    return result;
  }

  /** Appends the usual rest, or a blank slot when both cross-bar neighbors mark an existing passage. */
  public static appendBeat(voiceBar: VoiceBar): BeatArrayOperationOutput {
    const result = voiceBar.appendBeats();
    LetRingEditing.inheritAppendMarkers(result.beats);
    return result;
  }

  /** Copies content from the changed voice bars and keeps the original voice bars and beats for undo. */
  private static getBarSnapshot<I extends MusicInstrument>(
    bar: Bar<I>,
    changedVoiceBars: VoiceBar<I>[] = bar.voiceBarsAsArray
  ): BarContentSnapshot<I> {
    return {
      bar,
      voiceBars: bar.voiceBarsAsArray.map((voiceBar) => ({
        voiceBar,
        beats: changedVoiceBars.includes(voiceBar)
          ? voiceBar.beats.map((beat) => ({
              beat,
              content: beat.deepCopy(voiceBar),
            }))
          : undefined,
      })),
    };
  }

  /** Gets the bars and voice bars a paste may change, including nearby notes whose techniques may change. */
  private static getPasteChanges<I extends MusicInstrument>(
    voiceBar: VoiceBar<I>,
    selected: Beat<I>[]
  ): PasteChanges<I> {
    const score = voiceBar.bar.staff.track.score;
    const beatsByBars = this.groupBeatsByBar(selected);
    const bars = [...new Set([voiceBar.bar, ...beatsByBars.keys()])];
    const changedVoiceBars = [
      ...new Set([voiceBar, ...selected.map((b) => b.voiceBar)]),
    ];
    const boundary = score.masterBars.indexOf(voiceBar.bar.masterBar) + 1;
    const boundaryBeats = this.getBarEditBeats(score, [boundary - 1, boundary]);
    const affectedBeats = new Set<Beat>(
      this.getNoteEditBeats([...voiceBar.beats, ...selected])
    );
    for (const beat of boundaryBeats) {
      affectedBeats.add(beat);
    }
    const changedVoiceBarSet = new Set<VoiceBar>(changedVoiceBars);
    const neighborBeats = [...affectedBeats].filter(
      (b) => !changedVoiceBarSet.has(b.voiceBar)
    );
    return {
      beatsByBars,
      bars,
      changedVoiceBars,
      affectedBeats,
      neighborBeats,
      originalVoiceBars: new Set(bars.flatMap((b) => b.voiceBarsAsArray)),
      createdContent: [],
    };
  }

  /** Copies the affected bar and note content for undo and redo. Used before and after the paste. */
  private static getPasteSnapshot<I extends MusicInstrument>(
    changes: PasteChanges<I>,
    neighborBeats: Beat[]
  ): PasteSnapshot<I> {
    return {
      bars: changes.bars.map((bar) =>
        this.getBarSnapshot(bar, changes.changedVoiceBars)
      ),
      created: changes.createdContent.map((bar) => this.getBarSnapshot(bar)),
      neighbors: this.snapshotBeatNotes(neighborBeats),
    };
  }

  /**
   * Includes new bars and voice bars in redo history,
   * including voice bars created when a bar becomes empty.
   */
  private static addCreatedBars<I extends MusicInstrument>(
    changes: PasteChanges<I>,
    createdBars: MasterBarArrayOperationOutput[]
  ): void {
    for (const bar of changes.bars) {
      for (const voiceBar of bar.voiceBarsAsArray) {
        if (!changes.originalVoiceBars.has(voiceBar)) {
          changes.changedVoiceBars.push(voiceBar);
          changes.originalVoiceBars.add(voiceBar);
        }
      }
    }
    for (const created of createdBars) {
      changes.createdContent.push(...created.bars.values());
    }
  }

  /** Creates the next bar on every staff with the same time signature and tempo, but no repeat marks. Returns the voice bar for pasted beats. */
  private static createOverflowBar<I extends MusicInstrument>(
    voiceBar: VoiceBar<I>,
    createdBars: MasterBarArrayOperationOutput[]
  ): VoiceBar<I> {
    const score = voiceBar.bar.staff.track.score;
    const created = score.insertMasterBar(
      score.masterBars.indexOf(voiceBar.bar.masterBar) + createdBars.length + 1,
      {
        tempo: voiceBar.bar.masterBar.tempo,
        beatsCount: voiceBar.bar.masterBar.beatsCount,
        duration: voiceBar.bar.masterBar.duration,
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      },
      voiceBar.voiceNumber
    );
    createdBars.push(created);
    const targetBar = voiceBar.bar.staff.bars[created.index];
    if (targetBar === undefined) {
      throw Error("Created overflow bar is missing from the destination staff");
    }
    const targetVoiceBar = targetBar.getVoiceBar(voiceBar.voiceNumber);
    if (targetVoiceBar === null) {
      throw Error("Created overflow bar is missing the destination voice bar");
    }
    return targetVoiceBar;
  }

  /** Inserts clipboard beats followed by the original remaining beats. Creates a new bar when the next beat does not fit. */
  private static insertBeatsIntoBars<I extends MusicInstrument>(
    voiceBar: VoiceBar<I>,
    insertionIndex: number,
    source: Beat<I>[],
    tail: Beat<I>[]
  ): {
    createdBars: MasterBarArrayOperationOutput[];
    insertedBeats: Beat<I>[];
  } {
    const capacity = voiceBar.bar.masterBar.barDurationFraction;
    const stream = [...source, ...tail];
    const createdBars: MasterBarArrayOperationOutput[] = [];
    const insertedBeats: Beat<I>[] = [];
    let destination = voiceBar;
    let used = voiceBar.beats
      .slice(0, insertionIndex)
      .reduce((total, beat) => addDurations(total, getBeatDuration(beat)), {
        numerator: 0,
        denominator: 1,
      });
    let destinationHasContent = insertionIndex > 0;
    let firstDestinationEdit = true;

    for (const [streamIndex, beat] of stream.entries()) {
      const duration = getBeatDuration(beat);
      const remaining = subtractDurations(capacity, used);
      const fits =
        fractionLt(duration, remaining) || fractionEq(duration, remaining);
      if (destinationHasContent && !fits) {
        destination = this.createOverflowBar(voiceBar, createdBars);
        used = { numerator: 0, denominator: 1 };
        firstDestinationEdit = true;
      }

      const clipboardBeat = streamIndex < source.length;
      const copy =
        !clipboardBeat && beat.voiceBar === destination
          ? beat
          : beat.deepCopy(destination);
      const removed = firstDestinationEdit
        ? destination === voiceBar
          ? []
          : [...destination.beats]
        : [];
      destination.bar.replaceSelectedBeats(removed, [
        {
          voiceBar: destination,
          index: firstDestinationEdit
            ? destination === voiceBar
              ? insertionIndex
              : 0
            : destination.beats.length,
          beats: [copy],
        },
      ]);
      firstDestinationEdit = false;
      if (clipboardBeat) {
        insertedBeats.push(copy);
      }
      used = addDurations(used, duration);
      destinationHasContent = true;
    }

    return {
      insertedBeats,
      createdBars,
    };
  }

  /** Removes invalid Tie, Let Ring, and Palm Mute marks after all beats are in place. */
  private static removeInvalidPasteTechniques<I extends MusicInstrument>(
    affectedBeats: Set<Beat>,
    insertedBeats: Beat<I>[],
    createdBars: MasterBarArrayOperationOutput[]
  ): void {
    const createdContent = createdBars.flatMap((b) => [...b.bars.values()]);
    const cleanup = this.getLiveBeats([
      ...affectedBeats,
      ...insertedBeats,
      ...createdContent.flatMap((b) =>
        b.voiceBarsAsArray.flatMap((v) => v.beats)
      ),
    ]);
    for (const beat of cleanup) {
      for (const note of beat.notes ?? []) {
        if (
          note instanceof GuitarNote &&
          note.hasTechnique(GuitarTechniqueType.Tie) &&
          !note.isTieContinuation
        ) {
          note.removeTechnique(GuitarTechniqueType.Tie);
        }
      }
    }
    this.normalizeNoteContent(cleanup);
  }

  /** Inserts clipboard beats, moving the original remaining beats after them. Returns saved content for undo and redo. */
  public static insertBeats<I extends MusicInstrument>(
    voiceBar: VoiceBar<I>,
    index: number,
    beats: Beat<I>[],
    selected: Beat<I>[] = []
  ): BeatPasteOutput<I> {
    if (beats.length === 0) {
      return {
        insertedBeats: [],
        before: [],
        after: [],
        createdBars: [],
        neighborsBefore: [],
        neighborsAfter: [],
      };
    }
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index > voiceBar.beats.length
    ) {
      throw Error(`${index} is invalid beat index`);
    }

    const replacePlaceholder =
      selected.length === 0 &&
      voiceBar.beats.length === 1 &&
      voiceBar.beats[0].isEmpty();
    const pasteSelection = replacePlaceholder ? [...voiceBar.beats] : selected;

    const insertionIndex = replacePlaceholder ? 0 : index;
    const changes = this.getPasteChanges(voiceBar, pasteSelection);
    const before = this.getPasteSnapshot(changes, changes.neighborBeats);
    // Remove selected beats from other bars, keeping those bars and their unselected beats.
    for (const [bar, beats] of changes.beatsByBars) {
      if (bar !== voiceBar.bar) {
        bar.replaceSelectedBeats(beats);
      }
    }
    const tail = voiceBar.beats
      .slice(insertionIndex)
      .filter((b) => !pasteSelection.includes(b));

    // Remove the old tail before testing the first clipboard beat, so an
    // oversized first beat cannot leave displaced content in the source bar.
    const oldTail = voiceBar.beats.slice(insertionIndex);
    voiceBar.bar.replaceSelectedBeats(oldTail, [], false);
    const insertResult = this.insertBeatsIntoBars(
      voiceBar,
      insertionIndex,
      beats,
      tail
    );
    this.removeInvalidPasteTechniques(
      changes.affectedBeats,
      insertResult.insertedBeats,
      insertResult.createdBars
    );
    this.addCreatedBars(changes, insertResult.createdBars);
    const after = this.getPasteSnapshot(
      changes,
      this.getLiveBeats(changes.neighborBeats)
    );
    return {
      insertedBeats: insertResult.insertedBeats,
      before: before.bars,
      after: [...after.bars, ...after.created],
      createdBars: insertResult.createdBars,
      neighborsBefore: before.neighbors,
      neighborsAfter: after.neighbors,
    };
  }

  /**
   * Removes live beats in input order, normalizing empty voices and rebuilding timing.
   * @param beats Beats still present in their owning voices; duplicates are not supported.
   * @param normalize False defers content validation until a replacement or history restore finishes.
   * @returns Removal positions, removed beats, and fallback-rest/voice changes for restoration.
   * @throws If a beat is absent, staff counts are inconsistent, or timing rebuild fails.
   */
  public static removeBeats<I extends MusicInstrument>(
    beats: Beat<I>[],
    normalize: boolean = true
  ): BeatRemovalOutput<I>[] {
    beats = [...beats];
    const affected = this.getNoteEditBeats(beats);
    const results = new Map<Beat<I>, BeatRemovalOutput<I>>();
    for (const [bar, selected] of this.groupBeatsByBar(beats)) {
      const result = bar.replaceSelectedBeats(selected);
      for (const [i, beat] of selected.entries()) {
        results.set(beat, result.removals[i]);
      }
    }

    if (normalize) {
      this.normalizeNoteContent(this.getLiveBeats(affected));
    }
    return beats.map((b) => {
      const output = results.get(b);
      if (output === undefined) {
        throw Error("Missing beat removal");
      }
      return output;
    });
  }

  /** Removes selected beats and packs the clipboard at their original start, keeping all original bars. */
  public static replaceBeats<I extends MusicInstrument>(
    oldBeats: Beat<I>[],
    newBeats: Beat<I>[]
  ): BeatPasteOutput<I> {
    if (oldBeats.length === 0 || newBeats.length === 0) {
      return {
        insertedBeats: [],
        before: [],
        after: [],
        createdBars: [],
        neighborsBefore: [],
        neighborsAfter: [],
      };
    }
    const invalidSelection =
      new Set(oldBeats).size !== oldBeats.length ||
      oldBeats.some((b) => !b.voiceBar.beats.includes(b));
    if (invalidSelection) {
      throw Error("Beat is absent or selected twice");
    }
    const voiceBar = oldBeats[0].voiceBar;
    const index = voiceBar.beats.indexOf(oldBeats[0]);
    return this.insertBeats(voiceBar, index, newBeats, oldBeats);
  }

  /** Restores the saved content from before a paste and removes the bars it created. */
  public static restoreBeforePaste<I extends MusicInstrument>(
    score: Score,
    output: BeatPasteOutput<I>
  ): void {
    for (const created of [...output.createdBars].reverse()) {
      score.removeMasterBar(score.masterBars.indexOf(created.masterBar));
    }
    for (const snapshot of output.before) {
      snapshot.bar.restoreVoiceBars(snapshot.voiceBars);
    }

    // Restore nearby notes after their original bars and beats are back in place.
    this.restoreBeatSnapshots(output.neighborsBefore);
  }

  /** Restores the saved content from after a paste, including the same created bar objects. */
  public static restoreAfterPaste<I extends MusicInstrument>(
    score: Score,
    output: BeatPasteOutput<I>
  ): void {
    for (const created of output.createdBars) {
      score.insertReadyMasterBar(
        created.index,
        created.masterBar,
        created.bars
      );
    }
    for (const snapshot of output.after) {
      snapshot.bar.restoreVoiceBars(snapshot.voiceBars);
    }

    // Use saved note content rather than checking technique rules again.
    this.restoreBeatSnapshots(output.neighborsAfter);
  }

  /** Groups a selection in one pass without searching the score or rescanning it for each bar. */
  private static groupBeatsByBar<I extends MusicInstrument>(
    beats: Beat<I>[]
  ): Map<Bar<I>, Beat<I>[]> {
    const groups = new Map<Bar<I>, Beat<I>[]>();
    for (const beat of beats) {
      const bar = beat.voiceBar.bar;
      const group = groups.get(bar);
      if (group === undefined) {
        groups.set(bar, [beat]);
      } else {
        group.push(beat);
      }
    }
    return groups;
  }

  // Bar structure

  /**
   * Inserts a master bar and corresponding bars on every staff.
   * @param index Integer insertion position from zero through the number of master bars.
   * @param masterBarData Meter, tempo, and repeat settings for the new master bar.
   * @param voiceNumber Voice slot to create with a quarter rest on each staff.
   * @returns Live master/staff bars and insertion position.
   * @throws If the index, master-bar settings, or new voice timing are invalid.
   */
  public static insertMasterBar(
    score: Score,
    index: number,
    masterBarData: MasterBarData,
    voiceNumber: VoiceNumber
  ): MasterBarArrayOperationOutput {
    const affected = this.getBarEditBeats(score, [index]);
    const result = score.insertMasterBar(index, masterBarData, voiceNumber);
    for (const bar of result.bars.values()) {
      for (const voice of bar.voiceBarsAsArray) {
        LetRingEditing.inheritBlankMarkers(voice.beats);
      }
    }
    this.normalizeNoteContent(affected);
    return result;
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
    const affected = this.getBarEditBeats(score, uniqueIndices);

    for (let i = uniqueIndices.length - 1; i >= 0; i--) {
      outputs.unshift(score.removeMasterBar(uniqueIndices[i]));
    }

    this.normalizeNoteContent(this.getLiveBeats(affected));
    return outputs;
  }

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

  // Rhythm and meter

  /**
   * Applies complete meters and rebuilds matching voices across all tracks, preserving note content even when overfull.
   * @param changes Master bars with numerator counts and written denominator durations.
   * @throws If a meter count is outside supported bounds or timing/beaming rebuild fails.
   */
  public static setTimeSignatures(
    score: Score,
    changes: TimeSignatureChange[]
  ): void {
    score.setTimeSignatures(changes);
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
    Beat.updateRhythm([{ beat, duration: newDuration }]);
  }

  /**
   * Sets written durations and rebuilds each affected voice once.
   * @throws If updated rhythm or beaming cannot be rebuilt.
   */
  public static setDurations<I extends MusicInstrument>(
    beats: Beat<I>[],
    newDuration: NoteDuration
  ): void {
    Beat.updateRhythm(beats.map((beat) => ({ beat, duration: newDuration })));
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
    Beat.updateRhythm(
      beats.map((beat) => ({
        beat,
        duration: oldDurationMap.get(beat.uuid) ?? NoteDuration.Quarter,
      }))
    );
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
      beats.length > 0 && beats.every((b) => b.dots === newDots);
    Beat.updateRhythm(
      beats.map((beat) => ({ beat, dots: removeDots ? 0 : newDots }))
    );
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
    Beat.updateRhythm(
      beats.map((beat) => ({ beat, dots: oldDotsMap.get(beat.uuid) ?? 0 }))
    );
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

    Beat.updateRhythm([
      { beat, tupletSettings: sameSettings ? null : newSettings },
    ]);
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
    Beat.updateRhythm(
      beats.map((beat) => ({
        beat,
        tupletSettings: removeTuplet ? null : tupletSettings,
      }))
    );
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
    Beat.updateRhythm(
      beats.map((beat) => ({
        beat,
        tupletSettings: oldTupletMap.get(beat.uuid) ?? null,
      }))
    );
  }
}
