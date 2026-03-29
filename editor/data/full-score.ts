import {
  DEFAULT_BASS_GUITARS,
  DEFAULT_ELECTRIC_GUITARS,
  NoteDuration,
  Score,
} from "@/notation/model";
import { createScore } from "./helpers";

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

const barsInfo = [
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
  // {
  //   beatsCount: 4,
  //   beatsDuration: NoteDuration.Quarter,
  // },
  // {
  //   beatsCount: 4,
  //   beatsDuration: NoteDuration.Quarter,
  // },
  // {
  //   beatsCount: 4,
  //   beatsDuration: NoteDuration.Quarter,
  // },
  // {
  //   beatsCount: 8,
  //   beatsDuration: NoteDuration.Eighth,
  // },
  // {
  //   beatsCount: 16,
  //   beatsDuration: NoteDuration.Sixteenth,
  // },
];

export const score = createScore(
  "Test Score",
  "Test Artist",
  "Test Song",
  6,
  tracksInfo
  // barsInfo
);
