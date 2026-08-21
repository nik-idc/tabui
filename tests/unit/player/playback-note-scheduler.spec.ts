import {
  BendTechniqueOptions,
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
  NoteValue,
  getNoteFrequency,
} from "../../../src/notation/model";
import { PlaybackNoteScheduler } from "../../../src/player/playback-note-scheduler";
import { createBarWithBeats } from "../model/helpers";

type MockParam = {
  value: number;
  setValueAtTime: jest.Mock<void, [number, number]>;
  linearRampToValueAtTime: jest.Mock<void, [number, number]>;
};

function createParam(value = 0): MockParam {
  const param: MockParam = {
    value,
    setValueAtTime: jest.fn((next: number, _time: number) => {
      param.value = next;
    }),
    linearRampToValueAtTime: jest.fn((next: number, _time: number) => {
      param.value = next;
    }),
  };
  return param;
}

function createAudioContext() {
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
    currentTime: 0,
    createOscillator: jest.fn(() => {
      const oscillator = {
        type: "sine" as OscillatorType,
        frequency: createParam(),
        start: jest.fn(),
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

function firstNote(): GuitarNote {
  const { beats } = createBarWithBeats([
    { baseDuration: NoteDuration.Quarter },
  ]);
  beats[0].makeBeatWithNotes();
  const note = beats[0].notes?.[0];
  if (!(note instanceof GuitarNote)) {
    throw Error("Expected note");
  }
  note.fret = 0;
  return note;
}

function scheduler(
  context: AudioContext,
  sample?: AudioBuffer,
  rootFrequency?: number
): PlaybackNoteScheduler {
  return new PlaybackNoteScheduler(context, {
    getSample: jest.fn(() => sample),
    getRootFrequency: jest.fn(() => rootFrequency),
  } as unknown as ConstructorParameters<typeof PlaybackNoteScheduler>[1]);
}

function trackBus() {
  return { gainNode: { connect: jest.fn() } } as unknown as Parameters<
    PlaybackNoteScheduler["scheduleNote"]
  >[3];
}

describe("PlaybackNoteScheduler", () => {
  test("uses an oscillator fallback with a complete envelope", () => {
    const note = firstNote();
    const audio = createAudioContext();

    const scheduled = scheduler(audio.context).scheduleNote(
      note,
      1,
      1.5,
      trackBus()
    );

    expect(scheduled).not.toBeNull();
    expect(audio.oscillators[0].frequency.value).toBe(getNoteFrequency(note));
    expect(audio.oscillators[0].start).toHaveBeenCalledWith(1);
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(1.5);
    expect(audio.gains[0].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      expect.any(Number),
      1.01
    );
    expect(
      audio.gains[0].gain.linearRampToValueAtTime
    ).toHaveBeenLastCalledWith(0, 1.5);
  });

  test("returns no node for an unplayable note", () => {
    const note = firstNote();
    note.setNote(NoteValue.Dead, null);
    const audio = createAudioContext();

    expect(
      scheduler(audio.context).scheduleNote(note, 0, 1, trackBus())
    ).toBeNull();
    expect(audio.context.createOscillator).not.toHaveBeenCalled();
  });

  test("uses a loaded sample at the note playback ratio", () => {
    const note = firstNote();
    const audio = createAudioContext();
    const sample = {} as AudioBuffer;

    scheduler(audio.context, sample, 110).scheduleNote(note, 0, 1, trackBus());

    expect(audio.bufferSources[0].buffer).toBe(sample);
    expect(audio.bufferSources[0].playbackRate.value).toBeCloseTo(
      getNoteFrequency(note) / 110
    );
  });

  test("falls back to an oscillator when a sample has no root frequency", () => {
    const note = firstNote();
    const audio = createAudioContext();
    const sample = {} as AudioBuffer;

    scheduler(audio.context, sample).scheduleNote(note, 1, 2, trackBus());

    expect(audio.oscillators).toHaveLength(1);
  });

  test("applies technique envelope, pitch, and boundary shaping", () => {
    const note = firstNote();
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.PalmMute));
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
    const audio = createAudioContext();

    scheduler(audio.context).scheduleNote(note, 1, 2, trackBus(), 1.1);

    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(1.1);
    expect(audio.gains[0].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0.038,
      1.01
    );
    expect(
      audio.oscillators[0].frequency.linearRampToValueAtTime
    ).toHaveBeenCalledWith(getNoteFrequency(note) * 2 ** (2 / 12), 1.05);
  });

  test("doubles oscillator frequency for a natural harmonic", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats.forEach((beat) => beat.makeBeatWithNotes());
    const note = beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note");
    }
    note.fret = 0;
    note.addTechnique(
      new GuitarTechnique(note, GuitarTechniqueType.NaturalHarmonic)
    );
    const audio = createAudioContext();

    scheduler(audio.context).scheduleNote(note, 0, 0.5, trackBus());

    expect(audio.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      getNoteFrequency(note) * 2,
      0
    );
  });

  test("slides to the same-string target note frequency", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats.forEach((beat) => beat.makeBeatWithNotes());
    const note = beats[0].notes?.[0];
    const target = beats[1].notes?.[0];
    if (!(note instanceof GuitarNote) || !(target instanceof GuitarNote)) {
      throw Error("Expected guitar notes");
    }
    note.fret = 0;
    target.fret = 2;
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.Slide));
    const audio = createAudioContext();
    scheduler(audio.context).scheduleNote(note, 0, 0.5, trackBus());

    expect(
      audio.oscillators[0].frequency.linearRampToValueAtTime
    ).toHaveBeenCalledWith(getNoteFrequency(target), 0.5);
  });

  test("continues Hold and Release bends from the previous terminal pitch", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats.forEach((b) => b.makeBeatWithNotes());
    const [source, continuation] = beats.map((b) => b.notes?.[0]);
    if (
      !(source instanceof GuitarNote) ||
      !(continuation instanceof GuitarNote)
    ) {
      throw Error("Expected guitar notes");
    }
    source.fret = 0;
    continuation.fret = 0;
    source.addTechnique(
      new GuitarTechnique(
        source,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 2,
          bendDuration: 1,
        })
      )
    );
    continuation.addTechnique(
      new GuitarTechnique(continuation, GuitarTechniqueType.LetRing)
    );
    const audio = createAudioContext();

    for (const options of [
      new BendTechniqueOptions({
        type: BendType.Hold,
        holdPitch: 2,
        bendDuration: 1,
      }),
      new BendTechniqueOptions({
        type: BendType.Release,
        releasePitch: 0,
        bendDuration: 1,
      }),
    ]) {
      continuation.techniques.splice(1);
      continuation.addTechnique(
        new GuitarTechnique(continuation, GuitarTechniqueType.Bend, options)
      );
      scheduler(audio.context).scheduleNote(continuation, 1, 2, trackBus());
    }

    const continuedPitch = getNoteFrequency(continuation) * 2 ** (2 / 12);
    expect(audio.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      continuedPitch,
      1
    );
    expect(audio.oscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(
      continuedPitch,
      1
    );
    expect(
      audio.oscillators[1].frequency.linearRampToValueAtTime
    ).toHaveBeenCalledWith(getNoteFrequency(continuation), 2.7);
  });

  test("rejects Hold continuation without a preceding sustained bend", () => {
    const note = firstNote();
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

  test("applies LetRing, Legato, vibrato, repeated-note, and tone profiles", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats.forEach((b) => b.makeBeatWithNotes());
    const [first, second] = beats.map((b) => b.notes?.[0]);
    if (!(first instanceof GuitarNote) || !(second instanceof GuitarNote)) {
      throw Error("Expected guitar notes");
    }
    first.fret = 0;
    second.fret = 0;
    first.addTechnique(new GuitarTechnique(first, GuitarTechniqueType.LetRing));
    first.addTechnique(new GuitarTechnique(first, GuitarTechniqueType.Legato));
    first.addTechnique(new GuitarTechnique(first, GuitarTechniqueType.Vibrato));
    const audio = createAudioContext();

    scheduler(audio.context).scheduleNote(first, 0, 1, trackBus());
    scheduler(audio.context).scheduleNote(second, 1, 2, trackBus());

    expect(audio.oscillators[0].type).toBe("sine");
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(1.7);
    expect(audio.gains[0].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0.048,
      0.018
    );
    expect(
      audio.oscillators[0].frequency.linearRampToValueAtTime
    ).toHaveBeenCalledWith(expect.any(Number), 0.12);
    expect(audio.gains[1].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0.06 * 0.92,
      1.01
    );
  });

  test("cleans up partially scheduled sources on a Web Audio failure", () => {
    const note = firstNote();
    const audio = createAudioContext();
    audio.oscillators.length = 0;
    audio.context.createOscillator = jest.fn(() => ({
      type: "sine",
      frequency: createParam(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(() => {
        throw Error("start failed");
      }),
      stop: jest.fn(),
    })) as unknown as AudioContext["createOscillator"];

    expect(() =>
      scheduler(audio.context).scheduleNote(note, 0, 1, trackBus())
    ).toThrow("start failed");
    expect(audio.gains[0].disconnect).toHaveBeenCalled();
  });
});
