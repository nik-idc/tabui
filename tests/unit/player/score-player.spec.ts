import { createBarWithBeats } from "../model/helpers";
import {
  NoteDuration,
  GuitarNote,
  ElectricGuitarTone,
} from "../../../src/notation/model";
import {
  PlaybackErrorCode,
  PlaybackState,
  ScorePlayer,
} from "../../../src/player";
import { installTransportAudio, settleTransport } from "./transport-audio";
import { required } from "../required";

function scoreWithNotes() {
  const graph = createBarWithBeats(
    Array.from({ length: 4 }, () => ({ baseDuration: NoteDuration.Quarter }))
  );
  graph.beats.forEach((b, i) => {
    b.makeBeatWithNotes();
    (required(b.notes)[0] as GuitarNote).setFret(i);
  });
  return graph;
}

describe("ScorePlayer", () => {
  let audio: ReturnType<typeof installTransportAudio>;
  const originalFetch = globalThis.fetch;
  const samples = {
    [ElectricGuitarTone.Clean]: { url: "/clean.wav", rootFrequency: 110 },
  };
  function serveSample() {
    const fetchSample = jest.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }));
    globalThis.fetch = fetchSample as unknown as typeof fetch;
    return fetchSample;
  }
  const players: ScorePlayer[] = [];
  function playerFor(
    graph: ReturnType<typeof scoreWithNotes>,
    onError = jest.fn()
  ) {
    const player = new ScorePlayer(
      graph.score,
      graph.track,
      undefined,
      onError
    );
    players.push(player);
    return player;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    audio = installTransportAudio();
  });
  afterEach(() => {
    players.splice(0).forEach((p) => p.dispose());
    audio.restore();
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test("starts transport from its explicit anchor", async () => {
    const graph = scoreWithNotes();
    const player = playerFor(graph);
    await player.start({ startBeat: graph.beats[2] });
    expect(player.playbackState).toBe(PlaybackState.Playing);
    expect(player.playbackAnchorBeat).toBe(graph.beats[2]);
    expect(audio.sources).toHaveLength(2);
    expect(audio.sources[0].start.mock.calls[0][0]).toBeCloseTo(0.05);
    expect(audio.sources[1].start.mock.calls[0][0]).toBeCloseTo(0.55);
    jest.advanceTimersByTime(50);
    expect(player.lastStartedBeat).toBe(graph.beats[2]);
  });

  test("restarts from the resolved cursor anchor", async () => {
    const graph = scoreWithNotes();
    const player = playerFor(graph);
    await player.start({ startBeat: graph.beats[2] });
    jest.advanceTimersByTime(550);
    expect(player.playbackAnchorBeat).toBe(graph.beats[3]);
    await player.start();
    expect(audio.sources).toHaveLength(3);
    expect(player.playbackAnchorBeat).toBe(graph.beats[3]);
  });

  test("advances the public cursor only when each beat starts", async () => {
    const graph = scoreWithNotes();
    const player = playerFor(graph);
    await player.start();
    expect(player.lastStartedBeat).toBeUndefined();
    jest.advanceTimersByTime(50);
    expect(player.lastStartedBeat).toBe(graph.beats[0]);
    jest.advanceTimersByTime(499);
    expect(player.lastStartedBeat).toBe(graph.beats[0]);
    jest.advanceTimersByTime(1);
    expect(player.lastStartedBeat).toBe(graph.beats[1]);
  });

  test("preloads configured samples without resuming or scheduling", async () => {
    const graph = scoreWithNotes();
    const fetchSample = serveSample();
    const player = new ScorePlayer(graph.score, graph.track, {
      preloadAudio: true,
      samples,
    });
    players.push(player);
    await player.initialize();
    expect(audio.construct).toHaveBeenCalledTimes(1);
    expect(audio.context.resume).not.toHaveBeenCalled();
    expect(audio.sources).toEqual([]);
    expect(player.playbackState).toBe(PlaybackState.Idle);
    expect(fetchSample).toHaveBeenCalledWith("/clean.wav");
    await player.start();
    expect(audio.bufferSources).toHaveLength(4);
    expect(audio.bufferSources[0].buffer).toBe(
      await audio.context.decodeAudioData.mock.results[0].value
    );
    expect(audio.sources).toEqual([]);
  });

  test("waits for a first-use sample before scheduling notes", async () => {
    const graph = scoreWithNotes();
    let resolveFetch!: (response: Response) => void;
    globalThis.fetch = jest.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    ) as unknown as typeof fetch;
    const player = new ScorePlayer(graph.score, graph.track, {
      preloadAudio: false,
      samples,
    });
    players.push(player);
    expect(audio.construct).not.toHaveBeenCalled();
    const start = player.start();

    await settleTransport();
    expect(audio.context.resume).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith("/clean.wav");
    expect(audio.sources).toEqual([]);
    expect(audio.bufferSources).toEqual([]);

    resolveFetch({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);
    await start;

    expect(audio.sources).toEqual([]);
    expect(audio.bufferSources).toHaveLength(4);
    expect(player.playbackState).toBe(PlaybackState.Playing);
  });

  test("does not schedule after stopping while a sample is loading", async () => {
    const graph = scoreWithNotes();
    let resolveFetch!: (response: Response) => void;
    globalThis.fetch = jest.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    ) as unknown as typeof fetch;
    const player = new ScorePlayer(graph.score, graph.track, {
      preloadAudio: false,
      samples,
    });
    players.push(player);
    const start = player.start();
    await settleTransport();
    player.stop();

    resolveFetch({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);
    await start;

    expect(player.playbackState).toBe(PlaybackState.Idle);
    expect(audio.sources).toEqual([]);
    expect(audio.bufferSources).toEqual([]);
  });

  test("only schedules the newest run when both starts await the same sample", async () => {
    const graph = scoreWithNotes();
    serveSample();
    let finishDecode!: (buffer: AudioBuffer) => void;
    audio.context.decodeAudioData.mockImplementationOnce(
      () =>
        new Promise<AudioBuffer>((resolve) => {
          finishDecode = resolve;
        })
    );
    const player = new ScorePlayer(graph.score, graph.track, {
      preloadAudio: false,
      samples,
    });
    players.push(player);
    const first = player.start();
    await settleTransport();
    player.stop();
    const second = player.start({ startBeat: graph.beats[3] });
    await settleTransport();

    finishDecode({} as AudioBuffer);
    await Promise.all([first, second]);

    expect(player.playbackState).toBe(PlaybackState.Playing);
    expect(player.playbackAnchorBeat).toBe(graph.beats[3]);
    expect(audio.sources).toEqual([]);
    expect(audio.bufferSources).toHaveLength(1);
    jest.advanceTimersByTime(50);
    expect(player.lastStartedBeat).toBe(graph.beats[3]);
  });

  test("ignores a stale start after stop", async () => {
    const player = playerFor(scoreWithNotes());
    let resume!: () => void;
    audio.context.resume.mockImplementationOnce(
      () =>
        new Promise<void>((r) => {
          resume = r;
        })
    );
    const start = player.start();
    expect(player.playbackState).toBe(PlaybackState.Starting);
    player.stop();
    resume();
    await start;
    jest.advanceTimersByTime(5000);
    expect(player.playbackState).toBe(PlaybackState.Idle);
    expect(audio.sources).toEqual([]);
    expect(player.lastStartedBeat).toBeUndefined();
  });

  test("does not load samples when disposed while audio is resuming", async () => {
    const graph = scoreWithNotes();
    const fetchSample = serveSample();
    const player = new ScorePlayer(graph.score, graph.track, {
      preloadAudio: false,
      samples,
    });
    players.push(player);
    let resume!: () => void;
    audio.context.resume.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resume = resolve))
    );
    const start = player.start();
    player.dispose();
    resume();
    await start;
    await settleTransport();
    expect(fetchSample).not.toHaveBeenCalled();
    expect(audio.context.close).toHaveBeenCalledTimes(1);
    expect(player.playbackState).toBe(PlaybackState.Idle);
    expect(audio.sources).toEqual([]);
    expect(audio.bufferSources).toEqual([]);
  });

  test("lets the newest overlapping start win", async () => {
    const graph = scoreWithNotes();
    const player = playerFor(graph);
    let resume!: () => void;
    audio.context.resume.mockImplementationOnce(
      () =>
        new Promise<void>((r) => {
          resume = r;
        })
    );
    const first = player.start({ startBeat: graph.beats[0] });
    await player.start({ startBeat: graph.beats[3] });
    resume();
    await first;
    expect(player.playbackState).toBe(PlaybackState.Playing);
    expect(player.playbackAnchorBeat).toBe(graph.beats[3]);
    expect(audio.sources).toHaveLength(1);
    jest.advanceTimersByTime(50);
    expect(player.lastStartedBeat).toBe(graph.beats[3]);
  });

  test("reports preparation failures and permits retry", async () => {
    const graph = scoreWithNotes();
    const onError = jest.fn();
    const player = playerFor(graph, onError);
    const error = Error("unlock failed");
    audio.context.resume.mockRejectedValueOnce(error);
    jest.spyOn(console, "error").mockImplementation(() => {});
    await player.start({ startBeat: graph.beats[2] });
    expect(onError).toHaveBeenCalledWith({
      code: PlaybackErrorCode.ContextInit,
      message: "Failed to prepare audio",
      cause: error,
    });
    expect(player.playbackState).toBe(PlaybackState.Idle);
    expect(audio.sources).toEqual([]);
    await player.start();
    expect(player.playbackState).toBe(PlaybackState.Playing);
    expect(player.playbackAnchorBeat).toBe(graph.beats[2]);
    expect(audio.sources).toHaveLength(2);
  });

  test("cleans up an initial scheduling failure and retries from its anchor", async () => {
    const graph = scoreWithNotes();
    const onError = jest.fn();
    const player = playerFor(graph, onError);
    const error = Error("source creation failed");
    const createSource = required(
      audio.context.createOscillator.getMockImplementation()
    );
    audio.context.createOscillator
      .mockImplementationOnce(createSource)
      .mockImplementationOnce(() => {
        throw error;
      });
    jest.spyOn(console, "error").mockImplementation(() => {});
    await player.start({ startBeat: graph.beats[2] });
    expect(onError).toHaveBeenCalledWith({
      code: PlaybackErrorCode.Scheduling,
      message: "Failed to schedule playback",
      cause: error,
    });
    expect(player.playbackState).toBe(PlaybackState.Idle);
    expect(player.playbackAnchorBeat).toBe(graph.beats[2]);
    expect(audio.sources).toHaveLength(1);
    expect(audio.sources[0].disconnect).toHaveBeenCalled();
    expect(audio.sources[0].stop).toHaveBeenLastCalledWith(0);
    await player.start();
    expect(player.playbackState).toBe(PlaybackState.Playing);
    expect(audio.sources).toHaveLength(3);
  });

  test("cleans up a rolling scheduling failure and permits retry", async () => {
    const graph = scoreWithNotes();
    graph.score.masterBars[0].tempo = 20;
    graph.score.appendMasterBar();
    const nextBeat = graph.track.staves[0].bars[1].ensureVoiceBar(1).beats[0];
    nextBeat.makeBeatWithNotes();
    (required(nextBeat.notes)[0] as GuitarNote).setFret(5);
    const onError = jest.fn();
    const player = playerFor(graph, onError);
    await player.start();
    const buffered = [...audio.sources];
    expect(buffered).toHaveLength(4);
    const error = Error("device failed");
    audio.context.createOscillator.mockImplementationOnce(() => {
      throw error;
    });
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.advanceTimersByTime(7100);
    expect(player.playbackState).toBe(PlaybackState.Idle);
    expect(onError).toHaveBeenCalledWith({
      code: PlaybackErrorCode.Scheduling,
      message: "Failed to schedule playback",
      cause: error,
    });
    for (const source of buffered) expect(source.disconnect).toHaveBeenCalled();
    expect(player.playbackAnchorBeat).toBe(graph.beats[2]);
    await player.start();
    expect(player.playbackState).toBe(PlaybackState.Playing);
    expect(audio.sources.length).toBeGreaterThan(buffered.length);
  });

  test("stops after natural completion", async () => {
    const player = playerFor(scoreWithNotes());
    await player.start();
    jest.advanceTimersByTime(2049);
    expect(player.playbackState).toBe(PlaybackState.Playing);
    jest.advanceTimersByTime(1);
    expect(player.playbackState).toBe(PlaybackState.Idle);
    for (const source of audio.sources)
      expect(source.disconnect).toHaveBeenCalled();
  });

  test("applies live loop changes without restarting transport", async () => {
    const player = playerFor(scoreWithNotes());
    await player.start();
    const run = player.playbackRunId;
    player.toggleLoop();
    expect(player.isLooped).toBe(true);
    expect(audio.sources.length).toBeGreaterThan(4);
    const repeated = audio.sources.slice(4);
    player.toggleLoop();
    expect(player.isLooped).toBe(false);
    expect(player.playbackRunId).toBe(run);
    for (const source of repeated) expect(source.disconnect).toHaveBeenCalled();
    jest.advanceTimersByTime(2050);
    expect(player.playbackState).toBe(PlaybackState.Idle);
  });

  test("retargets the active-track cursor without audio restart", async () => {
    const graph = scoreWithNotes();
    const next = graph.score.addTrack(graph.track.context.instrument, "Next")
      .tracks[0];
    const player = playerFor(graph);
    await player.start();
    const run = player.playbackRunId;
    const sources = [...audio.sources];
    jest.advanceTimersByTime(100);
    player.setActiveTrack(next);
    expect(player.lastStartedBeat?.voiceBar.bar.staff.track).toBe(next);
    expect(player.playbackRunId).toBe(run);
    expect(audio.sources).toEqual(sources);
    for (const source of sources)
      expect(source.disconnect).not.toHaveBeenCalled();
  });

  test("syncs live mix controls and disposes idempotently", async () => {
    const graph = scoreWithNotes();
    const player = playerFor(graph);
    await player.start();
    graph.track.volume = 0.25;
    graph.score.masterVolume = 0.5;
    player.syncTrackPlaybackState();
    player.syncMasterPlaybackState();
    // Follow the public Web Audio graph from the source to its two mix buses.
    const noteGain = audio.sources[0].connect.mock.calls[0][0];
    const trackGain = noteGain.connect.mock.calls[0][0];
    const trackPanner = trackGain.connect.mock.calls[0][0];
    const masterGain = trackPanner.connect.mock.calls[0][0];
    expect(trackGain.gain.setValueAtTime).toHaveBeenLastCalledWith(0.25, 0);
    expect(masterGain.gain.setValueAtTime).toHaveBeenLastCalledWith(0.5, 0);
    player.dispose();
    player.dispose();
    const contextCount = audio.construct.mock.calls.length;
    const resumeCount = audio.context.resume.mock.calls.length;
    const sourceCount = audio.sources.length;
    const bufferSourceCount = audio.bufferSources.length;
    await player.start();
    jest.advanceTimersByTime(5000);
    expect(audio.construct).toHaveBeenCalledTimes(contextCount);
    expect(audio.context.resume).toHaveBeenCalledTimes(resumeCount);
    expect(audio.sources).toHaveLength(sourceCount);
    expect(audio.bufferSources).toHaveLength(bufferSourceCount);
    expect(audio.context.close).toHaveBeenCalledTimes(1);
    expect(player.playbackState).toBe(PlaybackState.Idle);
    for (const source of audio.sources)
      expect(source.disconnect).toHaveBeenCalled();
  });
});
