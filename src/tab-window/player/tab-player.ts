import { tabEvent, TabEventType } from "../../events/tab-event";
import { Beat } from "../../models/beat";
import { NoteDuration } from "../../models/note-duration";
import { Tab } from "../../models/tab";

import * as Tone from "tone";

export const TonejsDurationMap = {
  [NoteDuration.Whole]: "1n",
  [NoteDuration.Half]: "2n",
  [NoteDuration.Quarter]: "4n",
  [NoteDuration.Eighth]: "8n",
  [NoteDuration.Sixteenth]: "16n",
  [NoteDuration.ThirtySecond]: "32n",
  [NoteDuration.SixtyFourth]: "32n",
  [NoteDuration.HalfDotted]: "2n.",
  [NoteDuration.QuarterDotted]: "4n.",
  [NoteDuration.EighthDotted]: "8n.",
  [NoteDuration.SixteenthDotted]: "16n.",
  [NoteDuration.ThirtySecondDotted]: "32n.",
  [NoteDuration.SixtyFourthDotted]: "32n.",
  [NoteDuration.HalfDoubleDotted]: "2n..",
  [NoteDuration.QuarterDoubleDotted]: "4n..",
  [NoteDuration.EighthDoubleDotted]: "8n..",
  [NoteDuration.SixteenthDoubleDotted]: "16n..",
  [NoteDuration.ThirtySecondDoubleDotted]: "32n..",
  [NoteDuration.SixtyFourthDoubleDotted]: "32n..",
  [NoteDuration.HalfTriplet]: "2t",
  [NoteDuration.QuarterTriplet]: "4t",
  [NoteDuration.EighthTriplet]: "8t",
  [NoteDuration.SixteenthTriplet]: "16t",
  [NoteDuration.ThirtySecondTriplet]: "32t",
  [NoteDuration.SixtyFourthTriplet]: "32t",
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

  constructor(tab: Tab) {
    this._tab = tab;
    this._currentBeat = undefined;
    this._synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this._isPlaying = false;
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
    for (let i = currentBeatIndex; i < beatsSeq.length; i++) {
      const bar = this._tab.findBeatsBar(beatsSeq[i]);
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

      // const tonejsDuration = TonejsDurationMap[beatsSeq[i].duration];
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

          console.log(`Leftover duration: ${leftoverDuration} seconds`);
          console.log(`Duration: ${tonejsDuration} seconds`);
          console.log(`Beat ${i + 1}, played note ${note.note.noteStr}`);

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

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  public get currentBeat(): Beat | undefined {
    return this._currentBeat;
  }
}
