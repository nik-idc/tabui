import { expect, test } from "@playwright/test";

test("@clipboard native copy and paste transfers a note between pages", async ({
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
  await destinationPage.keyboard.press("Control+z");
  await expect(
    destinationEditor.locator('[id^="note-text-"]').first()
  ).toHaveText("3");
  await destinationPage.keyboard.press("Control+y");
  await expect(
    destinationEditor.locator('[id^="note-text-"]').first()
  ).toHaveText("7");
});
