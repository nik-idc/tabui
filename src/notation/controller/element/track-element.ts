import { Beat, Track } from "@/notation/model";
import { randomInt, Point, Rect } from "@/shared";
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
import { GuitarTechniqueElement } from "./technique/guitar-technique/guitar-technique-element";
import { GuitarTechniqueLabelElement } from "./technique/guitar-technique/guitar-technique-label-element";

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
  added: Map<NotationElementClass, Map<number, NotationElement>>;
  updated: Map<NotationElementClass, Map<number, NotationElement>>;
  removed: Map<NotationElementClass, Set<number>>;
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

  /** Registry of all elements (modelUUID -> element) */
  private _elementRegistry: Map<number, NotationElement>;
  /** Keeps track of all elements' hash strings */
  private _elementHashes: Map<number, string>;
  /** Keeps track of changed elements grouped by type */
  private _dirtyElements: Map<
    NotationElementClass,
    Map<number, NotationElement>
  >;
  /** Structural diff between previous and current update cycles */
  private _elementDiff: ElementDiff;

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
    this._elementRegistry = new Map();
    this._elementHashes = new Map();
    this._dirtyElements = new Map();
    this._elementDiff = this.createEmptyDiff();

    this.build();
  }

  /**
   * Calculates how many lines are needed & which bars go into which lines.
   * Populates the "_trackLineElements" array
   */
  public build(): void {
    // Clear element registry to avoid duplicates on rebuild
    this._elementRegistry.clear();

    // Step 1: Organize bars into lines
    let width = 0;
    let largestBarWidth = 0;
    let curLineData: TrackLineData = [];
    let allFit = true;
    const linesData: TrackLineData[] = [];
    const masterBars = this.track.score.masterBars;
    for (let i = 0; i < masterBars.length; i++) {
      largestBarWidth = 0;

      // Check if current bar fits in all the staves
      // AND find the largest bar amonng the staves
      for (const staff of this.track.staves) {
        const bar = staff.bars[i];
        const barWidth = getBarWidth(bar);

        if (width + barWidth > 1200) {
          allFit = false;
        }

        if (barWidth > largestBarWidth) {
          largestBarWidth = barWidth;
        }
      }

      if (allFit) {
        // If fits, continue trying to fit the next master bar
        curLineData.push({
          largestBarWidth: largestBarWidth,
          masterBarIndex: i,
        });
        width += largestBarWidth;
      } else {
        // If doesn't fit, assume that current master bar fits
        // on the next line and continue
        width = largestBarWidth;
        if (curLineData.length === 1) {
          curLineData[0].largestBarWidth = EditorLayoutDimensions.WIDTH;
        }
        linesData.push(curLineData);
        allFit = true;
        curLineData = [{ largestBarWidth: largestBarWidth, masterBarIndex: i }];
      }
    }

    // Push remaining bars
    if (curLineData.length !== 0) {
      linesData.push(curLineData);
    }

    // Step 2: Use the 'linesData' array to build track line elements
    this._trackLineElements = [];
    for (const data of linesData) {
      this._trackLineElements.push(
        new TrackLineElement(this.track, this, data)
      );
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
    const lastIndex = this._trackLineElements.length - 1;
    for (let i = 0; i < this._trackLineElements.length; i++) {
      this._trackLineElements[i].layout();
      // Last line uses fake justify (scale = 1) to ensure state hash captures final positions
      const isLastLine = i === lastIndex;
      this._trackLineElements[i].justifyElements(isLastLine);
    }
  }

  /**
   * Updates the entire state of the track element in 3 steps:
   * - Build
   * - Measure
   * - Layout
   */
  public update(): void {
    const prevRegistry = new Map(this._elementRegistry);
    const prevHashes = new Map(this._elementHashes);

    this.build();
    this.measure();
    this.layout();

    this.computeElementDiff(prevRegistry, prevHashes);

    this.checkAllDirty();
  }

  public checkIfDirty(_element: NotationElement): void {}

  public registerElement(element: NotationElement): void {
    this._elementRegistry.set(element.getModelUUID(), element);
  }

  public checkAllDirty(): void {
    // Clear all dirty maps
    for (const map of this._dirtyElements.values()) {
      map.clear();
    }

    for (const element of this._elementRegistry.values()) {
      const modelUUID = element.getModelUUID();
      const prevHash = this._elementHashes.get(modelUUID);
      const curHash = element.stateHash;

      if (prevHash === undefined || prevHash !== curHash) {
        const ElementClass = element.constructor as NotationElementClass;

        if (!this._dirtyElements.has(ElementClass)) {
          this._dirtyElements.set(ElementClass, new Map());
        }

        this._dirtyElements.get(ElementClass)!.set(modelUUID, element);
        this._elementHashes.set(modelUUID, curHash);
      }
    }
  }

  public getDirtyElements(): Map<
    NotationElementClass,
    Map<number, NotationElement>
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
    return this._elementRegistry;
  }

  public getRegisteredElements(): NotationElement[] {
    return Array.from(this._elementRegistry.values());
  }

  public getElementByModelUUID(modelUUID: number): NotationElement | undefined {
    return this._elementRegistry.get(modelUUID);
  }

  /** Finds corresponding beat element */
  public findCorrespondingBeatElement(beat: Beat): BeatElement | undefined {
    const element = this._elementRegistry.get(beat.uuid);
    return element instanceof TabBeatElement ? element : undefined;
  }

  /** Finds beat element by beat UUID */
  public getBeatElementByUUID(beatUUID: number): BeatElement | undefined {
    const element = this._elementRegistry.get(beatUUID);
    return element instanceof TabBeatElement ? element : undefined;
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
    diffMap: Map<NotationElementClass, Map<number, NotationElement>>,
    element: NotationElement
  ): void {
    const elementClass = element.constructor as NotationElementClass;
    if (!diffMap.has(elementClass)) {
      diffMap.set(elementClass, new Map());
    }
    diffMap.get(elementClass)!.set(element.getModelUUID(), element);
  }

  private addToRemovedDiff(
    removedMap: Map<NotationElementClass, Set<number>>,
    element: NotationElement
  ): void {
    const elementClass = element.constructor as NotationElementClass;
    if (!removedMap.has(elementClass)) {
      removedMap.set(elementClass, new Set());
    }
    removedMap.get(elementClass)!.add(element.getModelUUID());
  }

  private computeElementDiff(
    prevRegistry: Map<number, NotationElement>,
    prevHashes: Map<number, string>
  ): void {
    this._elementDiff = this.createEmptyDiff();

    for (const [modelUUID, element] of this._elementRegistry) {
      const prevElement = prevRegistry.get(modelUUID);
      if (prevElement === undefined) {
        this.addToDiff(this._elementDiff.added, element);
        continue;
      }

      const prevHash = prevHashes.get(modelUUID);
      const curHash = element.stateHash;
      if (prevHash === undefined || prevHash !== curHash) {
        this.addToDiff(this._elementDiff.updated, element);
      }
    }

    for (const [modelUUID, element] of prevRegistry) {
      if (this._elementRegistry.has(modelUUID)) {
        continue;
      }
      this.addToRemovedDiff(this._elementDiff.removed, element);
    }
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
