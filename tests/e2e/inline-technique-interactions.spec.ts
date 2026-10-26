import { expect, test } from "@playwright/test";

for (const shortcut of ["h", "Shift+H", "s", "l", "b"]) {
  test(`inline ${shortcut}: renders without intercepting pointer input`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/tabui/?fixture=empty&theme=obsidian");
    const editor = page.locator("#tabui-editor");
    await editor.locator('[id^="note-rect-"]').first().click();
    await page.keyboard.press("5");
    if (shortcut === "s" || shortcut === "l") {
      await page.keyboard.press("a");
      await page.clock.fastForward(251);
      await page.keyboard.press("7");
      await page.keyboard.press("ArrowLeft");
    }
    await page.keyboard.press(shortcut);
    if (shortcut === "b") {
      await editor
        .getByRole("dialog", { name: "Bend", exact: true })
        .getByRole("button", { name: "Confirm" })
        .click();
    }
    const path = editor.locator('[id^="technique-path-"]').first();
    await expect(path).toBeVisible();
    await path.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const originalStroke = await path.evaluate(
      (node) => getComputedStyle(node).stroke
    );
    const originalFill = await path.getAttribute("fill");
    const pathData = await path.getAttribute("d");
    if (!pathData) {
      throw Error("Expected technique path data");
    }
    await expect(editor.locator('[id^="technique-hit-path-"]')).toHaveCount(0);
    const point = await path.evaluate((node) => {
      const geometry = node as SVGPathElement;
      const matrix = geometry.getScreenCTM();
      if (matrix === null) {
        throw Error("Expected inline geometry transform");
      }
      const point = geometry
        .getPointAtLength(geometry.getTotalLength() / 2)
        .matrixTransform(matrix);
      const target = document.elementFromPoint(point.x, point.y);
      return {
        x: point.x,
        y: point.y,
        intercepted: Boolean(target?.closest(".tu-inline-technique")),
      };
    });
    expect(point.intercepted).toBe(false);
    const frets = editor.locator('[id^="note-text-"]');
    const originalFrets = await frets.allTextContents();
    expect(originalFrets).toEqual(
      shortcut === "s" || shortcut === "l" ? ["5", "7"] : ["5"]
    );
    if (shortcut !== "b") {
      const geometry = await path.evaluate((node) => {
        const path = node as SVGPathElement;
        const matrix = path.getScreenCTM();
        if (matrix === null) {
          throw Error("Expected technique path transform");
        }
        const start = path.getPointAtLength(0).matrixTransform(matrix);
        const end = path
          .getPointAtLength(path.getTotalLength())
          .matrixTransform(matrix);
        const bounds = path.getBBox();
        const right = new DOMPoint(
          bounds.x + bounds.width,
          bounds.y
        ).matrixTransform(matrix).x;
        return { startX: start.x, endX: end.x, right };
      });
      const noteRects = await editor
        .locator('[id^="note-rect-"]')
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const rect = node as SVGRectElement;
            const matrix = rect.getScreenCTM();
            if (matrix === null) {
              throw Error("Expected note rectangle transform");
            }
            const left = new DOMPoint(
              rect.x.baseVal.value,
              rect.y.baseVal.value
            ).matrixTransform(matrix).x;
            const right = new DOMPoint(
              rect.x.baseVal.value + rect.width.baseVal.value,
              rect.y.baseVal.value
            ).matrixTransform(matrix).x;
            const fret =
              rect.parentElement?.querySelector(
                '[id^="note-text-"]'
              )?.textContent;
            return { left, right, fret };
          })
        );
      const source = noteRects.find((v) => v.fret === "5");
      if (source === undefined) {
        throw Error("Expected source fret geometry");
      }
      if (shortcut === "s" || shortcut === "l") {
        const target = noteRects.find((v) => v.fret === "7");
        if (target === undefined) {
          throw Error("Expected target fret geometry");
        }
        expect(geometry.startX).toBeCloseTo(source.right);
        expect(geometry.endX).toBeCloseTo(target.left);
      } else {
        expect(geometry.right).toBeCloseTo(source.left);
      }
    }
    await page.mouse.move(point.x, point.y);
    await expect(path).toHaveCSS("stroke", originalStroke);
    await expect(path).toHaveCSS("pointer-events", "none");
    if (originalFill === null) {
      throw Error("Expected original technique fill");
    }
    await expect(path).toHaveAttribute("fill", originalFill);
    await page.mouse.move(0, 0);
    await expect(path).toHaveCSS("stroke", originalStroke);
    await page.mouse.click(point.x, point.y);
    await expect(path).toBeVisible();
    await expect(path).toHaveAttribute("d", pathData);
    await expect(frets).toHaveText(originalFrets);
  });
}

for (const shortcut of ["v", "p", "Shift+L", "b"]) {
  test(`label ${shortcut}: ignores pointer input`, async ({ page }) => {
    await page.goto("/tabui/?fixture=empty&theme=obsidian");
    const editor = page.locator("#tabui-editor");
    await editor.locator('[id^="note-rect-"]').first().click();
    await page.keyboard.press("5");
    await page.keyboard.press(shortcut);
    if (shortcut === "b") {
      await editor
        .getByRole("dialog", { name: "Bend", exact: true })
        .getByRole("button", { name: "Confirm" })
        .click();
    }
    const label = editor.locator(".tu-technique-label").first();
    await expect(label).toBeVisible();
    await expect(label).toHaveCSS("pointer-events", "none");
    await expect(editor.locator('[id^="technique-label-hit-"]')).toHaveCount(0);
    await label.scrollIntoViewIfNeeded();
    const visible = label.locator("path, text").first();
    const originalStyle = await visible.evaluate((node) => {
      const style = getComputedStyle(node);
      return { fill: style.fill, stroke: style.stroke };
    });
    const box = await visible.boundingBox();
    if (box === null) {
      throw Error("Expected visible technique label");
    }
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await page.mouse.move(point.x, point.y);
    await expect(visible).toHaveCSS("fill", originalStyle.fill);
    await expect(visible).toHaveCSS("stroke", originalStyle.stroke);
    await page.mouse.click(point.x, point.y);
    await expect(label).toBeVisible();
    await expect(editor.locator('[id^="note-text-"]')).toHaveText(["5"]);
    // Removing a technique still works through the keyboard, not its label.
    await editor.locator('[id^="note-rect-"]').first().click();
    await page.keyboard.press("Control+z");
    await expect(label).toHaveCount(0);
  });
}
