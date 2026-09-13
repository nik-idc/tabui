import { expect, test } from "@playwright/test";

test("accepts timed keyboard fret input", async ({ page }) => {
  // Load one deterministic editable score.
  await page.clock.install();
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
  await page.clock.fastForward(251);
  await page.keyboard.press("3");
  await expect(editor.locator('[id^="note-text-"]')).toHaveText("3");
});

test("announces a fret change but not an unchanged fret DOM write", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const note = editor.locator('.tu-root-svg [id^="note-rect-"]').first();
  await note.click();
  await page.keyboard.press("5");

  const announcement = editor.locator(".tu-announcement-host");
  await expect(announcement).toHaveText(
    /Track .*Staff .*Bar .*Beat .*String 1, fret 5\./
  );
  await announcement.evaluate((element) => {
    const observer = new MutationObserver(() => {});
    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    (window as any).__tabuiAnnouncementObserver = observer;
  });
  await page.clock.fastForward(251);
  await page.keyboard.press("5");
  await page.evaluate(() => Promise.resolve());
  const mutations = await announcement.evaluate((element) => {
    const observer = (window as any)
      .__tabuiAnnouncementObserver as MutationObserver;
    const records = observer.takeRecords().length;
    observer.disconnect();
    delete (window as any).__tabuiAnnouncementObserver;
    return records;
  });

  expect(mutations).toBe(0);
  await expect(editor.locator('[id^="note-text-"]')).toHaveText("5");
});

test("keeps concise arrow announcements after the automatic flush", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  await page.keyboard.press("ArrowRight");

  await expect(editor.locator(".tu-announcement-host")).toHaveText(
    /^Bar 2, 4\/4, 120 BPM\. Voice 1\./
  );
});

test("starts and pauses playback from the transport control", async ({
  page,
}) => {
  // Load a score with enough beats for visible cursor animation.
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  // Click the visible transport image and assert its browser-visible state changes.
  await editor.getByRole("button", { name: "Play" }).click();
  await expect(editor.getByRole("button", { name: "Pause" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  // The visible SVG cursor must advance while the player is running.
  const cursor = editor.locator("#playerCursor");
  await expect(cursor).toHaveAttribute("width", "5");
  const cursorXBefore = await cursor.getAttribute("x");
  await expect
    .poll(async () => cursor.getAttribute("x"), { timeout: 2_000 })
    .not.toBe(cursorXBefore);

  // Click the updated transport image to pause playback again.
  await editor.getByRole("button", { name: "Pause" }).click();
  await expect(editor.getByRole("button", { name: "Play" })).toHaveAttribute(
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
  await expect(editor.getByRole("button", { name: "Pause" })).toHaveAttribute(
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
  await expect(editor.getByRole("button", { name: "Play" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  await expect(cursor).toHaveAttribute("width", "0");
});
