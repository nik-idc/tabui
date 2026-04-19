import {
  BarElement,
  BarTupletGroupElement,
  BeamSegmentElement,
  GuitarTechniqueElement,
  GuitarTechniqueLabelElement,
  NotationElement,
  NotationStyleLineElement,
  SheetBeatElement,
  StaffLineElement,
  TabBeatElement,
  TabNoteElement,
  TechGapElement,
  TechGapLineElement,
  TrackLineElement,
  TrackLineInfoElement,
} from "@/notation";

/**
 * Snapshots the currently owned elements of each affected line before the line
 * is rebuilt. TrackElement later uses this to compute added/updated/removed
 * elements inside that line without diffing the whole track.
 */
export function snapshotOwnedElements(
  trackLineElements: TrackLineElement[]
): Map<string, Map<string, NotationElement>> {
  const prevOwnedByAffectedLine = new Map<
    string,
    Map<string, NotationElement>
  >();

  for (const trackLineElement of trackLineElements) {
    prevOwnedByAffectedLine.set(
      trackLineElement.getStableIdentity(),
      new Map(
        trackLineElement.ownedNotationElements.map((element) => [
          element.getStableIdentity(),
          element,
        ])
      )
    );
  }

  return prevOwnedByAffectedLine;
}

/**
 * Resolves an element to the track line that owns it.
 *
 * The lookup still walks parent references because track-line ownership is not
 * yet stored directly on every notation element.
 * NOTE: Don't like how this looks. It works, for sure, but maybe could be done better
 */
export function getOwningTrackLineElement(
  element: NotationElement
): TrackLineElement {
  if (element instanceof TrackLineElement) {
    return element;
  }
  if (element instanceof TrackLineInfoElement) {
    return element.trackLineElement;
  }
  if (element instanceof StaffLineElement) {
    return element.trackLineElement;
  }
  if (element instanceof NotationStyleLineElement) {
    return element.staffLineElement.trackLineElement;
  }
  if (element instanceof TechGapElement) {
    return element.notationStyleLineElement.staffLineElement.trackLineElement;
  }
  if (element instanceof TechGapLineElement) {
    return element.techGapElement.notationStyleLineElement.staffLineElement
      .trackLineElement;
  }
  if (element instanceof BarElement) {
    return element.notationStyleLineElement.staffLineElement.trackLineElement;
  }
  if (element instanceof TabBeatElement) {
    return element.barElement.notationStyleLineElement.staffLineElement
      .trackLineElement;
  }
  if (element instanceof TabNoteElement) {
    return element.beatElement.barElement.notationStyleLineElement
      .staffLineElement.trackLineElement;
  }
  if (element instanceof GuitarTechniqueElement) {
    return element.noteElement.beatElement.barElement.notationStyleLineElement
      .staffLineElement.trackLineElement;
  }
  if (element instanceof GuitarTechniqueLabelElement) {
    return element.gapLineElement.techGapElement.notationStyleLineElement
      .staffLineElement.trackLineElement;
  }
  if (element instanceof BeamSegmentElement) {
    return element.barElement.notationStyleLineElement.staffLineElement
      .trackLineElement;
  }
  if (element instanceof BarTupletGroupElement) {
    return element.barElement.notationStyleLineElement.staffLineElement
      .trackLineElement;
  }

  throw new Error(`Unsupported notation element for track line mounting`);
}
