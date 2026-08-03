export { deserializeScore } from "./v1/deserialize-score";
export { serializeScore } from "./v1/serialize-score";
export { ScoreSerializationError } from "./serialization-error";
export {
  SCORE_SERIALIZATION_FORMAT,
  SCORE_SERIALIZATION_VERSION,
  SerializedBendType,
  SerializedNoteDuration,
  SerializedRepeatStatus,
  SerializedTechniqueType,
} from "./v1/schema";
export type { SerializedScoreV1 } from "./v1/schema";
