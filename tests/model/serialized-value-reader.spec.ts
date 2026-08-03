import { ScoreSerializationError } from "../../src/notation/model/serialization/serialization-error";
import { SerializedValueReader } from "../../src/notation/model/serialization/serialized-value-reader";

function getError(operation: () => unknown): ScoreSerializationError {
  try {
    operation();
  } catch (error) {
    expect(error).toBeInstanceOf(ScoreSerializationError);
    return error as ScoreSerializationError;
  }
  throw Error("Expected operation to fail");
}

describe("SerializedValueReader", () => {
  test("carries property and array index locations", () => {
    const reader = SerializedValueReader.root({ tracks: [{ volume: "loud" }] });
    const tracks = reader.property("tracks").readArray();
    const volumeReader = tracks[0].property("volume");

    expect(getError(() => volumeReader.readFiniteNumber()).path).toBe(
      "$.tracks[0].volume"
    );
  });

  test("reports primitive and range failures at the child path", () => {
    const reader = SerializedValueReader.root({ count: 1.5, volume: 2 });

    expect(getError(() => reader.property("count").readInteger()).path).toBe(
      "$.count"
    );
    expect(
      getError(() => reader.property("volume").readNumberInRange(0, 1)).path
    ).toBe("$.volume");
  });

  test("wraps model operation errors with their cause", () => {
    const cause = new Error("model rejected value");
    const reader = SerializedValueReader.root({ fret: 24 }).property("fret");
    const error = getError(() =>
      reader.runModelOperation(() => {
        throw cause;
      })
    );

    expect(error.path).toBe("$.fret");
    expect(error.cause).toBe(cause);
  });
});
