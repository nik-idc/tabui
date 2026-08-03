import { randomInt } from "../../shared";
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

// TODO: This module currently is very obviously juggling 2 cases:
// - Normal technique with no options
// - Bend with bend options
// But this assumes bends is the **only** technique type that has options.
// And while currently in the codebase that is true, that does not necessarily have
// to be the case. For example, an artificial/pinch harmonic can have options
// (I know this from GuitarPro/Songsterr).
// So this to me suggests that a better design is something like:
// type TechniqueOptions = BendTechniqueOptions | PinchHarmonicOptions;
// export class GuitarTechnique implements Technique {
//   /** Global unique identifier */
//   readonly uuid: number;
//   /** Note on which the technique is performed */
//   readonly note: Note;
//   /** Technique type */
//   readonly type: GuitarTechniqueType;
//   /** Optional bend options */
//   private _options: TechniqueOptions | null;
//   ... rest of the code ...
// }

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

    const actual = Object.keys(this._bendOptions);
    const expected = OPTIONS_PER_BEND_TYPE[this._bendOptions.type];
    const areEqual =
      actual.length === expected.length &&
      actual.every((key) =>
        expected.some((expectedKey) => expectedKey === key)
      );

    if (!areEqual) {
      throw Error(`Wrong options: expected: ${expected}; provided: ${actual}`);
    }
  }

  public replaceBendOptions(options: BendTechniqueOptions): boolean {
    if (this.type !== GuitarTechniqueType.Bend) {
      throw Error("Technique not bend");
    }
    if (this._bendOptions === null) {
      throw Error("Bend options are null");
    }

    const replacement = new BendTechniqueOptions(options);
    if (
      this._bendOptions.type === replacement.type &&
      this._bendOptions.bendPitch === replacement.bendPitch &&
      this._bendOptions.releasePitch === replacement.releasePitch &&
      this._bendOptions.holdPitch === replacement.holdPitch &&
      this._bendOptions.prebendPitch === replacement.prebendPitch &&
      this._bendOptions.bendDuration === replacement.bendDuration
    ) {
      return false;
    }

    this._bendOptions = replacement;
    this.stripUndefinedOptions();
    this.ensureCorrectOptions();
    return true;
  }

  /**
   * Creates a deep copy of the technique
   * @param note Note that will own the copied technique
   * @returns Copy of the technique
   */
  public deepCopy(note: Note = this.note): GuitarTechnique {
    const bendOptionsCopy =
      this._bendOptions === null
        ? undefined
        : new BendTechniqueOptions(this._bendOptions);
    return new GuitarTechnique(note, this.type, bendOptionsCopy);
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
