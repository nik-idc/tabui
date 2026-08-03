import { ScoreSerializationError } from "./serialization-error";
import {
  indexPath,
  propertyPath,
  ROOT_SERIALIZATION_PATH,
  SerializationPath,
} from "./serialization-path";

/**
 * Validates an unknown serialized value while retaining its JSON-style path.
 * Child readers move the path cursor without eagerly validating the child's
 * type, so later failures identify the precise document location.
 */
export class SerializedValueReader {
  private constructor(
    private readonly _value: unknown,
    private readonly _path: SerializationPath
  ) {}

  /** Creates a reader positioned at the serialized document root. */
  static root(value: unknown): SerializedValueReader {
    return new SerializedValueReader(value, ROOT_SERIALIZATION_PATH);
  }

  /** Returns the unvalidated value at the current cursor. */
  rawValue(): unknown {
    return this._value;
  }

  /** Throws a serialization error at the current cursor. */
  fail(message: string): never {
    throw new ScoreSerializationError(this._path, message);
  }

  /**
   * Reads a non-null, non-array object and optionally validates its own
   * JSON-visible keys exactly against `expectedKeys`.
   */
  readObject(expectedKeys?: readonly string[]): Record<string, unknown> {
    if (
      typeof this._value !== "object" ||
      this._value === null ||
      Array.isArray(this._value)
    ) {
      this.fail("expected object");
    }
    const object = this._value as Record<string, unknown>;
    if (expectedKeys !== undefined) {
      this.expectKeys(expectedKeys);
    }
    return object;
  }

  /**
   * Requires every listed property to be owned by the object and rejects
   * unknown own enumerable string keys. Inherited properties are ignored.
   */
  expectKeys(expectedKeys: readonly string[]): void {
    const object = this.readObject();
    const expected = new Set(expectedKeys);
    for (const key of Object.keys(object)) {
      if (!expected.has(key)) {
        this.property(key).fail("unknown property");
      }
    }
    for (const key of expectedKeys) {
      if (!Object.prototype.hasOwnProperty.call(object, key)) {
        this.property(key).fail("missing property");
      }
    }
  }

  /**
   * Returns a child cursor for an own property; a missing property is carried
   * as `undefined` so a subsequent typed read fails at the property path.
   */
  property(name: string): SerializedValueReader {
    const object = this.readObject();
    const value = Object.prototype.hasOwnProperty.call(object, name)
      ? object[name]
      : undefined;
    return new SerializedValueReader(value, propertyPath(this._path, name));
  }

  /** Returns the object's own enumerable property names. */
  readKeys(): string[] {
    return Object.keys(this.readObject());
  }

  /**
   * Reads an array with an own item at every index and no extra own enumerable
   * properties, returning one path-aware reader per item.
   */
  readArray(): SerializedValueReader[] {
    if (!Array.isArray(this._value)) {
      this.fail("expected array");
    }
    const array = this._value;
    const expectedKeys = new Set(
      Array.from({ length: array.length }, (_, i) => String(i))
    );
    for (const key of Object.keys(array)) {
      if (!expectedKeys.has(key)) {
        const valuesByKey = array as unknown as Record<string, unknown>;
        new SerializedValueReader(
          valuesByKey[key],
          propertyPath(this._path, key)
        ).fail("unknown property");
      }
    }
    return Array.from({ length: array.length }, (_, i) => {
      const reader = new SerializedValueReader(
        Object.hasOwn(array, i) ? array[i] : undefined,
        indexPath(this._path, i)
      );
      if (!Object.hasOwn(array, i)) {
        reader.fail("missing array item");
      }
      return reader;
    });
  }

  /** Reads a string or fails at the current cursor. */
  readString(): string {
    if (typeof this._value !== "string") {
      this.fail("expected string");
    }
    return this._value as string;
  }

  /** Reads a boolean or fails at the current cursor. */
  readBoolean(): boolean {
    if (typeof this._value !== "boolean") {
      this.fail("expected boolean");
    }
    return this._value as boolean;
  }

  /** Reads a finite number, rejecting `NaN` and infinities. */
  readFiniteNumber(): number {
    if (typeof this._value !== "number" || !Number.isFinite(this._value)) {
      this.fail("expected finite number");
    }
    return this._value as number;
  }

  /** Reads a safe integer. */
  readInteger(): number {
    const number = this.readFiniteNumber();
    if (!Number.isSafeInteger(number)) {
      this.fail("expected safe integer");
    }
    return number;
  }

  /** Reads a finite number within the inclusive bounds. */
  readNumberInRange(minimum: number, maximum: number): number {
    const number = this.readFiniteNumber();
    if (number < minimum || number > maximum) {
      this.fail(`expected value between ${minimum} and ${maximum}`);
    }
    return number;
  }

  /** Reads a safe integer within the inclusive bounds. */
  readIntegerInRange(minimum: number, maximum: number): number {
    const number = this.readInteger();
    if (number < minimum || number > maximum) {
      this.fail(`expected value between ${minimum} and ${maximum}`);
    }
    return number;
  }

  /**
   * Maps a string through an own key of `lookup`, preventing inherited names
   * such as `toString` from being accepted as enum values.
   */
  readEnumValue<T>(lookup: Record<string, T>): T {
    const string = this.readString();
    if (!Object.prototype.hasOwnProperty.call(lookup, string)) {
      this.fail(`unsupported value '${string}'`);
    }
    return lookup[string];
  }

  /** Reads a string that exactly matches one of the allowed members. */
  readEnumMember<T extends string>(allowed: readonly T[]): T {
    const string = this.readString();
    const member = allowed.find((candidate) => candidate === string);
    if (member === undefined) {
      this.fail(`unsupported value '${string}'`);
    }
    return member;
  }

  /** Reads either `null` or a safe integer. */
  readNullableInteger(): number | null {
    return this._value === null ? null : this.readInteger();
  }

  /**
   * Runs model validation at this cursor, preserving serialization errors and
   * wrapping other failures with their original value as the error cause.
   */
  runModelOperation<T>(operation: () => T): T {
    try {
      return operation();
    } catch (caught) {
      if (caught instanceof ScoreSerializationError) {
        throw caught;
      }
      const message =
        caught instanceof Error ? caught.message : "invalid value";
      throw new ScoreSerializationError(this._path, message, { cause: caught });
    }
  }
}
