import { performance } from "node:perf_hooks";
import { createScore } from "../demo/data/helpers";
import { TrackElement } from "../src/notation/controller/element/track-element";
import { EditorLayoutDimensions } from "../src/notation/controller/editor-layout-dimensions";
import {
  DEFAULT_ELECTRIC_GUITARS,
  DEFAULT_MASTER_BAR,
  NoteDuration,
} from "../src/notation/model";

type BenchmarkResult = {
  operation: string;
  optimizedMeanMs: number;
  legacyMeanMs: number;
  optimizedMinMs: number;
  legacyMinMs: number;
  optimizedMaxMs: number;
  legacyMaxMs: number;
  speedup: number;
};

const MASTER_BARS_COUNT = 300;
const WARMUP_RUNS = 1;
const MEASURED_RUNS = 3;
const SELECTED_BEAT_COUNT = 128;

function ensureLayoutConfigured(): void {
  try {
    EditorLayoutDimensions.configure({
      width: 1200,
      noteTextSize: 12,
      timeSigTextSize: 48,
      tempoTextSize: 24,
      durationsHeight: 30,
    });
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !== "Layout dimensions already configured"
    ) {
      throw error;
    }
  }
}

function createBenchmarkScore() {
  const denseBarsInfo = Array.from({ length: MASTER_BARS_COUNT }, () => ({
    beatsCount: 32,
    beatsDuration: NoteDuration.ThirtySecond,
  }));

  return createScore(
    "Selection Perf Score",
    "TabUI",
    "Selection Stress Test",
    MASTER_BARS_COUNT,
    [
      {
        instrument: DEFAULT_ELECTRIC_GUITARS["Electric Clean"],
        stavesInfo: [denseBarsInfo],
        name: "Selection Perf Track",
      },
    ]
  );
}

function collectFirstBeats(count: number) {
  const score = createBenchmarkScore();
  const track = score.tracks[0];
  const beats = track.staves[0].bars
    .flatMap((bar) => bar.beats)
    .slice(0, count);

  return { score, track, beats };
}

function measureDurationChange(useLegacy: boolean): number {
  const { track, beats } = collectFirstBeats(SELECTED_BEAT_COUNT);
  const trackElement = new TrackElement(track);
  trackElement.update();

  const affectedMasterBarIndices = Array.from(
    new Set(
      beats.map((beat) => track.score.masterBars.indexOf(beat.bar.masterBar))
    )
  ).sort((a, b) => a - b);

  for (const beat of beats) {
    beat.baseDuration = NoteDuration.Sixteenth;
  }
  for (const masterBarIndex of affectedMasterBarIndices) {
    track.staves[0].bars[masterBarIndex].rebuildTiming();
  }

  const start = performance.now();
  if (useLegacy) {
    trackElement.updateOld();
  } else {
    trackElement.update({
      updateType: "Horizontal",
      affectedMasterBarIndices,
      firstAffectedMasterBarIndex: affectedMasterBarIndices[0],
      reason: "benchmark-duration",
    });
  }

  return performance.now() - start;
}

function measureInsertBar(useLegacy: boolean): number {
  const score = createBenchmarkScore();
  const track = score.tracks[0];
  const trackElement = new TrackElement(track);
  trackElement.update();

  const insertIndex = 120;
  score.insertMasterBar(insertIndex, DEFAULT_MASTER_BAR);

  const start = performance.now();
  if (useLegacy) {
    trackElement.updateOld();
  } else {
    trackElement.update({
      updateType: "Horizontal",
      affectedMasterBarIndices: [insertIndex],
      firstAffectedMasterBarIndex: insertIndex,
      reason: "benchmark-insert-bar",
    });
  }

  return performance.now() - start;
}

function measureRemoveBar(useLegacy: boolean): number {
  const score = createBenchmarkScore();
  const track = score.tracks[0];
  const trackElement = new TrackElement(track);
  trackElement.update();

  const removeIndex = 120;
  score.removeMasterBar(removeIndex);

  const start = performance.now();
  if (useLegacy) {
    trackElement.updateOld();
  } else {
    trackElement.update({
      updateType: "Horizontal",
      affectedMasterBarIndices: [removeIndex],
      firstAffectedMasterBarIndex: removeIndex,
      reason: "benchmark-remove-bar",
    });
  }

  return performance.now() - start;
}

function summarize(
  operation: string,
  optimizedRuns: number[],
  legacyRuns: number[]
): BenchmarkResult {
  const optimizedMeanMs = mean(optimizedRuns);
  const legacyMeanMs = mean(legacyRuns);

  return {
    operation,
    optimizedMeanMs,
    legacyMeanMs,
    optimizedMinMs: Math.min(...optimizedRuns),
    legacyMinMs: Math.min(...legacyRuns),
    optimizedMaxMs: Math.max(...optimizedRuns),
    legacyMaxMs: Math.max(...legacyRuns),
    speedup: legacyMeanMs / optimizedMeanMs,
  };
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function runBenchmark(
  operation: string,
  runner: (useLegacy: boolean) => number
): BenchmarkResult {
  console.log(`\n[benchmark] ${operation}`);

  for (let i = 0; i < WARMUP_RUNS; i++) {
    console.log(`[warmup ${i + 1}/${WARMUP_RUNS}] optimized`);
    runner(false);
    console.log(`[warmup ${i + 1}/${WARMUP_RUNS}] legacy`);
    runner(true);
  }

  const optimizedRuns: number[] = [];
  const legacyRuns: number[] = [];
  for (let i = 0; i < MEASURED_RUNS; i++) {
    console.log(`[run ${i + 1}/${MEASURED_RUNS}] optimized`);
    optimizedRuns.push(runner(false));
    console.log(`[run ${i + 1}/${MEASURED_RUNS}] legacy`);
    legacyRuns.push(runner(true));
  }

  return summarize(operation, optimizedRuns, legacyRuns);
}

function format(result: BenchmarkResult): string {
  return [
    result.operation,
    result.optimizedMeanMs.toFixed(2),
    result.legacyMeanMs.toFixed(2),
    result.optimizedMinMs.toFixed(2),
    result.legacyMinMs.toFixed(2),
    result.optimizedMaxMs.toFixed(2),
    result.legacyMaxMs.toFixed(2),
    `${result.speedup.toFixed(2)}x`,
  ].join("\t");
}

ensureLayoutConfigured();

const results = [
  runBenchmark(
    "Duration change (128 beats 32nd -> 16th)",
    measureDurationChange
  ),
  runBenchmark("Insert bar at index 120", measureInsertBar),
  runBenchmark("Remove bar at index 120", measureRemoveBar),
];

console.log(
  [
    "Operation\tOptimized mean (ms)\tLegacy mean (ms)\tOptimized min\tLegacy min\tOptimized max\tLegacy max\tSpeedup",
    ...results.map(format),
  ].join("\n")
);
