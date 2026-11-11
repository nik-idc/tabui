import { randomInt } from "../../shared";
import { AccentOptions } from "./accent-options";
import { BendTechniqueOptions } from "./bend-options";
import { Note } from "./note";
import { Technique } from "./technique";
import { GuitarTechniqueType } from "./technique-type";
import { OPTIONS_PER_BEND_TYPE } from "./bend-type";

/** Options of any guitar technique that has them: Bend or Accent. */
export type GuitarTechniqueOptions = BendTechniqueOptions | AccentOptions;

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
  /** Accent strength; set only for an accent. */
  private _accentOptions: AccentOptions | null;

  /**
   * Creates a technique owned by the supplied note, without adding it to the note's technique array.
   * @param note Note on which the technique is performed
   * @param type Type of technique
   * @param options Required for bends and accents; other techniques have no options.
   * @throws If options do not match the technique or bend settings are invalid.
   */
  constructor(
    note: Note,
    type: GuitarTechniqueType,
    options: GuitarTechniqueOptions | null = null
  ) {
    const isAccent = type === GuitarTechniqueType.Accent;
    if (isAccent !== options instanceof AccentOptions) {
      throw new Error("Accent requires accent options, and only accent");
    }
    const bendOptions = options instanceof AccentOptions ? null : options;
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
    this._accentOptions = options instanceof AccentOptions ? options : null;

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
      const optionKey = key as keyof BendTechniqueOptions;
      if (this._bendOptions[optionKey] === undefined) {
        delete this._bendOptions[optionKey];
      }
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

  /**
   * Validates and copies replacement bend options; returns true only when values change.
   * @throws If this is not a configured bend, or required fields, bounds, or extra fields are invalid.
   */
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
   * Replaces the accent options; returns false and keeps the old options when values are equal.
   * @throws If this is not an accent.
   */
  public replaceAccentOptions(options: AccentOptions): boolean {
    if (this._accentOptions === null) {
      throw Error("Technique not accent");
    }
    if (this._accentOptions.equals(options)) {
      return false;
    }

    this._accentOptions = options;
    return true;
  }

  /**
   * Copies the technique and bend options with a new UUID; defaults to the original owning note.
   * @param note Note that will own the copied technique
   * @returns Copy of the technique
   * @throws If copied bend fields or bounds are invalid.
   */
  public deepCopy(note: Note = this.note): GuitarTechnique {
    // Accent options are immutable, so the copy can share them.
    const optionsCopy =
      this._bendOptions === null
        ? this._accentOptions
        : new BendTechniqueOptions(this._bendOptions);
    return new GuitarTechnique(note, this.type, optionsCopy);
  }

  /** Live validated bend options, or null for a non-bend technique. */
  public get bendOptions(): BendTechniqueOptions | null {
    return this._bendOptions;
  }

  /** Accent strength, or null for a technique that is not an accent. */
  public get accentOptions(): AccentOptions | null {
    return this._accentOptions;
  }
}
