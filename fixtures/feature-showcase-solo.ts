import {
  Beat,
  BeatDots,
  BendOptionsData,
  BendTechniqueOptions,
  BendType,
  DEFAULT_ELECTRIC_GUITARS,
  DEFAULT_MASTER_BAR,
  Guitar,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  Score,
  Track,
  TupletSettings,
} from "@atikincode/tabui";

type SoloNote = {
  fret: number | null;
  duration: NoteDuration;
  stringNumber?: number;
  dots?: BeatDots;
  tuplet?: TupletSettings;
  techniques?: GuitarTechniqueType[];
  bend?: BendOptionsData;
  chord?: Array<[stringNumber: number, fret: number]>;
};

const quarter = NoteDuration.Quarter;
const eighth = NoteDuration.Eighth;
const sixteenth = NoteDuration.Sixteenth;
const triplet = { normalCount: 3, tupletCount: 2 };
const quintuplet = { normalCount: 5, tupletCount: 4 };

// Bars 7–12 repeat; bars 13–14 slow down for the final cadence.
const soloBars: SoloNote[][] = [
  [
    {
      fret: 12,
      duration: eighth,
      tuplet: triplet,
      techniques: [GuitarTechniqueType.Legato],
    },
    {
      fret: 15,
      duration: eighth,
      tuplet: triplet,
      techniques: [GuitarTechniqueType.Legato],
    },
    { fret: 12, duration: eighth, tuplet: triplet },
    {
      fret: 10,
      duration: quarter,
      dots: 1,
      techniques: [GuitarTechniqueType.Slide],
    },
    { fret: 12, duration: eighth },
    { fret: 15, duration: quarter, techniques: [GuitarTechniqueType.Vibrato] },
  ],
  [
    {
      fret: 9,
      stringNumber: 3,
      duration: quarter,
      techniques: [GuitarTechniqueType.PalmMute],
    },
    { fret: -1, stringNumber: 3, duration: eighth },
    { fret: null, duration: eighth },
    ...[12, 14, 15, 17, 15, 14].map((fret) => ({
      fret,
      duration: NoteDuration.ThirtySecond,
    })),
    ...[12, 14, 12, 10].map((fret) => ({
      fret,
      duration: NoteDuration.SixtyFourth,
    })),
    {
      fret: 12,
      duration: quarter,
      techniques: [GuitarTechniqueType.PinchHarmonic],
    },
  ],
  [
    {
      fret: 14,
      duration: quarter,
      bend: { type: BendType.Bend, bendPitch: 1, bendDuration: 0.5 },
    },
    {
      fret: 14,
      duration: quarter,
      techniques: [GuitarTechniqueType.LetRing],
      bend: { type: BendType.Hold, holdPitch: 1, bendDuration: 1 },
    },
    {
      fret: 14,
      duration: quarter,
      techniques: [GuitarTechniqueType.LetRing],
      bend: { type: BendType.Release, releasePitch: 0, bendDuration: 1 },
    },
    { fret: null, duration: quarter },
  ],
  [
    {
      fret: 12,
      duration: quarter,
      bend: { type: BendType.Prebend, prebendPitch: 1 },
    },
    {
      fret: 12,
      duration: quarter,
      bend: {
        type: BendType.PrebendBend,
        prebendPitch: 0.5,
        bendPitch: 1,
        bendDuration: 1,
      },
    },
    {
      fret: 12,
      duration: quarter,
      bend: {
        type: BendType.PrebendAndRelease,
        prebendPitch: 1,
        releasePitch: 0,
        bendDuration: 1,
      },
    },
    {
      fret: 14,
      duration: quarter,
      bend: {
        type: BendType.BendAndRelease,
        bendPitch: 1,
        releasePitch: 0,
        bendDuration: 0.5,
      },
    },
  ],
  [
    {
      fret: 12,
      duration: quarter,
      techniques: [GuitarTechniqueType.NaturalHarmonic],
    },
    {
      fret: 12,
      stringNumber: 2,
      duration: quarter,
      techniques: [GuitarTechniqueType.NaturalHarmonic],
    },
    {
      fret: 7,
      stringNumber: 3,
      duration: quarter,
      techniques: [GuitarTechniqueType.NaturalHarmonic],
    },
    {
      fret: 12,
      duration: quarter,
      techniques: [GuitarTechniqueType.PinchHarmonic],
    },
  ],
  [
    ...[12, 14, 15, 14, 12].map((fret) => ({
      fret,
      duration: sixteenth,
      tuplet: quintuplet,
    })),
    {
      fret: 15,
      duration: quarter,
      dots: 2,
      techniques: [GuitarTechniqueType.Vibrato],
    },
    { fret: 12, duration: sixteenth },
    { fret: 12, duration: quarter, techniques: [GuitarTechniqueType.LetRing] },
  ],
  [
    {
      fret: 10,
      duration: NoteDuration.Half,
      techniques: [GuitarTechniqueType.Slide],
    },
    { fret: 12, duration: quarter },
  ],
  [
    {
      fret: 12,
      duration: NoteDuration.Whole,
      techniques: [GuitarTechniqueType.Vibrato],
      chord: [
        [2, 12],
        [3, 12],
      ],
    },
  ],
];

/** Appends an eight-bar solo section, with backing parts and a separate solo guitar. */
export function appendFeatureShowcaseSolo(score: Score): void {
  const sectionStart = score.masterBars.length;
  for (let i = 0; i < soloBars.length; i++) {
    score.appendMasterBar({
      ...DEFAULT_MASTER_BAR,
      tempo: i < 6 ? 144 : i === 6 ? 96 : 120,
      beatsCount: i === 6 ? 3 : 4,
      isRepeatStart: i === 0,
      isRepeatEnd: i === 5,
      repeatCount: i === 5 ? 2 : null,
    });
  }

  // Reuse the opening accompaniment, leaving the two-voice lead silent for the solo.
  const backingBars = [0, 1, 2, 3, 0, 1, 3, 5];
  for (const [trackIndex, track] of score.tracks.entries()) {
    for (const staff of track.staves) {
      for (const [i, sourceIndex] of backingBars.entries()) {
        const bar = staff.bars[sectionStart + i];
        for (const voice of bar.voiceBarsAsArray) {
          if (trackIndex === 1) {
            voice.replaceBeats([
              new Beat(
                voice,
                voice.trackContext,
                null,
                i === 6 ? NoteDuration.Half : NoteDuration.Whole,
                i === 6 ? 1 : 0
              ),
            ]);
            continue;
          }
          const source = staff.bars[sourceIndex].getVoiceBar(1);
          if (source === null) throw Error("Showcase backing voice is missing");
          const beats = source.beats.map((b) => b.deepCopy(voice));
          if (i === 6) {
            if (trackIndex === 2) beats[1].baseDuration = quarter;
            else beats.pop();
          }
          voice.replaceBeats(beats);
        }
      }
    }
  }

  const solo = score.addTrack(
    DEFAULT_ELECTRIC_GUITARS["Electric Overdrive"],
    "Solo track"
  ).tracks[0] as Track<Guitar>;
  for (const [barIndex, bar] of solo.staves[0].bars.entries()) {
    const voice = bar.getVoiceBar(1);
    if (voice === null) throw Error("Showcase solo voice is missing");
    const specs = soloBars[barIndex - sectionStart];
    if (specs === undefined) {
      voice.replaceBeats([
        new Beat(voice, voice.trackContext, null, NoteDuration.Whole),
      ]);
      continue;
    }
    const notes: Array<GuitarNote | null> = [];
    voice.replaceBeats(
      specs.map((spec) => {
        const beat = new Beat(
          voice,
          voice.trackContext,
          spec.fret === null ? null : [],
          spec.duration,
          spec.dots ?? 0,
          spec.tuplet ?? null
        );
        const note = beat.notes?.[(spec.stringNumber ?? 1) - 1];
        if (note instanceof GuitarNote) {
          note.fret = spec.fret;
          notes.push(note);
        } else {
          notes.push(null);
        }
        for (const [stringNumber, fret] of spec.chord ?? []) {
          const chordNote = beat.notes?.[stringNumber - 1];
          if (chordNote instanceof GuitarNote) chordNote.fret = fret;
        }
        return beat;
      })
    );
    // Transition techniques need the complete voice before checking the next note.
    for (const [i, note] of notes.entries()) {
      if (note === null) continue;
      for (const type of specs[i].techniques ?? []) {
        if (!note.setTechnique(type))
          throw Error(
            `Showcase solo ${GuitarTechniqueType[type]} rejected at bar ${barIndex + 1}, beat ${i + 1}`
          );
      }
      const bend = specs[i].bend;
      if (
        bend !== undefined &&
        !note.setTechnique(
          GuitarTechniqueType.Bend,
          new BendTechniqueOptions(bend)
        )
      ) {
        throw Error("Showcase solo bend was rejected");
      }
    }
  }
}
