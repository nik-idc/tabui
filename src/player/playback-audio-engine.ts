import { ResolvedPlaybackSampleConfigs } from "../config/tabui-config";
import {
  Beat,
  GuitarNote,
  GuitarTechniqueType,
  Score,
  Track,
  getNoteFrequency,
} from "../notation/model";
import { PlaybackNoteScheduler } from "./playback-note-scheduler";
import { PlaybackSampleManager } from "./playback-sample-manager";
import {
  CENTS_PER_SEMITONE,
  MAX_PITCH_SHIFT_SEMITONES,
  MIN_PITCH_SHIFT_SEMITONES,
} from "./playback-constants";
import {
  createMetronomeClick,
  METRONOME_BUS_LEVEL,
} from "./playback-metronome";
import type {
  MasterAudioBus,
  ScheduledAudioNode,
  TrackAudioBus,
  MetronomeAudioBus,
} from "./scheduled-audio-node";

/** Owns Web Audio resources and renders scheduled score material. */
export class PlaybackAudioEngine {
  private readonly _score: Score;
  private readonly _playbackSamples: ResolvedPlaybackSampleConfigs;
  private _sampleManager?: PlaybackSampleManager;
  private _noteScheduler?: PlaybackNoteScheduler;
  private _scheduledAudioNodes: Set<ScheduledAudioNode>;
  private _trackAudioBuses: Map<number, TrackAudioBus>;
  private _masterAudioBus?: MasterAudioBus;
  private _metronomeAudioBus?: MetronomeAudioBus;
  private _audioContext?: AudioContext;
  private _metronomeEnabled = false;
  private _pitchShiftSemitones = 0;

  constructor(score: Score, playbackSamples: ResolvedPlaybackSampleConfigs) {
    this._score = score;
    this._playbackSamples = playbackSamples;
    this._scheduledAudioNodes = new Set();
    this._trackAudioBuses = new Map();
  }

  private createTrackAudioBus(track: Track): TrackAudioBus {
    if (
      this._audioContext === undefined ||
      this._masterAudioBus === undefined
    ) {
      throw Error("Audio context undefined in rebuild track buses");
    }

    const gainNode = this._audioContext.createGain();
    let pannerNode: StereoPannerNode | undefined;
    try {
      pannerNode = this._audioContext.createStereoPanner();
      gainNode.connect(pannerNode);
      pannerNode.connect(this._masterAudioBus.gainNode);
      return { track, gainNode, pannerNode };
    } catch (error) {
      gainNode.disconnect();
      pannerNode?.disconnect();
      throw error;
    }
  }

  private createMasterAudioBus(): MasterAudioBus {
    if (this._audioContext === undefined) {
      throw Error("Audio context undefined in create master bus");
    }

    const gainNode = this._audioContext.createGain();
    let pannerNode: StereoPannerNode | undefined;
    try {
      pannerNode = this._audioContext.createStereoPanner();
      gainNode.connect(pannerNode);
      pannerNode.connect(this._audioContext.destination);
      return { gainNode, pannerNode };
    } catch (error) {
      gainNode.disconnect();
      pannerNode?.disconnect();
      throw error;
    }
  }

  private createMetronomeAudioBus(): MetronomeAudioBus {
    if (
      this._audioContext === undefined ||
      this._masterAudioBus === undefined
    ) {
      throw Error("Audio context undefined in create metronome bus");
    }
    const gainNode = this._audioContext.createGain();
    try {
      gainNode.gain.value = 0;
      gainNode.connect(this._masterAudioBus.gainNode);
      return { gainNode };
    } catch (error) {
      gainNode.disconnect();
      throw error;
    }
  }

  private rebuildTrackAudioBuses(): void {
    if (this._audioContext === undefined) {
      throw Error("Audio context undefined in rebuild track buses");
    }

    for (const bus of this._trackAudioBuses.values()) {
      bus.gainNode.disconnect();
      bus.pannerNode.disconnect();
    }
    this._trackAudioBuses.clear();

    for (const track of this._score.tracks) {
      this._trackAudioBuses.set(track.uuid, this.createTrackAudioBus(track));
    }
    this.applyTrackControls();
  }

  private getTrackAudioBus(track: Track): TrackAudioBus {
    let bus = this._trackAudioBuses.get(track.uuid);
    if (bus !== undefined) {
      return bus;
    }
    if (this._audioContext === undefined) {
      throw Error("Track audio bus is not initialized");
    }

    bus = this.createTrackAudioBus(track);
    this._trackAudioBuses.set(track.uuid, bus);
    this.applyTrackControls();
    return bus;
  }

  /** Lazily creates the context and its score-wide audio graph. */
  public initialize(): void {
    if (this._audioContext !== undefined) {
      return;
    }

    const audioContext = new AudioContext();
    this._audioContext = audioContext;
    try {
      this._sampleManager = new PlaybackSampleManager(
        audioContext,
        this._playbackSamples
      );
      this._noteScheduler = new PlaybackNoteScheduler(
        audioContext,
        this._sampleManager
      );
      this._masterAudioBus = this.createMasterAudioBus();
      this.rebuildTrackAudioBuses();
      this._metronomeAudioBus = this.createMetronomeAudioBus();
      this.applyMasterControls();
      this.setMetronomeEnabled(this._metronomeEnabled);
    } catch (error) {
      this.clearAudioContext();
      void audioContext.close().catch(() => {});
      throw error;
    }
  }

  private clearAudioContext(): void {
    for (const bus of this._trackAudioBuses.values()) {
      bus.gainNode.disconnect();
      bus.pannerNode.disconnect();
    }
    this._masterAudioBus?.gainNode.disconnect();
    this._masterAudioBus?.pannerNode.disconnect();
    this._metronomeAudioBus?.gainNode.disconnect();
    this._sampleManager = undefined;
    this._noteScheduler = undefined;
    this._audioContext = undefined;
    this._masterAudioBus = undefined;
    this._metronomeAudioBus = undefined;
    this._trackAudioBuses.clear();
  }

  /** Resumes the context after a user-initiated playback request. */
  public async resume(): Promise<void> {
    if (this._audioContext === undefined) {
      throw Error("Audio context is not initialized");
    }

    await this._audioContext.resume();
  }

  public async loadSamples(): Promise<void> {
    if (this._sampleManager === undefined) {
      throw Error("Playback sample manager is not initialized");
    }
    await this._sampleManager.loadSamplesForTones(
      this._score.tracks.map((track) => track.context.instrument.tone)
    );
  }

  private noteIsSlideTarget(note: unknown): boolean {
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

  public scheduleBeat(
    beat: Beat,
    startTime: number,
    endTime: number,
    maxStopTime?: number,
    playbackStartTime?: number
  ): void {
    if (this._noteScheduler === undefined) {
      throw Error("Playback note scheduler is not initialized");
    }

    const trackBus = this.getTrackAudioBus(beat.voiceBar.bar.staff.track);
    for (const note of beat.notes ?? []) {
      if (this.noteIsSlideTarget(note)) {
        continue;
      }

      const scheduledAudioNode = this._noteScheduler.scheduleNote(
        note,
        startTime,
        endTime,
        trackBus,
        maxStopTime,
        playbackStartTime,
        this._pitchShiftSemitones
      );
      if (scheduledAudioNode === null) {
        continue;
      }

      this.registerScheduledAudioNode(scheduledAudioNode);
    }
  }

  private registerScheduledAudioNode(
    scheduledAudioNode: ScheduledAudioNode
  ): void {
    scheduledAudioNode.sourceNode.onended = () => {
      scheduledAudioNode.sourceNode.disconnect();
      scheduledAudioNode.gainNode.disconnect();
      for (const node of scheduledAudioNode.intermediateNodes ?? []) {
        node.disconnect();
      }
      this._scheduledAudioNodes.delete(scheduledAudioNode);
    };
    this._scheduledAudioNodes.add(scheduledAudioNode);
  }

  /** Schedules a short click on the independent score-wide metronome bus. */
  public scheduleMetronomeClick(
    startTime: number,
    maxStopTime: number,
    accented: boolean
  ): void {
    if (
      this._audioContext === undefined ||
      this._metronomeAudioBus === undefined
    ) {
      throw Error("Audio context is not initialized");
    }
    const scheduledClick = createMetronomeClick(
      this._audioContext,
      startTime,
      maxStopTime,
      accented
    );
    if (scheduledClick === null) {
      return;
    }
    try {
      scheduledClick.gainNode.connect(this._metronomeAudioBus.gainNode);
    } catch (error) {
      try {
        scheduledClick.sourceNode.stop(this._audioContext.currentTime);
      } catch {
        // The source may already be stopped.
      }
      scheduledClick.sourceNode.disconnect();
      scheduledClick.gainNode.disconnect();
      throw error;
    }
    this.registerScheduledAudioNode(scheduledClick);
  }

  public stopScheduledAudioNodes(): void {
    const currentTime = this._audioContext?.currentTime;
    if (currentTime === undefined) {
      return;
    }
    for (const audioNode of this._scheduledAudioNodes) {
      try {
        audioNode.sourceNode.stop(currentTime);
      } catch {
        // Stopping an already stopped oscillator is harmless for teardown.
      }
      audioNode.gainNode.disconnect();
      audioNode.sourceNode.disconnect();
      for (const node of audioNode.intermediateNodes ?? []) {
        node.disconnect();
      }
    }
    this._scheduledAudioNodes.clear();
  }

  public stopAudioFrom(startTime: number): void {
    const currentTime = this._audioContext?.currentTime;
    if (currentTime === undefined) {
      return;
    }
    for (const audioNode of [...this._scheduledAudioNodes]) {
      if (audioNode.startTime < startTime) {
        continue;
      }
      try {
        audioNode.sourceNode.stop(currentTime);
      } catch {
        // Stopping an already stopped oscillator is harmless for teardown.
      }
      audioNode.gainNode.disconnect();
      audioNode.sourceNode.disconnect();
      for (const node of audioNode.intermediateNodes ?? []) {
        node.disconnect();
      }
      this._scheduledAudioNodes.delete(audioNode);
    }
  }

  private removeStaleTrackAudioBuses(): void {
    const trackUUIDs = new Set(this._score.tracks.map((track) => track.uuid));
    for (const [trackUUID, bus] of this._trackAudioBuses) {
      if (trackUUIDs.has(trackUUID)) {
        continue;
      }
      bus.gainNode.disconnect();
      bus.pannerNode.disconnect();
      this._trackAudioBuses.delete(trackUUID);
    }
  }

  public applyTrackControls(): void {
    const currentTime = this._audioContext?.currentTime;
    if (currentTime === undefined) {
      return;
    }
    this.removeStaleTrackAudioBuses();
    const hasSoloedTrack = this._score.tracks.some((track) => track.soloed);
    for (const bus of this._trackAudioBuses.values()) {
      const track = bus.track;
      const trackAudible = !track.muted && (!hasSoloedTrack || track.soloed);
      const trackGain = trackAudible ? track.volume : 0;
      bus.gainNode.gain.setValueAtTime(trackGain, currentTime);
      bus.pannerNode.pan.setValueAtTime(track.pan, currentTime);
    }
  }

  /** Changes the live metronome bus without touching buffered clicks. */
  public setMetronomeEnabled(enabled: boolean): void {
    this._metronomeEnabled = enabled;
    const currentTime = this._audioContext?.currentTime;
    if (currentTime !== undefined && this._metronomeAudioBus !== undefined) {
      this._metronomeAudioBus.gainNode.gain.setValueAtTime(
        enabled ? METRONOME_BUS_LEVEL : 0,
        currentTime
      );
    }
  }

  public get metronomeEnabled(): boolean {
    return this._metronomeEnabled;
  }

  /** Sets a global semitone offset on existing and future pitched sources. */
  public setPitchShiftSemitones(semitones: number): void {
    if (
      !Number.isFinite(semitones) ||
      !Number.isInteger(semitones) ||
      semitones < MIN_PITCH_SHIFT_SEMITONES ||
      semitones > MAX_PITCH_SHIFT_SEMITONES
    ) {
      throw new RangeError(
        `Pitch shift must be an integer from ${MIN_PITCH_SHIFT_SEMITONES} to ${MAX_PITCH_SHIFT_SEMITONES}`
      );
    }
    this._pitchShiftSemitones = semitones;
    const currentTime = this._audioContext?.currentTime;
    if (currentTime === undefined) return;
    for (const node of this._scheduledAudioNodes) {
      node.pitchShiftParam?.setValueAtTime(
        semitones * CENTS_PER_SEMITONE,
        currentTime
      );
    }
  }

  public get pitchShiftSemitones(): number {
    return this._pitchShiftSemitones;
  }

  public applyMasterControls(): void {
    const currentTime = this._audioContext?.currentTime;
    if (this._masterAudioBus === undefined || currentTime === undefined) {
      return;
    }
    this._masterAudioBus.gainNode.gain.setValueAtTime(
      this._score.masterVolume,
      currentTime
    );
    this._masterAudioBus.pannerNode.pan.setValueAtTime(
      this._score.masterPan,
      currentTime
    );
  }

  /** Closes the context and releases all context-backed helpers. */
  public dispose(): void {
    const audioContext = this._audioContext;
    this.clearAudioContext();
    if (audioContext !== undefined) {
      void audioContext.close().catch(() => {});
    }
  }

  /** Current Web Audio clock time. */
  public get currentTime(): number | undefined {
    return this._audioContext?.currentTime;
  }
}
