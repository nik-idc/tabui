import {
  Beat,
  DEFAULT_BASS_GUITARS,
  DEFAULT_ELECTRIC_GUITARS,
  Guitar,
  GuitarNote,
  NoteDuration,
  Score,
  Staff,
  VoiceNumber,
} from "@atikincode/tabui";
import { createScore } from "./score-builder";
import { appendFeatureShowcaseSolo } from "./feature-showcase-solo";

type StringFret = [stringNumber: number, fret: number];

const quarter = NoteDuration.Quarter;
const eighth = NoteDuration.Eighth;
const half = NoteDuration.Half;

// Six bars in E minor: Em, C, G, D, Am, Em.
const trebleFrets = [
  [0, 3, 0, 0],
  [1, 3, 5, 3, 1],
  [3, 0, 3, 0],
  [3, 2, 3, 5, 3],
  [1, 0, 1, 3],
  [0, 0],
];
const trebleDurations = [
  [quarter, quarter, quarter, quarter],
  [eighth, eighth, quarter, quarter, quarter],
  [quarter, quarter, quarter, quarter],
  [quarter, eighth, eighth, quarter, quarter],
  [quarter, quarter, quarter, quarter],
  [half, half],
];
const accompaniment: StringFret[][] = [
  [
    [6, 0],
    [4, 2],
    [5, 2],
    [4, 2],
  ],
  [
    [5, 3],
    [4, 2],
    [6, 3],
    [4, 2],
  ],
  [
    [6, 3],
    [4, 0],
    [5, 2],
    [4, 0],
  ],
  [
    [4, 0],
    [3, 2],
    [5, 0],
    [3, 2],
  ],
  [
    [5, 0],
    [4, 2],
    [6, 0],
    [4, 2],
  ],
  [
    [6, 0],
    [4, 2],
    [5, 2],
    [6, 0],
  ],
];
const leadFrets = [
  [12, 15, 14, 12],
  [12, 15, 17, 15, 12],
  [15, 19, 17, 15],
  [14, 17, 15, 14, 10],
  [12, 17, 15, 12],
  [14, 12, 12],
];
const leadDurations = [
  [quarter, quarter, quarter, quarter],
  [eighth, eighth, quarter, quarter, quarter],
  [quarter, quarter, quarter, quarter],
  [eighth, eighth, quarter, quarter, quarter],
  [quarter, quarter, quarter, quarter],
  [quarter, quarter, half],
];
// A slower inner line makes the lead a two-part guitar melody.
const harmonyFrets = [
  [9, 12],
  [9, 12],
  [12, 7],
  [7, 11],
  [9, 5],
  [11, 9],
];
const bassFrets = [
  [0, 7],
  [8, 3],
  [3, 10],
  [10, 5],
  [5, 0],
  [0, 0],
];

/** Fills one voice with single-string notes and independent beat durations. */
function fillPart(
  staff: Staff<Guitar>,
  voiceNumber: VoiceNumber,
  pitches: StringFret[][],
  durations: NoteDuration[][]
): void {
  for (const [barIndex, bar] of staff.bars.entries()) {
    const voice =
      bar.getVoiceBar(voiceNumber) ?? bar.insertVoiceBar(voiceNumber);
    const beats = pitches[barIndex].map(([stringNumber, fret], i) => {
      const beat = new Beat<Guitar>(
        voice,
        voice.trackContext,
        [],
        durations[barIndex][i]
      );
      beat.setNote(
        stringNumber - 1,
        new GuitarNote(beat, voice.trackContext, stringNumber, fret)
      );
      return beat;
    });
    voice.replaceBeats(beats);
  }
}

/** Builds a split fingerstyle arrangement, two-voice lead, and a separate feature-rich solo. */
export function createFeatureShowcaseScoreFixture(): Score {
  const halfNotes = bassFrets.map(() => [half, half]);
  const score = createScore(
    "Feature Showcase Score",
    "TabUI",
    "Evening in E Minor",
    6,
    [
      {
        instrument: DEFAULT_ELECTRIC_GUITARS["Electric Clean"],
        name: "Rhythm track",
        stavesInfo: [
          (staff) =>
            fillPart(
              staff,
              1,
              trebleFrets.map((b) => b.map((f) => [2, f])),
              trebleDurations
            ),
          (staff) =>
            fillPart(
              staff,
              1,
              accompaniment,
              accompaniment.map(() => [quarter, quarter, quarter, quarter])
            ),
        ],
      },
      {
        instrument: DEFAULT_ELECTRIC_GUITARS["Electric Overdrive"],
        name: "Lead track",
        stavesInfo: [
          (staff) => {
            fillPart(
              staff,
              1,
              leadFrets.map((b) => b.map((f) => [1, f])),
              leadDurations
            );
            fillPart(
              staff,
              2,
              harmonyFrets.map((b) => b.map((f) => [3, f])),
              halfNotes
            );
          },
        ],
      },
      {
        instrument: DEFAULT_BASS_GUITARS["Bass Clean"],
        name: "Bass track",
        stavesInfo: [
          (staff) =>
            fillPart(
              staff,
              1,
              bassFrets.map((b) => b.map((f) => [4, f])),
              halfNotes
            ),
        ],
      },
    ]
  );
  appendFeatureShowcaseSolo(score);
  return score;
}
