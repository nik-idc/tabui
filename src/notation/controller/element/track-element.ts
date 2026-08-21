import { Bar, Beat, lcmAll, Track } from "../../model";
import { randomInt, Point, Rect } from "../../../shared";
import { BarElement } from "./bar/bar-element";
import {
  TrackElementSkeleton,
  TrackElementSkeletonLine,
  TrackLineBar,
  TrackLineElement,
} from "./track/track-line-element";
import { buildTrackElementSkeleton } from "./track/track-element-skeleton-builder";
import { BeatElement } from "./beat/beat-element";
import { NotationElement, NotationElementClass } from "./notation-element";
import { TabNoteSlotElement } from "./note/tab-note-slot-element";
import { TabBeatElement } from "./beat/tab-beat-element";
import { TabBeatRhythmElement } from "./beat/tab-beat-rhythm-element";
import { BeamSegmentElement } from "./bar/beam-segment-element";
import { BarTupletGroupElement } from "./bar/bar-tuplet-group-element";
import { TrackLineInfoElement } from "./track/track-line-info-element";
import { GuitarTechniqueElement } from "./technique/guitar-technique/guitar-technique-element";
import { GuitarTechniqueLabelElement } from "./technique/guitar-technique/guitar-technique-label-element";
import { EditorLayoutDimensions } from "../editor-layout-dimensions";
import { ScoreLayoutPlanner } from "../layout/score-layout-plan";
import { TabUILayoutMode } from "../../../config/tabui-config";

function snapshotElements(elements: NotationElement[]): ElementSnapshot {
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

/**
 * ELEMENT_ORDER defines the order in which element types are rendered.
 * Parents must render before children.
 */
export const ELEMENT_ORDER: Array<NotationElementClass> = [
  TrackLineElement,
  TrackLineInfoElement,
  BarElement,
  TabBeatElement,
  TabNoteSlotElement,
  GuitarTechniqueElement,
  TabBeatRhythmElement,
  GuitarTechniqueLabelElement,
  BeamSegmentElement,
  BarTupletGroupElement,
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

export type TrackElementLineRange = {
  startLineIndex: number;
  endLineIndex: number;
};

export type TrackElementMasterBarRange = {
  startMasterBarIndex: number;
  endMasterBarIndex: number;
};

export type TrackElementUpdateOptions = {
  /** Explicit line range requested for viewport materialization. */
  lineRange?: TrackElementLineRange;
  /** Explicit master-bar range requested inside the selected lines. */
  masterBarRange?: TrackElementMasterBarRange;
  /** Replace materialized lines outside this retained range with shells. */
  dematerializeOutsideRange?: TrackElementLineRange;
  /** Retain descendants only for these master bars. */
  dematerializeOutsideMasterBarRange?: TrackElementMasterBarRange;
  /** Model changes whose line range must be resolved after skeleton rebuild. */
  affectedMasterBarIndices?: number[];
  /** Rebuild whole-track line ownership and shell geometry before updating. */
  rebuildSkeleton?: boolean;
  /** Rebuild requested materialized lines even when their skeleton is unchanged. */
  forceElements?: boolean;
};

/**
 * Class that handles all geometry & visually relevant info of a track
 */
export class TrackElement {
  /** Unique identifier for the track element */
  readonly uuid: number;
  /** Track */
  readonly track: Track;
  /** Layout dimensions */
  readonly layoutDimensions: EditorLayoutDimensions;
  /** Score-wide widths and wrapped ranges shared by active track views. */
  readonly scoreLayoutPlanner: ScoreLayoutPlanner;
  /** Immutable layout mode selected for this track view. */
  readonly layoutMode: TabUILayoutMode;

  /** Track line element */
  private _trackLineElements: TrackLineElement[];
  /** Current whole-track line ownership and predicted line heights. */
  private _skeleton: TrackElementSkeleton;

  private _materializedElementsByIdentity: Map<string, NotationElement>;
  /** Structural diff for materialized line work. */
  private _elementDiff: ElementDiff;
  /** Last materialized state consumed by the renderer. */
  private _diffBaselineSnapshot: ElementSnapshot | null;
  /** Materialized master-bar interval for each line with descendants. */
  private _materializedBarRangesByLineIndex: Map<
    number,
    TrackElementMasterBarRange
  >;
  /** Whether  */
  private _skeletonWasRebuilt: boolean;

  /**
   * Class that handles all geometry & visually relevant info of a track
   * @param track Track
   */
  constructor(
    track: Track,
    layoutDimensions: EditorLayoutDimensions,
    scoreLayoutPlanner?: ScoreLayoutPlanner,
    layoutMode: TabUILayoutMode = TabUILayoutMode.Wrapped
  ) {
    this.uuid = randomInt();
    this.track = track;
    this.layoutDimensions = layoutDimensions;
    this.scoreLayoutPlanner =
      scoreLayoutPlanner ??
      new ScoreLayoutPlanner(track.score, layoutDimensions);
    this.layoutMode = layoutMode;

    this._trackLineElements = [];
    this._skeleton = { lines: [] };
    this._materializedElementsByIdentity = new Map();
    this._elementDiff = {
      added: new Map(),
      updated: new Map(),
      removed: new Map(),
    };
    this._diffBaselineSnapshot = null;
    this._materializedBarRangesByLineIndex = new Map();
    this._skeletonWasRebuilt = false;
    this.build();
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

  public clearElementDiff(): void {
    this._elementDiff = {
      added: new Map(),
      updated: new Map(),
      removed: new Map(),
    };
    this._diffBaselineSnapshot = null;
    this._skeletonWasRebuilt = false;
  }

  /** Consumes the final materialized-range diff and resets its provenance. */
  public consumeDiff(): ElementDiff {
    const consumedDiff = this._elementDiff;

    this.clearElementDiff();

    return consumedDiff;
  }

  public hasPendingElementDiff(): boolean {
    const diffParts = [
      this._elementDiff.added,
      this._elementDiff.updated,
      this._elementDiff.removed,
    ];
    for (const diffPart of diffParts) {
      for (const identities of diffPart.values()) {
        if (identities.size !== 0) {
          return true;
        }
      }
    }

    return false;
  }

  private refreshMaterializedElements(): void {
    this._materializedElementsByIdentity.clear();

    const materializedElements: NotationElement[] = [];
    for (const lineIndex of this._materializedBarRangesByLineIndex.keys()) {
      materializedElements.push(
        ...(this._trackLineElements[lineIndex]?.drawableNotationElements ?? [])
      );
    }

    for (const element of materializedElements) {
      this._materializedElementsByIdentity.set(
        element.getStableIdentity(),
        element
      );
    }
  }

  /** Rebuilds the whole-track skeleton geometry without line descendants. */
  private build(): void {
    this._trackLineElements = [];
    this._materializedBarRangesByLineIndex.clear();
    this.scoreLayoutPlanner.rebuild();
    this._skeleton = buildTrackElementSkeleton(
      this.track,
      this.layoutDimensions,
      this.scoreLayoutPlanner.plan,
      this.layoutMode
    );
    for (let i = 0; i < this._skeleton.lines.length; i++) {
      this._trackLineElements.push(
        new TrackLineElement(this, this._skeleton.lines[i], i)
      );
    }

    this.refreshMaterializedElements();
  }

  /** Returns true when two line skeleton entries own the same master bars. */
  private isSameLineOwnership(
    a: TrackElementSkeletonLine,
    b: TrackElementSkeletonLine
  ): boolean {
    const aOwnership = a.trackLineBars.map((lb) => lb.masterBarUUID);
    const bOwnership = b.trackLineBars.map((lb) => lb.masterBarUUID);

    if (aOwnership.length !== bOwnership.length) {
      return false;
    }

    for (let i = 0; i < aOwnership.length; i++) {
      if (aOwnership[i] !== bOwnership[i]) {
        return false;
      }
    }

    return true;
  }

  /** Checks whether an existing materialized line still matches the skeleton. */
  private isSameSkeletonLine(
    a: TrackElementSkeletonLine,
    b: TrackElementSkeletonLine
  ): boolean {
    if (a.finalLineHeight !== b.finalLineHeight) {
      return false;
    }
    if (a.finalLineWidth !== b.finalLineWidth) {
      return false;
    }

    if (!this.isSameLineOwnership(a, b)) {
      return false;
    }

    for (let i = 0; i < a.trackLineBars.length; i++) {
      const aFinalWidth = a.trackLineBars[i].finalizedWidth;
      const bFinalWidth = b.trackLineBars[i].finalizedWidth;
      if (aFinalWidth !== bFinalWidth) {
        return false;
      }
      if (a.trackLineBars[i].x !== b.trackLineBars[i].x) {
        return false;
      }
    }

    return true;
  }

  private reconcileSnapshot(
    prevSnapshot: ElementSnapshot,
    nextElements: NotationElement[]
  ): void {
    this._elementDiff = {
      added: new Map(),
      updated: new Map(),
      removed: new Map(),
    };
    const remainingPrevElements = new Map(prevSnapshot.elements);

    for (const element of nextElements) {
      const identity = element.getStableIdentity();
      if (!remainingPrevElements.has(identity)) {
        this.addToDiff(DiffPart.Added, element);
      } else if (prevSnapshot.hashes.get(identity) !== element.stateHash) {
        this.addToDiff(DiffPart.Updated, element);
      }

      remainingPrevElements.delete(identity);
    }

    for (const element of remainingPrevElements.values()) {
      this.addToDiff(DiffPart.Removed, element);
    }
  }

  private beginDiffing(): void {
    if (this._diffBaselineSnapshot !== null) {
      return;
    }

    this._diffBaselineSnapshot = snapshotElements([
      ...this._materializedElementsByIdentity.values(),
    ]);
  }

  private completeDiffing(): void {
    this.refreshMaterializedElements();
    if (this._diffBaselineSnapshot === null) {
      throw Error("Cannot complete element diff without a baseline snapshot");
    }

    this.reconcileSnapshot(this._diffBaselineSnapshot, [
      ...this._materializedElementsByIdentity.values(),
    ]);
  }

  private reconcileSkeletonLines(): void {
    const oldLinesByIdentity = new Map(
      this._trackLineElements.map((line, index) => [
        line.getStableIdentity(),
        {
          line,
          materializedBarRange:
            this._materializedBarRangesByLineIndex.get(index),
        },
      ])
    );
    const nextLines: TrackLineElement[] = [];
    const nextMaterializedIndices = new Map<
      number,
      TrackElementMasterBarRange
    >();

    for (let i = 0; i < this._skeleton.lines.length; i++) {
      const skeletonLine = this._skeleton.lines[i];
      const identity = TrackLineElement.createStableIdentity(this.track, i);
      const oldEntry = oldLinesByIdentity.get(identity);
      let nextLine: TrackLineElement;
      if (
        oldEntry !== undefined &&
        this.isSameSkeletonLine(oldEntry.line.skeletonLine, skeletonLine)
      ) {
        nextLine = oldEntry.line;
        nextLine.setGeometryFromSkeleton(skeletonLine);
        if (oldEntry.materializedBarRange !== undefined) {
          nextMaterializedIndices.set(i, oldEntry.materializedBarRange);
        }
        oldLinesByIdentity.delete(identity);
      } else {
        nextLine = new TrackLineElement(this, skeletonLine, i);
        if (oldEntry !== undefined) {
          oldLinesByIdentity.delete(identity);
        }
      }

      nextLines.push(nextLine);
    }

    this._trackLineElements = nextLines;
    this._materializedBarRangesByLineIndex = nextMaterializedIndices;
  }

  private getAffectedLineRange(
    masterBarIndices: number[]
  ): TrackElementLineRange | null {
    if (this._skeleton.lines.length === 0) {
      return null;
    }

    let startLineIndex = Number.MAX_SAFE_INTEGER;
    let endLineIndex = -1;
    for (const masterBarIndex of masterBarIndices) {
      for (let i = 0; i < this._skeleton.lines.length; i++) {
        const line = this._skeleton.lines[i];
        for (const lineBar of line.trackLineBars) {
          if (lineBar.masterBarIndex !== masterBarIndex) {
            continue;
          }

          startLineIndex = Math.min(startLineIndex, i);
          endLineIndex = Math.max(endLineIndex, i);
          break;
        }
      }
    }

    if (endLineIndex === -1) {
      return null;
    }

    return {
      startLineIndex,
      endLineIndex: Math.min(this._skeleton.lines.length - 1, endLineIndex + 1),
    };
  }

  /** Returns the master bars whose descendants existed in the last snapshot. */
  private getMaterializedMasterBarIndices(): number[] {
    const indices = new Set<number>();
    for (const [lineIndex, range] of this._materializedBarRangesByLineIndex) {
      const trackLineBars =
        this._skeleton.lines[lineIndex]?.trackLineBars ?? [];
      for (const lineBar of trackLineBars) {
        if (
          lineBar.masterBarIndex >= range.startMasterBarIndex &&
          lineBar.masterBarIndex <= range.endMasterBarIndex
        ) {
          indices.add(lineBar.masterBarIndex);
        }
      }
    }
    return [...indices];
  }

  private mergeLineRanges(
    a: TrackElementLineRange | null,
    b: TrackElementLineRange | null
  ): TrackElementLineRange | undefined {
    if (a === null && b === null) {
      return undefined;
    }
    if (a === null) {
      return b ?? undefined;
    }
    if (b === null) {
      return a;
    }

    return {
      startLineIndex: Math.min(a.startLineIndex, b.startLineIndex),
      endLineIndex: Math.max(a.endLineIndex, b.endLineIndex),
    };
  }

  /** Builds full descendant element trees for shells in the requested range. */
  private materializeRange(
    startLineIndex: number,
    endLineIndex: number,
    masterBarRange: TrackElementMasterBarRange,
    force: boolean
  ): void {
    const nextTrackLines = this._trackLineElements.slice(
      0,
      this._skeleton.lines.length
    );
    for (let i = startLineIndex; i <= endLineIndex; i++) {
      const oldTrackLine = this._trackLineElements[i];
      const nextSkeletonLine = this._skeleton.lines[i];
      const materializedBars = nextSkeletonLine.trackLineBars.filter((b) => {
        return (
          b.masterBarIndex >= masterBarRange.startMasterBarIndex &&
          b.masterBarIndex <= masterBarRange.endMasterBarIndex
        );
      });
      if (materializedBars.length === 0) {
        continue;
      }
      const nextBarRange = {
        startMasterBarIndex: materializedBars[0].masterBarIndex,
        endMasterBarIndex:
          materializedBars[materializedBars.length - 1].masterBarIndex,
      };
      const prevBarRange = this._materializedBarRangesByLineIndex.get(i);
      if (
        !force &&
        oldTrackLine !== undefined &&
        prevBarRange?.startMasterBarIndex ===
          nextBarRange.startMasterBarIndex &&
        prevBarRange.endMasterBarIndex === nextBarRange.endMasterBarIndex &&
        this.isSameSkeletonLine(oldTrackLine.skeletonLine, nextSkeletonLine)
      ) {
        continue;
      }

      const nextTrackLine =
        oldTrackLine ?? new TrackLineElement(this, nextSkeletonLine, i);
      nextTrackLine.setGeometryFromSkeleton(nextSkeletonLine);
      nextTrackLine.build(materializedBars);
      nextTrackLine.measure();
      if (
        nextTrackLine.boundingBox.height !== nextSkeletonLine.finalLineHeight
      ) {
        throw Error("Predicted track line height does not match measurement");
      }
      nextTrackLines[i] = nextTrackLine;
      this._materializedBarRangesByLineIndex.set(i, nextBarRange);
    }

    // Assigning here because `TrackLineElement.layout` depends on `_trackLineElements`
    this._trackLineElements = nextTrackLines;

    for (let i = startLineIndex; i < this._trackLineElements.length; i++) {
      if (i <= endLineIndex && this._materializedBarRangesByLineIndex.has(i)) {
        this._trackLineElements[i].layout();
        continue;
      }

      this._trackLineElements[i]?.layoutVerticalShift();
    }
  }

  /** Replaces materialized lines outside the range with geometry-only shells. */
  private dematerializeOutsideRange(
    startLineIndex: number,
    endLineIndex: number,
    masterBarRange: TrackElementMasterBarRange
  ): void {
    for (const [lineIndex, range] of this._materializedBarRangesByLineIndex) {
      const retainedStart = Math.max(
        range.startMasterBarIndex,
        masterBarRange.startMasterBarIndex
      );
      const retainedEnd = Math.min(
        range.endMasterBarIndex,
        masterBarRange.endMasterBarIndex
      );
      const lineRetained =
        lineIndex >= startLineIndex &&
        lineIndex <= endLineIndex &&
        retainedStart <= retainedEnd;
      if (
        lineRetained &&
        retainedStart === range.startMasterBarIndex &&
        retainedEnd === range.endMasterBarIndex
      ) {
        continue;
      }

      if (lineRetained) {
        this.materializeRange(
          lineIndex,
          lineIndex,
          {
            startMasterBarIndex: retainedStart,
            endMasterBarIndex: retainedEnd,
          },
          false
        );
        continue;
      }

      const shell = new TrackLineElement(
        this,
        this._skeleton.lines[lineIndex],
        lineIndex
      );
      this._trackLineElements[lineIndex] = shell;
      this._materializedBarRangesByLineIndex.delete(lineIndex);
    }
  }

  private rebuildSkeletonGeometry(): void {
    this.scoreLayoutPlanner.rebuild();
    this._skeleton = buildTrackElementSkeleton(
      this.track,
      this.layoutDimensions,
      this.scoreLayoutPlanner.plan,
      this.layoutMode
    );
    this.reconcileSkeletonLines();
    this._skeletonWasRebuilt = true;
  }

  /**
   * Rebuilds line shells while preserving lazy materialization. Calling update
   * without a viewport range would materialize the whole track.
   */
  public refreshLayout(): void {
    this.beginDiffing();
    this.rebuildSkeletonGeometry();
    this.completeDiffing();
  }

  private normalizeLineRange(
    lineRange: TrackElementLineRange | undefined
  ): TrackElementLineRange {
    const startLineIndex = Math.max(0, lineRange?.startLineIndex ?? 0);
    const endLineIndex = Math.min(
      this._skeleton.lines.length - 1,
      lineRange?.endLineIndex ?? Number.MAX_SAFE_INTEGER
    );
    if (startLineIndex > endLineIndex) {
      throw Error("Invalid track element update range");
    }
    return { startLineIndex, endLineIndex };
  }

  private normalizeMasterBarRange(
    range: TrackElementMasterBarRange | undefined
  ): TrackElementMasterBarRange {
    const startMasterBarIndex = Math.max(0, range?.startMasterBarIndex ?? 0);
    const endMasterBarIndex = Math.min(
      this.track.score.masterBars.length - 1,
      range?.endMasterBarIndex ?? Number.MAX_SAFE_INTEGER
    );
    if (startMasterBarIndex > endMasterBarIndex) {
      throw Error("Invalid track element master-bar range");
    }
    return { startMasterBarIndex, endMasterBarIndex };
  }

  public update(options: TrackElementUpdateOptions = {}): void {
    this.beginDiffing();
    const affectedMasterBarIndices = options.affectedMasterBarIndices;
    const modelUpdate = affectedMasterBarIndices !== undefined;
    const rebuildSkeleton = modelUpdate || options.rebuildSkeleton !== false;
    const forceElements = options.forceElements ?? rebuildSkeleton;
    let lineRange = options.lineRange;
    let masterBarRange = options.masterBarRange;
    const materializedMasterBarIndices = modelUpdate
      ? this.getMaterializedMasterBarIndices()
      : [];

    if (rebuildSkeleton) {
      this.rebuildSkeletonGeometry();
    }
    if (modelUpdate) {
      lineRange = this.mergeLineRanges(
        this.getAffectedLineRange(affectedMasterBarIndices),
        this.getAffectedLineRange(materializedMasterBarIndices)
      );
      if (lineRange === undefined) {
        this.completeDiffing();
        return;
      }
      if (this.layoutMode === TabUILayoutMode.SingleLine) {
        const demandedMasterBarIndices = [
          ...affectedMasterBarIndices,
          ...materializedMasterBarIndices,
        ];
        masterBarRange = {
          startMasterBarIndex: Math.min(...demandedMasterBarIndices),
          endMasterBarIndex: Math.max(...demandedMasterBarIndices),
        };
      }
    }

    if (this._skeleton.lines.length === 0) {
      this.completeDiffing();
      return;
    }

    const { startLineIndex, endLineIndex } = this.normalizeLineRange(lineRange);
    const normalizedMasterBarRange =
      this.normalizeMasterBarRange(masterBarRange);

    this.materializeRange(
      startLineIndex,
      endLineIndex,
      normalizedMasterBarRange,
      forceElements
    );
    if (options.dematerializeOutsideRange !== undefined) {
      const retainedMasterBarRange = this.normalizeMasterBarRange(
        options.dematerializeOutsideMasterBarRange
      );
      this.dematerializeOutsideRange(
        options.dematerializeOutsideRange.startLineIndex,
        options.dematerializeOutsideRange.endLineIndex,
        retainedMasterBarRange
      );
    }
    this.completeDiffing();
  }

  public getTrackLineElementForBeat(beat: Beat): TrackLineElement | undefined {
    const bar = beat.voiceBar.bar;
    const masterBarIndex = bar.staff.bars.indexOf(bar);
    const lineIndex = this._skeleton.lines.findIndex((line) => {
      return line.trackLineBars.some((lineBar) => {
        return lineBar.masterBarIndex === masterBarIndex;
      });
    });
    return lineIndex === -1 ? undefined : this._trackLineElements[lineIndex];
  }

  /** Returns the score master-bar index that owns a model beat. */
  public getMasterBarIndexForBeat(beat: Beat): number {
    return beat.voiceBar.bar.staff.bars.indexOf(beat.voiceBar.bar);
  }

  /** Returns complete line-local placement data for a model beat's bar. */
  public getTrackLineBarForBeat(beat: Beat): TrackLineBar | undefined {
    const masterBarIndex = this.getMasterBarIndexForBeat(beat);
    for (const line of this._skeleton.lines) {
      const placement = line.trackLineBars.find(
        (b) => b.masterBarIndex === masterBarIndex
      );
      if (placement !== undefined) {
        return placement;
      }
    }
    return undefined;
  }

  public getBeatElement(beat: Beat): BeatElement | undefined {
    const trackLineElement = this.getTrackLineElementForBeat(beat);
    if (trackLineElement === undefined) {
      return undefined;
    }

    const identity = TabBeatElement.createStableIdentity(beat);

    const element = this._materializedElementsByIdentity.get(identity);
    return element instanceof TabBeatElement ? element : undefined;
  }

  public getMaterializedElementByIdentity(
    identity: ElementIdentity
  ): NotationElement | undefined {
    return this._materializedElementsByIdentity.get(identity);
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

    for (const lineIndex of this._materializedBarRangesByLineIndex.keys()) {
      const trackLine = this._trackLineElements[lineIndex];
      if (trackLine === undefined) {
        continue;
      }

      for (const staffLine of trackLine.staffLineContainers) {
        if (curLineRect !== undefined) {
          rects.push(curLineRect);
        }
        curLineRect = undefined;

        for (const barElement of staffLine.styleLinesAsArray[0].barElements) {
          for (const beatElement of barElement.beatElements) {
            if (!selectedBeats.has(beatElement.beat)) {
              continue;
            }
            if (!(beatElement instanceof TabBeatElement)) {
              continue;
            }

            const beatSelectionRect = beatElement.getGlobalVisualBounds();

            if (curLineRect === undefined) {
              curLineRect = new Rect(
                beatSelectionRect.x,
                beatSelectionRect.y,
                beatSelectionRect.width,
                staffLine.boundingBox.height
              );
              continue;
            }

            const lineRight = curLineRect.right;
            curLineRect.x = Math.min(curLineRect.x, beatSelectionRect.x);
            curLineRect.width =
              Math.max(lineRight, beatSelectionRect.right) - curLineRect.x;
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
    sourceNoteElement: TabNoteSlotElement
  ): TabNoteSlotElement[] {
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

        const beatElement = this.getBeatElement(beat);
        if (!(beatElement instanceof TabBeatElement)) {
          throw new Error("Beat's element is not a valid TabBeatElement");
        }

        const noteElement = this._materializedElementsByIdentity.get(
          TabNoteSlotElement.createStableIdentity(
            beatElement,
            sourceNoteElement.stringNumber
          )
        );
        if (!(noteElement instanceof TabNoteSlotElement)) {
          throw new Error("Note's element is not a valid NoteElement");
        }

        result.push(noteElement);
      }
    }

    return result;
  }

  public get elementDiff(): ElementDiff {
    return this._elementDiff;
  }

  /** Track line elements getter */
  public get trackLineElements(): TrackLineElement[] {
    return this._trackLineElements;
  }

  public get materializedLineIndices(): ReadonlySet<number> {
    return new Set(this._materializedBarRangesByLineIndex.keys());
  }

  public get materializedBarRangesByLineIndex(): ReadonlyMap<
    number,
    TrackElementMasterBarRange
  > {
    return this._materializedBarRangesByLineIndex;
  }

  public get skeletonWasRebuilt(): boolean {
    return this._skeletonWasRebuilt;
  }

  /** Global coords of the track element (in most cases X=0, Y=0) */
  public get globalCoords(): Point {
    const firstLine = this._trackLineElements[0];
    return new Point(firstLine.boundingBox.x, firstLine.boundingBox.y);
  }

  /** Calculates the total height of the track element */
  public get height(): number {
    const lastLine = this._skeleton.lines[this._skeleton.lines.length - 1];
    return lastLine === undefined ? 0 : lastLine.y + lastLine.finalLineHeight;
  }

  /** Width of the complete score line or wrapped notation viewport. */
  public get width(): number {
    return this._skeleton.lines.reduce(
      (width, line) => Math.max(width, line.finalLineWidth),
      0
    );
  }
}
