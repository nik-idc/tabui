import { createScoreGraph } from "../model/helpers";
import type {
  PlaybackScheduleResult,
  ScheduledBeatChange,
} from "../../src/player/playback-scheduler";

const mockAudioEngines: MockAudioEngine[] = [];
const mockSchedulers: MockScheduler[] = [];
const mockCoordinators: MockCursorCoordinator[] = [];

class MockAudioEngine {
  public currentTime: number | undefined = 0;
  public initialize = jest.fn();
  public resume = jest.fn(() => Promise.resolve());
  public loadSamples = jest.fn(() => Promise.resolve());
  public stopScheduledAudioNodes = jest.fn();
  public stopAudioFrom = jest.fn();
  public applyTrackControls = jest.fn();
  public applyMasterControls = jest.fn();
  public dispose = jest.fn();

  constructor() {
    mockAudioEngines.push(this);
  }
}

class MockScheduler {
  public scheduleBase = 0.05;
  public scheduledPlaybackSeconds = 1;
  public isLooped = false;
  public reset = jest.fn();
  public setPlaybackRange = jest.fn();
  public setScheduleBase = jest.fn((value: number) => {
    this.scheduleBase = value;
  });
  public scheduleUntil = jest.fn<PlaybackScheduleResult, [number]>(() => ({
    beatChanges: [],
    nextBeatChanges: [],
    playbackComplete: false,
  }));
  public toggleLoop = jest.fn(() => {
    this.isLooped = !this.isLooped;
  });
  public setSelectionLoopSection = jest.fn();
  public clearSelectionLoopSection = jest.fn(() => false);
  public nextLoopStartOffsetAfter = jest.fn<number | undefined, [number]>(
    () => undefined
  );
  public truncateAt = jest.fn();
  public setLoopSection = jest.fn();
  public clearLoopSection = jest.fn();

  constructor() {
    mockSchedulers.push(this);
  }
}

class MockCursorCoordinator {
  public activeTrackUUID: number;
  public playbackAnchorBeat: unknown;
  public lastStartedBeat: unknown;
  public reset = jest.fn();
  public setPlaybackAnchorBeat = jest.fn((beat: unknown) => {
    this.playbackAnchorBeat = beat;
  });
  public preferBeatLane = jest.fn();
  public processScheduledBeatChanges = jest.fn();
  public truncateFrom = jest.fn();
  public setActiveTrack = jest.fn((track: { uuid: number }) => {
    this.activeTrackUUID = track.uuid;
  });
  public getCurrentBeatForTrack = jest.fn();

  constructor(_score: unknown, track: { uuid: number }) {
    this.activeTrackUUID = track.uuid;
    mockCoordinators.push(this);
  }
}

jest.mock("../../src/player/playback-audio-engine", () => ({
  PlaybackAudioEngine: MockAudioEngine,
}));
jest.mock("../../src/player/playback-scheduler", () => ({
  PlaybackScheduler: MockScheduler,
}));
jest.mock("../../src/player/playback-cursor-coordinator", () => ({
  PlaybackCursorCoordinator: MockCursorCoordinator,
}));

const {
  PlaybackErrorCode,
  PlaybackState,
  ScorePlayer,
}: typeof import("../../src/player") = require("../../src/player");

describe("ScorePlayer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockAudioEngines.length = 0;
    mockSchedulers.length = 0;
    mockCoordinators.length = 0;
  });

  afterEach(() => jest.useRealTimers());

  test("starts transport from its explicit anchor", async () => {
    const { score, track, bar } = createScoreGraph();
    const beat = bar.ensureVoiceBar(1).beats[0];
    const player = new ScorePlayer(score, track);

    await player.start({ startBeat: beat });

    expect(player.playbackState).toBe(PlaybackState.Playing);
    expect(player.playbackAnchorBeat).toBe(beat);
    expect(mockSchedulers[0].setPlaybackRange).toHaveBeenCalledWith(
      beat,
      undefined
    );
    expect(mockSchedulers[0].setScheduleBase).toHaveBeenCalledWith(0.05);
  });

  test("restarts from the resolved cursor anchor", async () => {
    const { score, track, bar } = createScoreGraph();
    const beat = bar.ensureVoiceBar(1).beats[0];
    const player = new ScorePlayer(score, track);
    mockCoordinators[0].playbackAnchorBeat = beat;

    await player.start();

    expect(mockSchedulers[0].setPlaybackRange).toHaveBeenCalledWith(
      beat,
      undefined
    );
  });

  test("forwards scheduled beat changes to cursor processing", async () => {
    const { score, track, bar } = createScoreGraph();
    const beat = bar.ensureVoiceBar(1).beats[0];
    const beatChange: ScheduledBeatChange = {
      beat,
      startTime: 1,
      endTime: 2,
    };
    const nextBeatChange: ScheduledBeatChange = {
      beat,
      startTime: 2,
      endTime: 3,
    };
    const player = new ScorePlayer(score, track);
    mockSchedulers[0].scheduleUntil.mockReturnValue({
      beatChanges: [beatChange],
      nextBeatChanges: [nextBeatChange],
      playbackComplete: false,
    });

    await player.start();

    expect(
      mockCoordinators[0].processScheduledBeatChanges
    ).toHaveBeenCalledWith([beatChange], [nextBeatChange], 0, 1);
  });

  test("preloads samples during initialization when configured", async () => {
    const { score, track } = createScoreGraph();
    const player = new ScorePlayer(score, track, {
      preloadAudio: true,
      samples: {},
    });

    await player.initialize();

    expect(mockAudioEngines[0].initialize).toHaveBeenCalledTimes(1);
    expect(mockAudioEngines[0].loadSamples).toHaveBeenCalledTimes(1);
    expect(mockAudioEngines[0].resume).not.toHaveBeenCalled();
  });

  test("loads required samples when playback starts", async () => {
    const { score, track } = createScoreGraph();
    const player = new ScorePlayer(score, track);

    await player.start();

    expect(mockAudioEngines[0].loadSamples).toHaveBeenCalledTimes(1);
  });

  test("ignores a stale start after stop", async () => {
    const { score, track } = createScoreGraph();
    const player = new ScorePlayer(score, track);
    let resolveResume: (() => void) | undefined;
    mockAudioEngines[0].resume.mockImplementation(
      () => new Promise<void>((resolve) => (resolveResume = resolve))
    );

    const start = player.start();
    player.stop();
    resolveResume?.();
    await start;

    expect(player.playbackState).toBe(PlaybackState.Idle);
    expect(mockSchedulers[0].setPlaybackRange).not.toHaveBeenCalled();
  });

  test("lets the newest overlapping start win", async () => {
    const { score, track } = createScoreGraph();
    const player = new ScorePlayer(score, track);
    let resolveFirst: (() => void) | undefined;
    mockAudioEngines[0].resume
      .mockImplementationOnce(
        () => new Promise<void>((resolve) => (resolveFirst = resolve))
      )
      .mockResolvedValueOnce(undefined);

    const first = player.start();
    const second = player.start();
    resolveFirst?.();
    await Promise.all([first, second]);

    expect(player.playbackState).toBe(PlaybackState.Playing);
    expect(mockSchedulers[0].setPlaybackRange).toHaveBeenCalledTimes(1);
  });

  test("reports preparation failures and permits retry", async () => {
    const { score, track } = createScoreGraph();
    const onError = jest.fn();
    const player = new ScorePlayer(score, track, undefined, onError);
    const error = Error("unlock failed");
    mockAudioEngines[0].resume.mockRejectedValueOnce(error);
    jest.spyOn(console, "error").mockImplementation(() => {});

    await player.start();
    await player.start();

    expect(onError).toHaveBeenCalledWith({
      code: PlaybackErrorCode.ContextInit,
      message: "Failed to prepare audio",
      cause: error,
    });
    expect(player.playbackState).toBe(PlaybackState.Playing);
    jest.restoreAllMocks();
  });

  test("cleans up an initial scheduling failure and retries from its anchor", async () => {
    const { score, track, bar } = createScoreGraph();
    const anchor = bar.ensureVoiceBar(1).beats[0];
    const onError = jest.fn();
    const player = new ScorePlayer(score, track, undefined, onError);
    mockSchedulers[0].scheduleUntil.mockImplementationOnce(() => {
      throw Error("initial schedule failed");
    });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await player.start({ startBeat: anchor });
    await player.start();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: PlaybackErrorCode.Scheduling,
        message: "Failed to schedule playback",
      })
    );
    expect(mockAudioEngines[0].stopScheduledAudioNodes).toHaveBeenCalled();
    expect(mockCoordinators[0].setPlaybackAnchorBeat).toHaveBeenLastCalledWith(
      anchor
    );
    expect(player.playbackState).toBe(PlaybackState.Playing);
    errorSpy.mockRestore();
  });

  test("cleans up a rolling scheduling failure and permits retry", async () => {
    const { score, track, bar } = createScoreGraph();
    const anchor = bar.ensureVoiceBar(1).beats[0];
    const onError = jest.fn();
    const player = new ScorePlayer(score, track, undefined, onError);
    mockSchedulers[0].scheduleUntil
      .mockReturnValueOnce({
        beatChanges: [],
        nextBeatChanges: [],
        playbackComplete: false,
      })
      .mockImplementationOnce(() => {
        throw Error("rolling schedule failed");
      });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await player.start({ startBeat: anchor });
    jest.advanceTimersByTime(50);
    await player.start();

    expect(player.playbackState).toBe(PlaybackState.Playing);
    expect(mockAudioEngines[0].stopScheduledAudioNodes).toHaveBeenCalled();
    expect(mockCoordinators[0].setPlaybackAnchorBeat).toHaveBeenLastCalledWith(
      anchor
    );
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: PlaybackErrorCode.Scheduling })
    );
    errorSpy.mockRestore();
  });

  test("stops after natural completion", async () => {
    const { score, track } = createScoreGraph();
    const player = new ScorePlayer(score, track);
    mockSchedulers[0].scheduleUntil.mockReturnValue({
      beatChanges: [],
      nextBeatChanges: [],
      playbackComplete: true,
    });

    await player.start();
    jest.advanceTimersByTime(1050);

    expect(player.playbackState).toBe(PlaybackState.Idle);
    expect(mockAudioEngines[0].stopScheduledAudioNodes).toHaveBeenCalled();
  });

  test("applies live loop changes without restarting transport", async () => {
    const { score, track } = createScoreGraph();
    const player = new ScorePlayer(score, track);
    mockSchedulers[0].nextLoopStartOffsetAfter.mockReturnValue(2);

    await player.start();
    player.toggleLoop();
    player.toggleLoop();

    expect(player.playbackRunId).toBe(1);
    expect(mockSchedulers[0].truncateAt).toHaveBeenCalledWith(2);
    expect(mockAudioEngines[0].stopAudioFrom).toHaveBeenCalledWith(2.05);
    expect(mockCoordinators[0].truncateFrom).toHaveBeenCalledWith(2.05);
  });

  test("retargets active-track cursor orchestration without audio restart", async () => {
    const { score, track } = createScoreGraph();
    const nextTrack = score.addTrack(track.context.instrument, "Next")
      .tracks[0];
    const player = new ScorePlayer(score, track);

    await player.start();
    player.setActiveTrack(nextTrack);

    expect(mockCoordinators[0].setActiveTrack).toHaveBeenCalledWith(
      nextTrack,
      0,
      1
    );
    expect(mockAudioEngines[0].stopScheduledAudioNodes).toHaveBeenCalledTimes(
      1
    );
  });

  test("syncs mix controls and disposes idempotently", async () => {
    const { score, track } = createScoreGraph();
    const player = new ScorePlayer(score, track);

    await player.start();
    player.syncTrackPlaybackState();
    player.syncMasterPlaybackState();
    player.dispose();
    player.dispose();

    expect(mockAudioEngines[0].applyTrackControls).toHaveBeenCalledTimes(1);
    expect(mockAudioEngines[0].applyMasterControls).toHaveBeenCalledTimes(1);
    expect(mockAudioEngines[0].dispose).toHaveBeenCalledTimes(1);
    expect(player.playbackState).toBe(PlaybackState.Idle);
  });
});
