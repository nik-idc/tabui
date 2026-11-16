import { expect, test, type Page } from "@playwright/test";

/** Loads the empty fixture and gives the notation keyboard focus. */
async function openEditor(page: Page) {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  return editor;
}

/** Each staff of the empty fixture's 6-string guitar has 6 note slots. */
const SLOTS_PER_STAFF = 6;

test("Alt shortcuts add, move between, and remove staves with undo", async ({
  page,
}) => {
  const editor = await openEditor(page);
  const slots = editor.locator('.tu-root-svg [id^="note-rect-"]');
  const status = editor.locator(".tu-announcement-host");
  await expect(slots).toHaveCount(SLOTS_PER_STAFF);

  await page.keyboard.press("Alt+n");
  await expect(slots).toHaveCount(SLOTS_PER_STAFF * 2);
  await expect(status).toContainText("Staff 2");

  await page.keyboard.press("Alt+ArrowUp");
  await expect(status).toContainText("Staff 1");
  await page.keyboard.press("Alt+ArrowDown");
  await expect(status).toContainText("Staff 2");

  await page.keyboard.press("Alt+Delete");
  await expect(slots).toHaveCount(SLOTS_PER_STAFF);
  await page.keyboard.press("Control+z");
  await expect(slots).toHaveCount(SLOTS_PER_STAFF * 2);
  await page.keyboard.press("Control+z");
  await expect(slots).toHaveCount(SLOTS_PER_STAFF);
});

test("staff buttons match the shortcuts and respect the limits", async ({
  page,
}) => {
  const editor = await openEditor(page);
  const slots = editor.locator('.tu-root-svg [id^="note-rect-"]');
  const add = editor.getByRole("button", { name: "Add staff below" });
  const remove = editor.getByRole("button", { name: "Remove staff" });

  await expect(remove).toBeDisabled();
  for (let count = 2; count <= 4; count++) {
    await add.click();
    await expect(slots).toHaveCount(SLOTS_PER_STAFF * count);
  }
  await expect(add).toBeDisabled();
  await expect(remove).toBeEnabled();

  await remove.click();
  await expect(slots).toHaveCount(SLOTS_PER_STAFF * 3);
  await expect(add).toBeEnabled();
});

test("the new-track dialog creates the chosen number of staves", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.getByRole("button", { name: "New track" }).click();
  const dialog = editor.getByRole("dialog", { name: "New track" });
  const decrease = dialog.getByRole("button", {
    name: "Decrease staff count by 1",
  });
  const increase = dialog.getByRole("button", {
    name: "Increase staff count by 1",
  });

  await expect(decrease).toBeDisabled();
  for (let i = 0; i < 3; i++) {
    await increase.click();
  }
  await expect(dialog.locator(".tu-nt-staff-count-value")).toHaveText(
    "Staves: 4"
  );
  await expect(increase).toBeDisabled();
  await decrease.click();
  await expect(dialog.locator(".tu-nt-staff-count-value")).toHaveText(
    "Staves: 3"
  );

  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(editor.locator('.tu-root-svg [id^="note-rect-"]')).toHaveCount(
    SLOTS_PER_STAFF * 3
  );
});
