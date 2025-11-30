import {
  DEFAULT_BASS_GUITARS,
  DEFAULT_ELECTRIC_GUITARS,
  NoteDuration,
  Score,
} from "@/index";
import { createScore } from "./helpers";

const tracksInfo = [
  {
    instrument: DEFAULT_ELECTRIC_GUITARS["Electric Clean"],
    name: "Rhythm track",
  },
  {
    instrument: DEFAULT_ELECTRIC_GUITARS["Electric Overdrive"],
    name: "Lead track",
  },
  {
    instrument: DEFAULT_BASS_GUITARS["Bass Clean"],
    name: "Bass track",
  },
];

const barsInfo = [
  {
    beatsCount: 4,
    beatsDuration: NoteDuration.Quarter,
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
    beatsCount: 4,
    beatsDuration: NoteDuration.Quarter,
  },
  {
    beatsCount: 4,
    beatsDuration: NoteDuration.Quarter,
  },
  {
    beatsCount: 4,
    beatsDuration: NoteDuration.Quarter,
  },
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
  tracksInfo,
  barsInfo
);
