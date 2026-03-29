import { Score } from "@/notation/model";
import { emptyScore } from "./empty-score";
import { score as defaultScore } from "./full-score";
import { selectionPerfScore } from "./selection-perf-score";

export function resolveEditorFixture(searchParams: URLSearchParams): Score {
  const fixture = searchParams.get("fixture");

  switch (fixture) {
    case "empty":
      return emptyScore;
    case "selection_perf":
      return selectionPerfScore;
    case "default":
    case null:
    default:
      return defaultScore;
  }
}
