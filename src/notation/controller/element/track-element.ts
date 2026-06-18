import { Beat, GuitarNote, lcmAll, Note, Track } from "@/notation/model";
import { randomInt, Point, Rect } from "@/shared";
import {
  CommandUpdateRequest,
  HorizontalUpdateRequest,
  TargetedUpdateRequest,
  VerticalUpdateRequest,
} from "../editor/command/command";
import { EditorLayoutDimensions } from "../editor-layout-dimensions";
import {
  calculateMasterBarLayoutMetrics,
  MasterBarLayoutMetrics,
  TRACK_LINE_DURATION_BUDGET_UNITS,
} from "../layout/bar-layout";
import { BarElement } from "./bar/bar-element";
import { TrackLineBar, TrackLineElement } from "./track/track-line-element";
import { BeatElement } from "./beat/beat-element";
import { StaffLineElement } from "./staff/staff-line-element";
import { NotationElement, NotationElementClass } from "./notation-element";
import { TabNoteElement } from "./note/tab-note-element";
import { TabBeatElement } from "./beat/tab-beat-element";
import { TabBeatRhythmElement } from "./beat/tab-beat-rhythm-element";
import { NotationStyleLineElement } from "./staff/notation-style-line-element";
import { VoiceBarElement } from "./bar/voice-bar-element";
import { VoiceBarRhythmElement } from "./bar/voice-bar-rhythm-element";
import { BeamSegmentElement } from "./bar/beam-segment-element";
import { BarTupletGroupElement } from "./bar/bar-tuplet-group-element";
import { TechGapElement } from "./staff/tech-gap-element";
import { TechGapLineElement } from "./staff/tech-gap-line-element";
import { TrackLineInfoElement } from "./track/track-line-info-element";
import { GuitarTechniqueElement } from "./technique/guitar-technique/guitar-technique-element";
import { GuitarTechniqueLabelElement } from "./technique/guitar-technique/guitar-technique-label-element";
import { SheetBeatElement } from "./beat/sheet-beat-element";
import {
  createEmptyDiff,
  getBackingModelUUID,
  getOwningTrackLineElement,
  isModelBackedElement,
  snapshotOwnedElements,
} from "./track/update/track-element-update-helpers";
import { NoteElement } from "./note/note-element";

/**
 * ELEMENT_ORDER defines the order in which element types are rendered.
 * Parents must render before children.
 */
export const ELEMENT_ORDER: Array<NotationElementClass> = [
  TrackLineElement,
  TrackLineInfoElement,
  StaffLineElement,
  NotationStyleLineElement,
  TechGapElement,
  BarElement,
  VoiceBarElement,
  TabBeatElement,
  TabNoteElement,
  GuitarTechniqueElement,
  VoiceBarRhythmElement,
  TabBeatRhythmElement,
  GuitarTechniqueLabelElement,
  BeamSegmentElement,
  BarTupletGroupElement,
  TechGapLineElement,
];

export type ElementIdentity = string;
export type TrackLineIdentity = ElementIdentity;

export enum DiffPart {
  Added = "added",
  Updated = "updated",
  Removed = "removed",
}

export interface ElementDiff {
  [DiffPart.Added]: Map<NotationElementClass, Set<string>>;
  [DiffPart.Updated]: Map<NotationElementClass, Set<string>>;
  [DiffPart.Removed]: Map<NotationElementClass, Set<string>>;
}

type ElementSnapshot = {
  elements: Map<ElementIdentity, NotationElement>;
  hashes: Map<ElementIdentity, string>;
};

function snapshotElements(elements: NotationElement[]): ElementSnapshot {
  return {
    elements: new Map(elements.map((e) => [e.getStableIdentity(), e])),
    hashes: new Map(elements.map((e) => [e.getStableIdentity(), e.stateHash])),
  };
}

type LineWindow = {
  start: number;
  oldEnd: number;
  newEnd: number;
};

/**
 * Class that handles all geometry & visually relevant info of a track
 */
export class TrackElement {
  /** Unique identifier for the track element */
  readonly uuid: number;
  /** Track */
  readonly track: Track;

  /** Track line element */
  private _trackLineElements: TrackLineElement[];

  /** Registry of all elements by stable identity. */
  private _elementRegistryByIdentity: Map<string, NotationElement>;
  /** Registry of model-backed elements by model UUID. */
  private _elementRegistryByModelUUID: Map<number, NotationElement>;
  /** Keeps track of all elements' hash strings */
  private _elementHashesByIdentity: Map<string, string>;
  /** Structural diff between previous and current update cycles */
  private _elementDiff: ElementDiff;

  /**
   * Class that handles all geometry & visually relevant info of a track
   * @param track Track
   */
  constructor(track: Track) {
    this.uuid = randomInt();
    this.track = track;

    this._trackLineElements = [];
    this._elementRegistryByIdentity = new Map();
    this._elementRegistryByModelUUID = new Map();
    this._elementHashesByIdentity = new Map();
    this._elementDiff = createEmptyDiff();
    this.build();
  }

  public registerElement(element: NotationElement): void {
    this._elementRegistryByIdentity.set(element.getStableIdentity(), element);

    if (!isModelBackedElement(element)) {
      return;
    }

    const modelUUID = getBackingModelUUID(element);
    this._elementRegistryByModelUUID.set(modelUUID, element);
  }

  public unregisterElement(element: NotationElement): void {
    this._elementRegistryByIdentity.delete(element.getStableIdentity());
    this._elementHashesByIdentity.delete(element.getStableIdentity());

    if (!isModelBackedElement(element)) {
      return;
    }

    const modelUUID = getBackingModelUUID(element);
    // This check is necessary because some elements may share the same model uuid
    // (TabBeatElement vs SheetBeatElement for example)
    if (this._elementRegistryByModelUUID.get(modelUUID) === element) {
      this._elementRegistryByModelUUID.delete(modelUUID);
    }
  }

  private addToDiff(diffPart: DiffPart, element: NotationElement): void {
    const diffMap = this._elementDiff[diffPart];
    const elementClass = element.constructor as NotationElementClass;
    let classDiff = diffMap.get(elementClass);

    if (!classDiff) {
      classDiff = new Set();
      diffMap.set(elementClass, classDiff);
    }

    classDiff.add(element.getStableIdentity());
  }

  private computeElementDiff(
    prevRegistry: Map<string, NotationElement>,
    prevHashes: Map<string, string>
  ): void {
    this._elementDiff = createEmptyDiff();

    for (const [stableIdentity, element] of this._elementRegistryByIdentity) {
      const prevElement = prevRegistry.get(stableIdentity);
      if (prevElement === undefined) {
        this.addToDiff(DiffPart.Added, element);
        continue;
      }

      const prevHash = prevHashes.get(stableIdentity);
      const curHash = element.stateHash;
      if (prevHash === undefined || prevHash !== curHash) {
        this.addToDiff(DiffPart.Updated, element);
      }
    }

    for (const [stableIdentity, element] of prevRegistry) {
      if (this._elementRegistryByIdentity.has(stableIdentity)) {
        continue;
      }
      this.addToDiff(DiffPart.Removed, element);
    }
  }

  public clearElementDiff(): void {
    this._elementDiff = createEmptyDiff();
  }

  /** Creates one line bar entry for presentation shell construction. */
  private createTrackLineBar(
    masterBarIndex: number,
    finalizedWidth: number
  ): TrackLineBar {
    return {
      finalizedWidth,
      masterBarUUID: this.track.score.masterBars[masterBarIndex].uuid,
      masterBarIndex,
    };
  }

  private finalizeTrackLineBars(
    lineBars: TrackLineBar[],
    metrics: MasterBarLayoutMetrics[],
    stretch: boolean
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
        : Math.max(0, EditorLayoutDimensions.WIDTH - structuralWidth) /
          contentMinWidth;

    for (const lineBar of lineBars) {
      const metric = metrics[lineBar.masterBarIndex];
      lineBar.finalizedWidth =
        metric.structuralWidth + metric.contentMinWidth * contentScale;
    }
  }

  /**
   * Groups master bars into rendered track lines based on intrinsic bar widths.
   */
  private buildTrackLineSkeleton(): TrackLineBar[][] {
    let currentLineBars: TrackLineBar[] = [];
    const trackLinesBars: TrackLineBar[][] = [];
    const masterBars = this.track.score.masterBars;
    const metrics = masterBars.map((_, index) =>
      calculateMasterBarLayoutMetrics(this.track, index)
    );
    let lineMinWidth = 0;
    let lineDurationUnits = 0;

    for (let i = 0; i < masterBars.length; i++) {
      const metric = metrics[i];
      const finalizedWidth = Math.min(
        metric.minWidth,
        EditorLayoutDimensions.WIDTH
      );
      const fitsWidth =
        lineMinWidth + finalizedWidth <= EditorLayoutDimensions.WIDTH;
      const fitsDuration =
        lineDurationUnits + metric.durationUnits <=
        TRACK_LINE_DURATION_BUDGET_UNITS;

      if (currentLineBars.length !== 0 && (!fitsWidth || !fitsDuration)) {
        this.finalizeTrackLineBars(currentLineBars, metrics, true);
        trackLinesBars.push(currentLineBars);
        currentLineBars = [];
        lineMinWidth = 0;
        lineDurationUnits = 0;
      }

      currentLineBars.push(this.createTrackLineBar(i, finalizedWidth));
      lineMinWidth += finalizedWidth;
      lineDurationUnits += metric.durationUnits;
    }

    if (currentLineBars.length !== 0) {
      this.finalizeTrackLineBars(currentLineBars, metrics, false);
      trackLinesBars.push(currentLineBars);
    }

    return trackLinesBars;
  }

  /** Rebuilds all presentation shell elements and their descendants. */
  public build(): void {
    this._elementRegistryByIdentity.clear();
    this._elementRegistryByModelUUID.clear();

    this._trackLineElements = [];
    const skeleton = this.buildTrackLineSkeleton();
    for (const trackLineBars of skeleton) {
      this._trackLineElements.push(new TrackLineElement(this, trackLineBars));
    }
  }

  /**
   * Calculates the dimensions of all sub elements of this track element
   */
  public measure(): void {
    for (const trackLine of this._trackLineElements) {
      trackLine.measure();
    }
  }

  /**
   * Calculates coordinates for all child elements
   */
  public layout(): void {
    for (let i = 0; i < this._trackLineElements.length; i++) {
      this._trackLineElements[i].layout();
    }
  }

  private getAffectedTrackLines(
    request: VerticalUpdateRequest
  ): TrackLineElement[] {
    const modelUUIDs = request.affectedModelUUIDs;
    const affectedTrackLines: TrackLineElement[] = [];
    const seenStableIdentities = new Set<string>();

    // Map model-backed elements to the unique track lines that own them.
    for (const modelUUID of modelUUIDs) {
      const element = this._elementRegistryByModelUUID.get(modelUUID);
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
        this._trackLineElements.indexOf(a) - this._trackLineElements.indexOf(b)
    );
    return affectedTrackLines;
  }

  private applyVerticalUpdate(affectedLines: TrackLineElement[]): void {
    const firstAffectedLineIndex = this._trackLineElements.indexOf(
      affectedLines[0]
    );
    let nextAffectedIndex = 0;

    for (const trackLineElement of this._trackLineElements) {
      if (trackLineElement === affectedLines[nextAffectedIndex]) {
        trackLineElement.build();
        trackLineElement.measure();
        trackLineElement.layout();
        nextAffectedIndex++;
        continue;
      }

      trackLineElement.layoutVerticalShift();
    }
  }

  private reconcileVerticalUpdate(
    affectedSnapshot: Map<
      TrackLineElement,
      Map<ElementIdentity, NotationElement>
    >
  ): void {
    for (const [trackLineElement, prevOwnership] of affectedSnapshot) {
      const curOwnership = trackLineElement.ownedNotationElements;
      // Reconcile added/updated elements
      for (const element of curOwnership) {
        const identity = element.getStableIdentity();
        if (prevOwnership.has(identity)) {
          this.addToDiff(DiffPart.Updated, element);
          prevOwnership.delete(identity);
        } else {
          this.addToDiff(DiffPart.Added, element);
        }

        this._elementHashesByIdentity.set(identity, element.stateHash);
      }

      // Reconcile removed elements
      for (const prevElement of prevOwnership.values()) {
        this.unregisterElement(prevElement);
        this.addToDiff(DiffPart.Removed, prevElement);
      }
    }
  }

  public updateVertical(request: VerticalUpdateRequest): void {
    this._elementDiff = createEmptyDiff();

    const affectedLines = this.getAffectedTrackLines(request);
    if (affectedLines.length === 0) {
      return;
    }

    const affectedSnapshot = snapshotOwnedElements(affectedLines);

    this.applyVerticalUpdate(affectedLines);

    this.reconcileVerticalUpdate(affectedSnapshot);
  }

  /**
   * Returns the master-bar UUID ownership for one rendered track line.
   * Ownership is used instead of object identity so old and new skeletons can be
   * compared after presentation shell objects are rebuilt.
   */
  private getLineOwnership(trackLineBars: TrackLineBar[]): number[] {
    return trackLineBars.map((lineBar) => lineBar.masterBarUUID);
  }

  /** Builds a compact ownership key for overlap checks between line windows. */
  private getLineOwnershipKey(trackLineBars: TrackLineBar[]): string {
    return this.getLineOwnership(trackLineBars).join(":");
  }

  /** Returns true when two line skeleton entries own the same master bars. */
  private isSameLineOwnership(a: number[], b: number[]): boolean {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }

    return true;
  }

  /** Finds the rendered line containing the given current master-bar index. */
  private findLineByBarIndex(lines: TrackLineBar[][], index: number): number {
    return lines.findIndex((lineBars) =>
      lineBars.some((lb) => lb.masterBarIndex === index)
    );
  }

  /** Finds the rendered line containing the given stable master-bar UUID. */
  private findLineByBarUUID(lines: TrackLineBar[][], uuid: number): number {
    return lines.findIndex((lbs) =>
      lbs.some((lb) => lb.masterBarUUID === uuid)
    );
  }

  /**
   * Finds the first line touched by a horizontal update.
   * UUIDs are preferred because indices can shift after bar insertions/removals;
   * the index remains a fallback for older request paths and edit-position
   * anchoring.
   */
  private firstAffectedLine(
    lines: TrackLineBar[][],
    request: HorizontalUpdateRequest
  ): number {
    for (const masterBarUUID of request.affectedMasterBarUUIDs ?? []) {
      const lineIndex = this.findLineByBarUUID(lines, masterBarUUID);
      if (lineIndex !== -1) {
        return lineIndex;
      }
    }

    return this.findLineByBarIndex(lines, request.firstAffectedMasterBarIndex);
  }

  /**
   * Finds the last line touched by a horizontal update.
   * This mirrors firstAffectedLine but walks affected UUIDs from the end so
   * multi-bar updates can cover the full changed range.
   */
  private lastAffectedLine(
    lines: TrackLineBar[][],
    request: HorizontalUpdateRequest
  ): number {
    const affectedMasterBarUUIDs = request.affectedMasterBarUUIDs ?? [];
    for (let i = affectedMasterBarUUIDs.length - 1; i >= 0; i--) {
      const lineIndex = this.findLineByBarUUID(
        lines,
        affectedMasterBarUUIDs[i]
      );
      if (lineIndex !== -1) {
        return lineIndex;
      }
    }

    const lastAffectedBar =
      request.affectedMasterBarIndices[
        request.affectedMasterBarIndices.length - 1
      ];
    return this.findLineByBarIndex(lines, lastAffectedBar);
  }

  /**
   * Computes the old/new track-line window that must be rebuilt for a
   * width-affecting update.
   *
   * Lines before `start` and after `oldEnd` are preserved where possible. The
   * old window `[start, oldEnd)` is replaced by newly built lines from the new
   * skeleton window `[start, newEnd)`. UUID-based affected bars are used when
   * available to avoid index-shift bugs after bar insertion/removal.
   */
  private getChangedLineWindow(
    oldLineBars: TrackLineBar[][],
    newLineBars: TrackLineBar[][],
    request: HorizontalUpdateRequest
  ): LineWindow {
    const oldOwnership = oldLineBars.map((lb) => this.getLineOwnership(lb));
    const newOwnership = newLineBars.map((lb) => this.getLineOwnership(lb));

    let start = 0;
    while (
      start < oldOwnership.length &&
      start < newOwnership.length &&
      this.isSameLineOwnership(oldOwnership[start], newOwnership[start])
    ) {
      start++;
    }

    let oldEnd = oldOwnership.length;
    let newEnd = newOwnership.length;

    if (oldEnd === newEnd && start === oldEnd) {
      // Ownership did not change, but affected bars still need rebuilding.
      const firstAffectedLine = this.firstAffectedLine(oldLineBars, request);
      const lastAffectedLine = this.lastAffectedLine(oldLineBars, request);
      return {
        start: firstAffectedLine,
        // Include one following line because tempo, time sig etc
        // visibility depends on the previous bar
        oldEnd: Math.min(oldLineBars.length, lastAffectedLine + 2),
        newEnd: Math.min(newLineBars.length, lastAffectedLine + 2),
      };
    }

    while (
      oldEnd > start &&
      newEnd > start &&
      this.isSameLineOwnership(
        oldOwnership[oldEnd - 1],
        newOwnership[newEnd - 1]
      )
    ) {
      oldEnd--;
      newEnd--;
    }

    // Prefix/suffix matching can produce a window that misses the edited bar.
    // Anchor it by affected UUIDs first; indices are only a fallback.
    const firstAffectedOld = this.firstAffectedLine(oldLineBars, request);
    const firstAffectedNew = this.firstAffectedLine(newLineBars, request);
    if (firstAffectedOld !== -1) {
      start = Math.min(start, firstAffectedOld);
      oldEnd = Math.max(oldEnd, firstAffectedOld + 1);
    }
    if (firstAffectedNew !== -1) {
      start = Math.min(start, firstAffectedNew);
      newEnd = Math.max(newEnd, firstAffectedNew + 1);
    }

    // Include one following line because tempo, time sig etc
    // visibility depends on the previous bar
    if (oldEnd < oldOwnership.length - 1) {
      oldEnd++;
    }
    if (newEnd < newOwnership.length - 1) {
      // Do not rebuild a line that is already preserved as suffix. This can
      // happen after removals, where old/new indices no longer refer to the
      // same master bars.
      const preservedSuffixKeys = new Set(
        oldLineBars.slice(oldEnd).map((lb) => this.getLineOwnershipKey(lb))
      );
      const nextNewLineKey = this.getLineOwnershipKey(newLineBars[newEnd]);
      if (!preservedSuffixKeys.has(nextNewLineKey)) {
        newEnd++;
      }
    }

    return { start, oldEnd, newEnd };
  }

  /** Captures element objects and state hashes before replacing a line window. */
  private snapshotElements(elements: NotationElement[]): ElementSnapshot {
    const snapshot: ElementSnapshot = {
      elements: new Map(),
      hashes: new Map(),
    };

    for (const element of elements) {
      const identity = element.getStableIdentity();
      snapshot.elements.set(identity, element);
      snapshot.hashes.set(identity, element.stateHash);
    }

    return snapshot;
  }

  /** Returns all notation elements owned by the provided track lines. */
  private getOwnedElements(trackLines: TrackLineElement[]): NotationElement[] {
    return trackLines.flatMap((l) => l.ownedNotationElements);
  }

  /** Removes elements from TrackElement registries before their owners go away. */
  private unregisterElements(elements: Iterable<NotationElement>): void {
    for (const element of elements) {
      this.unregisterElement(element);
    }
  }

  /**
   * Reconciles a replaced line-window snapshot against newly built elements and
   * records added, updated, and removed stable identities for the renderer.
   */
  private reconcileElementSnapshot(
    prevSnapshot: ElementSnapshot,
    nextElements: NotationElement[]
  ): void {
    const remainingPrevElements = new Map(prevSnapshot.elements);

    for (const element of nextElements) {
      const identity = element.getStableIdentity();
      if (!remainingPrevElements.has(identity)) {
        this.addToDiff(DiffPart.Added, element);
      } else if (prevSnapshot.hashes.get(identity) !== element.stateHash) {
        this.addToDiff(DiffPart.Updated, element);
      }

      this._elementHashesByIdentity.set(identity, element.stateHash);
      remainingPrevElements.delete(identity);
    }

    for (const element of remainingPrevElements.values()) {
      this.addToDiff(DiffPart.Removed, element);
    }
  }

  /**
   * Lays out rebuilt horizontal lines and vertically shifts preserved suffix
   * lines so their Y positions follow the changed window.
   */
  private layoutHorizontalWindow(
    startLineIndex: number,
    rebuiltLines: Set<TrackLineElement>
  ): void {
    for (let i = startLineIndex; i < this._trackLineElements.length; i++) {
      const trackLineElement = this._trackLineElements[i];
      if (rebuiltLines.has(trackLineElement)) {
        trackLineElement.layout();
      } else {
        trackLineElement.layoutVerticalShift();
      }
    }
  }

  /**
   * Applies a width-affecting update by rebuilding only the changed line window
   * and preserving unchanged prefix/suffix line objects.
   */
  public updateHorizontal(request: HorizontalUpdateRequest): void {
    // Get update window
    const oldLineBars = this._trackLineElements.map((tl) => tl.trackLineBars);
    const newLineBars = this.buildTrackLineSkeleton();
    const updateWindow = this.getChangedLineWindow(
      oldLineBars,
      newLineBars,
      request
    );

    // Snapshot old window elements before updating
    const oldWindowLines = this._trackLineElements.slice(
      updateWindow.start,
      updateWindow.oldEnd
    );
    const preservedSuffixLines = this._trackLineElements.slice(
      updateWindow.oldEnd
    );
    const oldWindowSnapshot = this.snapshotElements(
      this.getOwnedElements(oldWindowLines)
    );

    // Perform the actual update of the Elements
    this.unregisterElements(oldWindowSnapshot.elements.values());
    const newWindowLines = newLineBars
      .slice(updateWindow.start, updateWindow.newEnd)
      .map((trackLineBars) => new TrackLineElement(this, trackLineBars));
    this._trackLineElements = [
      ...this._trackLineElements.slice(0, updateWindow.start),
      ...newWindowLines,
      ...preservedSuffixLines,
    ];
    for (const trackLineElement of newWindowLines) {
      trackLineElement.measure();
    }
    this.layoutHorizontalWindow(updateWindow.start, new Set(newWindowLines));

    // Compute the diff optimally
    this.clearElementDiff();
    this.reconcileElementSnapshot(
      oldWindowSnapshot,
      this.getOwnedElements(newWindowLines)
    );
  }

  public updateTargeted(request: TargetedUpdateRequest): void {
    this.clearElementDiff();

    for (const modelUUID of request.affectedModelUUIDs) {
      const element = this._elementRegistryByModelUUID.get(modelUUID);
      if (!element) {
        throw new Error("Targeted update request element not found");
      }

      const beforeUpdate = element.refreshOwnedNotationElements();
      const beforeUpdateSnapshot = snapshotElements(beforeUpdate);
      element.update();
      const afterUpdate = element.refreshOwnedNotationElements();
      this.reconcileElementSnapshot(beforeUpdateSnapshot, afterUpdate);
    }
  }

  public updateFull(): void {
    const prevRegistry = new Map(this._elementRegistryByIdentity);
    const prevHashes = new Map(this._elementHashesByIdentity);

    this.build();
    this.measure();
    this.layout();

    this.computeElementDiff(prevRegistry, prevHashes);
  }

  public update(request: CommandUpdateRequest = { updateType: "Full" }): void {
    switch (request.updateType) {
      case "Vertical":
        return this.updateVertical(request);
      case "Horizontal":
        return this.updateHorizontal(request);
      case "Targeted":
        return this.updateTargeted(request);
      case "Full":
        return this.updateFull();
    }
  }

  /** Finds corresponding beat element */
  public findCorrespondingBeatElement(beat: Beat): BeatElement | undefined {
    const element = this._elementRegistryByModelUUID.get(beat.uuid);
    return element instanceof TabBeatElement ? element : undefined;
  }

  /** Finds beat element by beat UUID */
  public getBeatElementByUUID(beatUUID: number): BeatElement | undefined {
    const element = this._elementRegistryByModelUUID.get(beatUUID);
    return element instanceof TabBeatElement ? element : undefined;
  }

  /** Gets beat element global coords */
  public getBeatElementGlobalCoords(neededBeatElement: BeatElement): Point {
    return neededBeatElement.globalCoords;
  }

  /**
   * Gets next track element
   * @param trackElement Track element
   * @returns Next track element or null
   */
  public getNextTrackLineElement(
    trackLineElement: TrackLineElement
  ): TrackLineElement | null {
    const trackIndex = this._trackLineElements.indexOf(trackLineElement);
    const nextTrack = this._trackLineElements[trackIndex + 1];
    return nextTrack ?? null;
  }

  /**
   * Gets prev track element
   * @param trackElement Track element
   * @returns Prev track element or null
   */
  public getPrevTrackLineElement(
    trackLineElement: TrackLineElement
  ): TrackLineElement | null {
    const trackIndex = this._trackLineElements.indexOf(trackLineElement);
    const prevTrack = this._trackLineElements[trackIndex - 1];
    return prevTrack ?? null;
  }

  /**
   * Returns an array of selection rectangles:
   * Rectangle per staff line
   * @param beats All tracked selected beats
   */
  public getSelectionRects(beats: Beat[]): Rect[] {
    if (beats.length === 0) {
      return [];
    }

    const selectedBeats = new Set<Beat>(beats);

    const rects: Rect[] = [];
    let curLineRect: Rect | undefined;

    for (const trackLine of this._trackLineElements) {
      for (const staffLine of trackLine.staffLineElements) {
        if (curLineRect !== undefined) {
          rects.push(curLineRect);
        }
        curLineRect = undefined;

        for (const barElement of staffLine.styleLinesAsArray[0].barElements) {
          for (const beatElement of barElement.beatElements) {
            if (!selectedBeats.has(beatElement.beat)) {
              continue;
            }

            if (curLineRect === undefined) {
              curLineRect = new Rect(
                beatElement.globalCoords.x,
                beatElement.globalCoords.y,
                beatElement.boundingBox.width,
                staffLine.boundingBox.height
              );
              continue;
            }

            curLineRect.width +=
              beatElement.globalBoundingBox.right - curLineRect.right;
          }
        }
      }
    }

    if (curLineRect !== undefined) {
      rects.push(curLineRect);
    }

    return rects;
  }

  public getNoteElementsForNoteSlot(
    sourceNoteElement: TabNoteElement
  ): TabNoteElement[] {
    const bar = sourceNoteElement.beatElement.beat.voiceBar.bar;
    const commonTickRes = lcmAll(
      bar.voiceBarsAsArray.map((voiceBar) => voiceBar.tickResolution)
    );
    const sourceBeat = sourceNoteElement.beatElement.beat;
    const sourceStartTick =
      sourceBeat.startTick *
      (commonTickRes / sourceBeat.voiceBar.tickResolution);

    const result = [];
    for (const voiceBar of bar.voiceBarsAsArray) {
      for (const beat of voiceBar.beats) {
        const beatStartTick =
          beat.startTick * (commonTickRes / beat.voiceBar.tickResolution);
        if (beatStartTick !== sourceStartTick) {
          continue;
        }

        const beatElement = this._elementRegistryByModelUUID.get(beat.uuid);
        if (!(beatElement instanceof TabBeatElement)) {
          throw new Error("Beat's element is not a valid TabBeatElement");
        }

        const noteElement = this._elementRegistryByIdentity.get(
          TabNoteElement.createStableIdentity(
            beatElement,
            sourceNoteElement.stringNumber
          )
        );
        if (!(noteElement instanceof TabNoteElement)) {
          throw new Error("Note's element is not a valid NoteElement");
        }

        result.push(noteElement);
      }
    }

    return result;
  }

  /**
   * Consumes the diff - returns the diff and resets it
   * @returns Element diff
   */
  public consumeDiff(): ElementDiff {
    const consumedDiff = this._elementDiff;

    this._elementDiff = createEmptyDiff();

    return consumedDiff;
  }

  public get elementDiff(): ElementDiff {
    return this._elementDiff;
  }

  /** Read-only registry view for model UUID lookups. */
  public get elementRegistryByModelUUID(): ReadonlyMap<
    number,
    NotationElement
  > {
    return this._elementRegistryByModelUUID;
  }

  /** Read-only registry view for model UUID lookups. */
  public get elementRegistryByIdentity(): ReadonlyMap<string, NotationElement> {
    return this._elementRegistryByIdentity;
  }

  /** Track line elements getter */
  public get trackLineElements(): TrackLineElement[] {
    return this._trackLineElements;
  }

  /** Global coords of the track element (in most cases X=0, Y=0) */
  public get globalCoords(): Point {
    const firstLine = this._trackLineElements[0];
    return new Point(firstLine.boundingBox.x, firstLine.boundingBox.y);
  }

  /** Calculates the total height of the track element */
  public get height(): number {
    let height = 0;
    for (const line of this._trackLineElements) {
      height += line.boundingBox.height;
    }

    return height;
  }
}
