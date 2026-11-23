import { AccentType } from "../notation/model/accent-options";
import { BendTechniqueOptions } from "../notation/model/bend-options";
import { BendType } from "../notation/model/bend-type";
import { Dynamic } from "../notation/model/dynamic";
import { GuitarNote } from "../notation/model/guitar-note";
import { GuitarTechnique } from "../notation/model/guitar-technique";
import { GuitarTechniqueType } from "../notation/model/technique-type";
import {
  Note,
  NoteValue,
  getNoteFrequency,
  getFrequencyFromNoteType,
  NOTES_PER_OCTAVE,
} from "../notation/model/note";
import { ticksToSeconds } from "../notation/model/timing";
import { PlaybackSampleManager } from "./playback-sample-manager";
import { CENTS_PER_SEMITONE } from "./playback-constants";
import {
  getPlaybackToneProfile,
  PlaybackToneProfile,
} from "./playback-tone-profile";
import { ScheduledAudioNode, TrackAudioBus } from "./scheduled-audio-node";

type PlaybackSourceNode = OscillatorNode | AudioBufferSourceNode;

/** Raises all note amplitudes without changing mixer controls; summed notes can clip. */
const playbackGainMultiplier = 6;
// Base envelope peak, before tone and beat-context shaping.
const notePeakGain = 0.06 * playbackGainMultiplier;
/** Applies a common amplitude reduction to every dead-note strike. */
const deadNoteGainMultiplier = 0.75;
// Short attack avoids clicks while preserving plucked-note immediacy.
const attackSeconds = 0.01;
// Short release avoids clicks without smearing normal note boundaries.
const releaseSeconds = 0.02;
// Palm mutes are quieter because the string is damped at the bridge.
const palmMuteGain = 0.038 * playbackGainMultiplier;
/** Preserves the picked transient before palm damping takes over. */
const palmMuteAttackSeconds = 0.003;
/** Damping time constant at A3; low notes keep more body than high notes. */
const palmMuteDecaySeconds = 0.035;
/** Bounds pitch-dependent decay so bass notes stay tight and high notes stay audible. */
const palmMuteMinimumDecaySeconds = 0.025;
const palmMuteMaximumDecaySeconds = 0.05;
/** Lets the pick attack through before darkening the damped string body. */
const palmMuteFilterSweepSeconds = 0.03;
// Hammer-ons/pull-offs are quieter than picked notes in this single-note model.
const hammerOnPullOffGain = 0.048 * playbackGainMultiplier;
// Hammer-ons/pull-offs bloom slightly after the fret-hand articulation.
const hammerOnPullOffAttackSeconds = 0.018;
// Palm mutes decay quickly; this caps long score durations to a short thump.
const palmMuteMaxDurationSeconds = 0.18;
// Harmonics speak more lightly than normal fretted notes in this simple model.
const harmonicGain = 0.045 * playbackGainMultiplier;
// Natural/pinch harmonic playback uses the first octave partial for now.
const harmonicSemitones = NOTES_PER_OCTAVE;
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
// Downbeat notes get a small emphasis for a less mechanical feel.
const downbeatGainMultiplier = 1.08;
// Repeated notes are softened slightly to reduce machine-gun playback.
const repeatedNoteGainMultiplier = 0.92;
/** Makes accented attacks clearly louder than unaccented notes. */
const accentGainMultiplier = 1.3;
/** Makes heavily accented attacks louder than accented notes. */
const heavyAccentGainMultiplier = 1.6;
/**
 * Peak gain multiplier of each beat dynamic, relative to mf. Soft levels are
 * spread wider than loud ones (ppp is about -10 dB, fff about +4 dB), so loud
 * beats keep headroom for accents.
 */
const dynamicGainMultipliers: Record<Dynamic, number> = {
  [Dynamic.Pianississimo]: 0.3,
  [Dynamic.Pianissimo]: 0.42,
  [Dynamic.Piano]: 0.56,
  [Dynamic.MezzoPiano]: 0.75,
  [Dynamic.MezzoForte]: 1,
  [Dynamic.Forte]: 1.2,
  [Dynamic.Fortissimo]: 1.38,
  [Dynamic.Fortississimo]: 1.55,
};
/**
 * Highest envelope peak of one note. Sources reach at most full scale, so at
 * track and master volumes of 0 dB one note cannot clip; the limit leaves a
 * small safety margin. Only the loudest dynamics with accents can reach it.
 * Boosts above 0 dB are caught by the master limiter.
 */
export const MAX_NOTE_PEAK_GAIN = 0.9;
/** Allows floating-point timing drift when comparing a tie with the playback boundary. */
const continuationTimingToleranceSeconds = 1e-9;
/** Dead-note noise is a short string strike rather than a pitched note. */
const deadNoteDurationSeconds = 0.05;
/** Dead-note filter cutoffs follow the tuned open string, including its octave. */
// Keep low strings dark without flattening the normal bass range to one cutoff.
const deadNoteMinimumFilterFrequency = 120;
const deadNoteMaximumFilterFrequency = 6000;
const deadNoteAttackSeconds = 0.003;
const deadNoteReleaseSeconds = 0.02;
const deadNoteShaperCurveLength = 256;

/** One written note in a shared source's tie chain, with any final resonance tail. */
type SustainSegment = {
  /** Note whose techniques apply during this segment. */
  note: Note;
  /** Absolute audio-context start time in seconds for this note's automation. */
  startTime: number;
  /** Absolute segment end in seconds, including any Let Ring resonance. */
  stopTime: number;
  /** Written automation end in absolute seconds; resonance must not stretch bends. */
  automationStopTime: number;
};

/** Shared tie and resonance information for duration and attack cutoffs. */
type NoteSustain = {
  /** Written intervals that share one source and keep separate pitch automation. */
  segments: SustainSegment[];
  /** Whether any member of the logical note requests Let Ring resonance. */
  hasLetRing: boolean;
};

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

/** Optional timing and pitch inputs for scheduling one note. */
export type ScheduleNoteOptions = {
  /** Hard playback boundary that techniques may not exceed. */
  maxStopTime?: number;
  /**
   * Start of this pass; incoming ties may sound here. The -Infinity default
   * suppresses all valid continuations.
   */
  playbackStartTime?: number;
  /** Global pitch shift in semitones applied to the source. */
  pitchShiftSemitones?: number;
  /** Absolute source start; a stroke moves it away from the beat start. */
  attackTime?: number;
};

type TechniqueEnvelopeSettings = {
  attackSeconds: number;
  peakGain: number;
  releaseSeconds: number;
  stopTime: number;
};

/**
 * Schedules Web Audio nodes for individual notes.
 * Resolves ties and Let Ring tails for each source. Score-level traversal and
 * rolling scheduling belong to PlaybackScheduler; transport belongs to ScorePlayer.
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
  private createSourceNode(note: Note, frequency: number): PlaybackSourceNode {
    const tone = note.trackContext.instrument.tone;
    const sample = this._sampleManager.getSample(tone);
    const rootFrequency = this._sampleManager.getRootFrequency(tone);
    if (sample === undefined || rootFrequency === undefined) {
      const oscillatorNode = this._audioContext.createOscillator();
      oscillatorNode.type = this.getToneProfile(note).oscillatorType;
      oscillatorNode.frequency.value = frequency;
      return oscillatorNode;
    }

    const bufferSourceNode = this._audioContext.createBufferSource();
    bufferSourceNode.buffer = sample;
    const loop = this._sampleManager.getLoop(tone);
    if (loop !== undefined) {
      // Play the attack once, then repeat only the authored sustain region.
      bufferSourceNode.loop = true;
      bufferSourceNode.loopStart = loop.start;
      bufferSourceNode.loopEnd = loop.end;
    }

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
    return 2 ** (semitones / NOTES_PER_OCTAVE);
  }

  /** Returns playback shaping defaults for the note's instrument tone. */
  private getToneProfile(note: Note): PlaybackToneProfile {
    return getPlaybackToneProfile(note.trackContext.instrument.tone);
  }

  /** Creates and schedules a short filtered-noise strike for a dead note. */
  private produceDeadNote(
    note: Note,
    startTime: number,
    stopTime: number,
    trackBus: TrackAudioBus,
    maxStopTime?: number
  ): ScheduledAudioNode | null {
    const effectiveStopTime = Math.min(
      stopTime,
      startTime + deadNoteDurationSeconds,
      maxStopTime ?? Infinity
    );
    if (effectiveStopTime <= startTime) {
      return null;
    }

    if (!(note instanceof GuitarNote)) {
      return null;
    }
    const openString = note.trackContext.instrument.tuning[note.stringNum - 1];
    if (openString === undefined || openString.octave === null) {
      return null;
    }

    const openFrequency = getFrequencyFromNoteType(openString);
    if (openFrequency <= 0) {
      return null;
    }

    const sampleRate = this._audioContext.sampleRate;
    const toneProfile = this.getToneProfile(note);
    const noiseBuffer = this._audioContext.createBuffer(
      1,
      Math.ceil(sampleRate * deadNoteDurationSeconds),
      sampleRate
    );
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    const sourceNode = this._audioContext.createBufferSource();
    sourceNode.buffer = noiseBuffer;
    const filterNode = this._audioContext.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.value = Math.min(
      deadNoteMaximumFilterFrequency,
      Math.max(
        deadNoteMinimumFilterFrequency,
        openFrequency * toneProfile.deadNoteBrightnessMultiplier
      )
    );
    const intermediateNodes: AudioNode[] = [filterNode];
    let outputNode: AudioNode = filterNode;
    if (toneProfile.deadNoteDrive > 1) {
      const shaperNode = this._audioContext.createWaveShaper();
      const curve = new Float32Array(deadNoteShaperCurveLength);
      for (let i = 0; i < curve.length; i++) {
        const input = (i * 2) / (curve.length - 1) - 1;
        curve[i] = Math.tanh(input * toneProfile.deadNoteDrive);
      }
      shaperNode.curve = curve;
      shaperNode.oversample = "2x";
      outputNode.connect(shaperNode);
      outputNode = shaperNode;
      intermediateNodes.push(shaperNode);
    }
    const gainNode = this._audioContext.createGain();
    const unlimitedPeakGain =
      notePeakGain *
      deadNoteGainMultiplier *
      toneProfile.deadNoteGainMultiplier *
      this.getContextGainMultiplier(note) *
      this.getAttackGainMultiplier(note);
    const peakGain = Math.min(unlimitedPeakGain, MAX_NOTE_PEAK_GAIN);
    const attackEndTime = Math.min(
      startTime + deadNoteAttackSeconds * toneProfile.attackMultiplier,
      effectiveStopTime
    );
    const releaseStartTime = Math.max(
      attackEndTime,
      effectiveStopTime - deadNoteReleaseSeconds * toneProfile.releaseMultiplier
    );
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, attackEndTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, releaseStartTime);
    gainNode.gain.linearRampToValueAtTime(0, effectiveStopTime);

    try {
      sourceNode.connect(filterNode);
      outputNode.connect(gainNode);
      gainNode.connect(trackBus.gainNode);
      sourceNode.start(startTime);
      sourceNode.stop(effectiveStopTime);
    } catch (error) {
      try {
        sourceNode.stop(this._audioContext.currentTime);
      } catch {
        // The source may not have started or may already be stopped.
      }
      sourceNode.disconnect();
      filterNode.disconnect();
      for (const node of intermediateNodes.slice(1)) {
        node.disconnect();
      }
      gainNode.disconnect();
      throw error;
    }

    return {
      sourceNode,
      track: note.beat.voiceBar.bar.staff.track,
      gainNode,
      intermediateNodes,
      startTime,
    };
  }

  /** Returns a small musical gain variation from beat/note context. */
  private getContextGainMultiplier(note: Note): number {
    let multiplier = 1;
    if (note.beat.startTick === 0) {
      multiplier *= downbeatGainMultiplier;
    }

    const prevBeat = note.beat.voiceBar.bar.staff.getPrevBeat(note.beat);
    const prevNote = this.getSameStringNote(note, prevBeat?.notes ?? null);
    const repeatsPitch =
      prevNote !== null &&
      getNoteFrequency(prevNote) === getNoteFrequency(note);
    if (repeatsPitch) {
      multiplier *= repeatedNoteGainMultiplier;
    }

    return multiplier;
  }

  /** Returns the attack loudness of a note: its beat's dynamic times its accent. */
  private getAttackGainMultiplier(note: Note): number {
    return (
      dynamicGainMultipliers[note.beat.dynamic] *
      this.getAccentGainMultiplier(note)
    );
  }

  /** Returns the gain boost of an accented or heavily accented note. */
  private getAccentGainMultiplier(note: Note): number {
    if (!(note instanceof GuitarNote)) {
      return 1;
    }
    const accent = note.techniques.find(
      (t) => t.type === GuitarTechniqueType.Accent
    )?.accentOptions;
    if (accent === null || accent === undefined) {
      return 1;
    }
    return accent.kind === AccentType.Heavy
      ? heavyAccentGainMultiplier
      : accentGainMultiplier;
  }

  /** Returns the source parameter that controls pitch. */
  private getSourcePitchParam(sourceNode: PlaybackSourceNode): AudioParam {
    if ("frequency" in sourceNode) {
      return sourceNode.frequency;
    }

    return sourceNode.playbackRate;
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
    // Bend options use whole tones; playback pitch conversion uses semitones.
    const bendValue = baseValue * this.semitonesToRate(bendPitch * 2);
    const prebendValue = baseValue * this.semitonesToRate(prebendPitch * 2);
    const releaseValue = baseValue * this.semitonesToRate(releasePitch * 2);
    const continuationPitch =
      params.note instanceof GuitarNote
        ? params.note.getBendContinuationPitch()
        : undefined;
    const continuationValue =
      continuationPitch === undefined
        ? baseValue
        : baseValue * this.semitonesToRate(continuationPitch * 2);
    const bendStartValue =
      options.type === BendType.Bend || options.type === BendType.BendAndRelease
        ? continuationValue
        : baseValue;

    return {
      bendRamp: {
        pitchParam,
        startValue: bendStartValue,
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

  private getContinuationValue(params: PitchAutomationParams): number {
    if (!(params.note instanceof GuitarNote)) {
      throw Error("Bend continuation requires a guitar note");
    }
    const continuationPitch = params.note.getBendContinuationPitch();
    if (continuationPitch === undefined) {
      throw Error(
        "Hold and Release playback require a previous bend continuation"
      );
    }
    return params.baseValue * this.semitonesToRate(continuationPitch * 2);
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
        this.applyPitchRamp(values.bendRamp);
        break;
      case BendType.Hold:
        pitchParam.setValueAtTime(this.getContinuationValue(params), startTime);
        break;
      case BendType.BendAndRelease:
        this.applyPitchRamp(values.bendRamp);
        pitchParam.linearRampToValueAtTime(values.releaseValue, stopTime);
        break;
      case BendType.Prebend:
        pitchParam.setValueAtTime(values.prebendValue, startTime);
        break;
      case BendType.PrebendAndRelease:
        this.applyPitchRamp(values.releaseRamp);
        break;
      case BendType.Release:
        this.applyPitchRamp({
          ...values.releaseRamp,
          startValue: this.getContinuationValue(params),
        });
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
    sourceNode: PlaybackSourceNode,
    frequency: number,
    startTime: number,
    stopTime: number,
    slideTargetStartTime: number | null
  ): void {
    const pitchParam = this.getSourcePitchParam(sourceNode);
    const isOscillator = "frequency" in sourceNode;
    const baseValue = isOscillator ? frequency : sourceNode.playbackRate.value;
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

    const inheritedBendPitch =
      note instanceof GuitarNote ? note.getBendContinuationPitch() : undefined;
    // Inherited bends use whole tones; the rate conversion takes semitones.
    const initialPitchValue =
      techniqueBaseValue * this.semitonesToRate((inheritedBendPitch ?? 0) * 2);
    pitchParam.setValueAtTime(initialPitchValue, startTime);

    for (const technique of note.techniques) {
      if (!(technique instanceof GuitarTechnique)) {
        continue;
      }
      const isHarmonic =
        technique.type === GuitarTechniqueType.NaturalHarmonic ||
        technique.type === GuitarTechniqueType.PinchHarmonic;
      if (isHarmonic) {
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

  /** Resolves note envelope settings, limiting the peak to MAX_NOTE_PEAK_GAIN. */
  private getTechniqueEnvelopeSettings(
    note: Note,
    stopTime: number,
    startTime: number
  ): TechniqueEnvelopeSettings {
    const settings = this.getUnlimitedEnvelopeSettings(
      note,
      stopTime,
      startTime
    );
    settings.peakGain = Math.min(settings.peakGain, MAX_NOTE_PEAK_GAIN);
    return settings;
  }

  /** Resolves note envelope settings affected by guitar techniques. */
  private getUnlimitedEnvelopeSettings(
    note: Note,
    stopTime: number,
    startTime: number
  ): TechniqueEnvelopeSettings {
    const profile = this.getToneProfile(note);
    // Legato and harmonics replace the peak gain, so they apply it again.
    const attackGain = this.getAttackGainMultiplier(note);
    const settings: TechniqueEnvelopeSettings = {
      attackSeconds: attackSeconds * profile.attackMultiplier,
      peakGain:
        notePeakGain *
        profile.gainMultiplier *
        this.getContextGainMultiplier(note) *
        attackGain,
      releaseSeconds: releaseSeconds * profile.releaseMultiplier,
      stopTime,
    };

    const palmMuted = note.hasTechnique(GuitarTechniqueType.PalmMute);
    if (palmMuted) {
      settings.attackSeconds = palmMuteAttackSeconds;
      settings.peakGain *= palmMuteGain / notePeakGain;
      settings.stopTime = Math.min(
        settings.stopTime,
        startTime + palmMuteMaxDurationSeconds
      );
      return settings;
    }

    if (note.hasTechnique(GuitarTechniqueType.Legato)) {
      settings.attackSeconds = hammerOnPullOffAttackSeconds;
      settings.peakGain = hammerOnPullOffGain * attackGain;
    }

    const hasHarmonic =
      note.hasTechnique(GuitarTechniqueType.NaturalHarmonic) ||
      note.hasTechnique(GuitarTechniqueType.PinchHarmonic);
    if (hasHarmonic) {
      settings.peakGain = harmonicGain * attackGain;
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
    const nextNote = this.getSameStringNote(note, nextBeat?.notes ?? null);
    if (!(nextNote instanceof GuitarNote)) {
      return null;
    }

    return getNoteFrequency(nextNote) > 0 ? nextNote : null;
  }

  /** Returns the same-string note from another beat when both notes are guitar. */
  private getSameStringNote(
    note: Note,
    notes: Note[] | null
  ): GuitarNote | null {
    if (!(note instanceof GuitarNote) || notes === null) {
      return null;
    }

    const sameStringNote = notes[note.stringNum - 1];
    return sameStringNote instanceof GuitarNote ? sameStringNote : null;
  }

  /**
   * Resolves written ties first, then holds their terminal pitch through explicit Let Ring coverage.
   * @param attackTime Source start; the first segment's automation starts here
   */
  private getSustainSegments(
    note: Note,
    attackTime: number,
    stopTime: number
  ): NoteSustain {
    const segments: SustainSegment[] = [
      { note, startTime: attackTime, stopTime, automationStopTime: stopTime },
    ];
    if (!(note instanceof GuitarNote)) {
      return { segments, hasLetRing: false };
    }

    // Tied notes share one source but keep their own written automation intervals.
    const staff = note.beat.voiceBar.bar.staff;
    let sustainStopTime = stopTime;
    let current = note;
    let nextBeat = staff.getNextBeat(current.beat);
    while (nextBeat !== null) {
      const next = this.getSameStringNote(current, nextBeat.notes);
      if (!(next instanceof GuitarNote) || !next.isTieContinuation) {
        break;
      }
      const duration = ticksToSeconds(
        nextBeat.fullDurationTicks,
        nextBeat.voiceBar.tickResolution,
        nextBeat.voiceBar.bar.masterBar.tempo
      );
      segments.push({
        note: next,
        startTime: sustainStopTime,
        stopTime: sustainStopTime + duration,
        automationStopTime: sustainStopTime + duration,
      });
      sustainStopTime += duration;
      current = next;
      nextBeat = staff.getNextBeat(current.beat);
    }

    const ringTechniques = segments.flatMap((s) =>
      s.note.techniques.filter((t) => t.type === GuitarTechniqueType.LetRing)
    );
    // A selection may start inside a logical note whose marker is before the pass.
    let predecessor = note;
    while (predecessor.isTieContinuation) {
      const previous = predecessor.getTiePredecessor();
      if (previous === null) {
        break;
      }
      ringTechniques.push(
        ...previous.techniques.filter(
          (t) => t.type === GuitarTechniqueType.LetRing
        )
      );
      predecessor = previous;
    }
    while (nextBeat !== null && ringTechniques.length > 0) {
      const next = this.getSameStringNote(note, nextBeat.notes);
      if (next === null || !next.hasTechnique(GuitarTechniqueType.LetRing)) {
        break;
      }
      sustainStopTime += ticksToSeconds(
        nextBeat.fullDurationTicks,
        nextBeat.voiceBar.tickResolution,
        nextBeat.voiceBar.bar.masterBar.tempo
      );
      nextBeat = staff.getNextBeat(nextBeat);
    }
    segments[segments.length - 1].stopTime = sustainStopTime;
    return { segments, hasLetRing: ringTechniques.length > 0 };
  }

  /**
   * Finds the next attack on this string in any voice of the staff.
   * @returns Absolute audio-context seconds, or Infinity when no later attack exists.
   */
  private getNextStringAttackTime(note: GuitarNote, startTime: number): number {
    const staff = note.beat.voiceBar.bar.staff;
    const firstBar = staff.bars.indexOf(note.beat.voiceBar.bar);
    // The negative offset aligns this bar's start relative to the initial note.
    let barStartOffsetSeconds = -ticksToSeconds(
      note.beat.startTick,
      note.beat.voiceBar.tickResolution,
      note.beat.voiceBar.bar.masterBar.tempo
    );
    for (const bar of staff.bars.slice(firstBar)) {
      let nextAttack = Infinity;
      for (const voice of bar.voiceBarsAsArray) {
        for (const beat of voice.beats) {
          const candidate = beat.notes?.[note.stringNum - 1];
          const attackOffsetSeconds =
            barStartOffsetSeconds +
            ticksToSeconds(
              beat.startTick,
              voice.tickResolution,
              bar.masterBar.tempo
            );
          const isAttack =
            candidate instanceof GuitarNote &&
            candidate.fret !== null &&
            !candidate.isTieContinuation;
          if (attackOffsetSeconds > 0 && isAttack) {
            nextAttack = Math.min(nextAttack, startTime + attackOffsetSeconds);
          }
        }
      }
      if (nextAttack !== Infinity) {
        return nextAttack;
      }
      const duration = bar.masterBar.barDurationFraction;
      // A whole note has 4 quarter beats; a minute has 60 seconds.
      barStartOffsetSeconds +=
        ((duration.numerator / duration.denominator) * 4 * 60) /
        bar.masterBar.tempo;
    }
    return Infinity;
  }

  /** Skips a tied continuation when its predecessor belongs to this playback pass. */
  private isContinuationAlreadyScheduled(
    note: Note,
    startTime: number,
    playbackStartTime: number
  ): boolean {
    if (!(note instanceof GuitarNote) || !note.isTieContinuation) {
      return false;
    }
    const previous = note.getTiePredecessor();
    if (previous === null) {
      return false;
    }

    const beat = previous.beat;
    const duration = ticksToSeconds(
      beat.fullDurationTicks,
      beat.voiceBar.tickResolution,
      beat.voiceBar.bar.masterBar.tempo
    );
    // Ties join adjacent beats, so subtracting the predecessor's duration
    // reconstructs its start on the same audio-context timeline.
    const predecessorStartTime = startTime - duration;
    return (
      predecessorStartTime >=
      playbackStartTime - continuationTimingToleranceSeconds
    );
  }

  /** Whether a playable note follows a slide source and sounds through its source instead. */
  private isSlideTarget(note: Note): boolean {
    if (!(note instanceof GuitarNote)) {
      return false;
    }

    const prevBeat = note.beat.voiceBar.bar.staff.getPrevBeat(note.beat);
    const prevNote = prevBeat?.notes?.[note.stringNum - 1];
    return (
      prevNote instanceof GuitarNote &&
      prevNote.hasTechnique(GuitarTechniqueType.Slide) &&
      getNoteFrequency(note) > 0
    );
  }

  /**
   * Whether the note starts its own sound in this pass. Empty slots, slide
   * targets, unpitched notes, and tie continuations whose predecessor sounds in
   * this pass do not attack. A continuation at the pass start does attack.
   * @param startTime Absolute rhythmic start of the note's beat
   * @param playbackStartTime Start of this pass
   */
  public isAttackInPass(
    note: Note,
    startTime: number,
    playbackStartTime = -Infinity
  ): boolean {
    if (note.noteValue === NoteValue.None || this.isSlideTarget(note)) {
      return false;
    }
    if (note.noteValue === NoteValue.Dead) {
      return true;
    }
    if (getNoteFrequency(note) <= 0) {
      return false;
    }

    return !this.isContinuationAlreadyScheduled(
      note,
      startTime,
      playbackStartTime
    );
  }

  /**
   * Schedules one note using a configured sample or oscillator fallback.
   * @param note Note to schedule
   * @param startTime Absolute rhythmic start of the note's beat, used for tie and Let Ring timing
   * @param stopTime Absolute audio context stop time
   * @returns Created audio nodes, or null when the note does not attack in this pass
   */
  public scheduleNote(
    note: Note,
    startTime: number,
    stopTime: number,
    trackBus: TrackAudioBus,
    options: ScheduleNoteOptions = {}
  ): ScheduledAudioNode | null {
    const {
      maxStopTime,
      playbackStartTime = -Infinity,
      pitchShiftSemitones = 0,
      attackTime = startTime,
    } = options;
    if (!this.isAttackInPass(note, startTime, playbackStartTime)) {
      return null;
    }
    if (note.noteValue === NoteValue.Dead) {
      return this.produceDeadNote(
        note,
        attackTime,
        stopTime,
        trackBus,
        maxStopTime
      );
    }
    const frequency = getNoteFrequency(note);

    const { segments, hasLetRing } = this.getSustainSegments(
      note,
      attackTime,
      stopTime
    );
    const finalSegment = segments[segments.length - 1];
    const sustainedStopTime = finalSegment.stopTime;
    const envelopeSettings = this.getTechniqueEnvelopeSettings(
      note,
      sustainedStopTime,
      attackTime
    );
    if (segments.length > 1) {
      // Exact tie duration takes precedence over palm-mute shortening and slide
      // extension of the envelope; their other settings still apply.
      envelopeSettings.stopTime = sustainedStopTime;
    }
    // Known gap: the next attack is found at its beat time, without its stroke offset.
    const resonanceStopTime =
      note instanceof GuitarNote && hasLetRing
        ? this.getNextStringAttackTime(note, startTime)
        : Infinity;
    const effectiveStopTime = Math.min(
      envelopeSettings.stopTime,
      resonanceStopTime,
      maxStopTime ?? Infinity
    );
    const attackEndTime = Math.min(
      attackTime + envelopeSettings.attackSeconds,
      effectiveStopTime
    );
    const releaseStartTime = Math.max(
      attackEndTime,
      effectiveStopTime - envelopeSettings.releaseSeconds
    );
    const track = note.beat.voiceBar.bar.staff.track;

    const sourceNode = this.createSourceNode(note, frequency);
    const pitchShiftParam = sourceNode.detune;
    // Set the initial value, rather than a future event. Live changes must not
    // be overwritten by a stale buffered-note event at its start time.
    pitchShiftParam.value = pitchShiftSemitones * CENTS_PER_SEMITONE;
    const gainNode = this._audioContext.createGain();
    gainNode.gain.setValueAtTime(0, attackTime);
    gainNode.gain.linearRampToValueAtTime(
      envelopeSettings.peakGain,
      attackEndTime
    );
    let releaseGain = envelopeSettings.peakGain;
    if (note.hasTechnique(GuitarTechniqueType.PalmMute)) {
      const decaySeconds = Math.min(
        palmMuteMaximumDecaySeconds,
        Math.max(
          palmMuteMinimumDecaySeconds,
          palmMuteDecaySeconds * Math.sqrt(220 / frequency)
        )
      );
      gainNode.gain.setTargetAtTime(0, attackEndTime, decaySeconds);
      // Anchor the final fade at the decayed level, not the original peak.
      releaseGain *= Math.exp(
        -(releaseStartTime - attackEndTime) / decaySeconds
      );
    }
    gainNode.gain.setValueAtTime(releaseGain, releaseStartTime);
    gainNode.gain.linearRampToValueAtTime(0, effectiveStopTime);
    for (const segment of segments) {
      if (segment.startTime >= effectiveStopTime) {
        break;
      }
      const automationStopTime = Math.min(
        segment.automationStopTime,
        effectiveStopTime
      );
      // A source slide reaches its target at the original note's written end,
      // before extended sustain. Tied segments currently use that same boundary.
      this.applyTechniqueAutomation(
        segment.note,
        sourceNode,
        frequency,
        segment.startTime,
        automationStopTime,
        segment.note.hasTechnique(GuitarTechniqueType.Slide) ? stopTime : null
      );
    }

    const intermediateNodes: AudioNode[] = [];
    if (note.hasTechnique(GuitarTechniqueType.PalmMute)) {
      const filter = this._audioContext.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 0.5;
      // Follow pitch so high notes keep their body; leave low strings some bite.
      const maximumCutoff = this._audioContext.sampleRate * 0.45;
      const cutoff = Math.min(maximumCutoff, Math.max(800, frequency * 4));
      const attackCutoff = Math.min(maximumCutoff, cutoff * 4);
      filter.frequency.setValueAtTime(attackCutoff, attackTime);
      filter.frequency.setValueAtTime(attackCutoff, attackEndTime);
      filter.frequency.linearRampToValueAtTime(
        cutoff,
        Math.min(attackEndTime + palmMuteFilterSweepSeconds, effectiveStopTime)
      );
      intermediateNodes.push(filter);
    }

    try {
      if (intermediateNodes.length > 0) {
        sourceNode.connect(intermediateNodes[0]);
        intermediateNodes[0].connect(gainNode);
      } else {
        sourceNode.connect(gainNode);
      }
      gainNode.connect(trackBus.gainNode);
      sourceNode.start(attackTime);
      sourceNode.stop(effectiveStopTime);
    } catch (error) {
      try {
        sourceNode.stop(this._audioContext.currentTime);
      } catch {
        // The source may not have started or may already be stopped.
      }
      sourceNode.disconnect();
      gainNode.disconnect();
      for (const node of intermediateNodes) {
        node.disconnect();
      }
      throw error;
    }

    return {
      sourceNode,
      track,
      pitchShiftParam,
      gainNode,
      intermediateNodes:
        intermediateNodes.length > 0 ? intermediateNodes : undefined,
      startTime: attackTime,
    };
  }
}
