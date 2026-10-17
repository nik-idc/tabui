import { Score } from "@atikincode/tabui";
import { createEmptyScoreFixture } from "../../../fixtures/empty-score";
import { createFeatureShowcaseScoreFixture } from "../../../fixtures/feature-showcase-score";
import {
  createMultiVoiceSingleStaffScoreFixture,
  createMultiVoiceTwoStaffScoreFixture,
} from "../../../fixtures/multi-voice-score";
import { createPerformanceStressScoreFixture } from "../../../fixtures/performance-stress-score";

export type EditorFixtureKey =
  | "feature_showcase"
  | "empty"
  | "performance_stress"
  | "multi_voice_single_staff"
  | "multi_voice_two_staff";

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
    createScore: createEmptyScoreFixture,
  },
  {
    key: "performance_stress",
    label: "Performance Stress",
    createScore: createPerformanceStressScoreFixture,
  },
  {
    key: "multi_voice_single_staff",
    label: "Multi Voice: Single Staff",
    createScore: createMultiVoiceSingleStaffScoreFixture,
  },
  {
    key: "multi_voice_two_staff",
    label: "Multi Voice: Two Staffs",
    createScore: createMultiVoiceTwoStaffScoreFixture,
  },
];

export function getEditorFixtures(): EditorFixtureOption[] {
  return EDITOR_FIXTURES;
}

export function resolveEditorFixtureKey(
  searchParams: URLSearchParams
): EditorFixtureKey {
  const fixture = searchParams.get("fixture");
  if (
    fixture === "empty" ||
    fixture === "feature_showcase" ||
    fixture === "performance_stress" ||
    fixture === "multi_voice_single_staff" ||
    fixture === "multi_voice_two_staff"
  ) {
    return fixture;
  }

  return "feature_showcase";
}

export function resolveEditorFixture(searchParams: URLSearchParams): Score {
  const fixtureKey = resolveEditorFixtureKey(searchParams);
  const fixture = EDITOR_FIXTURES.find((option) => option.key === fixtureKey);
  if (fixture === undefined) {
    throw new Error(`Unknown fixture key: ${fixtureKey}`);
  }

  return fixture.createScore();
}
