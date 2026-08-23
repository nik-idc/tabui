import { Staff, Track } from "../../../model";
import { EditorLayoutDimensions } from "../../editor-layout-dimensions";
import { ScoreLayoutPlan } from "../../layout/score-layout-plan";
import { TabUILayoutMode } from "../../../../config/tabui-config";
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
  const voiceRowsByHasTuplet = new Map<number, boolean>();
  for (const { masterBarIndex } of trackLineBars) {
    const bar = staff.bars[masterBarIndex];
    for (const voiceBar of bar.voiceBarsAsArray) {
      if (voiceBar.isEmpty()) {
        continue;
      }

      const hasTuplet = voiceRowsByHasTuplet.get(voiceBar.voiceNumber) ?? false;
      voiceRowsByHasTuplet.set(
        voiceBar.voiceNumber,
        hasTuplet || voiceBar.tupletGroups.length > 0
      );
    }
  }

  const notesHeight =
    layoutDimensions.NOTE_RECT_HEIGHT *
    staff.track.context.instrument.maxPolyphony;
  let rhythmRowsHeight = 0;
  for (const [_, hasTuplet] of voiceRowsByHasTuplet) {
    rhythmRowsHeight += layoutDimensions.getRhythmRowHeight(hasTuplet);
  }
  return notesHeight + rhythmRowsHeight;
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
  y: number,
  finalLineWidth: number
): TrackElementSkeletonLine {
  return {
    trackLineBars,
    finalLineHeight: getTrackLineHeight(track, trackLineBars, layoutDimensions),
    finalLineWidth,
    y,
  };
}

export function buildTrackElementSkeleton(
  track: Track,
  layoutDimensions: EditorLayoutDimensions,
  scoreLayoutPlan: ScoreLayoutPlan,
  layoutMode: TabUILayoutMode
): TrackElementSkeleton {
  const lines: TrackElementSkeletonLine[] = [];
  let lineY = 0;

  const scoreLines =
    layoutMode === TabUILayoutMode.SingleLine
      ? [{ bars: scoreLayoutPlan.intrinsicBars }]
      : scoreLayoutPlan.wrappedLines;
  for (const scoreLine of scoreLines) {
    const line = createSkeletonLine(
      track,
      scoreLine.bars,
      layoutDimensions,
      lineY,
      layoutMode === TabUILayoutMode.SingleLine
        ? scoreLine.bars.reduce((sum, b) => sum + b.finalizedWidth, 0)
        : layoutDimensions.WIDTH
    );
    lines.push(line);
    lineY += line.finalLineHeight;
  }

  return { lines };
}
