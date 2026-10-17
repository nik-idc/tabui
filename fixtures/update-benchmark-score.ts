import {
  DEFAULT_ELECTRIC_GUITARS,
  NoteDuration,
  Score,
} from "@atikincode/tabui";
import { createScore } from "./score-builder";

/** Creates a fresh, dense score for controller update benchmarks. */
export function createUpdateBenchmarkScore(): Score {
  const masterBarsCount = 1000;
  const barsInfo = Array.from({ length: masterBarsCount }, () => ({
    beatsCount: 32,
    beatsDuration: NoteDuration.ThirtySecond,
  }));
  return createScore(
    "Updates Benchmark Score",
    "TabUI",
    "Updates Stress Test",
    masterBarsCount,
    [
      {
        instrument: DEFAULT_ELECTRIC_GUITARS["Electric Clean"],
        stavesInfo: [barsInfo],
        name: "Updates Benchmark Track",
      },
    ]
  );
}
