import {
  Beat,
  Score,
  Track,
  VoiceNumber,
  fractionLt,
  ticksToFraction,
} from "../notation/model";
import { trackEvent, TrackEventType } from "../shared/events";
import type { ScheduledBeatChange } from "./playback-scheduler";

/** Projects the multi-track playback timeline onto one notation cursor. */
export class PlaybackCursorCoordinator {
  private readonly _score: Score;
  private readonly _playerUUID: number;
  private _scheduledTimeouts: Map<
    ReturnType<typeof setTimeout>,
    ScheduledBeatChange
  >;
  private _activeTrackUUID: number;
  private _activeStaffUUID: number;
  private _activeVoiceNumber: VoiceNumber;
  private _lastStartedBeat?: Beat;
  private _playbackAnchorBeat?: Beat;
  private _retainedBeatChanges: ScheduledBeatChange[];
  private _playbackRunId: number;

  constructor(score: Score, activeTrack: Track, playerUUID: number) {
    this._score = score;
    this._playerUUID = playerUUID;
    this._scheduledTimeouts = new Map();
    this._activeTrackUUID = activeTrack.uuid;
    this._activeStaffUUID = activeTrack.staves[0].uuid;
    this._activeVoiceNumber = 1;
    this._retainedBeatChanges = [];
    this._playbackRunId = 0;
  }

  private clearAllTimeouts(): void {
    for (const timeout of this._scheduledTimeouts.keys()) {
      clearTimeout(timeout);
    }
    this._scheduledTimeouts.clear();
  }

  private retainBeatChanges(
    currentTime: number,
    ...beatChanges: ScheduledBeatChange[]
  ): void {
    for (const beatChange of beatChanges) {
      const existingIndex = this._retainedBeatChanges.findIndex(
        (candidate) =>
          candidate.beat === beatChange.beat &&
          candidate.startTime === beatChange.startTime
      );
      if (existingIndex === -1) {
        this._retainedBeatChanges.push(beatChange);
      } else {
        this._retainedBeatChanges[existingIndex] = beatChange;
      }
    }

    this._retainedBeatChanges.sort((a, b) => a.startTime - b.startTime);
    const latestPastByTrack = new Map<number, ScheduledBeatChange>();
    const currentAndFuture: ScheduledBeatChange[] = [];
    for (const beatChange of this._retainedBeatChanges) {
      const trackUUID = beatChange.beat.voiceBar.bar.staff.track.uuid;
      if (beatChange.startTime < currentTime) {
        latestPastByTrack.set(trackUUID, beatChange);
      } else {
        currentAndFuture.push(beatChange);
      }
    }
    this._retainedBeatChanges = [
      ...latestPastByTrack.values(),
      ...currentAndFuture,
    ].sort((a, b) => a.startTime - b.startTime);
  }

  private getCurrentRetainedBeatChange(
    cursorBeatChanges: ScheduledBeatChange[],
    currentTime: number
  ): ScheduledBeatChange | undefined {
    let currentBeatChange: ScheduledBeatChange | undefined;
    for (const beatChange of cursorBeatChanges) {
      if (beatChange.startTime > currentTime) {
        break;
      }
      currentBeatChange = beatChange;
    }
    return currentBeatChange;
  }

  private handleScheduledBeatChange(
    beatChange: ScheduledBeatChange,
    nextBeatChange: ScheduledBeatChange | undefined,
    currentTime: number,
    playbackRunId: number
  ): void {
    const delayMs = Math.max(0, (beatChange.startTime - currentTime) * 1000);
    const timeout = setTimeout(() => {
      this._scheduledTimeouts.delete(timeout);
      if (
        playbackRunId !== this._playbackRunId ||
        beatChange.beat.voiceBar.bar.staff.track.uuid !== this._activeTrackUUID
      ) {
        return;
      }

      this._lastStartedBeat = beatChange.beat;
      trackEvent.emit(TrackEventType.PlayerCurBeatChanged, {
        trackUUID: beatChange.beat.voiceBar.bar.staff.track.uuid,
        playerUUID: this._playerUUID,
        beatUUID: beatChange.beat.uuid,
        nextBeatUUID: nextBeatChange?.beat.uuid,
        startTime: beatChange.startTime,
        endTime: nextBeatChange?.startTime ?? beatChange.endTime,
        playbackRunId,
      });
    }, delayMs);
    this._scheduledTimeouts.set(timeout, beatChange);
  }

  private getCursorBeatPriority(
    beat: Beat,
    activeStaffUUID: number,
    activeVoiceNumber: VoiceNumber
  ): number {
    if (beat.voiceBar.bar.staff.uuid !== activeStaffUUID) {
      return 0;
    }
    return beat.voiceBar.voiceNumber === activeVoiceNumber ? 2 : 1;
  }

  private getCursorBeatChanges(
    beatChanges: ScheduledBeatChange[],
    activeTrackUUID: number = this._activeTrackUUID,
    activeStaffUUID: number = this._activeStaffUUID,
    activeVoiceNumber: VoiceNumber = this._activeVoiceNumber
  ): ScheduledBeatChange[] {
    const activeTrackBeatChanges = beatChanges
      .filter(
        ({ beat }) => beat.voiceBar.bar.staff.track.uuid === activeTrackUUID
      )
      .sort((a, b) => a.startTime - b.startTime);
    const cursorBeatChanges: ScheduledBeatChange[] = [];
    for (const beatChange of activeTrackBeatChanges) {
      const previous = cursorBeatChanges[cursorBeatChanges.length - 1];
      if (previous?.startTime === beatChange.startTime) {
        const previousPriority = this.getCursorBeatPriority(
          previous.beat,
          activeStaffUUID,
          activeVoiceNumber
        );
        const beatPriority = this.getCursorBeatPriority(
          beatChange.beat,
          activeStaffUUID,
          activeVoiceNumber
        );
        if (
          beatPriority > previousPriority ||
          (beatPriority === previousPriority &&
            beatChange.endTime > previous.endTime)
        ) {
          cursorBeatChanges[cursorBeatChanges.length - 1] = beatChange;
        }
        continue;
      }
      cursorBeatChanges.push(beatChange);
    }
    return cursorBeatChanges;
  }

  private isForwardBeatChange(
    beatChange: ScheduledBeatChange,
    nextBeatChange: ScheduledBeatChange
  ): boolean {
    const currentMasterBarIndex = this._score.masterBars.indexOf(
      beatChange.beat.voiceBar.bar.masterBar
    );
    const nextMasterBarIndex = this._score.masterBars.indexOf(
      nextBeatChange.beat.voiceBar.bar.masterBar
    );
    const beatPosition = ticksToFraction(
      beatChange.beat.startTick,
      beatChange.beat.voiceBar.tickResolution
    );
    const nextBeatPosition = ticksToFraction(
      nextBeatChange.beat.startTick,
      nextBeatChange.beat.voiceBar.tickResolution
    );
    return (
      nextMasterBarIndex > currentMasterBarIndex ||
      (nextMasterBarIndex === currentMasterBarIndex &&
        fractionLt(beatPosition, nextBeatPosition))
    );
  }

  private scheduleBeatChanges(
    beatChanges: ScheduledBeatChange[],
    nextBeatChanges: ScheduledBeatChange[],
    currentTime: number,
    playbackRunId: number
  ): void {
    const cursorBeatChanges = this.getCursorBeatChanges(beatChanges);
    this._playbackAnchorBeat ??= cursorBeatChanges[0]?.beat;
    const nextCursorBeatChange = this.getCursorBeatChanges(nextBeatChanges)[0];
    for (let i = 0; i < cursorBeatChanges.length; i++) {
      let nextBeatChange: ScheduledBeatChange | undefined =
        cursorBeatChanges[i + 1] ?? nextCursorBeatChange;
      nextBeatChange =
        nextBeatChange !== undefined &&
        this.isForwardBeatChange(cursorBeatChanges[i], nextBeatChange)
          ? nextBeatChange
          : undefined;
      this.handleScheduledBeatChange(
        cursorBeatChanges[i],
        nextBeatChange,
        currentTime,
        playbackRunId
      );
    }
  }

  private rescheduleForActiveTrack(
    currentTime: number,
    playbackRunId: number
  ): void {
    const cursorBeatChanges = this.getCursorBeatChanges(
      this._retainedBeatChanges
    );
    const currentBeatChange = this.getCurrentRetainedBeatChange(
      cursorBeatChanges,
      currentTime
    );
    const activeBeatChange = currentBeatChange ?? cursorBeatChanges[0];
    this.clearAllTimeouts();
    if (activeBeatChange === undefined) {
      this._lastStartedBeat = undefined;
      this._playbackAnchorBeat = undefined;
      return;
    }

    this._activeTrackUUID = activeBeatChange.beat.voiceBar.bar.staff.track.uuid;
    this._activeStaffUUID = activeBeatChange.beat.voiceBar.bar.staff.uuid;
    this._activeVoiceNumber = activeBeatChange.beat.voiceBar.voiceNumber;
    this._lastStartedBeat = currentBeatChange?.beat;
    this._playbackAnchorBeat = currentBeatChange?.beat;
    const currentIndex =
      currentBeatChange === undefined
        ? -1
        : cursorBeatChanges.indexOf(currentBeatChange);
    const firstBeatChangeIndex =
      currentBeatChange === undefined ? 0 : currentIndex;
    for (let i = firstBeatChangeIndex; i < cursorBeatChanges.length; i++) {
      const beatChange = cursorBeatChanges[i];
      const candidateNextBeatChange = cursorBeatChanges[i + 1];
      const nextBeatChange =
        candidateNextBeatChange !== undefined &&
        this.isForwardBeatChange(beatChange, candidateNextBeatChange)
          ? candidateNextBeatChange
          : undefined;
      this.handleScheduledBeatChange(
        beatChange,
        nextBeatChange,
        currentTime,
        playbackRunId
      );
    }
  }

  public processScheduledBeatChanges(
    beatChanges: ScheduledBeatChange[],
    nextBeatChanges: ScheduledBeatChange[],
    currentTime: number,
    playbackRunId: number
  ): void {
    this._playbackRunId = playbackRunId;
    this.retainBeatChanges(currentTime, ...beatChanges, ...nextBeatChanges);
    this.scheduleBeatChanges(
      beatChanges,
      nextBeatChanges,
      currentTime,
      playbackRunId
    );
  }

  public truncateFrom(startTime: number): void {
    this._retainedBeatChanges = this._retainedBeatChanges.filter(
      (beatChange) => beatChange.startTime < startTime
    );
    for (const [timeout, beatChange] of this._scheduledTimeouts) {
      if (beatChange.startTime < startTime) {
        continue;
      }
      clearTimeout(timeout);
      this._scheduledTimeouts.delete(timeout);
    }
  }

  public reset(playbackRunId: number): void {
    this._playbackRunId = playbackRunId;
    this._lastStartedBeat = undefined;
    this._playbackAnchorBeat = undefined;
    this._retainedBeatChanges = [];
    this.clearAllTimeouts();
  }

  public setActiveTrack(
    track: Track,
    currentTime: number | undefined,
    playbackRunId: number
  ): void {
    this._playbackRunId = playbackRunId;
    this._activeTrackUUID = track.uuid;
    this._activeStaffUUID = track.staves[0].uuid;
    if (currentTime === undefined) {
      this._activeVoiceNumber = 1;
      this._lastStartedBeat = undefined;
      this._playbackAnchorBeat = undefined;
      return;
    }
    this.rescheduleForActiveTrack(currentTime, playbackRunId);
  }

  public getCurrentBeatForTrack(
    track: Track,
    currentTime: number
  ): Beat | undefined {
    const cursorBeatChanges = this.getCursorBeatChanges(
      this._retainedBeatChanges,
      track.uuid,
      track.staves[0].uuid,
      this._activeVoiceNumber
    );
    return (
      this.getCurrentRetainedBeatChange(cursorBeatChanges, currentTime)?.beat ??
      cursorBeatChanges[0]?.beat
    );
  }

  public setPlaybackAnchorBeat(beat: Beat | undefined): void {
    this._playbackAnchorBeat = beat;
  }

  public preferBeatLane(beat: Beat): void {
    this._activeStaffUUID = beat.voiceBar.bar.staff.uuid;
    this._activeVoiceNumber = beat.voiceBar.voiceNumber;
  }

  public get activeTrackUUID(): number {
    return this._activeTrackUUID;
  }

  public get lastStartedBeat(): Beat | undefined {
    return this._lastStartedBeat;
  }

  public get playbackAnchorBeat(): Beat | undefined {
    return this._lastStartedBeat ?? this._playbackAnchorBeat;
  }
}
