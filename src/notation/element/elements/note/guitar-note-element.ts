import { GuitarNote } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { TabControllerDim } from "../../controller";
import { GuitarTechniqueElement } from "./techniques";

/**
 * Class that handles drawing note element in the tab
 */
export class NoteElement {
  readonly uuid: number;
  /**
   * Tab window dimensions
   */
  readonly dim: TabControllerDim;
  /**
   * The note
   */
  readonly note: GuitarNote;
  /**
   * Rectangle of the main clickable-area rectangle
   */
  public rect: Rect = new Rect();
  /**
   * Rectangle of the note text rectangle
   */
  public textRect: Rect = new Rect();
  /**
   * Rectangle of the note text rectangle
   */
  public textCoords: Point = new Point();
  /**
   * Array of guitar technique elements
   */
  private _guitarTechniqueElements: GuitarTechniqueElement[];

  /**
   * Class that handles drawing note element in the tab
   * @param dim Tab window dimensions
   * @param width Width of the beat element
   * @param note Note
   */
  constructor(dim: TabControllerDim, width: number, note: GuitarNote) {
    this.uuid = randomInt();
    this.dim = dim;
    this.note = note;
    this.rect = new Rect(
      0,
      this.dim.noteRectHeight * (this.note.stringNum - 1),
      width,
      this.dim.noteRectHeight
    );
    this._guitarTechniqueElements = [];

    this.calc();
  }

  /**
   * Calculate dimensions of the note element
   */
  public calc(): void {
    this.textRect.x =
      this.rect.x + this.rect.width / 2 - this.dim.noteTextSize / 2;
    this.textRect.y =
      this.rect.y + this.rect.height / 2 - this.dim.noteTextSize / 2;
    this.textRect.width = this.dim.noteTextSize;
    this.textRect.height = this.dim.noteTextSize;

    this.textCoords.x = this.textRect.x + this.dim.noteTextSize / 2;
    this.textCoords.y = this.textRect.y + this.dim.noteTextSize / 2;

    const newGuitarTechniqueElements: GuitarTechniqueElement[] = [];
    const oldGuitarTechniqueElements = [...this._guitarTechniqueElements];

    for (const technique of this.note.techniques) {
      const oldElementIndex = oldGuitarTechniqueElements.findIndex(
        (e) => e.technique.uuid === technique.uuid
      );
      let element: GuitarTechniqueElement;

      if (oldElementIndex !== -1) {
        // Technique already applied to the note and calc-ed,
        // so just need to update the technique's dimensions
        element = oldGuitarTechniqueElements.splice(oldElementIndex, 1)[0];
        element.update(this.rect);
      } else {
        // Technique applied but not calc-ed yet,
        // so need to create a new guitar technique element
        element = new GuitarTechniqueElement(
          technique,
          this.note.stringNum,
          this.rect,
          this.dim
        );
      }
      newGuitarTechniqueElements.push(element);
    }
    this._guitarTechniqueElements = newGuitarTechniqueElements;
  }

  public scaleHorBy(scale: number): void {
    this.rect.x *= scale;
    this.rect.width *= scale;

    this.textRect.x =
      this.rect.x + this.rect.width / 2 - this.dim.noteTextSize / 2;
    // this.textRect.x *= scale;
    // this.textRect.width *= scale;
    this.textCoords.x *= scale;

    for (const techniqueElement of this._guitarTechniqueElements) {
      techniqueElement.scaleHorBy(scale);
    }
  }

  public get guitarTechniqueElements(): GuitarTechniqueElement[] {
    return this._guitarTechniqueElements;
  }
}
