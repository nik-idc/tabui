import { randomInt } from "@/shared";
import { BeatTechnique } from "../../technique";
import { BeatGuitarTechniqueType } from "../../technique-type";
import { Beat } from "../../../beat";

/**
 * Beat guitar technique JSON format
 */
export interface BeatGuitarTechniqueJSON {
  readonly type: BeatGuitarTechniqueType;
}

/**
 * Class that represents a beat guitar technique
 */
export class BeatGuitarTechnique implements BeatTechnique {
  /** Global unique identifier */
  readonly uuid: number;
  /** Beat on which the technique is performed */
  readonly beat: Beat;
  /** Technique type */
  readonly type: BeatGuitarTechniqueType;

  /**
   * Class that represents a guitar technique
   * @param beat Beat on which the technique is performed
   * @param type Type of technique
   */
  constructor(beat: Beat, type: BeatGuitarTechniqueType) {
    this.beat = beat;
    this.uuid = randomInt();
    this.type = type;
  }

  /**
   * Creates a deep copy of the technique
   * @returns Copy of the technique
   */
  public deepCopy(): BeatGuitarTechnique {
    return new BeatGuitarTechnique(this.beat, this.type);
  }

  /**
   * Parses note guitar technique into JSON string
   * @returns Parsed JSON string
   */
  public toJSON(): BeatGuitarTechniqueJSON {
    return {
      type: this.type,
    };
  }
}
