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

/**
 * Returns an element's center from the page's own geometry. Playwright's
 * WebKit ignores the offsets of parent groups for SVG text, so its own click
 * point can land on another element.
 */
async function getPageCenter(
  locator: Locator
): Promise<{ x: number; y: number }> {
  await locator.waitFor({ state: "visible" });
  return locator.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
}

/** Moves the mouse over SVG text. Use instead of `hover()` on SVG text. */
export async function hoverSvgText(locator: Locator): Promise<void> {
  const { x, y } = await getPageCenter(locator);
  await locator.page().mouse.move(x, y);
}

/** Clicks SVG text. Use instead of `click()` on SVG text. */
export async function clickSvgText(locator: Locator): Promise<void> {
  const { x, y } = await getPageCenter(locator);
  await locator.page().mouse.click(x, y);
}
