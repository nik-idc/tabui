import { ScorePlayer } from "../../src/player";
import { createBarWithBeats, createScoreGraph } from "../model/helpers";
import {
  BarRepeatStatus,
  Guitar,
  NoteDuration,
  getNoteFrequency,
} from "../../src/notation/model";

const createdOscillators: MockOscillatorNode[] = [];

class MockOscillatorNode {
  public type = "sine";
  public frequency = { value: 0 };
  public onended?: () => void;
  public start = jest.fn();
  public stop = jest.fn(() => {
    this.onended?.();
  });
  public connect = jest.fn();
  public disconnect = jest.fn();

  constructor() {
    createdOscillators.push(this);
  }
}

class MockGainNode {
  public gain = {
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  };
  public connect = jest.fn();
  public disconnect = jest.fn();
}

class MockAudioContext {
  public static nextResumeImpl: (() => Promise<void>) | null = null;

  public destination = {};

  public get currentTime(): number {
    return Date.now() / 1000;
  }

  public createOscillator(): OscillatorNode {
    return new MockOscillatorNode() as unknown as OscillatorNode;
  }

  public createGain(): GainNode {
    return new MockGainNode() as unknown as GainNode;
  }

  public resume(): Promise<void> {
    return MockAudioContext.nextResumeImpl?.() ?? Promise.resolve();
  }
}

(globalThis as unknown as { AudioContext: typeof MockAudioContext }).AudioContext =
  MockAudioContext;

function createScoreWithBars(barCount: number) {
  const { score, track } = createScoreGraph({
    tempo: 120,
    beatsCount: 1,
    duration: NoteDuration.Quarter,
    repeatStatus: BarRepeatStatus.None,
    repeatCount: null,
  });
  for (let i = 1; i < barCount; i++) {
    score.appendMasterBar({
      tempo: 120,
      beatsCount: 1,
      duration: NoteDuration.Quarter,
      repeatStatus: BarRepeatStatus.None,
      repeatCount: null,
    });
  }

  return {
    score,
    track,
    bars: track.staves[0].bars,
    masterBars: score.masterBars,
  };
}

function setBeatFret(beat: { notes: Array<unknown> }, fret: number): void {
  ((beat.notes[0] as unknown) as { fret: number | null }).fret = fret;
}

function oscillatorStarts(): number[] {
  return createdOscillators
    .filter((oscillator) => oscillator.frequency.value > 0)
    .map((oscillator) => oscillator.start.mock.calls[0]?.[0]);
}

function oscillatorFrequencies(): number[] {
  return createdOscillators
    .filter((oscillator) => oscillator.frequency.value > 0)
    .map((oscillator) => oscillator.frequency.value);
}

describe("ScorePlayer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    createdOscillators.length = 0;
    MockAudioContext.nextResumeImpl = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("does not initialize audio context before playback starts", () => {
    const { score, track } = createScoreGraph();
    const player = new ScorePlayer(score, track);

    expect(
      ((player as unknown) as { _audioContext?: AudioContext })._audioContext
    ).toBeUndefined();
  });

  test("uses full played beat duration for dotted beats", async () => {
    const { score, track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter, dots: 1 },
    ]);
    setBeatFret(beats[0], 0);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: beats[0] });

    const playableOscillators = createdOscillators.filter(
      (oscillator) => oscillator.frequency.value > 0
    );
    expect(playableOscillators).toHaveLength(1);
    expect(playableOscillators[0].start).toHaveBeenCalledWith(0.05);
    expect(playableOscillators[0].stop).toHaveBeenCalledWith(0.8);
  });

  test("keeps silence until the next bar when a bar is underfilled", async () => {
    const { score, track, bar } = createScoreGraph();
    const secondBar = score.appendMasterBar().bars.get(track.staves[0].uuid)!;

    setBeatFret(bar.beats[0], 0);
    setBeatFret(secondBar.beats[0], 2);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: bar.beats[0] });

    const playableOscillators = createdOscillators.filter(
      (oscillator) => oscillator.frequency.value > 0
    );
    expect(playableOscillators).toHaveLength(2);
    expect(playableOscillators[0].start).toHaveBeenCalledWith(0.05);
    expect(playableOscillators[1].start).toHaveBeenCalledWith(2.05);
  });

  test("plays beats from every track in the score", async () => {
    const { score, track, bar } = createScoreGraph();
    const secondTrack = score.addTrack(new Guitar(), "Track 2").tracks[0];
    const secondTrackBar = secondTrack.staves[0].bars[0];

    setBeatFret(bar.beats[0], 0);
    setBeatFret(secondTrackBar.beats[0], 4);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: bar.beats[0] });

    expect(oscillatorStarts()).toHaveLength(2);
    expect(oscillatorStarts()).toEqual([0.05, 0.05]);
  });

  test("selection playback honors repeats fully contained inside selection", async () => {
    const { score, track, bars, masterBars } = createScoreWithBars(6);

    masterBars[2].repeatStatus = BarRepeatStatus.Start;
    masterBars[3].repeatStatus = BarRepeatStatus.End;
    masterBars[3].repeatCount = 2;

    [0, 2, 4, 5, 7, 9].forEach((fret, index) => {
      setBeatFret(bars[index].beats[0], fret);
    });

    const expectedFrequencies = [
      getNoteFrequency(bars[0].beats[0].notes[0]),
      getNoteFrequency(bars[1].beats[0].notes[0]),
      getNoteFrequency(bars[2].beats[0].notes[0]),
      getNoteFrequency(bars[3].beats[0].notes[0]),
      getNoteFrequency(bars[2].beats[0].notes[0]),
      getNoteFrequency(bars[3].beats[0].notes[0]),
      getNoteFrequency(bars[4].beats[0].notes[0]),
      getNoteFrequency(bars[5].beats[0].notes[0]),
    ];

    const player = new ScorePlayer(score, track);
    ((player as unknown) as { _lookaheadSeconds: number })._lookaheadSeconds = 10;
    player.setLoopSection(bars[0].beats[0], bars[5].beats[0]);
    player.enableLoop();
    await player.start({ startBeat: bars[0].beats[0] });

    expect(oscillatorFrequencies().slice(0, 8)).toEqual(expectedFrequencies);
  });

  test("selection playback ignores repeats that start before selection", async () => {
    const { score, track, bars, masterBars } = createScoreWithBars(6);

    masterBars[1].repeatStatus = BarRepeatStatus.Start;
    masterBars[3].repeatStatus = BarRepeatStatus.End;
    masterBars[3].repeatCount = 2;

    [4, 5, 7, 9].forEach((fret, index) => {
      setBeatFret(bars[index + 2].beats[0], fret);
    });

    const expectedFrequencies = [
      getNoteFrequency(bars[2].beats[0].notes[0]),
      getNoteFrequency(bars[3].beats[0].notes[0]),
      getNoteFrequency(bars[4].beats[0].notes[0]),
      getNoteFrequency(bars[5].beats[0].notes[0]),
    ];

    const player = new ScorePlayer(score, track);
    ((player as unknown) as { _lookaheadSeconds: number })._lookaheadSeconds = 10;
    player.setLoopSection(bars[2].beats[0], bars[5].beats[0]);
    player.enableLoop();
    await player.start({ startBeat: bars[2].beats[0] });

    expect(oscillatorFrequencies().slice(0, 4)).toEqual(expectedFrequencies);
  });

  test("selection playback ignores repeats that end after selection", async () => {
    const { score, track, bars, masterBars } = createScoreWithBars(6);

    masterBars[2].repeatStatus = BarRepeatStatus.Start;
    masterBars[5].repeatStatus = BarRepeatStatus.End;
    masterBars[5].repeatCount = 2;

    [0, 2, 4, 5].forEach((fret, index) => {
      setBeatFret(bars[index].beats[0], fret);
    });

    const expectedFrequencies = [
      getNoteFrequency(bars[0].beats[0].notes[0]),
      getNoteFrequency(bars[1].beats[0].notes[0]),
      getNoteFrequency(bars[2].beats[0].notes[0]),
      getNoteFrequency(bars[3].beats[0].notes[0]),
    ];

    const player = new ScorePlayer(score, track);
    ((player as unknown) as { _lookaheadSeconds: number })._lookaheadSeconds = 10;
    player.setLoopSection(bars[0].beats[0], bars[3].beats[0]);
    player.enableLoop();
    await player.start({ startBeat: bars[0].beats[0] });

    expect(oscillatorFrequencies().slice(0, 4)).toEqual(expectedFrequencies);
  });

  test("does not start playback when audio context resume throws", async () => {
    const { score, track } = createScoreGraph();
    MockAudioContext.nextResumeImpl = () =>
      Promise.reject(new Error("Audio unlock failed"));
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const player = new ScorePlayer(score, track);
    await player.start();

    expect(player.isPlaying).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  test("ignores stale async starts after stop", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(bar.beats[0], 0);

    let resolveResume: (() => void) | undefined;
    MockAudioContext.nextResumeImpl = () =>
      new Promise<void>((resolve) => {
        resolveResume = resolve;
      });

    const player = new ScorePlayer(score, track);
    const startPromise = player.start({ startBeat: bar.beats[0] });
    player.stop();
    resolveResume?.();
    await startPromise;

    expect(player.isPlaying).toBe(false);
    expect(createdOscillators).toHaveLength(0);
  });

  test("newest start wins when two starts overlap", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(bar.beats[0], 0);

    let resolveFirstResume: (() => void) | undefined;
    let callCount = 0;
    MockAudioContext.nextResumeImpl = () => {
      callCount++;
      if (callCount === 1) {
        return new Promise<void>((resolve) => {
          resolveFirstResume = resolve;
        });
      }

      return Promise.resolve();
    };

    const player = new ScorePlayer(score, track);
    const firstStart = player.start({ startBeat: bar.beats[0] });
    const secondStart = player.start({ startBeat: bar.beats[0] });

    resolveFirstResume?.();
    await firstStart;
    await secondStart;

    expect(player.isPlaying).toBe(true);
    expect(oscillatorFrequencies()).toHaveLength(1);
  });

  test("stop is idempotent", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(bar.beats[0], 0);
    const player = new ScorePlayer(score, track);

    await player.start({ startBeat: bar.beats[0] });
    player.stop();
    player.stop();

    expect(player.isPlaying).toBe(false);
    expect(
      ((player as unknown) as { _scheduledVoices: Set<unknown> })._scheduledVoices
        .size
    ).toBe(0);
  });
});
