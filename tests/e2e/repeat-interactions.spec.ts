import { expect, test, type Locator, type Page } from "@playwright/test";

/** Finds an exposed point on the filled repeat geometry. */
async function repeatPoint(path: Locator) {
  await path.scrollIntoViewIfNeeded();
  return path.evaluate((node) => {
    const geometry = node as SVGPathElement;
    const matrix = geometry.getScreenCTM();
    if (matrix === null) throw Error("Repeat path has no screen transform");
    for (let step = 1; step < 40; step++) {
      const point = geometry
        .getPointAtLength((geometry.getTotalLength() * step) / 40)
        .matrixTransform(matrix);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const x = Math.round(point.x) + dx;
          const y = Math.round(point.y) + dy;
          if (document.elementFromPoint(x, y) === geometry) return { x, y };
        }
      }
    }
    throw Error("Expected exposed repeat geometry");
  });
}

/** Adds both repeats, then moves selection to another bar. */
async function prepareRepeats(page: Page) {
  await page.goto("/tabui/?fixture=empty&theme=obsidian");
  const editor = page.locator("#tabui-editor");
  await editor.locator('[id^="note-rect-"]').first().click();
  await page.keyboard.press("5");
  await page.keyboard.press("r");
  await page.keyboard.press("Shift+R");
  const dialog = editor.getByRole("dialog", { name: "Repeat count" });
  await dialog.getByRole("spinbutton").fill("3");
  await dialog.getByRole("button", { name: "Confirm" }).click();
  const startId = await editor
    .locator('[id^="bar-rep-start-"]')
    .getAttribute("id");
  const endId = await editor.locator('[id^="bar-rep-end-"]').getAttribute("id");
  const countId = await editor
    .locator('[id^="bar-rep-count-"]')
    .getAttribute("id");
  await page.keyboard.press("Shift+I");
  await editor.locator('[id^="note-rect-"]').last().click();
  return {
    editor,
    start: editor.locator(`[id="${startId}"]`),
    end: editor.locator(`[id="${endId}"]`),
    count: editor.locator(`[id="${countId}"]`),
  };
}

test("repeat start: local hover, removal, unchanged selection, and undo", async ({
  page,
}) => {
  const { editor, start, end, count } = await prepareRepeats(page);
  await page.mouse.move(0, 0);
  const originalFill = await start.evaluate(
    (node) => getComputedStyle(node).fill
  );
  const endFill = await end.evaluate((node) => getComputedStyle(node).fill);
  const selectedRect = editor.locator('#tu-selection > rect[fill="none"]');
  const selection = await selectedRect.evaluate((node) => node.outerHTML);
  const point = await repeatPoint(start);
  await page.mouse.move(point.x, point.y);
  await expect(start).not.toHaveCSS("fill", originalFill);
  await expect(start).toHaveCSS("cursor", "pointer");
  await expect(end).toHaveCSS("fill", endFill);
  await page.mouse.move(0, 0);
  await expect(start).toHaveCSS("fill", originalFill);
  await page.mouse.click(point.x, point.y);
  await expect(start).toHaveCount(0);
  await expect(count).toHaveText("x3");
  expect(await selectedRect.evaluate((node) => node.outerHTML)).toBe(selection);
  await editor.locator(".tu-notation-viewport").focus();
  await page.keyboard.press("Control+z");
  await expect(start).toBeVisible();
  await page.keyboard.press("Control+y");
  await expect(start).toHaveCount(0);
});

test("repeat end: grouped hover, clicked-bar dialog, edits, removal, and undo", async ({
  page,
}) => {
  const { editor, start, end, count } = await prepareRepeats(page);
  await page.mouse.move(0, 0);
  const originalFill = await end.evaluate(
    (node) => getComputedStyle(node).fill
  );
  const countFill = await count.evaluate((node) => getComputedStyle(node).fill);
  const startFill = await start.evaluate((node) => getComputedStyle(node).fill);
  const point = await repeatPoint(end);
  await page.mouse.move(point.x, point.y);
  await expect(end).not.toHaveCSS("fill", originalFill);
  await expect(count).not.toHaveCSS("fill", countFill);
  await expect(start).toHaveCSS("fill", startFill);
  await page.mouse.click(point.x, point.y);
  const dialog = editor.getByRole("dialog", { name: "Repeat count" });
  await expect(dialog.getByRole("spinbutton")).toHaveValue("3");
  await page.keyboard.press("Escape");
  await count.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("spinbutton").fill("5");
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(count).toHaveText("x5");
  await page.keyboard.press("Control+z");
  await expect(count).toHaveText("x3");
  await count.click();
  await dialog.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(end).toHaveCount(0);
  await expect(count).toHaveCount(0);
  await expect(start).toBeVisible();
  await page.keyboard.press("Control+z");
  await expect(count).toHaveText("x3");
});

test("repeat clicks are blocked during playback and in view-only mode", async ({
  page,
}) => {
  const { editor, start, end } = await prepareRepeats(page);
  await editor.getByRole("button", { name: "Play", exact: true }).click();
  let point = await repeatPoint(start);
  await page.mouse.click(point.x, point.y);
  await expect(start).toBeVisible();
  point = await repeatPoint(end);
  await page.mouse.click(point.x, point.y);
  await expect(editor.getByRole("dialog")).toHaveCount(0);
  await editor.getByRole("button", { name: "Pause", exact: true }).click();
  await page.setViewportSize({ width: 800, height: 900 });
  await expect(editor).toHaveClass(/tu-responsive-view-only/);
  point = await repeatPoint(start);
  await page.mouse.click(point.x, point.y);
  await expect(start).toBeVisible();
  point = await repeatPoint(end);
  await page.mouse.click(point.x, point.y);
  await expect(editor.getByRole("dialog")).toHaveCount(0);
});
