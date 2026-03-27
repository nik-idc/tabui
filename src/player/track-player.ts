import * as Tone from "tone";
import {
  BarRepeatStatus,
  Beat,
  MusicInstrument,
  NoteDuration,
  Track,
} from "../notation/model";
import { trackEvent, TrackEventType } from "@/shared/events";

export const TonejsDurationMap = {
  [NoteDuration.Whole]: "1n",
  [NoteDuration.Half]: "2n",
  [NoteDuration.Quarter]: "4n",
  [NoteDuration.Eighth]: "8n",
  [NoteDuration.Sixteenth]: "16n",
  [NoteDuration.ThirtySecond]: "32n",
  [NoteDuration.SixtyFourth]: "32n",
};

/**
 * Calculates the remaining duration (in seconds) in a bar.
 *
 * @param bpm - Tempo in beats per minute
 * @param barDuration - Fractional duration of the bar (x/4 = 0.25, x/8 = 0.125 etc)
 * @param used - Already used time in fractions of a whole note (e.g. 0.25 = quarter note)
 * @returns Remaining time in seconds
 */
function bpmDurationToSeconds(
  bpm: number,
  barDuration: number,
  used: number
): number {
  // const barTotal = beatsCount / duration;
  // const remaining = Math.max(barTotal - used, 0);
  const secondsPerWholeNote = 60 / bpm / barDuration;

  return Math.max(used * secondsPerWholeNote, 0);
}

export class TrackPlayer<I extends MusicInstrument = MusicInstrument> {
  private _track: Track<I>;
  private _isPlaying: boolean = false;

  constructor(track: Track<I>) {
    this._track = track;
  }

  public start(): void {
    // await Tone.start(); // unlock audio
    this._isPlaying = true;
    this.playFromCurrentBeat();
  }

  public playFromCurrentBeat(): void {}

  public setCurrentBeat(beat: Beat<I>): void {
    if (this._isPlaying) {
      this.stop();
      this.start();
    }
  }

  public stop(): void {
    this._isPlaying = false;
    Tone.getTransport().stop();
    Tone.getTransport().cancel(); // Unschedules all events
  }

  public setLooped(): void {
    this._isLooped = !this._isLooped;
  }

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  public get isLooped(): boolean {
    return this._isLooped;
  }

  public get currentBeat(): Beat<I> | undefined {
    return this._currentBeat;
  }
}
