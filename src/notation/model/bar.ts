import { randomInt } from "@/shared";
import { MusicInstrument } from "./instrument/instrument";
import { MasterBar } from "./master-bar";
import { TrackContext } from "./track-context";
import { Staff } from "./staff";
import { Beat } from "./beat";
import { VoiceBar, VoiceBarJSON, VoiceNumber } from "./voice-bar";

export interface BarJSON {
  voiceBars: Record<VoiceNumber, VoiceBarJSON | null>;
}

export const VOICE_NUMBERS: VoiceNumber[] = [1, 2, 3, 4];

/**
 * Class that represents a musical bar
 */
export class Bar<I extends MusicInstrument = MusicInstrument> {
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
    this._voiceBars[voiceNumber] = voiceBar;
    this.staff.recalculateNonEmptyVoiceNumbers();
    return voiceBar;
  }

  public removeVoiceBar(voiceNumber: VoiceNumber): void {
    this._voiceBars[voiceNumber] = null;
    this.staff.recalculateNonEmptyVoiceNumbers();
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
      const copiedVoiceBar = bar.insertVoiceBar(voiceBar.voiceNumber, []);
      copiedVoiceBar.beats.splice(0, copiedVoiceBar.beats.length);
      for (const beat of voiceBar.beats) {
        copiedVoiceBar.beats.push(beat.deepCopy());
      }
      copiedVoiceBar.rebuildTiming();
    }
    return bar;
  }

  public hasContent(): boolean {
    return this.voiceBarsAsArray.some((vb) => !vb.isEmpty());
  }

  public checkDurationsFit(): boolean {
    return this.voiceBarsAsArray.every((vb) => vb.checkDurationsFit());
  }

  public toJSON(): BarJSON {
    const voiceBarsJSON = {
      1: null,
      2: null,
      3: null,
      4: null,
    } as Record<VoiceNumber, VoiceBarJSON | null>;
    for (const voiceNumber of VOICE_NUMBERS) {
      voiceBarsJSON[voiceNumber] =
        this._voiceBars[voiceNumber]?.toJSON() ?? null;
    }
    return { voiceBars: voiceBarsJSON };
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
