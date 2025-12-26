import { Note } from "@/notation/model";
import { Point, Rect } from "@/shared";
import { GuitarTechniqueElement } from "./technique";
import { BeatElement } from "./beat-element";

/**
 * Interface describing the basic visually relevant
 * info of a note element
 */
export interface NoteElement {
  readonly uuid: number;
  readonly note: Note;
  readonly beatElement: BeatElement;

  build(): void;
  measure(): void;
  layout(): void;

  scaleHorBy(scale: number): void;

  get rect(): Rect;
  get guitarTechniqueElements(): GuitarTechniqueElement[];
  get globalCoords(): Point;
}
