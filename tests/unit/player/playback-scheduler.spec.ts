import { PlaybackAudioEngine } from "../../../src/player/playback-audio-engine";
import { PlaybackScheduler } from "../../../src/player/playback-scheduler";
import {
  Beat,
  Guitar,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
  Score,
} from "../../../src/notation/model";
import {
  createBarWithBeats,
  createBeat,
  createScoreGraph,
} from "../model/helpers";

// Only the browser audio boundary is replaced. Traversal, note scheduling, and
// technique shaping run together, with their output recorded on the audio clock.
class AudioParamRecorder {
  public value = 0;
  public ramps: number[][] = [];
  public setValueAtTime(value: number, _time: number): void {
    this.value = value;
  }
  public linearRampToValueAtTime(value: number, time: number): void {
    this.ramps.push([value, time]);
  }
}

class AudioNodeRecorder {
  public gain = new AudioParamRecorder();
  public pan = new AudioParamRecorder();
  public frequency = new AudioParamRecorder();
  public detune = new AudioParamRecorder();
  public starts: number[] = [];
  public stops: number[] = [];
  public readonly connections: AudioNodeRecorder[] = [];
  public readonly isPanner: boolean;
  public constructor(isPanner = false) {
    this.isPanner = isPanner;
  }
  public connect(target: AudioNodeRecorder): void {
    this.connections.push(target);
  }
  public disconnect(): void {}
  public start(time: number): void {
    this.starts.push(time);
  }
  public stop(time: number): void {
    this.stops.push(time);
  }
}

class AudioContextRecorder {
  public currentTime = 0;
  public destination = new AudioNodeRecorder();
  public allSources: AudioNodeRecorder[] = [];
  public get sources(): AudioNodeRecorder[] {
    return this.allSources.filter((source) => !isMetronomeSource(source));
  }
  public get clickSources(): AudioNodeRecorder[] {
    return this.allSources.filter(isMetronomeSource);
  }
  public createGain(): AudioNodeRecorder {
    return new AudioNodeRecorder();
  }
  public createStereoPanner(): AudioNodeRecorder {
    return new AudioNodeRecorder(true);
  }
  public createOscillator(): AudioNodeRecorder {
    const source = new AudioNodeRecorder();
    this.allSources.push(source);
    return source;
  }
}

function pannerCount(
  node: AudioNodeRecorder,
  seen = new Set<AudioNodeRecorder>()
): number {
  if (seen.has(node)) return 0;
  seen.add(node);
  return (
    (node.isPanner ? 1 : 0) +
    node.connections.reduce(
      (count, child) => count + pannerCount(child, seen),
      0
    )
  );
}

function isMetronomeSource(source: AudioNodeRecorder): boolean {
  // Clicks reach only the master panner; notes also pass through their track panner.
  return pannerCount(source) === 1;
}

function createScheduler(score: Score) {
  const engine = new PlaybackAudioEngine(score, {});
  engine.initialize();
  return new PlaybackScheduler(score, engine);
}

function soundNote(beat: Beat, fret = 0): GuitarNote {
  beat.makeBeatWithNotes();
  const note = beat.notes?.[0];
  if (!(note instanceof GuitarNote)) {
    throw Error("Expected guitar note");
  }
  note.setFret(fret);
  return note;
}

describe("PlaybackScheduler", () => {
  let audio: AudioContextRecorder;
  let originalAudioContext: PropertyDescriptor | undefined;

  beforeEach(() => {
    audio = new AudioContextRecorder();
    originalAudioContext = Object.getOwnPropertyDescriptor(
      globalThis,
      "AudioContext"
    );
    Object.defineProperty(globalThis, "AudioContext", {
      configurable: true,
      value: function () {
        return audio;
      },
    });
  });

  afterEach(() => {
    if (originalAudioContext === undefined) {
      Reflect.deleteProperty(globalThis, "AudioContext");
    } else {
      Object.defineProperty(globalThis, "AudioContext", originalAudioContext);
    }
  });

  test("schedules beats from all tracks at the same start time", () => {
    const { score, bar } = createScoreGraph();
    const secondTrack = score.addTrack(new Guitar(), "Second").tracks[0];
    const firstBeat = bar.ensureVoiceBar(1).beats[0];
    const secondBeat = secondTrack.staves[0].bars[0].ensureVoiceBar(1).beats[0];
    soundNote(firstBeat);
    soundNote(secondBeat);
    const scheduler = createScheduler(score);
    scheduler.setScheduleBase(10);

    expect(scheduler.scheduleUntil(1).beatChanges).toEqual([
      { beat: firstBeat, startTime: 10, endTime: 10.5 },
      { beat: secondBeat, startTime: 10, endTime: 10.5 },
    ]);
    expect(audio.sources.map((s) => s.starts)).toEqual([[10], [10]]);
    expect(audio.clickSources).toHaveLength(4);
  });

  test.each([
    {
      beatsCount: 3,
      duration: NoteDuration.Eighth,
      tempo: 60,
      starts: [0, 0.5, 1],
    },
    {
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      tempo: 90,
      starts: [0, 2 / 3, 4 / 3, 2],
    },
  ])(
    "schedules one click per meter pulse",
    ({ beatsCount, duration, tempo, starts }) => {
      const { score } = createScoreGraph();
      const masterBar = score.masterBars[0];
      masterBar.beatsCount = beatsCount;
      masterBar.duration = duration;
      masterBar.tempo = tempo;
      const scheduler = createScheduler(score);

      scheduler.scheduleUntil(2);

      expect(audio.clickSources.map((source) => source.starts[0])).toEqual(
        starts
      );
      expect(
        audio.clickSources.map((source) => source.frequency.value)
      ).toEqual([1760, ...Array.from({ length: beatsCount - 1 }, () => 1320)]);
    }
  );

  test("clips clicks to a mid-bar range without moving the downbeat accent", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const scheduler = createScheduler(score);
    scheduler.setPlaybackRange(beats[1], beats[1]);

    scheduler.scheduleUntil(2);

    expect(audio.clickSources.map((source) => source.starts[0])).toEqual([0]);
    expect(audio.clickSources[0].frequency.value).toBe(1320);
  });

  test.each([
    { start: "the first note", startAtContinuation: false },
    { start: "a tied note", startAtContinuation: true },
  ])(
    "plays one sound for the remaining tie duration when starting at $start",
    ({ startAtContinuation }) => {
      const { score, beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter, dots: 1 },
        { baseDuration: NoteDuration.Eighth },
      ]);
      const notes = beats.map((b) => soundNote(b, 2));
      notes[1].setTechnique(GuitarTechniqueType.Tie);
      notes[2].setTechnique(GuitarTechniqueType.Tie);
      const scheduler = createScheduler(score);
      if (startAtContinuation) {
        scheduler.setPlaybackRange(beats[1]);
      }
      scheduler.setScheduleBase(10);
      scheduler.scheduleUntil(3);

      expect(audio.sources).toHaveLength(1);
      expect(audio.sources[0].starts).toEqual([10]);
      expect(audio.sources[0].stops).toEqual([startAtContinuation ? 11 : 11.5]);
    }
  );

  test("schedules every track, staff, and populated voice but skips overflow beats", () => {
    const { score, track, bar } = createScoreGraph();
    const secondTrack = score.addTrack(new Guitar(), "Second").tracks[0];
    const secondStaff = track.insertStaff(1).staves[0];
    const firstVoiceBeat = bar.ensureVoiceBar(1).beats[0];
    const secondVoice = bar.ensureVoiceBar(2);
    const secondVoiceBeat = createBeat(secondVoice, NoteDuration.Whole);
    const overflowBeat = createBeat(secondVoice, NoteDuration.Quarter);
    secondVoice.beats.splice(
      0,
      secondVoice.beats.length,
      secondVoiceBeat,
      overflowBeat
    );
    secondVoice.rebuildTiming();
    const secondStaffBeat = secondStaff.bars[0].ensureVoiceBar(1).beats[0];
    const secondTrackBeat =
      secondTrack.staves[0].bars[0].ensureVoiceBar(1).beats[0];
    [
      firstVoiceBeat,
      secondVoiceBeat,
      overflowBeat,
      secondStaffBeat,
      secondTrackBeat,
    ].forEach((b) => soundNote(b));
    const scheduler = createScheduler(score);

    expect(scheduler.scheduleUntil(1).beatChanges).toEqual([
      { beat: firstVoiceBeat, startTime: 0, endTime: 0.5 },
      { beat: secondVoiceBeat, startTime: 0, endTime: 2 },
      { beat: secondStaffBeat, startTime: 0, endTime: 0.5 },
      { beat: secondTrackBeat, startTime: 0, endTime: 0.5 },
    ]);
    expect(audio.sources.map((s) => s.starts)).toEqual([[0], [0], [0], [0]]);
  });

  test("uses the current tracks after resetting for a new playback run", () => {
    const { score, track, bar } = createScoreGraph();
    const scheduler = createScheduler(score);
    expect(scheduler.scheduleUntil(1).beatChanges.map((b) => b.beat)).toEqual([
      bar.ensureVoiceBar(1).beats[0],
    ]);

    const addedTrack = score.addTrack(new Guitar(), "Added").tracks[0];
    const addedBeat = addedTrack.staves[0].bars[0].ensureVoiceBar(1).beats[0];
    soundNote(addedBeat);
    score.removeTrack(score.tracks.indexOf(track));
    scheduler.reset();
    scheduler.setPlaybackRange();
    scheduler.setScheduleBase(5);

    expect(scheduler.scheduleUntil(1).beatChanges).toEqual([
      { beat: addedBeat, startTime: 5, endTime: 5.5 },
    ]);
    expect(audio.sources.map((s) => s.starts)).toEqual([[5]]);
  });

  test("previews the next bar after a rest without scheduling its audio early", () => {
    const { score, track, bar } = createScoreGraph();
    const rest = bar.ensureVoiceBar(1).beats[0];
    rest.makeRest();
    score.appendMasterBar();
    const nextBeat = track.staves[0].bars[1].ensureVoiceBar(1).beats[0];
    soundNote(nextBeat);
    const scheduler = createScheduler(score);
    scheduler.setScheduleBase(2);

    expect(scheduler.scheduleUntil(1)).toEqual({
      beatChanges: [{ beat: rest, startTime: 2, endTime: 2.5 }],
      nextBeatChanges: [{ beat: nextBeat, startTime: 4, endTime: 4.5 }],
      playbackComplete: false,
    });
    expect(audio.sources).toHaveLength(0);
    expect(scheduler.scheduleUntil(3).beatChanges).toEqual([
      { beat: nextBeat, startTime: 4, endTime: 4.5 },
    ]);
    expect(audio.sources.map((s) => s.starts)).toEqual([[4]]);
  });

  test("clips a longer voice beat at the selected end in another voice", () => {
    const { score, bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const secondVoice = bar.ensureVoiceBar(2);
    const longBeat = createBeat(secondVoice, NoteDuration.Whole);
    secondVoice.beats.splice(0, secondVoice.beats.length, longBeat);
    secondVoice.rebuildTiming();
    soundNote(longBeat);
    const scheduler = createScheduler(score);
    scheduler.setPlaybackRange(beats[0], beats[1]);
    scheduler.setScheduleBase(3);

    expect(scheduler.scheduleUntil(2)).toEqual({
      beatChanges: [
        { beat: beats[0], startTime: 3, endTime: 3.5 },
        { beat: beats[1], startTime: 3.5, endTime: 4 },
        { beat: longBeat, startTime: 3, endTime: 4 },
      ],
      nextBeatChanges: [],
      playbackComplete: true,
    });
    expect(audio.sources[0].stops).toEqual([4]);
  });

  test("starts at an in-bar beat and clips LetRing tails at range end", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats.forEach((b) => soundNote(b));
    const note = soundNote(beats[2]);
    expect(
      note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing))
    ).toBe(true);
    const scheduler = createScheduler(score);
    scheduler.setPlaybackRange(beats[1], beats[2]);
    scheduler.setScheduleBase(4);

    expect(scheduler.scheduleUntil(2)).toEqual({
      beatChanges: [
        { beat: beats[1], startTime: 4, endTime: 4.5 },
        { beat: beats[2], startTime: 4.5, endTime: 5 },
      ],
      nextBeatChanges: [],
      playbackComplete: true,
    });
    expect(audio.sources.map((s) => s.starts)).toEqual([[4], [4.5]]);
    expect(audio.sources[1].stops).toEqual([5]);
  });

  test("uses dotted beat durations for scheduled timing", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter, dots: 1 },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const scheduler = createScheduler(score);

    // At 120 BPM a dotted quarter lasts 0.75 seconds, then an eighth lasts 0.25.
    expect(scheduler.scheduleUntil(1).beatChanges).toEqual([
      { beat: beats[0], startTime: 0, endTime: 0.75 },
      { beat: beats[1], startTime: 0.75, endTime: 1 },
    ]);
  });

  test.each([
    { endIndex: 0, stopTime: 4.5 },
    { endIndex: 1, stopTime: 5 },
  ])(
    "clips a slide pair at selected beat $endIndex without a separate target source",
    ({ endIndex, stopTime }) => {
      const { score, beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter },
      ]);
      const sourceNote = soundNote(beats[0], 2);
      soundNote(beats[1], 4);
      expect(
        sourceNote.addTechnique(
          new GuitarTechnique(sourceNote, GuitarTechniqueType.Slide)
        )
      ).toBe(true);
      const scheduler = createScheduler(score);
      scheduler.setPlaybackRange(beats[0], beats[endIndex]);
      scheduler.setScheduleBase(4);

      const result = scheduler.scheduleUntil(2);

      expect(result.beatChanges.map((b) => b.beat)).toEqual(
        endIndex === 0 ? [beats[0]] : beats
      );
      expect(result.playbackComplete).toBe(true);
      expect(audio.sources.map((s) => s.starts)).toEqual([[4]]);
      expect(audio.sources[0].stops).toEqual([stopTime]);
      // Standard tuning, string 1: F#4 slides two frets to G#4 at 4.5 seconds.
      const ramps = audio.sources[0].frequency.ramps;
      expect(ramps).toHaveLength(1);
      expect(ramps[0][0]).toBeCloseTo(415.3047, 3);
      expect(ramps[0][1]).toBe(4.5);
    }
  );

  test("preserves silent bar remainders and uses each bar's tempo", () => {
    const { score, track, bar } = createScoreGraph();
    score.appendMasterBar();
    score.masterBars[1].tempo = 60;
    const secondBeat = track.staves[0].bars[1].ensureVoiceBar(1).beats[0];
    const scheduler = createScheduler(score);

    // The first 4/4 bar lasts 2 seconds at 120 BPM; the next quarter lasts 1.
    expect(scheduler.scheduleUntil(3).beatChanges).toEqual([
      { beat: bar.ensureVoiceBar(1).beats[0], startTime: 0, endTime: 0.5 },
      { beat: secondBeat, startTime: 2, endTime: 3 },
    ]);
    expect(audio.clickSources.map((source) => source.starts[0])).toEqual([
      0, 0.5, 1, 1.5, 2, 3, 4, 5,
    ]);
    expect(scheduler.scheduledPlaybackSeconds).toBe(6);
  });

  test("schedules a complete bar once when it exceeds the lookahead window", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats.forEach((b) => soundNote(b));
    const scheduler = createScheduler(score);

    expect(scheduler.scheduleUntil(0.25).beatChanges).toEqual([
      { beat: beats[0], startTime: 0, endTime: 0.5 },
      { beat: beats[1], startTime: 0.5, endTime: 1 },
      { beat: beats[2], startTime: 1, endTime: 1.5 },
      { beat: beats[3], startTime: 1.5, endTime: 2 },
    ]);
    expect(scheduler.scheduledPlaybackSeconds).toBe(2);
    expect(scheduler.scheduleUntil(0.5)).toEqual({
      beatChanges: [],
      nextBeatChanges: [],
      playbackComplete: true,
    });
    expect(audio.sources.map((s) => s.starts)).toEqual([
      [0],
      [0.5],
      [1],
      [1.5],
    ]);
  });

  test("loops the full score with contiguous pass offsets", () => {
    const { score, track, bar } = createScoreGraph();
    score.appendMasterBar();
    const secondBeat = track.staves[0].bars[1].ensureVoiceBar(1).beats[0];
    const firstBeat = bar.ensureVoiceBar(1).beats[0];
    const scheduler = createScheduler(score);
    scheduler.toggleLoop();

    const result = scheduler.scheduleUntil(5);

    expect(result.beatChanges).toEqual([
      { beat: firstBeat, startTime: 0, endTime: 0.5 },
      { beat: secondBeat, startTime: 2, endTime: 2.5 },
      { beat: firstBeat, startTime: 4, endTime: 4.5 },
    ]);
    expect(result.playbackComplete).toBe(false);
    expect(scheduler.nextLoopStartOffsetAfter(0)).toBe(4);
    expect(scheduler.nextLoopStartOffsetAfter(4)).toBeUndefined();
    expect(audio.clickSources.map((source) => source.starts[0])).toEqual([
      0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5,
    ]);
  });

  test("loops only the selected in-bar section", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const scheduler = createScheduler(score);
    scheduler.setSelectionLoopSection(beats[1], beats[2]);
    scheduler.setPlaybackRange();

    const result = scheduler.scheduleUntil(1.1);

    expect(result.beatChanges).toEqual([
      { beat: beats[1], startTime: 0, endTime: 0.5 },
      { beat: beats[2], startTime: 0.5, endTime: 1 },
      { beat: beats[1], startTime: 1, endTime: 1.5 },
      { beat: beats[2], startTime: 1.5, endTime: 2 },
    ]);
    expect(result.playbackComplete).toBe(false);
    expect(scheduler.nextLoopStartOffsetAfter(1)).toBe(2);
    expect(audio.clickSources.map((source) => source.starts[0])).toEqual([
      0, 0.5, 1, 1.5,
    ]);
  });

  test("schedules notation repeats in order after truncation and restart", () => {
    const { score, track, bar } = createScoreGraph();
    score.appendMasterBar();
    score.masterBars[0].isRepeatStart = true;
    score.masterBars[1].isRepeatEnd = true;
    score.masterBars[1].repeatCount = 2;
    const firstBeat = bar.ensureVoiceBar(1).beats[0];
    const secondBeat = track.staves[0].bars[1].ensureVoiceBar(1).beats[0];
    const scheduler = createScheduler(score);

    expect(scheduler.scheduleUntil(8).beatChanges).toEqual([
      { beat: firstBeat, startTime: 0, endTime: 0.5 },
      { beat: secondBeat, startTime: 2, endTime: 2.5 },
      { beat: firstBeat, startTime: 4, endTime: 4.5 },
      { beat: secondBeat, startTime: 6, endTime: 6.5 },
    ]);
    scheduler.truncateAt(1.5);
    scheduler.toggleLoop();

    expect(scheduler.scheduleUntil(6).beatChanges).toEqual([
      { beat: firstBeat, startTime: 1.5, endTime: 2 },
      { beat: secondBeat, startTime: 3.5, endTime: 4 },
      { beat: firstBeat, startTime: 5.5, endTime: 6 },
    ]);
    expect(scheduler.nextLoopStartOffsetAfter(0)).toBe(1.5);
  });
});
