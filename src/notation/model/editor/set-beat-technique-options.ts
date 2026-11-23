import type { StrokeOptions } from "../stroke-options";

/** Optional settings for applying a beat technique; each field applies only to its technique. */
export type SetBeatTechniqueOptions = {
  /** Stroke settings; omitted when removing an existing stroke. */
  strokeOptions?: StrokeOptions;
};
