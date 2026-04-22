import { Beat, Track } from "@/notation/model";
import { randomInt, Point, Rect } from "@/shared";
import {
  CommandUpdateRequest,
  HorizontalUpdateRequest,
  TargetedUpdateRequest,
  VerticalUpdateRequest,
} from "../editor/command/command";
import { EditorLayoutDimensions } from "../editor-layout-dimensions";
import { BarElement, getBarWidth } from "./bar/bar-element";
import { TrackLineData, TrackLineElement } from "./track/track-line-element";
import { BeatElement } from "./beat/beat-element";
import { StaffLineElement } from "./staff/staff-line-element";
import { NotationElement, NotationElementClass } from "./notation-element";
import { TabNoteElement } from "./note/tab-note-element";
import { TabBeatElement } from "./beat/tab-beat-element";
import { NotationStyleLineElement } from "./staff/notation-style-line-element";
import { BeamSegmentElement } from "./bar/beam-segment-element";
import { BarTupletGroupElement } from "./bar/bar-tuplet-group-element";
import { TechGapElement } from "./staff/tech-gap-element";
import { TechGapLineElement } from "./staff/tech-gap-line-element";
import { TrackLineInfoElement } from "./track/track-line-info-element";
import {
  getHorizontalWindow,
  HorizontalWindow,
  relayoutChangedHorizontalWindow,
} from "./track/update/track-element-horizontal-update";
import {
  applyVerticalUpdatesSequentially,
  getAffectedTrackLines,
} from "./track/update/track-element-vertical-update";
import { GuitarTechniqueElement } from "./technique/guitar-technique/guitar-technique-element";
import { GuitarTechniqueLabelElement } from "./technique/guitar-technique/guitar-technique-label-element";
import { SheetBeatElement } from "./beat/sheet-beat-element";
import { snapshotOwnedElements } from "./track/update/track-element-update-helpers";

/**
 * PERF: Types of track element updates (to improve performance)
 * - Vertical:
 * - - computes the affected lines;
 * - - full update of the affected lines;
 * - - Y shift of all lines after the first affected line
 * - Horizontal:
 * - - rebuilds skeleton;
 * - - compares skeleton with previous;
 * - - if no line changes -> full update of the current line
 * - - if lines makeup changed -> full update of every line start from the first affected one
 * - Full: full update of every line
 * - Cosmetic: change fret/add technique element (not sure how to implement this)
 * NOTE: It is important to remember that computing the diff & doing dirty checks
 * is very expensive performance-wise. The solution should be either:
 * a) Simpler & more efficient way for parents to list all their NotationElement children
 * b) More Maps (though it's best avoided given current over-abundance of Maps)
 */
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
  TabBeatElement,
  TabNoteElement,
  GuitarTechniqueElement,
  GuitarTechniqueLabelElement,
  BeamSegmentElement,
  BarTupletGroupElement,
  TechGapLineElement,
];

export interface ElementDiff {
  added: Map<NotationElementClass, Map<string, NotationElement>>;
  updated: Map<NotationElementClass, Map<string, NotationElement>>;
  removed: Map<NotationElementClass, Set<string>>;
}

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
  /** Keeps track of changed elements grouped by type */
  private _dirtyElements: Map<
    NotationElementClass,
    Map<string, NotationElement>
  >;
  /** Controls whether build paths may reuse existing element instances. */
  private _useElementReuse: boolean;
  /** Structural diff between previous and current update cycles */
  private _elementDiff: ElementDiff;
  /** Horizontal update bars whose content/intrinsic width actually changed. */
  private _horizontalAffectedBarIndices: Set<number> | null;
  // Purely for testing
  public counts: any = {};

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
    this._dirtyElements = new Map();
    this._useElementReuse = true;
    this._elementDiff = this.createEmptyDiff();
    this._horizontalAffectedBarIndices = null;
    this.build();
  }

  /**
   * Calculates how many lines are needed & which bars go into which lines.
   * Populates the "_trackLineElements" array
   */
  public build(): void {
    // Clear element registry to avoid duplicates on rebuild
    this._elementRegistryByIdentity.clear();
    this._elementRegistryByModelUUID.clear();

    const newSkeleton = this.buildTrackLineSkeleton();
    this._trackLineElements = this.buildTrackLineElementsFromSkeleton(
      newSkeleton,
      this._useElementReuse
        ? new Map(
            this._trackLineElements.map((element) => [
              element.getStableIdentity(),
              element,
            ])
          )
        : new Map<string, TrackLineElement>()
    );
  }

  private buildTrackLineSkeleton(): TrackLineData[] {
    let width = 0;
    let intrinsicBarWidth = 0;
    let curLineData: TrackLineData = [];
    let allFit = true;
    const linesData: TrackLineData[] = [];
    const masterBars = this.track.score.masterBars;
    for (let i = 0; i < masterBars.length; i++) {
      intrinsicBarWidth = 0;

      // Check if current bar fits in all the staves
      // AND find the largest bar amonng the staves
      for (const staff of this.track.staves) {
        const bar = staff.bars[i];
        const barWidth = getBarWidth(bar);

        if (width + barWidth > EditorLayoutDimensions.WIDTH) {
          allFit = false;
        }

        if (barWidth > intrinsicBarWidth) {
          intrinsicBarWidth = barWidth;
        }
      }

      if (allFit) {
        // If fits, continue trying to fit the next master bar
        curLineData.push({
          intrinsicWidth: intrinsicBarWidth,
          finalizedWidth: intrinsicBarWidth,
          masterBarIndex: i,
        });
        width += intrinsicBarWidth;
      } else {
        if (curLineData.length === 0) {
          curLineData = [
            {
              intrinsicWidth: intrinsicBarWidth,
              finalizedWidth: EditorLayoutDimensions.WIDTH,
              masterBarIndex: i,
            },
          ];
          linesData.push(curLineData);
          width = 0;
          allFit = true;
          curLineData = [];
          continue;
        }

        // If doesn't fit, assume that current master bar fits
        // on the next line and continue
        width = intrinsicBarWidth;
        if (curLineData.length === 1) {
          curLineData[0].finalizedWidth = EditorLayoutDimensions.WIDTH;
        }
        linesData.push(curLineData);
        allFit = true;
        curLineData = [
          {
            intrinsicWidth: intrinsicBarWidth,
            finalizedWidth: intrinsicBarWidth,
            masterBarIndex: i,
          },
        ];
      }
    }

    if (curLineData.length !== 0) {
      linesData.push(curLineData);
    }

    return linesData;
  }

  private buildTrackLineElementsFromSkeleton(
    linesData: TrackLineData[],
    prevTrackLineElements: Map<string, TrackLineElement>
  ): TrackLineElement[] {
    // Reuse existing line instances when line ownership is unchanged.
    const trackLineElements: TrackLineElement[] = [];
    for (const data of linesData) {
      const stableIdentity = TrackLineElement.createStableIdentity(
        this.track,
        data
      );
      const existingTrackLineElement =
        prevTrackLineElements.get(stableIdentity);
      if (existingTrackLineElement !== undefined) {
        existingTrackLineElement.setTrackLineData(data);
        existingTrackLineElement.build();
        trackLineElements.push(existingTrackLineElement);
        continue;
      }

      trackLineElements.push(new TrackLineElement(this.track, this, data));
    }

    return trackLineElements;
  }

  /**
   * Preserved full rebuild path for Phase 3 benchmarking/comparison.
   */
  public buildOld(): void {
    const prevUseElementReuse = this._useElementReuse;
    this._useElementReuse = false;
    this.build();
    this._useElementReuse = prevUseElementReuse;
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
   * Preserved full measure path for Phase 3 benchmarking/comparison.
   */
  public measureOld(): void {
    this.measure();
  }

  /**
   * Calculates coordinates for all child elements
   */
  public layout(): void {
    const lastIndex = this._trackLineElements.length - 1;
    for (let i = 0; i < this._trackLineElements.length; i++) {
      this._trackLineElements[i].layout();
      // Last line uses fake justify (scale = 1) to ensure state hash captures final positions
      const isLastLine = i === lastIndex;
      this._trackLineElements[i].justifyElements(isLastLine);
    }
  }

  /**
   * Preserved full layout path for Phase 3 benchmarking/comparison.
   */
  public layoutOld(): void {
    this.layout();
  }

  public updateVertical(request: VerticalUpdateRequest): void {
    const affectedTrackLines = getAffectedTrackLines(
      this,
      request.affectedModelUUIDs
    );
    if (affectedTrackLines.length === 0) {
      this.updateFull();
      return;
    }

    const prevOwnedByAffectedLine = snapshotOwnedElements(affectedTrackLines);

    this.clearElementDiff();
    this.clearDirtyElements();

    applyVerticalUpdatesSequentially(
      this._trackLineElements,
      affectedTrackLines
    );
    this.reconcileAffectedTrackLineUpdates(
      affectedTrackLines,
      prevOwnedByAffectedLine
    );
  }

  public updateHorizontal(request: HorizontalUpdateRequest): void {
    if (request.affectedMasterBarIndices.length === 0) {
      this.updateFull();
      return;
    }

    this._horizontalAffectedBarIndices = new Set(
      request.affectedMasterBarIndices
    );
    try {
      const oldRegistry = new Map(this._elementRegistryByIdentity);
      const oldHashes = new Map(this._elementHashesByIdentity);
      const oldLines = [...this._trackLineElements];
      const newSkeleton = this.buildTrackLineSkeleton();
      const window = getHorizontalWindow(
        oldLines,
        newSkeleton,
        request.firstAffectedMasterBarIndex
      );

      if (window === null) {
        // Width changed but current line ownership did not, so rebuild the
        // existing affected lines in place.
        this.updateHorizontalInPlace(request, newSkeleton);
        return;
      }

      this.replaceTrackLineWindow(oldLines, newSkeleton, window);
      this.finishHorizontalUpdate(
        oldRegistry,
        oldHashes,
        window.startLineIndex,
        window.newEndLineIndexExclusive
      );
    } finally {
      this._horizontalAffectedBarIndices = null;
    }
  }

  private replaceTrackLineWindow(
    oldLines: TrackLineElement[],
    newSkeleton: TrackLineData[],
    window: HorizontalWindow
  ): void {
    const oldWindowLines = oldLines.slice(
      window.startLineIndex,
      window.oldEndLineIndexExclusive
    );
    for (const trackLineElement of oldWindowLines) {
      for (const element of trackLineElement.ownedNotationElements) {
        this.unregisterElement(element);
      }
    }

    const oldWindowById = new Map(
      oldWindowLines.map((trackLineElement) => [
        trackLineElement.getStableIdentity(),
        trackLineElement,
      ])
    );
    const newWindowData = newSkeleton.slice(
      window.startLineIndex,
      window.newEndLineIndexExclusive
    );
    const newWindowLines = this.buildTrackLineElementsFromSkeleton(
      newWindowData,
      oldWindowById
    );
    const oldTrailingLines = oldLines.slice(window.oldEndLineIndexExclusive);

    this._trackLineElements = [
      ...oldLines.slice(0, window.startLineIndex),
      ...newWindowLines,
      ...oldTrailingLines,
    ];
  }

  private finishHorizontalUpdate(
    oldRegistry: Map<string, NotationElement>,
    oldHashes: Map<string, string>,
    startLineIndex: number,
    newEndLineIndexExclusive: number
  ): void {
    this.clearElementDiff();
    this.clearDirtyElements();

    // Re-measure the rebuilt window, shift the preserved suffix, then compute
    // the final diff against the old registries.
    relayoutChangedHorizontalWindow(
      this._trackLineElements,
      startLineIndex,
      newEndLineIndexExclusive
    );

    this.computeElementDiff(oldRegistry, oldHashes);
    this.checkAllDirty();
  }

  public updateTargeted(request: TargetedUpdateRequest): void {
    this.clearElementDiff();
    this.clearDirtyElements();

    const seenStableIdentities = new Set<string>();
    for (const modelUUID of request.affectedModelUUIDs) {
      const element = this._elementRegistryByModelUUID.get(modelUUID);
      if (element === undefined) {
        continue;
      }

      const stableIdentity = element.getStableIdentity();
      if (seenStableIdentities.has(stableIdentity)) {
        continue;
      }

      element.update();
      this.addToDiff(this._elementDiff.updated, element);

      const elementClass = element.constructor as NotationElementClass;
      let classDirtyElements = this._dirtyElements.get(elementClass);
      if (classDirtyElements === undefined) {
        classDirtyElements = new Map();
        this._dirtyElements.set(elementClass, classDirtyElements);
      }

      classDirtyElements.set(stableIdentity, element);
      this._elementHashesByIdentity.set(stableIdentity, element.stateHash);
      seenStableIdentities.add(stableIdentity);
    }
  }

  public updateFull(): void {
    const prevRegistry = new Map(this._elementRegistryByIdentity);
    const prevHashes = new Map(this._elementHashesByIdentity);

    this.build();
    this.measure();
    this.layout();

    this.computeElementDiff(prevRegistry, prevHashes);

    this.checkAllDirty();
  }

  /**
   * Updates the entire state of the track element in 3 steps:
   * - Build
   * - Measure
   * - Layout
   */
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

  /**
   * Preserved full-tree rebuild update path for Phase 3 benchmarking/comparison.
   */
  public updateOld(): void {
    const prevRegistry = new Map(this._elementRegistryByIdentity);
    const prevHashes = new Map(this._elementHashesByIdentity);

    this.buildOld();
    this.measureOld();
    this.layoutOld();

    this.computeElementDiff(prevRegistry, prevHashes);

    this.checkAllDirty();
  }

  public checkIfDirty(_element: NotationElement): void {}

  public registerElement(element: NotationElement): void {
    this._elementRegistryByIdentity.set(element.getStableIdentity(), element);

    if (
      element instanceof BarElement ||
      element instanceof TabBeatElement ||
      element instanceof SheetBeatElement ||
      element instanceof TabNoteElement ||
      element instanceof GuitarTechniqueElement ||
      element instanceof BarTupletGroupElement
    ) {
      const modelUUID = this.getBackingModelUUID(element);
      this._elementRegistryByModelUUID.set(modelUUID, element);
    }
  }

  public unregisterElement(element: NotationElement): void {
    this._elementRegistryByIdentity.delete(element.getStableIdentity());
    this._elementHashesByIdentity.delete(element.getStableIdentity());

    if (!this.isModelBackedElement(element)) {
      return;
    }

    const modelUUID = this.getBackingModelUUID(element);
    const currentElement = this._elementRegistryByModelUUID.get(modelUUID);
    if (currentElement === element) {
      this._elementRegistryByModelUUID.delete(modelUUID);
    }
  }

  public checkAllDirty(): void {
    // Clear all dirty maps
    for (const map of this._dirtyElements.values()) {
      map.clear();
    }

    for (const element of this._elementRegistryByIdentity.values()) {
      const stableIdentity = element.getStableIdentity();
      const prevHash = this._elementHashesByIdentity.get(stableIdentity);
      const curHash = element.stateHash;

      if (prevHash === undefined || prevHash !== curHash) {
        const ElementClass = element.constructor as NotationElementClass;

        if (!this._dirtyElements.has(ElementClass)) {
          this._dirtyElements.set(ElementClass, new Map());
        }

        this._dirtyElements.get(ElementClass)!.set(stableIdentity, element);
        this._elementHashesByIdentity.set(stableIdentity, curHash);
      }
    }
  }

  public getDirtyElements(): Map<
    NotationElementClass,
    Map<string, NotationElement>
  > {
    return this._dirtyElements;
  }

  public getElementDiff(): ElementDiff {
    return this._elementDiff;
  }

  public getElementOrder(): Array<NotationElementClass> {
    return ELEMENT_ORDER;
  }

  /** Read-only registry view for model UUID lookups. */
  public getElementRegistry(): ReadonlyMap<number, NotationElement> {
    return this._elementRegistryByModelUUID;
  }

  public getRegisteredElements(): NotationElement[] {
    return Array.from(this._elementRegistryByIdentity.values());
  }

  public getElementByModelUUID(modelUUID: number): NotationElement | undefined {
    return this._elementRegistryByModelUUID.get(modelUUID);
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

  public get useElementReuse(): boolean {
    return this._useElementReuse;
  }

  public isBarAffectedHorizontally(masterBarIndex: number): boolean {
    return this._horizontalAffectedBarIndices?.has(masterBarIndex) ?? false;
  }

  public get hasActiveHorizontalUpdate(): boolean {
    return this._horizontalAffectedBarIndices !== null;
  }

  /** Gets beat element global coords */
  public getBeatElementGlobalCoords(neededBeatElement: BeatElement): Point {
    return neededBeatElement.globalCoords;
  }

  public clearDirtyElements(): void {
    for (const map of this._dirtyElements.values()) {
      map.clear();
    }
    this.counts = {};
  }

  public clearElementDiff(): void {
    this._elementDiff = this.createEmptyDiff();
  }

  private createEmptyDiff(): ElementDiff {
    return {
      added: new Map(),
      updated: new Map(),
      removed: new Map(),
    };
  }

  private addToDiff(
    diffMap: Map<NotationElementClass, Map<string, NotationElement>>,
    element: NotationElement
  ): void {
    const elementClass = element.constructor as NotationElementClass;
    if (!diffMap.has(elementClass)) {
      diffMap.set(elementClass, new Map());
    }
    diffMap.get(elementClass)!.set(element.getStableIdentity(), element);
  }

  private addToRemovedDiff(
    removedMap: Map<NotationElementClass, Set<string>>,
    element: NotationElement
  ): void {
    const elementClass = element.constructor as NotationElementClass;
    if (!removedMap.has(elementClass)) {
      removedMap.set(elementClass, new Set());
    }
    removedMap.get(elementClass)!.add(element.getStableIdentity());
  }

  private computeElementDiff(
    prevRegistry: Map<string, NotationElement>,
    prevHashes: Map<string, string>
  ): void {
    this._elementDiff = this.createEmptyDiff();

    for (const [stableIdentity, element] of this._elementRegistryByIdentity) {
      const prevElement = prevRegistry.get(stableIdentity);
      if (prevElement === undefined) {
        this.addToDiff(this._elementDiff.added, element);
        continue;
      }

      const prevHash = prevHashes.get(stableIdentity);
      const curHash = element.stateHash;
      if (prevHash === undefined || prevHash !== curHash) {
        this.addToDiff(this._elementDiff.updated, element);
      }
    }

    for (const [stableIdentity, element] of prevRegistry) {
      if (this._elementRegistryByIdentity.has(stableIdentity)) {
        continue;
      }
      this.addToRemovedDiff(this._elementDiff.removed, element);
    }
  }

  private getBackingModelUUID(element: NotationElement): number {
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

  private isModelBackedElement(element: NotationElement): boolean {
    return (
      element instanceof BarElement ||
      element instanceof TabBeatElement ||
      element instanceof SheetBeatElement ||
      element instanceof TabNoteElement ||
      element instanceof GuitarTechniqueElement ||
      element instanceof BarTupletGroupElement
    );
  }

  private reconcileAffectedTrackLineUpdates(
    affectedTrackLines: TrackLineElement[],
    prevOwnedByAffectedLine: Map<string, Map<string, NotationElement>>
  ): void {
    for (const trackLineElement of affectedTrackLines) {
      const prevOwnedElements = prevOwnedByAffectedLine.get(
        trackLineElement.getStableIdentity()
      );
      if (prevOwnedElements === undefined) {
        continue;
      }

      const nextOwnedElements = new Map(
        trackLineElement.ownedNotationElements.map((element) => [
          element.getStableIdentity(),
          element,
        ])
      );

      this.reconcileRemovedAffectedElements(
        prevOwnedElements,
        nextOwnedElements
      );
      this.markAffectedLineContentsChanged(
        trackLineElement.ownedNotationElements,
        prevOwnedElements
      );
    }
  }

  private reconcileRemovedAffectedElements(
    prevOwnedElements: Map<string, NotationElement>,
    nextOwnedElements: Map<string, NotationElement>
  ): void {
    for (const [stableIdentity, prevElement] of prevOwnedElements) {
      if (nextOwnedElements.has(stableIdentity)) {
        continue;
      }

      this.unregisterElement(prevElement);
      this.addToRemovedDiff(this._elementDiff.removed, prevElement);
    }
  }

  private markAffectedLineContentsChanged(
    nextOwnedNotationElements: NotationElement[],
    prevOwnedElements: Map<string, NotationElement>
  ): void {
    for (const element of nextOwnedNotationElements) {
      const stableIdentity = element.getStableIdentity();
      if (prevOwnedElements.has(stableIdentity)) {
        this.addToDiff(this._elementDiff.updated, element);
      } else {
        this.addToDiff(this._elementDiff.added, element);
      }

      const elementClass = element.constructor as NotationElementClass;
      if (!this._dirtyElements.has(elementClass)) {
        this._dirtyElements.set(elementClass, new Map());
      }
      this._dirtyElements.get(elementClass)!.set(stableIdentity, element);
      this._elementHashesByIdentity.set(stableIdentity, element.stateHash);
    }
  }

  private updateHorizontalInPlace(
    request: HorizontalUpdateRequest,
    nextSkeleton: TrackLineData[]
  ): void {
    const affectedMasterBarIndices = request.affectedMasterBarIndices;
    const affectedTrackLines = this._trackLineElements.filter((tle) =>
      tle.trackLineData.some((tld) =>
        affectedMasterBarIndices.includes(tld.masterBarIndex)
      )
    );

    if (affectedTrackLines.length === 0) {
      this.updateFull();
      return;
    }

    const prevOwnedByAffectedLine = snapshotOwnedElements(affectedTrackLines);

    this.clearElementDiff();
    this.clearDirtyElements();

    const newLineDataById = new Map(
      nextSkeleton.map((trackLineData) => [
        TrackLineElement.createStableIdentity(this.track, trackLineData),
        trackLineData,
      ])
    );

    // The line grouping stayed the same, so only rebuild the current affected
    // lines and keep everything else in place.
    const lastTrackLineIndex = this._trackLineElements.length - 1;
    for (const trackLineElement of affectedTrackLines) {
      const nextTrackLineData = newLineDataById.get(
        trackLineElement.getStableIdentity()
      );
      if (nextTrackLineData !== undefined) {
        trackLineElement.setTrackLineData(nextTrackLineData);
      }

      const trackLineIndex = this._trackLineElements.indexOf(trackLineElement);
      trackLineElement.build();
      trackLineElement.measure();
      trackLineElement.layout();
      trackLineElement.justifyElements(trackLineIndex === lastTrackLineIndex);
    }

    this.reconcileAffectedTrackLineUpdates(
      affectedTrackLines,
      prevOwnedByAffectedLine
    );
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
