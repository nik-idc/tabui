import { expect, test, type Page } from "@playwright/test";

/** Loads the empty fixture and gives the notation keyboard focus. */
async function openEditor(page: Page) {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  return editor;
}

test("Undo and Redo buttons step through history and show when they can act", async ({
  page,
}) => {
  const editor = await openEditor(page);
  const frets = editor.locator('[id^="note-text-"]');
  const undo = editor.getByRole("button", { name: "Undo" });
  const redo = editor.getByRole("button", { name: "Redo" });
  await expect(undo).toBeDisabled();

  await page.keyboard.press("5");
  await expect(undo).toBeEnabled();
  await expect(redo).toBeDisabled();
  await undo.click();
  await expect(frets).toHaveCount(0);
  await expect(redo).toBeEnabled();
  await redo.click();
  await expect(frets).toHaveText(["5"]);
});

test("Select all button selects the voice like Ctrl+A", async ({ page }) => {
  const editor = await openEditor(page);
  const status = editor.locator(".tu-announcement-host");
  await page.keyboard.press("5");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("7");

  await editor.getByRole("button", { name: "Select all" }).click();
  await expect(status).toContainText("2 beats selected");
});

test("@clipboard Copy, Cut, and Paste buttons move beats", async ({
  page,
  context,
  browserName,
}) => {
  // Playwright can grant clipboard permissions only in Chromium.
  test.skip(browserName !== "chromium", "Needs clipboard permissions");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const editor = await openEditor(page);
  const frets = editor.locator('[id^="note-text-"]');
  const selectAll = editor.getByRole("button", { name: "Select all" });
  await page.keyboard.press("5");

  // Copy the only beat, then paste it after itself.
  await selectAll.click();
  await editor.getByRole("button", { name: "Copy" }).click();
  await page.keyboard.press("Escape");
  await editor.getByRole("button", { name: "Paste" }).click();
  await expect(frets).toHaveText(["5", "5"]);

  // Cut removes the selected beats; Paste puts them back.
  await selectAll.click();
  await editor.getByRole("button", { name: "Cut" }).click();
  await expect(frets).toHaveCount(0);
  await editor.getByRole("button", { name: "Paste" }).click();
  await expect(frets).toHaveText(["5", "5"]);
});

test("Tie back button matches Shift+J", async ({ page }) => {
  const editor = await openEditor(page);
  const button = editor.getByRole("button", {
    name: "Tie as far back as possible",
  });
  // The tie hides the continuation's fret, so the Tie button's pressed
  // state shows the result.
  const tie = editor.getByRole("button", { name: "Tie", exact: true });
  await page.keyboard.press("5");
  // Three empty beats (not rests) after the 5; a tie cannot cross rests.
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("1");
    await page.keyboard.press("Backspace");
  }
  // Plain Tie needs a note in the previous beat, so only Tie back can act.
  await expect(tie).toBeDisabled();

  await page.keyboard.press("Shift+j");
  await expect(tie).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Control+z");
  await expect(tie).toHaveAttribute("aria-pressed", "false");

  await button.click();
  await expect(tie).toHaveAttribute("aria-pressed", "true");
});

test("view-only mode keeps Select all and Copy and hides the editing buttons", async ({
  page,
}) => {
  const editor = await openEditor(page);
  await page.setViewportSize({ width: 580, height: 900 });
  await expect(editor).toHaveClass(/tu-responsive-view-only/);

  for (const name of ["Set selection anchor", "Select all", "Copy"]) {
    await expect(editor.getByRole("button", { name })).toBeVisible();
  }
  for (const name of ["Undo", "Redo", "Cut", "Paste"]) {
    await expect(editor.getByRole("button", { name })).toBeHidden();
  }
});
