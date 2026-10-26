import {
  AcousticGuitarTone,
  BassGuitarTone,
  Beat,
  BendOptionsData,
  BendTechniqueOptions,
  BendType,
  DEFAULT_TUNINGS,
  ElectricGuitarTone,
  Guitar,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
  OtherStringTone,
  Score,
  StringInstrumentTone,
  StringInstrumentType,
  deserializeScore,
  serializeScore,
} from "../../../src/notation/model";

const INSTRUMENTS: readonly [
  StringInstrumentType,
  StringInstrumentTone,
  number,
][] = [
  [StringInstrumentType.AcousticGuitar, AcousticGuitarTone.Nylon, 24],
  [StringInstrumentType.AcousticGuitar, AcousticGuitarTone.Steel, 25],
  [StringInstrumentType.ElectricGuitar, ElectricGuitarTone.Clean, 27],
  [StringInstrumentType.ElectricGuitar, ElectricGuitarTone.Overdrive, 29],
  [StringInstrumentType.ElectricGuitar, ElectricGuitarTone.Distortion, 30],
  [StringInstrumentType.BassGuitar, BassGuitarTone.Acoustic, 32],
  [StringInstrumentType.BassGuitar, BassGuitarTone.Clean, 33],
  [StringInstrumentType.BassGuitar, BassGuitarTone.Distortion, 36],
  [StringInstrumentType.Other, OtherStringTone.Banjo, 25],
  [StringInstrumentType.Other, OtherStringTone.Ukulele, 24],
];

const BENDS: readonly BendOptionsData[] = [
  { type: BendType.Bend, bendPitch: 1, bendDuration: 0.25 },
  {
    type: BendType.BendAndRelease,
    bendPitch: 1,
    releasePitch: 0,
    bendDuration: 0.5,
  },
  { type: BendType.Hold, holdPitch: 2, bendDuration: 0.75 },
  { type: BendType.Prebend, prebendPitch: 0.5 },
  {
    type: BendType.PrebendAndRelease,
    prebendPitch: 1,
    releasePitch: 0,
    bendDuration: 1,
  },
  {
    type: BendType.PrebendBend,
    prebendPitch: 0.5,
    bendPitch: 2,
    bendDuration: 0.6,
  },
  { type: BendType.Release, releasePitch: 0.25, bendDuration: 0.4 },
];

const SERIALIZED_BENDS = [
  { type: "bend", bendPitch: 1, bendDuration: 0.25 },
  {
    type: "bend-and-release",
    bendPitch: 1,
    releasePitch: 0,
    bendDuration: 0.5,
  },
  { type: "hold", holdPitch: 2, bendDuration: 0.75 },
  { type: "prebend", prebendPitch: 0.5 },
  {
    type: "prebend-and-release",
    prebendPitch: 1,
    releasePitch: 0,
    bendDuration: 1,
  },
  { type: "prebend-bend", prebendPitch: 0.5, bendPitch: 2, bendDuration: 0.6 },
  { type: "release", releasePitch: 0.25, bendDuration: 0.4 },
];

const NON_BEND_TECHNIQUES: readonly GuitarTechniqueType[] = [
  GuitarTechniqueType.Legato,
  GuitarTechniqueType.LetRing,
  GuitarTechniqueType.NaturalHarmonic,
  GuitarTechniqueType.PalmMute,
  GuitarTechniqueType.PinchHarmonic,
  GuitarTechniqueType.Slide,
  GuitarTechniqueType.Vibrato,
];

function jsonRoundTrip(score: Score): Score {
  return deserializeScore(
    JSON.parse(JSON.stringify(serializeScore(score))) as unknown
  );
}

function expectOwnership(score: Score): void {
  for (const track of score.tracks) {
    expect(track.score).toBe(score);
    for (const staff of track.staves) {
      expect(staff.track).toBe(track);
      expect(staff.trackContext).toBe(track.context);
      for (let i = 0; i < staff.bars.length; i++) {
        const bar = staff.bars[i];
        expect(bar.staff).toBe(staff);
        expect(bar.masterBar).toBe(score.masterBars[i]);
        expect(bar.trackContext).toBe(track.context);
        for (const voice of bar.voiceBarsAsArray) {
          expect(voice.bar).toBe(bar);
          expect(voice.trackContext).toBe(track.context);
          for (const beat of voice.beats) {
            expect(beat.voiceBar).toBe(voice);
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

describe("exhaustive V1 score serialization", () => {
  test.each(INSTRUMENTS)(
    "round trips %s with tone %s",
    (type, tone, program) => {
      const score = new Score();
      const tuning = DEFAULT_TUNINGS[6].Standard.map((n) => ({ ...n }));
      score.tracks[0].setInstrument(
        new Guitar(type, tone, `${type} ${tone}`, 6, tuning, 24)
      );

      const restored = jsonRoundTrip(score);
      const instrument = restored.tracks[0].context.instrument;

      expect(instrument).toBeInstanceOf(Guitar);
      expect(instrument).toMatchObject({
        type,
        tone,
        name: `${type} ${tone}`,
        program,
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
      });
      expect(serializeScore(score).tracks[0].instrument).toMatchObject({
        type,
        tone,
        program,
        stringsCount: 6,
        fretsCount: 24,
      });
      expect(serializeScore(restored)).toEqual(serializeScore(score));
    }
  );

  test("round trips all bend shapes and reconstructs their owners", () => {
    const score = new Score();
    const voice = score.tracks[0].staves[0].bars[0].getVoiceBar(1);
    if (voice === null) {
      throw Error("Expected default voice");
    }
    const beats = BENDS.map((options, i) => {
      const beat = new Beat(voice, voice.trackContext);
      const note = beat.notes?.[0];
      if (!(note instanceof GuitarNote)) {
        throw Error("Expected guitar note");
      }
      note.setFret(i + 1);
      expect(
        note.setTechnique(
          GuitarTechniqueType.Bend,
          new BendTechniqueOptions(options)
        )
      ).toBe(true);
      return beat;
    });
    voice.replaceBeats(beats);

    const restored = jsonRoundTrip(score);
    const restoredBeats =
      restored.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats;

    expect(restoredBeats).toHaveLength(7);
    for (let i = 0; i < BENDS.length; i++) {
      const technique = restoredBeats?.[i].notes?.[0]?.techniques[0];
      expect(technique).toBeInstanceOf(GuitarTechnique);
      if (!(technique instanceof GuitarTechnique)) {
        throw Error("Expected restored bend technique");
      }
      expect(technique.bendOptions).toEqual(BENDS[i]);
    }
    expect(
      serializeScore(score).tracks[0].staves[0].bars[0].voices[0]?.beats.map(
        (b) => {
          const technique = b.notes?.[0]?.techniques[0];
          return technique?.type === "bend" ? technique.options : null;
        }
      )
    ).toEqual(SERIALIZED_BENDS);
    expect(serializeScore(restored)).toEqual(serializeScore(score));
    expectOwnership(restored);
  });

  test("round trips every non-bend technique", () => {
    const score = new Score();
    const voice = score.tracks[0].staves[0].bars[0].getVoiceBar(1);
    if (voice === null) {
      throw Error("Expected default voice");
    }

    const beats = Array.from(
      { length: NON_BEND_TECHNIQUES.length },
      () => new Beat(voice, voice.trackContext)
    );
    for (let i = 0; i < beats.length; i++) {
      const note = beats[i].notes?.[0];
      if (!(note instanceof GuitarNote)) {
        throw Error("Expected guitar note");
      }
      note.setFret(i + 1);
    }
    voice.replaceBeats(beats);
    for (let i = 0; i < beats.length; i++) {
      const note = beats[i].notes?.[0];
      if (!(note instanceof GuitarNote)) {
        throw Error("Expected guitar note");
      }
      expect(note.setTechnique(NON_BEND_TECHNIQUES[i])).toBe(true);
    }

    const restored = jsonRoundTrip(score);
    const types = restored.tracks[0].staves[0].bars[0]
      .getVoiceBar(1)
      ?.beats.map((b) => b.notes?.[0]?.techniques[0].type);

    expect(types).toEqual(NON_BEND_TECHNIQUES);
    expect(
      serializeScore(score).tracks[0].staves[0].bars[0].voices[0]?.beats.map(
        (b) => b.notes?.[0]?.techniques
      )
    ).toEqual([
      [{ type: "hammer-on-or-pull-off" }],
      [{ type: "let-ring" }],
      [{ type: "natural-harmonic" }],
      [{ type: "palm-mute" }],
      [{ type: "pinch-harmonic" }],
      [{ type: "slide" }],
      [{ type: "vibrato" }],
    ]);
    const restoredStaff = restored.tracks[0].staves[0];
    const restoredBeats = restoredStaff.bars[0].getVoiceBar(1)?.beats;
    for (const index of [0, 5]) {
      const source = restoredBeats?.[index].notes?.[0];
      if (!(source instanceof GuitarNote)) {
        throw Error("Expected restored transition source");
      }
      expect(source.fret).toBe(index + 1);
      expect(restoredStaff.getNextNote(source)).toBe(
        restoredBeats?.[index + 1].notes?.[0]
      );
    }
    expectOwnership(restored);
    expect(serializeScore(restored)).toEqual(serializeScore(score));
  });

  test("rebuilds a multi-track graph with fresh identities and timing", () => {
    const score = new Score();
    const firstTrack = score.tracks[0];
    firstTrack.insertStaff(1);
    score.addTrack(new Guitar(), "Track 2");
    score.appendMasterBar();
    score.masterBars[1].tempo = 96;
    score.masterBars[1].beatsCount = 6;
    score.masterBars[1].duration = NoteDuration.Eighth;
    const voice = firstTrack.staves[0].bars[0].getVoiceBar(1);
    if (voice === null) {
      throw Error("Expected default voice");
    }
    const beats = [0, 1, 2].map(
      () =>
        new Beat(voice, voice.trackContext, [], NoteDuration.Eighth, 0, {
          normalCount: 3,
          tupletCount: 2,
        })
    );
    voice.replaceBeats(beats);
    const sourceIds = [
      score.masterBars[0].uuid,
      firstTrack.uuid,
      firstTrack.staves[0].uuid,
      firstTrack.staves[0].bars[0].uuid,
      voice.uuid,
      beats[0].uuid,
    ];

    const restored = jsonRoundTrip(score);
    const restoredVoice = restored.tracks[0].staves[0].bars[0].getVoiceBar(1);
    if (restoredVoice === null) {
      throw Error("Expected restored voice");
    }
    expect(serializeScore(score).masterBars).toEqual([
      {
        tempo: 120,
        beatsCount: 4,
        duration: "quarter",
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      },
      {
        tempo: 96,
        beatsCount: 6,
        duration: "eighth",
        isRepeatStart: false,
        isRepeatEnd: false,
        repeatCount: null,
      },
    ]);
    const restoredIds = [
      restored.masterBars[0].uuid,
      restored.tracks[0].uuid,
      restored.tracks[0].staves[0].uuid,
      restored.tracks[0].staves[0].bars[0].uuid,
      restoredVoice.uuid,
      restoredVoice.beats[0].uuid,
    ];

    expect(restored.tracks).toHaveLength(2);
    expect(restored.tracks[0].staves).toHaveLength(2);
    expect(restored.masterBars).toHaveLength(2);
    expect(
      restored.tracks.map((t) => t.staves.map((s) => s.bars.length))
    ).toEqual([[2, 2], [2]]);
    expect(restored.tracks[1].name).toBe("Track 2");
    for (let i = 0; i < sourceIds.length; i++) {
      expect(restoredIds[i]).not.toBe(sourceIds[i]);
    }
    expect(restored).not.toBe(score);
    expect(restored.masterBars[0]).not.toBe(score.masterBars[0]);
    expect(restored.tracks[0]).not.toBe(firstTrack);
    expect(restored.tracks[0].staves[0]).not.toBe(firstTrack.staves[0]);
    expect(restoredVoice.bar).not.toBe(voice.bar);
    expect(restoredVoice).not.toBe(voice);
    expect(restoredVoice.beats[0]).not.toBe(beats[0]);
    expect(restored.masterBars[1]).toMatchObject({
      tempo: 96,
      beatsCount: 6,
      duration: NoteDuration.Eighth,
    });
    expectOwnership(restored);
    expect(restoredVoice.actualTicks).toBeGreaterThan(0);
    expect(restoredVoice.tickResolution).toBeGreaterThan(1);
    expect(restoredVoice.tickResolution).toBe(voice.tickResolution);
    expect(restoredVoice.actualTicks).toBe(voice.actualTicks);
    expect(restoredVoice.beats.map((b) => b.startTick)).toEqual(
      voice.beats.map((b) => b.startTick)
    );
    expect(restoredVoice.beats.map((b) => b.endTick)).toEqual(
      voice.beats.map((b) => b.endTick)
    );
    // Three eighth-note triplets occupy one quarter note, regardless of tick resolution.
    expect(restoredVoice.actualTicks / restoredVoice.tickResolution).toBe(
      1 / 4
    );
    expect(
      restoredVoice.beats.map((b) => b.startTick / restoredVoice.tickResolution)
    ).toEqual([0, 1 / 12, 1 / 6]);
    expect(
      restoredVoice.beats.map((b) => b.endTick / restoredVoice.tickResolution)
    ).toEqual([1 / 12, 1 / 6, 1 / 4]);
    expect(restoredVoice.beats.map((b) => b.tupletSettings)).toEqual([
      { normalCount: 3, tupletCount: 2 },
      { normalCount: 3, tupletCount: 2 },
      { normalCount: 3, tupletCount: 2 },
    ]);
    expect(restoredVoice.beats.map((b) => b.beamGroupId)).toEqual([0, 0, 0]);
    expect(restoredVoice.beats.map((b) => b.lastInBeamGroup)).toEqual([
      false,
      false,
      true,
    ]);
  });
});
