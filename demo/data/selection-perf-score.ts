import {
  DEFAULT_ELECTRIC_GUITARS,
  NoteDuration,
  Score,
} from "@/notation/model";
import { createScore } from "./helpers";

const MASTER_BARS_COUNT = 1000;

const denseBarsInfo = Array.from({ length: MASTER_BARS_COUNT }, () => {
  return {
    beatsCount: 32,
    beatsDuration: NoteDuration.ThirtySecond,
  };
});

const tracksInfo = [
  {
    instrument: DEFAULT_ELECTRIC_GUITARS["Electric Clean"],
    stavesInfo: [denseBarsInfo],
    name: "Performance Stress Track",
  },
];

export function createPerformanceStressScoreFixture(): Score {
  return createScore(
    "Performance Stress Score",
    "TabUI",
    "Dense Playback/Layout Stress Test",
    MASTER_BARS_COUNT,
    tracksInfo
  );
}
