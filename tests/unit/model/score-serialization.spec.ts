import {
  BarRepeatStatus,
  BassGuitarTone,
  Beat,
  BendTechniqueOptions,
  BendType,
  ClefType,
  Guitar,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  MAX_MASTER_BAR_REPEAT_COUNT,
  NoteDuration,
  SCORE_SERIALIZATION_FORMAT,
  SCORE_SERIALIZATION_VERSION,
  Score,
  ScoreSerializationError,
  SerializedBendType,
  SerializedTechniqueType,
  deserializeScore,
  serializeScore,
} from "../../../src/notation/model";
import { createBarWithBeats } from "./helpers";

function deserializeError(value: unknown): ScoreSerializationError {
  try {
    deserializeScore(value);
  } catch (error) {
    if (error instanceof ScoreSerializationError) {
      return error;
    }
  }
  throw Error("Expected score deserialization to fail");
}

function expectDeserializeError(value: unknown, path: string): void {
  expect(deserializeError(value).path).toBe(path);
}

function expectSerializeError(score: Score, path: string): void {
  try {
    serializeScore(score);
  } catch (error) {
    if (error instanceof ScoreSerializationError) {
      expect(error.path).toBe(path);
      return;
    }
  }
  throw Error("Expected score serialization to fail");
}

function firstNote(score: Score): GuitarNote {
  const beat = score.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
  if (beat === undefined) {
    throw Error("Expected default beat");
  }
  beat.makeBeatWithNotes();
  const note = beat.notes?.[0];
  if (!(note instanceof GuitarNote)) {
    throw Error("Expected default guitar note");
  }
  return note;
}

function bendDocument() {
  const score = new Score();
  const note = firstNote(score);
  note.fret = 1;
  note.setTechnique(
    GuitarTechniqueType.Bend,
    new BendTechniqueOptions({
      type: BendType.Bend,
      bendPitch: 1,
      bendDuration: 0.5,
    })
  );
  return serializeScore(score);
}

function bendTechnique(serializedScore: ReturnType<typeof bendDocument>) {
  const technique =
    serializedScore.tracks[0].staves[0].bars[0].voices[0]?.beats[0].notes?.[0]
      ?.techniques[0];
  if (technique?.type !== "bend") {
    throw Error("Expected serialized bend");
  }
  return technique;
}

describe("score serialization", () => {
  test("serializes and restores score state without derived timing fields", () => {
    const score = new Score([], "Name", "Artist", "Song");
    score.masterVolume = 0.7;
    score.masterPan = -0.25;
    score.tracks[0].volume = 0.35;
    score.tracks[0].pan = 0.4;
    score.tracks[0].muted = true;
    score.tracks[0].soloed = true;
    Reflect.set(score.tracks[0].staves[0], "_clefType", ClefType.Bass);
    score.tracks[0].staves[0].showTablature = false;
    score.tracks[0].staves[0].showClassicNotation = true;
    score.masterBars[0].tempo = 144;
    score.masterBars[0].beatsCount = 7;
    score.masterBars[0].duration = NoteDuration.Eighth;
    score.masterBars[0].isRepeatEnd = true;
    score.masterBars[0].repeatCount = 3;
    const beat = score.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
    if (beat === undefined) {
      throw Error("Expected default beat");
    }
    beat.tupletSettings = { normalCount: 3, tupletCount: 2 };

    const serializedScore = serializeScore(score);
    const restored = deserializeScore(
      JSON.parse(JSON.stringify(serializedScore)) as unknown
    );

    expect(serializedScore.format).toBe(SCORE_SERIALIZATION_FORMAT);
    expect(serializedScore.version).toBe(SCORE_SERIALIZATION_VERSION);
    expect(serializedScore.tracks[0].soloed).toBe(true);
    expect(serializedScore.tracks[0].staves[0]).toMatchObject({
      clefType: "Bass",
      showTablature: false,
      showClassicNotation: true,
    });
    expect(
      serializedScore.tracks[0].staves[0].bars[0].voices[0]?.beats[0]
    ).not.toHaveProperty("beamGroupId");
    const restoredTrack = restored.tracks[0];
    const restoredStaff = restoredTrack.staves[0];
    const restoredMasterBar = restored.masterBars[0];
    const restoredBeat = restoredStaff.bars[0].getVoiceBar(1)?.beats[0];

    expect(restored.name).toBe("Name");
    expect(restored.artist).toBe("Artist");
    expect(restored.song).toBe("Song");
    expect(restored.masterVolume).toBe(0.7);
    expect(restored.masterPan).toBe(-0.25);
    expect(restoredTrack.volume).toBe(0.35);
    expect(restoredTrack.pan).toBe(0.4);
    expect(restoredTrack.muted).toBe(true);
    expect(restoredTrack.soloed).toBe(true);
    expect(restoredMasterBar.tempo).toBe(144);
    expect(restoredMasterBar.beatsCount).toBe(7);
    expect(restoredMasterBar.duration).toBe(NoteDuration.Eighth);
    expect(restoredMasterBar.isRepeatEnd).toBe(true);
    expect(restoredMasterBar.repeatCount).toBe(3);
    expect(restoredBeat?.tupletSettings).toEqual({
      normalCount: 3,
      tupletCount: 2,
    });
    expect(restoredStaff.clefType).toBe(ClefType.Bass);
    expect(restoredStaff.showTablature).toBe(false);
    expect(restoredStaff.showClassicNotation).toBe(true);
    expect(serializeScore(restored)).toEqual(serializedScore);
  });

  test("preserves dotted beats through serialization", () => {
    const score = new Score();
    const voice = score.tracks[0].staves[0].bars[0].getVoiceBar(1);
    if (voice === null) {
      throw Error("Expected default voice");
    }
    const first = new Beat(
      voice,
      voice.trackContext,
      [],
      NoteDuration.Eighth,
      1
    );
    const second = new Beat(
      voice,
      voice.trackContext,
      [],
      NoteDuration.Eighth,
      2
    );
    voice.replaceBeats([first, second]);

    const serializedScore = serializeScore(score);
    const serializedBeats =
      serializedScore.tracks[0].staves[0].bars[0].voices[0]?.beats;
    const restored = deserializeScore(serializedScore);
    const restoredBeats =
      restored.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats;

    expect(serializedBeats).toEqual([
      expect.objectContaining({ dots: 1 }),
      expect.objectContaining({ dots: 2 }),
    ]);
    expect(restoredBeats?.map((b) => b.dots)).toEqual([1, 2]);
  });

  test("serializes and restores a bar with both repeat boundaries", () => {
    const score = new Score();
    const masterBar = score.masterBars[0];
    masterBar.isRepeatStart = true;
    masterBar.isRepeatEnd = true;
    masterBar.repeatCount = 3;

    const serialized = serializeScore(score);
    const restored = deserializeScore(
      JSON.parse(JSON.stringify(serialized)) as unknown
    );

    expect(serialized.masterBars[0]).toMatchObject({
      isRepeatStart: true,
      isRepeatEnd: true,
      repeatCount: 3,
    });
    expect(restored.masterBars[0].isRepeatStart).toBe(true);
    expect(restored.masterBars[0].isRepeatEnd).toBe(true);
    expect(restored.masterBars[0].repeatCount).toBe(3);
  });

  test("preserves sparse voices, rests, and sparse note slots", () => {
    const score = new Score();
    const bar = score.tracks[0].staves[0].bars[0];
    bar.removeVoiceBar(1);
    const voice = bar.insertVoiceBar(3);
    const rest = new Beat(voice, voice.trackContext, null);
    const chord = new Beat(voice, voice.trackContext);
    const notes = chord.notes;
    if (notes === null) {
      throw Error("Expected chord notes");
    }
    const first = notes[0];
    const third = notes[2];
    if (!(first instanceof GuitarNote) || !(third instanceof GuitarNote)) {
      throw Error("Expected guitar chord notes");
    }
    first.fret = 3;
    third.fret = 7;
    voice.replaceBeats([rest, chord]);

    const serializedScore = serializeScore(score);
    const restored = deserializeScore(serializedScore);
    const restoredBar = restored.tracks[0].staves[0].bars[0];
    const restoredVoice = restoredBar.getVoiceBar(3);

    expect(serializedScore.tracks[0].staves[0].bars[0].voices).toEqual([
      null,
      null,
      expect.any(Object),
      null,
    ]);
    expect(restoredBar.getVoiceBar(1)).toBeNull();
    expect(restoredVoice?.beats[0].notes).toBeNull();
    expect(
      restoredVoice?.beats[1].notes?.map((n) =>
        n instanceof GuitarNote ? n.fret : undefined
      )
    ).toEqual([3, null, 7, null, null, null]);
  });

  test("does not alias serialized nested values to the source score", () => {
    const score = new Score();
    const beat = score.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
    if (beat === undefined) {
      throw Error("Expected default beat");
    }
    beat.tupletSettings = { normalCount: 3, tupletCount: 2 };
    const serializedScore = serializeScore(score);
    const instrument = score.tracks[0].context.instrument;
    const serializedBeat =
      serializedScore.tracks[0].staves[0].bars[0].voices[0]?.beats[0];
    if (!(instrument instanceof Guitar) || serializedBeat === undefined) {
      throw Error("Expected default guitar beat");
    }
    serializedScore.tracks[0].instrument.tuning[0].octave = 0;
    serializedBeat.tuplet = {
      normalCount: 5,
      tupletCount: 4,
    };

    expect(instrument.tuning[0].octave).not.toBe(0);
    expect(beat.tupletSettings).toEqual({ normalCount: 3, tupletCount: 2 });
  });

  test.each([
    [null, "$"],
    [{ format: "other", version: 1 }, "$.format"],
    [{ format: SCORE_SERIALIZATION_FORMAT, version: 2 }, "$.version"],
  ])("reports malformed roots at %s", (value, path) => {
    expectDeserializeError(value, path);
  });

  test("reports unknown, missing, and nested malformed fields at their paths", () => {
    const unknown = serializeScore(new Score()) as unknown as Record<
      string,
      unknown
    >;
    unknown.formatt = unknown.format;
    expectDeserializeError(unknown, "$.formatt");

    const missing = serializeScore(new Score()) as unknown as Record<
      string,
      unknown
    >;
    Reflect.deleteProperty(missing, "artist");
    expectDeserializeError(missing, "$.artist");

    const nested = bendDocument();
    Reflect.deleteProperty(bendTechnique(nested).options, "bendDuration");
    expectDeserializeError(
      nested,
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0].options.bendDuration"
    );
  });

  test.each(["__proto__", "constructor", "toString"])(
    "rejects prototype values at enum paths: %s",
    (value) => {
      const duration = bendDocument();
      Reflect.set(duration.masterBars[0], "duration", value);
      expectDeserializeError(duration, "$.masterBars[0].duration");

      const bend = bendDocument();
      Reflect.set(bendTechnique(bend).options, "type", value);
      expectDeserializeError(
        bend,
        "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0].options.type"
      );
    }
  );

  test.each([
    [
      "staff bars",
      (d: ReturnType<typeof serializeScore>) =>
        d.tracks[0].staves[0].bars.pop(),
      "$.tracks[0].staves[0].bars",
    ],
    [
      "empty voice",
      (d: ReturnType<typeof serializeScore>) => {
        d.tracks[0].staves[0].bars[0].voices[0] = { beats: [] };
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats",
    ],
    [
      "invalid mix",
      (d: ReturnType<typeof serializeScore>) => {
        d.masterVolume = 2;
      },
      "$.masterVolume",
    ],
    [
      "invalid tone",
      (d: ReturnType<typeof serializeScore>) => {
        Reflect.set(d.tracks[0].instrument, "tone", BassGuitarTone.Clean);
      },
      "$.tracks[0].instrument.tone",
    ],
  ])("rejects malformed %s at its path", (_, mutate, path) => {
    const serializedScore = serializeScore(new Score());
    mutate(serializedScore);
    expectDeserializeError(serializedScore, path);
  });

  test.each([
    [
      "empty master bars",
      (d: ReturnType<typeof serializeScore>) => d.masterBars.splice(0),
      "$.masterBars",
    ],
    [
      "empty tracks",
      (d: ReturnType<typeof serializeScore>) => d.tracks.splice(0),
      "$.tracks",
    ],
    [
      "empty staves",
      (d: ReturnType<typeof serializeScore>) => d.tracks[0].staves.splice(0),
      "$.tracks[0].staves",
    ],
    [
      "wrong voice count",
      (d: ReturnType<typeof serializeScore>) =>
        Reflect.set(d.tracks[0].staves[0].bars[0], "voices", [null]),
      "$.tracks[0].staves[0].bars[0].voices",
    ],
    [
      "all-null voices",
      (d: ReturnType<typeof serializeScore>) =>
        Reflect.set(d.tracks[0].staves[0].bars[0], "voices", [
          null,
          null,
          null,
          null,
        ]),
      "$.tracks[0].staves[0].bars[0].voices",
    ],
    [
      "wrong note slot count",
      (d: ReturnType<typeof serializeScore>) => {
        const beat = d.tracks[0].staves[0].bars[0].voices[0]?.beats[0];
        if (beat !== undefined) {
          beat.notes = [];
        }
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes",
    ],
    [
      "technique on an empty note",
      (d: ReturnType<typeof serializeScore>) => {
        const beat = d.tracks[0].staves[0].bars[0].voices[0]?.beats[0];
        if (beat === undefined) {
          throw Error("Expected serialized beat");
        }
        Reflect.set(beat, "notes", [
          { fret: null, techniques: [{ type: "vibrato" }] },
          null,
          null,
          null,
          null,
          null,
        ]);
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].fret",
    ],
    [
      "dots",
      (d: ReturnType<typeof serializeScore>) => {
        const beat = d.tracks[0].staves[0].bars[0].voices[0]?.beats[0];
        if (beat !== undefined) {
          Reflect.set(beat, "dots", 3);
        }
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].dots",
    ],
    [
      "tuplet",
      (d: ReturnType<typeof serializeScore>) => {
        const beat = d.tracks[0].staves[0].bars[0].voices[0]?.beats[0];
        if (beat !== undefined) {
          beat.tuplet = { normalCount: 0, tupletCount: 2 };
        }
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].tuplet.normalCount",
    ],
    [
      "repeat consistency",
      (d: ReturnType<typeof serializeScore>) => {
        Reflect.set(d.masterBars[0], "repeatCount", 2);
      },
      "$.masterBars[0].repeatCount",
    ],
    [
      "repeat end count",
      (d: ReturnType<typeof serializeScore>) => {
        Reflect.set(d.masterBars[0], "isRepeatEnd", true);
        Reflect.set(d.masterBars[0], "repeatCount", null);
      },
      "$.masterBars[0].repeatCount",
    ],
    [
      "repeat end maximum",
      (d: ReturnType<typeof serializeScore>) => {
        Reflect.set(d.masterBars[0], "isRepeatEnd", true);
        Reflect.set(
          d.masterBars[0],
          "repeatCount",
          MAX_MASTER_BAR_REPEAT_COUNT + 1
        );
      },
      "$.masterBars[0].repeatCount",
    ],
    [
      "tuning count",
      (d: ReturnType<typeof serializeScore>) => {
        d.tracks[0].instrument.tuning.pop();
      },
      "$.tracks[0].instrument.stringsCount",
    ],
    [
      "tone program",
      (d: ReturnType<typeof serializeScore>) => {
        d.tracks[0].instrument.program++;
      },
      "$.tracks[0].instrument.program",
    ],
    [
      "nested unknown key",
      (d: ReturnType<typeof serializeScore>) =>
        Reflect.set(bendTechnique(d).options, "extra", true),
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0].options.extra",
    ],
  ])("rejects invariant %s at its exact path", (_, mutate, path) => {
    const serializedScore = path.includes("options")
      ? bendDocument()
      : serializeScore(new Score());
    mutate(serializedScore);
    expectDeserializeError(serializedScore, path);
  });

  test("wraps model construction failures with the offending input path and cause", () => {
    const serializedScore = serializeScore(new Score());
    serializedScore.tracks[0].instrument.tuning[0].octave = 9;
    const beat =
      serializedScore.tracks[0].staves[0].bars[0].voices[0]?.beats[0];
    if (beat === undefined) {
      throw Error("Expected default beat");
    }
    beat.notes = [{ fret: 24, techniques: [] }, null, null, null, null, null];

    const error = deserializeError(serializedScore);
    expect(error.path).toBe(
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].fret"
    );
    expect(error.cause).toBeInstanceOf(Error);
  });

  test("validates continuation bends after it attaches reconstructed beats", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const first = beats[0].notes?.[0];
    const second = beats[1].notes?.[0];
    if (!(first instanceof GuitarNote) || !(second instanceof GuitarNote)) {
      throw Error("Expected guitar notes");
    }
    first.fret = 5;
    second.fret = 5;
    first.setTechnique(
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 2,
        bendDuration: 0.5,
      })
    );
    second.setTechnique(GuitarTechniqueType.LetRing);
    const serializedScore = serializeScore(score);
    const techniques =
      serializedScore.tracks[0].staves[0].bars[0].voices[0]?.beats[1].notes?.[0]
        ?.techniques;
    if (techniques === undefined) {
      throw Error("Expected second techniques");
    }
    techniques.push({
      type: SerializedTechniqueType.Bend,
      options: {
        type: SerializedBendType.Bend,
        bendPitch: 1,
        bendDuration: 0.5,
      },
    });

    expectDeserializeError(
      serializedScore,
      "$.tracks[0].staves[0].bars[0].voices[0].beats[1].notes[0].techniques[1]"
    );
  });

  test.each([
    [
      "empty voice",
      (s: Score) =>
        s.tracks[0].staves[0].bars[0].getVoiceBar(1)?.replaceBeats([]),
      "$.tracks[0].staves[0].bars[0].voices[0].beats",
    ],
    [
      "fractional repeat",
      (s: Score) => {
        s.masterBars[0].isRepeatEnd = true;
        Reflect.set(s.masterBars[0], "_repeatCount", 2.5);
      },
      "$.masterBars[0].repeatCount",
    ],
    [
      "invalid tuplet",
      (s: Score) => {
        const b = s.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
        if (b !== undefined) {
          b.tupletSettings = { normalCount: 3, tupletCount: 2 };
          Reflect.set(b.tupletSettings, "normalCount", 0);
        }
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].tuplet.normalCount",
    ],
    [
      "unsafe repeat integer",
      (s: Score) => {
        s.masterBars[0].isRepeatEnd = true;
        Reflect.set(
          s.masterBars[0],
          "_repeatCount",
          Number.MAX_SAFE_INTEGER + 1
        );
      },
      "$.masterBars[0].repeatCount",
    ],
    [
      "repeat above maximum",
      (s: Score) => {
        s.masterBars[0].isRepeatEnd = true;
        Reflect.set(
          s.masterBars[0],
          "_repeatCount",
          MAX_MASTER_BAR_REPEAT_COUNT + 1
        );
      },
      "$.masterBars[0].repeatCount",
    ],
    [
      "unsafe tuplet normalCount",
      (s: Score) => {
        const b = s.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
        if (b !== undefined) {
          b.tupletSettings = { normalCount: 3, tupletCount: 2 };
          Reflect.set(
            b.tupletSettings,
            "normalCount",
            Number.MAX_SAFE_INTEGER + 1
          );
        }
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].tuplet.normalCount",
    ],
    [
      "unsafe tuplet tupletCount",
      (s: Score) => {
        const b = s.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
        if (b !== undefined) {
          b.tupletSettings = { normalCount: 3, tupletCount: 2 };
          Reflect.set(
            b.tupletSettings,
            "tupletCount",
            Number.MAX_SAFE_INTEGER + 1
          );
        }
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].tuplet.tupletCount",
    ],
    [
      "wrong string slot",
      (s: Score) => {
        const beat = s.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
        if (beat === undefined) {
          throw Error("Expected default guitar beat notes");
        }
        beat.makeBeatWithNotes();
        if (beat.notes === null) {
          throw Error("Expected default guitar beat notes");
        }
        beat.notes[0] = beat.notes[1];
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0]",
    ],
    [
      "malformed technique entry",
      (s: Score) => {
        const n = firstNote(s);
        n.fret = 1;
        Reflect.apply(Array.prototype.push, n.techniques, [null]);
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0]",
    ],
    [
      "incompatible technique entry",
      (s: Score) => {
        const n = firstNote(s);
        n.fret = 1;
        n.techniques.push(
          new GuitarTechnique(n, GuitarTechniqueType.LetRing),
          new GuitarTechnique(n, GuitarTechniqueType.PalmMute)
        );
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[1]",
    ],
    [
      "unexpected technique options",
      (s: Score) => {
        const n = firstNote(s);
        n.fret = 1;
        const technique = new GuitarTechnique(n, GuitarTechniqueType.Vibrato);
        Reflect.set(
          technique,
          "_bendOptions",
          new BendTechniqueOptions({
            type: BendType.Bend,
            bendPitch: 1,
            bendDuration: 0.5,
          })
        );
        n.techniques.push(technique);
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0].options",
    ],
    [
      "duplicate technique",
      (s: Score) => {
        const n = firstNote(s);
        n.fret = 1;
        n.techniques.push(
          new GuitarTechnique(n, GuitarTechniqueType.Vibrato),
          new GuitarTechnique(n, GuitarTechniqueType.Vibrato)
        );
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[1]",
    ],
  ])("rejects invalid runtime %s at its path", (_, corrupt, path) => {
    const score = new Score();
    corrupt(score);
    expectSerializeError(score, path);
  });

  test.each([
    [
      "track",
      (s: Score, f: Score) => {
        s.tracks[0] = f.tracks[0];
      },
      "$.tracks[0]",
    ],
    [
      "staff",
      (s: Score, f: Score) => {
        s.tracks[0].staves[0] = f.tracks[0].staves[0];
      },
      "$.tracks[0].staves[0]",
    ],
    [
      "bar",
      (s: Score, f: Score) => {
        s.tracks[0].staves[0].bars[0] = f.tracks[0].staves[0].bars[0];
      },
      "$.tracks[0].staves[0].bars[0]",
    ],
    [
      "voice",
      (s: Score, f: Score) => {
        s.tracks[0].staves[0].bars[0].voiceBars[1] =
          f.tracks[0].staves[0].bars[0].getVoiceBar(1);
      },
      "$.tracks[0].staves[0].bars[0].voices[0]",
    ],
    [
      "beat",
      (s: Score, f: Score) => {
        const v = s.tracks[0].staves[0].bars[0].getVoiceBar(1);
        const foreign = f.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
        if (v !== null && foreign !== undefined) {
          v.beats[0] = foreign;
        }
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0]",
    ],
    [
      "note",
      (s: Score, f: Score) => {
        const notes = firstNote(s).beat.notes;
        if (notes !== null) {
          notes[0] = firstNote(f);
        }
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0]",
    ],
    [
      "technique",
      (s: Score, f: Score) => {
        const note = firstNote(s);
        const foreign = firstNote(f);
        note.fret = 1;
        foreign.fret = 1;
        note.techniques.push(
          new GuitarTechnique(foreign, GuitarTechniqueType.Vibrato)
        );
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0]",
    ],
  ])("rejects foreign %s ownership", (_, corrupt, path) => {
    const score = new Score();
    corrupt(score, new Score());
    expectSerializeError(score, path);
  });

  test.each([
    [
      "track",
      (s: Score) => Reflect.deleteProperty(s.tracks, "0"),
      "$.tracks[0]",
    ],
    [
      "tuning",
      (s: Score) => {
        const instrument = s.tracks[0].context.instrument;
        if (instrument instanceof Guitar) {
          const sparse = new Guitar(
            instrument.type,
            instrument.tone,
            instrument.name,
            instrument.stringsCount,
            instrument.tuning.map((n) => ({ ...n })),
            instrument.fretsCount
          );
          s.tracks[0].setInstrument(sparse);
          Reflect.deleteProperty(sparse.tuning, "0");
        }
      },
      "$.tracks[0].instrument.tuning[0]",
    ],
    [
      "mix",
      (s: Score) => Reflect.set(s.tracks[0], "muted", "yes"),
      "$.tracks[0].muted",
    ],
  ])(
    "rejects sparse or invalid runtime %s arrays and fields",
    (_, corrupt, path) => {
      const score = new Score();
      corrupt(score);
      expectSerializeError(score, path);
    }
  );
});
