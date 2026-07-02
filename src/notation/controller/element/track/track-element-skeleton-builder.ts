import { Staff, Track } from "@/notation/model";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
import {
  calculateMasterBarLayoutMetrics,
  MasterBarLayoutMetrics,
  TRACK_LINE_DURATION_BUDGET_UNITS,
} from "@/notation/controller/layout/bar-layout";
import { TECHNIQUE_TO_LINE_NUMBER } from "../technique/guitar-technique/guitar-technique-element-lists";
import {
  TrackElementSkeleton,
  TrackElementSkeletonLine,
  TrackLineBar,
} from "./track-line-element";

function createTrackLineBar(
  track: Track,
  masterBarIndex: number,
  finalizedWidth: number
): TrackLineBar {
  return {
    finalizedWidth,
    masterBarUUID: track.score.masterBars[masterBarIndex].uuid,
    masterBarIndex,
  };
}

function finalizeTrackLineBars(
  lineBars: TrackLineBar[],
  metrics: MasterBarLayoutMetrics[],
  stretch: boolean
): void {
  const minWidth = lineBars.reduce(
    (sum, lineBar) => sum + lineBar.finalizedWidth,
    0
  );

  if (!stretch || minWidth === 0) {
    return;
  }

  const structuralWidth = lineBars.reduce((sum, lineBar) => {
    return sum + metrics[lineBar.masterBarIndex].structuralWidth;
  }, 0);
  const contentMinWidth = lineBars.reduce((sum, lineBar) => {
    return sum + metrics[lineBar.masterBarIndex].contentMinWidth;
  }, 0);
  const contentScale =
    contentMinWidth === 0
      ? 1
      : Math.max(0, EditorLayoutDimensions.WIDTH - structuralWidth) /
        contentMinWidth;

  for (const lineBar of lineBars) {
    const metric = metrics[lineBar.masterBarIndex];
    lineBar.finalizedWidth =
      metric.structuralWidth + metric.contentMinWidth * contentScale;
  }
}

function getTabTechniqueGapHeight(
  staff: Staff,
  trackLineBars: TrackLineBar[]
): number {
  const rows = new Set<number>();
  const maxRowCount = 3;

  for (const { masterBarIndex } of trackLineBars) {
    const bar = staff.bars[masterBarIndex];
    for (const voiceBar of bar.voiceBarsAsArray) {
      for (const beat of voiceBar.beats) {
        for (const note of beat.notes ?? []) {
          for (const technique of note.techniques) {
            const lineNumber = TECHNIQUE_TO_LINE_NUMBER[technique.type];
            if (lineNumber !== null) {
              rows.add(lineNumber);

              if (rows.size === maxRowCount) {
                return maxRowCount * EditorLayoutDimensions.TECH_LABEL_HEIGHT;
              }
            }
          }
        }
      }
    }
  }

  return rows.size * EditorLayoutDimensions.TECH_LABEL_HEIGHT;
}

function getTabMainContentHeight(
  staff: Staff,
  trackLineBars: TrackLineBar[]
): number {
  const voiceRows = new Set<number>();
  for (const { masterBarIndex } of trackLineBars) {
    const bar = staff.bars[masterBarIndex];
    for (const voiceBar of bar.voiceBarsAsArray) {
      if (!voiceBar.isEmpty()) {
        voiceRows.add(voiceBar.voiceNumber);
      }
    }
  }

  return (
    EditorLayoutDimensions.NOTE_RECT_HEIGHT *
      staff.track.context.instrument.maxPolyphony +
    voiceRows.size *
      (EditorLayoutDimensions.DURATIONS_HEIGHT +
        EditorLayoutDimensions.TUPLET_RECT_HEIGHT)
  );
}

function getStaffLineHeight(
  staff: Staff,
  trackLineBars: TrackLineBar[]
): number {
  let height = 0;

  if (staff.showClassicNotation) {
    height +=
      getTabTechniqueGapHeight(staff, trackLineBars) +
      getTabMainContentHeight(staff, trackLineBars);
  }

  if (staff.showTablature) {
    height +=
      getTabTechniqueGapHeight(staff, trackLineBars) +
      getTabMainContentHeight(staff, trackLineBars);
  }

  return height;
}

function getTrackLineHeight(
  track: Track,
  trackLineBars: TrackLineBar[]
): number {
  const hasTempo = trackLineBars.some(({ masterBarIndex }) => {
    const prevMasterBar = track.score.masterBars[masterBarIndex - 1];
    const masterBar = track.score.masterBars[masterBarIndex];
    return (
      prevMasterBar === undefined || masterBar.tempo !== prevMasterBar.tempo
    );
  });

  return track.staves.reduce(
    (sum, staff) => sum + getStaffLineHeight(staff, trackLineBars),
    hasTempo ? EditorLayoutDimensions.TEMPO_RECT_HEIGHT : 0
  );
}

function createSkeletonLine(
  track: Track,
  trackLineBars: TrackLineBar[]
): TrackElementSkeletonLine {
  return {
    trackLineBars,
    finalLineHeight: getTrackLineHeight(track, trackLineBars),
  };
}

export function buildTrackElementSkeleton(track: Track): TrackElementSkeleton {
  let currentLineBars: TrackLineBar[] = [];
  const lines: TrackElementSkeletonLine[] = [];
  const masterBars = track.score.masterBars;
  const metrics = masterBars.map((_, index) =>
    calculateMasterBarLayoutMetrics(track, index)
  );
  let lineMinWidth = 0;
  let lineDurationUnits = 0;

  for (let i = 0; i < masterBars.length; i++) {
    const metric = metrics[i];
    const finalizedWidth = Math.min(
      metric.minWidth,
      EditorLayoutDimensions.WIDTH
    );
    const fitsWidth =
      lineMinWidth + finalizedWidth <= EditorLayoutDimensions.WIDTH;
    const fitsDuration =
      lineDurationUnits + metric.durationUnits <=
      TRACK_LINE_DURATION_BUDGET_UNITS;

    if (currentLineBars.length !== 0 && (!fitsWidth || !fitsDuration)) {
      finalizeTrackLineBars(currentLineBars, metrics, true);
      lines.push(createSkeletonLine(track, currentLineBars));
      currentLineBars = [];
      lineMinWidth = 0;
      lineDurationUnits = 0;
    }

    currentLineBars.push(createTrackLineBar(track, i, finalizedWidth));
    lineMinWidth += finalizedWidth;
    lineDurationUnits += metric.durationUnits;
  }

  if (currentLineBars.length !== 0) {
    finalizeTrackLineBars(currentLineBars, metrics, false);
    lines.push(createSkeletonLine(track, currentLineBars));
  }

  return { lines };
}
