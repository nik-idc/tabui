import { Note } from "./note";

const defaultTuning = [Note.E, Note.B, Note.G, Note.D, Note.A, Note.E];

export class Guitar {
  constructor(
    readonly stringsCount: number = 6,
    readonly tuning: Note[] = defaultTuning,
    readonly fretsCount: number = 24
  ) {}

  static fromObject(obj: any): Guitar {
    if (
      obj.stringsCount === undefined ||
      obj.tuning === undefined ||
      obj.fretsCount === undefined
    ) {
      throw new Error("Invalid js object to parse to guitar");
    }

    // Return parsed guitar
    return new Guitar(obj.stringsCount, obj.tuning, obj.fretsCount);
  }
}
