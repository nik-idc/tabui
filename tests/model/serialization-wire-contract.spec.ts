import {
  AcousticGuitarTone,
  BarRepeatStatus,
  BassGuitarTone,
  Beat,
  BendOptionsData,
  BendTechniqueOptions,
  BendType,
  ClefType,
  deserializeScore,
  ElectricGuitarTone,
  Guitar,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  InstrumentFamily,
  NoteDuration,
  NoteValue,
  OtherStringTone,
  Score,
  SerializedBendType,
  SerializedClefType,
  SerializedInstrumentFamily,
  SerializedNoteDuration,
  SerializedPlayableNoteValue,
  SerializedRepeatStatus,
  SerializedStringInstrumentTone,
  SerializedStringInstrumentType,
  SerializedTechniqueType,
  serializeScore,
  StringInstrumentType,
} from "../../src/notation/model";
import { SerializedValueReader } from "../../src/notation/model/serialization/serialized-value-reader";
import {
  readBendType,
  readClefType,
  readInstrumentFamily,
  readNoteDuration,
  readNoteValue,
  readRepeatStatus,
  readStringInstrumentType,
  readStringTone,
  readTechniqueType,
  SERIALIZED_CLEF_TYPES,
  SERIALIZED_INSTRUMENT_FAMILIES,
  SERIALIZED_NOTE_DURATIONS,
  SERIALIZED_PLAYABLE_NOTE_VALUES,
  SERIALIZED_REPEAT_STATUSES,
  SERIALIZED_STRING_INSTRUMENT_TYPES,
  SERIALIZED_STRING_TONES,
  SERIALIZED_TECHNIQUE_TYPES,
} from "../../src/notation/model/serialization/v1/mappings";

type WirePair = readonly [PropertyKey, string];

const DURATION_PAIRS: readonly WirePair[] = [
  [NoteDuration.Whole, "whole"],
  [NoteDuration.Half, "half"],
  [NoteDuration.Quarter, "quarter"],
  [NoteDuration.Eighth, "eighth"],
  [NoteDuration.Sixteenth, "sixteenth"],
  [NoteDuration.ThirtySecond, "thirty-second"],
  [NoteDuration.SixtyFourth, "sixty-fourth"],
];

const REPEAT_PAIRS: readonly WirePair[] = [
  [BarRepeatStatus.None, "none"],
  [BarRepeatStatus.Start, "start"],
  [BarRepeatStatus.End, "end"],
];

const TECHNIQUE_PAIRS: readonly WirePair[] = [
  [GuitarTechniqueType.Bend, "bend"],
  [GuitarTechniqueType.Legato, "hammer-on-or-pull-off"],
  [GuitarTechniqueType.LetRing, "let-ring"],
  [GuitarTechniqueType.NaturalHarmonic, "natural-harmonic"],
  [GuitarTechniqueType.PalmMute, "palm-mute"],
  [GuitarTechniqueType.PinchHarmonic, "pinch-harmonic"],
  [GuitarTechniqueType.Slide, "slide"],
  [GuitarTechniqueType.Vibrato, "vibrato"],
];

const BEND_PAIRS: readonly WirePair[] = [
  [BendType.Bend, "bend"],
  [BendType.BendAndRelease, "bend-and-release"],
  [BendType.Hold, "hold"],
  [BendType.Prebend, "prebend"],
  [BendType.PrebendAndRelease, "prebend-and-release"],
  [BendType.PrebendBend, "prebend-bend"],
  [BendType.Release, "release"],
];

const BEND_OPTIONS: readonly BendOptionsData[] = [
  { type: BendType.Bend, bendPitch: 1, bendDuration: 0.5 },
  {
    type: BendType.BendAndRelease,
    bendPitch: 1,
    releasePitch: 0,
    bendDuration: 0.5,
  },
  { type: BendType.Hold, holdPitch: 1, bendDuration: 0.5 },
  { type: BendType.Prebend, prebendPitch: 1 },
  {
    type: BendType.PrebendAndRelease,
    prebendPitch: 1,
    releasePitch: 0,
    bendDuration: 0.5,
  },
  {
    type: BendType.PrebendBend,
    prebendPitch: 1,
    bendPitch: 2,
    bendDuration: 0.5,
  },
  { type: BendType.Release, releasePitch: 0, bendDuration: 0.5 },
];

const CLEF_PAIRS: readonly WirePair[] = [
  [ClefType.Treble, "Treble"],
  [ClefType.Bass, "Bass"],
  [ClefType.Alto, "Alto"],
  [ClefType.Tenor, "Tenor"],
  [ClefType.Percussion, "Percussion"],
  [ClefType.Tab, "Tab"],
];

const INSTRUMENT_FAMILY_PAIRS: readonly WirePair[] = [
  [InstrumentFamily.Strings, "Strings"],
];

const STRING_INSTRUMENT_TYPE_PAIRS: readonly WirePair[] = [
  [StringInstrumentType.AcousticGuitar, "Acoustic Guitar"],
  [StringInstrumentType.ElectricGuitar, "Electric Guitar"],
  [StringInstrumentType.BassGuitar, "Bass Guitar"],
  [StringInstrumentType.Other, "Other"],
];

const STRING_TONE_PAIRS: readonly WirePair[] = [
  [AcousticGuitarTone.Nylon, "Nylon"],
  [AcousticGuitarTone.Steel, "Steel"],
  [ElectricGuitarTone.Clean, "Electric Clean"],
  [ElectricGuitarTone.Overdrive, "Electric Overdrive"],
  [ElectricGuitarTone.Distortion, "Electric Distortion"],
  [BassGuitarTone.Acoustic, "Bass Acoustic"],
  [BassGuitarTone.Clean, "Bass Clean"],
  [BassGuitarTone.Distortion, "Bass Distortion"],
  [OtherStringTone.Banjo, "Banjo"],
  [OtherStringTone.Ukulele, "Ukulele"],
];

const PLAYABLE_NOTE_PAIRS: readonly WirePair[] = [
  [NoteValue.A, "A"],
  [NoteValue.ASharp, "A#"],
  [NoteValue.B, "B"],
  [NoteValue.C, "C"],
  [NoteValue.CSharp, "C#"],
  [NoteValue.D, "D"],
  [NoteValue.DSharp, "D#"],
  [NoteValue.E, "E"],
  [NoteValue.F, "F"],
  [NoteValue.FSharp, "F#"],
  [NoteValue.G, "G"],
  [NoteValue.GSharp, "G#"],
];

const SERIALIZED_ENUM_EXPECTATIONS = [
  [
    "note durations",
    SerializedNoteDuration,
    {
      Whole: "whole",
      Half: "half",
      Quarter: "quarter",
      Eighth: "eighth",
      Sixteenth: "sixteenth",
      ThirtySecond: "thirty-second",
      SixtyFourth: "sixty-fourth",
    },
  ],
  [
    "repeat statuses",
    SerializedRepeatStatus,
    { None: "none", Start: "start", End: "end" },
  ],
  [
    "technique types",
    SerializedTechniqueType,
    {
      Bend: "bend",
      HammerOnOrPullOff: "hammer-on-or-pull-off",
      LetRing: "let-ring",
      NaturalHarmonic: "natural-harmonic",
      PalmMute: "palm-mute",
      PinchHarmonic: "pinch-harmonic",
      Slide: "slide",
      Vibrato: "vibrato",
    },
  ],
  [
    "bend types",
    SerializedBendType,
    {
      Bend: "bend",
      BendAndRelease: "bend-and-release",
      Hold: "hold",
      Prebend: "prebend",
      PrebendAndRelease: "prebend-and-release",
      PrebendBend: "prebend-bend",
      Release: "release",
    },
  ],
  [
    "clef types",
    SerializedClefType,
    {
      Treble: "Treble",
      Bass: "Bass",
      Alto: "Alto",
      Tenor: "Tenor",
      Percussion: "Percussion",
      Tab: "Tab",
    },
  ],
  ["instrument families", SerializedInstrumentFamily, { Strings: "Strings" }],
  [
    "string instrument types",
    SerializedStringInstrumentType,
    {
      AcousticGuitar: "Acoustic Guitar",
      ElectricGuitar: "Electric Guitar",
      BassGuitar: "Bass Guitar",
      Other: "Other",
    },
  ],
  [
    "string instrument tones",
    SerializedStringInstrumentTone,
    {
      Nylon: "Nylon",
      Steel: "Steel",
      ElectricClean: "Electric Clean",
      ElectricOverdrive: "Electric Overdrive",
      ElectricDistortion: "Electric Distortion",
      BassAcoustic: "Bass Acoustic",
      BassClean: "Bass Clean",
      BassDistortion: "Bass Distortion",
      Banjo: "Banjo",
      Ukulele: "Ukulele",
    },
  ],
  [
    "playable note values",
    SerializedPlayableNoteValue,
    {
      A: "A",
      ASharp: "A#",
      B: "B",
      C: "C",
      CSharp: "C#",
      D: "D",
      DSharp: "D#",
      E: "E",
      F: "F",
      FSharp: "F#",
      G: "G",
      GSharp: "G#",
    },
  ],
] as const;

const MODEL_MAPPING_EXPECTATIONS = [
  ["note durations", SERIALIZED_NOTE_DURATIONS, DURATION_PAIRS],
  ["repeat statuses", SERIALIZED_REPEAT_STATUSES, REPEAT_PAIRS],
  ["technique types", SERIALIZED_TECHNIQUE_TYPES, TECHNIQUE_PAIRS],
  ["clef types", SERIALIZED_CLEF_TYPES, CLEF_PAIRS],
  [
    "string instrument types",
    SERIALIZED_STRING_INSTRUMENT_TYPES,
    STRING_INSTRUMENT_TYPE_PAIRS,
  ],
  ["string instrument tones", SERIALIZED_STRING_TONES, STRING_TONE_PAIRS],
  [
    "playable note values",
    SERIALIZED_PLAYABLE_NOTE_VALUES,
    PLAYABLE_NOTE_PAIRS,
  ],
] as const;

const READER_EXPECTATIONS = [
  ["note durations", readNoteDuration, DURATION_PAIRS],
  ["repeat statuses", readRepeatStatus, REPEAT_PAIRS],
  ["technique types", readTechniqueType, TECHNIQUE_PAIRS],
  ["bend types", readBendType, BEND_PAIRS],
  ["clef types", readClefType, CLEF_PAIRS],
  ["instrument families", readInstrumentFamily, INSTRUMENT_FAMILY_PAIRS],
  [
    "string instrument types",
    readStringInstrumentType,
    STRING_INSTRUMENT_TYPE_PAIRS,
  ],
  ["string instrument tones", readStringTone, STRING_TONE_PAIRS],
  ["playable note values", readNoteValue, PLAYABLE_NOTE_PAIRS],
] as const;

describe("V1 serialization wire contract", () => {
  test.each(SERIALIZED_ENUM_EXPECTATIONS)(
    "pins every public serialized %s literal",
    (_, serializedEnum, expected) => {
      expect(serializedEnum).toEqual(expected);
    }
  );

  test.each(MODEL_MAPPING_EXPECTATIONS)(
    "pins every supported model-to-wire %s pairing",
    (_, mapping, pairs) => {
      expect(mapping).toEqual(Object.fromEntries(pairs));
    }
  );

  test("pins supported and unsupported instrument family mappings", () => {
    expect(SERIALIZED_INSTRUMENT_FAMILIES).toEqual({
      Strings: "Strings",
      Orchestra: undefined,
      Drums: undefined,
    });
  });

  test("pins every bend model-to-wire pairing in one document", () => {
    const score = new Score();
    const voiceBar = score.tracks[0].staves[0].bars[0].getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected default voice bar");
    }
    const beats = BEND_OPTIONS.map((options, index) => {
      const beat = new Beat(voiceBar, voiceBar.trackContext);
      const note = beat.notes?.[0];
      if (!(note instanceof GuitarNote)) {
        throw Error("Expected guitar note");
      }
      note.fret = index + 1;
      note.addTechnique(
        new GuitarTechnique(
          note,
          GuitarTechniqueType.Bend,
          new BendTechniqueOptions(options)
        )
      );
      return beat;
    });
    voiceBar.replaceBeats(beats);

    const serializedBeats =
      serializeScore(score).tracks[0].staves[0].bars[0].voices[0]?.beats;
    expect(
      serializedBeats?.map((beat) => {
        const technique = beat.notes?.[0]?.techniques[0];
        return technique?.type === "bend" ? technique.options.type : null;
      })
    ).toEqual(BEND_PAIRS.map((pair) => pair[1]));
  });

  test.each(READER_EXPECTATIONS)(
    "reads every supported wire-to-model %s pairing",
    (_, read, pairs) => {
      for (const [modelValue, wireValue] of pairs) {
        expect(read(SerializedValueReader.root(wireValue))).toBe(modelValue);
      }
    }
  );

  test("uses pinned literals in both directions for a complete document", () => {
    const document = serializeScore(new Score());
    const instrument = document.tracks[0].instrument;
    const staff = document.tracks[0].staves[0];
    const firstBeat = staff.bars[0].voices[0]?.beats[0];
    if (firstBeat === undefined) {
      throw Error("Expected default beat");
    }

    Reflect.set(document.masterBars[0], "duration", "eighth");
    Reflect.set(document.masterBars[0], "repeatStatus", "start");
    Reflect.set(staff, "clefType", "Bass");
    Reflect.set(instrument, "type", "Acoustic Guitar");
    Reflect.set(instrument, "tone", "Steel");
    Reflect.set(instrument, "program", 25);
    Reflect.set(instrument.tuning[0], "noteValue", "F#");
    Reflect.set(firstBeat, "notes", [
      {
        fret: 1,
        techniques: [
          {
            type: "bend",
            options: {
              type: "prebend-bend",
              prebendPitch: 1,
              bendPitch: 2,
              bendDuration: 0.5,
            },
          },
        ],
      },
      null,
      null,
      null,
      null,
      null,
    ]);

    const restored = deserializeScore(
      JSON.parse(JSON.stringify(document)) as unknown
    );
    const restoredInstrument = restored.tracks[0].context.instrument;
    const restoredBeat =
      restored.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];

    expect(restored.masterBars[0].duration).toBe(NoteDuration.Eighth);
    expect(restored.masterBars[0].repeatStatus).toBe(BarRepeatStatus.Start);
    expect(restored.tracks[0].staves[0].clefType).toBe(ClefType.Bass);
    expect(restoredInstrument).toBeInstanceOf(Guitar);
    expect((restoredInstrument as Guitar).type).toBe(
      StringInstrumentType.AcousticGuitar
    );
    expect((restoredInstrument as Guitar).tone).toBe(AcousticGuitarTone.Steel);
    expect((restoredInstrument as Guitar).tuning[0].noteValue).toBe(
      NoteValue.FSharp
    );
    expect(restoredBeat?.notes?.[0].techniques[0].type).toBe(
      GuitarTechniqueType.Bend
    );
    expect(serializeScore(restored)).toEqual(document);
  });
});
