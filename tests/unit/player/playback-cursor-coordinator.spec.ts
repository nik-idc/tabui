import { Guitar, NoteDuration } from "../../../src/notation/model";
import { PlaybackCursorCoordinator } from "../../../src/player/playback-cursor-coordinator";
import type { ScheduledBeatChange } from "../../../src/player/playback-scheduler";
import { trackEvent, TrackEventType } from "../../../src/shared/events";
import { createBarWithBeats, createScoreGraph } from "../model/helpers";

function beatChange(
  beat: ScheduledBeatChange["beat"],
  startTime: number,
  endTime: number = startTime + 0.5
): ScheduledBeatChange {
  return { beat, startTime, endTime };
}

describe("PlaybackCursorCoordinator", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("emits cursor timing against the playback clock", () => {
    const { score, track, bar } = createScoreGraph();
    const beat = bar.ensureVoiceBar(1).beats[0];
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const coordinator = new PlaybackCursorCoordinator(score, track, 42);

    coordinator.processScheduledBeatChanges(
      [beatChange(beat, 0.5, 1)],
      [],
      0,
      1
    );
    jest.advanceTimersByTime(499);
    expect(emitSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(emitSpy).toHaveBeenCalledWith(TrackEventType.PlayerCurBeatChanged, {
      trackUUID: track.uuid,
      playerUUID: 42,
      beatUUID: beat.uuid,
      nextBeatUUID: undefined,
      startTime: 0.5,
      endTime: 1,
      playbackRunId: 1,
    });
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
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const coordinator = new PlaybackCursorCoordinator(score, track, 42);
    coordinator.processScheduledBeatChanges(
      [beatChange(bar.ensureVoiceBar(1).beats[0], 0.5)],
      [],
      0,
      1
    );

    coordinator.processScheduledBeatChanges([], [], 0, 2);
    jest.advanceTimersByTime(500);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  test("truncates cursor work at an inclusive boundary", () => {
    const { score, track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const coordinator = new PlaybackCursorCoordinator(score, track, 42);
    coordinator.processScheduledBeatChanges(
      [beatChange(beats[0], 1), beatChange(beats[1], 2)],
      [],
      0,
      1
    );

    coordinator.truncateFrom(2);
    jest.advanceTimersByTime(2000);

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy.mock.calls[0][1]).toEqual(
      expect.objectContaining({ beatUUID: beats[0].uuid })
    );
  });

  test("queries and retargets buffered cursor timing for another track", () => {
    const { score, track, bar } = createScoreGraph();
    const secondTrack = score.addTrack(new Guitar(), "Track 2").tracks[0];
    const firstBeat = bar.ensureVoiceBar(1).beats[0];
    const secondBeat = secondTrack.staves[0].bars[0].ensureVoiceBar(1).beats[0];
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const coordinator = new PlaybackCursorCoordinator(score, track, 42);
    coordinator.processScheduledBeatChanges(
      [beatChange(firstBeat, 0), beatChange(secondBeat, 0)],
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
    expect(emitSpy).toHaveBeenCalledWith(
      TrackEventType.PlayerCurBeatChanged,
      expect.objectContaining({
        trackUUID: secondTrack.uuid,
        beatUUID: secondBeat.uuid,
      })
    );
  });

  test("reset cancels pending events and clears cursor state", () => {
    const { score, track, bar } = createScoreGraph();
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const coordinator = new PlaybackCursorCoordinator(score, track, 42);
    coordinator.setPlaybackAnchorBeat(bar.ensureVoiceBar(1).beats[0]);
    coordinator.processScheduledBeatChanges(
      [beatChange(bar.ensureVoiceBar(1).beats[0], 1)],
      [],
      0,
      1
    );

    coordinator.reset(2);
    jest.runAllTimers();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(coordinator.lastStartedBeat).toBeUndefined();
    expect(coordinator.playbackAnchorBeat).toBeUndefined();
  });
});
