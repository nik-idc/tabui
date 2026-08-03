import { ScoreSerializationError } from "./serialization-error";
import {
  indexPath,
  propertyPath,
  ROOT_SERIALIZATION_PATH,
  SerializationPath,
} from "./serialization-path";

export class SerializedValueReader {
  private constructor(
    private readonly _value: unknown,
    private readonly _path: SerializationPath
  ) {}

  static root(value: unknown): SerializedValueReader {
    return new SerializedValueReader(value, ROOT_SERIALIZATION_PATH);
  }

  rawValue(): unknown {
    return this._value;
  }

  fail(message: string): never {
    throw new ScoreSerializationError(this._path, message);
  }

  readObject(): Record<string, unknown> {
    if (
      typeof this._value !== "object" ||
      this._value === null ||
      Array.isArray(this._value)
    ) {
      this.fail("expected object");
    }
    return this._value as Record<string, unknown>;
  }

  property(name: string): SerializedValueReader {
    const object = this.readObject();
    return new SerializedValueReader(
      object[name],
      propertyPath(this._path, name)
    );
  }

  readKeys(): string[] {
    return Object.keys(this.readObject());
  }

  readArray(): SerializedValueReader[] {
    if (!Array.isArray(this._value)) {
      this.fail("expected array");
    }
    const array = this._value;
    return Array.from(
      { length: array.length },
      (_, i) => new SerializedValueReader(array[i], indexPath(this._path, i))
    );
  }

  readString(): string {
    if (typeof this._value !== "string") {
      this.fail("expected string");
    }
    return this._value as string;
  }

  readBoolean(): boolean {
    if (typeof this._value !== "boolean") {
      this.fail("expected boolean");
    }
    return this._value as boolean;
  }

  readFiniteNumber(): number {
    if (typeof this._value !== "number" || !Number.isFinite(this._value)) {
      this.fail("expected finite number");
    }
    return this._value as number;
  }

  readInteger(): number {
    const number = this.readFiniteNumber();
    if (!Number.isSafeInteger(number)) {
      this.fail("expected safe integer");
    }
    return number;
  }

  readNumberInRange(minimum: number, maximum: number): number {
    const number = this.readFiniteNumber();
    if (number < minimum || number > maximum) {
      this.fail(`expected value between ${minimum} and ${maximum}`);
    }
    return number;
  }

  readIntegerInRange(minimum: number, maximum: number): number {
    const number = this.readInteger();
    if (number < minimum || number > maximum) {
      this.fail(`expected value between ${minimum} and ${maximum}`);
    }
    return number;
  }

  readEnumValue<T>(lookup: Record<string, T>): T {
    const string = this.readString();
    const mapped = lookup[string];
    if (mapped === undefined) {
      this.fail(`unsupported value '${string}'`);
    }
    return mapped;
  }

  readEnumMember<T extends string>(allowed: readonly T[]): T {
    const string = this.readString();
    const member = allowed.find((candidate) => candidate === string);
    if (member === undefined) {
      this.fail(`unsupported value '${string}'`);
    }
    return member;
  }

  readNullableInteger(): number | null {
    return this._value === null ? null : this.readInteger();
  }

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
