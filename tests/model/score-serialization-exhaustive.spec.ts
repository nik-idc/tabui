import {
  AcousticGuitarTone,
  BarRepeatStatus,
  BassGuitarTone,
  Beat,
  BendOptionsData,
  BendTechniqueOptions,
  BendType,
  ClefType,
  DEFAULT_TUNINGS,
  deserializeScore,
  ElectricGuitarTone,
  Guitar,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
  NoteType,
  NoteValue,
  OPTIONS_PER_BEND_TYPE,
  OtherStringTone,
  Score,
  serializeScore,
  Staff,
  STRING_TONES,
  StringInstrumentTone,
  StringInstrumentType,
  Track,
  TupletSettings,
  VoiceBar,
  VoiceNumber,
  VOICE_NUMBERS,
} from "../../src/notation/model";

type ToneCase = readonly [StringInstrumentType, StringInstrumentTone];

const TONE_CASES: readonly ToneCase[] = [
  [StringInstrumentType.AcousticGuitar, AcousticGuitarTone.Nylon],
  [StringInstrumentType.AcousticGuitar, AcousticGuitarTone.Steel],
  [StringInstrumentType.ElectricGuitar, ElectricGuitarTone.Clean],
  [StringInstrumentType.ElectricGuitar, ElectricGuitarTone.Overdrive],
  [StringInstrumentType.BassGuitar, BassGuitarTone.Acoustic],
  [StringInstrumentType.BassGuitar, BassGuitarTone.Clean],
  [StringInstrumentType.BassGuitar, BassGuitarTone.Distortion],
  [StringInstrumentType.Other, OtherStringTone.Banjo],
  [StringInstrumentType.Other, OtherStringTone.Ukulele],
  [StringInstrumentType.ElectricGuitar, ElectricGuitarTone.Distortion],
];

const BEND_OPTIONS: readonly BendOptionsData[] = [
  { type: BendType.Bend, bendPitch: 1, bendDuration: 0.25 },
  {
    type: BendType.BendAndRelease,
    bendPitch: 1.5,
    releasePitch: 0.5,
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
    bendPitch: 2.5,
    bendDuration: 0.6,
  },
  { type: BendType.Release, releasePitch: 0.25, bendDuration: 0.4 },
];

const MASTER_BAR_DATA = [
  [1, 1, NoteDuration.Whole, BarRepeatStatus.None, null],
  [48, 5, NoteDuration.Half, BarRepeatStatus.Start, null],
  [96, 7, NoteDuration.Quarter, BarRepeatStatus.End, 2],
  [120, 9, NoteDuration.Eighth, BarRepeatStatus.None, null],
  [180, 11, NoteDuration.Sixteenth, BarRepeatStatus.Start, null],
  [240, 13, NoteDuration.ThirtySecond, BarRepeatStatus.End, 5],
  [999, 32, NoteDuration.SixtyFourth, BarRepeatStatus.None, null],
  [72, 15, NoteDuration.Quarter, BarRepeatStatus.End, 9],
  [320, 17, NoteDuration.Eighth, BarRepeatStatus.None, null],
] as const;

const CLEFS = Object.values(ClefType);
const SPARSE_VOICES: readonly (readonly VoiceNumber[])[] = [
  [1],
  [2],
  [1, 3],
  [1, 3, 4],
  [1, 2, 3, 4],
];

function cloneTuning(tuning: readonly NoteType[]): NoteType[] {
  return tuning.map((n) => ({ noteValue: n.noteValue, octave: n.octave }));
}

function tuningFor(stringsCount: number): NoteType[] {
  switch (stringsCount) {
    case 1:
      return cloneTuning(DEFAULT_TUNINGS[1].Standard);
    case 2:
      return [
        { noteValue: NoteValue.C, octave: 4 },
        { noteValue: NoteValue.G, octave: 3 },
      ];
    case 3:
      return cloneTuning(DEFAULT_TUNINGS[3].Standard);
    case 4:
      return cloneTuning(DEFAULT_TUNINGS[4].BassStandard);
    case 5:
      return cloneTuning(DEFAULT_TUNINGS[5].BanjoStandard);
    case 6:
      return cloneTuning(DEFAULT_TUNINGS[6].GuitarDropD);
    case 7:
      return cloneTuning(DEFAULT_TUNINGS[7].Standard);
    case 8:
      return cloneTuning(DEFAULT_TUNINGS[8].Standard);
    case 9:
      return cloneTuning(DEFAULT_TUNINGS[9].Standard);
    default:
      throw Error(`Unsupported fixture string count ${stringsCount}`);
  }
}

function enumNumbers(value: object): number[] {
  return Object.values(value).filter((v): v is number => typeof v === "number");
}

function voicePattern(
  trackIndex: number,
  staffIndex: number,
  barIndex: number
): readonly VoiceNumber[] {
  if (trackIndex === 0 || trackIndex === 1) {
    return [1];
  }
  if (trackIndex === 2) {
    return SPARSE_VOICES[(staffIndex + barIndex + 2) % SPARSE_VOICES.length];
  }
  if (trackIndex === 3) {
    return SPARSE_VOICES[(barIndex + 1) % SPARSE_VOICES.length];
  }
  return SPARSE_VOICES[
    (trackIndex + staffIndex + barIndex) % SPARSE_VOICES.length
  ];
}

function replaceTrackStaves(
  track: Track<Guitar>,
  trackIndex: number,
  staffCount: number,
  clefOffset: number
): number {
  for (let i = 0; i < staffCount; i++) {
    const displayIndex = clefOffset + i;
    track.insertStaff(
      i,
      new Staff(
        track,
        track.context,
        [],
        CLEFS[displayIndex % CLEFS.length],
        displayIndex % 3 !== 1,
        displayIndex % 3 !== 0
      )
    );
  }
  track.removeStaff(staffCount);

  for (let staffIndex = 0; staffIndex < track.staves.length; staffIndex++) {
    const staff = track.staves[staffIndex];
    for (let barIndex = 0; barIndex < staff.bars.length; barIndex++) {
      const bar = staff.bars[barIndex];
      for (const voiceNumber of VOICE_NUMBERS) {
        bar.removeVoiceBar(voiceNumber);
      }
      for (const voiceNumber of voicePattern(
        trackIndex,
        staffIndex,
        barIndex
      )) {
        bar.insertVoiceBar(voiceNumber);
      }
    }
  }
  return clefOffset + staffCount;
}

function makeBeat(
  voiceBar: VoiceBar<Guitar>,
  duration: NoteDuration,
  dots: 0 | 1 | 2,
  tuplet: TupletSettings | null,
  rest = false
): Beat<Guitar> {
  return new Beat(
    voiceBar,
    voiceBar.trackContext,
    rest ? null : [],
    duration,
    dots,
    tuplet
  );
}

function guitarNote(beat: Beat<Guitar>, slot = 0): GuitarNote {
  const note = beat.notes?.[slot];
  if (!(note instanceof GuitarNote)) {
    throw Error(`Expected guitar note in slot ${slot}`);
  }
  return note;
}

function addTechnique(
  note: GuitarNote,
  type: GuitarTechniqueType,
  options: BendOptionsData | null = null
): void {
  const technique = new GuitarTechnique(
    note,
    type,
    options === null ? null : new BendTechniqueOptions(options)
  );
  expect(note.addTechnique(technique)).toBe(true);
}

function addExhaustiveBeatContent(voiceBar: VoiceBar<Guitar>): void {
  const durations = enumNumbers(NoteDuration) as NoteDuration[];
  const tuplets: readonly (TupletSettings | null)[] = [
    null,
    { normalCount: 2, tupletCount: 1 },
    { normalCount: 3, tupletCount: 2 },
    { normalCount: 5, tupletCount: 4 },
  ];
  const beats: Beat<Guitar>[] = [
    makeBeat(voiceBar, NoteDuration.Eighth, 0, {
      normalCount: 3,
      tupletCount: 2,
    }),
    makeBeat(voiceBar, NoteDuration.Eighth, 0, {
      normalCount: 3,
      tupletCount: 2,
    }),
    makeBeat(voiceBar, NoteDuration.Eighth, 0, {
      normalCount: 3,
      tupletCount: 2,
    }),
    makeBeat(voiceBar, NoteDuration.Sixteenth, 0, {
      normalCount: 3,
      tupletCount: 2,
    }),
    makeBeat(voiceBar, NoteDuration.Sixteenth, 0, {
      normalCount: 3,
      tupletCount: 2,
    }),
    makeBeat(voiceBar, NoteDuration.Quarter, 0, null),
  ];
  const nonBendTechniques = enumNumbers(GuitarTechniqueType).filter(
    (t) => t !== GuitarTechniqueType.Bend
  ) as GuitarTechniqueType[];

  for (let i = 0; i < nonBendTechniques.length; i++) {
    const beat = makeBeat(
      voiceBar,
      durations[i % durations.length],
      (i % 3) as 0 | 1 | 2,
      tuplets[i % tuplets.length]
    );
    const note = guitarNote(beat, i % beat.notes!.length);
    if (nonBendTechniques[i] !== GuitarTechniqueType.Vibrato) {
      note.fret = i + 1;
    }
    addTechnique(note, nonBendTechniques[i]);
    beats.push(beat);
  }

  for (let i = 0; i < BEND_OPTIONS.length; i++) {
    const beat = makeBeat(
      voiceBar,
      durations[(i + 2) % durations.length],
      ((i + 1) % 3) as 0 | 1 | 2,
      tuplets[(i + 1) % tuplets.length]
    );
    const note = guitarNote(beat, (i + 1) % beat.notes!.length);
    note.fret = i + 2;
    addTechnique(note, GuitarTechniqueType.Bend, BEND_OPTIONS[i]);
    beats.push(beat);
  }

  const rest = makeBeat(voiceBar, NoteDuration.SixtyFourth, 2, null, true);
  const dead = makeBeat(voiceBar, NoteDuration.ThirtySecond, 1, null);
  guitarNote(dead, 0).fret = -1;
  const chord = makeBeat(voiceBar, NoteDuration.Quarter, 0, null);
  guitarNote(chord, 0).fret = 3;
  guitarNote(chord, 2).fret = 7;
  beats.push(rest, dead, chord);
  voiceBar.replaceBeats(beats);
}

function createExhaustiveScore(): Score {
  const score = new Score([], "Serialization Matrix", "TabUI Test", "V1 State");
  score.masterVolume = 0.73;
  score.masterPan = -0.35;

  const first = score.masterBars[0];
  const [tempo, beatsCount, duration, repeatStatus] = MASTER_BAR_DATA[0];
  first.tempo = tempo;
  first.beatsCount = beatsCount;
  first.duration = duration;
  first.repeatStatus = repeatStatus;
  for (const data of MASTER_BAR_DATA.slice(1)) {
    score.appendMasterBar({
      tempo: data[0],
      beatsCount: data[1],
      duration: data[2],
      repeatStatus: data[3],
      repeatCount: data[4],
    });
  }

  const staffCounts = [1, 2, 2, 1, 3, 1, 2, 1, 1];
  let clefOffset = 0;
  for (let i = 0; i < 9; i++) {
    const stringsCount = i + 1;
    const [type, tone] = TONE_CASES[i];
    const instrument = new Guitar(
      type,
      tone,
      `Instrument ${stringsCount}: ${tone}`,
      stringsCount,
      tuningFor(stringsCount),
      12 + i * 2
    );
    const track = score.addTrack(instrument, `Track ${stringsCount}`)
      .tracks[0] as Track<Guitar> | undefined;
    if (track === undefined) {
      throw Error("Expected added track");
    }
    track.volume = i / 8;
    track.pan = -1 + i / 4;
    track.muted = i === 2 || i === 7;
    track.soloed = i === 5 || i === 7;
    clefOffset = replaceTrackStaves(track, i, staffCounts[i], clefOffset);
  }
  score.removeTrack(0);

  let voiceIndex = 0;
  for (const track of score.tracks) {
    for (const staff of track.staves) {
      for (const bar of staff.bars) {
        for (const voiceBar of bar.voiceBarsAsArray) {
          const typedVoiceBar = voiceBar as VoiceBar<Guitar>;
          typedVoiceBar.replaceBeats([
            makeBeat(
              typedVoiceBar,
              NoteDuration.Quarter,
              (voiceIndex % 3) as 0 | 1 | 2,
              null,
              voiceIndex % 7 === 0
            ),
          ]);
          voiceIndex++;
        }
      }
    }
  }
  const richVoiceBar = score.tracks[8].staves[0].bars[2]
    .voiceBarsAsArray[0] as VoiceBar<Guitar>;
  addExhaustiveBeatContent(richVoiceBar);
  return score;
}

function snapshotTechnique(technique: GuitarTechnique) {
  const options = technique.bendOptions;
  if (options === null) {
    return { type: technique.type, bendOptions: null };
  }
  const bendOptions: Record<string, number> = {};
  for (const key of OPTIONS_PER_BEND_TYPE[options.type]) {
    const value = options[key];
    if (typeof value !== "number") {
      throw Error(`Missing bend option ${key}`);
    }
    bendOptions[key] = value;
  }
  return { type: technique.type, bendOptions };
}

function semanticSnapshot(score: Score) {
  return {
    metadata: {
      name: score.name,
      artist: score.artist,
      song: score.song,
      masterVolume: score.masterVolume,
      masterPan: score.masterPan,
    },
    masterBars: score.masterBars.map((m) => ({
      tempo: m.tempo,
      beatsCount: m.beatsCount,
      duration: m.duration,
      repeatStatus: m.repeatStatus,
      repeatCount: m.repeatCount,
    })),
    tracks: score.tracks.map((t) => {
      const instrument = t.context.instrument;
      if (!(instrument instanceof Guitar)) {
        throw Error("Expected guitar fixture track");
      }
      return {
        name: t.name,
        volume: t.volume,
        pan: t.pan,
        muted: t.muted,
        soloed: t.soloed,
        instrument: {
          family: instrument.family,
          type: instrument.type,
          tone: instrument.tone,
          name: instrument.name,
          program: instrument.program,
          stringsCount: instrument.stringsCount,
          tuning: instrument.tuning.map((n) => ({
            noteValue: n.noteValue,
            octave: n.octave,
          })),
          fretsCount: instrument.fretsCount,
        },
        staves: t.staves.map((s) => ({
          clefType: s.clefType,
          showTablature: s.showTablature,
          showClassicNotation: s.showClassicNotation,
          bars: s.bars.map((b) => ({
            voices: VOICE_NUMBERS.map((voiceNumber) => {
              const voiceBar = b.getVoiceBar(voiceNumber);
              if (voiceBar === null) {
                return null;
              }
              return {
                beats: voiceBar.beats.map((beat) => ({
                  duration: beat.baseDuration,
                  dots: beat.dots,
                  tuplet:
                    beat.tupletSettings === null
                      ? null
                      : {
                          normalCount: beat.tupletSettings.normalCount,
                          tupletCount: beat.tupletSettings.tupletCount,
                        },
                  rest: beat.isRest(),
                  notes:
                    beat.notes === null
                      ? null
                      : beat.notes.map((note) => {
                          if (!(note instanceof GuitarNote)) {
                            throw Error("Expected guitar note slot");
                          }
                          return {
                            stringNum: note.stringNum,
                            fret: note.fret,
                            techniques: note.techniques.map((technique) => {
                              if (!(technique instanceof GuitarTechnique)) {
                                throw Error("Expected guitar technique");
                              }
                              return snapshotTechnique(technique);
                            }),
                          };
                        }),
                })),
              };
            }),
          })),
        })),
      };
    }),
  };
}

function runtimeSemanticSnapshot(score: Score) {
  return score.tracks.map((track) =>
    track.staves.map((staff) =>
      staff.bars.map((bar) =>
        VOICE_NUMBERS.map((voiceNumber) => {
          const voiceBar = bar.getVoiceBar(voiceNumber);
          if (voiceBar === null) {
            return null;
          }
          return {
            tickResolution: voiceBar.tickResolution,
            barTicks: voiceBar.barTicks,
            actualTicks: voiceBar.actualTicks,
            beamingGroups: [...voiceBar.beamingGroups],
            beats: voiceBar.beats.map((beat) => ({
              baseDurationTicks: beat.baseDurationTicks,
              fullDurationTicks: beat.fullDurationTicks,
              startTick: beat.startTick,
              endTick: beat.endTick,
              beamGroupId: beat.beamGroupId,
              lastInBeamGroup: beat.lastInBeamGroup,
            })),
            tupletGroups: voiceBar.tupletGroups.map((group) => ({
              normalCount: group.normalCount,
              tupletCount: group.tupletCount,
              complete: group.complete,
              isStandard: group.isStandard,
              startTick: group.startTick,
              endTick: group.endTick,
              totalTicks: group.totalTicks,
              memberBeatIndices: group.beats.map((beat) =>
                voiceBar.beats.indexOf(beat)
              ),
            })),
          };
        })
      )
    )
  );
}

function expectRestoredOwnership(score: Score): void {
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
          expect(voiceBar.isEmpty()).toBe(false);
          expect(voiceBar.tickResolution).toBeGreaterThan(0);
          let expectedStart = 0;
          for (const beat of voiceBar.beats) {
            expect(beat.voiceBar).toBe(voiceBar);
            expect(beat.trackContext).toBe(track.context);
            expect(beat.startTick).toBe(expectedStart);
            expect(beat.endTick).toBeGreaterThanOrEqual(beat.startTick);
            expectedStart = beat.endTick;
            for (const note of beat.notes ?? []) {
              expect(note.beat).toBe(beat);
              expect(note.trackContext).toBe(track.context);
              for (const technique of note.techniques) {
                expect(technique.note).toBe(note);
              }
            }
          }
          expect(voiceBar.actualTicks).toBe(expectedStart);
        }
      }
    }
  }
}

function expectExhaustiveCoverage(score: Score): void {
  const masterDurations = new Set(score.masterBars.map((m) => m.duration));
  const repeats = new Set(score.masterBars.map((m) => m.repeatStatus));
  const types = new Set<StringInstrumentType>();
  const tones = new Set<StringInstrumentTone>();
  const clefs = new Set<ClefType>();
  const beatDurations = new Set<NoteDuration>();
  const dots = new Set<number>();
  const tuplets = new Set<string>();
  const techniques = new Set<GuitarTechniqueType>();
  const bends = new Set<BendType>();
  const voicePatterns = new Set<string>();
  const topology = new Set<string>();
  let nullSlots = 0;
  let explicitNullFret = 0;
  let deadNotes = 0;
  let rests = 0;
  let chords = 0;
  let beamedBeats = 0;
  let completeTuplets = 0;
  let incompleteTuplets = 0;

  for (const track of score.tracks) {
    const instrument = track.context.instrument;
    if (!(instrument instanceof Guitar)) {
      throw Error("Expected guitar fixture track");
    }
    types.add(instrument.type);
    tones.add(instrument.tone);
    let maximumVoiceCount = 0;
    for (const staff of track.staves) {
      clefs.add(staff.clefType);
      for (const bar of staff.bars) {
        const pattern = VOICE_NUMBERS.filter(
          (voiceNumber) => bar.getVoiceBar(voiceNumber) !== null
        );
        voicePatterns.add(JSON.stringify(pattern));
        maximumVoiceCount = Math.max(maximumVoiceCount, pattern.length);
        for (const voiceBar of bar.voiceBarsAsArray) {
          expect(voiceBar.beats.length).toBeGreaterThan(0);
          for (const group of voiceBar.tupletGroups) {
            if (group.complete) {
              completeTuplets++;
            } else {
              incompleteTuplets++;
            }
          }
          for (const beat of voiceBar.beats) {
            if (beat.beamGroupId !== null) {
              beamedBeats++;
            }
            beatDurations.add(beat.baseDuration);
            dots.add(beat.dots);
            if (beat.tupletSettings !== null) {
              tuplets.add(
                `${beat.tupletSettings.normalCount}:${beat.tupletSettings.tupletCount}`
              );
            }
            if (beat.notes === null) {
              rests++;
              continue;
            }
            let playedNotes = 0;
            for (const note of beat.notes) {
              if (!(note instanceof GuitarNote)) {
                throw Error("Expected guitar note slot");
              }
              if (note.fret === null && note.techniques.length === 0) {
                nullSlots++;
              }
              if (note.fret === null && note.techniques.length > 0) {
                explicitNullFret++;
              }
              if (note.fret === -1) {
                deadNotes++;
              }
              if (note.fret !== null) {
                playedNotes++;
              }
              for (const technique of note.techniques) {
                techniques.add(technique.type as GuitarTechniqueType);
                if (technique instanceof GuitarTechnique) {
                  if (technique.bendOptions !== null) {
                    bends.add(technique.bendOptions.type);
                  }
                }
              }
            }
            if (playedNotes > 1) {
              chords++;
            }
          }
        }
      }
    }
    topology.add(
      `${track.staves.length > 1 ? "multi-staff" : "one-staff"}/${
        maximumVoiceCount > 1 ? "multi-voice" : "one-voice"
      }`
    );
  }

  expect(masterDurations).toEqual(new Set(enumNumbers(NoteDuration)));
  expect(repeats).toEqual(new Set(enumNumbers(BarRepeatStatus)));
  expect(types).toEqual(new Set(Object.values(StringInstrumentType)));
  expect(tones).toEqual(new Set(TONE_CASES.slice(0, 9).map((c) => c[1])));
  expect(clefs).toEqual(new Set(Object.values(ClefType)));
  expect(beatDurations).toEqual(new Set(enumNumbers(NoteDuration)));
  expect(dots).toEqual(new Set([0, 1, 2]));
  expect(tuplets).toEqual(new Set(["2:1", "3:2", "5:4"]));
  expect(techniques).toEqual(new Set(enumNumbers(GuitarTechniqueType)));
  expect(bends).toEqual(new Set(enumNumbers(BendType)));
  expect(voicePatterns).toEqual(
    new Set(SPARSE_VOICES.map((p) => JSON.stringify(p)))
  );
  expect(topology).toEqual(
    new Set([
      "one-staff/one-voice",
      "multi-staff/one-voice",
      "multi-staff/multi-voice",
      "one-staff/multi-voice",
    ])
  );
  expect(score.tracks.map((t) => t.context.instrument.maxPolyphony)).toEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 9,
  ]);
  expect(score.masterBars.map((m) => m.tempo)).toEqual(
    expect.arrayContaining([1, 999])
  );
  expect(
    score.masterBars
      .filter((m) => m.repeatCount !== null)
      .map((m) => m.repeatCount)
  ).toEqual([2, 5, 9]);
  expect(nullSlots).toBeGreaterThan(20);
  expect(explicitNullFret).toBeGreaterThan(0);
  expect(deadNotes).toBeGreaterThan(0);
  expect(rests).toBeGreaterThan(0);
  expect(chords).toBeGreaterThan(0);
  expect(beamedBeats).toBeGreaterThan(0);
  expect(completeTuplets).toBeGreaterThan(0);
  expect(incompleteTuplets).toBeGreaterThan(0);
  expect(score.tracks.some((t) => t.muted && t.soloed)).toBe(true);
  expect(score.tracks.map((t) => t.volume)).toEqual(
    expect.arrayContaining([0, 1])
  );
  expect(score.tracks.map((t) => t.pan)).toEqual(
    expect.arrayContaining([-1, 1])
  );
}

describe("exhaustive V1 score serialization", () => {
  test("preserves all supported guitar and tablature model state", () => {
    const source = createExhaustiveScore();
    expect(source.tracks).toHaveLength(9);
    expectExhaustiveCoverage(source);
    const sourceSnapshot = semanticSnapshot(source);
    const sourceRuntimeSnapshot = runtimeSemanticSnapshot(source);
    const document = serializeScore(source);
    const jsonDocument = JSON.parse(JSON.stringify(document)) as unknown;
    const restored = deserializeScore(jsonDocument);
    const restoredSnapshot = semanticSnapshot(restored);

    expect(restoredSnapshot).toEqual(sourceSnapshot);
    expect(runtimeSemanticSnapshot(restored)).toEqual(sourceRuntimeSnapshot);
    expect(serializeScore(restored)).toEqual(document);
    expectExhaustiveCoverage(restored);
    expectRestoredOwnership(restored);
  });

  test("round trips every valid string instrument type and tone pair", () => {
    const encounteredPairs = new Set<string>();
    const encounteredTones = new Set<StringInstrumentTone>();

    for (const [type, tone] of TONE_CASES) {
      const score = new Score();
      const instrument = new Guitar(
        type,
        tone,
        `${type} / ${tone}`,
        6,
        cloneTuning(DEFAULT_TUNINGS[6].Standard),
        24
      );
      score.tracks[0].setInstrument(instrument);
      const sourceSnapshot = semanticSnapshot(score);
      const document = serializeScore(score);
      const restored = deserializeScore(
        JSON.parse(JSON.stringify(document)) as unknown
      );

      expect(semanticSnapshot(restored)).toEqual(sourceSnapshot);
      expect(serializeScore(restored)).toEqual(document);
      encounteredPairs.add(`${type}\u0000${tone}`);
      encounteredTones.add(tone);
    }

    const expectedPairs = Object.entries(STRING_TONES).flatMap(
      ([type, tones]) => tones.map((tone) => `${type}\u0000${tone}`)
    );
    const expectedTones = Object.values(STRING_TONES).flat();
    expect(encounteredPairs).toEqual(new Set(expectedPairs));
    expect(encounteredTones).toEqual(new Set(expectedTones));
    expect(new Set(TONE_CASES.map((c) => c[0]))).toEqual(
      new Set(Object.values(StringInstrumentType))
    );
  });
});
