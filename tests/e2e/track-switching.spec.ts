import { expect, Locator, Page, test } from "@playwright/test";

async function selectTrack(editor: Locator, trackIndex: number): Promise<void> {
  const trackButtons = editor.locator(".tu-track-select-button");
  await trackButtons.nth(trackIndex).click();
  await expect(trackButtons.nth(trackIndex)).toHaveAttribute(
    "aria-pressed",
    "true"
  );
}

async function getVisibleBarBorderXs(page: Page): Promise<number[]> {
  return page.locator('line[id^="bar-border-"]').evaluateAll((lines) => {
    return lines
      .map((line) => {
        const svgLine = line as SVGGraphicsElement;
        const matrix = svgLine.getCTM();
        return (matrix?.e ?? 0) + Number(svgLine.getAttribute("x1"));
      })
      .sort((a, b) => a - b);
  });
}

test("switches the active track through the track controls", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  await editor.getByRole("button", { name: "Tracks" }).click();
  const trackButtons = editor.locator(".tu-track-select-button");
  await expect(trackButtons).toHaveCount(3);
  await expect(trackButtons.nth(0)).toHaveAttribute("aria-pressed", "true");

  await selectTrack(editor, 1);

  await expect(trackButtons.nth(0)).toHaveAttribute("aria-pressed", "false");
  await expect(editor.locator(".tu-root-svg")).toHaveCount(1);
});

test("keeps visible bar borders aligned across track switches", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();
  await editor.getByRole("button", { name: "Tracks" }).click();

  const firstTrackBorderXs = await getVisibleBarBorderXs(page);
  expect(firstTrackBorderXs.length).toBeGreaterThan(0);

  await selectTrack(editor, 1);
  expect(await getVisibleBarBorderXs(page)).toEqual(firstTrackBorderXs);

  await selectTrack(editor, 2);
  expect(await getVisibleBarBorderXs(page)).toEqual(firstTrackBorderXs);
});

test("restores the original notation after switching away and back", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();
  await editor.getByRole("button", { name: "Tracks" }).click();

  const firstTrackNotes = await editor
    .locator('[id^="note-text-"]')
    .allTextContents();
  await selectTrack(editor, 1);
  const secondTrackNotes = await editor
    .locator('[id^="note-text-"]')
    .allTextContents();
  expect(secondTrackNotes).not.toEqual(firstTrackNotes);

  await selectTrack(editor, 0);
  await expect(editor.locator(".tu-root-svg")).toHaveCount(1);
  await expect(editor.locator("#tu-notation")).toHaveCount(1);
  expect(await editor.locator('[id^="note-text-"]').allTextContents()).toEqual(
    firstTrackNotes
  );
});
