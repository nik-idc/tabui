import { ScoreSerializationError } from "../../../src/notation/model/serialization/serialization-error";
import { SerializedValueReader } from "../../../src/notation/model/serialization/serialized-value-reader";

function getError(operation: () => unknown): ScoreSerializationError {
  try {
    operation();
  } catch (error) {
    if (error instanceof ScoreSerializationError) {
      return error;
    }
    throw error;
  }
  throw Error("Expected operation to fail");
}

describe("SerializedValueReader", () => {
  test("carries property and array index locations", () => {
    const valid = SerializedValueReader.root({ tracks: [{ volume: 0.5 }] });
    expect(
      valid
        .property("tracks")
        .readArray()[0]
        .property("volume")
        .readFiniteNumber()
    ).toBe(0.5);
    const reader = SerializedValueReader.root({ tracks: [{ volume: "loud" }] });
    const tracks = reader.property("tracks").readArray();
    const volumeReader = tracks[0].property("volume");

    const error = getError(() => volumeReader.readFiniteNumber());
    expect(error.path).toBe("$.tracks[0].volume");
    expect(error.message).toContain("expected finite number");
  });

  test("reports primitive and range failures at the child path", () => {
    const valid = SerializedValueReader.root({ count: 2, volume: 1 });
    expect(valid.property("count").readInteger()).toBe(2);
    expect(valid.property("volume").readNumberInRange(0, 1)).toBe(1);
    expect(SerializedValueReader.root(0).readNumberInRange(0, 1)).toBe(0);

    for (const count of [1.5, Number.MAX_SAFE_INTEGER + 1]) {
      const reader = SerializedValueReader.root({ count });
      const error = getError(() => reader.property("count").readInteger());
      expect(error.path).toBe("$.count");
      expect(error.message).toContain("expected safe integer");
    }
    for (const volume of [-0.1, 2]) {
      const reader = SerializedValueReader.root({ volume });
      const error = getError(() =>
        reader.property("volume").readNumberInRange(0, 1)
      );
      expect(error.path).toBe("$.volume");
      expect(error.message).toContain("expected value between 0 and 1");
    }
    for (const volume of [NaN, Infinity, "0.5"]) {
      const reader = SerializedValueReader.root({ volume });
      const error = getError(() =>
        reader.property("volume").readFiniteNumber()
      );
      expect(error.path).toBe("$.volume");
      expect(error.message).toContain("expected finite number");
    }
  });

  test("wraps model operation errors with their cause", () => {
    const cause = new Error("model rejected value");
    const reader = SerializedValueReader.root({ fret: 24 }).property("fret");
    expect(reader.runModelOperation(() => 24)).toBe(24);
    const error = getError(() =>
      reader.runModelOperation(() => {
        throw cause;
      })
    );

    expect(error.path).toBe("$.fret");
    expect(error.cause).toBe(cause);
    expect(error.message).toContain("model rejected value");
    const nested = new ScoreSerializationError("$.fret.detail", "invalid fret");
    expect(
      getError(() =>
        reader.runModelOperation(() => {
          throw nested;
        })
      )
    ).toBe(nested);
  });

  test.each(["__proto__", "constructor", "toString"])(
    "rejects inherited enum key %s",
    (value) => {
      expect(
        SerializedValueReader.root("valid").readEnumValue({ valid: 1 })
      ).toBe(1);
      const reader = SerializedValueReader.root(value);
      const error = getError(() => reader.readEnumValue({ valid: 1 }));

      expect(error.path).toBe("$");
      expect(error.message).toContain(`unsupported value '${value}'`);
    }
  );

  test("reports unknown and missing object keys at their property paths", () => {
    expect(
      SerializedValueReader.root({ expected: 1 }).readObject(["expected"])
    ).toEqual({ expected: 1 });
    const unknown = SerializedValueReader.root({ expected: 1, typo: 2 });
    const missing = SerializedValueReader.root({});

    const unknownError = getError(() => unknown.readObject(["expected"]));
    expect(unknownError.path).toBe("$.typo");
    expect(unknownError.message).toContain("unknown property");
    const missingError = getError(() => missing.readObject(["expected"]));
    expect(missingError.path).toBe("$.expected");
    expect(missingError.message).toContain("missing property");

    const nullable = SerializedValueReader.root({ expected: null });
    expect(nullable.readObject(["expected"])).toEqual({ expected: null });
    expect(nullable.property("expected").readNullableInteger()).toBeNull();
    const absentError = getError(() =>
      missing.property("expected").readNullableInteger()
    );
    expect(absentError.path).toBe("$.expected");
    expect(absentError.message).toContain("expected finite number");
  });

  test("rejects array holes, inherited indices, and named properties", () => {
    expect(
      SerializedValueReader.root(["value"]).readArray()[0].readString()
    ).toBe("value");
    const hole = new Array(1);
    const inherited = new Array(1);
    Object.setPrototypeOf(inherited, { 0: "inherited" });
    const named = ["value"];
    Reflect.set(named, "extra", true);

    for (const array of [hole, inherited]) {
      const error = getError(() =>
        SerializedValueReader.root(array).readArray()
      );
      expect(error.path).toBe("$[0]");
      expect(error.message).toContain("missing array item");
    }
    const error = getError(() => SerializedValueReader.root(named).readArray());
    expect(error.path).toBe("$.extra");
    expect(error.message).toContain("unknown property");
  });
});
