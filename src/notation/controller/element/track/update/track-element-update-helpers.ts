import {
  BarElement,
  BarTupletGroupElement,
  BeamSegmentElement,
  ElementDiff,
  ElementIdentity,
  GuitarTechniqueElement,
  GuitarTechniqueLabelElement,
  NotationElement,
  NotationStyleLineElement,
  SheetBeatElement,
  StaffLineElement,
  TabBeatElement,
  TabBeatRhythmElement,
  TabNoteElement,
  TechGapElement,
  TechGapLineElement,
  TrackLineElement,
  TrackLineInfoElement,
  VoiceBarElement,
  VoiceBarRhythmElement,
} from "@/notation";

/**
 * Snapshots the currently owned elements of each affected line before the line
 * is rebuilt. TrackElement later uses this to compute added/updated/removed
 * elements inside that line without diffing the whole track.
 */
export function snapshotOwnedElements(
  trackLineElements: TrackLineElement[]
): Map<TrackLineElement, Map<ElementIdentity, NotationElement>> {
  const prevOwnedByAffectedLine = new Map<
    TrackLineElement,
    Map<ElementIdentity, NotationElement>
  >();

  for (const trackLineElement of trackLineElements) {
    prevOwnedByAffectedLine.set(
      trackLineElement,
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
  if (element instanceof VoiceBarElement) {
    return element.barElement.notationStyleLineElement.staffLineElement
      .trackLineElement;
  }
  if (element instanceof TabBeatElement) {
    return element.barElement.notationStyleLineElement.staffLineElement
      .trackLineElement;
  }
  if (element instanceof VoiceBarRhythmElement) {
    return element.barElement.notationStyleLineElement.staffLineElement
      .trackLineElement;
  }
  if (element instanceof TabBeatRhythmElement) {
    return element.voiceBarRhythmElement.barElement.notationStyleLineElement
      .staffLineElement.trackLineElement;
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
    return element.voiceBarRhythmElement.barElement.notationStyleLineElement
      .staffLineElement.trackLineElement;
  }
  if (element instanceof BarTupletGroupElement) {
    return element.voiceBarRhythmElement.barElement.notationStyleLineElement
      .staffLineElement.trackLineElement;
  }

  throw new Error(`Unsupported notation element for track line mounting`);
}

export function getOwningBarElement(
  element: NotationElement
): BarElement | null {
  if (element instanceof BarElement) {
    return element;
  }
  if (
    element instanceof TabBeatElement ||
    element instanceof SheetBeatElement
  ) {
    return element.barElement;
  }
  if (element instanceof VoiceBarElement) {
    return element.barElement;
  }
  if (element instanceof VoiceBarRhythmElement) {
    return element.barElement;
  }
  if (element instanceof TabBeatRhythmElement) {
    return element.voiceBarRhythmElement.barElement;
  }
  if (element instanceof TabNoteElement) {
    return element.beatElement.barElement;
  }
  if (element instanceof GuitarTechniqueElement) {
    return element.noteElement.beatElement.barElement;
  }
  if (element instanceof GuitarTechniqueLabelElement) {
    return element.beatElement.barElement;
  }
  if (element instanceof BeamSegmentElement) {
    return element.voiceBarRhythmElement.barElement;
  }
  if (element instanceof BarTupletGroupElement) {
    return element.voiceBarRhythmElement.barElement;
  }

  return null;
}

export function getBackingModelUUID(element: NotationElement): number {
  if (element instanceof BarElement) {
    return element.bar.uuid;
  }
  if (
    element instanceof TabBeatElement ||
    element instanceof SheetBeatElement
  ) {
    return element.beat.uuid;
  }
  if (element instanceof TabNoteElement) {
    return element.note.uuid;
  }
  if (element instanceof GuitarTechniqueElement) {
    return element.technique.uuid;
  }
  if (element instanceof BarTupletGroupElement) {
    return element.tupletGroup.uuid;
  }

  throw new Error(
    "Tried to get model UUID of an element with no model backing"
  );
}

export function isModelBackedElement(element: NotationElement): boolean {
  return (
    element instanceof BarElement ||
    element instanceof TabBeatElement ||
    element instanceof SheetBeatElement ||
    element instanceof TabNoteElement ||
    element instanceof GuitarTechniqueElement ||
    element instanceof BarTupletGroupElement
  );
}

export function createEmptyDiff(): ElementDiff {
  return {
    added: new Map(),
    updated: new Map(),
    removed: new Map(),
  };
}
