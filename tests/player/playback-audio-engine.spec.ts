import { PlaybackAudioEngine } from "../../src/player/playback-audio-engine";
import type { ScheduledAudioNode } from "../../src/player/scheduled-audio-node";
import type { Track } from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

const mockLoadConfiguredSamples = jest.fn();
const mockScheduleNote = jest.fn();
let nextAudioContext: AudioContext;
let originalAudioContext: typeof AudioContext | undefined;

jest.mock("../../src/player/playback-sample-manager", () => ({
  PlaybackSampleManager: class {
    public loadConfiguredSamples = mockLoadConfiguredSamples;
  },
}));

jest.mock("../../src/player/playback-note-scheduler", () => ({
  PlaybackNoteScheduler: class {
    public scheduleNote = mockScheduleNote;
  },
}));

function createAudioContext() {
  const gains: any[] = [];
  const panners: any[] = [];
  const destination = {};
  const context = {
    currentTime: 3,
    destination,
    resume: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve()),
    createGain: jest.fn(() => {
      const gain = {
        gain: { setValueAtTime: jest.fn() },
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
      gains.push(gain);
      return gain;
    }),
    createStereoPanner: jest.fn(() => {
      const panner = {
        pan: { setValueAtTime: jest.fn() },
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
      panners.push(panner);
      return panner;
    }),
  } as unknown as AudioContext;
  return { context, destination, gains, panners };
}

function createScheduledNode(
  track: Track,
  startTime: number
): ScheduledAudioNode {
  return {
    sourceNode: {
      stop: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as AudioScheduledSourceNode,
    track,
    gainNode: { disconnect: jest.fn() } as unknown as GainNode,
    startTime,
  };
}

describe("PlaybackAudioEngine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    originalAudioContext = globalThis.AudioContext;
    (
      globalThis as unknown as { AudioContext: typeof AudioContext }
    ).AudioContext = jest.fn(
      () => nextAudioContext
    ) as unknown as typeof AudioContext;
  });

  afterEach(() => {
    if (originalAudioContext === undefined) {
      delete (globalThis as unknown as { AudioContext?: typeof AudioContext })
        .AudioContext;
    } else {
      globalThis.AudioContext = originalAudioContext;
    }
  });

  test("lazily owns the context and score audio graph", async () => {
    const { score } = createScoreGraph();
    score.masterVolume = 0.8;
    score.masterPan = -0.25;
    const engine = new PlaybackAudioEngine(score, {});
    const { context, destination, gains, panners } = createAudioContext();
    nextAudioContext = context;

    expect(AudioContext).not.toHaveBeenCalled();
    engine.initialize();
    engine.initialize();
    await engine.resume();

    expect(AudioContext).toHaveBeenCalledTimes(1);
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(gains).toHaveLength(2);
    expect(panners).toHaveLength(2);
    expect(gains[0].connect).toHaveBeenCalledWith(panners[0]);
    expect(panners[0].connect).toHaveBeenCalledWith(destination);
    expect(gains[1].connect).toHaveBeenCalledWith(panners[1]);
    expect(panners[1].connect).toHaveBeenCalledWith(gains[0]);
    expect(gains[0].gain.setValueAtTime).toHaveBeenCalledWith(0.8, 3);
    expect(panners[0].pan.setValueAtTime).toHaveBeenCalledWith(-0.25, 3);

    engine.dispose();

    expect(context.close).toHaveBeenCalledTimes(1);
    expect(gains.every((gain) => gain.disconnect.mock.calls.length === 1)).toBe(
      true
    );
    expect(
      panners.every((panner) => panner.disconnect.mock.calls.length === 1)
    ).toBe(true);
  });

  test("removes naturally ended nodes from teardown tracking", () => {
    const { score, track, bar } = createScoreGraph();
    const beat = bar.ensureVoiceBar(1).beats[0];
    beat.makeBeatWithNotes();
    const scheduledNode = createScheduledNode(track, 4);
    mockScheduleNote.mockReturnValue(scheduledNode);
    const engine = new PlaybackAudioEngine(score, {});
    nextAudioContext = createAudioContext().context;
    engine.initialize();

    engine.scheduleBeat(beat, 4, 5);
    scheduledNode.sourceNode.onended?.(new Event("ended"));
    engine.stopScheduledAudioNodes();

    expect(scheduledNode.sourceNode.disconnect).toHaveBeenCalledTimes(1);
    expect(scheduledNode.gainNode.disconnect).toHaveBeenCalledTimes(1);
    expect(scheduledNode.sourceNode.stop).not.toHaveBeenCalled();
  });

  test("cancels only nodes at or after an inclusive boundary", () => {
    const { score, track, bar } = createScoreGraph();
    const beat = bar.ensureVoiceBar(1).beats[0];
    beat.makeBeatWithNotes();
    const earlierNode = createScheduledNode(track, 4);
    const boundaryNode = createScheduledNode(track, 5);
    mockScheduleNote
      .mockReturnValueOnce(earlierNode)
      .mockReturnValueOnce(boundaryNode);
    const engine = new PlaybackAudioEngine(score, {});
    nextAudioContext = createAudioContext().context;
    engine.initialize();
    engine.scheduleBeat(beat, 4, 5);
    engine.scheduleBeat(beat, 5, 6);

    engine.stopAudioFrom(5);

    expect(earlierNode.sourceNode.stop).not.toHaveBeenCalled();
    expect(boundaryNode.sourceNode.stop).toHaveBeenCalledWith(3);
  });
});
