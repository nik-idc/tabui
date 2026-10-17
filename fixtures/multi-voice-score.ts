import {
  Bar,
  Beat,
  DEFAULT_ELECTRIC_GUITARS,
  Guitar,
  GuitarNote,
  NoteDuration,
  Score,
  TrackContext,
  VoiceBar,
  VoiceNumber,
} from "@atikincode/tabui";
import { createScore } from "./score-builder";

type BeatSpec = {
  duration: NoteDuration;
  frets: Array<number | null>;
  dots?: 0 | 1 | 2;
  tuplet?: {
    normalCount: number;
    tupletCount: number;
  };
};

type VoiceSpec = {
  voiceNumber: VoiceNumber;
  beats: BeatSpec[];
};

const SINGLE_STAFF_SPECS: VoiceSpec[][] = [
  [
    {
      voiceNumber: 1,
      beats: [
        {
          duration: NoteDuration.Quarter,
          frets: [3, null, null, null, null, null],
        },
        {
          duration: NoteDuration.Quarter,
          frets: [5, null, null, null, null, null],
        },
        {
          duration: NoteDuration.Quarter,
          frets: [7, null, null, null, null, null],
        },
        {
          duration: NoteDuration.Quarter,
          frets: [8, null, null, null, null, null],
        },
      ],
    },
    {
      voiceNumber: 2,
      beats: [
        {
          duration: NoteDuration.Half,
          frets: [null, null, 2, null, null, null],
        },
        {
          duration: NoteDuration.Quarter,
          frets: [null, null, 4, null, null, null],
          dots: 1,
        },
        {
          duration: NoteDuration.Eighth,
          frets: [null, null, 5, null, null, null],
        },
      ],
    },
  ],
  [
    {
      voiceNumber: 1,
      beats: [
        {
          duration: NoteDuration.Eighth,
          frets: [5, null, null, null, null, null],
        },
        {
          duration: NoteDuration.Eighth,
          frets: [7, null, null, null, null, null],
        },
        {
          duration: NoteDuration.Eighth,
          frets: [8, null, null, null, null, null],
        },
        {
          duration: NoteDuration.Eighth,
          frets: [10, null, null, null, null, null],
        },
        {
          duration: NoteDuration.Half,
          frets: [12, null, null, null, null, null],
        },
      ],
    },
    {
      voiceNumber: 2,
      beats: [
        {
          duration: NoteDuration.Quarter,
          frets: [null, null, null, 2, null, null],
        },
        {
          duration: NoteDuration.Quarter,
          frets: [null, null, null, 3, null, null],
        },
        {
          duration: NoteDuration.Quarter,
          frets: [null, null, null, 5, null, null],
        },
        {
          duration: NoteDuration.Quarter,
          frets: [null, null, null, 7, null, null],
        },
      ],
    },
  ],
  [
    {
      voiceNumber: 1,
      beats: [
        {
          duration: NoteDuration.Eighth,
          frets: [7, null, null, null, null, null],
          tuplet: { normalCount: 3, tupletCount: 2 },
        },
        {
          duration: NoteDuration.Eighth,
          frets: [8, null, null, null, null, null],
          tuplet: { normalCount: 3, tupletCount: 2 },
        },
        {
          duration: NoteDuration.Eighth,
          frets: [10, null, null, null, null, null],
          tuplet: { normalCount: 3, tupletCount: 2 },
        },
        {
          duration: NoteDuration.Half,
          frets: [12, null, null, null, null, null],
        },
      ],
    },
    {
      voiceNumber: 2,
      beats: [
        {
          duration: NoteDuration.Whole,
          frets: [null, null, null, null, 3, null],
        },
      ],
    },
  ],
];

const TWO_STAFF_SPECS: VoiceSpec[][][] = [
  SINGLE_STAFF_SPECS,
  [
    [
      {
        voiceNumber: 1,
        beats: [
          {
            duration: NoteDuration.Half,
            frets: [null, 5, null, null, null, null],
          },
          {
            duration: NoteDuration.Half,
            frets: [null, 7, null, null, null, null],
          },
        ],
      },
      {
        voiceNumber: 3,
        beats: [
          {
            duration: NoteDuration.Eighth,
            frets: [null, null, null, null, 0, null],
          },
          {
            duration: NoteDuration.Eighth,
            frets: [null, null, null, null, 2, null],
          },
          {
            duration: NoteDuration.Eighth,
            frets: [null, null, null, null, 3, null],
          },
          {
            duration: NoteDuration.Eighth,
            frets: [null, null, null, null, 5, null],
          },
          {
            duration: NoteDuration.Half,
            frets: [null, null, null, null, 7, null],
          },
        ],
      },
    ],
    [
      {
        voiceNumber: 1,
        beats: [
          {
            duration: NoteDuration.Quarter,
            frets: [null, 7, null, null, null, null],
          },
          {
            duration: NoteDuration.Quarter,
            frets: [null, 8, null, null, null, null],
          },
          {
            duration: NoteDuration.Half,
            frets: [null, 10, null, null, null, null],
          },
        ],
      },
      {
        voiceNumber: 3,
        beats: [
          {
            duration: NoteDuration.Whole,
            frets: [null, null, null, null, 5, null],
          },
        ],
      },
    ],
    [
      {
        voiceNumber: 1,
        beats: [
          {
            duration: NoteDuration.Sixteenth,
            frets: [null, 8, null, null, null, null],
          },
          {
            duration: NoteDuration.Sixteenth,
            frets: [null, 10, null, null, null, null],
          },
          {
            duration: NoteDuration.Sixteenth,
            frets: [null, 12, null, null, null, null],
          },
          {
            duration: NoteDuration.Sixteenth,
            frets: [null, 13, null, null, null, null],
          },
          {
            duration: NoteDuration.Half,
            frets: [null, 15, null, null, null, null],
            dots: 1,
          },
        ],
      },
      {
        voiceNumber: 3,
        beats: [
          {
            duration: NoteDuration.Half,
            frets: [null, null, null, null, 7, null],
          },
          {
            duration: NoteDuration.Half,
            frets: [null, null, null, null, 8, null],
          },
        ],
      },
    ],
  ],
];

function createBeat(voiceBar: VoiceBar<Guitar>, spec: BeatSpec): Beat<Guitar> {
  const beat = new Beat<Guitar>(
    voiceBar,
    voiceBar.trackContext,
    [],
    spec.duration,
    spec.dots ?? 0,
    spec.tuplet ?? null
  );

  if (beat.notes === null) {
    throw Error("Demo fixture beat unexpectedly created as a rest");
  }

  for (let i = 0; i < beat.notes.length; i++) {
    const fret = spec.frets[i] ?? null;
    beat.setNote(
      i,
      new GuitarNote(
        beat,
        beat.trackContext as TrackContext<Guitar>,
        i + 1,
        fret
      )
    );
  }

  return beat;
}

function fillVoiceBar(bar: Bar<Guitar>, spec: VoiceSpec): void {
  const voiceBar =
    bar.getVoiceBar(spec.voiceNumber) ?? bar.insertVoiceBar(spec.voiceNumber);
  voiceBar.replaceBeats(
    spec.beats.map((beatSpec) => createBeat(voiceBar, beatSpec))
  );
}

function fillBarVoices(bar: Bar<Guitar>, specs: VoiceSpec[]): void {
  for (const spec of specs) {
    fillVoiceBar(bar, spec);
  }
}

export function createMultiVoiceSingleStaffScoreFixture(): Score {
  return createScore(
    "Multi Voice Single Staff",
    "TabUI",
    "Multi Voice Single Staff",
    3,
    [
      {
        instrument: DEFAULT_ELECTRIC_GUITARS["Electric Clean"],
        name: "Two voices",
        stavesInfo: [
          (staff) => {
            for (let i = 0; i < SINGLE_STAFF_SPECS.length; i++) {
              fillBarVoices(staff.bars[i], SINGLE_STAFF_SPECS[i]);
            }
          },
        ],
      },
    ]
  );
}

export function createMultiVoiceTwoStaffScoreFixture(): Score {
  return createScore(
    "Multi Voice Two Staff",
    "TabUI",
    "Multi Voice Two Staff",
    3,
    [
      {
        instrument: DEFAULT_ELECTRIC_GUITARS["Electric Clean"],
        name: "Two staves, two voices",
        stavesInfo: TWO_STAFF_SPECS.map((v) => (staff) => {
          for (let i = 0; i < v.length; i++) {
            fillBarVoices(staff.bars[i], v[i]);
          }
        }),
      },
    ]
  );
}
