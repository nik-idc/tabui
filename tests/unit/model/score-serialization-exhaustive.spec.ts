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

const INSTRUMENTS: readonly [StringInstrumentType, StringInstrumentTone][] = [
  [StringInstrumentType.AcousticGuitar, AcousticGuitarTone.Nylon],
  [StringInstrumentType.AcousticGuitar, AcousticGuitarTone.Steel],
  [StringInstrumentType.ElectricGuitar, ElectricGuitarTone.Clean],
  [StringInstrumentType.ElectricGuitar, ElectricGuitarTone.Overdrive],
  [StringInstrumentType.ElectricGuitar, ElectricGuitarTone.Distortion],
  [StringInstrumentType.BassGuitar, BassGuitarTone.Acoustic],
  [StringInstrumentType.BassGuitar, BassGuitarTone.Clean],
  [StringInstrumentType.BassGuitar, BassGuitarTone.Distortion],
  [StringInstrumentType.Other, OtherStringTone.Banjo],
  [StringInstrumentType.Other, OtherStringTone.Ukulele],
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

const BEND_TOKENS = [
  "bend",
  "bend-and-release",
  "hold",
  "prebend",
  "prebend-and-release",
  "prebend-bend",
  "release",
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
  test.each(INSTRUMENTS)("round trips %s with tone %s", (type, tone) => {
    const score = new Score();
    const tuning = DEFAULT_TUNINGS[6].Standard.map((n) => ({ ...n }));
    score.tracks[0].setInstrument(
      new Guitar(type, tone, `${type} ${tone}`, 6, tuning, 24)
    );

    const restored = jsonRoundTrip(score);
    const instrument = restored.tracks[0].context.instrument;

    expect(instrument).toBeInstanceOf(Guitar);
    expect((instrument as Guitar).type).toBe(type);
    expect((instrument as Guitar).tone).toBe(tone);
    expect(serializeScore(restored)).toEqual(serializeScore(score));
  });

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
      note.fret = i + 1;
      note.setTechnique(
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions(options)
      );
      return beat;
    });
    voice.replaceBeats(beats);

    const restored = jsonRoundTrip(score);
    const restoredBeats =
      restored.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats;

    expect(
      restoredBeats?.map((b) => {
        const technique = b.notes?.[0]?.techniques[0];
        return technique instanceof GuitarTechnique
          ? technique.bendOptions?.type
          : undefined;
      })
    ).toEqual(BENDS.map((b) => b.type));
    expect(
      serializeScore(score).tracks[0].staves[0].bars[0].voices[0]?.beats.map(
        (b) => {
          const technique = b.notes?.[0]?.techniques[0];
          return technique?.type === "bend" ? technique.options.type : null;
        }
      )
    ).toEqual(BEND_TOKENS);
    expect(serializeScore(restored)).toEqual(serializeScore(score));
    expectOwnership(restored);
  });

  test("round trips every non-bend technique", () => {
    const score = new Score();
    const voice = score.tracks[0].staves[0].bars[0].getVoiceBar(1);
    if (voice === null) {
      throw Error("Expected default voice");
    }
    const beats = NON_BEND_TECHNIQUES.map((type, i) => {
      const beat = new Beat(voice, voice.trackContext);
      const note = beat.notes?.[0];
      if (!(note instanceof GuitarNote)) {
        throw Error("Expected guitar note");
      }
      note.fret = i + 1;
      note.setTechnique(type);
      return beat;
    });
    voice.replaceBeats(beats);

    const restored = jsonRoundTrip(score);
    const types = restored.tracks[0].staves[0].bars[0]
      .getVoiceBar(1)
      ?.beats.map((b) => b.notes?.[0]?.techniques[0].type);

    expect(types).toEqual(NON_BEND_TECHNIQUES);
    expect(serializeScore(restored)).toEqual(serializeScore(score));
  });

  test("rebuilds a multi-track graph with fresh identities and timing", () => {
    const score = new Score();
    const firstTrack = score.tracks[0];
    firstTrack.insertStaff(1);
    score.addTrack(new Guitar(), "Track 2");
    score.appendMasterBar();
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
    expect(restoredIds).not.toEqual(sourceIds);
    expectOwnership(restored);
    expect(restoredVoice.actualTicks).toBeGreaterThan(0);
    expect(restoredVoice.tickResolution).toBeGreaterThan(1);
    expect(restoredVoice.actualTicks).toBe(voice.actualTicks);
    expect(restoredVoice.beats.map((b) => b.startTick)).toEqual(
      voice.beats.map((b) => b.startTick)
    );
    expect(restoredVoice.beats.map((b) => b.endTick)).toEqual(
      voice.beats.map((b) => b.endTick)
    );
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
