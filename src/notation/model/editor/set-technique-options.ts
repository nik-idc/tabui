import type { AccentOptions } from "../accent-options";
import type { BendTechniqueOptions } from "../bend-options";

/** Optional settings for applying a technique; each field applies only to its technique. */
export type SetTechniqueOptions = {
  /** Bend shape and pitches; omitted when removing an existing bend. */
  bendOptions?: BendTechniqueOptions;
  /** Accent strength; omitted when removing existing accents. */
  accentOptions?: AccentOptions;
  /** Search for the earliest Tie source instead of only the previous beat. Defaults to false. */
  tieToEarliest?: boolean;
};
