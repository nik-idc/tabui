import {
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
import { Staff } from "../../../src/notation/model/staff";
import { createBarWithBeats } from "./helpers";
import { required } from "../required";

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
  test("saves and loads Tie separately from Let Ring and rejects a mismatched tied fret", () => {
    const { beats, score } = createBarWithBeats(
      Array.from({ length: 3 }, () => ({ baseDuration: NoteDuration.Quarter }))
    );
    const notes = beats.map((b) => required(b.notes)[0] as GuitarNote);
    notes[0].fret = 5;
    notes[1].fret = 5;
    notes[1].setTechnique(GuitarTechniqueType.Tie);
    notes[2].fret = 9;
    notes[2].setTechnique(GuitarTechniqueType.LetRing);
    const document = serializeScore(score);
    const savedNote = required(
      document.tracks[0].staves[0].bars[0].voices[0]?.beats[1].notes?.[0]
    );
    expect(savedNote.techniques).toEqual([{ type: "tie" }]);
    expect(serializeScore(deserializeScore(document))).toEqual(document);
    savedNote.fret = 6;
    expect(() => deserializeScore(document)).toThrow();
  });

  test("round trips per-slot Let Ring and rejects orphan empty markers", () => {
    const { score, beats } = createBarWithBeats(
      Array.from({ length: 3 }, () => ({ baseDuration: NoteDuration.Quarter }))
    );
    const notes = beats.map((b) => required(b.notes)[0] as GuitarNote);
    notes[0].fret = 5;
    notes.forEach((n) => n.setTechnique(GuitarTechniqueType.LetRing));
    const document = serializeScore(score);
    const restored = deserializeScore(document);
    const restoredBeats = required(
      restored.tracks[0].staves[0].bars[0].getVoiceBar(1)
    ).beats;
    expect(
      restoredBeats.map((b) => (required(b.notes)[0] as GuitarNote).fret)
    ).toEqual([5, null, null]);
    expect(
      restoredBeats.map((b) => b.hasTechnique(GuitarTechniqueType.LetRing))
    ).toEqual([true, true, true]);
    const savedVoice = required(document.tracks[0].staves[0].bars[0].voices[0]);
    required(required(savedVoice.beats[0].notes)[0]).techniques = [];
    expect(() => deserializeScore(document)).toThrow(ScoreSerializationError);
  });

  test("serializes and restores score state without derived timing fields", () => {
    const score = new Score([], "Name", "Artist", "Song");
    score.masterVolume = 0.7;
    score.masterPan = -0.25;
    score.tracks[0].volume = 0.35;
    score.tracks[0].pan = 0.4;
    score.tracks[0].muted = true;
    score.tracks[0].soloed = true;
    const track = score.tracks[0];
    track.insertStaff(1, new Staff(track, track.context, [], ClefType.Bass));
    track.removeStaff(0);
    score.tracks[0].staves[0].showTablature = false;
    score.tracks[0].staves[0].showClassicNotation = true;
    score.masterBars[0].tempo = 144;
    score.masterBars[0].beatsCount = 7;
    score.masterBars[0].duration = NoteDuration.Eighth;
    score.masterBars[0].isRepeatStart = true;
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
    expect(serializedScore).toMatchObject({
      name: "Name",
      artist: "Artist",
      song: "Song",
      masterVolume: 0.7,
      masterPan: -0.25,
      masterBars: [
        {
          tempo: 144,
          beatsCount: 7,
          duration: "eighth",
          isRepeatStart: true,
          isRepeatEnd: true,
          repeatCount: 3,
        },
      ],
      tracks: [{ volume: 0.35, pan: 0.4, muted: true, soloed: true }],
    });
    expect(serializedScore.tracks[0].staves[0]).toMatchObject({
      clefType: "Bass",
      showTablature: false,
      showClassicNotation: true,
    });
    expect(
      serializedScore.tracks[0].staves[0].bars[0].voices[0]?.beats[0]
    ).toEqual({
      duration: "quarter",
      dots: 0,
      tuplet: { normalCount: 3, tupletCount: 2 },
      notes: null,
    });
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
    expect(restoredMasterBar.isRepeatStart).toBe(true);
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
      {
        duration: "eighth",
        dots: 1,
        tuplet: null,
        notes: [null, null, null, null, null, null],
      },
      {
        duration: "eighth",
        dots: 2,
        tuplet: null,
        notes: [null, null, null, null, null, null],
      },
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
    const voice = bar.insertVoiceBar(3);
    bar.removeVoiceBar(1);
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
    const emptyNotes = new Beat(voice, voice.trackContext);
    voice.replaceBeats([rest, chord, emptyNotes]);

    const serializedScore = serializeScore(score);
    const restored = deserializeScore(serializedScore);
    const restoredBar = restored.tracks[0].staves[0].bars[0];
    const restoredVoice = restoredBar.getVoiceBar(3);

    expect(serializedScore.tracks[0].staves[0].bars[0].voices).toEqual([
      null,
      null,
      {
        beats: [
          expect.objectContaining({ notes: null }),
          expect.objectContaining({
            notes: [
              { fret: 3, techniques: [] },
              null,
              { fret: 7, techniques: [] },
              null,
              null,
              null,
            ],
          }),
          expect.objectContaining({
            notes: [null, null, null, null, null, null],
          }),
        ],
      },
      null,
    ]);
    expect(restoredBar.getVoiceBar(1)).toBeNull();
    expect(restoredBar.getVoiceBar(2)).toBeNull();
    expect(restoredBar.getVoiceBar(4)).toBeNull();
    expect(restoredVoice?.isEmpty()).toBe(false);
    expect(restoredVoice?.beats[0].notes).toBeNull();
    expect(
      restoredVoice?.beats[1].notes?.map((n) =>
        n instanceof GuitarNote ? n.fret : undefined
      )
    ).toEqual([3, null, 7, null, null, null]);
    expect(restoredVoice?.beats[2].notes).toHaveLength(6);
    expect(
      restoredVoice?.beats[2].notes?.map((n) =>
        n instanceof GuitarNote ? n.fret : undefined
      )
    ).toEqual([null, null, null, null, null, null]);
  });

  test("does not alias serialized nested values to the source score", () => {
    const score = new Score();
    const beat = score.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
    if (beat === undefined) {
      throw Error("Expected default beat");
    }
    beat.tupletSettings = { normalCount: 3, tupletCount: 2 };
    const note = firstNote(score);
    note.fret = 5;
    note.setTechnique(
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1,
        bendDuration: 0.5,
      })
    );
    const serializedScore = serializeScore(score);
    const restored = deserializeScore(serializedScore);
    const instrument = score.tracks[0].context.instrument;
    const serializedBeat =
      serializedScore.tracks[0].staves[0].bars[0].voices[0]?.beats[0];
    if (!(instrument instanceof Guitar) || serializedBeat === undefined) {
      throw Error("Expected default guitar beat");
    }
    serializedScore.tracks[0].instrument.tuning[0].octave = 0;
    if (serializedBeat.tuplet === null) {
      throw Error("Expected serialized tuplet");
    }
    serializedBeat.tuplet.normalCount = 5;
    const serializedNote = serializedBeat.notes?.[0];
    if (serializedNote == null) {
      throw Error("Expected serialized note");
    }
    serializedNote.fret = 9;
    const serializedBend = bendTechnique(serializedScore);
    if (serializedBend.options.type !== "bend") {
      throw Error("Expected simple serialized bend");
    }
    serializedBend.options.bendPitch = 2;

    expect(instrument.tuning[0].octave).toBe(4);
    expect(beat.tupletSettings).toEqual({ normalCount: 3, tupletCount: 2 });
    expect(note.fret).toBe(5);
    expect(note.techniques[0].bendOptions?.bendPitch).toBe(1);
    const restoredBeat =
      restored.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
    expect(restoredBeat?.tupletSettings).toEqual({
      normalCount: 3,
      tupletCount: 2,
    });
    const restoredInstrument = restored.tracks[0].context.instrument;
    if (!(restoredInstrument instanceof Guitar)) {
      throw Error("Expected restored guitar");
    }
    expect(restoredInstrument.tuning[0].octave).toBe(4);
    expect(restoredBeat?.notes?.[0]).toMatchObject({ fret: 5 });
    expect(restoredBeat?.notes?.[0]?.techniques[0]).toMatchObject({
      bendOptions: { bendPitch: 1 },
    });
  });

  test.each([
    [null, "$"],
    [{ ...serializeScore(new Score()), format: "other" }, "$.format"],
    [{ ...serializeScore(new Score()), version: 2 }, "$.version"],
  ])("reports malformed roots at %s", (value, path) => {
    expect(deserializeScore(serializeScore(new Score()))).toBeInstanceOf(Score);
    expectDeserializeError(value, path);
  });

  test("reports unknown, missing, and nested malformed fields at their paths", () => {
    expect(deserializeScore(serializeScore(new Score()))).toBeInstanceOf(Score);
    expect(deserializeScore(bendDocument())).toBeInstanceOf(Score);
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
      expect(deserializeScore(duration)).toBeInstanceOf(Score);
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
    expect(deserializeScore(serializedScore)).toBeInstanceOf(Score);
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
        if (beat === undefined) throw Error("Expected serialized beat");
        beat.notes = [];
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes",
    ],
    [
      "Vibrato on an empty slot",
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
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0]",
    ],
    [
      "dots",
      (d: ReturnType<typeof serializeScore>) => {
        const beat = d.tracks[0].staves[0].bars[0].voices[0]?.beats[0];
        if (beat === undefined) throw Error("Expected serialized beat");
        Reflect.set(beat, "dots", 3);
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].dots",
    ],
    [
      "tuplet",
      (d: ReturnType<typeof serializeScore>) => {
        const beat = d.tracks[0].staves[0].bars[0].voices[0]?.beats[0];
        if (beat === undefined) throw Error("Expected serialized beat");
        beat.tuplet = { normalCount: 0, tupletCount: 2 };
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
    expect(deserializeScore(serializedScore)).toBeInstanceOf(Score);
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
    expect(error.cause).toMatchObject({ message: "Octave out of range" });
    serializedScore.tracks[0].instrument.tuning[0].octave = 4;
    expect(deserializeScore(serializedScore)).toBeInstanceOf(Score);
  });

  test("rejects a continuation bend below the preceding bend pitch", () => {
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
    second.setTechnique(GuitarTechniqueType.Tie);
    const serializedScore = serializeScore(score);
    expect(deserializeScore(serializedScore)).toBeInstanceOf(Score);
    const techniques =
      serializedScore.tracks[0].staves[0].bars[0].voices[0]?.beats[1].notes?.[0]
        ?.techniques;
    if (techniques === undefined) {
      throw Error("Expected second techniques");
    }
    const continuation = {
      type: SerializedTechniqueType.Bend,
      options: {
        type: SerializedBendType.Bend,
        bendPitch: 1,
        bendDuration: 0.5,
      },
    } as const;
    techniques.push(continuation);

    const error = deserializeError(serializedScore);
    expect(error.path).toBe(
      "$.tracks[0].staves[0].bars[0].voices[0].beats[1].notes[0].techniques[1]"
    );
    expect(error.message).toContain("incompatible technique");
    techniques[1] = {
      ...continuation,
      options: { ...continuation.options, bendPitch: 2 },
    };
    expect(deserializeScore(serializedScore)).toBeInstanceOf(Score);
  });

  test("loads legacy Let Ring Hold destinations as ties", () => {
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
        bendPitch: 1,
        bendDuration: 1,
      })
    );
    second.setTechnique(GuitarTechniqueType.Tie);
    second.setTechnique(
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Hold,
        holdPitch: 1,
        bendDuration: 1,
      })
    );
    const document = serializeScore(score);
    const techniques =
      document.tracks[0].staves[0].bars[0].voices[0]?.beats[1].notes?.[0]
        ?.techniques;
    const tie = techniques?.find((t) => t.type === SerializedTechniqueType.Tie);
    if (tie === undefined) {
      throw Error("Expected serialized tie");
    }
    required(techniques).splice(required(techniques).indexOf(tie), 1, {
      type: SerializedTechniqueType.LetRing,
    });
    required(techniques).reverse();
    const restored = deserializeScore(document);
    const note =
      restored.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[1].notes?.[0];
    expect(note?.hasTechnique(GuitarTechniqueType.Tie)).toBe(true);
    expect(note?.hasTechnique(GuitarTechniqueType.LetRing)).toBe(false);
    expect(() => serializeScore(restored)).not.toThrow();
  });

  test.each([
    [
      "fractional repeat",
      (d: ReturnType<typeof serializeScore>) => {
        d.masterBars[0].repeatCount = 2.5;
      },
      "$.masterBars[0].repeatCount",
      "expected safe integer",
    ],
    [
      "unsafe repeat integer",
      (d: ReturnType<typeof serializeScore>) => {
        d.masterBars[0].repeatCount = Number.MAX_SAFE_INTEGER + 1;
      },
      "$.masterBars[0].repeatCount",
      "expected safe integer",
    ],
    [
      "unsafe tuplet normalCount",
      (d: ReturnType<typeof serializeScore>) => {
        const b = d.tracks[0].staves[0].bars[0].voices[0]?.beats[0];
        if (b === undefined) throw Error("Expected serialized beat");
        b.tuplet = { normalCount: Number.MAX_SAFE_INTEGER + 1, tupletCount: 2 };
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].tuplet.normalCount",
      "expected safe integer",
    ],
    [
      "unsafe tuplet tupletCount",
      (d: ReturnType<typeof serializeScore>) => {
        const b = d.tracks[0].staves[0].bars[0].voices[0]?.beats[0];
        if (b === undefined) throw Error("Expected serialized beat");
        b.tuplet = { normalCount: 3, tupletCount: Number.MAX_SAFE_INTEGER + 1 };
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].tuplet.tupletCount",
      "expected safe integer",
    ],
    [
      "malformed technique entry",
      (d: ReturnType<typeof serializeScore>) => {
        const techniques =
          d.tracks[0].staves[0].bars[0].voices[0]?.beats[0].notes?.[0]
            ?.techniques;
        if (techniques === undefined) {
          throw Error("Expected serialized techniques");
        }
        Reflect.set(techniques, "0", null);
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0]",
      "expected object",
    ],
    [
      "unexpected technique options",
      (d: ReturnType<typeof serializeScore>) => {
        Reflect.set(bendTechnique(d), "type", SerializedTechniqueType.Vibrato);
      },
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0].options",
      "unknown property",
    ],
  ])(
    "rejects malformed serialized %s at its path",
    (_, mutate, path, reason) => {
      const document = bendDocument();
      document.masterBars[0].isRepeatEnd = true;
      document.masterBars[0].repeatCount = 2;
      const beat = document.tracks[0].staves[0].bars[0].voices[0]?.beats[0];
      if (beat === undefined) throw Error("Expected serialized beat");
      beat.tuplet = { normalCount: 3, tupletCount: 2 };
      expect(deserializeScore(document)).toBeInstanceOf(Score);
      mutate(document);
      const error = deserializeError(document);
      expect(error.path).toBe(path);
      expect(error.message).toContain(reason);
    }
  );

  test.each([
    [
      "empty voice",
      (s: Score) =>
        s.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats.splice(0),
      "$.tracks[0].staves[0].bars[0].voices[0].beats",
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
    expect(serializeScore(score)).toBeDefined();
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
    expect(serializeScore(score)).toBeDefined();
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
      expect(serializeScore(score)).toBeDefined();
      corrupt(score);
      expectSerializeError(score, path);
    }
  );
});
