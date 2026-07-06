import { Note, getNoteFrequency } from "@/notation/model";
import { PlaybackSampleManager } from "./playback-sample-manager";
import { ScheduledAudioNode, TrackAudioBus } from "./scheduled-audio-node";

const notePeakGain = 0.06;
const attackSeconds = 0.01;
const releaseSeconds = 0.02;

/**
 * Schedules Web Audio nodes for individual notes.
 * This class owns only one-note audio node creation. Score-level traversal and
 * rolling scheduling are owned by PlaybackScheduler, while transport state stays
 * in ScorePlayer.
 */
export class PlaybackNoteScheduler {
  /** Audio context used to create and schedule note nodes. */
  private _audioContext: AudioContext;
  /** Sample manager used to resolve configured samples by instrument preset. */
  private _sampleManager: PlaybackSampleManager;

  /**
   * Schedules Web Audio nodes for individual notes.
   * @param audioContext Audio context used to create and schedule note nodes
   * @param sampleManager Sample manager used to resolve configured samples
   */
  constructor(
    audioContext: AudioContext,
    sampleManager: PlaybackSampleManager
  ) {
    this._audioContext = audioContext;
    this._sampleManager = sampleManager;
  }

  /**
   * Creates the source node for one note.
   * @param note Note to create a source for
   * @param frequency Note frequency in Hz
   * @returns Sample source when configured and loaded, otherwise oscillator
   */
  private createSourceNode(
    note: Note,
    frequency: number
  ): AudioScheduledSourceNode {
    const preset = note.trackContext.instrument.preset;
    const sample = this._sampleManager.getSample(preset);
    const rootFrequency = this._sampleManager.getRootFrequency(preset);
    if (sample === undefined || rootFrequency === undefined) {
      const oscillatorNode = this._audioContext.createOscillator();
      oscillatorNode.type = "sine";
      oscillatorNode.frequency.value = frequency;
      return oscillatorNode;
    }

    const bufferSourceNode = this._audioContext.createBufferSource();
    bufferSourceNode.buffer = sample;
    /**
     * A sample is one recorded pitch. To play another pitch, Web Audio speeds
     * the recording up or slows it down. A playbackRate of 1 means "play the
     * sample at its original pitch". A rate of 2 plays it one octave higher;
     * a rate of 0.5 plays it one octave lower.
     *
     * Example: if the sample is C3 (~130.81 Hz) and the note is E3
     * (~164.81 Hz), the rate is 164.81 / 130.81 = ~1.26.
     */
    bufferSourceNode.playbackRate.value = frequency / rootFrequency;
    return bufferSourceNode;
  }

  /**
   * Schedules one note using a configured sample or oscillator fallback.
   * @param note Note to schedule
   * @param startTime Absolute audio context start time
   * @param stopTime Absolute audio context stop time
   * @returns Created audio nodes, or null for unplayable notes
   */
  public scheduleNote(
    note: Note,
    startTime: number,
    stopTime: number,
    trackBus: TrackAudioBus
  ): ScheduledAudioNode | null {
    const frequency = getNoteFrequency(note);
    if (frequency <= 0) {
      return null;
    }

    const sourceNode = this.createSourceNode(note, frequency);
    const gainNode = this._audioContext.createGain();
    const attackEndTime = startTime + attackSeconds;
    const releaseStartTime = Math.max(attackEndTime, stopTime - releaseSeconds);
    const track = note.beat.voiceBar.bar.staff.track;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(notePeakGain, attackEndTime);
    gainNode.gain.setValueAtTime(notePeakGain, releaseStartTime);
    gainNode.gain.linearRampToValueAtTime(0, stopTime);

    sourceNode.connect(gainNode);
    gainNode.connect(trackBus.gainNode);
    sourceNode.start(startTime);
    sourceNode.stop(stopTime);

    return {
      sourceNode,
      track,
      gainNode,
    };
  }
}
