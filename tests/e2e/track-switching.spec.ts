import { expect, Locator, test } from "@playwright/test";

async function selectTrack(editor: Locator, trackIndex: number): Promise<void> {
  const trackButtons = editor.locator(".tu-track-select-button");
  await trackButtons.nth(trackIndex).click();
  await expect(trackButtons.nth(trackIndex)).toHaveAttribute(
    "aria-pressed",
    "true"
  );
}

async function getBarBorderXsByRow(editor: Locator): Promise<number[][]> {
  return editor.locator('line[id^="bar-border-"]').evaluateAll((lines) => {
    const rows = new Map<number, number[]>();
    for (const line of lines) {
      const svgLine = line as SVGLineElement;
      const matrix = svgLine.getScreenCTM();
      if (matrix === null) throw Error("Expected a rendered bar border");
      const point = new DOMPoint(
        svgLine.x1.baseVal.value,
        svgLine.y1.baseVal.value
      ).matrixTransform(matrix);
      const row = rows.get(point.y) ?? [];
      row.push(point.x);
      rows.set(point.y, row);
    }
    // Row heights can differ by instrument; horizontal alignment must not.
    const sortedRows = [...rows.entries()]
      .sort((a, b) => a[0] - b[0])
      .map((r) => r[1].sort((a, b) => a - b));
    // Tracks have different staff counts; compare each distinct horizontal layout.
    return sortedRows.filter(
      (r, i) =>
        i === 0 || JSON.stringify(r) !== JSON.stringify(sortedRows[i - 1])
    );
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
  await expect(trackButtons).toHaveCount(4);
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

  const firstTrackBorderXs = await getBarBorderXsByRow(editor);
  expect(firstTrackBorderXs.length).toBeGreaterThan(0);

  await selectTrack(editor, 1);
  // Shorter single-staff lines can materialize more rows than the rhythm track.
  // Compare the horizontal layouts that were present before switching.
  await expect
    .poll(async () =>
      (await getBarBorderXsByRow(editor)).slice(0, firstTrackBorderXs.length)
    )
    .toEqual(firstTrackBorderXs);

  await selectTrack(editor, 2);
  await expect
    .poll(async () =>
      (await getBarBorderXsByRow(editor)).slice(0, firstTrackBorderXs.length)
    )
    .toEqual(firstTrackBorderXs);
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
  expect(firstTrackNotes.length).toBeGreaterThan(0);
  await selectTrack(editor, 1);
  const secondTrackNotes = await editor
    .locator('[id^="note-text-"]')
    .allTextContents();
  expect(secondTrackNotes.length).toBeGreaterThan(0);
  expect(secondTrackNotes).not.toEqual(firstTrackNotes);

  await selectTrack(editor, 0);
  await expect(editor.locator(".tu-root-svg")).toHaveCount(1);
  await expect(editor.locator("#tu-notation")).toHaveCount(1);
  await expect(editor.locator('[id^="note-text-"]')).toHaveText(
    firstTrackNotes
  );
});
