import { DEFAULT_ELECTRIC_GUITARS, NoteDuration } from "@/notation/model";
import { createScore } from "./helpers";

const MASTER_BARS_COUNT = 120;

const denseBarsInfo = Array.from({ length: MASTER_BARS_COUNT }, (_, index) => {
  const isThirtySecond = index % 2 === 1;

  return {
    beatsCount: isThirtySecond ? 32 : 16,
    beatsDuration: isThirtySecond
      ? NoteDuration.ThirtySecond
      : NoteDuration.Sixteenth,
  };
});

const tracksInfo = [
  {
    instrument: DEFAULT_ELECTRIC_GUITARS["Electric Clean"],
    stavesInfo: [denseBarsInfo],
    name: "Selection Perf Track",
  },
];

export const selectionPerfScore = createScore(
  "Selection Perf Score",
  "TabUI",
  "Selection Stress Test",
  MASTER_BARS_COUNT,
  tracksInfo
);
