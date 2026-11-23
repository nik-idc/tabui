import { expect, test } from "@playwright/test";
import { requiredBoundingBox } from "./helpers";

test("typing in the score header edits it, not the notation", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const play = editor.getByRole("button", { name: "Play", exact: true });

  // Select a note first, so a leaked digit would set its fret.
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  const artist = editor.getByRole("textbox", { name: "Artist", exact: true });
  await artist.fill("");
  // Digits, Space, and Enter are notation shortcuts outside the header.
  await artist.pressSequentially("Band 7");
  await artist.press("Enter");
  await expect(artist).toHaveValue("Band 7");
  await expect(editor.locator('[id^="note-text-"]')).toHaveCount(0);
  await expect(play).toHaveAttribute("aria-label", "Play");

  const date = editor.getByRole("textbox", {
    name: "Release date",
    exact: true,
  });
  await date.fill("2024-1");
  await expect(date).toHaveAttribute("aria-invalid", "true");
  await date.fill("2024-11");
  await expect(date).not.toHaveAttribute("aria-invalid");
});

test("a long score name wraps inside the notation", async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 800 });
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const title = editor.getByRole("textbox", {
    name: "Score name",
    exact: true,
  });
  const before = await requiredBoundingBox(title);
  await title.fill(
    "A very long score name that cannot fit on one line at this width"
  );

  const viewport = await requiredBoundingBox(
    editor.locator(".tu-notation-viewport")
  );
  await expect
    .poll(async () => (await requiredBoundingBox(title)).height)
    .toBeGreaterThan(before.height * 1.5);
  const after = await requiredBoundingBox(title);
  expect(after.x).toBeGreaterThanOrEqual(viewport.x);
  expect(after.x + after.width).toBeLessThanOrEqual(
    viewport.x + viewport.width
  );
});
