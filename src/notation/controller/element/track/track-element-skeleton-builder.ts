import { Staff, Track } from "../../../model";
import { EditorLayoutDimensions } from "../../editor-layout-dimensions";
import { ScoreLayoutPlan } from "../../layout/score-layout-plan";
import { TECHNIQUE_TO_LINE_NUMBER } from "../technique/guitar-technique/guitar-technique-element-lists";
import {
  TrackElementSkeleton,
  TrackElementSkeletonLine,
  TrackLineBar,
} from "./track-line-element";

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
  layoutDimensions: EditorLayoutDimensions,
  scoreLayoutPlan: ScoreLayoutPlan
): TrackElementSkeleton {
  const lines: TrackElementSkeletonLine[] = [];
  let lineY = 0;

  for (const scoreLine of scoreLayoutPlan.lines) {
    const line = createSkeletonLine(
      track,
      scoreLine.bars,
      layoutDimensions,
      lineY
    );
    lines.push(line);
    lineY += line.finalLineHeight;
  }

  return { lines };
}
