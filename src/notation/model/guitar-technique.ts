import { randomInt } from "@/shared";
import { BendTechniqueOptions } from "./bend-options";
import { Note } from "./note";
import { Technique } from "./technique";
import { GuitarTechniqueType } from "./technique-type";
import { OPTIONS_PER_BEND_TYPE } from "./bend-type";

/**
 * Note guitar technique JSON format
 */
export interface GuitarTechniqueJSON {
  readonly type: GuitarTechniqueType;
  readonly bendOptions?: BendTechniqueOptions;
}

/**
 * Class that represents a note guitar technique
 */
export class GuitarTechnique implements Technique {
  /** Global unique identifier */
  readonly uuid: number;
  /** Note on which the technique is performed */
  readonly note: Note;
  /** Technique type */
  readonly type: GuitarTechniqueType;

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
    type: GuitarTechniqueType,
    bendOptions: BendTechniqueOptions | null = null
  ) {
    if (type === GuitarTechniqueType.Bend && bendOptions === null) {
      throw new Error("Bend passed without options");
    }
    if (type !== GuitarTechniqueType.Bend && bendOptions !== null) {
      throw new Error("Passed bend options for not a bend");
    }

    this.uuid = randomInt();
    this.note = note;
    this.type = type;
    this._bendOptions = bendOptions;

    if (this.type === GuitarTechniqueType.Bend) {
      this.stripUndefinedOptions();
      this.ensureCorrectOptions();
    }
  }

  /**
   * Strips undefined keys from bendOptions
   */
  private stripUndefinedOptions(): void {
    if (this._bendOptions === null) {
      throw Error("Bend options are null");
    }

    const keys = Object.keys(this._bendOptions);
    for (const key of keys) {
      this._bendOptions[key as keyof BendTechniqueOptions] === undefined &&
        delete this._bendOptions![key as keyof BendTechniqueOptions];
    }
  }

  /**
   * Ensures the bendOptions are correct
   */
  private ensureCorrectOptions(): void {
    if (this._bendOptions === null) {
      throw Error("Bend options are null");
    }

    const actualKeys = Object.keys(this._bendOptions);
    const expectedKeys = OPTIONS_PER_BEND_TYPE[this._bendOptions.type];
    const areEqual =
      actualKeys.length === expectedKeys.length &&
      actualKeys.every((key) => expectedKeys.includes(key));

    if (!areEqual) {
      throw Error(
        `Option demanding technique was provided the wrong bend options: Required bend options: ${expectedKeys}; provided: ${actualKeys}`
      );
    }
  }

  public editBendOptions(options: Partial<BendTechniqueOptions>): void {
    if (this.type !== GuitarTechniqueType.Bend) {
      throw Error("Technique not bend");
    }
    if (this._bendOptions === null) {
      throw Error("Bend options are null");
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
  public deepCopy(): GuitarTechnique {
    const bendOptionsCopy =
      this._bendOptions === null
        ? undefined
        : new BendTechniqueOptions(this._bendOptions);
    return new GuitarTechnique(this.note, this.type, bendOptionsCopy);
  }

  /**
   * Parses note guitar technique into JSON string
   * @returns Parsed JSON string
   */
  public toJSON(): GuitarTechniqueJSON {
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
