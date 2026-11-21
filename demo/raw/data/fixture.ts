import { Score } from "@atikincode/tabui";
import { createFeatureShowcaseScoreFixture } from "../../../fixtures/feature-showcase-score";
import { createPerformanceStressScoreFixture } from "../../../fixtures/performance-stress-score";

export type EditorFixtureKey =
  | "feature_showcase"
  | "empty"
  | "performance_stress";

export interface EditorFixtureOption {
  key: EditorFixtureKey;
  label: string;
  createScore: () => Score;
}

const EDITOR_FIXTURES: EditorFixtureOption[] = [
  {
    key: "feature_showcase",
    label: "Feature Showcase",
    createScore: createFeatureShowcaseScoreFixture,
  },
  {
    key: "empty",
    label: "Empty Score",
    createScore: () => new Score(),
  },
  {
    key: "performance_stress",
    label: "Performance Stress",
    createScore: createPerformanceStressScoreFixture,
  },
];

export function getEditorFixtures(): EditorFixtureOption[] {
  return EDITOR_FIXTURES;
}

export function resolveEditorFixtureKey(
  searchParams: URLSearchParams
): EditorFixtureKey {
  const fixture = searchParams.get("fixture");
  const option = EDITOR_FIXTURES.find((v) => v.key === fixture);
  return option?.key ?? "feature_showcase";
}

export function resolveEditorFixture(searchParams: URLSearchParams): Score {
  const fixtureKey = resolveEditorFixtureKey(searchParams);
  const fixture = EDITOR_FIXTURES.find((option) => option.key === fixtureKey);
  if (fixture === undefined) {
    throw new Error(`Unknown fixture key: ${fixtureKey}`);
  }

  return fixture.createScore();
}
