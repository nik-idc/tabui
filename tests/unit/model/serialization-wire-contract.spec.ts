import {
  AcousticGuitarTone,
  BarRepeatStatus,
  BassGuitarTone,
  BendType,
  ClefType,
  ElectricGuitarTone,
  GuitarTechniqueType,
  InstrumentFamily,
  NoteDuration,
  NoteValue,
  OtherStringTone,
  StringInstrumentType,
  SerializedBendType,
  SerializedClefType,
  SerializedInstrumentFamily,
  SerializedNoteDuration,
  SerializedPlayableNoteValue,
  SerializedRepeatStatus,
  SerializedStringInstrumentTone,
  SerializedStringInstrumentType,
  SerializedTechniqueType,
} from "../../../src/notation/model";
import { SerializedValueReader } from "../../../src/notation/model/serialization/serialized-value-reader";
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
} from "../../../src/notation/model/serialization/v1/mappings";

type WirePair = readonly [PropertyKey, string];

const DURATIONS: readonly WirePair[] = [
  [NoteDuration.Whole, "whole"],
  [NoteDuration.Half, "half"],
  [NoteDuration.Quarter, "quarter"],
  [NoteDuration.Eighth, "eighth"],
  [NoteDuration.Sixteenth, "sixteenth"],
  [NoteDuration.ThirtySecond, "thirty-second"],
  [NoteDuration.SixtyFourth, "sixty-fourth"],
];
const REPEATS: readonly WirePair[] = [
  [BarRepeatStatus.None, "none"],
  [BarRepeatStatus.Start, "start"],
  [BarRepeatStatus.End, "end"],
];
const CLEFS: readonly WirePair[] = [
  [ClefType.Treble, "Treble"],
  [ClefType.Bass, "Bass"],
  [ClefType.Alto, "Alto"],
  [ClefType.Tenor, "Tenor"],
  [ClefType.Percussion, "Percussion"],
  [ClefType.Tab, "Tab"],
];
const TECHNIQUES: readonly WirePair[] = [
  [GuitarTechniqueType.Bend, "bend"],
  [GuitarTechniqueType.Legato, "hammer-on-or-pull-off"],
  [GuitarTechniqueType.LetRing, "let-ring"],
  [GuitarTechniqueType.NaturalHarmonic, "natural-harmonic"],
  [GuitarTechniqueType.PalmMute, "palm-mute"],
  [GuitarTechniqueType.PinchHarmonic, "pinch-harmonic"],
  [GuitarTechniqueType.Slide, "slide"],
  [GuitarTechniqueType.Vibrato, "vibrato"],
];
const BENDS: readonly WirePair[] = [
  [BendType.Bend, "bend"],
  [BendType.BendAndRelease, "bend-and-release"],
  [BendType.Hold, "hold"],
  [BendType.Prebend, "prebend"],
  [BendType.PrebendAndRelease, "prebend-and-release"],
  [BendType.PrebendBend, "prebend-bend"],
  [BendType.Release, "release"],
];
const TUNING_NOTES: readonly WirePair[] = [
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

const MAPPINGS: readonly [
  string,
  Record<PropertyKey, string | undefined>,
  readonly WirePair[],
][] = [
  ["durations", SERIALIZED_NOTE_DURATIONS, DURATIONS],
  ["repeats", SERIALIZED_REPEAT_STATUSES, REPEATS],
  ["clefs", SERIALIZED_CLEF_TYPES, CLEFS],
  ["techniques", SERIALIZED_TECHNIQUE_TYPES, TECHNIQUES],
  ["tuning notes", SERIALIZED_PLAYABLE_NOTE_VALUES, TUNING_NOTES],
  [
    "families",
    SERIALIZED_INSTRUMENT_FAMILIES,
    [[InstrumentFamily.Strings, "Strings"]],
  ],
  [
    "instrument types",
    SERIALIZED_STRING_INSTRUMENT_TYPES,
    [
      [StringInstrumentType.AcousticGuitar, "Acoustic Guitar"],
      [StringInstrumentType.ElectricGuitar, "Electric Guitar"],
      [StringInstrumentType.BassGuitar, "Bass Guitar"],
      [StringInstrumentType.Other, "Other"],
    ],
  ],
  [
    "tones",
    SERIALIZED_STRING_TONES,
    [
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
    ],
  ],
];

const READERS: readonly [
  string,
  (reader: SerializedValueReader) => unknown,
  readonly WirePair[],
][] = [
  ["durations", readNoteDuration, DURATIONS],
  ["repeats", readRepeatStatus, REPEATS],
  ["clefs", readClefType, CLEFS],
  ["techniques", readTechniqueType, TECHNIQUES],
  ["bend tokens", readBendType, BENDS],
  ["tuning notes", readNoteValue, TUNING_NOTES],
  ["families", readInstrumentFamily, [[InstrumentFamily.Strings, "Strings"]]],
  ["instrument types", readStringInstrumentType, MAPPINGS[6][2]],
  ["tones", readStringTone, MAPPINGS[7][2]],
];

const SERIALIZED_ENUMS = [
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
    "techniques",
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
    "bends",
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
    "clefs",
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
    "instrument types",
    SerializedStringInstrumentType,
    {
      AcousticGuitar: "Acoustic Guitar",
      ElectricGuitar: "Electric Guitar",
      BassGuitar: "Bass Guitar",
      Other: "Other",
    },
  ],
  [
    "instrument tones",
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

describe("V1 serialization wire contract", () => {
  test.each(SERIALIZED_ENUMS)(
    "pins public %s literals",
    (_, actual, expected) => {
      expect(actual).toEqual(expected);
    }
  );

  test("pins supported and unsupported instrument-family mappings", () => {
    expect(SERIALIZED_INSTRUMENT_FAMILIES).toEqual({
      [InstrumentFamily.Strings]: "Strings",
      [InstrumentFamily.Orchestra]: undefined,
      [InstrumentFamily.Drums]: undefined,
    });
  });

  test.each(MAPPINGS)(
    "maps every model %s value to V1",
    (_, mapping, pairs) => {
      for (const [model, wire] of pairs) {
        expect(mapping[model]).toBe(wire);
      }
    }
  );

  test.each(READERS)(
    "maps every V1 %s value to the model",
    (_, read, pairs) => {
      for (const [model, wire] of pairs) {
        expect(read(SerializedValueReader.root(wire))).toBe(model);
      }
    }
  );
});
