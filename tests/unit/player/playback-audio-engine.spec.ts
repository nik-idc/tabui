import { PlaybackAudioEngine } from "../../../src/player/playback-audio-engine";
import { ElectricGuitarTone, GuitarNote } from "../../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

let nextAudioContext: AudioContext;
let originalAudioContext: typeof AudioContext | undefined;

function createParam() {
  return {
    value: 0,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  };
}

function createGain() {
  return {
    gain: createParam(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
}

function createPanner() {
  return {
    pan: createParam(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
}

function createOscillator() {
  return {
    type: "sine" as OscillatorType,
    frequency: createParam(),
    start: jest.fn(),
    stop: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    onended: null as (() => void) | null,
  };
}

function createBufferSource() {
  return {
    buffer: null as AudioBuffer | null,
    playbackRate: createParam(),
    start: jest.fn(),
    stop: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    onended: null as (() => void) | null,
  };
}

function createAudioContext(failPannerAfter?: number) {
  const gains: ReturnType<typeof createGain>[] = [];
  const panners: ReturnType<typeof createPanner>[] = [];
  const oscillators: ReturnType<typeof createOscillator>[] = [];
  const bufferSources: ReturnType<typeof createBufferSource>[] = [];
  const decodedBuffer = { duration: 1 } as AudioBuffer;
  const destination = {};
  const context = {
    currentTime: 3,
    destination,
    resume: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve()),
    createGain: jest.fn(() => {
      const gain = createGain();
      gains.push(gain);
      return gain;
    }),
    createStereoPanner: jest.fn(() => {
      if (panners.length === failPannerAfter) {
        throw Error("panner failed");
      }
      const panner = createPanner();
      panners.push(panner);
      return panner;
    }),
    createOscillator: jest.fn(() => {
      const oscillator = createOscillator();
      oscillators.push(oscillator);
      return oscillator;
    }),
    createBufferSource: jest.fn(() => {
      const source = createBufferSource();
      bufferSources.push(source);
      return source;
    }),
    decodeAudioData: jest.fn(() => Promise.resolve(decodedBuffer)),
  } as unknown as AudioContext;
  return {
    context,
    destination,
    gains,
    panners,
    oscillators,
    bufferSources,
    decodedBuffer,
  };
}

function playableBeat() {
  const graph = createScoreGraph();
  const beat = graph.bar.ensureVoiceBar(1).beats[0];
  beat.makeBeatWithNotes();
  const note = beat.notes?.[0];
  if (!(note instanceof GuitarNote)) {
    throw Error("Expected a guitar note");
  }
  note.fret = 0;
  return { ...graph, beat };
}

describe("PlaybackAudioEngine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    originalAudioContext = globalThis.AudioContext;
    (
      globalThis as unknown as {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Mirrors the browser API.
        AudioContext: typeof AudioContext;
      }
    ).AudioContext = jest.fn(
      () => nextAudioContext
    ) as unknown as typeof AudioContext;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalAudioContext === undefined) {
      delete (
        globalThis as unknown as {
          // eslint-disable-next-line @typescript-eslint/naming-convention -- Mirrors the browser API.
          AudioContext?: typeof AudioContext;
        }
      ).AudioContext;
    } else {
      globalThis.AudioContext = originalAudioContext;
    }
  });

  test("lazily owns the context and score audio bus topology", async () => {
    const { score } = createScoreGraph();
    score.masterVolume = 0.8;
    score.masterPan = -0.25;
    const engine = new PlaybackAudioEngine(score, {});
    const { context, gains, panners } = createAudioContext();
    nextAudioContext = context;

    expect(AudioContext).not.toHaveBeenCalled();
    expect(engine.currentTime).toBeUndefined();
    engine.initialize();
    engine.initialize();
    await engine.resume();

    expect(AudioContext).toHaveBeenCalledTimes(1);
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(gains).toHaveLength(2);
    expect(panners).toHaveLength(2);
    expect(gains[0].gain.setValueAtTime).toHaveBeenCalledWith(0.8, 3);
    expect(panners[0].pan.setValueAtTime).toHaveBeenCalledWith(-0.25, 3);
    expect(gains[0].connect).toHaveBeenCalledWith(panners[0]);
    expect(panners[0].connect).toHaveBeenCalledWith(context.destination);
    expect(gains[1].connect).toHaveBeenCalledWith(panners[1]);
    expect(panners[1].connect).toHaveBeenCalledWith(gains[0]);

    Object.defineProperty(context, "currentTime", { value: 7 });
    expect(engine.currentTime).toBe(7);

    engine.dispose();
    engine.dispose();

    expect(context.close).toHaveBeenCalledTimes(1);
    expect(engine.currentTime).toBeUndefined();
    for (const node of [...gains, ...panners]) {
      expect(node.disconnect).toHaveBeenCalled();
    }
  });

  test.each([0, 1])(
    "cleans up bus setup failure after %i panners and retries with a fresh topology",
    (failureIndex) => {
      const { score } = createScoreGraph();
      const failed = createAudioContext(failureIndex);
      const recovered = createAudioContext();
      nextAudioContext = failed.context;
      const engine = new PlaybackAudioEngine(score, {});

      expect(() => engine.initialize()).toThrow("panner failed");
      expect(failed.context.close).toHaveBeenCalledTimes(1);
      expect(failed.gains).toHaveLength(failureIndex + 1);
      for (const node of [...failed.gains, ...failed.panners]) {
        expect(node.disconnect).toHaveBeenCalled();
      }
      expect(engine.currentTime).toBeUndefined();

      nextAudioContext = recovered.context;
      engine.initialize();

      expect(AudioContext).toHaveBeenCalledTimes(2);
      expect(engine.currentTime).toBe(3);
    }
  );

  test("removes naturally ended nodes from teardown tracking", () => {
    const { score, beat } = playableBeat();
    const engine = new PlaybackAudioEngine(score, {});
    const audio = createAudioContext();
    nextAudioContext = audio.context;
    engine.initialize();

    engine.scheduleBeat(beat, 4, 5);
    expect(audio.oscillators).toHaveLength(1);
    const source = audio.oscillators[0];
    expect(source.start).toHaveBeenCalledWith(4);
    expect(source.onended).toEqual(expect.any(Function));
    source.onended?.();
    engine.stopScheduledAudioNodes();

    expect(source.disconnect).toHaveBeenCalledTimes(1);
    expect(audio.gains[2].disconnect).toHaveBeenCalledTimes(1);
    expect(source.stop).toHaveBeenCalledTimes(1);
    expect(source.stop).toHaveBeenCalledWith(5);
  });

  test("cancels only nodes at or after an inclusive boundary", () => {
    const { score, beat } = playableBeat();
    const engine = new PlaybackAudioEngine(score, {});
    const audio = createAudioContext();
    nextAudioContext = audio.context;
    engine.initialize();
    engine.scheduleBeat(beat, 4, 5);
    engine.scheduleBeat(beat, 5, 6);
    engine.scheduleBeat(beat, 6, 7);
    expect(audio.oscillators).toHaveLength(3);
    const [earlier, boundary, later] = audio.oscillators;

    engine.stopAudioFrom(5);

    expect(earlier.stop).toHaveBeenCalledTimes(1);
    expect(earlier.disconnect).not.toHaveBeenCalled();
    for (const source of [boundary, later]) {
      expect(source.stop).toHaveBeenLastCalledWith(3);
      expect(source.disconnect).toHaveBeenCalledTimes(1);
    }
    expect(audio.gains[3].disconnect).toHaveBeenCalledTimes(1);
    expect(audio.gains[4].disconnect).toHaveBeenCalledTimes(1);

    earlier.stop.mockImplementationOnce(() => {
      throw Error("already stopped");
    });
    engine.stopScheduledAudioNodes();
    engine.stopScheduledAudioNodes();

    expect(earlier.stop).toHaveBeenLastCalledWith(3);
    expect(earlier.disconnect).toHaveBeenCalledTimes(1);
    expect(audio.gains[2].disconnect).toHaveBeenCalledTimes(1);
    expect(boundary.stop).toHaveBeenCalledTimes(2);
    expect(later.stop).toHaveBeenCalledTimes(2);
  });

  test("updates mix state and creates a bus for a track added at runtime", () => {
    const { score, track, beat } = playableBeat();
    const engine = new PlaybackAudioEngine(score, {});
    const audio = createAudioContext();
    nextAudioContext = audio.context;
    engine.initialize();
    const secondTrack = score.addTrack(track.context.instrument, "Second")
      .tracks[0];
    const secondBeat = secondTrack.staves[0].bars[0].ensureVoiceBar(1).beats[0];
    secondBeat.makeBeatWithNotes();
    const secondNote = secondBeat.notes?.[0];
    if (!(secondNote instanceof GuitarNote)) {
      throw Error("Expected a guitar note");
    }
    secondNote.fret = 2;

    track.volume = 0.6;
    track.pan = 0.75;
    track.muted = true;
    secondTrack.soloed = true;
    engine.applyTrackControls();
    engine.scheduleBeat(beat, 4, 4.5);
    engine.scheduleBeat(secondBeat, 4, 4.5);
    expect(audio.oscillators).toHaveLength(2);
    expect(audio.oscillators[0].start).toHaveBeenCalledWith(4);
    expect(audio.gains[1].gain.setValueAtTime).toHaveBeenLastCalledWith(0, 3);

    track.muted = false;
    secondTrack.soloed = false;
    secondTrack.volume = 0.25;
    secondTrack.pan = -0.5;
    engine.applyTrackControls();

    // The second track bus is created after the first note envelope.
    expect(audio.gains).toHaveLength(5);
    const firstBus = audio.gains[1];
    const secondBus = audio.gains[3];
    expect(firstBus.gain.setValueAtTime).toHaveBeenLastCalledWith(0.6, 3);
    expect(secondBus.gain.setValueAtTime).toHaveBeenLastCalledWith(0.25, 3);
    expect(audio.oscillators[0].connect).toHaveBeenCalledWith(audio.gains[2]);
    expect(audio.gains[2].connect).toHaveBeenCalledWith(firstBus);
    expect(audio.gains[4].connect).toHaveBeenCalledWith(secondBus);
    expect(secondBus.connect).toHaveBeenCalledWith(audio.panners[2]);
    expect(audio.panners[2].connect).toHaveBeenCalledWith(audio.gains[0]);
    expect(audio.panners[2].pan.setValueAtTime).toHaveBeenLastCalledWith(
      -0.5,
      3
    );

    secondTrack.soloed = true;
    engine.applyTrackControls();
    expect(firstBus.gain.setValueAtTime).toHaveBeenLastCalledWith(0, 3);
    expect(secondBus.gain.setValueAtTime).toHaveBeenLastCalledWith(0.25, 3);

    secondTrack.muted = true;
    engine.applyTrackControls();
    expect(secondBus.gain.setValueAtTime).toHaveBeenLastCalledWith(0, 3);

    secondTrack.soloed = false;
    secondTrack.muted = false;
    engine.applyTrackControls();
    expect(firstBus.gain.setValueAtTime).toHaveBeenLastCalledWith(0.6, 3);
    expect(secondBus.gain.setValueAtTime).toHaveBeenLastCalledWith(0.25, 3);
    expect(audio.oscillators).toHaveLength(2);

    score.masterVolume = 0.4;
    score.masterPan = -0.2;
    engine.applyMasterControls();
    expect(audio.gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(0.4, 3);
    expect(audio.panners[0].pan.setValueAtTime).toHaveBeenLastCalledWith(
      -0.2,
      3
    );
    expect(track.volume).toBe(0.6);
    expect(track.pan).toBe(0.75);
    expect(secondTrack.volume).toBe(0.25);
    expect(secondTrack.pan).toBe(-0.5);
    expect(firstBus.gain.setValueAtTime).toHaveBeenLastCalledWith(0.6, 3);
    expect(secondBus.gain.setValueAtTime).toHaveBeenLastCalledWith(0.25, 3);

    score.removeTrack(1);
    engine.applyTrackControls();
    expect(secondBus.disconnect).toHaveBeenCalledTimes(1);
    expect(audio.panners[2].disconnect).toHaveBeenCalledTimes(1);
    expect(firstBus.disconnect).not.toHaveBeenCalled();
  });

  test("propagates resume failure and permits another user-initiated attempt", async () => {
    const { score } = createScoreGraph();
    const audio = createAudioContext();
    nextAudioContext = audio.context;
    const engine = new PlaybackAudioEngine(score, {});
    engine.initialize();
    const failure = Error("resume blocked");
    jest.spyOn(audio.context, "resume").mockRejectedValueOnce(failure);

    await expect(engine.resume()).rejects.toBe(failure);
    await expect(engine.resume()).resolves.toBeUndefined();
    expect(audio.context.resume).toHaveBeenCalledTimes(2);
    expect(AudioContext).toHaveBeenCalledTimes(1);
  });

  test("releases its context while a resume request is pending", async () => {
    const { score } = createScoreGraph();
    const audio = createAudioContext();
    nextAudioContext = audio.context;
    let finishResume!: () => void;
    jest.spyOn(audio.context, "resume").mockReturnValue(
      new Promise<void>((resolve) => {
        finishResume = resolve;
      })
    );
    const engine = new PlaybackAudioEngine(score, {});
    engine.initialize();
    const pending = engine.resume();

    engine.dispose();
    expect(audio.context.close).toHaveBeenCalledTimes(1);
    expect(engine.currentTime).toBeUndefined();
    finishResume();
    await pending;
    expect(engine.currentTime).toBeUndefined();
    expect(AudioContext).toHaveBeenCalledTimes(1);
  });

  test("loads score samples and schedules cached buffers through the track bus", async () => {
    const { score, beat } = playableBeat();
    const audio = createAudioContext();
    nextAudioContext = audio.context;
    const originalFetch = globalThis.fetch;
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => bytes,
    });
    globalThis.fetch = fetchMock;
    try {
      const engine = new PlaybackAudioEngine(score, {
        [ElectricGuitarTone.Clean]: { url: "/clean.wav", rootFrequency: 110 },
        [ElectricGuitarTone.Overdrive]: {
          url: "/unused.wav",
          rootFrequency: 220,
        },
      });
      engine.initialize();
      await engine.loadSamples();
      await engine.loadSamples();
      engine.scheduleBeat(beat, 4, 5);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith("/clean.wav");
      expect(audio.context.decodeAudioData).toHaveBeenCalledWith(bytes);
      expect(audio.oscillators).toHaveLength(0);
      expect(audio.bufferSources).toHaveLength(1);
      const source = audio.bufferSources[0];
      expect(source.buffer).toBe(audio.decodedBuffer);
      expect(source.start).toHaveBeenCalledWith(4);
      expect(source.connect).toHaveBeenCalledWith(audio.gains[2]);
      expect(audio.gains[2].connect).toHaveBeenCalledWith(audio.gains[1]);

      engine.stopScheduledAudioNodes();
      expect(source.stop).toHaveBeenLastCalledWith(3);
      expect(source.disconnect).toHaveBeenCalledTimes(1);
      expect(audio.gains[2].disconnect).toHaveBeenCalledTimes(1);
      engine.dispose();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
