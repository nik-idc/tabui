import { ScoreSerializationError } from "./serialization-error";
import { indexPath, SerializationPath } from "./serialization-path";

/**
 * Serializes an array while requiring every index to be an own, defined item.
 * Sparse arrays and explicit `undefined` items are rejected at their indexed
 * JSON-style paths, producing a dense serialized result.
 */
export function serializeArray<T, U>(
  values: readonly T[],
  path: SerializationPath,
  serialize: (value: T, path: SerializationPath, index: number) => U
): U[] {
  if (!Array.isArray(values)) {
    throw new ScoreSerializationError(path, "expected array");
  }
  const result: U[] = [];
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const valuePath = indexPath(path, i);
    if (!Object.hasOwn(values, i) || value === undefined) {
      throw new ScoreSerializationError(valuePath, "missing array item");
    }
    result.push(serialize(value, valuePath, i));
  }
  return result;
}
