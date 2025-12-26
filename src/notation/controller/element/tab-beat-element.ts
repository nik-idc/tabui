import {
  Beat,
  DURATION_TO_FLAG_COUNT,
  GuitarNote,
  NoteDuration,
} from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { TabLayoutDimensions } from "../tab-controller-dim";
import { HorLine, VertLine } from "@/shared/rendering/geometry/line";
import { Circle } from "@/shared/rendering/geometry/circle";
import { TabNoteElement } from "./tab-note-element";
import { BeatElement, getBeatWidth } from "./beat-element";
import { BarElement } from "./bar-element";
import { NoteElement } from "./note-element";

/**
 * Class that handles geometry & visually relevant info of a beat
 */
export class TabBeatElement implements BeatElement {
  /** Beat element's unique identifier */
  readonly uuid: number;
  /** The beat */
  readonly beat: Beat;
  /** Parent bar element */
  readonly barElement: BarElement;

  /** Note elements */
  private _noteElements: TabNoteElement[];

  /** This beat's rect */
  private _rect: Rect;
  /** Duration stem vertical line */
  private _durationStemLine?: VertLine;
  /** Duration flags horizontal lines (for durations like 1/8, 1/16 etc) */
  private _durationFlagLines?: HorLine[];
  /** This beat's dot rect */
  private _dot1Circle?: Circle;
  /** This beat's dot rect */
  private _dot2Circle?: Circle;

  /**
   * Class that handles geometry & visually relevant info of a beat
   * @param beat Beat
   * @param barElement Parent bar element
   */
  constructor(beat: Beat, barElement: BarElement) {
    this.uuid = randomInt();
    this.beat = beat;
    this.barElement = barElement;

    this._noteElements = [];

    const width = getBeatWidth(this.beat);
    this._rect = new Rect(0, 0, width, 0);

    this.build();
  }

  /**
   * Initializes tab beat element state:
   * - Fills the note elements array
   * - Sets duration stem & flags
   * - Sets dot circles
   */
  public build(): void {
    this._noteElements = [];
    for (const note of this.beat.notes) {
      this._noteElements.push(new TabNoteElement(note as GuitarNote, this));
    }

    if (this.beat.bar.staff.showClassicNotation) {
      // Only show durations & else if classical notation is not enabled
      this._durationStemLine = undefined;
      this._durationFlagLines = undefined;
      this._dot1Circle = undefined;
      this._dot2Circle = undefined;
      return;
    }

    if (this.beat.baseDuration !== NoteDuration.Whole) {
      this._durationStemLine = new VertLine();
    } else {
      this._durationStemLine = undefined;
    }

    if (
      this.beat.baseDuration <= NoteDuration.Eighth &&
      this.beat.beamGroupId === null
    ) {
      // Flag lines should only be visible for beats
      // outside of beam groups AND of duration smaller than 8ths
      this._durationFlagLines = Array.from(
        { length: DURATION_TO_FLAG_COUNT[this.beat.baseDuration] },
        () => new HorLine()
      );
    } else {
      this._durationFlagLines = undefined;
    }

    if (this.beat.dots === 0) {
      this._dot1Circle = undefined;
      this._dot2Circle = undefined;
    } else if (this.beat.dots === 1) {
      this._dot1Circle = new Circle();
      this._dot2Circle = undefined;
    } else {
      this._dot1Circle = new Circle();
      this._dot2Circle = new Circle();
    }
  }

  /**
   * Calculates the dimensions of the tab beat element & it's children
   */
  public measure(): void {
    for (const noteElement of this._noteElements) {
      noteElement.measure();
    }

    const width = getBeatWidth(this.beat);
    const notesHeight =
      this._noteElements.length * TabLayoutDimensions.NOTE_RECT_HEIGHT;
    const height = notesHeight + TabLayoutDimensions.DURATIONS_HEIGHT;
    this._rect.setDimensions(width, height);

    if (this._dot1Circle !== undefined) {
      this._dot1Circle.diameter = TabLayoutDimensions.DOT_DIAMETER;
    }
    if (this._dot2Circle !== undefined) {
      this._dot2Circle.diameter = TabLayoutDimensions.DOT_DIAMETER;
    }
  }

  /**
   * Calculates the rectangles coordinates
   */
  private layoutRect(): void {
    const prevBeatElement = this.barElement.getPrevBeatElement(this);
    const x = prevBeatElement?.rect.right ?? this.barElement.startGap.right;

    this._rect.setCoords(x, 0);
  }

  /**
   * Calculates the coordinates of the duration stem & flags
   */
  private layoutDuration(): void {
    if (this._durationStemLine === undefined) {
      return;
    }
    const stemY1 = this._rect.height - TabLayoutDimensions.DURATIONS_HEIGHT;
    const stemY2 = stemY1 + TabLayoutDimensions.DURATIONS_HEIGHT;
    this._durationStemLine.set(this._rect.width / 2, stemY1, stemY2);
    if (this.beat.baseDuration === NoteDuration.Half) {
      this._durationStemLine.y1 += TabLayoutDimensions.DURATIONS_HEIGHT / 2;
    }

    if (this._durationFlagLines === undefined) {
      return;
    }
    let y = this._durationStemLine.y2;
    for (const flagLine of this._durationFlagLines) {
      const x1 = this._rect.width / 2;
      flagLine.set(x1, x1 + this._rect.width / 4, y);
      y -= TabLayoutDimensions.DOT_DIAMETER / 2;
    }
  }

  /**
   * Calculates the coordinates of the dots
   */
  private layoutDots(): void {
    if (this._dot1Circle === undefined) {
      return;
    }
    const newDot1X =
      this._rect.width / 2 + TabLayoutDimensions.DOT_DIAMETER * 2;
    let newDotY = this._rect.height - TabLayoutDimensions.DOT_DIAMETER / 2;
    if (this._durationFlagLines !== undefined) {
      newDotY -=
        TabLayoutDimensions.DURATION_FLAG_HEIGHT *
        this._durationFlagLines.length;
    }
    this._dot1Circle.setCoords(newDot1X, newDotY);

    if (this._dot2Circle === undefined) {
      return;
    }
    this._dot2Circle.setCoords(
      newDot1X + TabLayoutDimensions.DOT_DIAMETER,
      newDotY
    );
  }

  /**
   * Calculates all note element's & their childrens' coordinates
   */
  private layoutNotes(): void {
    for (const noteElement of this._noteElements) {
      noteElement.layout();
    }
  }

  /**
   * Calculates the coordinates of tab beat element & it's child note elements
   */
  public layout(): void {
    this.layoutRect();
    this.layoutDuration();
    this.layoutDots();

    this.layoutNotes();
  }

  /**
   * Scales beat element & all it's children horizontally
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    this._rect.x *= scale;
    this._rect.width *= scale;

    if (this._durationStemLine !== undefined) {
      this._durationStemLine.x *= scale;
    }
    if (this._durationFlagLines !== undefined) {
      for (const line of this._durationFlagLines) {
        line.x1 *= scale;
        line.x2 *= scale;
      }
    }

    if (this._dot1Circle !== undefined) {
      this._dot1Circle.centerX =
        this._rect.width / 2 + TabLayoutDimensions.DOT_DIAMETER; //HERE!!~!
    }
    if (this._dot1Circle !== undefined && this._dot2Circle !== undefined) {
      this._dot2Circle.centerX =
        this._dot1Circle.right + TabLayoutDimensions.DOT_DIAMETER;
    }

    for (const noteElement of this._noteElements) {
      noteElement.scaleHorBy(scale);
    }
  }

  /**
   * Gets next note element
   * @param noteElement Note element
   * @returns Next note element or null
   */
  public getNextNoteElement(
    noteElement: TabNoteElement
  ): TabNoteElement | null {
    const noteIndex = this._noteElements.indexOf(noteElement);
    const nextNote = this._noteElements[noteIndex + 1];
    return nextNote ?? null;
  }

  /**
   * Gets prev note element
   * @param noteElement Note element
   * @returns Prev note element or null
   */
  public getPrevNoteElement(
    noteElement: TabNoteElement
  ): TabNoteElement | null {
    const noteIndex = this._noteElements.indexOf(noteElement);
    const prevNote = this._noteElements[noteIndex - 1];
    return prevNote ?? null;
  }

  /** Beat's note element */
  public get noteElements(): TabNoteElement[] {
    return this._noteElements;
  }

  /** This beat's rect */
  public get rect(): Rect {
    return this._rect;
  }

  /** This beat's rect in global coords */
  public get rectGlobal(): Rect {
    return new Rect(
      this.globalCoords.x,
      this.globalCoords.y,
      this._rect.width,
      this._rect.height
    );
  }

  /** Duration stem vertical line */
  public get durationStemLine(): VertLine | undefined {
    return this._durationStemLine;
  }

  /** Duration stem vertical line in global coords */
  public get durationStemLineGlobal(): VertLine | undefined {
    if (this._durationStemLine === undefined) {
      return undefined;
    }

    return new VertLine(
      this.globalCoords.x + this._durationStemLine.x,
      this.globalCoords.y + this._durationStemLine.y1,
      this.globalCoords.y + this._durationStemLine.y2
    );
  }

  /** Duration flags horizontal lines (for durations like 1/8, 1/16 etc) */
  public get durationFlagLines(): HorLine[] | undefined {
    return this._durationFlagLines;
  }

  /** Duration flags horizontal lines (for durations like 1/8, 1/16 etc) */
  public get durationFlagLinesGlobal(): HorLine[] | undefined {
    if (this._durationFlagLines === undefined) {
      return undefined;
    }

    const result = [];
    for (const flagLine of this._durationFlagLines) {
      result.push(
        new HorLine(
          this.globalCoords.x + flagLine.x1,
          this.globalCoords.x + flagLine.x2,
          this.globalCoords.y + flagLine.y
        )
      );
    }
    return result;
  }

  /** This beat's first dot circle */
  public get dot1Circle(): Circle | undefined {
    return this._dot1Circle;
  }

  /** This beat's first dot circle in global coords */
  public get dot1CircleGlobal(): Circle | undefined {
    if (this._dot1Circle === undefined) {
      return undefined;
    }

    return new Circle(
      this.globalCoords.x + this._dot1Circle.centerX,
      this.globalCoords.y + this._dot1Circle.centerY,
      this._dot1Circle.diameter
    );
  }

  /** This beat's second dot circle */
  public get dot2Circle(): Circle | undefined {
    return this._dot2Circle;
  }

  /** This beat's second dot circle in global coords */
  public get dot2CircleGlobal(): Circle | undefined {
    if (this._dot2Circle === undefined) {
      return undefined;
    }

    return new Circle(
      this.globalCoords.x + this._dot2Circle.centerX,
      this.globalCoords.y + this._dot2Circle.centerY,
      this._dot2Circle.diameter
    );
  }

  /** Global coords of the tab beat element */
  public get globalCoords(): Point {
    return new Point(
      this.barElement.globalCoords.x + this._rect.x,
      this.barElement.globalCoords.y + this._rect.y
    );
  }
}


// import { Beat, Guitar, GuitarTechnique } from "@/notation/model";
// import { Rect, Point, randomInt } from "@/shared";
// import { BeatNotesElement } from "./beat-notes-element";
// import { BarElement } from "./bar-element";
// import { TabLayoutDimensions } from "../tab-controller-dim";
// import { GuitarTechniqueLabelElement } from "./technique/guitar-technique/guitar-technique-label-element";
// import { TECHNIQUE_TYPE_TO_LABEL } from "./technique/guitar-technique/guitar-technique-element-lists";
// import { TechniqueLabelElement } from "./technique/technique-label-element";
// import { BeatElement } from "./beat-element";

// // These 2 being defined like this is maybe bad
// // but as long as they're only needed here
// // I don't really see the reason to move them
// const dotScale1Dot = 1.05;
// const dotScale2Dot = 1.1;

// /**
//  * Class that handles geometry & visually relevant info of a beat
//  */
// export class BeatElement_old implements BeatElement {
//   /** Beat element's unique identifier */
//   readonly uuid: number;
//   /** The beat */
//   readonly beat: Beat;
//   /** Parent bar element */
//   readonly barElement: BarElement;

//   /** This beat's note element */
//   private _beatNotesElement: BeatNotesElement;
//   /** Technique label element */
//   private _techniqueLabelElements: TechniqueLabelElement[];
//   /** This beat's rectangle */
//   private _rect: Rect;
//   /** This beat's duration rectangle */
//   private _durationRect: Rect;
//   /** This beat's dot rectangle */
//   private _dotRect: Rect;
//   /** Technique labels rectangle */
//   private _techniqueLabelsRect: Rect;
//   /** Inidicates whether this beat element is selected */
//   private _selected: boolean = false;

//   /**
//    * Class that handles geometry & visually relevant info of a beat
//    * @param beat Beat
//    * @param barElement Parent bar element
//    * @param labelsGapHeight Labels gap heigh (0 by default)
//    */
//   constructor(beat: Beat, barElement: BarElement, labelsGapHeight: number = 0) {
//     this.uuid = randomInt();
//     this.beat = beat;
//     this.barElement = barElement;

//     this._beatNotesElement = new BeatNotesElement(this.beat, this);
//     this._techniqueLabelElements = [];
//     this._rect = new Rect(
//       barElement.timeSigRect.width,
//       barElement.rect.y + TabLayoutDimensions.TEMPO_RECT_HEIGHT
//     );
//     this._durationRect = new Rect();
//     this._dotRect = new Rect();
//     this._techniqueLabelsRect = new Rect(
//       0,
//       TabLayoutDimensions.DURATIONS_HEIGHT,
//       0,
//       labelsGapHeight
//     );

//     this.calc();
//   }

//   /**
//    * Calculates main rectangle & notes within the beat
//    */
//   private calcRectAndNotes(): void {
//     const prevBarElement =
//       this.barElement.beatElements[this.barElement.beatElements.length - 1];
//     this._rect.x = prevBarElement?._rect.right ?? this._rect.x;

//     let mappingWidth = TabLayoutDimensions.WIDTH_MAPPING.get(
//       this.beat.baseDuration
//     );
//     if (mappingWidth === undefined) {
//       throw Error(
//         `${this.beat.baseDuration} is an invalid beat duration OR error in mapping`
//       );
//     }
//     this._rect.width = mappingWidth;

//     // By how much the rect width should multiply depending on the number of dots
//     let dotsScaling = 1;
//     switch (this.beat.dots) {
//       case 0:
//         dotsScaling = 1;
//         break;
//       case 1:
//         dotsScaling = dotScale1Dot;
//         break;
//       case 2:
//         dotsScaling = dotScale2Dot;
//         break;
//       default:
//         dotsScaling = 1;
//         break;
//     }
//     this._rect.width *= dotsScaling;

//     if (this.beat.tupletSettings !== null) {
//       const tupletScale =
//         this.beat.tupletSettings.tupletCount /
//         this.beat.tupletSettings.normalCount;
//       this._rect.width *= tupletScale;
//       if (this._rect.width < TabLayoutDimensions.NOTE_RECT_WIDTH_MIN) {
//         // To make sure beats don't get too small causing UI errors
//         this._rect.width = TabLayoutDimensions.NOTE_RECT_WIDTH_MIN;
//       }
//     }

//     this._rect.height =
//       this.barElement.rect.height - this.barElement.tempoRect.height;

//     this._techniqueLabelsRect.width = this._rect.width;

//     this._beatNotesElement.rect.width = this._rect.width;
//     this._beatNotesElement.rect.y =
//       TabLayoutDimensions.DURATIONS_HEIGHT + this._techniqueLabelsRect.height;
//     this._beatNotesElement.rect.height =
//       TabLayoutDimensions.NOTE_RECT_HEIGHT *
//       this.beat.trackContext.instrument.maxPolyphony;

//     this._beatNotesElement.calc();
//   }

//   /**
//    * Calculates beat duration rectangle
//    */
//   private calcDurationRect(): void {
//     // 140 - radius of ellipse in SVG files, 827 - viewBox
//     const magicNumber = 140 / 827; // some bullshit
//     const offset = magicNumber * TabLayoutDimensions.DURATIONS_WIDTH * 2;
//     const beamingX =
//       this._rect.width / 2 - TabLayoutDimensions.DURATIONS_WIDTH / 2 - offset;
//     this._durationRect.x = this.beat.beamGroupId === null ? 0 : beamingX;
//     this._durationRect.y = 0;
//     this._durationRect.width = TabLayoutDimensions.DURATIONS_WIDTH;
//     this._durationRect.height = TabLayoutDimensions.DURATIONS_HEIGHT;
//   }

//   /**
//    * Calculates beaming rectangle
//    */
//   private calcBeamRect(): void {
//     this._dotRect.set(
//       this._durationRect.right,
//       0,
//       TabLayoutDimensions.DURATIONS_WIDTH,
//       TabLayoutDimensions.DURATIONS_HEIGHT
//     );
//   }

//   /**
//    * Calculates technique labels
//    */
//   private calcTechniqueLabels(): void {
//     this._techniqueLabelElements = [];

//     let totalLabelsHeight: number = 0;
//     const noteElements = this._beatNotesElement.noteElements;
//     for (const noteElement of noteElements) {
//       for (const technique of noteElement.note.techniques) {
//         if (!TECHNIQUE_TYPE_TO_LABEL[technique.type]) {
//           continue;
//         }

//         if (this.beat.trackContext.instrument instanceof Guitar) {
//           const labelElement = new GuitarTechniqueLabelElement(
//             technique as GuitarTechnique,
//             this
//           );
//           this._techniqueLabelElements.push(labelElement);
//           totalLabelsHeight += TabLayoutDimensions.TECHNIQUE_LABEL_HEIGHT;
//         }
//       }
//     }

//     if (totalLabelsHeight > 0) {
//       this.setTechniqueGap(totalLabelsHeight);
//     }
//   }

//   /**
//    * Calculate dimensions of the beat element and its' child element
//    */
//   public calc(): void {
//     this.calcRectAndNotes();
//     this.calcDurationRect();
//     this.calcBeamRect();
//     this.calcTechniqueLabels();
//   }

//   /**
//    * Sets height of the beat element
//    */
//   public setHeight(newHeight: number): void {
//     const diff = newHeight - this._rect.height;
//     this._techniqueLabelsRect.height += diff;
//     this._beatNotesElement.rect.y += diff;
//     this._rect.height += diff;
//   }

//   /**
//    * Sets new technique label hap
//    * @param newGapHeight New technique label gap height
//    */
//   public setTechniqueGap(newGapHeight: number): void {
//     const oldGapHeight = this._techniqueLabelsRect.height;

//     this._beatNotesElement.rect.y += newGapHeight - oldGapHeight;
//     this._rect.height += newGapHeight - oldGapHeight;

//     this._techniqueLabelsRect.height = newGapHeight;
//   }

//   /**
//    * Inserts a gap between the durations rectangle and beat notes.
//    * The result is that the beat element is taller, beat notes are
//    * moved down and the gap between durations and notes is increased
//    * (or created if there was none)
//    */
//   public insertTechniqueGap(): void {
//     this._techniqueLabelsRect.height +=
//       TabLayoutDimensions.TECHNIQUE_LABEL_HEIGHT;
//     this._beatNotesElement.rect.y += TabLayoutDimensions.TECHNIQUE_LABEL_HEIGHT;
//     this._rect.height += TabLayoutDimensions.TECHNIQUE_LABEL_HEIGHT;
//   }

//   /**
//    * Removes technique label gap
//    */
//   public removeTechniqueGap(): void {
//     this._techniqueLabelsRect.height -=
//       TabLayoutDimensions.TECHNIQUE_LABEL_HEIGHT;
//     this._beatNotesElement.rect.y -= TabLayoutDimensions.TECHNIQUE_LABEL_HEIGHT;
//     this._rect.height -= TabLayoutDimensions.TECHNIQUE_LABEL_HEIGHT;
//   }

//   /**
//    * Scales beat element & all it's children horizontally
//    * @param scale Scale factor
//    */
//   public scaleHorBy(scale: number): void {
//     if (this.beat.beamGroupId !== undefined) {
//       const diff = this._rect.width * scale - this._durationRect.width;
//       this._durationRect.x += diff / 2;
//     } else {
//       this._durationRect.x =
//         (this._rect.width * scale) / 2 - this._durationRect.width / 2;
//     }
//     this._dotRect.x = this._durationRect.right;

//     this._rect.x *= scale;
//     this._rect.width *= scale;

//     this._techniqueLabelsRect.x *= scale;
//     this._techniqueLabelsRect.width *= scale;

//     for (const techniqueLabelElement of this._techniqueLabelElements) {
//       techniqueLabelElement.scaleHorBy(scale);
//     }

//     this._beatNotesElement.scaleHorBy(scale);
//   }

//   /** Beat's note element */
//   public get beatNotesElement(): BeatNotesElement {
//     return this._beatNotesElement;
//   }

//   /** Technique label element */
//   public get techniqueLabelElements(): TechniqueLabelElement[] {
//     return this._techniqueLabelElements;
//   }

//   /** This beat's rectangle */
//   public get rect(): Rect {
//     return this._rect;
//   }

//   /** This beat's duration rectangle */
//   public get durationRect(): Rect {
//     return this._durationRect;
//   }

//   /** This beat's dot rectangle */
//   public get dotRect(): Rect {
//     return this._dotRect;
//   }

//   /** Technique labels rectangle */
//   public get techniqueLabelsRect(): Rect {
//     return this._techniqueLabelsRect;
//   }

//   /** Selection status setter */
//   public set selected(newSelectedValue: boolean) {
//     this._selected = newSelectedValue;
//   }
//   /** Selection status getter */
//   public get selected(): boolean {
//     return this._selected;
//   }

//   /** Global coords of the beat element */
//   public get globalCoords(): Point {
//     return new Point(
//       this.barElement.globalCoords.x + this._rect.x,
//       this.barElement.globalCoords.y + this._rect.y
//     );
//   }
// }
