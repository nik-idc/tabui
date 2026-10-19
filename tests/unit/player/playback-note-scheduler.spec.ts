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
    note.fret = frets[i];
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
      new GuitarTechnique(continuation, GuitarTechniqueType.LetRing)
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
    scheduler(audio.context).scheduleNote(continuation, 1, 2, trackBus());

    expect(audio.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(493.883301, 5),
      1
    );
    if (type === BendType.Release) {
      expect(
        audio.oscillators[0].frequency.linearRampToValueAtTime
      ).toHaveBeenCalledWith(440, 2.7);
    } else {
      expect(
        audio.oscillators[0].frequency.linearRampToValueAtTime
      ).not.toHaveBeenCalled();
    }
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(2.7);
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

  test("extends a legato note with LetRing and modulates vibrato above and below its pitch", () => {
    const [first] = notesAtFrets(5, 7);
    first.addTechnique(new GuitarTechnique(first, GuitarTechniqueType.LetRing));
    const addedLegato = first.addTechnique(
      new GuitarTechnique(first, GuitarTechniqueType.Legato)
    );
    first.addTechnique(new GuitarTechnique(first, GuitarTechniqueType.Vibrato));
    const audio = createAudioContext();

    scheduler(audio.context).scheduleNote(first, 0, 1, trackBus());

    expect(addedLegato).toBe(true);
    expect(audio.oscillators[0].type).toBe("sine");
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(1.7);
    expect(audio.gains[0].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0.048,
      0.018
    );
    const pitchRamps = audio.oscillators[0].frequency.linearRampToValueAtTime;
    // A4 vibrato at +/-1.8% alternates by 7.92 Hz, then returns to A4.
    expect(pitchRamps.mock.calls[0]).toEqual([expect.closeTo(447.92, 8), 0.12]);
    expect(pitchRamps.mock.calls[1]).toEqual([expect.closeTo(432.08, 8), 0.2]);
    expect(pitchRamps).toHaveBeenLastCalledWith(440, 1.7);
    expect(audio.gains[0].gain.setValueAtTime).toHaveBeenCalledWith(
      0.048,
      1.68
    );
    expect(
      audio.gains[0].gain.linearRampToValueAtTime
    ).toHaveBeenLastCalledWith(0, 1.7);
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
