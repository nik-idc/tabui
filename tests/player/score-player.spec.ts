import { PlaybackErrorCode, ScorePlayer } from "../../src/player";
import {
  createBarWithBeats,
  createBeat,
  createScoreGraph,
} from "../model/helpers";
import {
  BarRepeatStatus,
  BendTechniqueOptions,
  BendType,
  Bar,
  Beat,
  BassGuitarTone,
  Guitar,
  GuitarTechnique,
  GuitarTechniqueType,
  MusicInstrument,
  NoteDuration,
  NoteValue,
  ElectricGuitarTone,
  StringInstrumentType,
  getNoteFrequency,
} from "../../src/notation/model";
import { trackEvent, TrackEventType } from "../../src/shared/events";

const createdOscillators: MockOscillatorNode[] = [];
const createdBufferSources: MockAudioBufferSourceNode[] = [];
const createdGains: MockGainNode[] = [];
const createdPanners: MockStereoPannerNode[] = [];
const createdAudioContexts: MockAudioContext[] = [];

class MockOscillatorNode {
  public static nextStartImpl: ((startTime: number) => void) | null = null;
  public static nextStopImpl: ((stopTime?: number) => void) | null = null;

  public type = "sine";
  public frequency = {
    value: 0,
    setValueAtTime: jest.fn((value: number) => {
      this.frequency.value = value;
    }),
    linearRampToValueAtTime: jest.fn((value: number) => {
      this.frequency.value = value;
    }),
  };
  public onended?: () => void;
  public start = jest.fn((startTime: number) => {
    const startImpl = MockOscillatorNode.nextStartImpl;
    MockOscillatorNode.nextStartImpl = null;
    startImpl?.(startTime);
  });
  public stop = jest.fn((_when?: number) => {
    const stopImpl = MockOscillatorNode.nextStopImpl;
    MockOscillatorNode.nextStopImpl = null;
    stopImpl?.(_when);
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
  public playbackRate = {
    value: 1,
    setValueAtTime: jest.fn((value: number) => {
      this.playbackRate.value = value;
    }),
    linearRampToValueAtTime: jest.fn((value: number) => {
      this.playbackRate.value = value;
    }),
  };
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
  public static nextCloseImpl: (() => Promise<void>) | null = null;
  public static nextConstructorError: Error | null = null;
  public static nextCreateGainError: Error | null = null;
  public static createGainErrorAtCall: number | null = null;
  public static createGainCallCount = 0;

  public destination = {};

  constructor() {
    const error = MockAudioContext.nextConstructorError;
    MockAudioContext.nextConstructorError = null;
    if (error !== null) {
      throw error;
    }
    createdAudioContexts.push(this);
  }

  public get currentTime(): number {
    return Date.now() / 1000;
  }

  public createOscillator(): OscillatorNode {
    return new MockOscillatorNode() as unknown as OscillatorNode;
  }

  public createGain(): GainNode {
    MockAudioContext.createGainCallCount++;
    const error = MockAudioContext.nextCreateGainError;
    const shouldThrow =
      error !== null &&
      (MockAudioContext.createGainErrorAtCall === null ||
        MockAudioContext.createGainCallCount ===
          MockAudioContext.createGainErrorAtCall);
    if (shouldThrow) {
      MockAudioContext.nextCreateGainError = null;
      MockAudioContext.createGainErrorAtCall = null;
      throw error;
    }
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

  public close = jest.fn(() => {
    const closeImpl = MockAudioContext.nextCloseImpl;
    MockAudioContext.nextCloseImpl = null;
    return closeImpl?.() ?? Promise.resolve();
  });
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

function firstNoteOf<I extends MusicInstrument>(bar: Bar<I>) {
  return firstNoteOfBeat(firstBeatOf(bar));
}

function firstNoteOfBeat<I extends MusicInstrument>(beat: Beat<I>) {
  const note = beat.notes?.[0];
  if (note === undefined) {
    throw Error("Expected note in test beat");
  }

  return note;
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
  return createdGains.filter((gain) => {
    const panner = createdPanners.find(
      (candidate) => gain.connect.mock.calls[0]?.[0] === candidate
    );
    return (
      panner !== undefined &&
      !createdAudioContexts.some(
        (context) => panner.connect.mock.calls[0]?.[0] === context.destination
      )
    );
  });
}

function masterBusGain(): MockGainNode | undefined {
  return createdGains.find((gain) =>
    createdPanners.some(
      (panner) =>
        gain.connect.mock.calls[0]?.[0] === panner &&
        createdAudioContexts.some(
          (context) => panner.connect.mock.calls[0]?.[0] === context.destination
        )
    )
  );
}

function masterBusPanner(): MockStereoPannerNode | undefined {
  return createdPanners.find((panner) =>
    createdAudioContexts.some(
      (context) => panner.connect.mock.calls[0]?.[0] === context.destination
    )
  );
}

function noteEnvelopeGains(): MockGainNode[] {
  return createdGains.filter(
    (gain) => gain !== masterBusGain() && !trackBusGains().includes(gain)
  );
}

describe("ScorePlayer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    createdOscillators.length = 0;
    createdBufferSources.length = 0;
    createdGains.length = 0;
    createdPanners.length = 0;
    createdAudioContexts.length = 0;
    MockAudioContext.nextResumeImpl = null;
    MockAudioContext.nextCloseImpl = null;
    MockAudioContext.nextConstructorError = null;
    MockAudioContext.nextCreateGainError = null;
    MockAudioContext.createGainErrorAtCall = null;
    MockAudioContext.createGainCallCount = 0;
    MockOscillatorNode.nextStartImpl = null;
    MockOscillatorNode.nextStopImpl = null;
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

  test("schedules a master bar longer than the lookahead immediately", async () => {
    const { score, track, bar } = createScoreGraph({
      tempo: 40,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      repeatStatus: BarRepeatStatus.None,
      repeatCount: null,
    });
    const beat = firstBeatOf(bar);
    setBeatFret(beat, 0);
    const player = new ScorePlayer(score, track);

    await player.start({ startBeat: beat });

    expect(oscillatorStarts()).toEqual([0.05]);
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
    ).toHaveBeenCalledWith(0.0648, 0.060000000000000005);
    expect(noteEnvelopeGains()[0].gain.setValueAtTime).toHaveBeenCalledWith(
      0.0648,
      0.53
    );
  });

  test("repeated notes are softened after the first attack", async () => {
    const { score, track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    setBeatFret(beats[0], 0);
    setBeatFret(beats[1], 0);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: beats[0] });

    expect(
      noteEnvelopeGains()[0].gain.linearRampToValueAtTime
    ).toHaveBeenCalledWith(0.0648, 0.060000000000000005);
    expect(
      noteEnvelopeGains()[1].gain.linearRampToValueAtTime
    ).toHaveBeenCalledWith(0.0552, 0.56);
  });

  test("palm mute shortens and softens note playback", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);
    const note = firstNoteOf(bar);
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.PalmMute));

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(createdOscillators[0].stop).toHaveBeenCalledWith(
      0.22999999999999998
    );
    expect(
      noteEnvelopeGains()[0].gain.linearRampToValueAtTime
    ).toHaveBeenCalledWith(0.038, 0.060000000000000005);
  });

  test("let ring extends note playback", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);
    const note = firstNoteOf(bar);
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(createdOscillators[0].stop).toHaveBeenCalledWith(1.25);
    expect(noteEnvelopeGains()[0].gain.setValueAtTime).toHaveBeenCalledWith(
      0.0648,
      1.23
    );
  });

  test("legato playback uses softer attack", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);
    const note = firstNoteOf(bar);
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.Legato));

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(
      noteEnvelopeGains()[0].gain.linearRampToValueAtTime
    ).toHaveBeenCalledWith(0.048, 0.068);
    expect(noteEnvelopeGains()[0].gain.setValueAtTime).toHaveBeenCalledWith(
      0.048,
      0.53
    );
  });

  test("bend automates note pitch", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);
    const note = firstNoteOf(bar);
    note.addTechnique(
      new GuitarTechnique(
        note,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 2,
          bendDuration: 0.5,
        })
      )
    );

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    const frequency = getNoteFrequency(note);
    expect(createdOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      frequency,
      0.05
    );
    expect(
      createdOscillators[0].frequency.linearRampToValueAtTime
    ).toHaveBeenCalledWith(frequency * 2 ** (2 / 12), 0.3);
  });

  test.each([BendType.Bend, BendType.BendAndRelease])(
    "continuation bend type %s starts at the previous terminal pitch",
    async (type) => {
      const { score, track, beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter },
      ]);
      setBeatFret(beats[0], 0);
      setBeatFret(beats[1], 0);
      const previous = firstNoteOfBeat(beats[0]);
      const current = firstNoteOfBeat(beats[1]);
      previous.addTechnique(
        new GuitarTechnique(
          previous,
          GuitarTechniqueType.Bend,
          new BendTechniqueOptions({
            type: BendType.Bend,
            bendPitch: 1.5,
            bendDuration: 0.5,
          })
        )
      );
      current.addTechnique(
        new GuitarTechnique(current, GuitarTechniqueType.LetRing)
      );
      current.addTechnique(
        new GuitarTechnique(
          current,
          GuitarTechniqueType.Bend,
          new BendTechniqueOptions(
            type === BendType.Bend
              ? { type, bendPitch: 2, bendDuration: 0.5 }
              : {
                  type,
                  bendPitch: 2,
                  releasePitch: 0,
                  bendDuration: 0.5,
                }
          )
        )
      );

      const player = new ScorePlayer(score, track);
      await player.start({ startBeat: beats[0] });

      const frequency = getNoteFrequency(current);
      expect(
        createdOscillators[1].frequency.setValueAtTime
      ).toHaveBeenLastCalledWith(frequency * 2 ** (1.5 / 12), 0.55);
      expect(
        createdOscillators[1].frequency.linearRampToValueAtTime
      ).toHaveBeenCalledWith(frequency * 2 ** (2 / 12), 1.15);
      if (type === BendType.BendAndRelease) {
        expect(
          createdOscillators[1].frequency.linearRampToValueAtTime
        ).toHaveBeenCalledWith(frequency, 1.75);
      }
    }
  );

  test("Hold starts and remains at the previous bend terminal pitch", async () => {
    const { score, track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    setBeatFret(beats[0], 0);
    setBeatFret(beats[1], 0);
    const previous = firstNoteOfBeat(beats[0]);
    const current = firstNoteOfBeat(beats[1]);
    previous.addTechnique(
      new GuitarTechnique(
        previous,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 1.5,
          bendDuration: 0.5,
        })
      )
    );
    current.addTechnique(
      new GuitarTechnique(current, GuitarTechniqueType.LetRing)
    );
    current.addTechnique(
      new GuitarTechnique(
        current,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Hold,
          holdPitch: 0.5,
          bendDuration: 1,
        })
      )
    );

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: beats[0] });

    const continuationValue = getNoteFrequency(current) * 2 ** (1.5 / 12);
    expect(
      createdOscillators[1].frequency.setValueAtTime
    ).toHaveBeenLastCalledWith(continuationValue, 0.55);
    expect(
      createdOscillators[1].frequency.linearRampToValueAtTime
    ).not.toHaveBeenCalled();
  });

  test("Release ramps from the previous bend terminal pitch", async () => {
    const { score, track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    setBeatFret(beats[0], 0);
    setBeatFret(beats[1], 0);
    const previous = firstNoteOfBeat(beats[0]);
    const current = firstNoteOfBeat(beats[1]);
    previous.addTechnique(
      new GuitarTechnique(
        previous,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 1.5,
          bendDuration: 0.5,
        })
      )
    );
    current.addTechnique(
      new GuitarTechnique(current, GuitarTechniqueType.LetRing)
    );
    current.addTechnique(
      new GuitarTechnique(
        current,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Release,
          releasePitch: 0,
          bendDuration: 0.5,
        })
      )
    );

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: beats[0] });

    const frequency = getNoteFrequency(current);
    expect(
      createdOscillators[1].frequency.setValueAtTime
    ).toHaveBeenLastCalledWith(frequency * 2 ** (1.5 / 12), 0.55);
    expect(
      createdOscillators[1].frequency.linearRampToValueAtTime
    ).toHaveBeenCalledWith(frequency, 1.15);
  });

  test("rejects continuation automation without valid context", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);
    const note = firstNoteOf(bar);
    note.addTechnique(
      new GuitarTechnique(
        note,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Hold,
          holdPitch: 1,
          bendDuration: 1,
        })
      )
    );
    const onError = jest.fn();
    const player = new ScorePlayer(score, track, {}, onError);
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await player.start({ startBeat: firstBeatOf(bar) });

    expect(player.isPlaying).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to schedule playback",
      expect.objectContaining({
        message:
          "Hold and Release playback require a previous bend continuation",
      })
    );
    expect(
      createdOscillators[0].frequency.linearRampToValueAtTime
    ).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith({
      code: PlaybackErrorCode.Scheduling,
      message: "Failed to schedule playback",
      cause: expect.objectContaining({
        message:
          "Hold and Release playback require a previous bend continuation",
      }),
    });
    consoleErrorSpy.mockRestore();
  });

  test("slide targets the next same-string note", async () => {
    const { score, track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    setBeatFret(beats[0], 0);
    setBeatFret(beats[1], 2);
    const note = beats[0].notes![0];
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.Slide));

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: beats[0] });

    expect(oscillatorFrequencies()).toHaveLength(1);
    expect(createdOscillators[0].stop).toHaveBeenCalledWith(1.05);
    expect(createdOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      getNoteFrequency(note),
      expect.closeTo(0.225)
    );
    expect(
      createdOscillators[0].frequency.linearRampToValueAtTime
    ).toHaveBeenCalledWith(getNoteFrequency(beats[1].notes![0]), 0.55);
  });

  test("slide does not consume an unplayable target note", async () => {
    const { score, track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    setBeatFret(beats[0], 0);
    setBeatFret(beats[1], 2);
    const note = beats[0].notes![0];
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.Slide));
    beats[1].notes![0].setNote(NoteValue.Dead, null);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: beats[0] });

    expect(oscillatorFrequencies()).toHaveLength(1);
    expect(createdOscillators[0].stop).toHaveBeenCalledWith(0.55);
    expect(
      createdOscillators[0].frequency.linearRampToValueAtTime
    ).not.toHaveBeenCalledWith(expect.any(Number), 0.55);
  });

  test("harmonics shift pitch up and use softer envelope", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);
    const note = firstNoteOf(bar);
    note.addTechnique(
      new GuitarTechnique(note, GuitarTechniqueType.NaturalHarmonic)
    );

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(createdOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      getNoteFrequency(note) * 2,
      0.05
    );
    expect(
      noteEnvelopeGains()[0].gain.linearRampToValueAtTime
    ).toHaveBeenCalledWith(0.045, 0.060000000000000005);
  });

  test("bass oscillator fallback uses a warmer profile", async () => {
    const { score, track, bar } = createScoreGraph();
    track.setInstrument(
      new Guitar(
        StringInstrumentType.BassGuitar,
        BassGuitarTone.Clean,
        "Bass",
        4
      )
    );
    setBeatFret(firstBeatOf(bar), 0);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    expect(createdOscillators[0].type).toBe("triangle");
    expect(
      noteEnvelopeGains()[0].gain.linearRampToValueAtTime
    ).toHaveBeenCalledWith(0.069984, 0.060500000000000005);
    expect(noteEnvelopeGains()[0].gain.setValueAtTime).toHaveBeenCalledWith(
      0.069984,
      0.525
    );
  });

  test("track pan routes scheduled output through stereo panner", async () => {
    const { score, track, bar } = createScoreGraph();
    track.pan = -0.75;
    setBeatFret(firstBeatOf(bar), 0);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    const trackPanner = createdPanners.find(
      (panner) => panner !== masterBusPanner()
    );
    expect(createdPanners).toHaveLength(2);
    expect(trackPanner?.pan.setValueAtTime).toHaveBeenCalledWith(-0.75, 0);
    expect(trackBusGains()[0].connect).toHaveBeenCalledWith(trackPanner);
    expect(trackPanner?.connect).toHaveBeenCalledWith(masterBusGain());
  });

  test("master controls route and update buffered score audio", async () => {
    const { score, track, bar } = createScoreGraph();
    score.masterVolume = 0.8;
    score.masterPan = -0.25;
    setBeatFret(firstBeatOf(bar), 0);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });

    const masterGain = masterBusGain();
    const masterPanner = masterBusPanner();
    expect(masterGain?.gain.setValueAtTime).toHaveBeenCalledWith(0.8, 0);
    expect(masterPanner?.pan.setValueAtTime).toHaveBeenCalledWith(-0.25, 0);

    score.masterVolume = 0.4;
    score.masterPan = 0.5;
    player.syncMasterPlaybackState();

    expect(masterGain?.gain.setValueAtTime).toHaveBeenCalledWith(
      0.4,
      expect.any(Number)
    );
    expect(masterPanner?.pan.setValueAtTime).toHaveBeenCalledWith(
      0.5,
      expect.any(Number)
    );
    expect(createdOscillators).toHaveLength(1);
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
    const trackPanner = createdPanners.find(
      (panner) => panner !== masterBusPanner()
    );
    expect(trackPanner?.pan.setValueAtTime).toHaveBeenCalledWith(
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

  test("cursor follows scheduled beats on non-starting staves", async () => {
    const { track, bar } = createScoreGraph();
    const staff = track.insertStaff(1).staves[0];
    const staffBar = staff.bars[0];
    const voiceBar = staffBar.ensureVoiceBar(1);
    voiceBar.beats.splice(
      0,
      voiceBar.beats.length,
      createBeat(voiceBar, NoteDuration.Half),
      createBeat(voiceBar, NoteDuration.Half)
    );
    voiceBar.rebuildTiming();
    setBeatFret(firstBeatOf(bar), 0);
    setBeatFret(voiceBar.beats[0], 4);
    setBeatFret(voiceBar.beats[1], 5);
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const player = new ScorePlayer(track.score, track);

    await player.start({ startBeat: firstBeatOf(bar) });
    jest.advanceTimersByTime(0);
    jest.advanceTimersByTime(2000);

    const beatChangedEvents = emitSpy.mock.calls.filter(
      ([eventType]) => eventType === TrackEventType.PlayerCurBeatChanged
    );
    const beatUUIDs = beatChangedEvents.map(([, args]) => {
      if (!("beatUUID" in args)) {
        throw Error("Expected beat change event args");
      }
      return args.beatUUID;
    });
    expect(beatUUIDs).toContain(voiceBar.beats[1].uuid);
    expect(player.lastStartedBeat).toBe(voiceBar.beats[1]);

    emitSpy.mockRestore();
  });

  test("active-track switching retargets buffered cursor events without changing the player run", async () => {
    const { score, track, bars } = createScoreWithBars(2);
    const secondTrack = score.addTrack(new Guitar(), "Track 2").tracks[0];
    const firstTrackBar = track.staves[0].bars[0];
    const secondTrackBars = secondTrack.staves[0].bars;
    const firstBeat = firstBeatOf(bars[0]);
    const secondBeat = firstBeatOf(bars[1]);
    const secondTrackFirstBeat = firstBeatOf(secondTrackBars[0]);
    const secondTrackSecondBeat = firstBeatOf(secondTrackBars[1]);
    setBeatFret(firstBeat, 0);
    setBeatFret(secondBeat, 2);
    setBeatFret(secondTrackFirstBeat, 4);
    setBeatFret(secondTrackSecondBeat, 5);
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const player = new ScorePlayer(score, track);
    const playerUUID = player.uuid;

    player.toggleLoop();
    await player.start({ startBeat: firstBeat });
    expect(player.isPlaying).toBe(true);
    expect(player.isLooped).toBe(true);
    expect(player.playbackRunId).toBe(1);
    jest.advanceTimersByTime(50);

    expect(player.lastStartedBeat).toBe(firstBeat);
    emitSpy.mockClear();
    const oscillatorCountBeforeSwitch = createdOscillators.length;

    expect(player.getCurrentBeatForTrack(secondTrack)).toBe(
      secondTrackFirstBeat
    );

    player.setActiveTrack(secondTrack);

    expect(player.uuid).toBe(playerUUID);
    expect(player.playbackRunId).toBe(1);
    expect(player.isLooped).toBe(true);
    expect(player.lastStartedBeat).toBe(secondTrackFirstBeat);
    expect(player.playbackAnchorBeat).toBe(secondTrackFirstBeat);
    expect(createdOscillators).toHaveLength(oscillatorCountBeforeSwitch);

    jest.advanceTimersByTime(500);

    const retargetedCalls = emitSpy.mock.calls.filter(
      ([eventType, args]) =>
        eventType === TrackEventType.PlayerCurBeatChanged &&
        "trackUUID" in args &&
        args.trackUUID === secondTrack.uuid
    );
    expect(retargetedCalls).toHaveLength(2);
    expect(retargetedCalls[0][1]).toEqual(
      expect.objectContaining({
        playerUUID: playerUUID,
        beatUUID: secondTrackFirstBeat.uuid,
        playbackRunId: 1,
      })
    );
    expect(retargetedCalls[1][1]).toEqual(
      expect.objectContaining({
        playerUUID: playerUUID,
        beatUUID: secondTrackSecondBeat.uuid,
        playbackRunId: 1,
      })
    );

    emitSpy.mockRestore();
  });

  test("simultaneous cursor beats preserve the explicitly started lane", async () => {
    const { score, track } = createScoreGraph();
    const secondStaff = track.insertStaff(1).staves[0];
    const secondStaffBar = secondStaff.bars[0];
    const selectedVoice = secondStaffBar.insertVoiceBar(2);
    const selectedBeat = selectedVoice.beats[0];
    const player = new ScorePlayer(score, track);

    await player.start({ startBeat: selectedBeat });
    jest.advanceTimersByTime(50);

    expect(player.lastStartedBeat).toBe(selectedBeat);
  });

  test("emits audio-clock cursor segments between scheduled beat attacks", async () => {
    const { score, track, bars } = createScoreWithBars(2);
    const firstBeat = firstBeatOf(bars[0]);
    const secondBeat = firstBeatOf(bars[1]);
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const player = new ScorePlayer(score, track);

    await player.start({ startBeat: firstBeat });
    expect(player.lastStartedBeat).toBeUndefined();
    expect(player.playbackAnchorBeat).toBe(firstBeat);
    jest.advanceTimersByTime(50);

    expect(player.lastStartedBeat).toBe(firstBeat);
    expect(player.playbackAnchorBeat).toBe(firstBeat);

    expect(emitSpy).toHaveBeenCalledWith(TrackEventType.PlayerCurBeatChanged, {
      trackUUID: track.uuid,
      playerUUID: player.uuid,
      beatUUID: firstBeat.uuid,
      nextBeatUUID: secondBeat.uuid,
      startTime: 0.05,
      endTime: 0.55,
      playbackRunId: 1,
    });

    jest.advanceTimersByTime(500);
    expect(emitSpy).toHaveBeenCalledWith(TrackEventType.PlayerCurBeatChanged, {
      trackUUID: track.uuid,
      playerUUID: player.uuid,
      beatUUID: secondBeat.uuid,
      nextBeatUUID: undefined,
      startTime: 0.55,
      endTime: 1.05,
      playbackRunId: 1,
    });

    emitSpy.mockRestore();
  });

  test("orders same-bar cursor beats using normalized tick positions", async () => {
    const { score, track, bar } = createScoreGraph();
    const quarterVoice = bar.ensureVoiceBar(1);
    quarterVoice.replaceBeats([
      createBeat(quarterVoice, NoteDuration.Quarter),
      createBeat(quarterVoice, NoteDuration.Quarter),
      createBeat(quarterVoice, NoteDuration.Quarter),
      createBeat(quarterVoice, NoteDuration.Quarter),
    ]);
    const tupletVoice = bar.insertVoiceBar(2);
    const triplet = { normalCount: 3, tupletCount: 2 };
    tupletVoice.replaceBeats([
      createBeat(tupletVoice, NoteDuration.Half),
      createBeat(tupletVoice, NoteDuration.Quarter, 0, triplet),
      createBeat(tupletVoice, NoteDuration.Quarter, 0, triplet),
      createBeat(tupletVoice, NoteDuration.Quarter, 0, triplet),
    ]);
    const laterTupletBeat = tupletVoice.beats[2];
    const followingQuarterBeat = quarterVoice.beats[3];
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const player = new ScorePlayer(score, track);

    await player.start({ startBeat: quarterVoice.beats[0] });
    jest.advanceTimersByTime(1400);

    expect(emitSpy).toHaveBeenCalledWith(
      TrackEventType.PlayerCurBeatChanged,
      expect.objectContaining({
        beatUUID: laterTupletBeat.uuid,
        nextBeatUUID: followingQuarterBeat.uuid,
      })
    );

    emitSpy.mockRestore();
  });

  test("uses next-bar timing without waiting for its audio batch", async () => {
    const { score, track, bar } = createScoreGraph({
      tempo: 48,
      beatsCount: 1,
      duration: NoteDuration.Whole,
      repeatStatus: BarRepeatStatus.None,
      repeatCount: null,
    });
    score.appendMasterBar({
      tempo: 48,
      beatsCount: 1,
      duration: NoteDuration.Whole,
      repeatStatus: BarRepeatStatus.None,
      repeatCount: null,
    });
    const beat = firstBeatOf(bar);
    const nextBeat = firstBeatOf(track.staves[0].bars[1]);
    setBeatFret(beat, 0);
    setBeatFret(nextBeat, 2);
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const player = new ScorePlayer(score, track);

    await player.start({ startBeat: beat });
    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstNoteOfBeat(beat)),
    ]);
    jest.advanceTimersByTime(50);

    expect(emitSpy).toHaveBeenCalledWith(
      TrackEventType.PlayerCurBeatChanged,
      expect.objectContaining({
        beatUUID: beat.uuid,
        nextBeatUUID: nextBeat.uuid,
        startTime: 0.05,
      })
    );

    emitSpy.mockRestore();
  });

  test("pairs a future batch-edge beat with the next bar attack", async () => {
    const { score, track, staff } = createScoreGraph();
    score.appendMasterBar();
    score.appendMasterBar();
    for (const masterBar of score.masterBars) {
      masterBar.tempo = 96;
    }
    for (const bar of staff.bars) {
      const voiceBar = bar.ensureVoiceBar(1);
      voiceBar.replaceBeats([
        createBeat(voiceBar, NoteDuration.Half),
        createBeat(voiceBar, NoteDuration.Half),
      ]);
    }
    const secondBarVoice = staff.bars[1].getVoiceBar(1);
    const thirdBarVoice = staff.bars[2].getVoiceBar(1);
    if (secondBarVoice === null || thirdBarVoice === null) {
      throw Error("Expected test voice bars");
    }
    const batchEdgeBeat = secondBarVoice.beats[1];
    const nextBarBeat = thirdBarVoice.beats[0];
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const player = new ScorePlayer(score, track);

    await player.start({ startBeat: firstBeatOf(staff.bars[0]) });
    jest.advanceTimersByTime(3900);

    const batchEdgeEvent = emitSpy.mock.calls.find(
      ([eventType, args]) =>
        eventType === TrackEventType.PlayerCurBeatChanged &&
        "beatUUID" in args &&
        args.beatUUID === batchEdgeBeat.uuid
    );
    expect(batchEdgeEvent?.[1]).toEqual(
      expect.objectContaining({ nextBeatUUID: nextBarBeat.uuid })
    );

    emitSpy.mockRestore();
  });

  test("does not interpolate backward across a repeat boundary", async () => {
    const { score, track, bars, masterBars } = createScoreWithBars(2);
    masterBars[0].repeatStatus = BarRepeatStatus.Start;
    masterBars[1].repeatStatus = BarRepeatStatus.End;
    masterBars[1].repeatCount = 2;
    const repeatEndBeat = firstBeatOf(bars[1]);
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const player = new ScorePlayer(score, track);

    await player.start({ startBeat: firstBeatOf(bars[0]) });
    jest.advanceTimersByTime(600);

    const repeatEndEvent = emitSpy.mock.calls.find(
      ([eventType, args]) =>
        eventType === TrackEventType.PlayerCurBeatChanged &&
        "beatUUID" in args &&
        args.beatUUID === repeatEndBeat.uuid
    );
    expect(repeatEndEvent?.[1]).toEqual(
      expect.objectContaining({ nextBeatUUID: undefined })
    );

    emitSpy.mockRestore();
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
      [ElectricGuitarTone.Clean]: {
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

  test("uses separate configured samples for different tones", async () => {
    const { score, track, bar } = createScoreGraph();
    const leadTrack = score.addTrack(
      new Guitar(
        StringInstrumentType.ElectricGuitar,
        ElectricGuitarTone.Overdrive,
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
      [ElectricGuitarTone.Clean]: {
        url: "/samples/clean.wav",
        rootFrequency: noteFrequency,
      },
      [ElectricGuitarTone.Overdrive]: {
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
      [ElectricGuitarTone.Clean]: {
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
    player.toggleLoop();
    await player.start({ startBeat: firstBeatOf(bars[0]) });

    expect(oscillatorFrequencies().slice(0, 8)).toEqual(expectedFrequencies);
  });

  test("partial start in a repeat-start bar does not replay earlier beats", async () => {
    const { score, track, staff } = createScoreGraph();
    score.appendMasterBar();
    const bars = staff.bars;
    score.masterBars[0].repeatStatus = BarRepeatStatus.Start;
    score.masterBars[1].repeatStatus = BarRepeatStatus.End;
    score.masterBars[1].repeatCount = 2;
    const repeatStartVoice = bars[0].ensureVoiceBar(1);
    repeatStartVoice.replaceBeats([
      createBeat(repeatStartVoice, NoteDuration.Quarter),
      createBeat(repeatStartVoice, NoteDuration.Quarter),
      createBeat(repeatStartVoice, NoteDuration.Quarter),
      createBeat(repeatStartVoice, NoteDuration.Quarter),
    ]);
    const repeatEndVoice = bars[1].ensureVoiceBar(1);
    repeatEndVoice.replaceBeats([
      createBeat(repeatEndVoice, NoteDuration.Whole),
    ]);
    repeatStartVoice.beats.forEach((beat, index) => setBeatFret(beat, index));
    setBeatFret(repeatEndVoice.beats[0], 5);
    const player = new ScorePlayer(score, track);

    await player.start({
      startBeat: repeatStartVoice.beats[1],
      loopEndBeat: repeatEndVoice.beats[0],
    });

    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstNoteOfBeat(repeatStartVoice.beats[1])),
      getNoteFrequency(firstNoteOfBeat(repeatStartVoice.beats[2])),
      getNoteFrequency(firstNoteOfBeat(repeatStartVoice.beats[3])),
      getNoteFrequency(firstNoteOfBeat(repeatEndVoice.beats[0])),
    ]);
  });

  test("non-looped playback stops at its configured end beat", async () => {
    const { score, track, bars } = createScoreWithBars(3);
    bars.forEach((bar, index) => setBeatFret(firstBeatOf(bar), index * 2));
    const player = new ScorePlayer(score, track);

    await player.start({
      startBeat: firstBeatOf(bars[0]),
      loopEndBeat: firstBeatOf(bars[1]),
    });

    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstNoteOf(bars[0])),
      getNoteFrequency(firstNoteOf(bars[1])),
    ]);
  });

  test("non-looped playback completes a repeat ending at its boundary", async () => {
    const { score, track, bars, masterBars } = createScoreWithBars(3);
    masterBars[0].repeatStatus = BarRepeatStatus.Start;
    masterBars[1].repeatStatus = BarRepeatStatus.End;
    masterBars[1].repeatCount = 2;
    bars.forEach((bar, index) => setBeatFret(firstBeatOf(bar), index * 2));
    const player = new ScorePlayer(score, track);

    await player.start({
      startBeat: firstBeatOf(bars[0]),
      loopEndBeat: firstBeatOf(bars[1]),
    });

    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstNoteOf(bars[0])),
      getNoteFrequency(firstNoteOf(bars[1])),
      getNoteFrequency(firstNoteOf(bars[0])),
      getNoteFrequency(firstNoteOf(bars[1])),
    ]);
  });

  test("partial repeat-end bar does not trigger its repeat marker", async () => {
    const { score, track, staff } = createScoreGraph();
    score.appendMasterBar();
    score.appendMasterBar();
    const bars = staff.bars;
    score.masterBars[0].repeatStatus = BarRepeatStatus.Start;
    score.masterBars[1].repeatStatus = BarRepeatStatus.End;
    score.masterBars[1].repeatCount = 2;
    const firstVoice = bars[0].ensureVoiceBar(1);
    firstVoice.replaceBeats([createBeat(firstVoice, NoteDuration.Whole)]);
    const repeatEndVoice = bars[1].ensureVoiceBar(1);
    repeatEndVoice.replaceBeats([
      createBeat(repeatEndVoice, NoteDuration.Quarter),
      createBeat(repeatEndVoice, NoteDuration.Quarter),
      createBeat(repeatEndVoice, NoteDuration.Quarter),
      createBeat(repeatEndVoice, NoteDuration.Quarter),
    ]);
    setBeatFret(firstVoice.beats[0], 0);
    setBeatFret(repeatEndVoice.beats[0], 2);
    const player = new ScorePlayer(score, track);

    await player.start({
      startBeat: firstVoice.beats[0],
      loopEndBeat: repeatEndVoice.beats[0],
    });

    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstNoteOfBeat(firstVoice.beats[0])),
      getNoteFrequency(firstNoteOfBeat(repeatEndVoice.beats[0])),
    ]);
  });

  test("selection loop clips notes from longer overlapping voices", async () => {
    const { score, track, bar } = createScoreGraph();
    const selectionVoice = bar.ensureVoiceBar(1);
    selectionVoice.replaceBeats([
      createBeat(selectionVoice, NoteDuration.Quarter),
      createBeat(selectionVoice, NoteDuration.Quarter),
    ]);
    const overlappingVoice = bar.insertVoiceBar(2);
    overlappingVoice.replaceBeats([
      createBeat(overlappingVoice, NoteDuration.Whole),
    ]);
    const sustainedVoice = bar.insertVoiceBar(3);
    sustainedVoice.replaceBeats([
      createBeat(sustainedVoice, NoteDuration.Half),
    ]);
    const selectionStart = selectionVoice.beats[0];
    const selectionEnd = selectionVoice.beats[1];
    const overlappingBeat = overlappingVoice.beats[0];
    const sustainedBeat = sustainedVoice.beats[0];
    setBeatFret(overlappingBeat, 7);
    setBeatFret(sustainedBeat, 9);
    const sustainedNote = firstNoteOfBeat(sustainedBeat);
    sustainedNote.addTechnique(
      new GuitarTechnique(sustainedNote, GuitarTechniqueType.LetRing)
    );
    const overlappingFrequency = getNoteFrequency(
      firstNoteOfBeat(overlappingBeat)
    );
    const sustainedFrequency = getNoteFrequency(sustainedNote);
    const player = new ScorePlayer(score, track);
    player.setLoopSection(selectionStart, selectionEnd);
    player.toggleLoop();

    await player.start({
      startBeat: selectionStart,
      loopEndBeat: selectionEnd,
    });

    const oscillator = createdOscillators.find(
      (candidate) => candidate.frequency.value === overlappingFrequency
    );
    const sustainedOscillator = createdOscillators.find(
      (candidate) => candidate.frequency.value === sustainedFrequency
    );
    expect(oscillator?.stop.mock.calls[0]?.[0]).toBeCloseTo(1.05);
    expect(sustainedOscillator?.stop.mock.calls[0]?.[0]).toBeCloseTo(1.05);
  });

  test("selection loop clips technique tails starting before its end bar", async () => {
    const { score, track, bars } = createScoreWithBars(2);
    const startBeat = firstBeatOf(bars[0]);
    const endBeat = firstBeatOf(bars[1]);
    setBeatFret(startBeat, 0);
    const note = firstNoteOfBeat(startBeat);
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));
    const player = new ScorePlayer(score, track);
    player.setLoopSection(startBeat, endBeat);
    player.toggleLoop();

    await player.start({ startBeat, loopEndBeat: endBeat });

    expect(createdOscillators[0].stop).toHaveBeenCalledWith(1.05);
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
    player.toggleLoop();
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
    player.toggleLoop();
    await player.start({ startBeat: firstBeatOf(bars[0]) });

    expect(oscillatorFrequencies().slice(0, 4)).toEqual(expectedFrequencies);
  });

  test("looped full-score playback schedules another pass", async () => {
    const { score, track, bars } = createScoreWithBars(2);
    setBeatFret(firstBeatOf(bars[0]), 0);
    setBeatFret(firstBeatOf(bars[1]), 2);

    const bar0Note = firstBeatOf(bars[0]).notes?.[0];
    const bar1Note = firstBeatOf(bars[1]).notes?.[0];
    if (bar0Note === undefined || bar1Note === undefined) {
      throw Error("Expected notes in playback test beats");
    }

    const player = new ScorePlayer(score, track);
    player.toggleLoop();
    await player.start({ startBeat: firstBeatOf(bars[0]) });

    expect(oscillatorFrequencies().slice(0, 4)).toEqual([
      getNoteFrequency(bar0Note),
      getNoteFrequency(bar1Note),
      getNoteFrequency(bar0Note),
      getNoteFrequency(bar1Note),
    ]);
  });

  test("enabling loop during playback schedules another pass without restart", async () => {
    const { score, track, bars } = createScoreWithBars(2);
    setBeatFret(firstBeatOf(bars[0]), 0);
    setBeatFret(firstBeatOf(bars[1]), 2);

    const bar0Note = firstBeatOf(bars[0]).notes?.[0];
    const bar1Note = firstBeatOf(bars[1]).notes?.[0];
    if (bar0Note === undefined || bar1Note === undefined) {
      throw Error("Expected notes in playback test beats");
    }

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bars[0]) });
    expect(oscillatorFrequencies()).toHaveLength(2);

    player.toggleLoop();

    expect(oscillatorFrequencies().slice(0, 4)).toEqual([
      getNoteFrequency(bar0Note),
      getNoteFrequency(bar1Note),
      getNoteFrequency(bar0Note),
      getNoteFrequency(bar1Note),
    ]);
  });

  test("disabling loop near the end cancels already scheduled loop notes", async () => {
    const { score, track, bars } = createScoreWithBars(2);
    setBeatFret(firstBeatOf(bars[0]), 0);
    setBeatFret(firstBeatOf(bars[1]), 2);

    const player = new ScorePlayer(score, track);
    player.toggleLoop();
    await player.start({ startBeat: firstBeatOf(bars[0]) });
    expect(oscillatorStarts().slice(0, 3)).toEqual([0.05, 0.55, 1.05]);

    jest.setSystemTime(900);
    player.toggleLoop();

    expect(createdOscillators[2].stop).toHaveBeenLastCalledWith(0.9);
    jest.advanceTimersByTime(200);
    expect(player.isPlaying).toBe(false);
  });

  test("disabling loop preserves scheduled notation repeat passes", async () => {
    const { score, track, bars, masterBars } = createScoreWithBars(2);
    masterBars[0].repeatStatus = BarRepeatStatus.Start;
    masterBars[1].repeatStatus = BarRepeatStatus.End;
    masterBars[1].repeatCount = 2;
    setBeatFret(firstBeatOf(bars[0]), 0);
    setBeatFret(firstBeatOf(bars[1]), 2);
    const player = new ScorePlayer(score, track);
    player.toggleLoop();
    await player.start({ startBeat: firstBeatOf(bars[0]) });
    expect(oscillatorStarts().slice(0, 5)).toEqual([
      0.05, 0.55, 1.05, 1.55, 2.05,
    ]);

    jest.setSystemTime(400);
    player.toggleLoop();

    expect(createdOscillators[2].stop).not.toHaveBeenCalledWith(0.4);
    expect(createdOscillators[4].stop).toHaveBeenCalledWith(0.4);
  });

  test("re-enabled loop restarts notation repeat traversal cleanly", async () => {
    const { score, track, bars, masterBars } = createScoreWithBars(3);
    masterBars[0].repeatStatus = BarRepeatStatus.Start;
    masterBars[1].repeatStatus = BarRepeatStatus.End;
    masterBars[1].repeatCount = 2;
    masterBars[2].beatsCount = 4;
    masterBars[2].duration = NoteDuration.Quarter;
    bars.forEach((bar, index) => setBeatFret(firstBeatOf(bar), index * 2));
    const player = new ScorePlayer(score, track);
    player.toggleLoop();
    await player.start({ startBeat: firstBeatOf(bars[0]) });

    jest.setSystemTime(400);
    player.toggleLoop();
    const oscillatorCount = createdOscillators.length;
    player.toggleLoop();

    const resumedFrequencies = oscillatorFrequencies().slice(oscillatorCount);
    expect(resumedFrequencies.slice(0, 3)).toEqual([
      getNoteFrequency(firstNoteOf(bars[0])),
      getNoteFrequency(firstNoteOf(bars[1])),
      getNoteFrequency(firstNoteOf(bars[0])),
    ]);
  });

  test("re-enabled loop restores its mid-bar start boundary", async () => {
    const { score, track, bar } = createScoreGraph();
    const voiceBar = bar.ensureVoiceBar(1);
    voiceBar.replaceBeats([
      createBeat(voiceBar, NoteDuration.Quarter),
      createBeat(voiceBar, NoteDuration.Quarter),
      createBeat(voiceBar, NoteDuration.Quarter),
      createBeat(voiceBar, NoteDuration.Quarter),
    ]);
    voiceBar.beats.forEach((beat, index) => setBeatFret(beat, index * 2));
    const loopStart = voiceBar.beats[1];
    const loopEnd = voiceBar.beats[2];
    const player = new ScorePlayer(score, track);
    player.setLoopSection(loopStart, loopEnd);
    player.toggleLoop();
    await player.start({ startBeat: loopStart, loopEndBeat: loopEnd });

    jest.setSystemTime(200);
    player.toggleLoop();
    const oscillatorCount = createdOscillators.length;
    player.toggleLoop();

    const resumedFrequencies = oscillatorFrequencies().slice(oscillatorCount);
    expect(resumedFrequencies[0]).toBe(
      getNoteFrequency(firstNoteOfBeat(loopStart))
    );
  });

  test("enabling loop near the end cancels pending natural stop", async () => {
    const { score, track, bars } = createScoreWithBars(2);
    setBeatFret(firstBeatOf(bars[0]), 0);
    setBeatFret(firstBeatOf(bars[1]), 2);

    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bars[0]) });
    expect(oscillatorStarts()).toEqual([0.05, 0.55]);

    jest.setSystemTime(900);
    player.toggleLoop();

    expect(oscillatorStarts().slice(0, 3)).toEqual([0.05, 0.55, 1.05]);
    jest.advanceTimersByTime(200);
    expect(player.isPlaying).toBe(true);
  });

  test("live loop scheduling failure stops playback cleanly", async () => {
    const { score, track, bars } = createScoreWithBars(2);
    setBeatFret(firstBeatOf(bars[0]), 0);
    setBeatFret(firstBeatOf(bars[1]), 2);
    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bars[0]) });
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    MockOscillatorNode.nextStartImpl = () => {
      throw Error("Live loop scheduling failed");
    };

    jest.setSystemTime(900);
    expect(() => player.toggleLoop()).not.toThrow();

    expect(player.isPlaying).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  test("does not start playback when audio context resume throws", async () => {
    const { score, track } = createScoreGraph();
    MockAudioContext.nextResumeImpl = () =>
      Promise.reject(new Error("Audio unlock failed"));
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const emitSpy = jest.spyOn(trackEvent, "emit");

    const player = new ScorePlayer(score, track);
    await player.start();

    expect(player.isPlaying).toBe(false);
    expect(emitSpy).toHaveBeenCalledWith(TrackEventType.PlayerStateChanged, {
      playerUUID: player.uuid,
    });
    expect(consoleErrorSpy).toHaveBeenCalled();

    emitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test("audio context initialization failure leaves playback retryable", async () => {
    const { score, track, bar } = createScoreGraph();
    const beat = firstBeatOf(bar);
    setBeatFret(beat, 4);
    const player = new ScorePlayer(score, track);
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    MockAudioContext.nextConstructorError = Error("Context creation failed");

    await player.start({ startBeat: beat });

    expect(player.isPlaying).toBe(false);
    expect(player.playbackAnchorBeat).toBe(beat);
    expect(emitSpy).toHaveBeenCalledWith(TrackEventType.PlayerStateChanged, {
      playerUUID: player.uuid,
    });

    await player.start();
    expect(player.isPlaying).toBe(true);
    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstNoteOfBeat(beat)),
    ]);

    emitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test("audio scheduler setup failure closes its context and remains retryable", async () => {
    const { score, track, bar } = createScoreGraph();
    score.addTrack(new Guitar(), "Track 2");
    const beat = firstBeatOf(bar);
    setBeatFret(beat, 4);
    const player = new ScorePlayer(score, track);
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    MockAudioContext.nextCreateGainError = Error("Bus creation failed");
    MockAudioContext.createGainErrorAtCall = 2;

    await player.start({ startBeat: beat });

    expect(player.isPlaying).toBe(false);
    expect(createdAudioContexts[0].close).toHaveBeenCalledTimes(1);
    expect(createdGains[0].disconnect).toHaveBeenCalled();
    expect(createdPanners[0].disconnect).toHaveBeenCalled();

    await player.start();
    expect(player.isPlaying).toBe(true);
    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstNoteOfBeat(beat)),
    ]);

    consoleErrorSpy.mockRestore();
  });

  test("scheduling failure stops playback and preserves its retry anchor", async () => {
    const { score, track, bar } = createScoreGraph();
    const beat = firstBeatOf(bar);
    setBeatFret(beat, 4);
    const player = new ScorePlayer(score, track);
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    MockOscillatorNode.nextStartImpl = () => {
      throw Error("Scheduling failed");
    };

    await player.start({ startBeat: beat });

    expect(player.isPlaying).toBe(false);
    expect(player.playbackAnchorBeat).toBe(beat);
    expect(emitSpy).toHaveBeenLastCalledWith(
      TrackEventType.PlayerStateChanged,
      { playerUUID: player.uuid }
    );

    createdOscillators.length = 0;
    await player.start();
    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstNoteOfBeat(beat)),
    ]);

    emitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test("failed source setup disconnects partially scheduled audio", async () => {
    const { score, track, bar } = createScoreGraph();
    const beat = firstBeatOf(bar);
    setBeatFret(beat, 4);
    const player = new ScorePlayer(score, track);
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    MockOscillatorNode.nextStopImpl = () => {
      throw Error("Stop scheduling failed");
    };

    await player.start({ startBeat: beat });

    expect(player.isPlaying).toBe(false);
    expect(createdOscillators[0].disconnect).toHaveBeenCalled();
    expect(createdGains[createdGains.length - 1].disconnect).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  test("rolling scheduling failure stops playback and clears its interval", async () => {
    const { score, track, bar } = createScoreGraph({
      tempo: 48,
      beatsCount: 1,
      duration: NoteDuration.Whole,
      repeatStatus: BarRepeatStatus.None,
      repeatCount: null,
    });
    score.appendMasterBar({
      tempo: 48,
      beatsCount: 1,
      duration: NoteDuration.Whole,
      repeatStatus: BarRepeatStatus.None,
      repeatCount: null,
    });
    const firstBeat = firstBeatOf(bar);
    const secondBeat = firstBeatOf(track.staves[0].bars[1]);
    setBeatFret(firstBeat, 0);
    setBeatFret(secondBeat, 4);
    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeat });
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    MockOscillatorNode.nextStartImpl = () => {
      throw Error("Rolling scheduling failed");
    };

    jest.advanceTimersByTime(100);

    expect(player.isPlaying).toBe(false);
    expect(player.playbackAnchorBeat).toBe(firstBeat);
    expect(emitSpy).toHaveBeenCalledWith(TrackEventType.PlayerStateChanged, {
      playerUUID: player.uuid,
    });
    const oscillatorCount = createdOscillators.length;
    jest.advanceTimersByTime(100);
    expect(createdOscillators).toHaveLength(oscillatorCount);

    emitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test("failed active seek emits stopped playback state", async () => {
    const { score, track, bars } = createScoreWithBars(2);
    setBeatFret(firstBeatOf(bars[1]), 4);
    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bars[0]) });
    const emitSpy = jest.spyOn(trackEvent, "emit");
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    MockAudioContext.nextResumeImpl = () =>
      Promise.reject(new Error("Audio unlock failed"));

    await player.start({ startBeat: firstBeatOf(bars[1]) });

    expect(player.isPlaying).toBe(false);
    expect(player.playbackAnchorBeat).toBe(firstBeatOf(bars[1]));
    expect(emitSpy).toHaveBeenCalledWith(TrackEventType.PlayerStateChanged, {
      playerUUID: player.uuid,
    });

    MockAudioContext.nextResumeImpl = null;
    createdOscillators.length = 0;
    await player.start();
    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstNoteOf(bars[1])),
    ]);

    emitSpy.mockRestore();
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
    expect(player.isPlaying).toBe(true);
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

  test("active playback remains active while a seek restart is pending", async () => {
    const { score, track, bars } = createScoreWithBars(2);
    const player = new ScorePlayer(score, track);
    const firstBeat = firstBeatOf(bars[0]);
    const seekBeat = firstBeatOf(bars[1]);
    await player.start({ startBeat: firstBeat });

    let resolveResume: (() => void) | undefined;
    MockAudioContext.nextResumeImpl = () =>
      new Promise<void>((resolve) => {
        resolveResume = resolve;
      });

    const seekPromise = player.start({ startBeat: seekBeat });

    expect(player.isPlaying).toBe(true);
    expect(player.lastStartedBeat).toBeUndefined();
    expect(player.playbackAnchorBeat).toBe(seekBeat);

    resolveResume?.();
    await seekPromise;
    expect(player.isPlaying).toBe(true);
    expect(player.playbackAnchorBeat).toBe(seekBeat);
  });

  test("loop toggle waits for a pending seek to initialize scheduling", async () => {
    const { score, track, bars } = createScoreWithBars(2);
    const firstBeat = firstBeatOf(bars[0]);
    const seekBeat = firstBeatOf(bars[1]);
    setBeatFret(firstBeat, 0);
    setBeatFret(seekBeat, 4);
    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeat });
    createdOscillators.length = 0;

    let resolveResume: (() => void) | undefined;
    MockAudioContext.nextResumeImpl = () =>
      new Promise<void>((resolve) => {
        resolveResume = resolve;
      });
    const seekPromise = player.start({ startBeat: seekBeat });

    player.toggleLoop();
    expect(createdOscillators).toHaveLength(0);

    resolveResume?.();
    await seekPromise;
    expect(oscillatorFrequencies()[0]).toBe(
      getNoteFrequency(firstNoteOfBeat(seekBeat))
    );
  });

  test("parameterless restart schedules from the resolved playback anchor", async () => {
    const { score, track, bars } = createScoreWithBars(2);
    const firstBeat = firstBeatOf(bars[0]);
    const secondBeat = firstBeatOf(bars[1]);
    setBeatFret(firstBeat, 0);
    setBeatFret(secondBeat, 5);
    const player = new ScorePlayer(score, track);

    await player.start({ startBeat: firstBeat });
    jest.advanceTimersByTime(550);
    expect(player.lastStartedBeat).toBe(secondBeat);

    createdOscillators.length = 0;
    await player.start();

    expect(player.playbackAnchorBeat).toBe(secondBeat);
    expect(oscillatorFrequencies()).toEqual([
      getNoteFrequency(firstNoteOfBeat(secondBeat)),
    ]);
  });

  test("parameterless loop restart begins at the resolved anchor", async () => {
    const { score, track, bars } = createScoreWithBars(3);
    const beats = bars.map(firstBeatOf);
    beats.forEach((beat, index) => setBeatFret(beat, index * 2));
    const player = new ScorePlayer(score, track);
    player.setLoopSection(beats[0], beats[2]);
    player.toggleLoop();
    await player.start({ startBeat: beats[0], loopEndBeat: beats[2] });
    jest.advanceTimersByTime(550);
    expect(player.lastStartedBeat).toBe(beats[1]);

    createdOscillators.length = 0;
    await player.start();

    expect(player.playbackAnchorBeat).toBe(beats[1]);
    expect(oscillatorFrequencies()[0]).toBe(
      getNoteFrequency(firstNoteOfBeat(beats[1]))
    );
  });

  test("explicit start beyond a loop section clears the stale section", async () => {
    const { score, track, bar } = createScoreGraph();
    const voiceBar = bar.ensureVoiceBar(1);
    voiceBar.replaceBeats([
      createBeat(voiceBar, NoteDuration.Quarter),
      createBeat(voiceBar, NoteDuration.Quarter),
      createBeat(voiceBar, NoteDuration.Quarter),
      createBeat(voiceBar, NoteDuration.Quarter),
    ]);
    voiceBar.beats.forEach((beat, index) => setBeatFret(beat, index * 2));
    const player = new ScorePlayer(score, track);
    player.setLoopSection(voiceBar.beats[0], voiceBar.beats[1]);
    player.toggleLoop();

    await player.start({ startBeat: voiceBar.beats[2] });

    expect(oscillatorFrequencies()[0]).toBe(
      getNoteFrequency(firstNoteOfBeat(voiceBar.beats[2]))
    );
  });

  test("selection looping restores loop mode when it enabled it", () => {
    const { score, track, bar } = createScoreGraph();
    const beat = firstBeatOf(bar);
    const player = new ScorePlayer(score, track);

    player.setSelectionLoopSection(beat, beat);
    expect(player.isLooped).toBe(true);

    player.clearSelectionLoopSection();
    expect(player.isLooped).toBe(false);
  });

  test("selection looping preserves an explicit loop choice", () => {
    const { score, track, bar } = createScoreGraph();
    const beat = firstBeatOf(bar);
    const player = new ScorePlayer(score, track);
    player.toggleLoop();

    player.setSelectionLoopSection(beat, beat);
    player.clearSelectionLoopSection();

    expect(player.isLooped).toBe(true);
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

  test("dispose handles audio context close rejection", async () => {
    const { score, track, bar } = createScoreGraph();
    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bar) });
    MockAudioContext.nextCloseImpl = () =>
      Promise.reject(Error("Context close failed"));

    player.dispose();
    await Promise.resolve();

    expect(player.isPlaying).toBe(false);
    expect(createdAudioContexts[0].close).toHaveBeenCalledTimes(1);
  });
});
