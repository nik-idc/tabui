import { expect, test } from "@playwright/test";

test("opens an empty score and expands its track list", async ({ page }) => {
  // Load the Vite demo with the deterministic empty-score fixture.
  await page.goto("/tabui/?fixture=empty");

  // Wait for the notation SVG, proving the editor finished mounting.
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  // The list starts closed, so no track row is visible yet.
  await expect(editor.locator(".tu-track-controls")).toHaveCount(0);

  // Click the same Tracks button a browser user clicks.
  await editor.getByRole("button", { name: "Tracks" }).click();

  // The empty fixture has one track, so its row now exists and is visible.
  const trackRow = editor.locator(".tu-track-controls");
  await expect(trackRow).toHaveCount(1);
  await expect(trackRow).toBeVisible();
});
