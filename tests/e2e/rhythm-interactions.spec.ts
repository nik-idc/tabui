import { expect, test, type Locator, type Page } from "@playwright/test";

/** Opens a score with one selected note. */
async function openRhythmEditor(page: Page) {
  await page.goto("/tabui/?fixture=empty&theme=obsidian");
  const editor = page.locator("#tabui-editor");
  await editor.locator('[id^="note-rect-"]').first().click();
  await page.keyboard.press("5");
  return editor;
}

/** Returns a screen point just beside the visible stem, inside its hit path. */
async function stemHitPoint(stem: Locator) {
  return stem.evaluate((node) => {
    const line = node as SVGLineElement;
    const matrix = line.getScreenCTM();
    if (matrix === null) throw Error("Stem has no screen transform");
    return new DOMPoint(
      line.x1.baseVal.value + 2,
      (line.y1.baseVal.value + line.y2.baseVal.value) / 2
    )
      .matrixTransform(matrix)
      .toJSON();
  });
}

test("stem and flags share hover and enlarged targets select one beat", async ({
  page,
}) => {
  const editor = await openRhythmEditor(page);
  await page.keyboard.press("-");
  const stem = editor.locator('[id^="beat-rhythm-stem-"]').first();
  const flag = editor.locator('[id^="beat-rhythm-flag-"]').first();
  await expect(flag).toHaveCount(1);
  await page.mouse.move(0, 0);
  const original = await stem.evaluate((node) => getComputedStyle(node).stroke);
  const point = await stemHitPoint(stem);
  await page.mouse.move(point.x, point.y);
  await expect(stem).not.toHaveCSS("stroke", original);
  await expect(flag).not.toHaveCSS("stroke", original);
  await page.mouse.move(0, 0);
  await expect(stem).toHaveCSS("stroke", original);
  await expect(flag).toHaveCSS("stroke", original);
  await page.mouse.click(point.x, point.y);
  await expect(
    editor.locator('#tu-selection [id^="selection-rect-"][display="block"]')
  ).toHaveCount(1);
  await expect(editor.locator('#tu-selection > rect[fill="none"]')).toHaveCount(
    0
  );
  const flagPoint = await flag.evaluate((node) => {
    const line = node as SVGLineElement;
    const matrix = line.getScreenCTM();
    if (matrix === null) throw Error("Flag has no screen transform");
    return new DOMPoint(
      (line.x1.baseVal.value + line.x2.baseVal.value) / 2,
      line.y1.baseVal.value
    )
      .matrixTransform(matrix)
      .toJSON();
  });
  await page.mouse.click(flagPoint.x, flagPoint.y);
  await expect(
    editor.locator('#tu-selection [id^="selection-rect-"][display="block"]')
  ).toHaveCount(1);
});

test("double dots hover together, remove from the clicked beat, and undo", async ({
  page,
}) => {
  const editor = await openRhythmEditor(page);
  await page.keyboard.press(".");
  await page.keyboard.press(".");
  const dots = editor.locator('[id^="beat-rhythm-dot-"]');
  await expect(dots).toHaveCount(2);
  const firstId = await dots.first().getAttribute("id");
  await page.keyboard.press("a");
  await page.keyboard.press("6");
  const originalDots = editor.locator(`.tu-beat-dots:has([id="${firstId}"])`);
  const original = await originalDots
    .locator("circle")
    .first()
    .evaluate((node) => getComputedStyle(node).fill);
  const selectedRect = editor.locator('#tu-selection > rect[fill="none"]');
  const selectedTextId = await editor
    .locator('[id^="note-text-"]')
    .filter({ hasText: "6" })
    .getAttribute("id");
  const selectedNoteId = selectedTextId?.replace("note-text-", "note-rect-");
  const hit = originalDots.locator("path");
  await hit.hover();
  await expect(originalDots.locator("circle").first()).not.toHaveCSS(
    "fill",
    original
  );
  await expect(originalDots.locator("circle").last()).not.toHaveCSS(
    "fill",
    original
  );
  await page.mouse.move(0, 0);
  await expect(originalDots.locator("circle").first()).toHaveCSS(
    "fill",
    original
  );
  await hit.click();
  await expect(originalDots.locator("circle")).toHaveCount(0);
  await expect(originalDots.locator("path")).toHaveCount(0);
  const selectedBox = await selectedRect.boundingBox();
  const noteBox = await editor
    .locator(`[id="${selectedNoteId}"]`)
    .boundingBox();
  if (selectedBox === null || noteBox === null)
    throw Error("Expected selection boxes");
  expect(selectedBox.x + selectedBox.width / 2).toBeCloseTo(
    noteBox.x + noteBox.width / 2,
    0
  );
  expect(selectedBox.y + selectedBox.height / 2).toBeCloseTo(
    noteBox.y + noteBox.height / 2,
    0
  );
  await editor.locator(".tu-notation-viewport").focus();
  await page.keyboard.press("Control+z");
  await expect(originalDots.locator("circle")).toHaveCount(2);
  await page.keyboard.press("Control+y");
  await expect(originalDots.locator("circle")).toHaveCount(0);
});

test("secondary beam tails highlight and select the complete connected group", async ({
  page,
}) => {
  const editor = await openRhythmEditor(page);
  await page.keyboard.press("-");
  await page.keyboard.press("-");
  await page.keyboard.press("a");
  await page.keyboard.press("6");
  await editor.locator('[data-duration="8"]').click();
  await editor.locator(".tu-notation-viewport").focus();
  await page.keyboard.press("a");
  await page.keyboard.press("7");
  await editor.locator('[data-duration="4"]').click();
  await editor.locator(".tu-notation-viewport").focus();
  const tail = editor.locator('[id^="beam-short-rect-"]').first();
  await expect(tail).toBeVisible();
  const primary = editor.locator('[id^="beam-long-rect-"]').first();
  await page.mouse.move(0, 0);
  const original = await primary.evaluate(
    (node) => getComputedStyle(node).fill
  );
  const tailPoint = await tail.evaluate((node) => {
    const rect = node as SVGRectElement;
    const matrix = rect.getScreenCTM();
    if (matrix === null) throw Error("Beam has no screen transform");
    return new DOMPoint(
      rect.x.baseVal.value + rect.width.baseVal.value / 2,
      rect.y.baseVal.value + rect.height.baseVal.value / 2
    )
      .matrixTransform(matrix)
      .toJSON();
  });
  await page.mouse.move(tailPoint.x, tailPoint.y);
  await expect(primary).not.toHaveCSS("fill", original);
  await expect(tail).not.toHaveCSS("fill", original);
  await page.mouse.move(0, 0);
  await expect(primary).toHaveCSS("fill", original);
  await page.mouse.click(tailPoint.x, tailPoint.y);
  await expect(
    editor.locator('#tu-selection [id^="selection-rect-"][display="block"]')
  ).toHaveCount(1);
  const primaryPoint = await primary.evaluate((node) => {
    const rect = node as SVGRectElement;
    const matrix = rect.getScreenCTM();
    if (matrix === null) throw Error("Beam has no screen transform");
    return new DOMPoint(
      rect.x.baseVal.value + rect.width.baseVal.value / 2,
      rect.y.baseVal.value + rect.height.baseVal.value / 2
    )
      .matrixTransform(matrix)
      .toJSON();
  });
  await page.mouse.click(primaryPoint.x, primaryPoint.y);
  await expect(
    editor.locator('#tu-selection [id^="selection-rect-"][display="block"]')
  ).toHaveCount(1);
  await page.keyboard.press(".");
  await expect(editor.locator(".tu-beat-dots circle")).toHaveCount(2);
});

test("view-only allows rhythm selection but blocks dot removal", async ({
  page,
}) => {
  const editor = await openRhythmEditor(page);
  await page.keyboard.press(".");
  await page.keyboard.press(".");
  await page.setViewportSize({ width: 800, height: 900 });
  await expect(editor).toHaveClass(/tu-responsive-view-only/);
  const dots = editor.locator(".tu-beat-dots circle");
  await editor.locator(".tu-beat-dots path").click();
  await expect(dots).toHaveCount(2);
  const point = await stemHitPoint(
    editor.locator('[id^="beat-rhythm-stem-"]').first()
  );
  await page.mouse.click(point.x, point.y);
  await expect(
    editor.locator('#tu-selection [id^="selection-rect-"][display="block"]')
  ).toHaveCount(1);
});

test("playback blocks rhythm selection and dot removal", async ({ page }) => {
  const editor = await openRhythmEditor(page);
  await page.keyboard.press(".");
  await page.keyboard.press(".");
  await editor.getByRole("button", { name: "Play", exact: true }).click();
  await editor.locator(".tu-beat-dots path").click();
  await expect(editor.locator(".tu-beat-dots circle")).toHaveCount(2);
  const point = await stemHitPoint(
    editor.locator('[id^="beat-rhythm-stem-"]').first()
  );
  await page.mouse.click(point.x, point.y);
  await expect(
    editor.locator('#tu-selection [id^="selection-rect-"][display="block"]')
  ).toHaveCount(0);
  await editor.getByRole("button", { name: "Pause", exact: true }).click();
});
