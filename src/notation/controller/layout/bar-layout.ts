import { NoteDuration, Track } from "../../model";
import { EditorLayoutDimensions } from "../editor-layout-dimensions";

export type MasterBarLayoutMetrics = {
  durationUnits: number;
  rhythmColumnCount: number;
  contentMinWidth: number;
  structuralWidth: number;
  minWidth: number;
};

export const TRACK_LINE_DURATION_BUDGET_UNITS = 4;
const WHOLE_NOTE_WIDTH_UNITS = 4;

export function calculateMasterBarDurationUnits(
  track: Track,
  masterBarIndex: number
): number {
  const masterBar = track.score.masterBars[masterBarIndex];
  const nominalDurationUnits =
    masterBar.barDurationFraction.numerator /
    masterBar.barDurationFraction.denominator;
  let durationUnits = 0;

  for (const staff of track.staves) {
    const bar = staff.bars[masterBarIndex];
    for (const voiceBar of bar.voiceBarsAsArray) {
      durationUnits = Math.max(
        durationUnits,
        voiceBar.actualTicks / voiceBar.tickResolution
      );
    }
  }

  return durationUnits === 0 ? nominalDurationUnits : durationUnits;
}

export function calculateMasterBarLayoutMetrics(
  track: Track,
  masterBarIndex: number,
  layoutDimensions: EditorLayoutDimensions
): MasterBarLayoutMetrics {
  const durationUnits = calculateMasterBarDurationUnits(track, masterBarIndex);
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
    track,
    masterBarIndex,
    layoutDimensions
  );
  const columnCountMinWidth =
    sortedColumns.length * layoutDimensions.MIN_RHYTHM_COLUMN_GAP;
  const attackCollisionMinWidth = calculateAttackCollisionMinWidth(
    sortedColumns,
    durationUnits,
    layoutDimensions
  );
  const durationMinWidth =
    durationUnits *
    layoutDimensions.WIDTH_MAPPING[NoteDuration.Quarter] *
    WHOLE_NOTE_WIDTH_UNITS;
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
    durationUnits,
    rhythmColumnCount: rhythmColumns.size,
    contentMinWidth,
    structuralWidth,
    minWidth: structuralWidth + contentMinWidth,
  };
}

function calculateAttackCollisionMinWidth(
  sortedColumns: number[],
  durationUnits: number,
  layoutDimensions: EditorLayoutDimensions
): number {
  if (sortedColumns.length < 2 || durationUnits === 0) {
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
    : (layoutDimensions.MIN_RHYTHM_COLUMN_GAP * durationUnits) / minColumnDelta;
}

function calculateStructuralWidth(
  track: Track,
  masterBarIndex: number,
  layoutDimensions: EditorLayoutDimensions
): number {
  const masterBar = track.score.masterBars[masterBarIndex];
  const prevMasterBar = track.score.masterBars[masterBarIndex - 1];
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
