import { deserializeScore, Score } from "@atikincode/tabui";
import document from "./feature-showcase-score.json";

/** Loads the feature showcase from its saved score file. */
export function createFeatureShowcaseScoreFixture(): Score {
  return deserializeScore(document);
}
