import { expect, test } from "@playwright/test";

test("keeps one mounted notation tree inside its owned root after reconfiguration", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toHaveCount(1);
  for (const placement of ["right", "left", "right"]) {
    await page.locator("#side-panel-placement-select").selectOption(placement);
    await expect(editor).toHaveClass(
      new RegExp(`tu-side-controls-${placement}`)
    );
    for (const selector of [
      ".tu-root-svg",
      ".tu-top-controls-host",
      ".tu-side-controls-host",
    ]) {
      await expect(editor.locator(selector)).toHaveCount(1);
      // A detached shell must not leave another mounted tree elsewhere.
      await expect(page.locator(selector)).toHaveCount(1);
    }
    await editor.locator('[id^="note-rect-"]').first().click();
    await page.keyboard.press("5");
    await expect(editor.locator('[id^="note-text-"]')).toHaveText("5");
    await page.keyboard.press("Backspace");
    await expect(editor.locator('[id^="note-text-"]')).toHaveCount(0);
  }
});
