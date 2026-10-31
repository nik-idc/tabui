import { randomInt } from "../../shared";
import { MusicInstrument } from "./instrument/instrument";
import { MasterBar } from "./master-bar";
import { TrackContext } from "./track-context";
import { Staff } from "./staff";
import { Beat } from "./beat";
import {
  BeatArrayOperationOutput,
  BeatRemovalOutput,
  VoiceBar,
  VoiceNumber,
} from "./voice-bar";

/** Content copied into an original voice bar at an index in the current edit. */
export type BeatInsertion<I extends MusicInstrument = MusicInstrument> = {
  /** Original voice bar, reinstalled when an earlier edit removed its slot. */
  voiceBar: VoiceBar<I>;
  /** Position after preceding removals and insertions in this edit. */
  index: number;
  /** Prepared destination-owned beats installed without another copy. */
  beats: Beat<I>[];
};

/** A saved voice bar with optional fixed beat content for history. */
export type VoiceBarContentSnapshot<
  I extends MusicInstrument = MusicInstrument,
> = {
  /** Original voice bar to reinstall. */
  voiceBar: VoiceBar<I>;
  /** Saved content and original beat objects; omitted for an unchanged voice bar. */
  beats?: { beat: Beat<I>; content: Beat<I> }[];
};

/** Shared list of the four voice slots, in ascending order. */
export const VOICE_NUMBERS: VoiceNumber[] = [1, 2, 3, 4];

/**
 * Class that represents a musical bar
 */
export class Bar<I extends MusicInstrument = MusicInstrument> {
  /** Fallback voice number where otherwise the entire bar will be empty */
  private static readonly _fallbackVoiceNumber: VoiceNumber = 1;

  /** Bar's unqiue identifier */
  readonly uuid: number;
  /** Staff in which the bar lives */
  readonly staff: Staff<I>;
  /** Track context */
  readonly trackContext: TrackContext<I>;
  /** Reference to the master bar the bar belongs to */
  readonly masterBar: MasterBar;

  /** Voice-local musical content for this shared staff bar. */
  private _voiceBars: Record<VoiceNumber, VoiceBar<I> | null>;

  /**
   * Creates a staff bar sharing its meter and tempo with a master bar.
   * @param staff Staff in which the bar lives
   * @param trackContext Track context
   * @param masterBar Master bar
   * @param voiceBars Live voice-slot map; null slots are absent. Omitted creates four null slots, with no default voice.
   */
  constructor(
    staff: Staff<I>,
    trackContext: TrackContext<I>,
    masterBar: MasterBar,
    voiceBars?: Record<VoiceNumber, VoiceBar<I> | null>
  ) {
    this.uuid = randomInt();
    this.staff = staff;
    this.trackContext = trackContext;
    this.masterBar = masterBar;

    this._voiceBars = voiceBars
      ? voiceBars
      : {
          1: null,
          2: null,
          3: null,
          4: null,
        };
  }

  /**
   * Replaces a voice slot with a new voice bar, updating staff bookkeeping.
   * @param beats Existing beat references; an empty array creates a quarter rest.
   * @returns The installed voice bar.
   * @throws If beat timing/beaming is invalid or staff counts are inconsistent.
   */
  public insertVoiceBar(
    voiceNumber: VoiceNumber,
    beats: Beat<I>[] = []
  ): VoiceBar<I> {
    const voiceBar = new VoiceBar(this, this.trackContext, voiceNumber, beats);
    const oldVoiceBar = this._voiceBars[voiceNumber];
    if (oldVoiceBar !== null) {
      this.staff.recordVoiceBarRemoved(oldVoiceBar);
    }
    this._voiceBars[voiceNumber] = voiceBar;
    this.staff.recordVoiceBarAdded(voiceBar);
    return voiceBar;
  }

  /**
   * Returns the voice slot, creating it with a quarter rest if absent.
   * @throws If the new voice's timing cannot be rebuilt.
   */
  public ensureVoiceBar(voiceNumber: VoiceNumber): VoiceBar<I> {
    return this.getVoiceBar(voiceNumber) ?? this.insertVoiceBar(voiceNumber);
  }

  /**
   * Clears a voice slot and keeps at least one beat in the bar.
   * @throws If removing a non-empty voice would make the staff count negative.
   */
  public removeVoiceBar(voiceNumber: VoiceNumber): void {
    this.clearVoiceBar(voiceNumber);
    this.resolveEmptyVoiceBars();
  }

  /** Clears a slot during a structural edit without normalizing intermediate content. */
  private clearVoiceBar(voiceNumber: VoiceNumber): void {
    const voiceBar = this._voiceBars[voiceNumber];
    if (voiceBar !== null) {
      this.staff.recordVoiceBarRemoved(voiceBar);
    }
    this._voiceBars[voiceNumber] = null;
  }

  /**
   * Reinstalls a voice bar in its numbered slot and rebuilds its timing.
   * @param voiceBar Original voice bar belonging to this bar; it is not copied.
   * @throws If timing/beaming cannot be rebuilt or staff counts are inconsistent.
   */
  public restoreVoiceBar(voiceBar: VoiceBar<I>): void {
    const oldVoiceBar = this._voiceBars[voiceBar.voiceNumber];
    if (oldVoiceBar !== null) {
      this.staff.recordVoiceBarRemoved(oldVoiceBar);
    }
    this._voiceBars[voiceBar.voiceNumber] = voiceBar;
    voiceBar.rebuildTiming();
    this.staff.recordVoiceBarAdded(voiceBar);
    this.resolveEmptyVoiceBars();
  }

  /** Replaces one voice with owned beat references and normalizes the completed bar. */
  public replaceVoiceBeats(voiceBar: VoiceBar<I>, beats: Beat<I>[]): void {
    if (voiceBar.bar !== this) {
      throw Error("Voice belongs to another bar");
    }
    this.clearVoiceBar(voiceBar.voiceNumber);
    voiceBar.beats.splice(0, voiceBar.beats.length, ...beats);
    this._voiceBars[voiceBar.voiceNumber] = voiceBar;
    voiceBar.rebuildTiming();
    this.staff.recordVoiceBarAdded(voiceBar);
    this.resolveEmptyVoiceBars();
  }

  /**
   * Installs prepared destination-owned beats, then normalizes this bar once.
   * @param [normalize=true]  False keeps an empty voice bar attached until a structural edit completes.
   */
  public replaceSelectedBeats(
    beats: Beat<I>[],
    insertions: BeatInsertion<I>[] = [],
    normalize: boolean = true
  ): { removals: BeatRemovalOutput<I>[]; insertedBeats: Beat<I>[] } {
    beats = [...beats];
    insertions = insertions.map((i) => ({ ...i, beats: [...i.beats] }));
    const voices = new Set([
      ...beats.map((b) => b.voiceBar),
      ...insertions.map((i) => i.voiceBar),
    ]);
    for (const voice of voices) {
      if (voice.bar !== this) {
        throw Error("Beat edit belongs to another bar");
      }
    }
    const duplicateBeats = new Set(beats).size !== beats.length;
    const absentBeat = beats.some((b) => !b.voiceBar.beats.includes(b));
    if (duplicateBeats || absentBeat) {
      throw Error("Beat is absent or selected twice");
    }

    // Validate the whole insertion plan before changing content or staff counts.
    const lengths = new Map<VoiceBar<I>, number>();
    for (const beat of beats) {
      const voice = beat.voiceBar;
      const length = lengths.get(voice) ?? voice.beats.length;
      lengths.set(voice, length - 1);
    }
    for (const { voiceBar, index, beats } of insertions) {
      const length = lengths.get(voiceBar) ?? voiceBar.beats.length;
      if (!Number.isInteger(index) || index < 0 || index > length) {
        throw Error(`${index} is invalid beat index`);
      }
      if (beats.some((b) => b.voiceBar !== voiceBar)) {
        throw Error("Inserted beat belongs to another voice bar");
      }
      lengths.set(voiceBar, length + beats.length);
    }

    for (const voice of voices) {
      if (this.getVoiceBar(voice.voiceNumber) === voice) {
        this.staff.recordVoiceBarRemoved(voice);
      }
    }
    const removals: BeatRemovalOutput<I>[] = [];
    for (const beat of beats) {
      const index = beat.voiceBar.beats.indexOf(beat);
      removals.push({
        removed: { index, beats: beat.voiceBar.beats.splice(index, 1) },
        inserted: [],
        removedVoiceNumbers: null,
      });
    }
    const insertedBeats: Beat<I>[] = [];
    for (const insertion of insertions) {
      const { voiceBar, index } = insertion;
      const oldVoice = this.getVoiceBar(voiceBar.voiceNumber);
      if (oldVoice !== voiceBar) {
        if (oldVoice !== null && !voices.has(oldVoice)) {
          this.staff.recordVoiceBarRemoved(oldVoice);
        }
        this._voiceBars[voiceBar.voiceNumber] = voiceBar;
      }
      voiceBar.beats.splice(index, 0, ...insertion.beats);
      insertedBeats.push(...insertion.beats);
    }
    for (const voice of voices) {
      voice.rebuildTiming();
      if (this.getVoiceBar(voice.voiceNumber) === voice) {
        this.staff.recordVoiceBarAdded(voice);
      }
    }
    const normalization = normalize
      ? this.resolveEmptyVoiceBars()
      : { inserted: [], removedVoiceNumbers: null };
    const lastRemoval = removals[removals.length - 1];
    if (lastRemoval !== undefined) {
      lastRemoval.inserted = normalization.inserted;
      lastRemoval.removedVoiceNumbers = normalization.removedVoiceNumbers;
    }
    return { removals, insertedBeats };
  }

  /** Restores saved insertions and removes matching generated rests in the same atomic edit. */
  public restoreBeats(
    insertions: BeatInsertion<I>[],
    replacedBeats: Beat<I>[] = [],
    normalization: Pick<BeatRemovalOutput<I>, "inserted">[] = []
  ): Beat<I>[] {
    const present: Beat<I>[] = [];
    for (const output of normalization) {
      for (const insertion of output.inserted) {
        for (const [offset, generated] of insertion.beats.entries()) {
          const voice = this.getVoiceBar(generated.voiceBar.voiceNumber);
          const beat = voice?.beats[insertion.index + offset];
          const matches =
            beat !== undefined && beat.isMatchingFallbackRest(generated);
          if (beat !== undefined && (beat === generated || matches)) {
            present.push(beat);
          }
        }
      }
    }
    const removed = [...new Set([...replacedBeats, ...present])];
    const prepared = insertions.map((i) => ({
      ...i,
      beats: i.beats.map((b) => b.deepCopy(i.voiceBar)),
    }));
    return this.replaceSelectedBeats(removed, prepared).insertedBeats;
  }

  /** Restores saved voice bars in their slots, without creating new fallback voice bars. */
  public restoreVoiceBars(voiceBars: VoiceBarContentSnapshot<I>[]): void {
    for (const number of VOICE_NUMBERS) {
      this.clearVoiceBar(number);
    }
    for (const { voiceBar, beats } of voiceBars) {
      if (beats !== undefined) {
        for (const { beat, content } of beats) {
          beat.restoreContent(content);
        }
        voiceBar.beats.splice(
          0,
          voiceBar.beats.length,
          ...beats.map((b) => b.beat)
        );
        voiceBar.rebuildTiming();
      }
      this._voiceBars[voiceBar.voiceNumber] = voiceBar;
      this.staff.recordVoiceBarAdded(voiceBar);
    }
  }

  /** Reverses recorded removals in reverse order, including their fallback-rest changes. */
  public restoreBeatRemovals(outputs: BeatRemovalOutput<I>[]): Beat<I>[] {
    const insertions = [...outputs].reverse().map((o) => ({
      voiceBar: o.removed.beats[0].voiceBar,
      index: o.removed.index,
      beats: o.removed.beats,
    }));
    const restored = this.restoreBeats(insertions, [], outputs);
    const groups = insertions.map((i) => restored.splice(0, i.beats.length));
    return groups.reverse().flat();
  }

  /**
   * Removes empty voices; if no voice has beats, gives voice 1 a quarter rest.
   * @returns Inserted-rest metadata and removed voice numbers; removedVoiceNumbers is null when no slots were removed.
   * @throws If fallback-rest timing cannot be rebuilt.
   */
  public resolveEmptyVoiceBars(): {
    inserted: BeatArrayOperationOutput<I>[];
    removedVoiceNumbers: VoiceNumber[] | null;
  } {
    const inserted: BeatArrayOperationOutput<I>[] = [];
    const removedVoiceNumbers: VoiceNumber[] = [];

    const hasContent = this.voiceBarsAsArray.some((vb) => !vb.isEmpty());
    const voiceNumberToKeep = hasContent ? null : Bar._fallbackVoiceNumber;

    for (const voiceBar of this.voiceBarsAsArray) {
      if (!voiceBar.isEmpty() || voiceBar.voiceNumber === voiceNumberToKeep) {
        continue;
      }

      this.clearVoiceBar(voiceBar.voiceNumber);
      removedVoiceNumbers.push(voiceBar.voiceNumber);
    }

    if (voiceNumberToKeep !== null) {
      const keptVoiceBar = this.getVoiceBar(voiceNumberToKeep);
      if (keptVoiceBar === null) {
        const created = this.insertVoiceBar(voiceNumberToKeep);
        inserted.push({ index: 0, beats: [...created.beats] });
      } else {
        const rest = new Beat(keptVoiceBar, this.trackContext, null);
        keptVoiceBar.beats.push(rest);
        keptVoiceBar.rebuildTiming();
        this.staff.recordVoiceBarAdded(keptVoiceBar);
        inserted.push({ index: 0, beats: [rest] });
      }
      for (const insertion of inserted) {
        for (const beat of insertion.beats) {
          beat.markFallbackRest();
        }
      }
    }

    return {
      inserted,
      removedVoiceNumbers:
        removedVoiceNumbers.length === 0 ? null : removedVoiceNumbers,
    };
  }

  /** Returns the live voice bar, or null for an absent voice slot. */
  public getVoiceBar(voiceNumber: VoiceNumber): VoiceBar<I> | null {
    return this._voiceBars[voiceNumber];
  }

  /** Live voice-slot map; use voice methods to keep staff bookkeeping consistent. */
  public get voiceBars(): Record<VoiceNumber, VoiceBar<I> | null> {
    return this._voiceBars;
  }

  /** New array of live, present voice bars, sorted by voice number. */
  public get voiceBarsAsArray(): VoiceBar<I>[] {
    const result: VoiceBar<I>[] = [];
    for (const voiceBar of Object.values(this._voiceBars)) {
      if (voiceBar === null) {
        continue;
      }

      result.push(voiceBar);
    }

    return result.sort((a, b) => a.voiceNumber - b.voiceNumber);
  }

  /**
   * Copies voice content while retaining staff, context, and master-bar references.
   * Copied voice bars retain their original owning bar references.
   * @throws If copied beat data or timing is invalid.
   */
  public deepCopy(): Bar<I> {
    const bar = new Bar<I>(this.staff, this.trackContext, this.masterBar);
    for (const voiceBar of this.voiceBarsAsArray) {
      bar._voiceBars[voiceBar.voiceNumber] = voiceBar.deepCopy();
    }
    return bar;
  }

  /** Returns true if any voice contains beats, including rests. */
  public hasContent(): boolean {
    return this.voiceBarsAsArray.some((vb) => !vb.isEmpty());
  }

  /** Returns true if every present voice is empty or exactly fills the meter. */
  public checkDurationsFit(): boolean {
    return this.voiceBarsAsArray.every((vb) => vb.checkDurationsFit());
  }

  /**
   * Checks this shared master bar's repeat boundaries against the owning score.
   * @throws If a repeat-marked master bar is not in the score.
   */
  public checkRepeatStatusValidity(): boolean {
    return this.staff.track.score.isMasterBarRepeatStatusValid(this.masterBar);
  }

  /**
   * Returns true when voice durations fit and repeat boundaries are valid.
   * @throws If repeat validation finds a foreign repeat-marked master bar.
   */
  public isValid(): boolean {
    return this.checkDurationsFit() && this.checkRepeatStatusValidity();
  }

  /** Compares voice content and shared master-bar identity, ignoring bar UUIDs. */
  public compare(otherBar: Bar<I>): boolean {
    if (this.masterBar !== otherBar.masterBar) {
      return false;
    }

    for (const voiceNumber of VOICE_NUMBERS) {
      const voiceBar = this._voiceBars[voiceNumber];
      const otherVoiceBar = otherBar._voiceBars[voiceNumber];
      if (voiceBar === null || otherVoiceBar === null) {
        if (voiceBar !== otherVoiceBar) {
          return false;
        }
        continue;
      }

      if (!voiceBar.compare(otherVoiceBar)) {
        return false;
      }
    }

    return true;
  }
}
