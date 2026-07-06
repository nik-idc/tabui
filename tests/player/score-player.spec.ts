import { ScorePlayer } from "../../src/player";
import {
  createBarWithBeats,
  createBeat,
  createScoreGraph,
} from "../model/helpers";
import {
  BarRepeatStatus,
  Bar,
  Guitar,
  MusicInstrument,
  NoteDuration,
  ElectricGuitarPreset,
  StringMusicInstrumentType,
  getNoteFrequency,
} from "../../src/notation/model";
import { trackEvent, TrackEventType } from "../../src/shared/events";

const createdOscillators: MockOscillatorNode[] = [];
const createdBufferSources: MockAudioBufferSourceNode[] = [];
const createdGains: MockGainNode[] = [];
const createdPanners: MockStereoPannerNode[] = [];

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
    cancelScheduledValues: jest.fn(),
  };
  public connect = jest.fn();
  public disconnect = jest.fn();

  constructor() {
    createdGains.push(this);
  }
}

class MockStereoPannerNode {
  public pan = {
    value: 0,
    setValueAtTime: jest.fn((value: number) => {
      this.pan.value = value;
    }),
  };
  public connect = jest.fn();
  public disconnect = jest.fn();

  constructor() {
    createdPanners.push(this);
  }
}

class MockAudioBufferSourceNode {
  public buffer: AudioBuffer | null = null;
  public playbackRate = { value: 1 };
  public onended?: () => void;
  public start = jest.fn();
  public stop = jest.fn(() => {
    this.onended?.();
  });
  public connect = jest.fn();
  public disconnect = jest.fn();

  constructor() {
    createdBufferSources.push(this);
  }
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

  public createStereoPanner(): StereoPannerNode {
    return new MockStereoPannerNode() as unknown as StereoPannerNode;
  }

  public createBufferSource(): AudioBufferSourceNode {
    return new MockAudioBufferSourceNode() as unknown as AudioBufferSourceNode;
  }

  public decodeAudioData(): Promise<AudioBuffer> {
    return Promise.resolve({} as AudioBuffer);
  }

  public resume(): Promise<void> {
    return MockAudioContext.nextResumeImpl?.() ?? Promise.resolve();
  }
}

(
  globalThis as unknown as { AudioContext: typeof MockAudioContext }
).AudioContext = MockAudioContext;

const fetchMock = jest.fn();
(globalThis as unknown as { fetch: jest.Mock }).fetch = fetchMock;

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

function setBeatFret(
  beat: { notes: Array<unknown> | null; makeBeatWithNotes: () => void },
  fret: number
): void {
  beat.makeBeatWithNotes();
  const note = beat.notes?.[0];
  if (typeof note !== "object" || note === null || !("fret" in note)) {
    throw Error("Expected fretted note in test beat");
  }

  note.fret = fret;
}

function firstBeatOf<I extends MusicInstrument>(bar: Bar<I>) {
  const voiceBar = bar.getVoiceBar(1);
  if (voiceBar === null) {
    throw Error("Expected voice 1 bar");
  }
  return voiceBar.beats[0];
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

function trackBusGains(): MockGainNode[] {
  return createdGains.filter((gain) =>
    createdPanners.some((panner) => gain.connect.mock.calls[0]?.[0] === panner)
  );
}

function noteEnvelopeGains(): MockGainNode[] {
  return createdGains.filter((gain) => !trackBusGains().includes(gain));
}

describe("ScorePlayer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    createdOscillators.length = 0;
    createdBufferSources.length = 0;
    createdGains.length = 0;
    createdPanners.length = 0;
    MockAudioContext.nextResumeImpl = null;
    fetchMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
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

    setBeatFret(firstBeatOf(bar), 0);
    setBeatFret(firstBeatOf(secondBar), 2);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

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

    setBeatFret(firstBeatOf(bar), 0);
    setBeatFret(firstBeatOf(secondTrackBar), 4);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(oscillatorStarts()).toHaveLength(2);
    expect(oscillatorStarts()).toEqual([0.05, 0.05]);
  });

  test("muted track is silent", async () => {
    const { score, track, bar } = createScoreGraph();
    const secondTrack = score.addTrack(new Guitar(), "Track 2").tracks[0];
    const secondTrackBar = secondTrack.staves[0].bars[0];

    setBeatFret(firstBeatOf(bar), 0);
    setBeatFret(firstBeatOf(secondTrackBar), 4);
    secondTrack.muted = true;

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstBeatOf(bar).notes![0]),
      getNoteFrequency(firstBeatOf(secondTrackBar).notes![0]),
    ]);
    expect(trackBusGains()[0].gain.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
    expect(trackBusGains()[1].gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
  });

  test("soloed track suppresses non-soloed tracks", async () => {
    const { score, track, bar } = createScoreGraph();
    const secondTrack = score.addTrack(new Guitar(), "Track 2").tracks[0];
    const secondTrackBar = secondTrack.staves[0].bars[0];

    setBeatFret(firstBeatOf(bar), 0);
    setBeatFret(firstBeatOf(secondTrackBar), 4);
    secondTrack.soloed = true;

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstBeatOf(bar).notes![0]),
      getNoteFrequency(firstBeatOf(secondTrackBar).notes![0]),
    ]);
    expect(trackBusGains()[0].gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
    expect(trackBusGains()[1].gain.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
  });

  test("track volume affects scheduled gain", async () => {
    const { score, track, bar } = createScoreGraph();
    track.volume = 0.25;
    setBeatFret(firstBeatOf(bar), 0);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(noteEnvelopeGains()).toHaveLength(1);
    expect(trackBusGains()[0].gain.setValueAtTime).toHaveBeenCalledWith(
      0.25,
      0
    );
    expect(
      noteEnvelopeGains()[0].gain.linearRampToValueAtTime
    ).toHaveBeenCalledWith(0.06, 0.060000000000000005);
    expect(noteEnvelopeGains()[0].gain.setValueAtTime).toHaveBeenCalledWith(
      0.06,
      0.53
    );
  });

  test("track pan routes scheduled output through stereo panner", async () => {
    const { score, track, bar } = createScoreGraph();
    track.pan = -0.75;
    setBeatFret(firstBeatOf(bar), 0);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(createdPanners).toHaveLength(1);
    expect(createdPanners[0].pan.setValueAtTime).toHaveBeenCalledWith(-0.75, 0);
    expect(trackBusGains()[0].connect).toHaveBeenCalledWith(createdPanners[0]);
  });

  test("track playback-control changes apply to buffered audio", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    track.volume = 0.25;
    track.pan = 0.5;
    player.syncTrackPlaybackState();

    expect(trackBusGains()[0].gain.setValueAtTime).toHaveBeenCalledWith(
      0.25,
      expect.any(Number)
    );
    expect(createdPanners[0].pan.setValueAtTime).toHaveBeenCalledWith(
      0.5,
      expect.any(Number)
    );

    track.muted = true;
    player.syncTrackPlaybackState();

    expect(trackBusGains()[0].gain.setValueAtTime).toHaveBeenCalledWith(
      0,
      expect.any(Number)
    );
  });

  test("track muted while buffering can become audible again", async () => {
    const { score, track, bar } = createScoreGraph();
    track.muted = true;
    setBeatFret(firstBeatOf(bar), 0);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(trackBusGains()[0].gain.setValueAtTime).toHaveBeenCalledWith(0, 0);

    track.muted = false;
    player.syncTrackPlaybackState();

    expect(trackBusGains()[0].gain.setValueAtTime).toHaveBeenCalledWith(
      0.5,
      expect.any(Number)
    );
  });

  test("creates audio bus for track added after audio context initialization", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });
    player.stop();

    const secondTrack = score.addTrack(new Guitar(), "Track 2").tracks[0];
    const secondTrackBar = secondTrack.staves[0].bars[0];
    setBeatFret(firstBeatOf(secondTrackBar), 4);

    createdOscillators.length = 0;
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstBeatOf(bar).notes![0]),
      getNoteFrequency(firstBeatOf(secondTrackBar).notes![0]),
    ]);
  });

  test("removed track is not scheduled after audio context initialization", async () => {
    const { score, track, bar } = createScoreGraph();
    const secondTrack = score.addTrack(new Guitar(), "Track 2").tracks[0];
    const secondTrackBar = secondTrack.staves[0].bars[0];

    setBeatFret(firstBeatOf(bar), 0);
    setBeatFret(firstBeatOf(secondTrackBar), 4);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });
    player.stop();
    score.removeTrack(1);

    createdOscillators.length = 0;
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstBeatOf(bar).notes![0]),
    ]);
  });

  test("added staff is scheduled after audio context initialization", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });
    player.stop();

    const staff = track.insertStaff(1).staves[0];
    const staffBar = staff.bars[0];
    const voiceBar = staffBar.ensureVoiceBar(1);
    voiceBar.replaceBeats([createBeat(voiceBar, NoteDuration.Quarter)]);
    setBeatFret(firstBeatOf(staffBar), 4);

    createdOscillators.length = 0;
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstBeatOf(bar).notes![0]),
      getNoteFrequency(firstBeatOf(staffBar).notes![0]),
    ]);
  });

  test("removed staff is not scheduled after audio context initialization", async () => {
    const { score, track, bar } = createScoreGraph();
    const staff = track.insertStaff(1).staves[0];
    const staffBar = staff.bars[0];
    const voiceBar = staffBar.ensureVoiceBar(1);
    voiceBar.replaceBeats([createBeat(voiceBar, NoteDuration.Quarter)]);

    setBeatFret(firstBeatOf(bar), 0);
    setBeatFret(firstBeatOf(staffBar), 4);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });
    player.stop();
    track.removeStaff(1);

    createdOscillators.length = 0;
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstBeatOf(bar).notes![0]),
    ]);
  });

  test("added and removed voices affect subsequent playback runs", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });
    player.stop();

    const secondVoiceBar = bar.ensureVoiceBar(2);
    secondVoiceBar.replaceBeats([
      createBeat(secondVoiceBar, NoteDuration.Quarter),
    ]);
    setBeatFret(secondVoiceBar.beats[0], 4);

    createdOscillators.length = 0;
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstBeatOf(bar).notes![0]),
      getNoteFrequency(secondVoiceBar.beats[0].notes![0]),
    ]);

    player.stop();
    bar.removeVoiceBar(2);
    createdOscillators.length = 0;
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstBeatOf(bar).notes![0]),
    ]);
  });

  test("uses configured clean electric guitar sample when it loads", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);
    fetchMock.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });

    const player = new ScorePlayer(score, track, {
      [ElectricGuitarPreset.Clean]: {
        url: "/samples/clean-electric-guitar.wav",
        rootFrequency: getNoteFrequency(firstBeatOf(bar).notes![0]),
      },
    });
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(fetchMock).toHaveBeenCalledWith(
      "/samples/clean-electric-guitar.wav"
    );
    expect(createdBufferSources).toHaveLength(1);
    expect(createdBufferSources[0].playbackRate.value).toBe(1);
    expect(createdBufferSources[0].start).toHaveBeenCalledWith(0.05);
    expect(createdOscillators).toHaveLength(0);
  });

  test("uses separate configured samples for different presets", async () => {
    const { score, track, bar } = createScoreGraph();
    const leadTrack = score.addTrack(
      new Guitar(
        StringMusicInstrumentType.ElectricGuitar,
        ElectricGuitarPreset.Overdrive,
        "Lead"
      ),
      "Lead"
    ).tracks[0];
    const leadBar = leadTrack.staves[0].bars[0];

    setBeatFret(firstBeatOf(bar), 0);
    setBeatFret(firstBeatOf(leadBar), 0);
    fetchMock.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });

    const noteFrequency = getNoteFrequency(firstBeatOf(bar).notes![0]);
    const player = new ScorePlayer(score, track, {
      [ElectricGuitarPreset.Clean]: {
        url: "/samples/clean.wav",
        rootFrequency: noteFrequency,
      },
      [ElectricGuitarPreset.Overdrive]: {
        url: "/samples/overdrive.wav",
        rootFrequency: noteFrequency / 2,
      },
    });
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(fetchMock).toHaveBeenCalledWith("/samples/clean.wav");
    expect(fetchMock).toHaveBeenCalledWith("/samples/overdrive.wav");
    expect(createdBufferSources).toHaveLength(2);
    const playbackRates = createdBufferSources.map(
      (source) => source.playbackRate.value
    );
    expect(playbackRates).toEqual([1, 2]);
    expect(createdOscillators).toHaveLength(0);
  });

  test("falls back to oscillator when sample loading fails", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);
    fetchMock.mockRejectedValue(new Error("network failed"));
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const player = new ScorePlayer(score, track, {
      [ElectricGuitarPreset.Clean]: {
        url: "/samples/missing.wav",
        rootFrequency: 82.4068892282175,
      },
    });
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(createdBufferSources).toHaveLength(0);
    expect(oscillatorFrequencies()).toHaveLength(1);

    consoleErrorSpy.mockRestore();
  });

  test("selection playback honors repeats fully contained inside selection", async () => {
    const { score, track, bars, masterBars } = createScoreWithBars(6);

    masterBars[2].repeatStatus = BarRepeatStatus.Start;
    masterBars[3].repeatStatus = BarRepeatStatus.End;
    masterBars[3].repeatCount = 2;

    [0, 2, 4, 5, 7, 9].forEach((fret, index) => {
      setBeatFret(firstBeatOf(bars[index]), fret);
    });

    const bar0Note = firstBeatOf(bars[0]).notes?.[0];
    const bar1Note = firstBeatOf(bars[1]).notes?.[0];
    const bar2Note = firstBeatOf(bars[2]).notes?.[0];
    const bar3Note = firstBeatOf(bars[3]).notes?.[0];
    const bar4Note = firstBeatOf(bars[4]).notes?.[0];
    const bar5Note = firstBeatOf(bars[5]).notes?.[0];
    if (
      bar0Note === undefined ||
      bar1Note === undefined ||
      bar2Note === undefined ||
      bar3Note === undefined ||
      bar4Note === undefined ||
      bar5Note === undefined
    ) {
      throw Error("Expected notes in playback test beats");
    }
    const expectedFrequencies = [
      getNoteFrequency(bar0Note),
      getNoteFrequency(bar1Note),
      getNoteFrequency(bar2Note),
      getNoteFrequency(bar3Note),
      getNoteFrequency(bar2Note),
      getNoteFrequency(bar3Note),
      getNoteFrequency(bar4Note),
      getNoteFrequency(bar5Note),
    ];

    const player = new ScorePlayer(score, track);
    player.setLoopSection(firstBeatOf(bars[0]), firstBeatOf(bars[5]));
    player.enableLoop();
    await player.start({ startBeat: firstBeatOf(bars[0]) });

    expect(oscillatorFrequencies().slice(0, 8)).toEqual(expectedFrequencies);
  });

  test("selection playback ignores repeats that start before selection", async () => {
    const { score, track, bars, masterBars } = createScoreWithBars(6);

    masterBars[1].repeatStatus = BarRepeatStatus.Start;
    masterBars[3].repeatStatus = BarRepeatStatus.End;
    masterBars[3].repeatCount = 2;

    [4, 5, 7, 9].forEach((fret, index) => {
      setBeatFret(firstBeatOf(bars[index + 2]), fret);
    });

    const bar2Note = firstBeatOf(bars[2]).notes?.[0];
    const bar3Note = firstBeatOf(bars[3]).notes?.[0];
    const bar4Note = firstBeatOf(bars[4]).notes?.[0];
    const bar5Note = firstBeatOf(bars[5]).notes?.[0];
    if (
      bar2Note === undefined ||
      bar3Note === undefined ||
      bar4Note === undefined ||
      bar5Note === undefined
    ) {
      throw Error("Expected notes in playback test beats");
    }
    const expectedFrequencies = [
      getNoteFrequency(bar2Note),
      getNoteFrequency(bar3Note),
      getNoteFrequency(bar4Note),
      getNoteFrequency(bar5Note),
    ];

    const player = new ScorePlayer(score, track);
    player.setLoopSection(firstBeatOf(bars[2]), firstBeatOf(bars[5]));
    player.enableLoop();
    await player.start({ startBeat: firstBeatOf(bars[2]) });

    expect(oscillatorFrequencies().slice(0, 4)).toEqual(expectedFrequencies);
  });

  test("selection playback ignores repeats that end after selection", async () => {
    const { score, track, bars, masterBars } = createScoreWithBars(6);

    masterBars[2].repeatStatus = BarRepeatStatus.Start;
    masterBars[5].repeatStatus = BarRepeatStatus.End;
    masterBars[5].repeatCount = 2;

    [0, 2, 4, 5].forEach((fret, index) => {
      setBeatFret(firstBeatOf(bars[index]), fret);
    });

    const bar0Note = firstBeatOf(bars[0]).notes?.[0];
    const bar1Note = firstBeatOf(bars[1]).notes?.[0];
    const bar2Note = firstBeatOf(bars[2]).notes?.[0];
    const bar3Note = firstBeatOf(bars[3]).notes?.[0];
    if (
      bar0Note === undefined ||
      bar1Note === undefined ||
      bar2Note === undefined ||
      bar3Note === undefined
    ) {
      throw Error("Expected notes in playback test beats");
    }
    const expectedFrequencies = [
      getNoteFrequency(bar0Note),
      getNoteFrequency(bar1Note),
      getNoteFrequency(bar2Note),
      getNoteFrequency(bar3Note),
    ];

    const player = new ScorePlayer(score, track);
    player.setLoopSection(firstBeatOf(bars[0]), firstBeatOf(bars[3]));
    player.enableLoop();
    await player.start({ startBeat: firstBeatOf(bars[0]) });

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
    setBeatFret(firstBeatOf(bar), 0);

    let resolveResume: (() => void) | undefined;
    MockAudioContext.nextResumeImpl = () =>
      new Promise<void>((resolve) => {
        resolveResume = resolve;
      });

    const player = new ScorePlayer(score, track);
    const startPromise = player.start({ startBeat: firstBeatOf(bar) });
    player.stop();
    resolveResume?.();
    await startPromise;

    expect(player.isPlaying).toBe(false);
    expect(createdOscillators).toHaveLength(0);
  });

  test("newest start wins when two starts overlap", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);

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
    const firstStart = player.start({ startBeat: firstBeatOf(bar) });
    const secondStart = player.start({ startBeat: firstBeatOf(bar) });

    resolveFirstResume?.();
    await firstStart;
    await secondStart;

    expect(player.isPlaying).toBe(true);
    expect(oscillatorFrequencies()).toHaveLength(1);
  });

  test("stop is idempotent", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);
    const player = new ScorePlayer(score, track);
    const emitSpy = jest.spyOn(trackEvent, "emit");

    await player.start({ startBeat: firstBeatOf(bar) });
    player.stop();
    player.stop();
    jest.advanceTimersByTime(1000);

    expect(player.isPlaying).toBe(false);
    expect(
      emitSpy.mock.calls.filter(
        ([eventType]) => eventType === TrackEventType.PlayerCurBeatChanged
      )
    ).toHaveLength(0);

    emitSpy.mockRestore();
  });
});
