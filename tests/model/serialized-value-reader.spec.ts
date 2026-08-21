import { ScoreSerializationError } from "../../src/notation/model/serialization/serialization-error";
import { SerializedValueReader } from "../../src/notation/model/serialization/serialized-value-reader";

function getError(operation: () => unknown): ScoreSerializationError {
  try {
    operation();
  } catch (error) {
    if (error instanceof ScoreSerializationError) {
      return error;
    }
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

  test.each(["__proto__", "constructor", "toString"])(
    "rejects inherited enum key %s",
    (value) => {
      const reader = SerializedValueReader.root(value);
      const error = getError(() => reader.readEnumValue({ valid: 1 }));

      expect(error.path).toBe("$");
      expect(error.message).toContain(`unsupported value '${value}'`);
    }
  );

  test("reports unknown and missing object keys at their property paths", () => {
    const unknown = SerializedValueReader.root({ expected: 1, typo: 2 });
    const missing = SerializedValueReader.root({});

    expect(getError(() => unknown.readObject(["expected"])).path).toBe(
      "$.typo"
    );
    expect(getError(() => missing.readObject(["expected"])).path).toBe(
      "$.expected"
    );
  });

  test("rejects array holes, inherited indices, and named properties", () => {
    const hole = new Array(1);
    const inherited = new Array(1);
    Object.setPrototypeOf(inherited, { 0: "inherited" });
    const named = ["value"];
    Reflect.set(named, "extra", true);

    expect(
      getError(() => SerializedValueReader.root(hole).readArray()).path
    ).toBe("$[0]");
    expect(
      getError(() => SerializedValueReader.root(inherited).readArray()).path
    ).toBe("$[0]");
    expect(
      getError(() => SerializedValueReader.root(named).readArray()).path
    ).toBe("$.extra");
  });
});
