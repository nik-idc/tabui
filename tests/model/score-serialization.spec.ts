import {
  BarRepeatStatus,
  BassGuitarTone,
  BendOptionsData,
  BendTechniqueOptions,
  BendType,
  deserializeScore,
  Guitar,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
  SCORE_SERIALIZATION_FORMAT,
  SCORE_SERIALIZATION_VERSION,
  Score,
  ScoreSerializationError,
  serializeScore,
} from "../../src/notation/model";
import { createFeatureShowcaseScoreFixture } from "../../demo/data/full-score";
import { createEmptyScoreFixture } from "../../demo/data/empty-score";
import { createMultiVoiceTwoStaffScoreFixture } from "../../demo/data/multi-voice-score";
import { createBarWithBeats } from "./helpers";

function getSerializationError(value: unknown): ScoreSerializationError {
  try {
    deserializeScore(value);
  } catch (error) {
    expect(error).toBeInstanceOf(ScoreSerializationError);
    return error as ScoreSerializationError;
  }

  throw Error("Expected score deserialization to fail");
}

function expectSerializationError(value: unknown, path: string): void {
  expect(getSerializationError(value).path).toBe(path);
}

function expectSerializeError(score: Score, path: string): void {
  try {
    serializeScore(score);
  } catch (error) {
    expect(error).toBeInstanceOf(ScoreSerializationError);
    expect((error as ScoreSerializationError).path).toBe(path);
    return;
  }

  throw Error("Expected score serialization to fail");
}

function expectRestoredOwnership(score: ReturnType<typeof deserializeScore>) {
  for (const track of score.tracks) {
    expect(track.score).toBe(score);
    for (const staff of track.staves) {
      expect(staff.track).toBe(track);
      expect(staff.trackContext).toBe(track.context);
      for (let barIndex = 0; barIndex < staff.bars.length; barIndex++) {
        const bar = staff.bars[barIndex];
        expect(bar.staff).toBe(staff);
        expect(bar.trackContext).toBe(track.context);
        expect(bar.masterBar).toBe(score.masterBars[barIndex]);
        for (const voiceBar of bar.voiceBarsAsArray) {
          expect(voiceBar.bar).toBe(bar);
          expect(voiceBar.trackContext).toBe(track.context);
          for (const beat of voiceBar.beats) {
            expect(beat.voiceBar).toBe(voiceBar);
            expect(beat.trackContext).toBe(track.context);
            for (const note of beat.notes ?? []) {
              expect(note.beat).toBe(beat);
              expect(note.trackContext).toBe(track.context);
              for (const technique of note.techniques) {
                expect(technique.note).toBe(note);
              }
            }
          }
        }
      }
    }
  }
}

function getFirstNote(score: Score): GuitarNote {
  const beat = score.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
  if (beat === undefined) {
    throw Error("Expected fixture beat");
  }
  if (beat.notes === null) {
    beat.makeBeatWithNotes();
  }
  const note = beat.notes?.find((n) => n instanceof GuitarNote);
  if (!(note instanceof GuitarNote)) {
    throw Error("Expected fixture guitar note");
  }
  return note;
}

function createDocumentWithBend() {
  const score = new Score();
  const note = getFirstNote(score);
  note.fret = 1;
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
  return serializeScore(score);
}

describe("score serialization", () => {
  test.each([
    ["empty score", createEmptyScoreFixture],
    ["feature showcase", createFeatureShowcaseScoreFixture],
    ["multi-staff sparse voices", createMultiVoiceTwoStaffScoreFixture],
  ])("round trips the %s fixture", (_, createFixture) => {
    const score = createFixture();

    const serialized = serializeScore(score);
    const restored = deserializeScore(
      JSON.parse(JSON.stringify(serialized)) as unknown
    );

    expect(serializeScore(restored)).toEqual(serialized);
    expectRestoredOwnership(restored);
  });

  test("round trips score metadata, mix, meter, repeats, rests and techniques", () => {
    const score = createFeatureShowcaseScoreFixture();
    score.name = "Persistence Fixture";
    score.artist = "TabUI";
    score.song = "Round Trip";
    score.masterVolume = 0.7;
    score.masterPan = -0.25;
    score.tracks[0].volume = 0.35;
    score.tracks[0].pan = 0.4;
    score.tracks[0].muted = true;
    score.tracks[1].soloed = true;
    score.masterBars[0].tempo = 144;
    score.masterBars[0].beatsCount = 7;
    score.masterBars[0].duration = NoteDuration.Eighth;
    score.masterBars[0].repeatStatus = BarRepeatStatus.Start;
    const finalMasterBar = score.masterBars[score.masterBars.length - 1];
    finalMasterBar.repeatStatus = BarRepeatStatus.End;
    finalMasterBar.repeatCount = 3;

    const firstVoiceBar = score.tracks[0].staves[0].bars[0].getVoiceBar(1);
    const secondVoiceBar = score.tracks[0].staves[0].bars[1].getVoiceBar(1);
    if (firstVoiceBar === null || secondVoiceBar === null) {
      throw Error("Expected fixture voice bars");
    }
    const bendNote = firstVoiceBar.beats[0].notes?.[0];
    const vibratoNote = secondVoiceBar.beats[0].notes?.[0];
    if (
      !(bendNote instanceof GuitarNote) ||
      !(vibratoNote instanceof GuitarNote)
    ) {
      throw Error("Expected fixture guitar notes");
    }
    bendNote.addTechnique(
      new GuitarTechnique(
        bendNote,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.BendAndRelease,
          bendPitch: 1,
          releasePitch: 0,
          bendDuration: 0.5,
        })
      )
    );
    vibratoNote.addTechnique(
      new GuitarTechnique(vibratoNote, GuitarTechniqueType.Vibrato)
    );
    secondVoiceBar.beats[1].makeRest();

    const serialized = serializeScore(score);
    const restored = deserializeScore(serialized);

    expect(serializeScore(restored)).toEqual(serialized);
    expect(serialized.masterBars[0]).toMatchObject({
      tempo: 144,
      beatsCount: 7,
      duration: "eighth",
      repeatStatus: "start",
    });
    expect(serialized.masterBars.at(-1)).toMatchObject({
      repeatStatus: "end",
      repeatCount: 3,
    });
    expect(
      serialized.tracks[0].staves[0].bars[1].voices[0]?.beats[1].notes
    ).toBeNull();
    expect(
      serialized.tracks[0].staves[0].bars[0].voices[0]?.beats[0].notes?.[0]
        ?.techniques[0]
    ).toEqual({
      type: "bend",
      options: {
        type: "bend-and-release",
        bendPitch: 1,
        releasePitch: 0,
        bendDuration: 0.5,
      },
    });
    expectRestoredOwnership(restored);
  });

  test.each([
    ["bend", { type: BendType.Bend, bendPitch: 1, bendDuration: 0.5 }],
    [
      "bend and release",
      {
        type: BendType.BendAndRelease,
        bendPitch: 1,
        releasePitch: 0,
        bendDuration: 0.5,
      },
    ],
    ["hold", { type: BendType.Hold, holdPitch: 1, bendDuration: 0.5 }],
    ["prebend", { type: BendType.Prebend, prebendPitch: 1 }],
    [
      "prebend and release",
      {
        type: BendType.PrebendAndRelease,
        prebendPitch: 1,
        releasePitch: 0,
        bendDuration: 0.5,
      },
    ],
    [
      "prebend bend",
      {
        type: BendType.PrebendBend,
        prebendPitch: 1,
        bendPitch: 2,
        bendDuration: 0.5,
      },
    ],
    ["release", { type: BendType.Release, releasePitch: 0, bendDuration: 0.5 }],
  ] as Array<[string, BendOptionsData]>)(
    "round trips %s options",
    (_, options) => {
      const score = createFeatureShowcaseScoreFixture();
      const notes =
        score.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0].notes;
      const note = notes?.find(
        (candidate) =>
          candidate instanceof GuitarNote && candidate.fret !== null
      );
      if (!(note instanceof GuitarNote)) {
        throw Error("Expected playable fixture note");
      }
      note.addTechnique(
        new GuitarTechnique(
          note,
          GuitarTechniqueType.Bend,
          new BendTechniqueOptions(options)
        )
      );

      const serialized = serializeScore(score);

      expect(serializeScore(deserializeScore(serialized))).toEqual(serialized);
    }
  );

  test("emits a versioned document without derived timing fields", () => {
    const document = serializeScore(createFeatureShowcaseScoreFixture());
    const firstBeat = document.tracks[0].staves[0].bars[0].voices[0]?.beats[0];

    expect(document.format).toBe(SCORE_SERIALIZATION_FORMAT);
    expect(document.version).toBe(SCORE_SERIALIZATION_VERSION);
    expect(firstBeat).toBeDefined();
    expect(firstBeat).not.toHaveProperty("beamGroupId");
    expect(firstBeat).not.toHaveProperty("lastInBeamGroup");
  });

  test("emits stable V1 tokens for isolated model enum values", () => {
    const document = serializeScore(new Score());
    const instrument = document.tracks[0].instrument;

    expect(document.masterBars[0].duration).toBe("quarter");
    expect(document.masterBars[0].repeatStatus).toBe("none");
    expect(document.tracks[0].staves[0].clefType).toBe("Treble");
    expect(instrument.family).toBe("Strings");
    expect(instrument.type).toBe("Electric Guitar");
    expect(instrument.tone).toBe("Electric Clean");
    expect(instrument.tuning[0].noteValue).toBe("E");
  });

  test("round trips a score containing only rests", () => {
    const score = createFeatureShowcaseScoreFixture();
    for (const track of score.tracks) {
      for (const staff of track.staves) {
        for (const bar of staff.bars) {
          for (const voiceBar of bar.voiceBarsAsArray) {
            for (const beat of voiceBar.beats) {
              beat.makeRest();
            }
          }
        }
      }
    }

    const serialized = serializeScore(score);

    expect(serializeScore(deserializeScore(serialized))).toEqual(serialized);
  });

  test("returns a document detached from live score tuning and tuplets", () => {
    const score = createMultiVoiceTwoStaffScoreFixture();
    const instrument = score.tracks[0].context.instrument;
    const voiceBar = score.tracks[0].staves[0].bars[2].getVoiceBar(1);
    const beat = voiceBar?.beats[0];
    if (beat?.tupletSettings === null || beat?.tupletSettings === undefined) {
      throw Error("Expected fixture tuplet");
    }
    const originalOctave = instrument.tuning?.[0].octave;
    const originalTupletCount = beat.tupletSettings.tupletCount;
    const document = serializeScore(score);
    const serializedTuplet =
      document.tracks[0].staves[0].bars[2].voices[0]?.beats[0].tuplet;
    if (serializedTuplet === null || serializedTuplet === undefined) {
      throw Error("Expected serialized tuplet");
    }

    document.tracks[0].instrument.tuning[0].octave = 0;
    serializedTuplet.tupletCount = 99;

    expect(instrument.tuning?.[0].octave).toBe(originalOctave);
    expect(beat.tupletSettings.tupletCount).toBe(originalTupletCount);
  });

  test("regenerates runtime identities", () => {
    const score = createFeatureShowcaseScoreFixture();
    const restored = deserializeScore(serializeScore(score));

    expect(restored.masterBars[0].uuid).not.toBe(score.masterBars[0].uuid);
    expect(restored.tracks[0].uuid).not.toBe(score.tracks[0].uuid);
    expect(restored.tracks[0].staves[0].uuid).not.toBe(
      score.tracks[0].staves[0].uuid
    );
  });

  test("rejects malformed roots and unsupported versions with paths", () => {
    expectSerializationError(null, "$");
    expectSerializationError(
      { format: "another-format", version: 1 },
      "$.format"
    );
    expectSerializationError(
      { format: SCORE_SERIALIZATION_FORMAT, version: 2 },
      "$.version"
    );
  });

  test("rejects unknown and missing root properties at exact paths", () => {
    const unknown = serializeScore(new Score()) as unknown as Record<
      string,
      unknown
    >;
    unknown.formatt = unknown.format;
    expectSerializationError(unknown, "$.formatt");

    const missing = serializeScore(new Score()) as unknown as Record<
      string,
      unknown
    >;
    Reflect.deleteProperty(missing, "artist");
    expectSerializationError(missing, "$.artist");
  });

  test("rejects unknown and missing deeply nested properties", () => {
    const unknown = createDocumentWithBend();
    const technique =
      unknown.tracks[0].staves[0].bars[0].voices[0]?.beats[0].notes?.[0]
        ?.techniques[0];
    if (technique === undefined) {
      throw Error("Expected serialized bend technique");
    }
    Reflect.set(technique, "optionz", {});
    expectSerializationError(
      unknown,
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0].optionz"
    );

    const missing = createDocumentWithBend();
    const options =
      missing.tracks[0].staves[0].bars[0].voices[0]?.beats[0].notes?.[0]
        ?.techniques[0];
    if (options?.type !== "bend") {
      throw Error("Expected serialized bend technique");
    }
    Reflect.deleteProperty(options.options, "bendDuration");
    expectSerializationError(
      missing,
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0].options.bendDuration"
    );
  });

  test.each(["__proto__", "constructor", "toString"])(
    "rejects prototype enum key %s for duration, repeat, technique and bend",
    (value) => {
      const duration = createDocumentWithBend();
      Reflect.set(duration.masterBars[0], "duration", value);
      expectSerializationError(duration, "$.masterBars[0].duration");

      const repeat = createDocumentWithBend();
      Reflect.set(repeat.masterBars[0], "repeatStatus", value);
      expectSerializationError(repeat, "$.masterBars[0].repeatStatus");

      const technique = createDocumentWithBend();
      const serializedTechnique =
        technique.tracks[0].staves[0].bars[0].voices[0]?.beats[0].notes?.[0]
          ?.techniques[0];
      if (serializedTechnique === undefined) {
        throw Error("Expected serialized technique");
      }
      Reflect.set(serializedTechnique, "type", value);
      expectSerializationError(
        technique,
        "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0].type"
      );

      const bend = createDocumentWithBend();
      const serializedBend =
        bend.tracks[0].staves[0].bars[0].voices[0]?.beats[0].notes?.[0]
          ?.techniques[0];
      if (serializedBend?.type !== "bend") {
        throw Error("Expected serialized bend");
      }
      Reflect.set(serializedBend.options, "type", value);
      expectSerializationError(
        bend,
        "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0].options.type"
      );
    }
  );

  test("rejects staff bar counts that do not match master bars", () => {
    const document = serializeScore(createFeatureShowcaseScoreFixture());
    document.tracks[0].staves[0].bars.pop();

    expectSerializationError(document, "$.tracks[0].staves[0].bars");
  });

  test("rejects empty non-null voice bars on input", () => {
    const document = serializeScore(createFeatureShowcaseScoreFixture());
    document.tracks[0].staves[0].bars[0].voices[0] = { beats: [] };

    expectSerializationError(
      document,
      "$.tracks[0].staves[0].bars[0].voices[0].beats"
    );
  });

  test("rejects invalid nested values with their exact paths", () => {
    const invalidMix = serializeScore(createFeatureShowcaseScoreFixture());
    invalidMix.masterVolume = 2;
    expectSerializationError(invalidMix, "$.masterVolume");

    const invalidRepeat = serializeScore(createFeatureShowcaseScoreFixture());
    Reflect.set(invalidRepeat.masterBars[0], "repeatStatus", "end");
    invalidRepeat.masterBars[0].repeatCount = null;
    expectSerializationError(invalidRepeat, "$.masterBars[0].repeatCount");

    const invalidInstrument = serializeScore(
      createFeatureShowcaseScoreFixture()
    );
    Reflect.set(
      invalidInstrument.tracks[0].instrument,
      "tone",
      BassGuitarTone.Clean
    );
    expectSerializationError(invalidInstrument, "$.tracks[0].instrument.tone");

    const invalidBend = serializeScore(createFeatureShowcaseScoreFixture());
    const firstNotes =
      invalidBend.tracks[0].staves[0].bars[0].voices[0]?.beats[0].notes;
    const firstNoteIndex = firstNotes?.findIndex((note) => note !== null) ?? -1;
    const firstNote = firstNotes?.[firstNoteIndex];
    if (firstNote === null || firstNote === undefined) {
      throw Error("Expected serialized fixture note");
    }
    Reflect.set(firstNote, "techniques", [
      {
        type: "bend",
        options: { type: "bend-and-release", bendPitch: 1 },
      },
    ]);
    expectSerializationError(
      invalidBend,
      `$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[${firstNoteIndex}].techniques[0].options.releasePitch`
    );
  });

  test("wraps fret pitch failures in a path-aware serialization error", () => {
    const document = serializeScore(new Score());
    document.tracks[0].instrument.tuning[0].octave = 9;
    const beat = document.tracks[0].staves[0].bars[0].voices[0]?.beats[0];
    if (beat === undefined) {
      throw Error("Expected serialized beat");
    }
    beat.notes = Array.from({ length: 6 }, () => null);
    const notes = beat.notes;
    notes[0] = { fret: 24, techniques: [] };

    const error = getSerializationError(document);
    expect(error.path).toBe(
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].fret"
    );
    expect(error.cause).toBeInstanceOf(Error);
  });

  test("validates continuation bends after reconstructed beats are attached", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const firstNote = beats[0].notes?.[0];
    const secondNote = beats[1].notes?.[0];
    if (
      !(firstNote instanceof GuitarNote) ||
      !(secondNote instanceof GuitarNote)
    ) {
      throw Error("Expected guitar notes");
    }
    firstNote.fret = 5;
    secondNote.fret = 5;
    firstNote.addTechnique(
      new GuitarTechnique(
        firstNote,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 2,
          bendDuration: 0.5,
        })
      )
    );
    secondNote.addTechnique(
      new GuitarTechnique(secondNote, GuitarTechniqueType.LetRing)
    );
    const document = serializeScore(score);
    const secondTechniques =
      document.tracks[0].staves[0].bars[0].voices[0]?.beats[1].notes?.[0]
        ?.techniques;
    if (secondTechniques === undefined) {
      throw Error("Expected serialized second note");
    }
    Reflect.apply(Array.prototype.push, secondTechniques, [
      {
        type: "bend",
        options: { type: "bend", bendPitch: 1, bendDuration: 0.5 },
      },
    ]);

    expectSerializationError(
      document,
      "$.tracks[0].staves[0].bars[0].voices[0].beats[1].notes[0].techniques[1]"
    );

    secondNote.techniques.push(
      new GuitarTechnique(
        secondNote,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 1,
          bendDuration: 0.5,
        })
      )
    );
    expectSerializeError(
      score,
      "$.tracks[0].staves[0].bars[0].voices[0].beats[1].notes[0].techniques[1]"
    );
  });

  test("rejects tracks without staves", () => {
    const document = serializeScore(createFeatureShowcaseScoreFixture());
    document.tracks[0].staves.splice(0);

    expectSerializationError(document, "$.tracks[0].staves");
  });

  test("refuses to serialize empty non-null voice bars", () => {
    expect(() =>
      serializeScore(createMultiVoiceTwoStaffScoreFixture())
    ).not.toThrow();
    const score = new Score();
    score.tracks[0].staves[0].bars[0].getVoiceBar(1)?.replaceBeats([]);
    expectSerializeError(
      score,
      "$.tracks[0].staves[0].bars[0].voices[0].beats"
    );
  });

  test("refuses to serialize fractional repeat counts", () => {
    const score = createFeatureShowcaseScoreFixture();
    score.masterBars[0].repeatStatus = BarRepeatStatus.End;
    score.masterBars[0].repeatCount = 2.5;

    expectSerializeError(score, "$.masterBars[0].repeatCount");
  });

  test("refuses to serialize unsafe repeat counts", () => {
    const score = createFeatureShowcaseScoreFixture();
    score.masterBars[0].repeatStatus = BarRepeatStatus.End;
    score.masterBars[0].repeatCount = Number.MAX_SAFE_INTEGER + 1;

    expectSerializeError(score, "$.masterBars[0].repeatCount");
  });

  test.each(["normalCount", "tupletCount"] as const)(
    "refuses to serialize an invalid tuplet %s at its exact path",
    (property) => {
      const score = new Score();
      const beat = score.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
      if (beat === undefined) {
        throw Error("Expected score beat");
      }
      beat.tupletSettings = { normalCount: 3, tupletCount: 2 };
      Reflect.set(beat.tupletSettings, property, 0);

      expectSerializeError(
        score,
        `$.tracks[0].staves[0].bars[0].voices[0].beats[0].tuplet.${property}`
      );
    }
  );

  test("refuses to serialize notes whose string differs from their slot", () => {
    const score = new Score();
    const beat = score.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
    beat?.makeBeatWithNotes();
    const notes = beat?.notes;
    if (beat === undefined || notes === null || notes === undefined) {
      throw Error("Expected guitar beat notes");
    }
    beat.setNote(0, notes[1]);

    expectSerializeError(
      score,
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0]"
    );
  });

  test("rejects invalid technique arrays before emitting a document", () => {
    const unsupported = new Score();
    const unsupportedNote = getFirstNote(unsupported);
    unsupportedNote.fret = 1;
    Reflect.apply(Array.prototype.push, unsupportedNote.techniques, [null]);
    expectSerializeError(
      unsupported,
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0]"
    );

    const duplicate = new Score();
    const duplicateNote = getFirstNote(duplicate);
    duplicateNote.fret = 1;
    duplicateNote.techniques.push(
      new GuitarTechnique(duplicateNote, GuitarTechniqueType.Vibrato),
      new GuitarTechnique(duplicateNote, GuitarTechniqueType.Vibrato)
    );
    expectSerializeError(
      duplicate,
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[1]"
    );

    const incompatible = new Score();
    const incompatibleNote = getFirstNote(incompatible);
    incompatibleNote.fret = 1;
    incompatibleNote.techniques.push(
      new GuitarTechnique(incompatibleNote, GuitarTechniqueType.LetRing),
      new GuitarTechnique(incompatibleNote, GuitarTechniqueType.PalmMute)
    );
    expectSerializeError(
      incompatible,
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[1]"
    );

    const unexpectedOptions = new Score();
    const optionsNote = getFirstNote(unexpectedOptions);
    optionsNote.fret = 1;
    const vibrato = new GuitarTechnique(
      optionsNote,
      GuitarTechniqueType.Vibrato
    );
    Reflect.set(
      vibrato,
      "_bendOptions",
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1,
        bendDuration: 0.5,
      })
    );
    optionsNote.techniques.push(vibrato);
    expectSerializeError(
      unexpectedOptions,
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0].options"
    );
  });

  test("rejects sparse arrays with a path-aware error", () => {
    const document = serializeScore(createFeatureShowcaseScoreFixture());
    Reflect.set(document, "tracks", new Array(1));

    expectSerializationError(document, "$.tracks[0]");
  });

  test("rejects invalid runtime values before emitting a document", () => {
    const cases: readonly [string, (score: Score) => void][] = [
      ["$.name", (score) => Reflect.set(score, "_name", 42)],
      [
        "$.tracks[0].muted",
        (score) => Reflect.set(score.tracks[0], "muted", "yes"),
      ],
      [
        "$.tracks[0].staves[0].clefType",
        (score) => Reflect.set(score.tracks[0].staves[0], "_clefType", "bad"),
      ],
      [
        "$.tracks[0].instrument.name",
        (score) => Reflect.set(score.tracks[0].context.instrument, "_name", 7),
      ],
      [
        "$.tracks[0].instrument.program",
        (score) =>
          Reflect.set(score.tracks[0].context.instrument, "_program", 0),
      ],
    ];

    for (const [path, corrupt] of cases) {
      const score = new Score();
      corrupt(score);
      expectSerializeError(score, path);
    }
  });

  test("rejects sparse model arrays before emitting a document", () => {
    const sparseTracks = new Score();
    Reflect.deleteProperty(sparseTracks.tracks, "0");
    expectSerializeError(sparseTracks, "$.tracks[0]");

    const inheritedTrack = new Score();
    const track = inheritedTrack.tracks[0];
    Reflect.deleteProperty(inheritedTrack.tracks, "0");
    Object.setPrototypeOf(inheritedTrack.tracks, { 0: track });
    expectSerializeError(inheritedTrack, "$.tracks[0]");

    const sparseTuning = new Score();
    const instrument = sparseTuning.tracks[0].context.instrument;
    if (!(instrument instanceof Guitar)) {
      throw Error("Expected guitar instrument");
    }
    const isolatedInstrument = new Guitar(
      instrument.type,
      instrument.tone,
      instrument.name,
      instrument.stringsCount,
      instrument.tuning.map((n) => ({ ...n })),
      instrument.fretsCount
    );
    sparseTuning.tracks[0].setInstrument(isolatedInstrument);
    Reflect.deleteProperty(isolatedInstrument.tuning, "0");
    expectSerializeError(sparseTuning, "$.tracks[0].instrument.tuning[0]");
  });

  test("rejects unsafe tuplets before timing reconstruction", () => {
    const document = serializeScore(createFeatureShowcaseScoreFixture());
    const beat = document.tracks[0].staves[0].bars[0].voices[0]?.beats[0];
    if (beat === undefined) {
      throw Error("Expected serialized beat");
    }
    beat.tuplet = {
      normalCount: Number.MAX_SAFE_INTEGER + 1,
      tupletCount: Number.MAX_SAFE_INTEGER + 1,
    };

    expectSerializationError(
      document,
      "$.tracks[0].staves[0].bars[0].voices[0].beats[0].tuplet.normalCount"
    );
  });

  test("reports invalid runtime guitar types at the instrument path", () => {
    const score = createFeatureShowcaseScoreFixture();
    Reflect.set(score.tracks[0].context.instrument, "_type", "invalid");

    expectSerializeError(score, "$.tracks[0].instrument.type");
  });

  test("rejects foreign ownership at every serialized model layer", () => {
    const cases: readonly [string, (score: Score, foreign: Score) => void][] = [
      [
        "$.tracks[0]",
        (score, foreign) => {
          score.tracks[0] = foreign.tracks[0];
        },
      ],
      [
        "$.tracks[0].staves[0]",
        (score, foreign) => {
          score.tracks[0].staves[0] = foreign.tracks[0].staves[0];
        },
      ],
      [
        "$.tracks[0].staves[0].bars[0]",
        (score, foreign) => {
          score.tracks[0].staves[0].bars[0] =
            foreign.tracks[0].staves[0].bars[0];
        },
      ],
      [
        "$.tracks[0].staves[0].bars[0].voices[0]",
        (score, foreign) => {
          const bar = score.tracks[0].staves[0].bars[0];
          bar.voiceBars[1] = foreign.tracks[0].staves[0].bars[0].getVoiceBar(1);
        },
      ],
      [
        "$.tracks[0].staves[0].bars[0].voices[0].beats[0]",
        (score, foreign) => {
          const voice = score.tracks[0].staves[0].bars[0].getVoiceBar(1);
          const foreignBeat =
            foreign.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
          if (voice === null || foreignBeat === undefined) {
            throw Error("Expected voice beats");
          }
          voice.beats[0] = foreignBeat;
        },
      ],
      [
        "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0]",
        (score, foreign) => {
          const notes = getFirstNote(score).beat.notes;
          if (notes === null) {
            throw Error("Expected notes");
          }
          notes[0] = getFirstNote(foreign);
        },
      ],
      [
        "$.tracks[0].staves[0].bars[0].voices[0].beats[0].notes[0].techniques[0]",
        (score, foreign) => {
          const note = getFirstNote(score);
          const foreignNote = getFirstNote(foreign);
          note.fret = 1;
          foreignNote.fret = 1;
          note.techniques.push(
            new GuitarTechnique(foreignNote, GuitarTechniqueType.Vibrato)
          );
        },
      ],
    ];

    for (const [path, corrupt] of cases) {
      const score = new Score();
      const foreign = new Score();
      corrupt(score, foreign);
      expectSerializeError(score, path);
    }
  });
});
