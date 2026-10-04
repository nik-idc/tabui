import { expect, test, type Locator } from "@playwright/test";

/** Finds an exposed point on a label's real click target. */
async function labelHitPoint(label: Locator) {
  const target = label.locator('[id^="technique-label-hit-"]').first();
  await target.scrollIntoViewIfNeeded();
  return target.evaluate((node) => {
    const path = node as SVGPathElement;
    const matrix = path.getScreenCTM()!;
    for (let step = 1; step < 20; step++) {
      const point = path
        .getPointAtLength((path.getTotalLength() * step) / 20)
        .matrixTransform(matrix);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const x = Math.round(point.x) + dx;
          const y = Math.round(point.y) + dy;
          if (document.elementFromPoint(x, y) === path) {
            return { x, y };
          }
        }
      }
    }
    throw Error("Expected exposed label hit target");
  });
}

for (const shortcut of ["v", "p", "Shift+L"]) {
  test(`label ${shortcut}: local hover, shared removal, and one-step undo`, async ({
    page,
  }) => {
    await page.goto("/tabui/?fixture=empty&theme=obsidian");
    const editor = page.locator("#tabui-editor");
    await editor.locator('[id^="note-rect-"]').first().click();
    await page.keyboard.press("5");
    await page.keyboard.press(shortcut);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("7");
    await page.keyboard.press(shortcut);
    await page.keyboard.press("a");
    await page.keyboard.press("9");
    await page.keyboard.press(shortcut);

    const labels = editor.locator(".tu-technique-label");
    await expect(labels).toHaveCount(2);
    await page.mouse.move(0, 0);
    const visibleSelector =
      shortcut === "v"
        ? '[id^="technique-label-path-"]'
        : '[id^="technique-label-text-"]';
    const property = shortcut === "v" ? "stroke" : "fill";
    const first = labels.first().locator(visibleSelector);
    const other = labels.nth(1).locator(visibleSelector);
    const original = await first.evaluate(
      (node, property) => getComputedStyle(node).getPropertyValue(property),
      property
    );
    const point = await labelHitPoint(labels.first());
    await page.mouse.move(point.x, point.y);
    await expect(first).not.toHaveCSS(property, original);
    await expect(first).toHaveCSS("cursor", "pointer");
    await expect(other).toHaveCSS(property, original);
    const target = labels
      .first()
      .locator('[id^="technique-label-hit-"]')
      .first();
    await expect(target).toHaveCSS(
      shortcut === "v" ? "stroke" : "fill",
      "rgba(0, 0, 0, 0)"
    );
    await page.mouse.move(0, 0);
    await expect(first).toHaveCSS(property, original);
    await page.mouse.click(point.x, point.y);
    await expect(labels).toHaveCount(1);
    if (shortcut === "Shift+L") {
      await expect(editor.locator('[id^="note-text-"]')).toHaveText([
        "5",
        "7",
        "(9)",
      ]);
    }
    await editor.locator(".tu-notation-viewport").focus();
    await page.keyboard.press("Control+z");
    await expect(labels).toHaveCount(2);
    if (shortcut === "Shift+L") {
      await expect(editor.locator('[id^="note-text-"]')).toHaveText([
        "(5)",
        "(7)",
        "(9)",
      ]);
    }
    await page.keyboard.press("Control+y");
    await expect(labels).toHaveCount(1);
  });
}

test("bend labels do not highlight or remove bends", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty&theme=obsidian");
  const editor = page.locator("#tabui-editor");
  await editor.locator('[id^="note-rect-"]').first().click();
  for (const fret of ["5", "7"]) {
    await page.keyboard.press(fret);
    await page.keyboard.press("b");
    if (fret === "7") {
      await editor
        .getByRole("dialog", { name: "Bend", exact: true })
        .getByRole("button", { name: "Prebend", exact: true })
        .click();
    }
    await editor
      .getByRole("dialog", { name: "Bend", exact: true })
      .getByRole("button", { name: "Confirm" })
      .click();
    await page.keyboard.press("ArrowDown");
  }
  const labels = editor.locator(".tu-technique-label");
  const bends = editor.locator(".tu-inline-technique");
  await expect(labels).toHaveCount(2);
  await expect(bends).toHaveCount(2);
  await expect(labels.locator('[id^="technique-label-hit-"]')).toHaveCount(0);
  const text = labels.nth(1).locator('[id^="technique-label-text-"]').first();
  await text.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const originalFill = await text.evaluate(
    (node) => getComputedStyle(node).fill
  );
  await text.hover();
  await expect(text).toHaveCSS("fill", originalFill);
  await expect(text).not.toHaveCSS("cursor", "pointer");
  await text.click();
  await expect(labels).toHaveCount(2);
  await expect(bends).toHaveCount(2);
});
