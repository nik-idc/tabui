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
} from "@/notation/model";

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
  voiceBar.beats.splice(0, voiceBar.beats.length);
  voiceBar.beats.push(
    ...spec.beats.map((beatSpec) => createBeat(voiceBar, beatSpec))
  );
  voiceBar.rebuildTiming();
}

function fillBarVoices(bar: Bar<Guitar>, specs: VoiceSpec[]): void {
  for (const spec of specs) {
    fillVoiceBar(bar, spec);
  }
  bar.staff.recalculateNonEmptyVoiceNumbers();
}

function createBaseScore(name: string): Score {
  const score = new Score([], name, "TabUI", name);
  score.tracks.splice(0, score.tracks.length);
  score.masterBars.splice(0, score.masterBars.length);
  for (let i = 0; i < 3; i++) {
    score.appendMasterBar();
  }

  return score;
}

export function createMultiVoiceSingleStaffScoreFixture(): Score {
  const score = createBaseScore("Multi Voice Single Staff");
  const track = score.addTrack(
    DEFAULT_ELECTRIC_GUITARS["Electric Clean"],
    "Two voices"
  ).tracks[0];
  const staff = track.staves[0] as (typeof track.staves)[0] & {
    bars: Bar<Guitar>[];
  };

  for (let i = 0; i < SINGLE_STAFF_SPECS.length; i++) {
    fillBarVoices(staff.bars[i], SINGLE_STAFF_SPECS[i]);
  }

  return score;
}

export function createMultiVoiceTwoStaffScoreFixture(): Score {
  const score = createBaseScore("Multi Voice Two Staff");
  const track = score.addTrack(
    DEFAULT_ELECTRIC_GUITARS["Electric Clean"],
    "Two staves, two voices"
  ).tracks[0];
  track.insertStaff(1);

  for (let staffIndex = 0; staffIndex < TWO_STAFF_SPECS.length; staffIndex++) {
    const staff = track.staves[staffIndex] as (typeof track.staves)[0] & {
      bars: Bar<Guitar>[];
    };
    for (
      let barIndex = 0;
      barIndex < TWO_STAFF_SPECS[staffIndex].length;
      barIndex++
    ) {
      fillBarVoices(
        staff.bars[barIndex],
        TWO_STAFF_SPECS[staffIndex][barIndex]
      );
    }
  }

  return score;
}
