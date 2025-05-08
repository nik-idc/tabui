import { Note, NoteValue } from "./note";

const defaultTuning = [
  new Note(NoteValue.E, 4),
  new Note(NoteValue.B, 3),
  new Note(NoteValue.G, 3),
  new Note(NoteValue.D, 3),
  new Note(NoteValue.A, 2),
  new Note(NoteValue.E, 2),
];

export class Guitar {
  constructor(
    readonly stringsCount: number = 6,
    /**
     * Guitar tuning. IMPORTANT: the first element should be the first string tuning
     */
    readonly tuning: Note[] = defaultTuning,
    readonly fretsCount: number = 24
  ) {}

  public getTuningStr(): string {
    const tuningStrArr = [];
    for (let i = 0; i < this.tuning.length; i++) {
      tuningStrArr.push(
        `
        ${i + 1}=${this.tuning[i].noteValue}
      `.trim()
      );

      if (i !== this.tuning.length - 1) {
        tuningStrArr.push(", ");
      }
    }

    return tuningStrArr.join("");
  }

  static fromObject(obj: any): Guitar {
    if (
      obj.stringsCount === undefined ||
      obj.tuning === undefined ||
      obj.fretsCount === undefined
    ) {
      throw Error("Invalid js object to parse to guitar");
    }

    // Return parsed guitar
    return new Guitar(obj.stringsCount, obj.tuning, obj.fretsCount);
  }
}
