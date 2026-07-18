import { ScorePlayer } from "../../src/player";
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

class MockOscillatorNode {
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

function firstNoteOf<I extends MusicInstrument>(bar: Bar<I>) {
  const note = firstBeatOf(bar).notes?.[0];
  if (note === undefined) {
    throw Error("Expected note in test bar");
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

  test("hammer-on and pull-off playback uses softer attack", async () => {
    const { score, track, bar } = createScoreGraph();
    setBeatFret(firstBeatOf(bar), 0);
    const note = firstNoteOf(bar);
    note.addTechnique(
      new GuitarTechnique(note, GuitarTechniqueType.HammerOnOrPullOff)
    );

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
    expect(player.currentBeat).toBe(voiceBar.beats[1]);

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

  test("active playback remains active while a seek restart is pending", async () => {
    const { score, track, bars } = createScoreWithBars(2);
    const player = new ScorePlayer(score, track);
    await player.start({ startBeat: firstBeatOf(bars[0]) });

    let resolveResume: (() => void) | undefined;
    MockAudioContext.nextResumeImpl = () =>
      new Promise<void>((resolve) => {
        resolveResume = resolve;
      });

    const seekPromise = player.start({ startBeat: firstBeatOf(bars[1]) });

    expect(player.isPlaying).toBe(true);

    resolveResume?.();
    await seekPromise;
    expect(player.isPlaying).toBe(true);
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
