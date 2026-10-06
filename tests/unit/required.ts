/** Returns a required test value, or throws if it is null or undefined. */
/** Returns a test value or throws when the expected value is absent. */
export function required<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error("Expected a required test value");
  }
  return value;
}
