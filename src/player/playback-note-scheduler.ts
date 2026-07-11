import {
  BendTechniqueOptions,
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  Note,
  getNoteFrequency,
  ticksToSeconds,
} from "@/notation/model";
import { PlaybackSampleManager } from "./playback-sample-manager";
import { ScheduledAudioNode, TrackAudioBus } from "./scheduled-audio-node";

// Conservative peak keeps summed multi-track playback from clipping quickly.
const notePeakGain = 0.06;
// Short attack avoids clicks while preserving plucked-note immediacy.
const attackSeconds = 0.01;
// Short release avoids clicks without smearing normal note boundaries.
const releaseSeconds = 0.02;
// Palm mutes are quieter because the string is damped at the bridge.
const palmMuteGain = 0.038;
// Hammer-ons/pull-offs are quieter than picked notes in this single-note model.
const hammerOnPullOffGain = 0.048;
// Hammer-ons/pull-offs bloom slightly after the fret-hand articulation.
const hammerOnPullOffAttackSeconds = 0.018;
// Palm mutes decay quickly; this caps long score durations to a short thump.
const palmMuteMaxDurationSeconds = 0.18;
// Harmonics speak more lightly than normal fretted notes in this simple model.
const harmonicGain = 0.045;
// Natural/pinch harmonic playback uses the first octave partial for now.
const harmonicSemitones = 12;
// Let-ring extends release until note-level sustain exists.
const letRingExtraSeconds = 0.7;
// Slides need enough time to hear the source-to-target pitch transition.
const slideMaxDurationSeconds = 0.4;
// Slide length scales with the source note while leaving its attack intact.
const slideDurationRatio = 0.65;
// Vibrato starts after the note attack so the initial pitch remains clear.
const vibratoDelaySeconds = 0.12;
// Vibrato depth is a subtle percentage of frequency/playbackRate.
const vibratoDepthRatio = 0.018;
// Vibrato alternates roughly every 80ms for a guitar-like wobble.
const vibratoStepSeconds = 0.08;
// Missing bend duration falls back to halfway through the note.
const defaultBendDurationRatio = 0.5;

type BendAutomationValues = {
  bendRamp: PitchRampParams;
  prebendValue: number;
  prebendBendRamp: PitchRampParams;
  releaseRamp: PitchRampParams;
  releaseValue: number;
};

type PitchAutomationParams = {
  note: Note;
  pitchParam: AudioParam;
  baseValue: number;
  frequency: number;
  startTime: number;
  stopTime: number;
  slideTargetStartTime: number | null;
};

type PitchRampParams = {
  pitchParam: AudioParam;
  startValue: number;
  endValue: number;
  startTime: number;
  endTime: number;
};

type TechniqueEnvelopeSettings = {
  attackSeconds: number;
  peakGain: number;
  stopTime: number;
};

/**
 * Schedules Web Audio nodes for individual notes.
 * This class owns only one-note audio node creation. Score-level traversal and
 * rolling scheduling are owned by PlaybackScheduler, while transport state stays
 * in ScorePlayer.
 */
export class PlaybackNoteScheduler {
  /** Audio context used to create and schedule note nodes. */
  private _audioContext: AudioContext;
  /** Sample manager used to resolve configured samples by instrument tone. */
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
    const tone = note.trackContext.instrument.tone;
    const sample = this._sampleManager.getSample(tone);
    const rootFrequency = this._sampleManager.getRootFrequency(tone);
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

  /** Converts semitone distance into a frequency/playbackRate multiplier. */
  private semitonesToRate(semitones: number): number {
    return 2 ** (semitones / 12);
  }

  /** Returns the source parameter that controls pitch. */
  private getSourcePitchParam(
    sourceNode: AudioScheduledSourceNode
  ): AudioParam {
    if ("frequency" in sourceNode) {
      return (sourceNode as OscillatorNode).frequency;
    }
    if ("playbackRate" in sourceNode) {
      return (sourceNode as AudioBufferSourceNode).playbackRate;
    }

    throw new Error("Unsupported playback source node");
  }

  /** Schedules a linear pitch change between two values. */
  private applyPitchRamp(params: PitchRampParams): void {
    const { pitchParam, startValue, endValue, startTime, endTime } = params;
    pitchParam.setValueAtTime(startValue, startTime);
    pitchParam.linearRampToValueAtTime(endValue, endTime);
  }

  /** Resolves bend timing and target pitch values from bend options. */
  private getBendAutomationValues(
    options: BendTechniqueOptions,
    params: PitchAutomationParams
  ): BendAutomationValues {
    const { pitchParam, baseValue, startTime, stopTime } = params;
    const bendEndTime =
      startTime +
      (stopTime - startTime) *
        (options.bendDuration ?? defaultBendDurationRatio);
    const bendPitch = options.bendPitch ?? options.holdPitch ?? 0;
    const releasePitch = options.releasePitch ?? 0;
    const prebendPitch = options.prebendPitch ?? 0;
    const bendValue = baseValue * this.semitonesToRate(bendPitch);
    const prebendValue = baseValue * this.semitonesToRate(prebendPitch);
    const releaseValue = baseValue * this.semitonesToRate(releasePitch);

    return {
      bendRamp: {
        pitchParam,
        startValue: baseValue,
        endValue: bendValue,
        startTime,
        endTime: bendEndTime,
      },
      prebendValue,
      prebendBendRamp: {
        pitchParam,
        startValue: prebendValue,
        endValue: bendValue,
        startTime,
        endTime: bendEndTime,
      },
      releaseRamp: {
        pitchParam,
        startValue: prebendValue,
        endValue: releaseValue,
        startTime,
        endTime: bendEndTime,
      },
      releaseValue,
    };
  }

  /** Dispatches bend automation based on the concrete bend type. */
  private applyBendAutomation(
    bend: GuitarTechnique,
    params: PitchAutomationParams
  ): void {
    const { pitchParam, startTime, stopTime } = params;
    const options = bend?.bendOptions;
    if (options === undefined || options === null) {
      return;
    }

    const values = this.getBendAutomationValues(options, params);

    switch (options.type) {
      case BendType.Bend:
      case BendType.Hold:
        this.applyPitchRamp(values.bendRamp);
        break;
      case BendType.BendAndRelease:
        this.applyPitchRamp(values.bendRamp);
        pitchParam.linearRampToValueAtTime(values.releaseValue, stopTime);
        break;
      case BendType.Prebend:
        pitchParam.setValueAtTime(values.prebendValue, startTime);
        break;
      case BendType.PrebendAndRelease:
      case BendType.Release:
        this.applyPitchRamp(values.releaseRamp);
        break;
      case BendType.PrebendBend:
        this.applyPitchRamp(values.prebendBendRamp);
        break;
    }
  }

  /** Returns the pitch base for harmonic playback. */
  private applyHarmonicTechnique(baseValue: number): number {
    return baseValue * this.semitonesToRate(harmonicSemitones);
  }

  /** Schedules a short slide into the target pitch. */
  private applySlideTechnique(params: PitchAutomationParams): void {
    const { pitchParam, baseValue, frequency, note, startTime, stopTime } =
      params;
    const slideEndTime = params.slideTargetStartTime ?? stopTime;
    const slideTargetValue = this.getSlideTargetValue(
      note,
      baseValue,
      frequency
    );
    if (slideTargetValue === null) {
      return;
    }

    const slideDuration = Math.min(
      slideMaxDurationSeconds,
      (slideEndTime - startTime) * slideDurationRatio
    );
    const slideStartTime = slideEndTime - slideDuration;

    this.applyPitchRamp({
      pitchParam,
      startValue: baseValue,
      endValue: slideTargetValue,
      startTime: slideStartTime,
      endTime: slideEndTime,
    });
  }

  /** Returns the next same-string pitch value for source-note slide playback. */
  private getSlideTargetValue(
    note: Note,
    baseValue: number,
    frequency: number
  ): number | null {
    const nextNote = this.getSlideTargetNote(note);
    if (nextNote === null) {
      return null;
    }

    const nextFrequency = getNoteFrequency(nextNote);
    if (nextFrequency <= 0) {
      return null;
    }

    return baseValue * (nextFrequency / frequency);
  }

  /** Schedules pitch modulation around the target pitch. */
  private applyVibratoTechnique(params: PitchAutomationParams): void {
    const { pitchParam, baseValue, startTime, stopTime } = params;
    const depth = baseValue * vibratoDepthRatio;
    let time = startTime + vibratoDelaySeconds;
    let direction = 1;
    while (time < stopTime) {
      pitchParam.linearRampToValueAtTime(baseValue + depth * direction, time);
      direction *= -1;
      time += vibratoStepSeconds;
    }
    pitchParam.linearRampToValueAtTime(baseValue, stopTime);
  }

  /** Applies pitch automation for all techniques on one scheduled note. */
  private applyTechniqueAutomation(
    note: Note,
    sourceNode: AudioScheduledSourceNode,
    frequency: number,
    startTime: number,
    stopTime: number,
    slideTargetStartTime: number | null
  ): void {
    const pitchParam = this.getSourcePitchParam(sourceNode);
    const isOscillator = "frequency" in sourceNode;
    const baseValue = isOscillator
      ? frequency
      : (sourceNode as AudioBufferSourceNode).playbackRate.value;
    const hasHarmonic =
      note.hasTechnique(GuitarTechniqueType.NaturalHarmonic) ||
      note.hasTechnique(GuitarTechniqueType.PinchHarmonic);
    const techniqueBaseValue = hasHarmonic
      ? this.applyHarmonicTechnique(baseValue)
      : baseValue;
    const params: PitchAutomationParams = {
      note,
      pitchParam,
      baseValue: techniqueBaseValue,
      frequency,
      startTime,
      stopTime,
      slideTargetStartTime,
    };

    pitchParam.setValueAtTime(techniqueBaseValue, startTime);

    for (const technique of note.techniques) {
      if (!(technique instanceof GuitarTechnique)) {
        continue;
      }
      if (
        technique.type === GuitarTechniqueType.NaturalHarmonic ||
        technique.type === GuitarTechniqueType.PinchHarmonic
      ) {
        continue;
      }

      if (technique.type === GuitarTechniqueType.Bend) {
        this.applyBendAutomation(technique, params);
      }
      if (technique.type === GuitarTechniqueType.Slide) {
        this.applySlideTechnique(params);
      }
      if (technique.type === GuitarTechniqueType.Vibrato) {
        this.applyVibratoTechnique(params);
      }
    }
  }

  /** Resolves note envelope settings affected by guitar techniques. */
  private getTechniqueEnvelopeSettings(
    note: Note,
    stopTime: number,
    startTime: number
  ): TechniqueEnvelopeSettings {
    const settings: TechniqueEnvelopeSettings = {
      attackSeconds,
      peakGain: notePeakGain,
      stopTime,
    };

    if (note.hasTechnique(GuitarTechniqueType.PalmMute)) {
      settings.peakGain = palmMuteGain;
      settings.stopTime = Math.min(
        settings.stopTime,
        startTime + palmMuteMaxDurationSeconds
      );
      return settings;
    }

    if (note.hasTechnique(GuitarTechniqueType.HammerOnOrPullOff)) {
      settings.attackSeconds = hammerOnPullOffAttackSeconds;
      settings.peakGain = hammerOnPullOffGain;
    }

    if (
      note.hasTechnique(GuitarTechniqueType.NaturalHarmonic) ||
      note.hasTechnique(GuitarTechniqueType.PinchHarmonic)
    ) {
      settings.peakGain = harmonicGain;
    }

    if (note.hasTechnique(GuitarTechniqueType.LetRing)) {
      settings.stopTime += letRingExtraSeconds;
    }

    if (note.hasTechnique(GuitarTechniqueType.Slide)) {
      settings.stopTime = this.getSlidePairStopTime(note, settings.stopTime);
    }

    return settings;
  }

  /** Returns the stop time for a source note and its slide target pair. */
  private getSlidePairStopTime(note: Note, sourceStopTime: number): number {
    const nextNote = this.getSlideTargetNote(note);
    if (nextNote === null) {
      return sourceStopTime;
    }

    const nextBeat = nextNote.beat;
    const durationSeconds = ticksToSeconds(
      nextBeat.fullDurationTicks,
      nextBeat.voiceBar.tickResolution,
      nextBeat.voiceBar.bar.masterBar.tempo
    );
    return sourceStopTime + durationSeconds;
  }

  /** Returns the next same-string note used as a slide target. */
  private getSlideTargetNote(note: Note): GuitarNote | null {
    if (!(note instanceof GuitarNote)) {
      return null;
    }

    const nextBeat = note.beat.voiceBar.bar.staff.getNextBeat(note.beat);
    if (nextBeat?.notes === null || nextBeat?.notes === undefined) {
      return null;
    }

    const nextNote = nextBeat.notes[note.stringNum - 1];
    if (!(nextNote instanceof GuitarNote)) {
      return null;
    }

    return getNoteFrequency(nextNote) > 0 ? nextNote : null;
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
    const envelopeSettings = this.getTechniqueEnvelopeSettings(
      note,
      stopTime,
      startTime
    );
    const effectiveStopTime = envelopeSettings.stopTime;
    const attackEndTime = startTime + envelopeSettings.attackSeconds;
    const releaseStartTime = Math.max(
      attackEndTime,
      effectiveStopTime - releaseSeconds
    );
    const track = note.beat.voiceBar.bar.staff.track;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(
      envelopeSettings.peakGain,
      attackEndTime
    );
    gainNode.gain.setValueAtTime(envelopeSettings.peakGain, releaseStartTime);
    gainNode.gain.linearRampToValueAtTime(0, effectiveStopTime);
    this.applyTechniqueAutomation(
      note,
      sourceNode,
      frequency,
      startTime,
      effectiveStopTime,
      note.hasTechnique(GuitarTechniqueType.Slide) ? stopTime : null
    );

    sourceNode.connect(gainNode);
    gainNode.connect(trackBus.gainNode);
    sourceNode.start(startTime);
    sourceNode.stop(effectiveStopTime);

    return {
      sourceNode,
      track,
      gainNode,
    };
  }
}
