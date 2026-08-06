import { Staff, Track } from "../../../model";
import { EditorLayoutDimensions } from "../../editor-layout-dimensions";
import {
  calculateMasterBarLayoutMetrics,
  MasterBarLayoutMetrics,
  TRACK_LINE_DURATION_BUDGET_UNITS,
} from "../../layout/bar-layout";
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
  stretch: boolean,
  layoutDimensions: EditorLayoutDimensions
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
      : Math.max(0, layoutDimensions.WIDTH - structuralWidth) / contentMinWidth;

  for (const lineBar of lineBars) {
    const metric = metrics[lineBar.masterBarIndex];
    lineBar.finalizedWidth =
      metric.structuralWidth + metric.contentMinWidth * contentScale;
  }
}

function getTabTechniqueGapHeight(
  staff: Staff,
  trackLineBars: TrackLineBar[],
  layoutDimensions: EditorLayoutDimensions
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
                return maxRowCount * layoutDimensions.TECH_LABEL_HEIGHT;
              }
            }
          }
        }
      }
    }
  }

  return rows.size * layoutDimensions.TECH_LABEL_HEIGHT;
}

function getTabMainContentHeight(
  staff: Staff,
  trackLineBars: TrackLineBar[],
  layoutDimensions: EditorLayoutDimensions
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
    layoutDimensions.NOTE_RECT_HEIGHT *
      staff.track.context.instrument.maxPolyphony +
    voiceRows.size *
      (layoutDimensions.DURATIONS_HEIGHT + layoutDimensions.TUPLET_RECT_HEIGHT)
  );
}

function getStaffLineHeight(
  staff: Staff,
  trackLineBars: TrackLineBar[],
  layoutDimensions: EditorLayoutDimensions
): number {
  let height = 0;

  if (staff.showClassicNotation) {
    height +=
      getTabTechniqueGapHeight(staff, trackLineBars, layoutDimensions) +
      getTabMainContentHeight(staff, trackLineBars, layoutDimensions);
  }

  if (staff.showTablature) {
    height +=
      getTabTechniqueGapHeight(staff, trackLineBars, layoutDimensions) +
      getTabMainContentHeight(staff, trackLineBars, layoutDimensions);
  }

  return height;
}

function getTrackLineHeight(
  track: Track,
  trackLineBars: TrackLineBar[],
  layoutDimensions: EditorLayoutDimensions
): number {
  const hasTempo = trackLineBars.some(({ masterBarIndex }) => {
    const prevMasterBar = track.score.masterBars[masterBarIndex - 1];
    const masterBar = track.score.masterBars[masterBarIndex];
    return (
      prevMasterBar === undefined || masterBar.tempo !== prevMasterBar.tempo
    );
  });

  return track.staves.reduce(
    (sum, staff) =>
      sum + getStaffLineHeight(staff, trackLineBars, layoutDimensions),
    hasTempo ? layoutDimensions.TEMPO_RECT_HEIGHT : 0
  );
}

function createSkeletonLine(
  track: Track,
  trackLineBars: TrackLineBar[],
  layoutDimensions: EditorLayoutDimensions,
  y: number
): TrackElementSkeletonLine {
  return {
    trackLineBars,
    finalLineHeight: getTrackLineHeight(track, trackLineBars, layoutDimensions),
    y,
  };
}

export function buildTrackElementSkeleton(
  track: Track,
  layoutDimensions: EditorLayoutDimensions
): TrackElementSkeleton {
  let currentLineBars: TrackLineBar[] = [];
  const lines: TrackElementSkeletonLine[] = [];
  const masterBars = track.score.masterBars;
  const metrics = masterBars.map((_, index) =>
    calculateMasterBarLayoutMetrics(track, index, layoutDimensions)
  );
  let lineMinWidth = 0;
  let lineDurationUnits = 0;
  let lineY = 0;

  for (let i = 0; i < masterBars.length; i++) {
    const metric = metrics[i];
    const finalizedWidth = Math.min(metric.minWidth, layoutDimensions.WIDTH);
    const fitsWidth = lineMinWidth + finalizedWidth <= layoutDimensions.WIDTH;
    const fitsDuration =
      lineDurationUnits + metric.durationUnits <=
      TRACK_LINE_DURATION_BUDGET_UNITS;

    if (currentLineBars.length !== 0 && (!fitsWidth || !fitsDuration)) {
      finalizeTrackLineBars(currentLineBars, metrics, true, layoutDimensions);
      const line = createSkeletonLine(
        track,
        currentLineBars,
        layoutDimensions,
        lineY
      );
      lines.push(line);
      lineY += line.finalLineHeight;
      currentLineBars = [];
      lineMinWidth = 0;
      lineDurationUnits = 0;
    }

    currentLineBars.push(createTrackLineBar(track, i, finalizedWidth));
    lineMinWidth += finalizedWidth;
    lineDurationUnits += metric.durationUnits;
  }

  if (currentLineBars.length !== 0) {
    finalizeTrackLineBars(currentLineBars, metrics, false, layoutDimensions);
    lines.push(
      createSkeletonLine(track, currentLineBars, layoutDimensions, lineY)
    );
  }

  return { lines };
}
