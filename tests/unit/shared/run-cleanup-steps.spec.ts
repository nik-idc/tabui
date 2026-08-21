import { runCleanupSteps } from "../../../src/shared/misc/run-cleanup-steps";

describe("runCleanupSteps", () => {
  test("continues after failures and rethrows the last one", () => {
    const calls: number[] = [];
    const firstError = new Error("first");
    const lastError = new Error("last");

    expect(() =>
      runCleanupSteps(
        () => {
          calls.push(1);
          throw firstError;
        },
        () => calls.push(2),
        () => {
          calls.push(3);
          throw lastError;
        }
      )
    ).toThrow(lastError);
    expect(calls).toEqual([1, 2, 3]);
  });

  test("preserves an undefined thrown value", () => {
    let caught = false;

    try {
      runCleanupSteps(() => {
        throw undefined;
      });
    } catch (error) {
      caught = true;
      expect(error).toBeUndefined();
    }

    expect(caught).toBe(true);
  });
});
