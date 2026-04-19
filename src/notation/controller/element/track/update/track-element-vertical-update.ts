import type { TrackElement } from "../../track-element";
import { TrackLineElement } from "../track-line-element";
import { NotationElement } from "../../notation-element";
import { BarElement } from "../../bar/bar-element";
import { TabBeatElement } from "../../beat/tab-beat-element";
import { SheetBeatElement } from "../../beat/sheet-beat-element";
import { TabNoteElement } from "../../note/tab-note-element";
import { GuitarTechniqueElement } from "../../technique/guitar-technique/guitar-technique-element";
import { BarTupletGroupElement } from "../../bar/bar-tuplet-group-element";
import { getOwningTrackLineElement } from "./track-element-update-helpers";

/**
 * Vertical updates keep line ownership unchanged.
 *
 * The only work is:
 * - find which existing track lines contain the affected model elements
 * - rebuild those lines fully
 * - shift all later lines vertically to preserve stacking
 */
export function getAffectedTrackLines(
  trackElement: TrackElement,
  modelUUIDs: number[]
): TrackLineElement[] {
  const affectedTrackLines: TrackLineElement[] = [];
  const seenStableIdentities = new Set<string>();
  const elementRegistry = trackElement.getElementRegistry();

  // Map model-backed elements to the unique track lines that own them.
  for (const modelUUID of modelUUIDs) {
    const element = elementRegistry.get(modelUUID);
    if (element === undefined) {
      continue;
    }

    const trackLineElement = getOwningTrackLineElement(element);
    const stableIdentity = trackLineElement.getStableIdentity();
    if (seenStableIdentities.has(stableIdentity)) {
      continue;
    }

    affectedTrackLines.push(trackLineElement);
    seenStableIdentities.add(stableIdentity);
  }

  affectedTrackLines.sort(
    (a, b) =>
      trackElement.trackLineElements.indexOf(a) -
      trackElement.trackLineElements.indexOf(b)
  );
  return affectedTrackLines;
}

/**
 * Rebuild affected lines in place, then vertically shift every later line.
 *
 * This is the main fast path for vertical-only changes such as technique labels
 * or tempo labels becoming visible.
 */
export function applyVerticalUpdatesSequentially(
  allTrackLineElements: TrackLineElement[],
  affectedTrackLines: TrackLineElement[]
): void {
  const affectedStableIdentities = new Set(
    affectedTrackLines.map((trackLineElement) =>
      trackLineElement.getStableIdentity()
    )
  );
  const firstAffectedTrackLineIndex = Math.min(
    ...affectedTrackLines.map((trackLineElement) =>
      allTrackLineElements.indexOf(trackLineElement)
    )
  );
  const lastTrackLineIndex = allTrackLineElements.length - 1;

  // Rebuild only the affected lines; later lines only need a Y shift.
  for (
    let i = firstAffectedTrackLineIndex;
    i < allTrackLineElements.length;
    i++
  ) {
    const trackLineElement = allTrackLineElements[i];
    if (affectedStableIdentities.has(trackLineElement.getStableIdentity())) {
      trackLineElement.build();
      trackLineElement.measure();
      trackLineElement.layout();
      trackLineElement.justifyElements(i === lastTrackLineIndex);
      continue;
    }

    trackLineElement.layoutVerticalShift();
  }
}
