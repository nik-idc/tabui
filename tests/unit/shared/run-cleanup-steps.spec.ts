import { runCleanupSteps } from "../../../src/shared/misc/run-cleanup-steps";

describe("runCleanupSteps", () => {
  test("continues after failures and rethrows the last one", () => {
    const calls: number[] = [];
    const firstError = new Error("first");
    const lastError = new Error("last");

    let caught: unknown;
    try {
      runCleanupSteps(
        () => {
          calls.push(1);
          throw firstError;
        },
        () => calls.push(2),
        () => {
          calls.push(3);
          throw lastError;
        },
        () => calls.push(4)
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBe(lastError);
    expect(calls).toEqual([1, 2, 3, 4]);
  });

  test("runs successful cleanup steps in order without throwing", () => {
    const remaining = new Set(["listener", "view"]);

    expect(() =>
      runCleanupSteps(
        () => {
          remaining.delete("listener");
        },
        () => {
          expect(remaining.has("listener")).toBe(false);
          remaining.delete("view");
        }
      )
    ).not.toThrow();
    expect(remaining.size).toBe(0);
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
