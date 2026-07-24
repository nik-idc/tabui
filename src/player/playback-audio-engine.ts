import { ResolvedPlaybackConfig } from "../config/tabui-config";
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
import type {
  MasterAudioBus,
  ScheduledAudioNode,
  TrackAudioBus,
} from "./scheduled-audio-node";

/** Owns Web Audio resources and renders scheduled score material. */
export class PlaybackAudioEngine {
  private readonly _score: Score;
  private readonly _playbackConfig: ResolvedPlaybackConfig;
  private _sampleManager?: PlaybackSampleManager;
  private _noteScheduler?: PlaybackNoteScheduler;
  private _scheduledAudioNodes: Set<ScheduledAudioNode>;
  private _trackAudioBuses: Map<number, TrackAudioBus>;
  private _masterAudioBus?: MasterAudioBus;
  private _audioContext?: AudioContext;

  constructor(score: Score, playbackConfig: ResolvedPlaybackConfig) {
    this._score = score;
    this._playbackConfig = playbackConfig;
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
        this._playbackConfig
      );
      this._noteScheduler = new PlaybackNoteScheduler(
        audioContext,
        this._sampleManager
      );
      this._masterAudioBus = this.createMasterAudioBus();
      this.rebuildTrackAudioBuses();
      this.applyMasterControls();
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
    this._sampleManager = undefined;
    this._noteScheduler = undefined;
    this._audioContext = undefined;
    this._masterAudioBus = undefined;
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
    await this._sampleManager.loadConfiguredSamples();
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
    maxStopTime?: number
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
        maxStopTime
      );
      if (scheduledAudioNode === null) {
        continue;
      }

      scheduledAudioNode.sourceNode.onended = () => {
        scheduledAudioNode.sourceNode.disconnect();
        scheduledAudioNode.gainNode.disconnect();
        this._scheduledAudioNodes.delete(scheduledAudioNode);
      };
      this._scheduledAudioNodes.add(scheduledAudioNode);
    }
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
