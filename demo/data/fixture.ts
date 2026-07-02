import { Score } from "@/notation/model";
import { createEmptyScoreFixture } from "./empty-score";
import { createDefaultScoreFixture } from "./full-score";
import {
  createMultiVoiceSingleStaffScoreFixture,
  createMultiVoiceTwoStaffScoreFixture,
} from "./multi-voice-score";
import { createSelectionPerfScoreFixture } from "./selection-perf-score";

export type EditorFixtureKey =
  | "default"
  | "empty"
  | "selection_perf"
  | "multi_voice_single_staff"
  | "multi_voice_two_staff";

export interface EditorFixtureOption {
  key: EditorFixtureKey;
  label: string;
  createScore: () => Score;
}

const EDITOR_FIXTURES: EditorFixtureOption[] = [
  {
    key: "default",
    label: "Default Score",
    createScore: createDefaultScoreFixture,
  },
  {
    key: "empty",
    label: "Empty Score",
    createScore: createEmptyScoreFixture,
  },
  {
    key: "selection_perf",
    label: "Selection Perf",
    createScore: createSelectionPerfScoreFixture,
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
    fixture === "selection_perf" ||
    fixture === "multi_voice_single_staff" ||
    fixture === "multi_voice_two_staff"
  ) {
    return fixture;
  }

  return "default";
}

export function resolveEditorFixture(searchParams: URLSearchParams): Score {
  const fixtureKey = resolveEditorFixtureKey(searchParams);
  const fixture = EDITOR_FIXTURES.find((option) => option.key === fixtureKey);
  if (fixture === undefined) {
    throw new Error(`Unknown fixture key: ${fixtureKey}`);
  }

  return fixture.createScore();
}
