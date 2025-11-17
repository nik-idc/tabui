import { randomInt } from "@/shared";
import { BendTechniqueOptions } from "./bend-options";
import { OPTIONS_PER_BEND_TYPE } from "./note-guitar-technique-lists";
import { NoteGuitarTechniqueType } from "../../technique-type";
import { NoteTechnique } from "../../technique";
import { Note } from "../../../note/note";

/**
 * Note guitar technique JSON format
 */
export interface NoteGuitarTechniqueJSON {
  readonly type: NoteGuitarTechniqueType;
  readonly bendOptions?: BendTechniqueOptions;
}

/**
 * Class that represents a note guitar technique
 */
export class NoteGuitarTechnique implements NoteTechnique {
  /** Global unique identifier */
  readonly uuid: number;
  /** Note on which the technique is performed */
  readonly note: Note;
  /** Technique type */
  readonly type: NoteGuitarTechniqueType;

  /** Optional bend options */
  private _bendOptions: BendTechniqueOptions | null;

  /**
   * Class that represents a guitar technique
   * @param note Note on which the technique is performed
   * @param type Type of technique
   * @param bendOptions Options (for bend)
   */
  constructor(
    note: Note,
    type: NoteGuitarTechniqueType,
    bendOptions: BendTechniqueOptions | null = null
  ) {
    if (type === NoteGuitarTechniqueType.Bend && bendOptions === null) {
      throw new Error("Bend passed without options");
    }

    this.uuid = randomInt();
    this.note = note;
    this.type = type;
    this._bendOptions = bendOptions;

    this.stripUndefinedOptions();
    this.ensureCorrectOptions();
  }

  /**
   * Strips undefined keys from bendOptions
   */
  private stripUndefinedOptions(): void {
    Object.keys(this._bendOptions!).forEach(
      (key) =>
        this._bendOptions![key as keyof BendTechniqueOptions] === undefined &&
        delete this._bendOptions![key as keyof BendTechniqueOptions]
    );
  }

  /**
   * Ensures the bendOptions are correct
   */
  private ensureCorrectOptions(): void {
    const actualKeys = Object.keys(this._bendOptions!);
    const expectedKeys = OPTIONS_PER_BEND_TYPE[this.type];
    const areEqual =
      actualKeys.length === expectedKeys.length &&
      actualKeys.every((key) => expectedKeys.includes(key));

    if (!areEqual) {
      throw Error(
        `Option demanding technique was provided the wrong bendOptions: Required bendOptions: ${expectedKeys}; provided: ${actualKeys}`
      );
    }
  }

  public editBendOptions(options: Partial<BendTechniqueOptions>): void {
    if (this.type !== NoteGuitarTechniqueType.Bend) {
      throw Error("Technique not bend");
    }

    this._bendOptions = new BendTechniqueOptions({
      ...this._bendOptions,
      ...options,
    });
  }

  /**
   * Creates a deep copy of the technique
   * @returns Copy of the technique
   */
  public deepCopy(): NoteGuitarTechnique {
    const bendOptionsCopy =
      this._bendOptions === null
        ? undefined
        : new BendTechniqueOptions(this._bendOptions);
    return new NoteGuitarTechnique(this.note, this.type, bendOptionsCopy);
  }

  /**
   * Parses note guitar technique into JSON string
   * @returns Parsed JSON string
   */
  public toJSON(): NoteGuitarTechniqueJSON {
    return {
      type: this.type,
      bendOptions: this._bendOptions ?? undefined,
    };
  }

  /** Bend options */
  public get bendOptions(): BendTechniqueOptions | null {
    return this._bendOptions;
  }
}
