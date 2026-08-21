import { expect, test } from "@playwright/test";

test("anchors, extends, and clears a range through shared transport controls", async ({
  page,
}) => {
  // Load a score with several bars so Next can extend beyond the anchor bar.
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  const rangeButton = editor.locator('img[alt="Set anchor"]');
  await expect(rangeButton).toBeVisible();

  // Set a one-beat anchor from the editor's current note cursor.
  await editor.locator('img[alt="Set anchor"]').click();
  const clearRangeButton = editor.locator('img[alt="Clear range"]');
  await expect(clearRangeButton).toBeVisible();
  const selectionRect = editor.locator('[id^="selection-rect-"]');
  await expect(selectionRect).toHaveCount(1);
  const selectionWidthBefore = await selectionRect.getAttribute("width");

  // Clicking another beat extends the stopped range instead of replacing its cursor.
  const noteRects = editor.locator('.tu-root-svg [id^="note-rect-"]');
  const nextBeatIndex = await noteRects.evaluateAll((elements) => {
    const firstX = Number(elements[0]?.getAttribute("x"));
    return elements.findIndex((element) => {
      return Number(element.getAttribute("x")) > firstX;
    });
  });
  expect(nextBeatIndex).toBeGreaterThan(0);
  await noteRects.nth(nextBeatIndex).click();
  await expect
    .poll(async () => selectionRect.getAttribute("width"))
    .not.toBe(selectionWidthBefore);
  const selectionWidthAfterBeat = await selectionRect.getAttribute("width");
  expect(selectionWidthAfterBeat).not.toBe(selectionWidthBefore);

  // Next extends the stopped range from its active endpoint.
  await editor.locator('img[alt="Next bar"]').click();
  await expect
    .poll(async () => selectionRect.getAttribute("width"))
    .not.toBe(selectionWidthAfterBeat);

  // Clear restores the cursor state and makes a new anchor available.
  await editor.locator('img[alt="Clear range"]').click();
  await expect(editor.locator('img[alt="Set anchor"]')).toBeVisible();
  await expect(editor.locator('[id^="selection-rect-"]')).toHaveCount(0);
});
