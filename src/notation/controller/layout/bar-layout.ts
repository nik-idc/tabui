import { MasterBar, NoteDuration, Track } from "../../model";
import { EditorLayoutDimensions } from "../editor-layout-dimensions";

export type MasterBarLayoutMetrics = {
  durationFraction: number;
  rhythmColumnCount: number;
  contentMinWidth: number;
  structuralWidth: number;
  minWidth: number;
};

export const TRACK_LINE_DURATION_BUDGET_WHOLE_NOTES = 4;
const QUARTER_NOTES_PER_WHOLE_NOTE = 4;

export function calculateMasterBarLayoutMetrics(
  track: Track,
  masterBarIndex: number,
  layoutDimensions: EditorLayoutDimensions
): MasterBarLayoutMetrics {
  const masterBar = track.score.masterBars[masterBarIndex];
  const durationFraction =
    masterBar.barDurationFraction.numerator /
    masterBar.barDurationFraction.denominator;
  const rhythmColumns = new Set<number>();
  for (const staff of track.staves) {
    const bar = staff.bars[masterBarIndex];
    for (const voiceBar of bar.voiceBarsAsArray) {
      if (voiceBar.beats.length === 0) {
        continue;
      }

      for (const beat of voiceBar.beats) {
        rhythmColumns.add(beat.startTick / voiceBar.tickResolution);
      }
    }
  }

  const sortedColumns = [...rhythmColumns].sort((a, b) => a - b);

  const structuralWidth = calculateStructuralWidth(
    track.score.masterBars,
    masterBarIndex,
    layoutDimensions
  );
  const columnCountMinWidth =
    sortedColumns.length * layoutDimensions.MIN_RHYTHM_COLUMN_GAP;
  const attackCollisionMinWidth = calculateAttackCollisionMinWidth(
    sortedColumns,
    durationFraction,
    layoutDimensions
  );
  const durationMinWidth =
    durationFraction *
    layoutDimensions.WIDTH_MAPPING[NoteDuration.Quarter] *
    QUARTER_NOTES_PER_WHOLE_NOTE;
  const contentMinWidth =
    sortedColumns.length === 0
      ? 0
      : Math.max(
          durationMinWidth,
          columnCountMinWidth,
          attackCollisionMinWidth
        ) +
        layoutDimensions.RHYTHM_ATTACK_PADDING * 2;

  return {
    durationFraction,
    rhythmColumnCount: rhythmColumns.size,
    contentMinWidth,
    structuralWidth,
    minWidth: structuralWidth + contentMinWidth,
  };
}

function calculateAttackCollisionMinWidth(
  sortedColumns: number[],
  durationFraction: number,
  layoutDimensions: EditorLayoutDimensions
): number {
  if (sortedColumns.length < 2 || durationFraction === 0) {
    return 0;
  }

  let minColumnDelta = Infinity;
  for (let i = 1; i < sortedColumns.length; i++) {
    minColumnDelta = Math.min(
      minColumnDelta,
      sortedColumns[i] - sortedColumns[i - 1]
    );
  }

  return minColumnDelta === 0 || !Number.isFinite(minColumnDelta)
    ? 0
    : (layoutDimensions.MIN_RHYTHM_COLUMN_GAP * durationFraction) /
        minColumnDelta;
}

function calculateStructuralWidth(
  masterBars: MasterBar[],
  masterBarIndex: number,
  layoutDimensions: EditorLayoutDimensions
): number {
  const masterBar = masterBars[masterBarIndex];
  const prevMasterBar = masterBars[masterBarIndex - 1];
  let width = 0;

  if (
    prevMasterBar === undefined ||
    prevMasterBar.maxDuration !== masterBar.maxDuration
  ) {
    width += layoutDimensions.TIME_SIG_RECT_WIDTH;
  }

  width += layoutDimensions.REPEAT_SIGN_WIDTH * 3;

  return width;
}
