import { expect, test } from "@playwright/test";

test("@clipboard native copy, cut and paste transfer a note between pages", async ({
  context,
}) => {
  const sourcePage = await context.newPage();
  await sourcePage.goto("/tabui/?fixture=empty");
  const destinationPage = await context.newPage();
  await destinationPage.goto("/tabui/?fixture=empty");
  const sourceEditor = sourcePage.locator("#tabui-editor");
  const sourceNote = sourceEditor
    .locator('.tu-root-svg [id^="note-rect-"]')
    .first();
  await sourceNote.click();
  await sourcePage.keyboard.press("7");
  await sourcePage.bringToFront();
  await sourceEditor.locator(".tu-notation-viewport").focus();
  await sourcePage.keyboard.press("Control+c");

  const destinationEditor = destinationPage.locator("#tabui-editor");
  await destinationEditor
    .locator('.tu-root-svg [id^="note-rect-"]')
    .first()
    .click();
  await destinationEditor.locator(".tu-notation-viewport").focus();
  await destinationPage.keyboard.press("3");
  await expect(
    destinationEditor.locator('[id^="note-text-"]').first()
  ).toHaveText("3");
  await destinationPage.bringToFront();
  await destinationEditor.locator(".tu-notation-viewport").focus();
  await destinationPage.keyboard.press("Control+v");

  await expect(
    destinationEditor.locator('[id^="note-text-"]').first()
  ).toHaveText("7");
  await sourcePage.bringToFront();
  await sourceEditor.locator(".tu-notation-viewport").focus();
  await sourcePage.keyboard.press("ArrowDown");
  await sourcePage.keyboard.press("8");
  await sourcePage.keyboard.press("Control+x");
  await expect(sourceEditor.locator('[id^="note-text-"]')).toHaveCount(0);
  await sourcePage.keyboard.press("Control+z");
  await expect(sourceEditor.locator('[id^="note-text-"]').first()).toHaveText(
    "7"
  );
  await sourcePage.keyboard.press("Control+Shift+z");
  await expect(sourceEditor.locator('[id^="note-text-"]')).toHaveCount(0);

  await destinationPage.bringToFront();
  await destinationEditor.locator(".tu-notation-viewport").focus();
  await destinationPage.keyboard.press("Control+z");
  await expect(
    destinationEditor.locator('[id^="note-text-"]').first()
  ).toHaveText("3");
  await destinationPage.keyboard.press("Control+v");
  await expect(
    destinationEditor.locator('[id^="note-text-"]').first()
  ).toHaveText("8");
  await destinationPage.keyboard.press("Control+z");
  await expect(
    destinationEditor.locator('[id^="note-text-"]').first()
  ).toHaveText("3");
  await destinationPage.keyboard.press("Control+y");
  await expect(
    destinationEditor.locator('[id^="note-text-"]').first()
  ).toHaveText("8");
});

test("@clipboard pasting a beat at an empty beat replaces it", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const slots = editor.locator('.tu-root-svg [id^="note-rect-"]');
  const frets = editor.locator('[id^="note-text-"]');
  await slots.first().click();
  for (const key of ["1", "ArrowDown", "3", "ArrowDown", "3"]) {
    await page.keyboard.press(key);
  }
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Control+c");
  await page.keyboard.press("Escape");

  // Moving right adds an empty beat; paste fills it instead of adding a third.
  await page.keyboard.press("ArrowRight");
  await expect(slots).toHaveCount(12);
  await page.keyboard.press("Control+v");
  await expect(frets).toHaveText(["1", "3", "3", "1", "3", "3"]);
  await expect(slots).toHaveCount(12);

  await page.keyboard.press("Control+z");
  await expect(frets).toHaveText(["1", "3", "3"]);
  await expect(slots).toHaveCount(12);
});
