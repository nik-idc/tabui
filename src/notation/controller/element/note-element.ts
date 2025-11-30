import { Note } from "@/notation/model";
import { BeatNotesElement } from "./beat-notes-element";
import { Point, Rect } from "@/shared";
import { GuitarTechniqueElement } from "./technique";

/**
 * Interface describing the basic visually relevant
 * info of a note element
 */
export interface NoteElement {
  readonly uuid: number;
  readonly note: Note;
  readonly beatNotesElement: BeatNotesElement;
  readonly rect: Rect;
  readonly guitarTechniqueElements: GuitarTechniqueElement[];

  calc(): void;
  scaleHorBy(scale: number): void;
  get globalCoords(): Point;
}
