import { expect, test } from "@playwright/test";

test("anchors, extends, and clears a range through shared transport controls", async ({
  page,
}) => {
  // Load a score with several bars so Next can extend beyond the anchor bar.
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  const announcement = editor.locator(".tu-announcement-host");
  const rangeButton = editor.getByRole("button", { name: "Set anchor" });
  await expect(rangeButton).toBeVisible();

  // Set a one-beat anchor from the editor's current note cursor.
  await rangeButton.click();
  const clearRangeButton = editor.getByRole("button", {
    name: "Clear range",
  });
  await expect(clearRangeButton).toBeVisible();
  const selectionRect = editor.locator('[id^="selection-rect-"]');
  await expect(selectionRect).toHaveCount(1);
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, 1 beat selected, " +
      "bar 1 beat 1 to bar 1 beat 1, anchor bar 1 beat 1, active end bar 1 beat 1."
  );
  const selectionWidthBefore = await selectionRect.getAttribute("width");

  // Clicking another beat extends the stopped range instead of replacing its cursor.
  const noteRects = editor.locator('.tu-root-svg [id^="note-rect-"]');
  const nextBeatIndex = await noteRects.evaluateAll((elements) => {
    const firstX = Number(elements[0]?.getAttribute("x"));
    return elements.findIndex((element) => {
      return Number(element.getAttribute("x")) > firstX;
    });
  });
  expect(nextBeatIndex).toBeGreaterThan(0);
  await noteRects.nth(nextBeatIndex).click();
  const selectionWidthAfterBeat = await selectionRect.getAttribute("width");
  expect(selectionWidthAfterBeat).not.toBe(selectionWidthBefore);
  await expect(announcement).toHaveText(
    /Track Rhythm track, Staff 1, voice 1, \d+ beats selected, bar 1 beat 1 to bar \d+ beat \d+, anchor bar 1 beat 1, active end bar \d+ beat \d+\./
  );

  // Next extends the stopped range from its active endpoint.
  const nextBarButton = editor.getByRole("button", { name: "Next bar" });
  await nextBarButton.click();
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, 4 beats selected, " +
      "bar 1 beat 1 to bar 3 beat 1, anchor bar 1 beat 1, active end bar 3 beat 1."
  );
  await expect
    .poll(async () => selectionRect.getAttribute("width"))
    .not.toBe(selectionWidthBefore);

  // Clear restores the cursor state and makes a new anchor available.
  await clearRangeButton.click();
  await expect(rangeButton).toBeVisible();
  await expect(editor.locator('[id^="selection-rect-"]')).toHaveCount(0);
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, Bar 1, 4/4, 120 BPM, " +
      "Beat 1, whole, String 1, empty."
  );
});

test("announces keyboard ranges across bars and full context after Escape", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  const announcement = editor.locator(".tu-announcement-host");
  await editor.getByRole("link", { name: "Skip to notation" }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Shift+ArrowRight");
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, 2 beats selected, " +
      "bar 1 beat 1 to bar 2 beat 1, anchor bar 1 beat 1, active end bar 2 beat 1."
  );
  await page.keyboard.press("Control+Shift+ArrowRight");
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, 3 beats selected, " +
      "bar 1 beat 1 to bar 2 beat 2, anchor bar 1 beat 1, active end bar 2 beat 2."
  );
  await expect(editor.locator('[id^="selection-rect-"]').first()).toBeVisible();
  await page.keyboard.press("Control+Shift+ArrowLeft");
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, 1 beat selected, " +
      "bar 1 beat 1 to bar 1 beat 1, anchor bar 1 beat 1, active end bar 1 beat 1."
  );
  await page.keyboard.press("Escape");
  await expect(editor.locator('[id^="selection-rect-"]')).toHaveCount(0);
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, Bar 1, 4/4, 120 BPM, " +
      "Beat 1, whole, String 1, empty."
  );
  await page.keyboard.press("ArrowRight");
  await expect(announcement).toHaveText(
    "Bar 2, 4/4, 120 BPM, Voice 1, Beat 1, half, String 1, empty."
  );
});
