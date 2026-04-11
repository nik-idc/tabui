// import { Beat, GuitarNote } from "@/notation/model";
// import { Point, Rect, randomInt } from "@/shared";
// import { BeatElement } from "./beat-element";
// import { EditorLayoutDimensions } from "../tab-controller-dim";
// import { NoteElement } from "./note-element";
// import { TabNoteElement } from "./guitar-note-element";

// /**
//  * In-between class for containing only note element of a beat element
//  */
// export class BeatNotesElement {
//   /** Beat-notes element's unique identifier */
//   readonly uuid: number;
//   /** The beat */
//   readonly beat: Beat;
//   /** Parent beat element */
//   readonly beatElement: BeatElement;

//   /** Rectangle */
//   private _rect: Rect;
//   /** Note element */
//   private _noteElements: NoteElement[];

//   /**
//    * In-between class for containing only note element of a beat element
//    * @param beat Beat
//    * @param beatElement Parent beat element
//    */
//   constructor(beat: Beat, beatElement: BeatElement) {
//     this.uuid = randomInt();
//     this.beat = beat;
//     this.beatElement = beatElement;

//     this._rect = new Rect();
//     this._noteElements = new Array<NoteElement>(
//       this.beat.trackContext.instrument.maxPolyphony
//     );

//     // this.calc();
//   }

//   /**
//    * Calculate the note element
//    */
//   public calc(): void {
//     this._rect = new Rect(
//       0,
//       EditorLayoutDimensions.DURATIONS_HEIGHT +
//         this.beatElement.techniqueLabelsRect.height,
//       this.beatElement.rect.width,
//       EditorLayoutDimensions.NOTE_RECT_HEIGHT *
//         this.beat.trackContext.instrument.maxPolyphony
//     );

//     const newNoteElements = new Array<NoteElement>(this.beat.notes.length);

//     for (let i = 0; i < this.beat.notes.length; i++) {
//       const note = this.beat.notes[i];
//       // VERY BAD!!! but for now will do. as always lol
//       if (note instanceof GuitarNote) {
//         newNoteElements[i] = new TabNoteElement(note, this);
//       }
//     }

//     this._noteElements = newNoteElements;
//   }

//   /**
//    * Scales the element & it's children horizontally by the factor
//    * @param scale Scale factor
//    */
//   public scaleHorBy(scale: number): void {
//     this._rect.x *= scale;
//     this._rect.width *= scale;

//     for (const noteElement of this._noteElements) {
//       noteElement.scaleHorBy(scale);
//     }
//   }

//   /** Beat-notes element main rectangle */
//   public get rect(): Rect {
//     return this._rect;
//   }

//   /** Note element */
//   public get noteElements(): NoteElement[] {
//     return this._noteElements;
//   }

//   /** Global coords of the beat notes element */
//   public get globalCoords(): Point {
//     return new Point(
//       this.beatElement.globalCoords.x + this._rect.x,
//       this.beatElement.globalCoords.y + this._rect.y
//     );
//   }
// }
