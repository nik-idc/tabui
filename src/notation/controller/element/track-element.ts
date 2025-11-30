import { Score, Track, Bar, Beat, Note } from "@/notation/model";
import { randomInt, Point } from "@/shared";
import { BarElement } from "./bar-element";
import { BeatElement } from "./beat-element";
import { TrackLineElement } from "./track-line-element";
import { NoteElement } from "./note-element";
import { GuitarNoteElement } from "./guitar-note-element";

/**
 * Class that handles all geometry & visually relevant info of a track
 */
export class TrackElement {
  /** Unique identifier for the track element */
  readonly uuid: number;
  /** Track */
  readonly track: Track;

  /** Track line element */
  private _trackLineElements: TrackLineElement[] = [];

  /**
   * Class that handles all geometry & visually relevant info of a track
   * @param track Track
   */
  constructor(track: Track) {
    this.uuid = randomInt();
    this.track = track;

    this.calc();
  }

  /**
   * Calculates the entire track element & it's geometry
   * and visual info
   */
  public calc(): void {
    // Fuck it we ball - raw dog everything from scratch
    // Event binding being a problem is an issue in and of itself
    // since the render layer should track the models, not the element
    // And if I'm wrong I'll fix it so whatever

    // Go through all the master bars
    this._trackLineElements = []; // Clear track lines
    const masterBars = this.track.score.masterBars;
    let curLine = new TrackLineElement(this.track, this);
    for (let mBarIndex = 0; mBarIndex < masterBars.length; mBarIndex++) {
      if (curLine.addBar(mBarIndex)) {
        // If bar fits & succesfully added, just go to the next bar
        continue;
      }

      // Bar doesn't fit, so justify current line & move further down
      curLine.justifyStaves();
      this._trackLineElements.push(curLine);

      // Create new line & add first bar
      curLine = new TrackLineElement(this.track, this);
      if (!curLine.addBar(mBarIndex)) {
        throw Error("Could not fit first bar in an empty track line");
      }
    }

    if (!this._trackLineElements.includes(curLine)) {
      this._trackLineElements.push(curLine);
    }

    console.log(this);
  }

  /**
   * Returns note element's indices
   * @returns Array of note element's indices
   */
  public getNoteElementIndices(): number[] {
    return [-1];
  }

  /**
   * Resets beat selection for the entire track
   */
  public resetSelection(): void {
    for (const trackLineElement of this._trackLineElements) {
      for (const staffLineElement of trackLineElement.staffLineElements) {
        for (const barElement of staffLineElement.barElements) {
          for (const beatElement of barElement.beatElements) {
            beatElement.selected = false;
          }
        }
      }
    }
  }

  /**
   * Recalculates beat element selection
   * @param selectionBeats Selection beats
   */
  public recalcBeatElementSelection(selectionBeats: Beat[]): void {
    for (const trackLineElement of this._trackLineElements) {
      for (const staffLineElement of trackLineElement.staffLineElements) {
        for (const barElement of staffLineElement.barElements) {
          for (const beatElement of barElement.beatElements) {
            beatElement.selected = selectionBeats.some((beat) => {
              return beat.uuid === beatElement.beat.uuid;
            });
          }
        }
      }
    }
  }

  /**
   * Finds corresponding bar element
   * @param bar Bar
   * @returns Corresponding bar element
   */
  public findCorrespondingBarElement(bar: Bar): BarElement | undefined {
    for (const trackLineElement of this._trackLineElements) {
      for (const staffLineElement of trackLineElement.staffLineElements) {
        for (const barElement of staffLineElement.barElements) {
          if (barElement.bar.uuid === bar.uuid) {
            return barElement;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Finds corresponding beat element
   * @param beat Beat
   * @returns Corresponding beat element
   */
  public findCorrespondingBeatElement(beat: Beat): BeatElement | undefined {
    for (const trackLineElement of this._trackLineElements) {
      for (const staffLineElement of trackLineElement.staffLineElements) {
        for (const barElement of staffLineElement.barElements) {
          for (const beatElement of barElement.beatElements) {
            if (beatElement.beat.uuid === beat.uuid) {
              return beatElement;
            }
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Finds note element by note UUID
   * @param noteUUID Note UUID
   * @returns Note element (or undefined if not found)
   */
  public getNoteElementByUUID(noteUUID: number): NoteElement | undefined {
    for (const trackLineElement of this._trackLineElements) {
      for (const staffLineElement of trackLineElement.staffLineElements) {
        for (const barElement of staffLineElement.barElements) {
          for (const beatElement of barElement.beatElements) {
            const noteElements = beatElement.beatNotesElement.noteElements;
            for (const noteElement of noteElements) {
              if (noteElement.note.uuid === noteUUID) {
                return noteElement;
              }
            }
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Finds beat element by beat UUID
   * @param beatUUID Beat UUID
   * @returns Beat element (or undefined if not found)
   */
  public getBeatElementByUUID(beatUUID: number): BeatElement | undefined {
    for (const trackLineElement of this._trackLineElements) {
      for (const staffLineElement of trackLineElement.staffLineElements) {
        for (const barElement of staffLineElement.barElements) {
          for (const beatElement of barElement.beatElements) {
            if (beatElement.beat.uuid === beatUUID) {
              return beatElement;
            }
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Gets beat element's global coords
   * @param neededBeatElement Beat element whose coords to find
   * @returns Beat element global coords
   */
  public getBeatElementGlobalCoords(neededBeatElement: BeatElement): Point {
    let foundTrackLineElement: TrackLineElement | undefined;
    let foundBarElement: BarElement | undefined;
    for (const trackLineElement of this._trackLineElements) {
      for (const staffLineElement of trackLineElement.staffLineElements) {
        for (const barElement of staffLineElement.barElements) {
          for (const beatElement of barElement.beatElements) {
            if (beatElement.beat.uuid === neededBeatElement.beat.uuid) {
              foundTrackLineElement = trackLineElement;
              foundBarElement = barElement;
              break;
            }
          }
        }
      }
    }

    if (foundTrackLineElement === undefined || foundBarElement === undefined) {
      throw Error(
        "Could not find beat element's track line element or bar element"
      );
    }

    const tleOffset = new Point(0, foundTrackLineElement.rect.y);
    const barOffset = new Point(foundBarElement.rect.x, tleOffset.y);

    return new Point(
      barOffset.x + neededBeatElement.rect.x,
      barOffset.y + neededBeatElement.rect.y
    );
  }

  /**
   * Gets note element global coords
   * @param neededNoteElement Note element whose coords to find
   * @returns Note element global coords
   */
  public getNoteElementGlobalCoords(neededNoteElement: NoteElement): Point {
    let foundTrackLineElement: TrackLineElement | undefined;
    let foundBarElement: BarElement | undefined;
    let foundBeatElement: BeatElement | undefined;
    for (const trackLineElement of this._trackLineElements) {
      for (const staffLineElement of trackLineElement.staffLineElements) {
        for (const barElement of staffLineElement.barElements) {
          for (const beatElement of barElement.beatElements) {
            const noteElements = beatElement.beatNotesElement.noteElements;
            for (const noteElement of noteElements) {
              if (noteElement.note.uuid === neededNoteElement.note.uuid) {
                foundTrackLineElement = trackLineElement;
                foundBarElement = barElement;
                foundBeatElement = beatElement;
                break;
              }
            }
          }
        }
      }
    }

    if (
      foundTrackLineElement === undefined ||
      foundBarElement === undefined ||
      foundBeatElement === undefined
    ) {
      throw Error(
        "Could not find note element's track line OR bar OR note element"
      );
    }

    const tleOffset = new Point(0, foundTrackLineElement.rect.y);
    const barOffset = new Point(foundBarElement.rect.x, tleOffset.y);
    const beatOffset = new Point(
      barOffset.x + foundBeatElement.rect.x,
      barOffset.y + foundBeatElement.rect.y
    );

    const noteX = beatOffset.x;
    const noteY =
      beatOffset.y +
      foundBeatElement.beatNotesElement.rect.y +
      neededNoteElement.rect.y;

    return new Point(noteX, noteY);
  }

  /**
   * Gets note element text global coords
   * @param neededNoteElement Note element whose text coords to find
   * @returns Note element text global coords
   */
  public getGuitarNoteTextGlobalCoords(
    guitarNoteElement: GuitarNoteElement
  ): Point {
    let foundTrackLineElement: TrackLineElement | undefined;
    let foundBarElement: BarElement | undefined;
    let foundBeatElement: BeatElement | undefined;
    for (const trackLineElement of this._trackLineElements) {
      for (const staffLineElement of trackLineElement.staffLineElements) {
        for (const barElement of staffLineElement.barElements) {
          for (const beatElement of barElement.beatElements) {
            const noteElements = beatElement.beatNotesElement.noteElements;
            for (const noteElement of noteElements) {
              if (
                (noteElement as GuitarNoteElement).note.uuid ===
                guitarNoteElement.note.uuid
              ) {
                foundTrackLineElement = trackLineElement;
                foundBarElement = barElement;
                foundBeatElement = beatElement;
                break;
              }
            }
          }
        }
      }
    }

    if (
      foundTrackLineElement === undefined ||
      foundBarElement === undefined ||
      foundBeatElement === undefined
    ) {
      throw Error(
        "Could not find note element's track line OR bar OR note element"
      );
    }

    const tleOffset = new Point(0, foundTrackLineElement.rect.y);
    const barOffset = new Point(foundBarElement.rect.x, tleOffset.y);
    const beatOffset = new Point(
      barOffset.x + foundBeatElement.rect.x,
      barOffset.y + foundBeatElement.rect.y
    );

    const noteTextX = beatOffset.x + guitarNoteElement.textRect.x;
    const noteTextY =
      beatOffset.y +
      foundBeatElement.beatNotesElement.rect.y +
      guitarNoteElement.textRect.y;

    return new Point(noteTextX, noteTextY);
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

  /** Track line elements getter */
  public get trackLineElements(): TrackLineElement[] {
    return this._trackLineElements;
  }

  /** Global coords of the track element (in most cases X=0, Y=0) */
  public get globalCoords(): Point {
    const firstLine = this._trackLineElements[0];
    return new Point(firstLine.rect.x, firstLine.rect.y);
  }

  /** Calculates the total height of the track element */
  public get height(): number {
    let height = 0;
    for (const line of this._trackLineElements) {
      height += line.rect.height;
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
//     currentLine.rect.set(0, 0, 0, this.dim.trackLineMinHeight);
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
//       barElement.update(prevBar, currentLine.rect.rightTop.x);

//       if (!currentLine.barElementFits(barElement)) {
//         barElement.update(prevBar, 0);

//         currentLine.justifyElements();
//         currentLine.calcTechniqueGap();

//         const prevLine = currentLine;
//         currentLine =
//           oldLines.shift() ||
//           new TrackLineElement(this._track, this.dim, new Point(0, 0));
//         currentLine.barElements = [];
//         currentLine.rect.set(
//           0,
//           prevLine.rect.bottom,
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

//   // ==== ARGUABLY REALLY DUMB & UNNECESSARY ====
//   // ============================================
