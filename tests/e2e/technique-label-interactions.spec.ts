import { expect, test, type Locator } from "@playwright/test";

/** Finds an exposed point on a label's real click target. */
async function labelHitPoint(label: Locator) {
  const target = label.locator('[id^="technique-label-hit-"]').first();
  await target.scrollIntoViewIfNeeded();
  return target.evaluate((node) => {
    const path = node as SVGPathElement;
    const matrix = path.getScreenCTM();
    if (matrix === null) throw Error("Expected technique label transform");
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
    const otherLabelID = await labels.nth(1).getAttribute("id");
    if (otherLabelID === null) throw Error("Expected other label ID");
    if (shortcut !== "v") {
      const boxes = await labels.first().evaluate((node) => {
        const text = node.querySelector<SVGGraphicsElement>(
          '[id^="technique-label-text-"]'
        );
        const target = node.querySelector<SVGGraphicsElement>(
          '[id^="technique-label-hit-text-"]'
        );
        if (text === null || target === null) {
          throw Error("Expected text label and hit target");
        }
        const visible = text.getBBox();
        const hit = target.getBBox();
        return {
          textWidth: visible.width,
          textHeight: visible.height,
          leftPadding: visible.x - hit.x,
          rightPadding: hit.x + hit.width - visible.x - visible.width,
          topPadding: visible.y - hit.y,
          bottomPadding: hit.y + hit.height - visible.y - visible.height,
          textTransform: text.parentElement?.getAttribute("transform"),
          hitTransform: target.getAttribute("transform"),
        };
      });
      expect(boxes.textWidth).toBeGreaterThan(0);
      expect(boxes.textHeight).toBeGreaterThan(0);
      expect(boxes.leftPadding).toBeGreaterThan(0);
      expect(boxes.topPadding).toBeGreaterThan(0);
      expect(boxes.rightPadding).toBeCloseTo(boxes.leftPadding);
      expect(boxes.bottomPadding).toBeCloseTo(boxes.topPadding);
      expect(boxes.hitTransform).toBe(boxes.textTransform);
    }
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
    await expect(labels).toHaveAttribute("id", otherLabelID);
    await expect(editor.locator('[id^="note-text-"]')).toHaveText(
      shortcut === "Shift+L" ? ["5", "7", "(9)"] : ["5", "7", "9"]
    );
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
    await expect(labels).toHaveAttribute("id", otherLabelID);
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
    // Separate the pitch labels horizontally so both receive real pointer input.
    if (fret === "5") await page.keyboard.press("a");
  }
  const labels = editor.locator(".tu-technique-label");
  const bends = editor.locator(".tu-inline-technique");
  await expect(labels).toHaveCount(2);
  await expect(bends).toHaveCount(2);
  await expect(labels.locator('[id^="technique-label-hit-"]')).toHaveCount(0);
  const paths = bends.locator('[id^="technique-path-"]');
  await expect(paths).toHaveCount(4);
  const originalPaths = await paths.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("d"))
  );
  for (const path of originalPaths) expect(path).toMatch(/\d/);
  for (let index = 0; index < 2; index++) {
    const text = labels
      .nth(index)
      .locator('[id^="technique-label-text-"]')
      .first();
    await expect(text).toHaveText("full");
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
    expect(
      await paths.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("d"))
      )
    ).toEqual(originalPaths);
  }
});
