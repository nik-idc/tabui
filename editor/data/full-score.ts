import { Score } from "@/models";
import { leadTrack } from "./lead";
import { rhythmTrack } from "./rhythm";
import { bassTrack } from "./bass";

export const score = new Score(
  -1,
  "Test Score",
  "Test Artist",
  "Test Song",
  false,
  [leadTrack, rhythmTrack, bassTrack]
);
