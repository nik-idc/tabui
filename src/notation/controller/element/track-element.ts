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

// // ===================================
// // ==== MOVE TO CONTROLLER EDITOR ====

// /**
//  * Handles added beat after moving right
//  */
// private handleAddedBeat(selectedNote: SelectedNote): void {
//   selectedNote.bar.appendBeat();
//   this.calc();
// }

// /**
//  * Handles added bar after moving right
//  * @param addedBar Added bar
//  */
// private handleAddedBar(addedBar: Bar): void {
//   // Add bar
//   this._score.appendBar(this._trackIndex, addedBar);

//   // Compute UI
//   const bar = this.track.bars[this.track.bars.length - 1];
//   const prevBar = this.track.bars[this.track.bars.length - 2];
//   this.addBar(bar, prevBar);
// }

// public handleMoveRight(
//   moveRightOutput: MoveRightOutput,
//   selectedNote: SelectedNote
// ): void {
//   switch (moveRightOutput.result) {
//     case MoveRightResult.Nothing:
//       break;
//     case MoveRightResult.AddedBeat:
//       this.handleAddedBeat(selectedNote);
//       break;
//     case MoveRightResult.AddedBar:
//       this.handleAddedBar(moveRightOutput.addedBar);
//       break;
//     default:
//       throw Error("Unexpected outcome after moving note right");
//   }
// }

// // ==== MOVE TO CONTROLLER EDITOR ====
// // ===================================

// // ==== RE-EVALUATE NECESSITY ====
// // ===============================
//
// /**
//  * Track window specific selected element ids
//  */
// export type SelectedNotesAndIds = {
//   /** Id of the track line element */
//   trackLineElementId: number;
//   /** If of the bar element (within the track line element) */
//   barElementId: number;
//   /** Id of the beat element, same as beat id, in here just for consistency's sake */
//   beatElementId: number;
//   /** String number */
//   stringNum: number;
//   /** Id of the track line element */
//   trackLineElement: TrackLineElement;
//   /** If of the bar element (within the track line element) */
//   barElement: BarElement;
//   /** Id of the beat element, same as beat id, in here just for consistency's sake */
//   beatElement: BeatElement | undefined;
//   /** String number */
//   noteElement: NoteElement | undefined;
// };

//   public getSelectedNoteElementsAndIds(
//     selectedNote: SelectedNote
//   ): SelectedNotesAndIds {
//     let trackLineElement: TrackLineElement | undefined;
//     let barElement: BarElement | undefined;
//     let trackLineElementId: number = -1;
//     let barElementId: number = -1;
//     this._trackLineElements.some((tle, tleIndex) => {
//       return tle.barElements.some((be, beIndex) => {
//         trackLineElement = tle;
//         trackLineElementId = tleIndex;
//         barElement = be;
//         barElementId = beIndex;
//         return be.bar.uuid === selectedNote.bar.uuid;
//       });
//     });

//     if (trackLineElement === undefined || barElement === undefined) {
//       throw Error("Could not find element");
//     }

//     const beatElement = barElement.beatElements[selectedNote.beatId];
//     const noteElement =
//       beatElement === undefined
//         ? undefined
//         : beatElement.beatNotesElement.noteElements[
//             selectedNote.stringNum - 1
//           ];

//     return {
//       trackLineElementId: trackLineElementId,
//       barElementId: barElementId,
//       beatElementId: selectedNote.beatId,
//       stringNum: selectedNote.stringNum,
//       trackLineElement: trackLineElement,
//       barElement: barElement,
//       beatElement: beatElement,
//       noteElement: noteElement,
//     };
//   }

//   public findCorrespondingNoteElement(
//     note: GuitarNote
//   ): NoteElement | undefined {
//     for (const trackLineElement of this._trackLineElements) {
//       for (const barElement of trackLineElement.barElements) {
//         for (const beatElement of barElement.beatElements) {
//           for (const noteElement of beatElement.beatNotesElement.noteElements)
//             if (noteElement.note.uuid === note.uuid) {
//               return noteElement;
//             }
//         }
//       }
//     }

//     return undefined;
//   }

//   // ===============================
//   // ==== RE-EVALUATE NECESSITY ====

// // ============================================
// // ==== ARGUABLY REALLY DUMB & UNNECESSARY ====

//   /**
//    * Calc track window. Goes through every bar of a track and calculates
//    * the resulting window with multiple bar lines
//    */
//   public calc_(): void {
//     // Main idea: only create new element if needed
//     // If an element has already been created, just recalc it

//     // A list of new bars means that a score has a list of new master bars
//     const totalMasterBars = this.track.score.masterBars;

//     const calcedMasterBars: MasterBar[] = this._trackLineElements.flatMap(
//       (tle) =>
//         tle.staffLineElements[0].barElements.map((be) => be.bar.masterBar)
//     );
//     const uncalcedMasterBars: MasterBar[] = totalMasterBars.filter(
//       (mb) => !calcedMasterBars.includes(mb)
//     );

//     // Run through all master bars
//     const oldLines = this._trackLineElements;
//     let currentLine =
//       oldLines.shift() || new TrackLineElement(this.track, this);
//     for (let i = 0; i < totalMasterBars.length; i++) {
//       if (calcedMasterBars.includes(totalMasterBars[i])) {
//         // Master bar is calced, so just recalc it and move on
//         for (const staffLineElement of currentLine.staffLineElements) {
//           staffLineElement.calc();
//         }
//       }

//       if (!currentLine.barFits(masterBar)) {
//         // Handle if bar doesn't fit
//         // 1.
//       }
//     }

//     const oldBarElements = this._trackLineElements.flatMap((tle) =>
//       tle.staffLineElements.flatMap((sle) => sle.barElements)
//     );

//     this._trackLineElements = [];

//     currentLine.barElements = [];
//     currentLine.boundingBox.set(0, 0, 0, this.dim.trackLineMinHeight);
//     currentLine.techniqueLabelsRect.setDimensions(0, 0);
//     this._trackLineElements.push(currentLine);

//     for (let barIndex = 0; barIndex < masterBars.length; barIndex++) {
//       const bar = this.track.bars[barIndex];
//       const prevBar = this.track.bars[barIndex - 1];

//       const oldElementIndex = oldBarElements.findIndex(
//         (e) => e.bar.uuid === bar.uuid
//       );
//       let barElement: BarElement;

//       if (oldElementIndex > -1) {
//         barElement = oldBarElements.splice(oldElementIndex, 1)[0];
//       } else {
//         barElement = BarElement.createBarElement(this.dim, bar, prevBar, 0, 0);
//       }
//       barElement.update(prevBar, currentLine.boundingBox.rightTop.x);

//       if (!currentLine.barElementFits(barElement)) {
//         barElement.update(prevBar, 0);

//         currentLine.justifyElements();
//         currentLine.calcTechniqueGap();

//         const prevLine = currentLine;
//         currentLine =
//           oldLines.shift() ||
//           new TrackLineElement(this._track, this.dim, new Point(0, 0));
//         currentLine.barElements = [];
//         currentLine.boundingBox.set(
//           0,
//           prevLine.boundingBox.bottom,
//           0,
//           this.dim.trackLineMinHeight + prevLine.techniqueLabelsRect.height
//         );
//         currentLine.techniqueLabelsRect.setDimensions(0, 0);
//         this._trackLineElements.push(currentLine);
//       }

//       currentLine.addBar(bar, barElement, prevBar);
//     }

//     currentLine.calcTechniqueGap();
//   }
//
//
// /**
//  * Resets beat selection for the entire track
//  */
// public resetSelection(): void {
//   for (const trackLineElement of this._trackLineElements) {
//     for (const staffLineElement of trackLineElement.staffLineElements) {
//       for (const barElement of staffLineElement.barElements) {
//         for (const beatElement of barElement.beatElements) {
//           beatElement.selected = false;
//         }
//       }
//     }
//   }
// }

// /**
//  * Recalculates beat element selection
//  * @param selectionBeats Selection beats
//  */
// public recalcBeatElementSelection(selectionBeats: Beat[]): void {
//   for (const trackLineElement of this._trackLineElements) {
//     for (const staffLineElement of trackLineElement.staffLineElements) {
//       for (const barElement of staffLineElement.barElements) {
//         for (const beatElement of barElement.beatElements) {
//           beatElement.selected = selectionBeats.some((beat) => {
//             return beat.uuid === beatElement.beat.uuid;
//           });
//         }
//       }
//     }
//   }
// }

// /**
//  * Finds corresponding bar element
//  * @param bar Bar
//  * @returns Corresponding bar element
//  */
// public findCorrespondingBarElement(bar: Bar): BarElement | undefined {
//   for (const trackLineElement of this._trackLineElements) {
//     for (const staffLineElement of trackLineElement.staffLineElements) {
//       for (const barElement of staffLineElement.barElements) {
//         if (barElement.bar.uuid === bar.uuid) {
//           return barElement;
//         }
//       }
//     }
//   }

//   return undefined;
// }

// /**
//  * Finds corresponding beat element
//  * @param beat Beat
//  * @returns Corresponding beat element
//  */
// public findCorrespondingBeatElement(beat: Beat): BeatElement | undefined {
//   for (const trackLineElement of this._trackLineElements) {
//     for (const staffLineElement of trackLineElement.staffLineElements) {
//       for (const barElement of staffLineElement.barElements) {
//         for (const beatElement of barElement.beatElements) {
//           if (beatElement.beat.uuid === beat.uuid) {
//             return beatElement;
//           }
//         }
//       }
//     }
//   }

//   return undefined;
// }

// /**
//  * Finds note element by note UUID
//  * @param noteUUID Note UUID
//  * @returns Note element (or undefined if not found)
//  */
// public getNoteElementByUUID(noteUUID: number): NoteElement | undefined {
//   for (const trackLineElement of this._trackLineElements) {
//     for (const staffLineElement of trackLineElement.staffLineElements) {
//       for (const barElement of staffLineElement.barElements) {
//         for (const beatElement of barElement.beatElements) {
//           const noteElements = beatElement.beatNotesElement.noteElements;
//           for (const noteElement of noteElements) {
//             if (noteElement.note.uuid === noteUUID) {
//               return noteElement;
//             }
//           }
//         }
//       }
//     }
//   }

//   return undefined;
// }

// /**
//  * Finds beat element by beat UUID
//  * @param beatUUID Beat UUID
//  * @returns Beat element (or undefined if not found)
//  */
// public getBeatElementByUUID(beatUUID: number): BeatElement | undefined {
//   for (const trackLineElement of this._trackLineElements) {
//     for (const staffLineElement of trackLineElement.staffLineElements) {
//       for (const barElement of staffLineElement.barElements) {
//         for (const beatElement of barElement.beatElements) {
//           if (beatElement.beat.uuid === beatUUID) {
//             return beatElement;
//           }
//         }
//       }
//     }
//   }

//   return undefined;
// }

// /**
//  * Gets beat element's global coords
//  * @param neededBeatElement Beat element whose coords to find
//  * @returns Beat element global coords
//  */
// public getBeatElementGlobalCoords(neededBeatElement: BeatElement): Point {
//   let foundTrackLineElement: TrackLineElement | undefined;
//   let foundBarElement: BarElement | undefined;
//   for (const trackLineElement of this._trackLineElements) {
//     for (const staffLineElement of trackLineElement.staffLineElements) {
//       for (const barElement of staffLineElement.barElements) {
//         for (const beatElement of barElement.beatElements) {
//           if (beatElement.beat.uuid === neededBeatElement.beat.uuid) {
//             foundTrackLineElement = trackLineElement;
//             foundBarElement = barElement;
//             break;
//           }
//         }
//       }
//     }
//   }

//   if (foundTrackLineElement === undefined || foundBarElement === undefined) {
//     throw Error(
//       "Could not find beat element's track line element or bar element"
//     );
//   }

//   const tleOffset = new Point(0, foundTrackLineElement.boundingBox.y);
//   const barOffset = new Point(foundBarElement.boundingBox.x, tleOffset.y);

//   return new Point(
//     barOffset.x + neededBeatElement.boundingBox.x,
//     barOffset.y + neededBeatElement.boundingBox.y
//   );
// }

// /**
//  * Gets note element global coords
//  * @param neededNoteElement Note element whose coords to find
//  * @returns Note element global coords
//  */
// public getNoteElementGlobalCoords(neededNoteElement: NoteElement): Point {
//   let foundTrackLineElement: TrackLineElement | undefined;
//   let foundBarElement: BarElement | undefined;
//   let foundBeatElement: BeatElement | undefined;
//   for (const trackLineElement of this._trackLineElements) {
//     for (const staffLineElement of trackLineElement.staffLineElements) {
//       for (const barElement of staffLineElement.barElements) {
//         for (const beatElement of barElement.beatElements) {
//           const noteElements = beatElement.beatNotesElement.noteElements;
//           for (const noteElement of noteElements) {
//             if (noteElement.note.uuid === neededNoteElement.note.uuid) {
//               foundTrackLineElement = trackLineElement;
//               foundBarElement = barElement;
//               foundBeatElement = beatElement;
//               break;
//             }
//           }
//         }
//       }
//     }
//   }

//   if (
//     foundTrackLineElement === undefined ||
//     foundBarElement === undefined ||
//     foundBeatElement === undefined
//   ) {
//     throw Error(
//       "Could not find note element's track line OR bar OR note element"
//     );
//   }

//   const tleOffset = new Point(0, foundTrackLineElement.boundingBox.y);
//   const barOffset = new Point(foundBarElement.boundingBox.x, tleOffset.y);
//   const beatOffset = new Point(
//     barOffset.x + foundBeatElement.boundingBox.x,
//     barOffset.y + foundBeatElement.boundingBox.y
//   );

//   const noteX = beatOffset.x;
//   const noteY =
//     beatOffset.y +
//     foundBeatElement.beatNotesElement.boundingBox.y +
//     neededNoteElement.boundingBox.y;

//   return new Point(noteX, noteY);
// }

// /**
//  * Gets note element text global coords
//  * @param neededNoteElement Note element whose text coords to find
//  * @returns Note element text global coords
//  */
// public getGuitarNoteTextGlobalCoords(TabNoteElement: TabNoteElement): Point {
//   let foundTrackLineElement: TrackLineElement | undefined;
//   let foundBarElement: BarElement | undefined;
//   let foundBeatElement: BeatElement | undefined;
//   for (const trackLineElement of this._trackLineElements) {
//     for (const staffLineElement of trackLineElement.staffLineElements) {
//       for (const barElement of staffLineElement.barElements) {
//         for (const beatElement of barElement.beatElements) {
//           const noteElements = beatElement.beatNotesElement.noteElements;
//           for (const noteElement of noteElements) {
//             if (
//               (noteElement as TabNoteElement).note.uuid ===
//               TabNoteElement.note.uuid
//             ) {
//               foundTrackLineElement = trackLineElement;
//               foundBarElement = barElement;
//               foundBeatElement = beatElement;
//               break;
//             }
//           }
//         }
//       }
//     }
//   }

//   if (
//     foundTrackLineElement === undefined ||
//     foundBarElement === undefined ||
//     foundBeatElement === undefined
//   ) {
//     throw Error(
//       "Could not find note element's track line OR bar OR note element"
//     );
//   }

//   const tleOffset = new Point(0, foundTrackLineElement.boundingBox.y);
//   const barOffset = new Point(foundBarElement.boundingBox.x, tleOffset.y);
//   const beatOffset = new Point(
//     barOffset.x + foundBeatElement.boundingBox.x,
//     barOffset.y + foundBeatElement.boundingBox.y
//   );

//   const noteTextX = beatOffset.x + TabNoteElement.textRect.x;
//   const noteTextY =
//     beatOffset.y +
//     foundBeatElement.beatNotesElement.boundingBox.y +
//     TabNoteElement.textRect.y;

//   return new Point(noteTextX, noteTextY);
// }
//
//
// /**
//  * Calculates the entire track element & it's geometry
//  * and visual info
//  */
// public calc(): void {
//   // Fuck it we ball - raw dog everything from scratch
//   // Event binding being a problem is an issue in and of itself
//   // since the render layer should track the models, not the element
//   // And if I'm wrong I'll fix it so whatever

//   // // Go through all the master bars
//   // this._trackLineElements = []; // Clear track lines
//   // const masterBars = this.track.score.masterBars;
//   // let curLine = new TrackLineElement(this.track, this);
//   // for (let mBarIndex = 0; mBarIndex < masterBars.length; mBarIndex++) {
//   //   if (curLine.addBar(mBarIndex)) {
//   //     // If bar fits & succesfully added, just go to the next bar
//   //     continue;
//   //   }

//   //   // Bar doesn't fit, so justify current line & move further down
//   //   curLine.justifyStaves();
//   //   this._trackLineElements.push(curLine);

//   //   // Create new line & add first bar
//   //   curLine = new TrackLineElement(this.track, this);
//   //   if (!curLine.addBar(mBarIndex)) {
//   //     throw Error("Could not fit first bar in an empty track line");
//   //   }
//   // }

//   // if (!this._trackLineElements.includes(curLine)) {
//   //   this._trackLineElements.push(curLine);
//   // }

// }

// /**
//  * Returns note element's indices
//  * @returns Array of note element's indices
//  */
// public getNoteElementIndices(): number[] {
//   return [-1];
// }

//   // ==== ARGUABLY REALLY DUMB & UNNECESSARY ====
//   // ============================================
