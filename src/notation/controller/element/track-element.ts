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
import { TabNoteElement } from "./note/tab-note-element";
import { TabBeatElement } from "./beat/tab-beat-element";
import { TabBeatRhythmElement } from "./beat/tab-beat-rhythm-element";
import { BeamSegmentElement } from "./bar/beam-segment-element";
import { BarTupletGroupElement } from "./bar/bar-tuplet-group-element";
import { TrackLineInfoElement } from "./track/track-line-info-element";
import { GuitarTechniqueElement } from "./technique/guitar-technique/guitar-technique-element";
import { GuitarTechniqueLabelElement } from "./technique/guitar-technique/guitar-technique-label-element";
import { EditorLayoutDimensions } from "../editor-layout-dimensions";

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
  TabNoteElement,
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

export type TrackElementLineUpdateOptions = {
  /** Explicit line range requested by viewport or test work. */
  lineRange?: TrackElementLineRange;
  /** Replace materialized lines outside this retained range with shells. */
  dematerializeOutsideRange?: TrackElementLineRange;
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

  /** Track line element */
  private _trackLineElements: TrackLineElement[];
  /** Current whole-track line ownership and predicted line heights. */
  private _skeleton: TrackElementSkeleton;

  private _materializedElementsByIdentity: Map<string, NotationElement>;
  /** Structural diff for materialized line work. */
  private _elementDiff: ElementDiff;
  /** Last materialized state consumed by the renderer. */
  private _diffBaselineSnapshot: ElementSnapshot | null;
  /** Materialized lines have full descendants; other lines are geometry shells. */
  private _materializedLineIndices: Set<number>;

  /**
   * Class that handles all geometry & visually relevant info of a track
   * @param track Track
   */
  constructor(track: Track, layoutDimensions: EditorLayoutDimensions) {
    this.uuid = randomInt();
    this.track = track;
    this.layoutDimensions = layoutDimensions;

    this._trackLineElements = [];
    this._skeleton = { lines: [] };
    this._materializedElementsByIdentity = new Map();
    this._elementDiff = {
      added: new Map(),
      updated: new Map(),
      removed: new Map(),
    };
    this._diffBaselineSnapshot = null;
    this._materializedLineIndices = new Set();
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
  }

  /** Consumes the materialized-line diff and resets it. */
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
    for (const lineIndex of this._materializedLineIndices) {
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
    this._materializedLineIndices.clear();
    this._skeleton = buildTrackElementSkeleton(
      this.track,
      this.layoutDimensions
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

    if (!this.isSameLineOwnership(a, b)) {
      return false;
    }

    for (let i = 0; i < a.trackLineBars.length; i++) {
      const aFinalWidth = a.trackLineBars[i].finalizedWidth;
      const bFinalWidth = b.trackLineBars[i].finalizedWidth;
      if (aFinalWidth !== bFinalWidth) {
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
        { line, isMaterialized: this._materializedLineIndices.has(index) },
      ])
    );
    const nextLines: TrackLineElement[] = [];
    const nextMaterializedIndices = new Set<number>();

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
        if (oldEntry.isMaterialized) {
          nextMaterializedIndices.add(i);
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
    this._materializedLineIndices = nextMaterializedIndices;
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

  /** Builds full descendant element trees for shells in the requested range. */
  private materializeLineRange(
    startLineIndex: number,
    endLineIndex: number,
    force: boolean
  ): void {
    const nextTrackLines = this._trackLineElements.slice(
      0,
      this._skeleton.lines.length
    );
    for (let i = startLineIndex; i <= endLineIndex; i++) {
      const oldTrackLine = this._trackLineElements[i];
      const nextSkeletonLine = this._skeleton.lines[i];
      if (
        !force &&
        oldTrackLine !== undefined &&
        this._materializedLineIndices.has(i) &&
        this.isSameSkeletonLine(oldTrackLine.skeletonLine, nextSkeletonLine)
      ) {
        continue;
      }

      const nextTrackLine =
        oldTrackLine ?? new TrackLineElement(this, nextSkeletonLine, i);
      nextTrackLine.setGeometryFromSkeleton(nextSkeletonLine);
      nextTrackLine.build();
      nextTrackLine.measure();
      if (
        nextTrackLine.boundingBox.height !== nextSkeletonLine.finalLineHeight
      ) {
        throw Error("Predicted track line height does not match measurement");
      }
      nextTrackLines[i] = nextTrackLine;
      this._materializedLineIndices.add(i);
    }

    // Assigning here because `TrackLineElement.layout` depends on `_trackLineElements`
    this._trackLineElements = nextTrackLines;

    for (let i = startLineIndex; i < this._trackLineElements.length; i++) {
      if (i <= endLineIndex && this._materializedLineIndices.has(i)) {
        this._trackLineElements[i].layout();
        continue;
      }

      this._trackLineElements[i]?.layoutVerticalShift();
    }
  }

  /** Replaces materialized lines outside the range with geometry-only shells. */
  private dematerializeOutsideLineRange(
    startLineIndex: number,
    endLineIndex: number
  ): void {
    for (const lineIndex of [...this._materializedLineIndices]) {
      if (lineIndex >= startLineIndex && lineIndex <= endLineIndex) {
        continue;
      }

      const shell = new TrackLineElement(
        this,
        this._skeleton.lines[lineIndex],
        lineIndex
      );
      this._trackLineElements[lineIndex] = shell;
      this._materializedLineIndices.delete(lineIndex);
    }
  }

  private rebuildSkeletonGeometry(): void {
    this._skeleton = buildTrackElementSkeleton(
      this.track,
      this.layoutDimensions
    );
    this.reconcileSkeletonLines();
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

  public update(options: TrackElementLineUpdateOptions = {}): void {
    this.beginDiffing();
    const affectedMasterBarIndices = options.affectedMasterBarIndices;
    const modelUpdate = affectedMasterBarIndices !== undefined;
    const rebuildSkeleton = modelUpdate || options.rebuildSkeleton !== false;
    const forceElements = options.forceElements ?? rebuildSkeleton;
    let lineRange = options.lineRange;

    if (rebuildSkeleton) {
      this.rebuildSkeletonGeometry();
    }
    if (modelUpdate) {
      lineRange =
        this.getAffectedLineRange(affectedMasterBarIndices) ?? undefined;
      if (lineRange === undefined) {
        this.completeDiffing();
        return;
      }
    }

    if (this._skeleton.lines.length === 0) {
      this.completeDiffing();
      return;
    }

    const { startLineIndex, endLineIndex } = this.normalizeLineRange(lineRange);

    this.materializeLineRange(startLineIndex, endLineIndex, forceElements);
    if (options.dematerializeOutsideRange !== undefined) {
      this.dematerializeOutsideLineRange(
        options.dematerializeOutsideRange.startLineIndex,
        options.dematerializeOutsideRange.endLineIndex
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

    for (const lineIndex of this._materializedLineIndices) {
      const trackLine = this._trackLineElements[lineIndex];
      if (trackLine === undefined) {
        continue;
      }

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

        const beatElement = this.getBeatElement(beat);
        if (!(beatElement instanceof TabBeatElement)) {
          throw new Error("Beat's element is not a valid TabBeatElement");
        }

        const noteElement = this._materializedElementsByIdentity.get(
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

  public get elementDiff(): ElementDiff {
    return this._elementDiff;
  }

  /** Track line elements getter */
  public get trackLineElements(): TrackLineElement[] {
    return this._trackLineElements;
  }

  public get materializedLineIndices(): ReadonlySet<number> {
    return this._materializedLineIndices;
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
}
