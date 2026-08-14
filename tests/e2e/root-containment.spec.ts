import { expect, test } from "@playwright/test";

test("keeps one mounted notation tree inside its owned root after reconfiguration", async ({
  page,
}) => {
  // Load the demo's default mounted editor.
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toHaveCount(1);

  // Change a demo configuration control that replaces the mounted editor.
  await page.locator("#side-panel-placement-select").selectOption("right");

  // The host retains one notation tree and one host for each panel type.
  await expect(editor).toHaveClass(/tu-side-controls-right/);
  await expect(editor.locator(".tu-root-svg")).toHaveCount(1);
  await expect(editor.locator(".tu-top-controls-host")).toHaveCount(1);
  await expect(editor.locator(".tu-side-controls-host")).toHaveCount(1);
});
