import { tabEvent, TabEventType } from "../../events/tab-event";
import { Bar, BarRepeatStatus } from "../../models/index";
import { Beat } from "../../models/index";
import { NoteDuration } from "../../models/index";
import { Tab } from "../../models/index";

import * as Tone from "tone";

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

export class TabPlayer {
  private _tab: Tab;
  private _currentBeat?: Beat;
  private _synth: Tone.PolySynth;
  private _isPlaying: boolean;
  private _isLooped: boolean;

  constructor(tab: Tab) {
    this._tab = tab;
    this._currentBeat = undefined;
    this._synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this._isPlaying = false;
    this._isLooped = false;
  }

  public start(): void {
    // await Tone.start(); // unlock audio
    this._isPlaying = true;
    this.playFromCurrentBeat();
  }

  public playFromCurrentBeat(): void {
    if (this._currentBeat === undefined) {
      return;
    }

    // Cancel any currently active playback
    Tone.getTransport().cancel();

    // Get beats seq array and index of current beat
    const beatsSeq = this._tab.getBeatsSeq();
    const currentBeatIndex = beatsSeq.indexOf(this._currentBeat);
    if (currentBeatIndex === -1) {
      throw Error("Play from current beat: current beat index is -1");
    }

    // Start scheduling playback
    let time = 0;
    let repeatStartBeatIndex: number | undefined;
    let repeatsCount: number = 0;
    let restartRepeat: boolean = false;
    for (let i = currentBeatIndex; i < beatsSeq.length; i++) {
      if (restartRepeat) {
        i = repeatStartBeatIndex!;
        restartRepeat = false;
      }

      const bar = this._tab.findBeatsBar(beatsSeq[i]);

      if (
        bar.repeatStatus === BarRepeatStatus.Start &&
        repeatStartBeatIndex === undefined
      ) {
        // First time encounter with a beat inside a repeat start bar, mark it
        repeatStartBeatIndex = i;
      }

      if (
        bar.repeatStatus === BarRepeatStatus.End &&
        bar.beats.indexOf(beatsSeq[i]) === bar.beats.length - 1
      ) {
        // Last beat of the repeat end bar, starting over
        if (repeatsCount < bar.repeatCount! - 1) {
          restartRepeat = true;
          repeatsCount++;
        } else {
          restartRepeat = false;
          repeatsCount = 0;
          repeatStartBeatIndex = undefined;
        }
      }

      if (!bar.beatPlayable(beatsSeq[i])) {
        continue;
      }

      let leftoverDuration = 0;
      if (
        !bar.durationsFit &&
        bar.beats.indexOf(beatsSeq[i]) === bar.beats.length - 1
      ) {
        leftoverDuration = bpmDurationToSeconds(
          bar.tempo,
          bar.duration,
          bar.beatsCount * bar.duration - bar.actualDuration()
        );
      }

      const tonejsDuration = bpmDurationToSeconds(
        bar.tempo,
        bar.duration,
        beatsSeq[i].duration
      );

      Tone.getTransport().scheduleOnce((t) => {
        if (!this._isPlaying) {
          return;
        }

        for (const note of beatsSeq[i].notes) {
          if (note.note.noteStr === "") {
            continue;
          }

          this._synth.triggerAttackRelease(
            note.note.noteStr,
            tonejsDuration,
            t
          );
          this._synth.blockTime;
        }

        this._currentBeat = beatsSeq[i];

        tabEvent.emit(TabEventType.PlayerCurBeatChanged, {
          beatUUID: this._currentBeat.uuid,
        });
      }, time);

      time += Tone.Time(tonejsDuration + leftoverDuration).toSeconds();
    }

    Tone.getTransport().scheduleOnce((t) => {
      if (!this._isPlaying) return;

      if (this._isLooped) {
        this.setCurrentBeat(this._tab.getBeatsSeq()[0]);
      } else {
        const firstBeat = this._tab.getBeatsSeq()[0];
        this.stop();
        this._currentBeat = firstBeat;
        tabEvent.emit(TabEventType.PlayerCurBeatChanged, {
          beatUUID: this._currentBeat.uuid,
        });
      }
    }, time);

    // Slight offset for browser scheduling safety
    Tone.getTransport().start("+0.1");
  }

  public setCurrentBeat(beat: Beat): void {
    this._currentBeat = beat;

    tabEvent.emit(TabEventType.PlayerCurBeatChanged, {
      beatUUID: this._currentBeat.uuid,
    });

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

  public get currentBeat(): Beat | undefined {
    return this._currentBeat;
  }
}
