import {
  DEFAULT_BASS_GUITARS,
  DEFAULT_ELECTRIC_GUITARS,
  Guitar,
  GuitarNote,
  NoteDuration,
  Score,
  Track,
} from "@/notation/model";
import { createScore } from "./helpers";

const rhythmChordFrets = [
  [null, 2, 2, 1, null, null],
  [null, 3, 2, 0, null, null],
  [null, 0, 2, 2, null, null],
  [null, 2, 4, 4, null, null],
];
const leadFrets = [12, 15, 14, 12, 17, 15, 14, 19];
const bassFrets = [0, 3, 5, 7, 5, 3];

const stavesInfo = [
  [
    {
      beatsCount: 1,
      beatsDuration: NoteDuration.Whole,
    },
    {
      beatsCount: 2,
      beatsDuration: NoteDuration.Half,
    },
    {
      beatsCount: 4,
      beatsDuration: NoteDuration.Quarter,
    },
    {
      beatsCount: 8,
      beatsDuration: NoteDuration.Eighth,
    },
    {
      beatsCount: 16,
      beatsDuration: NoteDuration.Sixteenth,
    },
    {
      beatsCount: 32,
      beatsDuration: NoteDuration.ThirtySecond,
    },
  ],
  [
    {
      beatsCount: 2,
      beatsDuration: NoteDuration.Half,
    },
    {
      beatsCount: 2,
      beatsDuration: NoteDuration.Half,
    },
    {
      beatsCount: 4,
      beatsDuration: NoteDuration.Quarter,
    },
    {
      beatsCount: 4,
      beatsDuration: NoteDuration.Quarter,
    },
    {
      beatsCount: 8,
      beatsDuration: NoteDuration.Eighth,
    },
    {
      beatsCount: 8,
      beatsDuration: NoteDuration.Eighth,
    },
  ],
];

const tracksInfo = [
  {
    instrument: DEFAULT_ELECTRIC_GUITARS["Electric Clean"],
    stavesInfo: stavesInfo,
    name: "Rhythm track",
  },
  {
    instrument: DEFAULT_ELECTRIC_GUITARS["Electric Overdrive"],
    stavesInfo: stavesInfo,
    name: "Lead track",
  },
  {
    instrument: DEFAULT_BASS_GUITARS["Bass Clean"],
    stavesInfo: stavesInfo,
    name: "Bass track",
  },
];

function setBeatFrets(
  beatNotes: GuitarNote[] | null,
  frets: (number | null)[]
): void {
  if (beatNotes === null) {
    return;
  }

  for (let i = 0; i < beatNotes.length; i++) {
    beatNotes[i].fret = frets[i] ?? null;
  }
}

function shapeRhythmTrack(track: Track<Guitar>): void {
  for (const staff of track.staves) {
    for (let barIndex = 0; barIndex < staff.bars.length; barIndex++) {
      const voiceBar = staff.bars[barIndex].getVoiceBar(1);
      for (const beat of voiceBar?.beats ?? []) {
        setBeatFrets(
          beat.notes as GuitarNote[] | null,
          rhythmChordFrets[barIndex % rhythmChordFrets.length]
        );
      }
    }
  }
}

function shapeLeadTrack(track: Track<Guitar>): void {
  let noteIndex = 0;
  for (const staff of track.staves) {
    for (const bar of staff.bars) {
      const voiceBar = bar.getVoiceBar(1);
      for (const beat of voiceBar?.beats ?? []) {
        const noteCount = beat.notes?.length ?? 0;
        const frets = Array<number | null>(noteCount).fill(null);
        frets[0] = leadFrets[noteIndex % leadFrets.length];
        noteIndex++;
        setBeatFrets(beat.notes as GuitarNote[] | null, frets);
      }
    }
  }
}

function shapeBassTrack(track: Track<Guitar>): void {
  let noteIndex = 0;
  for (const staff of track.staves) {
    for (const bar of staff.bars) {
      const voiceBar = bar.getVoiceBar(1);
      for (const beat of voiceBar?.beats ?? []) {
        const noteCount = beat.notes?.length ?? 0;
        const frets = Array<number | null>(noteCount).fill(null);
        frets[frets.length - 1] = bassFrets[noteIndex % bassFrets.length];
        noteIndex++;
        setBeatFrets(beat.notes as GuitarNote[] | null, frets);
      }
    }
  }
}

function shapeFeatureShowcaseParts(score: Score): void {
  shapeRhythmTrack(score.tracks[0] as Track<Guitar>);
  shapeLeadTrack(score.tracks[1] as Track<Guitar>);
  shapeBassTrack(score.tracks[2] as Track<Guitar>);
}

export function createFeatureShowcaseScoreFixture(): Score {
  const score = createScore(
    "Feature Showcase Score",
    "TabUI",
    "Multi-track Playback Demo",
    6,
    tracksInfo
  );
  shapeFeatureShowcaseParts(score);
  return score;
}
