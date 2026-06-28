import { TrackElementSkeleton } from "./track-line-element";

export type TrackElementLineRange = {
  startLineIndex: number;
  endLineIndex: number;
};

export type MaybeTrackElementLineRange = TrackElementLineRange | null;

export function getFullSkeletonLineRange(
  skeleton: TrackElementSkeleton
): MaybeTrackElementLineRange {
  if (skeleton.lines.length === 0) {
    return null;
  }

  return { startLineIndex: 0, endLineIndex: skeleton.lines.length - 1 };
}

export function getSkeletonLineRangeForMasterBarIndices(
  skeleton: TrackElementSkeleton,
  masterBarIndices: number[]
): MaybeTrackElementLineRange {
  if (skeleton.lines.length === 0) {
    return null;
  }

  const lineIndices = masterBarIndices
    .map((masterBarIndex) => {
      return skeleton.lines.findIndex((line) => {
        return line.trackLineBars.some(
          (lineBar) => lineBar.masterBarIndex === masterBarIndex
        );
      });
    })
    .filter((lineIndex) => lineIndex !== -1);
  if (lineIndices.length === 0) {
    return null;
  }

  return {
    startLineIndex: Math.min(...lineIndices),
    endLineIndex: Math.min(
      skeleton.lines.length - 1,
      Math.max(...lineIndices) + 1
    ),
  };
}
