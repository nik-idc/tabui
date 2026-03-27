import * as Tone from "tone";
import {
  Bar,
  BarRepeatStatus,
  Beat,
  MusicInstrument,
  NoteDuration,
  Score,
  Staff,
} from "../notation/model";
import { trackEvent, TrackEventType } from "@/shared/events";

// export const TonejsDurationMap = {
//   [NoteDuration.Whole]: "1n",
//   [NoteDuration.Half]: "2n",
//   [NoteDuration.Quarter]: "4n",
//   [NoteDuration.Eighth]: "8n",
//   [NoteDuration.Sixteenth]: "16n",
//   [NoteDuration.ThirtySecond]: "32n",
//   [NoteDuration.SixtyFourth]: "32n",
// };

/**
 *
 *
 * !!!! AI SLOP AI SLOP AI SLOP AI SLOP AI SLOP AI SLOP AI SLOP AI SLOP AI SLOP AI SLOP !!!!
 *
 * !!!!!!!!!!!!!! THIS CODE WAS MADE BY CLAUDE 4.5 AND HAS ONLY BEEN FORMATTED !!!!!!!!!!!!!!
 * !!!!!!!!!!!!!!!!!!!!!!!!!! TESTING IS REQUIRED BEFORE COMMITING !!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!!!!!!!!!!!!!!!!!!!!!!! IF YOU SEE THIS CODE THEN I AM AN IDIOT !!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * !!!! AI SLOP AI SLOP AI SLOP AI SLOP AI SLOP AI SLOP AI SLOP AI SLOP AI SLOP AI SLOP !!!!
 */

/**
 * Calculates duration in seconds from tempo and fractional duration
 */
function calculateDurationSeconds(
  tempo: number,
  barDuration: number,
  noteDuration: number
): number {
  const secondsPerWholeNote = 60 / tempo / barDuration;
  return noteDuration * secondsPerWholeNote;
}

/**
 * Playback options
 */
export interface PlaybackOptions {
  startBeat?: Beat;
  loopStartBeat?: Beat;
  loopEndBeat?: Beat;
}

/**
 * Loop section
 */
interface LoopSection {
  startBeat: Beat;
  endBeat: Beat;
}

/**
 * Score player that handles playback for all tracks/staves
 */
export class ScorePlayer {
  /** Score */
  readonly score: Score;

  /** Staff to synth map */
  private _synthsMap: Map<number, Tone.PolySynth> = new Map(); // staffUuid -> synth
  /** Current beat */
  private _currentBeat?: Beat;
  /** Indicates if playing/not playing */
  private _isPlaying: boolean = false;
  /** Indicates if looped/not looped */
  private _isLooped: boolean = false;
  /** Loop section */
  private _loopSection?: LoopSection;

  /**
   * Score player that handles playback for all tracks/staves
   * @param score Score
   */
  constructor(score: Score) {
    this.score = score;
    this.initializeSynths();
  }

  /**
   * Initialize a synth for each staff
   */
  private initializeSynths(): void {
    for (const track of this.score.tracks) {
      for (const staff of track.staves) {
        const synth = new Tone.PolySynth(Tone.Synth).toDestination();

        // Customize synth based on instrument type
        synth.set({
          envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 1,
          },
        });

        this._synthsMap.set(staff.uuid, synth);
      }
    }
  }

  /**
   * Set current beat and restart if playing
   */
  public setCurrentBeat(beat: Beat): void {
    this._currentBeat = beat;
    trackEvent.emit(TrackEventType.PlayerCurBeatChanged, {
      beatUUID: this._currentBeat.uuid,
    });

    if (this._isPlaying) {
      this.stop();
      this.start();
    }
  }

  /**
   * Build complete beat sequence across all staves
   */
  private buildBeatSequence(): Beat[] {
    const sequence: Beat[] = [];

    const masterBars = this.score.masterBars;
    for (let barIndex = 0; barIndex < masterBars.length; barIndex++) {
      for (const track of this.score.tracks) {
        for (const staff of track.staves) {
          const barBeats = staff.bars[barIndex].beats;
          for (let beatIndex = 0; beatIndex < barBeats.length; beatIndex++) {
            sequence.push(barBeats[beatIndex]);
          }
        }
      }
    }

    return sequence;
  }

  /**
   * Create initial repeat state
   */
  private createRepeatState() {
    return {
      repeatStartIndex: undefined as number | undefined,
      repeatCount: 0,
    };
  }

  /**
   * Update repeat state based on current bar
   */
  private updateRepeatState(state: any, bar: any, currentIndex: number) {
    if (
      bar.masterBar.repeatStatus === BarRepeatStatus.Start &&
      state.repeatStartIndex === undefined
    ) {
      return { ...state, repeatStartIndex: currentIndex };
    }
    return state;
  }

  /**
   * Check if we need to jump back for a repeat
   */
  private checkRepeatJump(state: any, bar: any): number | null {
    if (
      bar.masterBar.repeatStatus === BarRepeatStatus.End &&
      state.repeatStartIndex !== undefined
    ) {
      const maxRepeats = bar.masterBar.repeatCount || 2;

      if (state.repeatCount < maxRepeats - 1) {
        state.repeatCount++;
        return state.repeatStartIndex;
      } else {
        // Reset repeat state
        state.repeatStartIndex = undefined;
        state.repeatCount = 0;
      }
    }
    return null;
  }

  /**
   * Calculate leftover duration for incomplete bars
   */
  private calculateLeftoverDuration(bar: Bar, beat: Beat): number {
    const beatIndexInBar = beat.bar.beats.indexOf(beat);
    if (bar.checkDurationsFit() || beatIndexInBar !== bar.beats.length - 1) {
      return 0;
    }

    const expectedDuration = bar.masterBar.beatsCount * bar.masterBar.duration;
    const actualDuration = bar.getActualBarDuration();
    const leftover = expectedDuration - actualDuration;

    return calculateDurationSeconds(
      bar.masterBar.tempo,
      bar.masterBar.duration,
      leftover
    );
  }

  /**
   * Schedule a single beat
   */
  private scheduleBeat(beat: Beat, time: number, duration: number): void {
    Tone.getTransport().scheduleOnce((t) => {
      if (!this._isPlaying) {
        return;
      }

      // Get synth for this staff
      const synth = this._synthsMap.get(beat.bar.staff.uuid);
      if (!synth) {
        return;
      }

      // Play all notes in the beat
      for (const note of beat.notes) {
        const noteStr = note.getNoteStr();
        if (noteStr) {
          synth.triggerAttackRelease(noteStr, duration, t);
        }
      }

      // Update current beat
      this._currentBeat = beat;
      trackEvent.emit(TrackEventType.PlayerCurBeatChanged, {
        beatUUID: beat.uuid,
      });
    }, time);
  }

  /**
   * Check if current beat is the loop end
   */
  private isLoopEnd(beat: Beat): boolean {
    return (
      this._loopSection !== undefined && beat === this._loopSection.endBeat
    );
  }

  /**
   * Schedule playback end handler
   */
  private schedulePlaybackEnd(time: number): void {
    Tone.getTransport().scheduleOnce((t) => {
      if (!this._isPlaying) return;

      if (this._isLooped && this._loopSection) {
        // Restart loop
        if (this._loopSection.startBeat !== undefined) {
          this._currentBeat = this._loopSection.startBeat;
          this.playFromCurrentBeat();
        }
      } else if (this._isLooped) {
        // Loop entire score
        const allBeats = this.buildBeatSequence();
        if (allBeats.length > 0) {
          this._currentBeat = allBeats[0];
          this.playFromCurrentBeat();
        }
      } else {
        // Stop playback
        this.stop();
        const allBeats = this.buildBeatSequence();
        if (allBeats.length > 0) {
          this._currentBeat = allBeats[0];
          trackEvent.emit(TrackEventType.PlayerCurBeatChanged, {
            beatUUID: this._currentBeat.uuid,
          });
        }
      }
    }, time);
  }

  /**
   * Schedule beats for playback
   */
  private scheduleBeats(beats: Beat[], startIndex: number): void {
    let time = 0;
    let currentBar = beats[startIndex].bar;
    let repeatState = this.createRepeatState();

    for (let i = startIndex; i < beats.length; i++) {
      const bar = beats[i].bar;

      // Handle bar change
      if (bar !== currentBar) {
        currentBar = bar;
        repeatState = this.updateRepeatState(repeatState, bar, i);

        // Check if we need to jump back for repeat
        const jumpIndex = this.checkRepeatJump(repeatState, bar);
        if (jumpIndex !== null) {
          i = jumpIndex - 1; // -1 because loop will increment
          continue;
        }
      }

      // Skip unplayable beats
      if (!bar.beatPlayable(beats[i])) {
        continue;
      }

      // Calculate duration
      const duration = calculateDurationSeconds(
        bar.masterBar.tempo,
        bar.masterBar.duration,
        beats[i].baseDuration
      );

      // Add leftover duration for last beat if bar doesn't fit
      const leftoverDuration = this.calculateLeftoverDuration(bar, beats[i]);

      // Schedule this beat
      this.scheduleBeat(beats[i], time, duration);

      time += duration + leftoverDuration;

      // Check if we've reached loop end
      if (this.isLoopEnd(beats[i])) {
        const loopStartIndex = beats.findIndex(
          (b) => b === this._loopSection?.startBeat
        );
        if (loopStartIndex !== -1) {
          i = loopStartIndex - 1;
          time = 0; // Reset time for loop
          continue;
        }
      }
    }

    // Schedule end-of-playback handler
    this.schedulePlaybackEnd(time);

    // Start transport
    Tone.getTransport().start("+0.1");
  }

  /**
   * Play from current beat position
   */
  private playFromCurrentBeat(): void {
    // Cancel any currently active playback
    Tone.getTransport().cancel();

    // Build complete beat sequence for all staves
    const allBeats = this.buildBeatSequence();

    if (allBeats.length === 0) {
      return;
    }

    // Find starting index
    const startIndex = this._currentBeat
      ? this._currentBeat.bar.beats.indexOf(this._currentBeat)
      : 0;

    if (startIndex === -1) {
      console.error("Current beat not found in sequence");
      return;
    }

    // Schedule all beats
    this.scheduleBeats(allBeats, startIndex);
  }

  /**
   * Start playback
   */
  public async start(options: PlaybackOptions = {}): Promise<void> {
    await Tone.start(); // Unlock audio context

    this._isPlaying = true;

    // Set current beat to start position
    if (options.startBeat !== undefined) {
      this._currentBeat = options.startBeat;
    }

    // Set loop section
    if (
      options.loopStartBeat !== undefined &&
      options.loopEndBeat !== undefined
    ) {
      this._loopSection = {
        startBeat: options.loopStartBeat,
        endBeat: options.loopEndBeat,
      };
    }

    this.playFromCurrentBeat();
  }

  /**
   * Stop playback
   */
  public stop(): void {
    this._isPlaying = false;
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
  }

  /**
   * Toggle looped playback
   */
  public toggleLoop(): void {
    this._isLooped = !this._isLooped;
  }

  /**
   * Set loop section
   */
  public setLoopSection(startBeat: Beat, endBeat: Beat): void {
    this._loopSection = { startBeat, endBeat };
  }

  /**
   * Clear loop section (loop entire score)
   */
  public clearLoopSection(): void {
    this._loopSection = undefined;
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.stop();
    for (const synth of this._synthsMap.values()) {
      synth.dispose();
    }
    this._synthsMap.clear();
  }

  /** Is playing getter */
  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  /** Is looped getter */
  public get isLooped(): boolean {
    return this._isLooped;
  }

  /** Current beat getter */
  public get currentBeat(): Beat | undefined {
    return this._currentBeat;
  }
}
