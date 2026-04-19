import { TrackLineData, TrackLineElement } from "../track-line-element";

/**
 * A horizontal update rebuilds one contiguous window of lines.
 *
 * `startLineIndex` is where repacking starts.
 * `oldEndLineIndexExclusive` is the end of the old window being replaced.
 * `newEndLineIndexExclusive` is the end of the new window after repacking.
 */
export type HorizontalWindow = {
  startLineIndex: number;
  oldEndLineIndexExclusive: number;
  newEndLineIndexExclusive: number;
};

/**
 * Finds the smallest line window that must be rebuilt after a width-affecting
 * change.
 *
 * The key idea is:
 * - start at the first affected master bar
 * - walk forward through the new skeleton
 * - stop once the new skeleton reconnects to an old line ownership key
 *
 * Old line ownership comes from cached stable identities captured before the
 * score mutation. New line ownership is computed from the current master-bar
 * UUIDs in the new skeleton.
 */
export function getHorizontalWindow(
  prevTrackLineElements: TrackLineElement[],
  nextSkeleton: TrackLineData[],
  firstAffectedMasterBarIndex: number
): HorizontalWindow | null {
  const startLineIndex = prevTrackLineElements.findIndex((trackLineElement) =>
    trackLineElement.trackLineData.some(
      (trackLineBarData) =>
        trackLineBarData.masterBarIndex === firstAffectedMasterBarIndex
    )
  );

  if (startLineIndex === -1) {
    return null;
  }

  const track = prevTrackLineElements[0]?.track;
  if (track === undefined) {
    return null;
  }

  const oldLineIndexByOwnershipKey = new Map(
    prevTrackLineElements.map((trackLineElement, index) => [
      trackLineElement.getStableIdentity(),
      index,
    ])
  );

  if (
    prevTrackLineElements[startLineIndex].getStableIdentity() ===
    TrackLineElement.createStableIdentity(track, nextSkeleton[startLineIndex])
  ) {
    // The first affected track line unaffected => no skeleton changes
    return null;
  }

  let oldEndLineIndexExclusive = prevTrackLineElements.length;
  let newEndLineIndexExclusive = nextSkeleton.length;

  // Follow propagation forward until the new skeleton reconnects to an old line
  // that existed after the first affected line.
  for (
    let newLineIndex = startLineIndex;
    newLineIndex < nextSkeleton.length;
    newLineIndex++
  ) {
    const reconnectOldLineIndex = oldLineIndexByOwnershipKey.get(
      TrackLineElement.createStableIdentity(track, nextSkeleton[newLineIndex])
    );

    if (
      reconnectOldLineIndex !== undefined &&
      reconnectOldLineIndex > startLineIndex
    ) {
      oldEndLineIndexExclusive = reconnectOldLineIndex;
      newEndLineIndexExclusive = newLineIndex;
      break;
    }
  }

  if (
    oldEndLineIndexExclusive === startLineIndex &&
    newEndLineIndexExclusive === startLineIndex
  ) {
    return null;
  }

  return {
    startLineIndex,
    oldEndLineIndexExclusive,
    newEndLineIndexExclusive,
  };
}

/**
 * Measures/layouts the rebuilt window and then vertically shifts the untouched
 * trailing lines to follow the new heights.
 */
export function relayoutChangedHorizontalWindow(
  trackLineElements: TrackLineElement[],
  startLineIndex: number,
  newEndLineIndexExclusive: number
): void {
  const lastTrackLineIndex = trackLineElements.length - 1;
  for (let i = startLineIndex; i < trackLineElements.length; i++) {
    const trackLineElement = trackLineElements[i];
    if (i < newEndLineIndexExclusive) {
      trackLineElement.measure();
      trackLineElement.layout();
      trackLineElement.justifyElements(i === lastTrackLineIndex);
      continue;
    }

    trackLineElement.layoutVerticalShift();
  }
}
