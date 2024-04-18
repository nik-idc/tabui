import { Rect } from "../shapes/rect";
import { ChordElement } from "./chord-element";
import { TabWindow } from "../tab-window";
import { Point } from "../shapes/point";
import { GuitarNote } from "./../../models/guitar-note";

export class NoteElement {
  readonly tabWindow: TabWindow;
  readonly chordElement: ChordElement;
  readonly rect: Rect;
  readonly textCoords: Point;
  readonly note: GuitarNote;

  constructor(
    tabWindow: TabWindow,
    chordElement: ChordElement,
    note: GuitarNote
  ) {
    this.tabWindow = tabWindow;
    this.chordElement = chordElement;
    this.rect = new Rect();
    this.textCoords = new Point();
    this.note = note;

    this.calc();
  }

  calc(): void {
    let dim = this.tabWindow.dim;

    this.rect.width = this.chordElement.rect.width;
    this.rect.height = dim.noteMinSize;
    this.rect.x = this.chordElement.rect.x;
    this.rect.y =
      this.chordElement.rect.y -
      dim.noteMinSize / 2 +
      dim.noteMinSize * (this.note.strNum - 1);

    this.textCoords.x =
      this.chordElement.rect.x + this.chordElement.rect.width / 2;
    this.textCoords.y = this.rect.y + dim.noteMinSize / 2;
  }

  scaleNoteHorBy(scale: number) {
    if (scale <= 0) {
      throw new Error(`${scale} is an invalid scale: scale must be positive`);
    }

    this.rect.width *= scale;
    this.rect.x *= scale;
    this.textCoords.x *= scale;
  }

  translateBy(dx: number, dy: number) {
    this.rect.x += dx;
    this.rect.y += dy;
    this.textCoords.x += dx;
    this.textCoords.y += dy;

    this.calc();
  }
}
