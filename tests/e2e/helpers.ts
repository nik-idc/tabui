import type { Locator } from "@playwright/test";

type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Returns a visible element's browser rectangle or fails with a clear error. */
export async function requiredBoundingBox(
  locator: Locator
): Promise<BoundingBox> {
  await locator.waitFor({ state: "visible" });
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error("Expected a visible locator to have a bounding box");
  }
  return box;
}
