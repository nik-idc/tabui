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

  /**
   * Parses guitar into simple object
   * @returns Simple parsed object
   */
  public toJSONObj(): Object {
    const tuningJSON = [];
    for (const note of this.tuning) {
      tuningJSON.push(note.toJSONObj());
    }

    return {
      stringsCount: this.stringsCount,
      tuning: tuningJSON,
      fretsCount: this.fretsCount,
    };
  }

  /**
   * Parses guitar into JSON string
   * @returns Parsed JSON string
   */
  public toJSON(): string {
    return JSON.stringify(this.toJSONObj());
  }

  static fromJSON(obj: any): Guitar {
    if (
      obj.stringsCount === undefined ||
      obj.tuning === undefined ||
      obj.fretsCount === undefined
    ) {
      throw Error(
        `Invalid JSON to parse into tab, obj: ${JSON.stringify(obj)}`
      );
    }

    const tuning: Note[] = [];
    for (const note of obj.tuning) {
      tuning.push(new Note(note.noteValue, note.octave));
    }

    // Return parsed guitar
    return new Guitar(obj.stringsCount, tuning, obj.fretsCount);
  }
}
