import {
  AcousticGuitarTone,
  BassGuitarTone,
  Beat,
  BendOptionsData,
  BendTechniqueOptions,
  BendType,
  ClefType,
  ElectricGuitarTone,
  Guitar,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  NoteValue,
  OtherStringTone,
  StringInstrumentType,
  StringInstrumentTone,
  Score,
  Staff,
  deserializeScore,
  serializeScore,
  SerializedBendType,
  SerializedClefType,
  SerializedInstrumentFamily,
  SerializedNoteDuration,
  SerializedPlayableNoteValue,
  SerializedStringInstrumentTone,
  SerializedStringInstrumentType,
  SerializedTechniqueType,
} from "../../../src/notation/model";

const DURATIONS: readonly (readonly [NoteDuration, string])[] = [
  [NoteDuration.Whole, "whole"],
  [NoteDuration.Half, "half"],
  [NoteDuration.Quarter, "quarter"],
  [NoteDuration.Eighth, "eighth"],
  [NoteDuration.Sixteenth, "sixteenth"],
  [NoteDuration.ThirtySecond, "thirty-second"],
  [NoteDuration.SixtyFourth, "sixty-fourth"],
];
const CLEFS: readonly (readonly [ClefType, string])[] = [
  [ClefType.Treble, "Treble"],
  [ClefType.Bass, "Bass"],
  [ClefType.Alto, "Alto"],
  [ClefType.Tenor, "Tenor"],
  [ClefType.Percussion, "Percussion"],
  [ClefType.Tab, "Tab"],
];
const TECHNIQUES: readonly (readonly [GuitarTechniqueType, string])[] = [
  [GuitarTechniqueType.Bend, "bend"],
  [GuitarTechniqueType.Legato, "hammer-on-or-pull-off"],
  [GuitarTechniqueType.LetRing, "let-ring"],
  [GuitarTechniqueType.NaturalHarmonic, "natural-harmonic"],
  [GuitarTechniqueType.PalmMute, "palm-mute"],
  [GuitarTechniqueType.PinchHarmonic, "pinch-harmonic"],
  [GuitarTechniqueType.Slide, "slide"],
  [GuitarTechniqueType.Vibrato, "vibrato"],
];
const BENDS: readonly (readonly [BendOptionsData, object])[] = [
  [
    { type: BendType.Bend, bendPitch: 1, bendDuration: 0.5 },
    { type: "bend", bendPitch: 1, bendDuration: 0.5 },
  ],
  [
    {
      type: BendType.BendAndRelease,
      bendPitch: 1,
      releasePitch: 0,
      bendDuration: 0.5,
    },
    {
      type: "bend-and-release",
      bendPitch: 1,
      releasePitch: 0,
      bendDuration: 0.5,
    },
  ],
  [
    { type: BendType.Hold, holdPitch: 1, bendDuration: 0.5 },
    { type: "hold", holdPitch: 1, bendDuration: 0.5 },
  ],
  [
    { type: BendType.Prebend, prebendPitch: 1 },
    { type: "prebend", prebendPitch: 1 },
  ],
  [
    {
      type: BendType.PrebendAndRelease,
      prebendPitch: 1,
      releasePitch: 0,
      bendDuration: 0.5,
    },
    {
      type: "prebend-and-release",
      prebendPitch: 1,
      releasePitch: 0,
      bendDuration: 0.5,
    },
  ],
  [
    {
      type: BendType.PrebendBend,
      prebendPitch: 1,
      bendPitch: 2,
      bendDuration: 0.5,
    },
    { type: "prebend-bend", prebendPitch: 1, bendPitch: 2, bendDuration: 0.5 },
  ],
  [
    { type: BendType.Release, releasePitch: 0, bendDuration: 0.5 },
    { type: "release", releasePitch: 0, bendDuration: 0.5 },
  ],
];
const TUNING_NOTES: readonly (readonly [NoteValue, string])[] = [
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

const INSTRUMENTS: readonly (readonly [
  StringInstrumentType,
  StringInstrumentTone,
  string,
  string,
  number,
])[] = [
  [
    StringInstrumentType.AcousticGuitar,
    AcousticGuitarTone.Nylon,
    "Acoustic Guitar",
    "Nylon",
    24,
  ],
  [
    StringInstrumentType.AcousticGuitar,
    AcousticGuitarTone.Steel,
    "Acoustic Guitar",
    "Steel",
    25,
  ],
  [
    StringInstrumentType.ElectricGuitar,
    ElectricGuitarTone.Clean,
    "Electric Guitar",
    "Electric Clean",
    27,
  ],
  [
    StringInstrumentType.ElectricGuitar,
    ElectricGuitarTone.Overdrive,
    "Electric Guitar",
    "Electric Overdrive",
    29,
  ],
  [
    StringInstrumentType.ElectricGuitar,
    ElectricGuitarTone.Distortion,
    "Electric Guitar",
    "Electric Distortion",
    30,
  ],
  [
    StringInstrumentType.BassGuitar,
    BassGuitarTone.Acoustic,
    "Bass Guitar",
    "Bass Acoustic",
    32,
  ],
  [
    StringInstrumentType.BassGuitar,
    BassGuitarTone.Clean,
    "Bass Guitar",
    "Bass Clean",
    33,
  ],
  [
    StringInstrumentType.BassGuitar,
    BassGuitarTone.Distortion,
    "Bass Guitar",
    "Bass Distortion",
    36,
  ],
  [StringInstrumentType.Other, OtherStringTone.Banjo, "Other", "Banjo", 25],
  [StringInstrumentType.Other, OtherStringTone.Ukulele, "Other", "Ukulele", 24],
];

// This table intentionally uses the serialized enum member names.
/* eslint-disable @typescript-eslint/naming-convention */
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
    "techniques",
    SerializedTechniqueType,
    {
      Bend: "bend",
      HammerOnOrPullOff: "hammer-on-or-pull-off",
      LetRing: "let-ring",
      Tie: "tie",
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
/* eslint-enable @typescript-eslint/naming-convention */

type WireTechnique = { type: string; options?: object };
type WireBeat = {
  notes: ({ fret: number; techniques: WireTechnique[] } | null)[] | null;
  duration: string;
  dots: number;
  tuplet: { normalCount: number; tupletCount: number } | null;
};

// Hand-written V1 document: neither serializer nor model defaults supply its values.
function wireDocument() {
  const rest: WireBeat = {
    notes: null,
    duration: "quarter",
    dots: 0,
    tuplet: null,
  };
  const voices: ({ beats: WireBeat[] } | null)[] = [
    { beats: [rest] },
    null,
    null,
    null,
  ];
  return {
    format: "tabui-score",
    version: 1,
    name: "Unknown",
    artist: "Unknown artist",
    song: "Unknown song",
    masterVolume: 1,
    masterPan: 0,
    masterBars: [
      {
        tempo: 120,
        beatsCount: 4,
        duration: "quarter",
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null as number | null,
      },
    ],
    tracks: [
      {
        name: "Track 1",
        volume: 0.5,
        pan: 0,
        muted: false,
        soloed: false,
        instrument: {
          family: "Strings",
          type: "Electric Guitar",
          tone: "Electric Clean",
          name: "Electric Guitar",
          program: 27,
          stringsCount: 6,
          fretsCount: 24,
          tuning: [
            { noteValue: "E", octave: 4 },
            { noteValue: "B", octave: 3 },
            { noteValue: "G", octave: 3 },
            { noteValue: "D", octave: 3 },
            { noteValue: "A", octave: 2 },
            { noteValue: "E", octave: 2 },
          ],
        },
        staves: [
          {
            clefType: "Treble",
            showTablature: true,
            showClassicNotation: false,
            bars: [{ voices }],
          },
        ],
      },
    ],
  };
}

function richDocument() {
  const document = wireDocument();
  Object.assign(document, {
    name: "Wire contract",
    artist: "Artist",
    song: "Song",
    masterVolume: 0.7,
    masterPan: -0.25,
  });
  // Both boundaries deliberately describe a complete, single-bar repeat.
  document.masterBars[0] = {
    tempo: 144,
    beatsCount: 7,
    duration: "eighth",
    isRepeatStart: true,
    isRepeatEnd: true,
    repeatCount: 3,
  };
  const track = document.tracks[0];
  Object.assign(track, {
    name: "Lead",
    volume: 0.35,
    pan: 0.4,
    muted: true,
    soloed: true,
  });
  const staff = track.staves[0];
  Object.assign(staff, {
    clefType: "Bass",
    showTablature: false,
    showClassicNotation: true,
  });
  staff.bars[0].voices = [
    null,
    {
      beats: [{ notes: null, duration: "quarter", dots: 0, tuplet: null }],
    },
    {
      beats: [
        { notes: null, duration: "eighth", dots: 1, tuplet: null },
        {
          notes: [null, null, null, null, null, null],
          duration: "quarter",
          dots: 0,
          tuplet: null,
        },
        {
          notes: [
            {
              fret: 3,
              techniques: [
                {
                  type: "bend",
                  options: { type: "bend", bendPitch: 1, bendDuration: 0.5 },
                },
              ],
            },
            { fret: -1, techniques: [] },
            null,
            null,
            null,
            {
              fret: 0,
              techniques: [{ type: "let-ring" }],
            },
          ],
          duration: "eighth",
          dots: 0,
          tuplet: { normalCount: 3, tupletCount: 2 },
        },
      ],
    },
    null,
  ];
  return document;
}

function guitarNote(beat: Beat | undefined, index = 0): GuitarNote {
  const note = beat?.notes?.[index];
  if (!(note instanceof GuitarNote)) {
    throw Error("Expected guitar note lane");
  }
  return note;
}

function populatedVoice(score: Score) {
  const bar = score.tracks[0].staves[0].bars[0];
  const voice = bar.insertVoiceBar(1, []);
  const beats = [
    new Beat(voice, voice.trackContext),
    new Beat(voice, voice.trackContext),
  ];
  guitarNote(beats[0]).setFret(3);
  guitarNote(beats[1]).setFret(5);
  voice.replaceBeats(beats);
  return voice;
}

function richScore(): Score {
  const score = new Score([], "Wire contract", "Artist", "Song");
  score.masterVolume = 0.7;
  score.masterPan = -0.25;
  Object.assign(score.masterBars[0], {
    tempo: 144,
    beatsCount: 7,
    duration: NoteDuration.Eighth,
    isRepeatStart: true,
    isRepeatEnd: true,
    repeatCount: 3,
  });
  const track = score.tracks[0];
  track.name = "Lead";
  track.volume = 0.35;
  track.pan = 0.4;
  track.muted = true;
  track.soloed = true;
  track.insertStaff(
    1,
    new Staff(track, track.context, [], ClefType.Bass, false, true)
  );
  track.removeStaff(0);
  const bar = track.staves[0].bars[0];
  bar.insertVoiceBar(2, []);
  bar.removeVoiceBar(1);
  const voice = bar.insertVoiceBar(3, []);
  const rest = new Beat(
    voice,
    voice.trackContext,
    null,
    NoteDuration.Eighth,
    1
  );
  const emptyLanes = new Beat(voice, voice.trackContext);
  const notes = new Beat(
    voice,
    voice.trackContext,
    [],
    NoteDuration.Eighth,
    0,
    {
      normalCount: 3,
      tupletCount: 2,
    }
  );
  guitarNote(notes).setFret(3);
  guitarNote(notes, 1).setFret(-1);
  guitarNote(notes, 5).setFret(0);
  voice.replaceBeats([rest, emptyLanes, notes]);
  expect(
    guitarNote(notes).setTechnique(
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1,
        bendDuration: 0.5,
      })
    )
  ).toBe(true);
  expect(guitarNote(notes, 5).setTechnique(GuitarTechniqueType.LetRing)).toBe(
    true
  );
  return score;
}

describe("V1 serialization wire contract", () => {
  test.each(SERIALIZED_ENUMS)(
    "pins public %s literals",
    (_, actual, expected) => {
      expect(actual).toEqual(expected);
    }
  );

  test("writes the complete default document with explicit nulls and defaults", () => {
    expect(serializeScore(new Score())).toStrictEqual(wireDocument());
  });

  test("writes exact V1 fields without owners, identities, or derived timing", () => {
    const score = richScore();
    const voice = score.tracks[0].staves[0].bars[0].getVoiceBar(3);
    // Exact object comparison checks exclusion before JSON can discard undefined fields.
    expect(voice?.actualTicks).toBeGreaterThan(0);
    expect(voice?.beats[2].startTick).toBeGreaterThan(0);
    expect(serializeScore(score)).toStrictEqual(richDocument());
  });

  test("reads a literal V1 document without collapsing absent voices, rests, or empty note lanes", () => {
    const score = deserializeScore(richDocument());
    expect(score).toMatchObject({
      name: "Wire contract",
      artist: "Artist",
      song: "Song",
      masterVolume: 0.7,
      masterPan: -0.25,
    });
    expect(score.masterBars).toHaveLength(1);
    expect(score.masterBars[0]).toMatchObject({
      tempo: 144,
      beatsCount: 7,
      duration: NoteDuration.Eighth,
      isRepeatStart: true,
      isRepeatEnd: true,
      repeatCount: 3,
    });
    expect(score.isMasterBarRepeatStatusValid(score.masterBars[0])).toBe(true);
    expect(score.tracks).toHaveLength(1);
    const track = score.tracks[0];
    expect(track).toMatchObject({
      name: "Lead",
      volume: 0.35,
      pan: 0.4,
      muted: true,
      soloed: true,
    });
    expect(track.context.instrument).toMatchObject({
      family: "Strings",
      type: StringInstrumentType.ElectricGuitar,
      tone: ElectricGuitarTone.Clean,
      name: "Electric Guitar",
      program: 27,
      stringsCount: 6,
      fretsCount: 24,
      tuning: [
        { noteValue: NoteValue.E, octave: 4 },
        { noteValue: NoteValue.B, octave: 3 },
        { noteValue: NoteValue.G, octave: 3 },
        { noteValue: NoteValue.D, octave: 3 },
        { noteValue: NoteValue.A, octave: 2 },
        { noteValue: NoteValue.E, octave: 2 },
      ],
    });
    expect(track.staves).toHaveLength(1);
    const staff = track.staves[0];
    expect(staff).toMatchObject({
      clefType: ClefType.Bass,
      showTablature: false,
      showClassicNotation: true,
    });
    expect(staff.bars).toHaveLength(1);
    const bar = staff.bars[0];
    expect(bar.getVoiceBar(1)).toBeNull();
    expect(bar.getVoiceBar(2)?.isEmpty()).toBe(false);
    expect(bar.getVoiceBar(2)?.beats).toHaveLength(1);
    expect(bar.getVoiceBar(2)?.beats[0].notes).toBeNull();
    expect(bar.getVoiceBar(4)).toBeNull();
    const beats = bar.getVoiceBar(3)?.beats;
    expect(beats).toHaveLength(3);
    expect(beats?.[0]).toMatchObject({
      notes: null,
      baseDuration: NoteDuration.Eighth,
      dots: 1,
      tupletSettings: null,
    });
    expect(beats?.[1].notes?.map((n) => (n as GuitarNote).fret)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(beats?.[2]).toMatchObject({
      baseDuration: NoteDuration.Eighth,
      dots: 0,
      tupletSettings: { normalCount: 3, tupletCount: 2 },
    });
    expect(beats?.[2].notes?.map((n) => (n as GuitarNote).fret)).toEqual([
      3,
      -1,
      null,
      null,
      null,
      0,
    ]);
    expect(beats?.[2].notes?.[0].techniques[0]).toMatchObject({
      type: GuitarTechniqueType.Bend,
      bendOptions: { type: BendType.Bend, bendPitch: 1, bendDuration: 0.5 },
    });
    expect(beats?.[2].notes?.[5].techniques.map((t) => t.type)).toEqual([
      GuitarTechniqueType.LetRing,
    ]);
  });

  test.each(DURATIONS)(
    "writes and reads duration %s as literal %s",
    (model, wire) => {
      const score = new Score();
      score.masterBars[0].duration = model;
      const voice = populatedVoice(score);
      voice.beats[0].baseDuration = model;
      const output = serializeScore(score);
      expect(output.masterBars[0].duration).toBe(wire);
      expect(
        output.tracks[0].staves[0].bars[0].voices[0]?.beats[0].duration
      ).toBe(wire);

      const input = wireDocument();
      input.masterBars[0].duration = wire;
      input.tracks[0].staves[0].bars[0].voices[0] = {
        beats: [{ notes: null, duration: wire, dots: 0, tuplet: null }],
      };
      const restored = deserializeScore(input);
      expect(restored.masterBars[0].duration).toBe(model);
      expect(
        restored.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0]
          .baseDuration
      ).toBe(model);
    }
  );

  test.each(CLEFS)("writes and reads clef %s as literal %s", (model, wire) => {
    const score = new Score();
    const track = score.tracks[0];
    track.insertStaff(1, new Staff(track, track.context, [], model));
    track.removeStaff(0);
    expect(serializeScore(score).tracks[0].staves[0].clefType).toBe(wire);

    const input = wireDocument();
    input.tracks[0].staves[0].clefType = wire;
    expect(deserializeScore(input).tracks[0].staves[0].clefType).toBe(model);
  });

  test.each(INSTRUMENTS)(
    "writes and reads instrument %s / %s with fixed V1 tokens",
    (type, tone, wireType, wireTone, program) => {
      const score = new Score();
      score.tracks[0].setInstrument(new Guitar(type, tone));
      expect(serializeScore(score).tracks[0].instrument).toMatchObject({
        family: "Strings",
        type: wireType,
        tone: wireTone,
        program,
      });

      const input = wireDocument();
      Object.assign(input.tracks[0].instrument, {
        type: wireType,
        tone: wireTone,
        program,
      });
      expect(
        deserializeScore(input).tracks[0].context.instrument
      ).toMatchObject({ type, tone, program });
    }
  );

  test.each(TUNING_NOTES)(
    "writes and reads tuning pitch %s as literal %s",
    (model, wire) => {
      const score = new Score();
      const tuning = new Guitar().tuning.map((n) => ({ ...n }));
      tuning[0] = { noteValue: model, octave: 4 };
      score.tracks[0].setInstrument(
        new Guitar(
          StringInstrumentType.ElectricGuitar,
          ElectricGuitarTone.Clean,
          "Electric Guitar",
          6,
          tuning
        )
      );
      expect(serializeScore(score).tracks[0].instrument.tuning[0]).toEqual({
        noteValue: wire,
        octave: 4,
      });

      const input = wireDocument();
      input.tracks[0].instrument.tuning[0].noteValue = wire;
      const instrument = deserializeScore(input).tracks[0].context.instrument;
      expect(instrument).toBeInstanceOf(Guitar);
      expect((instrument as Guitar).tuning[0]).toEqual({
        noteValue: model,
        octave: 4,
      });
    }
  );

  test.each(TECHNIQUES)(
    "writes and reads technique %s as literal %s",
    (model, wire) => {
      const score = new Score();
      const voice = populatedVoice(score);
      const options =
        model === GuitarTechniqueType.Bend
          ? new BendTechniqueOptions({
              type: BendType.Bend,
              bendPitch: 1,
              bendDuration: 0.5,
            })
          : undefined;
      expect(guitarNote(voice.beats[0]).setTechnique(model, options)).toBe(
        true
      );
      const expected: WireTechnique =
        wire === "bend"
          ? {
              type: "bend",
              options: { type: "bend", bendPitch: 1, bendDuration: 0.5 },
            }
          : { type: wire };
      expect(
        serializeScore(score).tracks[0].staves[0].bars[0].voices[0]?.beats[0]
          .notes?.[0]?.techniques
      ).toStrictEqual([expected]);

      const input = wireDocument();
      input.tracks[0].staves[0].bars[0].voices[0] = {
        beats: [
          {
            notes: [
              { fret: 3, techniques: [expected] },
              null,
              null,
              null,
              null,
              null,
            ],
            duration: "quarter",
            dots: 0,
            tuplet: null,
          },
          {
            notes: [{ fret: 5, techniques: [] }, null, null, null, null, null],
            duration: "quarter",
            dots: 0,
            tuplet: null,
          },
        ],
      };
      const restored = deserializeScore(input);
      const beat =
        restored.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
      expect(guitarNote(beat).techniques.map((t) => t.type)).toEqual([model]);
    }
  );

  test.each(BENDS)(
    "writes and reads bend shape %j with exact V1 option fields",
    (model, wire) => {
      const score = new Score();
      const voice = populatedVoice(score);
      expect(
        guitarNote(voice.beats[0]).setTechnique(
          GuitarTechniqueType.Bend,
          new BendTechniqueOptions(model)
        )
      ).toBe(true);
      expect(
        serializeScore(score).tracks[0].staves[0].bars[0].voices[0]?.beats[0]
          .notes?.[0]?.techniques
      ).toStrictEqual([{ type: "bend", options: wire }]);

      const input = wireDocument();
      input.tracks[0].staves[0].bars[0].voices[0] = {
        beats: [
          {
            notes: [
              { fret: 3, techniques: [{ type: "bend", options: wire }] },
              null,
              null,
              null,
              null,
              null,
            ],
            duration: "quarter",
            dots: 0,
            tuplet: null,
          },
        ],
      };
      const restored = deserializeScore(input);
      const beat =
        restored.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
      expect(guitarNote(beat).techniques[0]).toMatchObject({
        type: GuitarTechniqueType.Bend,
        bendOptions: model,
      });
    }
  );
});
