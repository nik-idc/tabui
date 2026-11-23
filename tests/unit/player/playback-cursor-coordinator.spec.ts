import { Guitar, NoteDuration } from "../../../src/notation/model";
import { PlaybackCursorCoordinator } from "../../../src/player/playback-cursor-coordinator";
import type { ScheduledBeatChange } from "../../../src/player/playback-scheduler";
import {
  trackEvent,
  TrackEventArgs,
  TrackEventType,
} from "../../../src/shared/events";
import { createBarWithBeats, createScoreGraph } from "../model/helpers";

function beatChange(
  beat: ScheduledBeatChange["beat"],
  startTime: number,
  endTime: number = startTime + 0.5
): ScheduledBeatChange {
  return { beat, startTime, endTime };
}

describe("PlaybackCursorCoordinator", () => {
  let events: TrackEventArgs[TrackEventType.PlayerCurBeatChanged][];
  const record = (event: TrackEventArgs[TrackEventType.PlayerCurBeatChanged]) =>
    events.push(event);

  beforeEach(() => {
    jest.useFakeTimers();
    events = [];
    trackEvent.on(TrackEventType.PlayerCurBeatChanged, record);
  });

  afterEach(() => {
    trackEvent.off(TrackEventType.PlayerCurBeatChanged, record);
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("emits cursor timing against the playback clock", () => {
    const { score, track, bar } = createScoreGraph();
    const beat = bar.ensureVoiceBar(1).beats[0];
    const coordinator = new PlaybackCursorCoordinator(score, track, 42);

    coordinator.processScheduledBeatChanges(
      [beatChange(beat, 10.5, 11)],
      [],
      10,
      1
    );
    jest.advanceTimersByTime(499);
    expect(events).toEqual([]);

    jest.advanceTimersByTime(1);
    expect(events).toEqual([
      {
        trackUUID: track.uuid,
        playerUUID: 42,
        beatUUID: beat.uuid,
        nextBeatUUID: undefined,
        startTime: 10.5,
        endTime: 11,
        playbackRunId: 1,
      },
    ]);
    expect(coordinator.lastStartedBeat).toBe(beat);
  });

  test("does not publish a beat until the live audio clock reaches it", () => {
    const { score, track, bar } = createScoreGraph();
    const beat = bar.ensureVoiceBar(1).beats[0];
    let audioTime = 0;
    const coordinator = new PlaybackCursorCoordinator(
      score,
      track,
      42,
      () => audioTime
    );

    coordinator.processScheduledBeatChanges([beatChange(beat, 0.5)], [], 0, 1);
    jest.advanceTimersByTime(500);
    expect(events).toHaveLength(0);
    expect(coordinator.lastStartedBeat).toBeUndefined();

    // A second wall-clock deadline must not advance a stalled audio clock.
    jest.advanceTimersByTime(500);
    expect(events).toHaveLength(0);

    audioTime = 0.5;
    jest.advanceTimersByTime(500);
    expect(events).toHaveLength(1);
    expect(events[0].beatUUID).toBe(beat.uuid);
    expect(coordinator.lastStartedBeat).toBe(beat);
  });

  test("rejects an active track without a staff", () => {
    const { score, track } = createScoreGraph();
    track.staves.splice(0, 1);

    expect(() => new PlaybackCursorCoordinator(score, track, 42)).toThrow(
      `PlaybackCursorCoordinator invariant violated: track ${track.uuid} has no staff`
    );
  });

  test("rejects stale playback generations", () => {
    const { score, track, bar } = createScoreGraph();
    const coordinator = new PlaybackCursorCoordinator(score, track, 42);
    coordinator.processScheduledBeatChanges(
      [beatChange(bar.ensureVoiceBar(1).beats[0], 0.5)],
      [],
      0,
      1
    );

    coordinator.processScheduledBeatChanges(
      [beatChange(bar.ensureVoiceBar(1).beats[0], 0.75)],
      [],
      0,
      2
    );
    jest.advanceTimersByTime(500);

    expect(events).toEqual([]);
    jest.advanceTimersByTime(250);
    expect(events).toHaveLength(1);
    expect(events[0].playbackRunId).toBe(2);
  });

  test("truncates cursor work at an inclusive boundary", () => {
    const { score, track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const coordinator = new PlaybackCursorCoordinator(score, track, 42);
    coordinator.processScheduledBeatChanges(
      [beatChange(beats[0], 1), beatChange(beats[1], 2)],
      [],
      0,
      1
    );

    coordinator.truncateFrom(2);
    jest.advanceTimersByTime(2000);

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({ beatUUID: beats[0].uuid })
    );
    expect(coordinator.getCurrentBeatForTrack(track, 2)).toBe(beats[0]);
  });

  test("queries and retargets buffered cursor timing for another track", () => {
    const { score, track, bar } = createScoreGraph();
    const secondTrack = score.addTrack(new Guitar(), "Track 2").tracks[0];
    const firstBeat = bar.ensureVoiceBar(1).beats[0];
    const secondBeat = secondTrack.staves[0].bars[0].ensureVoiceBar(1).beats[0];
    bar.ensureVoiceBar(1).insertBeat(1);
    secondTrack.staves[0].bars[0].ensureVoiceBar(1).insertBeat(1);
    const firstFuture = bar.ensureVoiceBar(1).beats[1];
    const secondFuture =
      secondTrack.staves[0].bars[0].ensureVoiceBar(1).beats[1];
    const coordinator = new PlaybackCursorCoordinator(score, track, 42);
    coordinator.processScheduledBeatChanges(
      [
        beatChange(firstBeat, 0),
        beatChange(secondBeat, 0),
        beatChange(firstFuture, 0.5),
        beatChange(secondFuture, 0.5),
      ],
      [],
      0.25,
      1
    );

    expect(coordinator.getCurrentBeatForTrack(secondTrack, 0.25)).toBe(
      secondBeat
    );
    coordinator.setActiveTrack(secondTrack, 0.25, 1);
    jest.advanceTimersByTime(0);

    expect(coordinator.lastStartedBeat).toBe(secondBeat);
    expect(coordinator.playbackAnchorBeat).toBe(secondBeat);
    expect(events).toEqual([
      expect.objectContaining({
        trackUUID: secondTrack.uuid,
        beatUUID: secondBeat.uuid,
        playerUUID: 42,
        playbackRunId: 1,
      }),
    ]);
    expect(events[0].nextBeatUUID).toBe(secondFuture.uuid);
    expect(events[0].endTime).toBe(0.5);
    jest.advanceTimersByTime(249);
    expect(events).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(events.map((e) => e.beatUUID)).toEqual([
      secondBeat.uuid,
      secondFuture.uuid,
    ]);
    expect(coordinator.lastStartedBeat).toBe(secondFuture);
  });

  test("reset cancels audio-clock-deferred events and clears cursor state", () => {
    const { score, track, bar } = createScoreGraph();
    let audioTime = 0.5;
    const coordinator = new PlaybackCursorCoordinator(
      score,
      track,
      42,
      () => audioTime
    );
    coordinator.setPlaybackAnchorBeat(bar.ensureVoiceBar(1).beats[0]);
    coordinator.processScheduledBeatChanges(
      [
        beatChange(bar.ensureVoiceBar(1).beats[0], 0.5),
        beatChange(bar.ensureVoiceBar(1).beats[0], 1),
      ],
      [],
      0,
      1
    );
    jest.advanceTimersByTime(500);
    expect(coordinator.lastStartedBeat).toBe(bar.ensureVoiceBar(1).beats[0]);
    expect(events).toHaveLength(1);

    jest.advanceTimersByTime(500);
    expect(events).toHaveLength(1);
    coordinator.reset(2);
    audioTime = 1;
    jest.runAllTimers();

    expect(events).toHaveLength(1);
    expect(coordinator.lastStartedBeat).toBeUndefined();
    expect(coordinator.playbackAnchorBeat).toBeUndefined();
    expect(coordinator.getCurrentBeatForTrack(track, 1)).toBeUndefined();
    coordinator.processScheduledBeatChanges(
      [beatChange(bar.ensureVoiceBar(1).beats[0], 2)],
      [],
      1,
      2
    );
    audioTime = 2;
    jest.advanceTimersByTime(1000);
    expect(events).toHaveLength(2);
    expect(events[1].playbackRunId).toBe(2);
  });
});
