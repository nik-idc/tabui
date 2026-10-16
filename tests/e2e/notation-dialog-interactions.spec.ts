import { expect, test, type Page } from "@playwright/test";

test("time signature hover and click use the clicked bar", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.locator('[id^="note-rect-"]').first().click();
  await page.keyboard.press("Shift+I");
  await editor.locator('[id^="note-rect-"]').last().click();
  const group = editor.locator(".tu-time-signature").first();
  const text = group.locator('[id^="bar-sig-"]').first();
  const id = await text.getAttribute("id");
  const clickedText = editor.locator(`[id="${id}"]`);
  const original = await text.evaluate((node) => getComputedStyle(node).fill);

  await text.hover();
  await expect(text).not.toHaveCSS("fill", original);
  await page.mouse.move(0, 0);
  await expect(text).toHaveCSS("fill", original);
  await text.click();

  const dialog = editor.getByRole("dialog", { name: "Time signature" });
  await expect(dialog.locator(".tu-number-stepper-value").first()).toHaveText(
    "4"
  );
  await dialog
    .getByRole("button", { name: "Increase beats per measure by 1" })
    .click();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(clickedText).toHaveText("5");
  await expect(editor.locator(".tu-time-signature")).toHaveCount(2);
  await page.keyboard.press("Control+z");
  await expect(clickedText).toHaveText("4");
});

test("tempo hover and click use the clicked bar value", async ({ page }) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  const tempos = editor.locator(".tu-tempo");
  const first = tempos.first();
  const image = first.locator('[id^="tempo-img-"]');
  const text = first.locator('[id^="tempo-text-"]');
  const original = await text.evaluate((node) => getComputedStyle(node).fill);

  await image.hover();
  await expect(text).not.toHaveCSS("fill", original);
  await page.mouse.move(0, 0);
  await expect(text).toHaveCSS("fill", original);
  await image.click();
  const dialog = editor.getByRole("dialog", { name: "Tempo" });
  await expect(dialog.locator(".tu-number-stepper-value")).toHaveText("120");
  await dialog.getByRole("button", { name: "Increase tempo by 1 BPM" }).click();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(text).toHaveText("=121");

  await tempos.nth(1).locator('[id^="tempo-img-"]').click();
  await expect(
    editor
      .getByRole("dialog", { name: "Tempo" })
      .locator(".tu-number-stepper-value")
  ).toHaveText("120");
  await editor
    .getByRole("dialog", { name: "Tempo" })
    .getByRole("button", {
      name: "Cancel",
    })
    .click();
  await page.keyboard.press("Control+z");
  await expect(text).toHaveText("=120");
});

async function addTuplet(page: Page, complete: boolean) {
  const editor = page.locator("#tabui-editor");
  const firstNote = editor.locator('[id^="note-rect-"]').first();
  await firstNote.click();
  await page.keyboard.press("5");
  if (complete) {
    const gap = editor.locator("[data-bar-end-gap-uuid]");
    await gap.click();
    await gap.click();
    await firstNote.click();
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
  }
  await page.keyboard.press("Shift+T");
  const dialog = editor.getByRole("dialog", { name: "Tuplet" });
  await dialog.getByRole("button", { name: "Confirm" }).click();
}

test("complete tuplet click selects all beats and opens its existing dialog", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  await addTuplet(page, true);
  const editor = page.locator("#tabui-editor");
  const label = editor.locator('[id^="tuplet-complete-text-"]').first();
  const original = await label.evaluate((node) => getComputedStyle(node).fill);
  await label.hover();
  await expect(label).not.toHaveCSS("fill", original);
  await label.click();
  const dialog = editor.getByRole("dialog", { name: "Tuplet" });
  await expect(dialog.locator(".tu-number-stepper-value").first()).toHaveText(
    "3"
  );
  await dialog
    .getByRole("button", { name: "Increase normal notes by 1" })
    .click();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(editor.locator('[id^="tuplet-incomplete-text-"]')).toHaveText([
    "4:2",
    "4:2",
    "4:2",
  ]);
  await page.keyboard.press("Control+z");
  await expect(editor.locator('[id^="tuplet-complete-text-"]')).toHaveText("3");
});

test("incomplete tuplet label opens only its beat context", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  await addTuplet(page, false);
  const editor = page.locator("#tabui-editor");
  const labels = editor.locator('[id^="tuplet-incomplete-text-"]');
  await expect(labels).toHaveCount(1);
  const original = await labels
    .first()
    .evaluate((node) => getComputedStyle(node).fill);
  await labels.first().hover();
  await expect(labels.first()).not.toHaveCSS("fill", original);
  await page.mouse.move(0, 0);
  await expect(labels.first()).toHaveCSS("fill", original);
  await labels.first().click();
  const dialog = editor.getByRole("dialog", { name: "Tuplet" });
  await expect(dialog.locator(".tu-number-stepper-value").first()).toHaveText(
    "3"
  );
  await dialog
    .getByRole("button", { name: "Increase normal notes by 1" })
    .click();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(editor.locator('[id^="tuplet-incomplete-text-"]')).toHaveText(
    "4:2"
  );
});

test("notation clicks do not open dialogs in view-only mode or playback", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase&mode=view-only");
  const editor = page.locator("#tabui-editor");
  await editor.locator('[id^="tempo-img-"]').first().click();
  await expect(editor.getByRole("dialog")).toHaveCount(0);

  await page.goto("/tabui/?fixture=empty");
  const tempo = editor.locator('[id^="tempo-img-"]').first();
  await editor.getByRole("button", { name: "Play" }).click();
  await tempo.click();
  await expect(editor.getByRole("dialog")).toHaveCount(0);
  await editor.getByRole("button", { name: "Pause" }).click();
});
