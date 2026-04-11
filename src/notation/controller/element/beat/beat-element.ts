import { Beat } from "@/notation/model";
import { Rect, Point } from "@/shared";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
import { NotationElement } from "@/notation/controller/element/notation-element";
import { BarElement } from "../bar/bar-element";
import { NoteElement } from "../note/note-element";

/**
 * Interface representing a specific notation styleА beat element
 */
export interface BeatElement extends NotationElement {
  readonly beat: Beat;
  readonly barElement: BarElement;

  getNextNoteElement(noteElement: NoteElement): NoteElement | null;
  getPrevNoteElement(noteElement: NoteElement): NoteElement | null;

  get noteElements(): NoteElement[];
}

/**
 * Calculates the beat element base width
 * @param beat Beat
 * @returns Beat element base width
 */
export function getBeatWidth(beat: Beat): number {
  // Calc rect base width by duration
  let width = EditorLayoutDimensions.WIDTH_MAPPING[beat.baseDuration];

  // Scale rect width based on number of dots
  width *= EditorLayoutDimensions.DOT_WIDTH_FACTORS[beat.dots];

  // Scale the rect width based on tuplet settings
  if (beat.tupletSettings !== null) {
    const tupletScale =
      beat.tupletSettings.tupletCount / beat.tupletSettings.normalCount;
    width *= tupletScale;
    if (width < EditorLayoutDimensions.NOTE_RECT_WIDTH_MIN) {
      // To make sure beats don't get too small causing UI errors
      width = EditorLayoutDimensions.NOTE_RECT_WIDTH_MIN;
    }
  }

  return width;
}

// import { Beat, Technique, TechniqueType } from "@/notation/model";
// import { BarElement } from "./bar-element";
// import { Point, randomInt, Rect } from "@/shared";
// import { NoteElement } from "./note-element";
// import { Circle } from "@/shared/rendering/geometry/circle";
// import { EditorLayoutDimensions } from "../tab-controller-dim";
// import { TabBeatElement } from "./tab-beat-element";
// import { SheetBeatElement } from "./sheet-beat-element";

// /**
//  * Class encompassing both tab beat & sheet beat elements
//  */
// export class BeatElement {
//   /** Beat element's unique identifier */
//   readonly uuid: number;
//   /** The beat */
//   readonly beat: Beat;
//   /** Parent bar element */
//   readonly barElement: BarElement;

//   /** Tab beat element */
//   private _tabBeatElement?: TabBeatElement;
//   /** Sheet beat element */
//   private _sheetBeatElement?: SheetBeatElement;

//   /** Outer rect */
//   private _rect: Rect;

//   /**
//    * Class that handles geometry & visually relevant info of a beat
//    * @param beat Beat
//    * @param barElement Parent bar element
//    */
//   constructor(beat: Beat, barElement: BarElement) {
//     this.uuid = randomInt();
//     this.beat = beat;
//     this.barElement = barElement;

//     this._rect = new Rect();

//     this.calc();
//   }

//   /**
//    * Calculates all the child beat element of this beat element
//    */
//   public calc(): void {
//     this._rect.set(
//       -1,
//       EditorLayoutDimensions.TEMPO_RECT_HEIGHT,

//     )

//     this._sheetBeatElement = this.beat.bar.staff.showClassicNotation
//       ? new SheetBeatElement(this.beat, this)
//       : undefined;

//     this._tabBeatElement = this.beat.bar.staff.showTablature
//       ? new TabBeatElement(this.beat, this)
//       : undefined;

//     // if (this._sheetBeatElement !== undefined) {
//     //   this._rect.height += this._sheetBeatElement.rect.height;
//     // }
//     if (this._tabBeatElement !== undefined) {
//       this._rect.height += this._tabBeatElement.rect.height;
//     }
//   }

//   /**
//    * Scales the element & its children horizontally by the factor
//    * @param scale Scale factor
//    */
//   public scaleHorBy(scale: number): void {
//     this._tabBeatElement?.scaleHorBy(scale);
//     this._sheetBeatElement?.scaleHorBy(scale);
//   }

//   /** Tab beat element */
//   public get tabBeatElement(): TabBeatElement | undefined {
//     return this._tabBeatElement;
//   }

//   /** Sheet beat element */
//   public get sheetBeatElement(): SheetBeatElement | undefined {
//     return this._sheetBeatElement;
//   }

//   /** Outer rect */
//   public get rect(): Rect {
//     return this._rect;
//   }

//   /** Global coords of the beat element */
//   public get globalCoords(): Point {
//     return new Point(
//       this.barElement.globalCoords.x + this._rect.x,
//       this.barElement.globalCoords.y + this._rect.y
//     );
//   }
// }

// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================
// ==================================================

// import { Beat } from "@/notation/model";
// import { Rect, Point, randomInt } from "@/shared";
// import { Circle } from "@/shared/rendering/geometry/circle";
// import { VertLine, HorLine } from "@/shared/rendering/geometry/line";
// import { TabNoteElement } from "./tab-note-element";
// import { TechniqueLabelElement } from "./technique";
// import { BarElement } from "./bar-element";
// import { NoteElement } from "./note-element";
// import { EditorLayoutDimensions } from "../tab-controller-dim";
// import { TabBeatElement } from "./tab-beat-element";
// import { SheetBeatElement } from "./sheet-beat-element";

// export class BeatElement {
//   /** Beat element's unique identifier */
//   readonly uuid: number;
//   /** The beat */
//   readonly beat: Beat;
//   /** Parent bar element */
//   readonly barElement: BarElement;

//   /** Note elements child array */
//   private _noteElements: NoteElement[];

//   /** This beat's rect */
//   private _rect: Rect;

//   constructor(beat: Beat, barElement: BarElement) {
//     this.uuid = randomInt();
//     this.beat = beat;
//     this.barElement = barElement;

//     const width = getBeatWidth(this.beat);
//     this._rect = new Rect(0, 0, width, 0);

//     this._noteElements = [];
//   }

//   public build(): void {}

//   /**
//    * Calculates the dimensions of all child sub beat elements
//    */
//   public measure(): void {}

//   public layout(): void {}

//   /** Note elements child array */
//   public get noteElements(): NoteElement[] {
//     return this._noteElements;
//   }

//   /** This beat's rect */
//   public get rect(): Rect {
//     return this._rect;
//   }

//   public get globalCoords(): Point {
//     return new Point(
//       this.barElement.globalCoords.x + this.rect.x,
//       this.barElement.globalCoords.y + this.rect.y
//     );
//   }
// }

// export function getBeatWidth(beat: Beat): number {
//   // Calc rect base width by duration
//   let width = EditorLayoutDimensions.WIDTH_MAPPING[beat.baseDuration];

//   // Scale rect width based on number of dots
//   width *= EditorLayoutDimensions.DOT_WIDTH_FACTORS[beat.dots];

//   // Scale the rect width based on tuplet settings
//   if (beat.tupletSettings !== null) {
//     const tupletScale =
//       beat.tupletSettings.tupletCount / beat.tupletSettings.normalCount;
//     width *= tupletScale;
//     if (width < EditorLayoutDimensions.NOTE_RECT_WIDTH_MIN) {
//       // To make sure beats don't get too small causing UI errors
//       width = EditorLayoutDimensions.NOTE_RECT_WIDTH_MIN;
//     }
//   }

//   return width;
// }

// // ==== IDK WHAT THE FUCK I AM DOING ====
// // /**
// //  * Interface representing a beat element
// //  * (TabBeatElement, SheetBeatElement etc)
// //  */
// // export interface BeatElement {
// //   readonly uuid: number;
// //   readonly beat: Beat;
// //   readonly barElement: BarElement;

// //   calc(): void;
// //   scaleHorBy(scale: number): void;

// //   get noteElements(): NoteElement[];
// //   get rect(): Rect;
// //   get durationRect(): Rect;
// //   get durationStemLine(): VertLine | undefined;
// //   get durationFlagLines(): HorLine[] | undefined;
// //   get dot1Circle(): Circle;
// //   get dot2Circle(): Circle;
// //   get globalCoords(): Point;
// // }
