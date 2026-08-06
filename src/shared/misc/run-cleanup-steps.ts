/**
 * Runs every cleanup step and rethrows the last failure, if any.
 * Improves readability by getting rid of long try/catch chains
 */
export function runCleanupSteps(...steps: readonly (() => void)[]): void {
  let failed = false;
  let lastError: unknown;
  for (const step of steps) {
    try {
      step();
    } catch (error) {
      failed = true;
      lastError = error;
    }
  }

  if (failed) {
    throw lastError;
  }
}
