import { expect, test } from "@playwright/test";

for (const shortcut of ["h", "Shift+H", "s", "l", "b"]) {
  test(`inline ${shortcut}: local hover, removal, and undo`, async ({
    page,
  }) => {
    await page.goto("/tabui/?fixture=empty&theme=obsidian");
    const editor = page.locator("#tabui-editor");
    await editor.locator('[id^="note-rect-"]').first().click();
    await page.keyboard.press("5");
    if (shortcut === "s" || shortcut === "l") {
      await page.keyboard.press("a");
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
    await page.mouse.move(0, 0);
    const originalStroke = await path.evaluate(
      (node) => getComputedStyle(node).stroke
    );
    const originalFill = await path.getAttribute("fill");
    const hitPath = editor.locator('[id^="technique-hit-path-"]').first();
    await expect(hitPath).toHaveAttribute("d", (await path.getAttribute("d"))!);
    await expect(hitPath).toHaveCSS("stroke", "rgba(0, 0, 0, 0)");
    const point = await hitPath.evaluate((node) => {
      const geometry = node as SVGPathElement;
      const matrix = geometry.getScreenCTM()!;
      for (let step = 1; step < 20; step++) {
        const local = geometry.getPointAtLength(
          (geometry.getTotalLength() * step) / 20
        );
        const screen = local.matrixTransform(matrix);
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const x = Math.round(screen.x) + dx;
            const y = Math.round(screen.y) + dy;
            if (document.elementFromPoint(x, y) === geometry) {
              return { x, y };
            }
          }
        }
      }
      throw Error("Expected exposed inline geometry");
    });
    const frets = editor.locator('[id^="note-text-"]');
    const originalFrets = await frets.allTextContents();
    if (shortcut !== "b") {
      const geometry = await path.evaluate((node) => {
        const path = node as SVGPathElement;
        const matrix = path.getScreenCTM()!;
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
            const matrix = rect.getScreenCTM()!;
            const left = new DOMPoint(
              rect.x.baseVal.value,
              rect.y.baseVal.value
            ).matrixTransform(matrix).x;
            const right = new DOMPoint(
              rect.x.baseVal.value + rect.width.baseVal.value,
              rect.y.baseVal.value
            ).matrixTransform(matrix).x;
            return { left, right };
          })
        );
      const source = noteRects[0];
      if (shortcut === "s" || shortcut === "l") {
        const target = noteRects[6];
        expect(geometry.startX).toBeCloseTo(source.right);
        expect(geometry.endX).toBeCloseTo(target.left);
      } else {
        expect(geometry.right).toBeCloseTo(source.left);
      }
    }
    await page.mouse.move(point.x, point.y);
    await expect
      .poll(() => path.evaluate((node) => getComputedStyle(node).stroke))
      .not.toBe(originalStroke);
    await expect(path).toHaveCSS("cursor", "pointer");
    await expect(path).toHaveAttribute("fill", originalFill!);
    await expect(hitPath).toHaveCSS("stroke", "rgba(0, 0, 0, 0)");
    await page.mouse.move(0, 0);
    await expect(path).toHaveCSS("stroke", originalStroke);
    await page.mouse.click(point.x, point.y);
    await expect(editor.locator('[id^="technique-path-"]')).toHaveCount(0);
    await expect(frets).toHaveText(originalFrets);
    await page.keyboard.press("Control+z");
    await expect(path).toBeVisible();
  });
}
