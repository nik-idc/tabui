import { randomInt } from "../../shared";
import { MusicInstrument } from "./instrument/instrument";
import { MasterBar } from "./master-bar";
import { TrackContext } from "./track-context";
import { Staff } from "./staff";
import { Beat } from "./beat";
import { BeatArrayOperationOutput, VoiceBar, VoiceNumber } from "./voice-bar";

export const VOICE_NUMBERS: VoiceNumber[] = [1, 2, 3, 4];

/**
 * Class that represents a musical bar
 */
export class Bar<I extends MusicInstrument = MusicInstrument> {
  /** Fallback voice number where otherwise the entire bar will be empty */
  private static readonly fallbackVoiceNumber: VoiceNumber = 1;

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
   * Class that represents a musical bar
   * @param staff Staff in which the bar lives
   * @param trackContext Track context
   * @param masterBar Master bar
   * @param beats Beats for this bar
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

  public ensureVoiceBar(voiceNumber: VoiceNumber): VoiceBar<I> {
    return this.getVoiceBar(voiceNumber) ?? this.insertVoiceBar(voiceNumber);
  }

  public removeVoiceBar(voiceNumber: VoiceNumber): void {
    const voiceBar = this._voiceBars[voiceNumber];
    if (voiceBar !== null) {
      this.staff.recordVoiceBarRemoved(voiceBar);
    }
    this._voiceBars[voiceNumber] = null;
  }

  public restoreVoiceBar(voiceBar: VoiceBar<I>): void {
    const oldVoiceBar = this._voiceBars[voiceBar.voiceNumber];
    if (oldVoiceBar !== null) {
      this.staff.recordVoiceBarRemoved(oldVoiceBar);
    }
    this._voiceBars[voiceBar.voiceNumber] = voiceBar;
    voiceBar.rebuildTiming();
    this.staff.recordVoiceBarAdded(voiceBar);
  }

  public resolveEmptyVoiceBars(): {
    inserted: BeatArrayOperationOutput<I>[];
    removedVoiceNumbers: VoiceNumber[] | null;
  } {
    const inserted: BeatArrayOperationOutput<I>[] = [];
    const removedVoiceNumbers: VoiceNumber[] = [];

    const hasContent = this.voiceBarsAsArray.some((vb) => !vb.isEmpty());
    const voiceNumberToKeep = hasContent ? null : Bar.fallbackVoiceNumber;

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

  public getVoiceBar(voiceNumber: VoiceNumber): VoiceBar<I> | null {
    return this._voiceBars[voiceNumber];
  }

  public get voiceBars(): Record<VoiceNumber, VoiceBar<I> | null> {
    return this._voiceBars;
  }

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

  public deepCopy(): Bar<I> {
    const bar = new Bar<I>(this.staff, this.trackContext, this.masterBar);
    for (const voiceBar of this.voiceBarsAsArray) {
      bar._voiceBars[voiceBar.voiceNumber] = voiceBar.deepCopy();
    }
    return bar;
  }

  public hasContent(): boolean {
    return this.voiceBarsAsArray.some((vb) => !vb.isEmpty());
  }

  public checkDurationsFit(): boolean {
    return this.voiceBarsAsArray.every((vb) => vb.checkDurationsFit());
  }

  public checkRepeatStatusValidity(): boolean {
    return this.staff.track.score.isMasterBarRepeatStatusValid(this.masterBar);
  }

  public isValid(): boolean {
    return this.checkDurationsFit() && this.checkRepeatStatusValidity();
  }

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
