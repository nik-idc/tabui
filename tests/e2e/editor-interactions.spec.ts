import { expect, test } from "@playwright/test";

test("accepts timed keyboard fret input", async ({ page }) => {
  // Load one deterministic editable score.
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  // Click the first note hitbox to give the notation keyboard ownership.
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();

  // Digits entered within the accumulation window form a two-digit fret.
  await page.keyboard.press("1");
  await page.keyboard.press("2");
  await expect(editor.locator('[id^="note-text-"]')).toHaveText(/12/);

  // Waiting past the timeout makes the next digit replace the previous fret.
  await page.waitForTimeout(350);
  await page.keyboard.press("3");
  await expect(editor.locator('[id^="note-text-"]')).toHaveText("3");
});

test("starts and pauses playback from the transport control", async ({
  page,
}) => {
  // Load a score with enough beats for visible cursor animation.
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  // Click the visible transport image and assert its browser-visible state changes.
  await editor.locator('img[alt="Play"]').click();
  await expect(editor.locator('img[alt="Pause"]')).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  // The visible SVG cursor must advance while the player is running.
  const cursor = editor.locator("#playerCursor");
  await expect(cursor).toHaveAttribute("width", "5");
  const cursorXBefore = await cursor.getAttribute("x");
  await expect
    .poll(async () => cursor.getAttribute("x"), { timeout: 1_000 })
    .not.toBe(cursorXBefore);

  // Click the updated transport image to pause playback again.
  await editor.locator('img[alt="Pause"]').click();
  await expect(editor.locator('img[alt="Play"]')).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  await expect(cursor).toHaveAttribute("width", "0");
});

test("starts and pauses playback with Space", async ({ page }) => {
  // Load a score with enough beats for visible cursor animation.
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  // Click notation so the editor owns subsequent keyboard input.
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();

  // Space starts playback through the editor's keyboard handler.
  await page.keyboard.press("Space");
  await expect(editor.locator('img[alt="Pause"]')).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  // The visible SVG cursor must advance while the player is running.
  const cursor = editor.locator("#playerCursor");
  await expect(cursor).toHaveAttribute("width", "5");
  const cursorXBefore = await cursor.getAttribute("x");
  await expect
    .poll(async () => cursor.getAttribute("x"), { timeout: 1_000 })
    .not.toBe(cursorXBefore);

  // A second Space press uses the same keyboard path to pause playback.
  await page.keyboard.press("Space");
  await expect(editor.locator('img[alt="Play"]')).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  await expect(cursor).toHaveAttribute("width", "0");
});
