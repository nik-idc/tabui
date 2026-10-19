import { randomInt } from "../../shared";
import { MusicInstrument } from "./instrument/instrument";
import { MasterBar } from "./master-bar";
import { TrackContext } from "./track-context";
import { Staff } from "./staff";
import { Beat } from "./beat";
import { BeatArrayOperationOutput, VoiceBar, VoiceNumber } from "./voice-bar";

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
   * Clears a voice slot and its staff bookkeeping, without adding a fallback rest.
   * @throws If removing a non-empty voice would make the staff count negative.
   */
  public removeVoiceBar(voiceNumber: VoiceNumber): void {
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

      this.removeVoiceBar(voiceBar.voiceNumber);
      removedVoiceNumbers.push(voiceBar.voiceNumber);
    }

    if (voiceNumberToKeep !== null) {
      const keptVoiceBar =
        this.getVoiceBar(voiceNumberToKeep) ??
        this.insertVoiceBar(voiceNumberToKeep);
      inserted.push(keptVoiceBar.insertDefaultRest());
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
