import { performance } from "node:perf_hooks";
import { createScore } from "../demo/data/helpers";
import { EditorLayoutDimensions } from "../src/notation/controller/editor-layout-dimensions";
import { TrackElement } from "../src/notation/controller/element/track-element";
import {
  Command,
  CommandUpdateRequest,
} from "../src/notation/controller/editor/command";
import { InsertBeatCommand } from "../src/notation/controller/editor/command/insert-beat-command";
import { InsertBeatsCommand } from "../src/notation/controller/editor/command/insert-beats-command";
import { InsertBarCommand } from "../src/notation/controller/editor/command/insert-bar-command";
import { RemoveBeatsCommand } from "../src/notation/controller/editor/command/remove-beats-command";
import { RemoveBarsCommand } from "../src/notation/controller/editor/command/remove-bars-command";
import { SetDotsCommand } from "../src/notation/controller/editor/command/set-dots-command";
import { SetRepeatStatusCommand } from "../src/notation/controller/editor/command/set-repeat-status-command";
import { SetTechniqueCommand } from "../src/notation/controller/editor/command/set-technique-command";
import { SetTempoCommand } from "../src/notation/controller/editor/command/set-tempo-command";
import { SetTimeSigCommand } from "../src/notation/controller/editor/command/set-time-sig-command";
import { SetTupletCommand } from "../src/notation/controller/editor/command/set-tuplet-command";
import {
  BarRepeatStatus,
  BendTechniqueOptions,
  BendType,
  DEFAULT_ELECTRIC_GUITARS,
  DEFAULT_MASTER_BAR,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  Score,
  Beat,
  Note,
} from "../src/notation/model";

type BenchmarkPath = "focused" | "full";

type BenchmarkResult = {
  operation: string;
  focusedRequestSummary: string;
  focusedMeanMs: number;
  fullMeanMs: number;
  focusedMinMs: number;
  fullMinMs: number;
  focusedMaxMs: number;
  fullMaxMs: number;
  speedup: number;
};

type BenchmarkScenario = {
  trackElement: TrackElement;
  commands: Command[];
};

type BenchmarkCase = {
  name: string;
  buildScenario: () => BenchmarkScenario;
};

const MASTER_BARS_COUNT = 1000;
const BEATS_PER_BAR = 32;
const WARMUP_RUNS = Number(process.env.BENCHMARK_WARMUPS ?? 0);
const MEASURED_RUNS = Number(process.env.BENCHMARK_RUNS ?? 1);
const CASE_FILTER = process.env.BENCHMARK_CASE_FILTER?.toLowerCase();

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

function createBenchmarkScore(): Score {
  const denseBarsInfo = Array.from({ length: MASTER_BARS_COUNT }, () => ({
    beatsCount: BEATS_PER_BAR,
    beatsDuration: NoteDuration.ThirtySecond,
  }));

  return createScore(
    "Updates Benchmark Score",
    "TabUI",
    "Updates Stress Test",
    MASTER_BARS_COUNT,
    [
      {
        instrument: DEFAULT_ELECTRIC_GUITARS["Electric Clean"],
        stavesInfo: [denseBarsInfo],
        name: "Updates Benchmark Track",
      },
    ]
  );
}

function getBeat(score: Score, barIndex: number, beatIndex: number): Beat {
  return score.tracks[0].staves[0].bars[barIndex].beats[beatIndex];
}

function getNote(
  score: Score,
  barIndex: number,
  beatIndex: number,
  noteIndex: number
): Note {
  return getBeat(score, barIndex, beatIndex).notes[noteIndex];
}

function collectBeats(
  score: Score,
  selections: Array<{ barIndex: number; beatIndex: number }>
): Beat[] {
  return selections.map(({ barIndex, beatIndex }) =>
    getBeat(score, barIndex, beatIndex)
  );
}

function collectNotes(
  score: Score,
  selections: Array<{
    barIndex: number;
    beatIndex: number;
    noteIndex: number;
  }>
): Note[] {
  return selections.map(({ barIndex, beatIndex, noteIndex }) =>
    getNote(score, barIndex, beatIndex, noteIndex)
  );
}

function createScenario(
  buildCommands: (score: Score) => Command[]
): BenchmarkScenario {
  const score = createBenchmarkScore();
  const trackElement = new TrackElement(score.tracks[0]);
  trackElement.updateFull();

  return {
    trackElement,
    commands: buildCommands(score),
  };
}

function createDotsCase(
  name: string,
  selections: Array<{ barIndex: number; beatIndex: number }>,
  newDots: number
): BenchmarkCase {
  return {
    name,
    buildScenario: () =>
      createScenario((score) => {
        const beats = collectBeats(score, selections);
        return [new SetDotsCommand(beats, newDots)];
      }),
  };
}

function createTupletCase(
  name: string,
  selections: Array<{ barIndex: number; beatIndex: number }>,
  tupletSettings: { normalCount: number; tupletCount: number }
): BenchmarkCase {
  return {
    name,
    buildScenario: () =>
      createScenario((score) => {
        const beats = collectBeats(score, selections);
        return [new SetTupletCommand(beats, tupletSettings)];
      }),
  };
}

function createBeatInsertionCase(
  name: string,
  barIndex: number,
  beatIndex: number
): BenchmarkCase {
  return {
    name,
    buildScenario: () =>
      createScenario((score) => {
        const bar = score.tracks[0].staves[0].bars[barIndex];
        return [new InsertBeatCommand(bar, beatIndex)];
      }),
  };
}

function createMultipleBeatInsertionCase(
  name: string,
  barIndex: number,
  anchorBeatIndex: number,
  insertedBeats: Array<{ barIndex: number; beatIndex: number }>
): BenchmarkCase {
  return {
    name,
    buildScenario: () =>
      createScenario((score) => {
        const staff = score.tracks[0].staves[0];
        const anchorBeat = getBeat(score, barIndex, anchorBeatIndex);
        const beatsToInsert = collectBeats(score, insertedBeats);
        return [new InsertBeatsCommand(staff, anchorBeat, beatsToInsert)];
      }),
  };
}

function createBarInsertionCase(
  name: string,
  indices: number[]
): BenchmarkCase {
  // The current multi-bar insertion case intentionally measures two sequential
  // insert commands. It exposes full-update-like cost, but user-facing controls
  // insert one empty bar at a time today, so batch insertion optimization is
  // documented here and deferred until there is a real multi-insert workflow.
  return {
    name,
    buildScenario: () =>
      createScenario((score) =>
        indices
          .slice()
          .sort((a, b) => b - a)
          .map(
            (index) => new InsertBarCommand(score, index, DEFAULT_MASTER_BAR)
          )
      ),
  };
}

function createBeatRemovalCase(
  name: string,
  selections: Array<{ barIndex: number; beatIndex: number }>
): BenchmarkCase {
  return {
    name,
    buildScenario: () =>
      createScenario((score) => {
        const beats = collectBeats(score, selections);
        return [new RemoveBeatsCommand(beats)];
      }),
  };
}

function createBarRemovalCase(name: string, indices: number[]): BenchmarkCase {
  return {
    name,
    buildScenario: () =>
      createScenario((score) => [new RemoveBarsCommand(score, indices)]),
  };
}

function createTimeSigCase(
  name: string,
  indices: number[],
  beatsCount: number,
  duration: NoteDuration
): BenchmarkCase {
  return {
    name,
    buildScenario: () =>
      createScenario((score) =>
        indices.map(
          (index) =>
            new SetTimeSigCommand(
              score,
              score.masterBars[index],
              beatsCount,
              duration
            )
        )
      ),
  };
}

function createTempoCase(
  name: string,
  indices: number[],
  tempos: number[]
): BenchmarkCase {
  return {
    name,
    buildScenario: () =>
      createScenario((score) =>
        indices.map(
          (index, i) =>
            new SetTempoCommand(
              score.masterBars[index],
              tempos[i] ?? tempos[0],
              [getBeat(score, index, 0).uuid]
            )
        )
      ),
  };
}

function createRepeatStatusCase(
  name: string,
  indices: number[],
  statuses: BarRepeatStatus[]
): BenchmarkCase {
  return {
    name,
    buildScenario: () =>
      createScenario((score) =>
        indices.map(
          (index, i) =>
            new SetRepeatStatusCommand(
              score.masterBars[index],
              statuses[i] ?? statuses[0],
              score.tracks[0]
            )
        )
      ),
  };
}

function createTechniqueCase(
  name: string,
  selections: Array<{
    barIndex: number;
    beatIndex: number;
    noteIndex: number;
  }>,
  type: GuitarTechniqueType,
  bendOptions?: BendTechniqueOptions
): BenchmarkCase {
  return {
    name,
    buildScenario: () =>
      createScenario((score) => {
        const notes = collectNotes(score, selections) as GuitarNote[];
        return [new SetTechniqueCommand(notes, type, bendOptions)];
      }),
  };
}

function createBenchmarkCases(): BenchmarkCase[] {
  return [
    createDotsCase(
      "Single dot application",
      [{ barIndex: 120, beatIndex: 0 }],
      1
    ),
    createDotsCase(
      "Multiple dots application",
      [
        { barIndex: 120, beatIndex: 1 },
        { barIndex: 121, beatIndex: 2 },
        { barIndex: 122, beatIndex: 3 },
      ],
      2
    ),
    createTupletCase(
      "Single tuplet application",
      [{ barIndex: 130, beatIndex: 0 }],
      { normalCount: 3, tupletCount: 2 }
    ),
    createTupletCase(
      "Multiple tuplet application",
      [
        { barIndex: 130, beatIndex: 1 },
        { barIndex: 131, beatIndex: 2 },
        { barIndex: 132, beatIndex: 3 },
      ],
      { normalCount: 5, tupletCount: 4 }
    ),
    createBeatInsertionCase("Single beat insertion", 250, 8),
    createMultipleBeatInsertionCase("Multiple beat insertion", 300, 12, [
      { barIndex: 10, beatIndex: 0 },
      { barIndex: 10, beatIndex: 1 },
      { barIndex: 10, beatIndex: 2 },
      { barIndex: 10, beatIndex: 3 },
    ]),
    createBarInsertionCase("Single bar insertion", [400]),
    createBarInsertionCase("Multiple bar insertion", [750, 500]),
    createBeatRemovalCase("Single beat removal", [
      { barIndex: 350, beatIndex: 4 },
    ]),
    createBeatRemovalCase("Multiple beat removal", [
      { barIndex: 360, beatIndex: 5 },
      { barIndex: 361, beatIndex: 6 },
      { barIndex: 362, beatIndex: 7 },
    ]),
    createBarRemovalCase("Single bar removal", [600]),
    createBarRemovalCase("Multiple bar removal", [820, 780]),
    createTimeSigCase(
      "Single bar time signature change",
      [240],
      3,
      NoteDuration.Quarter
    ),
    createTimeSigCase(
      "Multiple bar time signature changes",
      [260, 640],
      5,
      NoteDuration.Eighth
    ),
    createTempoCase("Single bar tempo change", [200], [168]),
    createTempoCase("Multiple bar tempo changes", [220, 660], [96, 192]),
    createRepeatStatusCase(
      "Single bar repeat status change",
      [280],
      [BarRepeatStatus.Start]
    ),
    createRepeatStatusCase(
      "Multiple bar repeat status changes",
      [290, 680],
      [BarRepeatStatus.Start, BarRepeatStatus.End]
    ),
    createTechniqueCase(
      "Single inline natural harmonic application",
      [{ barIndex: 520, beatIndex: 0, noteIndex: 0 }],
      GuitarTechniqueType.NaturalHarmonic
    ),
    createTechniqueCase(
      "Multiple inline natural harmonic applications",
      [
        { barIndex: 521, beatIndex: 0, noteIndex: 0 },
        { barIndex: 522, beatIndex: 1, noteIndex: 1 },
      ],
      GuitarTechniqueType.NaturalHarmonic
    ),
    createTechniqueCase(
      "Single inline slide application",
      [{ barIndex: 530, beatIndex: 0, noteIndex: 0 }],
      GuitarTechniqueType.Slide
    ),
    createTechniqueCase(
      "Multiple inline slide applications",
      [
        { barIndex: 531, beatIndex: 0, noteIndex: 0 },
        { barIndex: 532, beatIndex: 1, noteIndex: 1 },
      ],
      GuitarTechniqueType.Slide
    ),
    createTechniqueCase(
      "Single labeled palm mute application",
      [{ barIndex: 540, beatIndex: 0, noteIndex: 0 }],
      GuitarTechniqueType.PalmMute
    ),
    createTechniqueCase(
      "Multiple labeled palm mute applications",
      [
        { barIndex: 541, beatIndex: 0, noteIndex: 0 },
        { barIndex: 542, beatIndex: 1, noteIndex: 1 },
      ],
      GuitarTechniqueType.PalmMute
    ),
    createTechniqueCase(
      "Single labeled bend application",
      [{ barIndex: 550, beatIndex: 0, noteIndex: 0 }],
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1,
        bendDuration: 1,
      })
    ),
    createTechniqueCase(
      "Multiple labeled bend applications",
      [
        { barIndex: 551, beatIndex: 0, noteIndex: 0 },
        { barIndex: 552, beatIndex: 1, noteIndex: 1 },
      ],
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1,
        bendDuration: 1,
      })
    ),
    createTechniqueCase(
      "Single labeled vibrato application",
      [{ barIndex: 560, beatIndex: 0, noteIndex: 0 }],
      GuitarTechniqueType.Vibrato
    ),
    createTechniqueCase(
      "Multiple labeled vibrato applications",
      [
        { barIndex: 561, beatIndex: 0, noteIndex: 0 },
        { barIndex: 562, beatIndex: 1, noteIndex: 1 },
      ],
      GuitarTechniqueType.Vibrato
    ),
  ];
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatRequests(requests: CommandUpdateRequest[]): string {
  return requests
    .map((request) => {
      const reason =
        "reason" in request && request.reason !== undefined
          ? `:${request.reason}`
          : "";
      return `${request.updateType}${reason}`;
    })
    .join(", ");
}

function measureScenario(
  scenario: BenchmarkScenario,
  path: BenchmarkPath
): { elapsedMs: number; requestSummary: string } {
  const requests = scenario.commands.map((command) => command.updateRequest);
  const requestSummary = formatRequests(requests);
  const timerLabel = `  [${path}] done`;

  console.info(`  [${path}] request(s): ${requestSummary}`);
  console.info(`  [${path}] starting...`);
  console.time(timerLabel);

  const start = performance.now();
  if (path === "focused") {
    for (const request of requests) {
      scenario.trackElement.update(request);
    }
  } else {
    scenario.trackElement.updateFull();
  }
  const elapsedMs = performance.now() - start;

  console.timeEnd(timerLabel);

  return {
    elapsedMs,
    requestSummary,
  };
}

function executeCommands(scenario: BenchmarkScenario): void {
  for (const command of scenario.commands) {
    command.execute();
  }
}

function runBenchmark(benchmarkCase: BenchmarkCase): BenchmarkResult {
  console.info(`\n${benchmarkCase.name}`);

  const focusedRuns: number[] = [];
  const fullRuns: number[] = [];
  let requestSummary = "";

  for (let i = 0; i < WARMUP_RUNS; i++) {
    console.info(`  warmup ${i + 1}/${WARMUP_RUNS}`);
    const scenario = benchmarkCase.buildScenario();
    executeCommands(scenario);
    measureScenario(scenario, "focused");
    measureScenario(scenario, "full");
  }

  for (let i = 0; i < MEASURED_RUNS; i++) {
    console.info(`  measured ${i + 1}/${MEASURED_RUNS}`);
    const scenario = benchmarkCase.buildScenario();
    executeCommands(scenario);

    const focusedRun = measureScenario(scenario, "focused");
    requestSummary = focusedRun.requestSummary;
    focusedRuns.push(focusedRun.elapsedMs);

    fullRuns.push(measureScenario(scenario, "full").elapsedMs);
  }

  return {
    operation: benchmarkCase.name,
    focusedRequestSummary: requestSummary,
    focusedMeanMs: mean(focusedRuns),
    fullMeanMs: mean(fullRuns),
    focusedMinMs: Math.min(...focusedRuns),
    fullMinMs: Math.min(...fullRuns),
    focusedMaxMs: Math.max(...focusedRuns),
    fullMaxMs: Math.max(...fullRuns),
    speedup: mean(fullRuns) / mean(focusedRuns),
  };
}

ensureLayoutConfigured();

const benchmarkCases = createBenchmarkCases().filter((benchmarkCase) =>
  CASE_FILTER === undefined
    ? true
    : benchmarkCase.name.toLowerCase().includes(CASE_FILTER)
);

if (benchmarkCases.length === 0) {
  throw Error(`No benchmark cases matched '${CASE_FILTER}'`);
}

const results = benchmarkCases.map(runBenchmark);

console.table(
  results.map((result) => ({
    Operation: result.operation,
    "Focused request(s)": result.focusedRequestSummary,
    "Focused mean (ms)": result.focusedMeanMs.toFixed(2),
    "Full mean (ms)": result.fullMeanMs.toFixed(2),
    "Focused min": result.focusedMinMs.toFixed(2),
    "Full min": result.fullMinMs.toFixed(2),
    "Focused max": result.focusedMaxMs.toFixed(2),
    "Full max": result.fullMaxMs.toFixed(2),
    Speedup: `${result.speedup.toFixed(2)}x`,
  }))
);
