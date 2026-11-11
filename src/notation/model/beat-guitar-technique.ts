import { randomInt } from "../../shared";
import type { Beat } from "./beat";
import { BeatTechnique } from "./beat-technique";
import { BeatGuitarTechniqueType } from "./beat-technique-type";
import { StrokeOptions } from "./stroke-options";

/** Options class required by each beat guitar technique type. */
export type BeatGuitarTechniqueOptionsByType = {
  [BeatGuitarTechniqueType.Stroke]: StrokeOptions;
};

/** Options class of any beat guitar technique type. */
export type BeatGuitarTechniqueOptions =
  BeatGuitarTechniqueOptionsByType[BeatGuitarTechniqueType];

/** Guitar technique owned by a whole beat, with options matching its type. */
export class BeatGuitarTechnique<
  T extends BeatGuitarTechniqueType = BeatGuitarTechniqueType,
> implements BeatTechnique {
  /** Global unique identifier. */
  readonly uuid: number;
  /** Beat on which the technique is performed. */
  readonly beat: Beat;
  /** Technique type. */
  readonly type: T;

  /** Validated options for this technique type. */
  private _options: BeatGuitarTechniqueOptionsByType[T];

  /**
   * Creates a technique owned by the supplied beat, without adding it to the beat.
   * @throws If the options do not match the technique type.
   */
  constructor(
    beat: Beat,
    type: T,
    options: BeatGuitarTechniqueOptionsByType[T]
  ) {
    BeatGuitarTechnique.ensureOptionsMatchType(type, options);
    this.uuid = randomInt();
    this.beat = beat;
    this.type = type;
    this._options = options;
  }

  /** Rejects options from another technique type, for callers that bypass static types. */
  private static ensureOptionsMatchType(
    type: BeatGuitarTechniqueType,
    options: unknown
  ): void {
    switch (type) {
      case BeatGuitarTechniqueType.Stroke:
        if (!(options instanceof StrokeOptions)) {
          throw Error("Stroke requires stroke options");
        }
        return;
      default: {
        const unknownType: never = type;
        throw Error(`Unknown beat technique type: ${unknownType}`);
      }
    }
  }

  /** Validated options for this technique type. */
  public get options(): BeatGuitarTechniqueOptionsByType[T] {
    return this._options;
  }

  /**
   * Replaces the options; returns false and keeps the old options when values are equal.
   * @throws If the options do not match the technique type.
   */
  public replaceOptions(options: BeatGuitarTechniqueOptionsByType[T]): boolean {
    BeatGuitarTechnique.ensureOptionsMatchType(this.type, options);
    if (this._options.equals(options)) {
      return false;
    }

    this._options = options;
    return true;
  }

  /** Copies the technique with a new UUID for the supplied owner beat; options are immutable and shared. */
  public deepCopy(beat: Beat): BeatGuitarTechnique<T> {
    return new BeatGuitarTechnique(beat, this.type, this._options);
  }
}
