import {
  BendTechniqueOptions,
  BendType,
  ElectricGuitarTone,
  Guitar,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
  NoteValue,
} from "../../../src/notation/model";
import { PlaybackNoteScheduler } from "../../../src/player/playback-note-scheduler";
import { PlaybackSampleManager } from "../../../src/player/playback-sample-manager";
import { createBarWithBeats } from "../model/helpers";
import { createLoopWav } from "./wav-loop-fixture";

type RecordedAudioParam = {
  value: number;
  setValueAtTime: jest.Mock<void, [number, number]>;
  linearRampToValueAtTime: jest.Mock<void, [number, number]>;
};

function createParam(value = 0): RecordedAudioParam {
  return {
    value,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  };
}

function createAudioContext(startError?: Error, currentTime = 0) {
  const oscillators: Array<{
    type: OscillatorType;
    frequency: ReturnType<typeof createParam>;
    start: jest.Mock;
    stop: jest.Mock;
    connect: jest.Mock;
    disconnect: jest.Mock;
  }> = [];
  const gains: Array<{
    gain: ReturnType<typeof createParam>;
    connect: jest.Mock;
    disconnect: jest.Mock;
  }> = [];
  const bufferSources: Array<{
    buffer: AudioBuffer | null;
    loop: boolean;
    loopStart: number;
    loopEnd: number;
    playbackRate: ReturnType<typeof createParam>;
    start: jest.Mock;
    stop: jest.Mock;
    connect: jest.Mock;
    disconnect: jest.Mock;
  }> = [];
  const context = {
    currentTime,
    createOscillator: jest.fn(() => {
      const oscillator = {
        type: "sine" as OscillatorType,
        frequency: createParam(),
        start: jest.fn(() => {
          if (startError !== undefined) throw startError;
        }),
        stop: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
      oscillators.push(oscillator);
      return oscillator;
    }),
    createGain: jest.fn(() => {
      const gain = {
        gain: createParam(),
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
      gains.push(gain);
      return gain;
    }),
    createBufferSource: jest.fn(() => {
      const source = {
        buffer: null,
        loop: false,
        loopStart: 0,
        loopEnd: 0,
        playbackRate: createParam(1),
        start: jest.fn(),
        stop: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
      bufferSources.push(source);
      return source;
    }),
  } as unknown as AudioContext;
  return { context, oscillators, gains, bufferSources };
}

function notesAtFrets(...frets: number[]): GuitarNote[] {
  const { beats } = createBarWithBeats(
    frets.map(() => ({ baseDuration: NoteDuration.Quarter }))
  );
  return beats.map((b, i) => {
    b.makeBeatWithNotes();
    const note = b.notes?.[0];
    if (!(note instanceof GuitarNote)) throw Error("Expected guitar note");
    note.setFret(frets[i]);
    return note;
  });
}

function scheduler(context: AudioContext): PlaybackNoteScheduler {
  return new PlaybackNoteScheduler(
    context,
    new PlaybackSampleManager(context, {})
  );
}

function trackBus() {
  return { gainNode: { connect: jest.fn() } } as unknown as Parameters<
    PlaybackNoteScheduler["scheduleNote"]
  >[3];
}

describe("PlaybackNoteScheduler", () => {
  const originalFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");

  afterEach(() => {
    if (originalFetch === undefined) {
      Reflect.deleteProperty(globalThis, "fetch");
    } else {
      Object.defineProperty(globalThis, "fetch", originalFetch);
    }
  });

  test.each([
    {
      tone: ElectricGuitarTone.Clean,
      waveform: "sine",
      peak: 0.0648,
      attack: 1.01,
      release: 1.48,
    },
    {
      tone: ElectricGuitarTone.Distortion,
      waveform: "sawtooth",
      peak: 0.05832,
      attack: 1.0085,
      release: 1.476,
    },
  ])(
    "uses the $tone oscillator profile with a complete envelope",
    ({ tone, waveform, peak, attack, release }) => {
      // Standard guitar string 1, fret 5 is A4 (440 Hz).
      const [note] = notesAtFrets(5);
      note.beat.voiceBar.bar.staff.track.setInstrument(
        new Guitar(undefined, tone)
      );
      const audio = createAudioContext();
      const bus = trackBus();

      const scheduled = scheduler(audio.context).scheduleNote(
        note,
        1,
        1.5,
        bus
      );

      expect(scheduled).toEqual({
        sourceNode: audio.oscillators[0],
        gainNode: audio.gains[0],
        track: note.beat.voiceBar.bar.staff.track,
        startTime: 1,
      });
      expect(audio.oscillators[0].type).toBe(waveform);
      expect(
        audio.oscillators[0].frequency.setValueAtTime
      ).toHaveBeenCalledWith(440, 1);
      expect(audio.oscillators[0].connect).toHaveBeenCalledWith(audio.gains[0]);
      expect(audio.gains[0].connect).toHaveBeenCalledWith(bus.gainNode);
      expect(audio.oscillators[0].start).toHaveBeenCalledWith(1);
      expect(audio.oscillators[0].stop).toHaveBeenCalledWith(1.5);
      // The clean downbeat is 0.0648; distortion softens it to 0.05832.
      expect(audio.gains[0].gain.setValueAtTime.mock.calls).toEqual([
        [0, 1],
        [expect.closeTo(peak, 8), release],
      ]);
      expect(audio.gains[0].gain.linearRampToValueAtTime.mock.calls).toEqual([
        [expect.closeTo(peak, 8), attack],
        [0, 1.5],
      ]);
    }
  );

  test("returns no node for an unplayable note", () => {
    const [note] = notesAtFrets(5);
    note.setNote(NoteValue.Dead, null);
    const audio = createAudioContext();

    expect(
      scheduler(audio.context).scheduleNote(note, 0, 1, trackBus())
    ).toBeNull();
    expect(audio.context.createOscillator).not.toHaveBeenCalled();
    expect(audio.bufferSources).toHaveLength(0);
    expect(audio.gains).toHaveLength(0);
  });

  test.each([
    {
      name: "plain note",
      harmonic: false,
      ratio: 2,
      peak: 0.0648,
      bendOptions: null,
    },
    {
      name: "natural harmonic",
      harmonic: true,
      ratio: 4,
      peak: 0.045,
      bendOptions: null,
    },
    {
      name: "quarter-tone prebend to Full",
      harmonic: false,
      ratio: 2 * 2 ** (0.5 / 12),
      peak: 0.0648,
      bendOptions: new BendTechniqueOptions({
        type: BendType.PrebendBend,
        prebendPitch: 0.25,
        bendPitch: 1,
        bendDuration: 1,
      }),
    },
    {
      name: "Full prebend to half tone",
      harmonic: false,
      ratio: 2 * 2 ** (2 / 12),
      peak: 0.0648,
      bendOptions: new BendTechniqueOptions({
        type: BendType.PrebendAndRelease,
        prebendPitch: 1,
        releasePitch: 0.5,
        bendDuration: 1,
      }),
    },
  ])(
    "uses a loaded sample at the note playback ratio: $name",
    async ({ harmonic, ratio, peak, bendOptions }) => {
      const [note] = notesAtFrets(5);
      if (harmonic) {
        expect(
          note.addTechnique(
            new GuitarTechnique(note, GuitarTechniqueType.NaturalHarmonic)
          )
        ).toBe(true);
      }
      if (bendOptions !== null) {
        expect(
          note.addTechnique(
            new GuitarTechnique(note, GuitarTechniqueType.Bend, bendOptions)
          )
        ).toBe(true);
      }
      const audio = createAudioContext();
      const sample = {} as AudioBuffer;
      Object.defineProperty(globalThis, "fetch", {
        configurable: true,
        value: jest.fn(async () => ({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(8),
        })),
      });
      audio.context.decodeAudioData = jest.fn(async () => sample);
      const samples = new PlaybackSampleManager(audio.context, {
        [ElectricGuitarTone.Clean]: { url: "/clean.wav", rootFrequency: 220 },
      });
      await samples.loadSamplesForTones([ElectricGuitarTone.Clean]);
      const bus = trackBus();

      new PlaybackNoteScheduler(audio.context, samples).scheduleNote(
        note,
        2,
        3,
        bus
      );

      expect(audio.oscillators).toHaveLength(0);
      expect(audio.bufferSources[0].buffer).toBe(sample);
      // A3 -> A4 is rate 2; each whole tone adds two semitones.
      expect(
        audio.bufferSources[0].playbackRate.setValueAtTime
      ).toHaveBeenCalledWith(expect.closeTo(ratio, 8), 2);
      if (bendOptions !== null) {
        const targetSemitones =
          bendOptions.type === BendType.PrebendBend ? 2 : 1;
        expect(
          audio.bufferSources[0].playbackRate.linearRampToValueAtTime
        ).toHaveBeenCalledWith(
          expect.closeTo(2 * 2 ** (targetSemitones / 12), 8),
          3
        );
      }
      expect(audio.bufferSources[0].connect).toHaveBeenCalledWith(
        audio.gains[0]
      );
      expect(audio.gains[0].connect).toHaveBeenCalledWith(bus.gainNode);
      expect(audio.bufferSources[0].start).toHaveBeenCalledWith(2);
      expect(audio.bufferSources[0].stop).toHaveBeenCalledWith(3);
      expect(audio.gains[0].gain.linearRampToValueAtTime.mock.calls).toEqual([
        [expect.closeTo(peak, 8), 2.01],
        [0, 3],
      ]);
    }
  );

  test("falls back to an oscillator while a configured sample is not loaded", () => {
    const [note] = notesAtFrets(5);
    const audio = createAudioContext();
    const samples = new PlaybackSampleManager(audio.context, {
      [ElectricGuitarTone.Clean]: { url: "/clean.wav", rootFrequency: 220 },
    });

    new PlaybackNoteScheduler(audio.context, samples).scheduleNote(
      note,
      1,
      2,
      trackBus()
    );

    expect(audio.oscillators).toHaveLength(1);
    expect(audio.bufferSources).toHaveLength(0);
    expect(audio.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      440,
      1
    );
    expect(audio.oscillators[0].start).toHaveBeenCalledWith(1);
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(2);
  });

  test("Palm Mute is local to marked attacks and does not mute later notes or other strings", () => {
    const notes = notesAtFrets(5, 7);
    notes[0].setTechnique(GuitarTechniqueType.PalmMute);
    const other = notes[1].beat.notes?.[1] as GuitarNote;
    other.setFret(3);
    const audio = createAudioContext();
    const player = scheduler(audio.context);
    notes.forEach((note, index) =>
      player.scheduleNote(note, index * 0.5, (index + 1) * 0.5, trackBus())
    );
    player.scheduleNote(other, 0.5, 1, trackBus());
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(0.18);
    expect(audio.oscillators[1].stop).toHaveBeenCalledWith(1);
    expect(audio.oscillators[2].stop).toHaveBeenCalledWith(1);
  });

  test.each([
    // The 180 ms palm-mute cap is shortened further by a 100 ms boundary.
    // A half-duration bend reaches B4 at 50 ms or 90 ms after the start.
    { boundary: 1.1, stop: 1.1, bendEnd: 1.05, release: 1.08 },
    { boundary: undefined, stop: 1.18, bendEnd: 1.09, release: 1.16 },
  ])(
    "shapes a palm-muted bend with playback boundary $boundary",
    ({ boundary, stop, bendEnd, release }) => {
      const [note] = notesAtFrets(5);
      note.addTechnique(
        new GuitarTechnique(note, GuitarTechniqueType.PalmMute)
      );
      note.addTechnique(
        new GuitarTechnique(
          note,
          GuitarTechniqueType.Bend,
          new BendTechniqueOptions({
            type: BendType.Bend,
            bendPitch: 1,
            bendDuration: 0.5,
          })
        )
      );
      const audio = createAudioContext();

      scheduler(audio.context).scheduleNote(note, 1, 2, trackBus(), boundary);

      expect(audio.oscillators[0].stop).toHaveBeenCalledWith(stop);
      expect(audio.gains[0].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.038,
        1.01
      );
      expect(
        audio.oscillators[0].frequency.linearRampToValueAtTime
      ).toHaveBeenCalledWith(
        expect.closeTo(493.883301, 5),
        expect.closeTo(bendEnd, 8)
      );
      expect(audio.gains[0].gain.setValueAtTime).toHaveBeenCalledWith(
        0.038,
        expect.closeTo(release, 8)
      );
      expect(
        audio.gains[0].gain.linearRampToValueAtTime
      ).toHaveBeenLastCalledWith(0, stop);
    }
  );

  test("doubles oscillator frequency for a natural harmonic", () => {
    const [note] = notesAtFrets(5);
    note.addTechnique(
      new GuitarTechnique(note, GuitarTechniqueType.NaturalHarmonic)
    );
    const audio = createAudioContext();

    scheduler(audio.context).scheduleNote(note, 0, 0.5, trackBus());

    expect(audio.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      880,
      0
    );
    expect(audio.gains[0].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0.045,
      0.01
    );
  });

  test("slides to the same-string target note frequency", () => {
    const [note] = notesAtFrets(5, 7);
    expect(
      note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.Slide))
    ).toBe(true);
    const audio = createAudioContext();
    scheduler(audio.context).scheduleNote(note, 0, 0.5, trackBus());

    expect(
      audio.oscillators[0].frequency.linearRampToValueAtTime
    ).toHaveBeenCalledWith(expect.closeTo(493.883301, 5), 0.5);
    expect(audio.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      440,
      0.175
    );
    // At 120 BPM the target quarter adds half a second of sustain.
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(1);
  });

  test.each([
    { name: "Hold", type: BendType.Hold },
    { name: "Release", type: BendType.Release },
  ])("continues $name from the previous terminal bend pitch", ({ type }) => {
    const [source, continuation] = notesAtFrets(5, 5);
    source.addTechnique(
      new GuitarTechnique(
        source,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 1,
          bendDuration: 1,
        })
      )
    );
    continuation.addTechnique(
      new GuitarTechnique(continuation, GuitarTechniqueType.Tie)
    );
    const audio = createAudioContext();

    const options = new BendTechniqueOptions({
      type,
      ...(type === BendType.Hold ? { holdPitch: 1 } : { releasePitch: 0 }),
      bendDuration: 1,
    });
    expect(
      continuation.addTechnique(
        new GuitarTechnique(continuation, GuitarTechniqueType.Bend, options)
      )
    ).toBe(true);
    const player = scheduler(audio.context);
    player.scheduleNote(source, 0, 1, trackBus());
    expect(player.scheduleNote(continuation, 1, 1.5, trackBus())).toBeNull();

    expect(audio.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(493.883301, 5),
      1
    );
    if (type === BendType.Release) {
      expect(
        audio.oscillators[0].frequency.linearRampToValueAtTime
      ).toHaveBeenCalledWith(440, 1.5);
    } else {
      expect(
        audio.oscillators[0].frequency.linearRampToValueAtTime
      ).toHaveBeenCalledWith(expect.closeTo(493.883301, 5), 1);
    }
    expect(audio.oscillators).toHaveLength(1);
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(1.5);
  });

  test("rejects Hold continuation without a preceding sustained bend", () => {
    const [note] = notesAtFrets(5);
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));
    note.addTechnique(
      new GuitarTechnique(
        note,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Hold,
          holdPitch: 2,
          bendDuration: 1,
        })
      )
    );

    expect(() =>
      scheduler(createAudioContext().context).scheduleNote(
        note,
        0,
        1,
        trackBus()
      )
    ).toThrow("Hold and Release playback require a previous bend continuation");
  });

  test("ends Let Ring at the next same-string attack and modulates legato vibrato", () => {
    const [first] = notesAtFrets(5, 7);
    first.addTechnique(new GuitarTechnique(first, GuitarTechniqueType.LetRing));
    const addedLegato = first.addTechnique(
      new GuitarTechnique(first, GuitarTechniqueType.Legato)
    );
    first.addTechnique(new GuitarTechnique(first, GuitarTechniqueType.Vibrato));
    const audio = createAudioContext();

    scheduler(audio.context).scheduleNote(first, 0, 0.5, trackBus());

    expect(addedLegato).toBe(true);
    expect(audio.oscillators[0].type).toBe("sine");
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(0.5);
    expect(audio.gains[0].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0.048,
      0.018
    );
    const pitchRamps = audio.oscillators[0].frequency.linearRampToValueAtTime;
    // A4 vibrato at +/-1.8% alternates by 7.92 Hz, then returns to A4.
    expect(pitchRamps.mock.calls[0]).toEqual([expect.closeTo(447.92, 8), 0.12]);
    expect(pitchRamps.mock.calls[1]).toEqual([expect.closeTo(432.08, 8), 0.2]);
    expect(pitchRamps).toHaveBeenLastCalledWith(440, 0.5);
    expect(audio.gains[0].gain.setValueAtTime).toHaveBeenCalledWith(
      0.048,
      0.48
    );
    expect(
      audio.gains[0].gain.linearRampToValueAtTime
    ).toHaveBeenLastCalledWith(0, 0.5);
  });

  test("ties add dotted and tuplet durations to one sound and stop at playback end", () => {
    const [first, second, third] = notesAtFrets(5, 5, 5);
    second.beat.dots = 1;
    third.beat.baseDuration = NoteDuration.Eighth;
    third.beat.tupletSettings = { normalCount: 3, tupletCount: 2 };
    first.beat.voiceBar.rebuildTiming();
    second.setTechnique(GuitarTechniqueType.Tie);
    third.setTechnique(GuitarTechniqueType.Tie);
    const audio = createAudioContext();
    const player = scheduler(audio.context);
    player.scheduleNote(first, 0, 0.5, trackBus(), 1.2);
    expect(player.scheduleNote(second, 0.5, 1, trackBus())).toBeNull();
    expect(player.scheduleNote(third, 1, 1.5, trackBus())).toBeNull();
    expect(audio.oscillators).toHaveLength(1);
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(1.2);
    player.scheduleNote(first, 2, 2.5, trackBus());
    expect(audio.oscillators[1].stop).toHaveBeenCalledWith(2.5 + 0.75 + 1 / 6);
  });

  test.each([0, 1, 2])(
    "Let Ring on tied chain member %i never shortens the written ties",
    (markedIndex) => {
      const notes = notesAtFrets(5, 5, 5, 7, 9);
      notes[1].setTechnique(GuitarTechniqueType.Tie);
      notes[2].setTechnique(GuitarTechniqueType.Tie);
      notes[markedIndex].setTechnique(GuitarTechniqueType.LetRing);
      notes[3].setFret(null);
      notes[4].setFret(null);
      const audio = createAudioContext();
      const player = scheduler(audio.context);

      player.scheduleNote(notes[0], 0, 0.5, trackBus());
      expect(player.scheduleNote(notes[1], 0.5, 1, trackBus())).toBeNull();
      expect(player.scheduleNote(notes[2], 1, 1.5, trackBus())).toBeNull();

      expect(audio.oscillators).toHaveLength(1);
      expect(audio.oscillators[0].stop).toHaveBeenCalledWith(1.5);
    }
  );

  test("starting inside a tie keeps Let Ring from an earlier chain member", () => {
    const [first, middle, final, next] = notesAtFrets(5, 5, 5, 7);
    first.setTechnique(GuitarTechniqueType.LetRing);
    middle.setTechnique(GuitarTechniqueType.Tie);
    final.setTechnique(GuitarTechniqueType.Tie);
    next.setFret(null);
    next.setTechnique(GuitarTechniqueType.LetRing);
    const audio = createAudioContext();

    scheduler(audio.context).scheduleNote(
      middle,
      0,
      0.5,
      trackBus(),
      undefined,
      0
    );

    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(1.5);
  });

  test.each([
    { name: "a half note", tied: false },
    { name: "two tied quarters", tied: true },
  ])(
    "$name with Let Ring uses the actual next-bar beat duration",
    ({ tied }) => {
      const { score, staff, beats, masterBar } = createBarWithBeats(
        tied
          ? [
              { baseDuration: NoteDuration.Quarter },
              { baseDuration: NoteDuration.Quarter },
            ]
          : [{ baseDuration: NoteDuration.Half }]
      );
      masterBar.beatsCount = 2;
      for (const beat of beats) {
        beat.makeBeatWithNotes();
        const note = beat.notes?.[0];
        if (!(note instanceof GuitarNote)) {
          throw Error("Expected guitar note");
        }
        note.setFret(5);
        if (beat !== beats[0]) {
          note.setTechnique(GuitarTechniqueType.Tie);
        }
      }
      const first = beats[0].notes?.[0];
      if (!(first instanceof GuitarNote)) {
        throw Error("Expected guitar note");
      }
      first.setTechnique(GuitarTechniqueType.LetRing);
      const audio = createAudioContext();
      const player = scheduler(audio.context);
      const writtenEnd = tied ? 0.5 : 1;

      // With no following beat, Let Ring cannot extend the written duration.
      player.scheduleNote(first, 0, writtenEnd, trackBus());
      expect(audio.oscillators[0].stop).toHaveBeenCalledWith(1);

      score.appendMasterBar();
      score.masterBars[1].tempo = 60;
      const next = staff.bars[1].getVoiceBar(1)?.beats[0];
      if (next === undefined) {
        throw Error("Expected next-bar beat");
      }
      // A marked empty dotted triplet eighth at 60 BPM lasts half a second.
      next.baseDuration = NoteDuration.Eighth;
      next.dots = 1;
      next.tupletSettings = { normalCount: 3, tupletCount: 2 };
      next.voiceBar.rebuildTiming();
      if (tied) {
        (beats[1].notes?.[0] as GuitarNote).setTechnique(
          GuitarTechniqueType.LetRing
        );
      }
      next.makeBeatWithNotes();
      (next.notes?.[0] as GuitarNote).setTechnique(GuitarTechniqueType.LetRing);
      player.scheduleNote(first, 0, writtenEnd, trackBus());
      expect(audio.oscillators[1].stop).toHaveBeenCalledWith(1.5);

      player.scheduleNote(first, 0, writtenEnd, trackBus(), 1.2);
      expect(audio.oscillators[2].stop).toHaveBeenCalledWith(1.2);
    }
  );

  test.each([
    { sample: "without a saved loop", authored: false },
    { sample: "with a saved loop", authored: true },
  ])("long ties use a sample $sample", async ({ authored }) => {
    const [first, second, third] = notesAtFrets(5, 5, 5);
    second.setTechnique(GuitarTechniqueType.Tie);
    third.setTechnique(GuitarTechniqueType.Tie);
    const audio = createAudioContext();
    // At rate 2 this recording ends after one second, before the tie ends.
    const sample = { duration: 2, sampleRate: 48000 } as AudioBuffer;
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: jest.fn(async () => ({
        ok: true,
        arrayBuffer: async () =>
          authored ? createLoopWav() : new ArrayBuffer(8),
      })),
    });
    audio.context.decodeAudioData = jest.fn(async () => sample);
    const samples = new PlaybackSampleManager(audio.context, {
      [ElectricGuitarTone.Clean]: { url: "/clean.wav", rootFrequency: 220 },
    });
    await samples.loadSamplesForTones([ElectricGuitarTone.Clean]);
    const player = new PlaybackNoteScheduler(audio.context, samples);
    player.scheduleNote(first, 0, 0.5, trackBus());
    expect(player.scheduleNote(second, 0.5, 1, trackBus())).toBeNull();
    expect(player.scheduleNote(third, 1, 1.5, trackBus())).toBeNull();
    expect(audio.bufferSources).toHaveLength(1);
    const source = audio.bufferSources[0];
    expect(source.loop).toBe(authored);
    expect(source.buffer).toBe(sample);
    expect(source.loopStart).toBe(authored ? 0.25 : 0);
    expect(source.loopEnd).toBe(authored ? 0.75 : 0);
    expect(source.start).toHaveBeenCalledTimes(1);
    expect(source.stop).toHaveBeenCalledWith(1.5);
    expect(
      audio.gains[0].gain.linearRampToValueAtTime
    ).toHaveBeenLastCalledWith(0, 1.5);
  });

  test("Let Ring stops at an unmarked empty slot without attacking marked empty slots", () => {
    const [first, next, later, last] = notesAtFrets(5, 7, 8, 9);
    first.setTechnique(GuitarTechniqueType.LetRing);
    next.setFret(null);
    later.setFret(null);
    next.setTechnique(GuitarTechniqueType.LetRing);
    later.setTechnique(GuitarTechniqueType.LetRing);
    // The unmarked last beat ends the passage even though its note is empty.
    last.setFret(null);
    const audio = createAudioContext();
    const player = scheduler(audio.context);
    player.scheduleNote(first, 0, 0.5, trackBus());
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(1.5);
    expect(player.scheduleNote(next, 0.5, 1, trackBus())).toBeNull();
    expect(
      player.scheduleNote(next, 0, 0.5, trackBus(), undefined, 0)
    ).toBeNull();
    expect(audio.oscillators).toHaveLength(1);
  });

  test("other-string markers do not extend a Let Ring passage", () => {
    const [first, next, later] = notesAtFrets(5, 7, 8);
    first.setTechnique(GuitarTechniqueType.LetRing);
    next.setFret(null);
    later.setFret(null);
    for (const note of [next, later]) {
      const other = note.beat.notes?.[1];
      if (!(other instanceof GuitarNote)) {
        throw Error("Expected guitar note");
      }
      other.setFret(3);
      other.setTechnique(GuitarTechniqueType.LetRing);
    }
    const audio = createAudioContext();
    const player = scheduler(audio.context);
    player.scheduleNote(first, 0, 0.5, trackBus());
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(0.5);
    expect(player.scheduleNote(next, 0.5, 1, trackBus())).toBeNull();
    expect(audio.oscillators).toHaveLength(1);
  });

  test("Let Ring resonance stops at an attack in another voice", () => {
    const [first, next] = notesAtFrets(5, 7);
    first.setTechnique(GuitarTechniqueType.LetRing);
    next.setFret(null);
    next.setTechnique(GuitarTechniqueType.LetRing);
    const otherString = next.beat.notes?.[1];
    if (!(otherString instanceof GuitarNote)) {
      throw Error("Expected guitar note");
    }
    otherString.setFret(3);
    otherString.setTechnique(GuitarTechniqueType.LetRing);
    const voice = first.beat.voiceBar.bar.insertVoiceBar(2);
    voice.appendBeats();
    voice.beats[1].makeBeatWithNotes();
    const attack = voice.beats[1].notes?.[0];
    if (!(attack instanceof GuitarNote)) {
      throw Error("Expected guitar note");
    }
    attack.setFret(9);
    voice.rebuildTiming();
    const audio = createAudioContext();
    scheduler(audio.context).scheduleNote(first, 0, 0.5, trackBus());
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(0.5);
  });

  test.each([null, -1])(
    "another voice's rest or dead note affects resonance only for an attack: %s",
    (fret) => {
      const [first, next] = notesAtFrets(5, 7);
      first.setTechnique(GuitarTechniqueType.LetRing);
      next.setFret(null);
      next.setTechnique(GuitarTechniqueType.LetRing);
      const voice = first.beat.voiceBar.bar.insertVoiceBar(2);
      voice.appendBeats();
      if (fret !== null) {
        voice.beats[1].makeBeatWithNotes();
        (voice.beats[1].notes?.[0] as GuitarNote).setFret(fret);
      }
      voice.rebuildTiming();
      const audio = createAudioContext();
      scheduler(audio.context).scheduleNote(first, 0, 0.5, trackBus());
      expect(audio.oscillators[0].stop).toHaveBeenCalledWith(
        fret === null ? 1 : 0.5
      );
    }
  );

  test.each([false, true])(
    "middle-member Let Ring respects another voice's attack: %s",
    (reattack) => {
      const [first, tied, final, next] = notesAtFrets(5, 5, 5, 7);
      tied.setTechnique(GuitarTechniqueType.Tie);
      final.setTechnique(GuitarTechniqueType.Tie);
      tied.setTechnique(GuitarTechniqueType.LetRing);
      final.setTechnique(GuitarTechniqueType.LetRing);
      next.setFret(null);
      next.setTechnique(GuitarTechniqueType.LetRing);
      const otherString = next.beat.notes?.[1];
      if (!(otherString instanceof GuitarNote)) {
        throw Error("Expected guitar note");
      }
      otherString.setFret(3);
      otherString.setTechnique(GuitarTechniqueType.LetRing);

      const voice = first.beat.voiceBar.bar.insertVoiceBar(2);
      voice.appendBeats();
      voice.appendBeats();
      voice.appendBeats();
      voice.beats[3].makeBeatWithNotes();
      const attack = voice.beats[3].notes?.[0];
      if (!(attack instanceof GuitarNote)) {
        throw Error("Expected guitar note");
      }
      attack.setFret(reattack ? 9 : null);
      voice.rebuildTiming();

      const audio = createAudioContext();
      scheduler(audio.context).scheduleNote(first, 0, 0.5, trackBus());

      // Three tied quarters last 1.5 seconds; resonance adds the next half second.
      expect(audio.oscillators[0].stop).toHaveBeenCalledWith(
        reattack ? 1.5 : 2
      );
    }
  );

  test("Let Ring holds the tied chain's terminal bend pitch without slowing the bend", () => {
    const [first, tied, next] = notesAtFrets(5, 5, 7);
    first.setTechnique(GuitarTechniqueType.LetRing);
    tied.setTechnique(GuitarTechniqueType.Tie);
    tied.setTechnique(GuitarTechniqueType.LetRing);
    first.setTechnique(
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1,
        bendDuration: 1,
      })
    );
    next.setFret(null);
    next.setTechnique(GuitarTechniqueType.LetRing);
    const audio = createAudioContext();
    scheduler(audio.context).scheduleNote(first, 0, 0.5, trackBus());
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(1.5);
    expect(
      audio.oscillators[0].frequency.linearRampToValueAtTime
    ).toHaveBeenLastCalledWith(expect.closeTo(493.883301, 5), 0.5);
    expect(
      audio.oscillators[0].frequency.setValueAtTime
    ).toHaveBeenLastCalledWith(expect.closeTo(493.883301, 5), 0.5);
  });

  test.each([
    { fret: 5, peak: 0.0552 },
    { fret: 7, peak: 0.06 },
  ])(
    "softens repeated pitches but preserves changed pitches (target fret $fret)",
    ({ fret, peak }) => {
      const [first, second] = notesAtFrets(5, fret);
      const audio = createAudioContext();

      scheduler(audio.context).scheduleNote(first, 0, 1, trackBus());
      scheduler(audio.context).scheduleNote(second, 1, 2, trackBus());

      expect(audio.gains[1].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        peak,
        1.01
      );
    }
  );

  test("cleans up partially scheduled sources on a Web Audio failure", () => {
    const [note] = notesAtFrets(5);
    const failure = Error("start failed");
    const audio = createAudioContext(failure, 0.25);

    expect(() =>
      scheduler(audio.context).scheduleNote(note, 1, 2, trackBus())
    ).toThrow(failure);
    expect(audio.oscillators[0].start).toHaveBeenCalledWith(1);
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(0.25);
    expect(audio.oscillators[0].disconnect).toHaveBeenCalled();
    expect(audio.gains[0].disconnect).toHaveBeenCalled();
  });
});
