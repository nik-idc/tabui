import { expect, Locator, test } from "@playwright/test";

/** Captures note content and placement without depending on SVG insertion order. */
async function getRenderedNotes(editor: Locator) {
  return editor.locator('[id^="note-text-"]').evaluateAll((notes) =>
    notes
      .map((n) => {
        const rect = n.getBoundingClientRect();
        return { id: n.id, text: n.textContent, x: rect.x, y: rect.y };
      })
      .sort((a, b) => a.id.localeCompare(b.id))
  );
}

async function selectTrack(editor: Locator, trackIndex: number): Promise<void> {
  const trackRows = editor.locator(".tu-track-controls");
  const row = trackRows.nth(trackIndex);
  if ((await row.getAttribute("aria-current")) !== "true") {
    await row.locator(".tu-track-name-label").click();
  }
  await expect(row).toHaveAttribute("aria-current", "true");
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

  const tracksButton = editor.getByRole("button", { name: /^Tracks ·/ });
  await tracksButton.click();
  await expect(tracksButton).toHaveAccessibleName(
    "Tracks · Rhythm track · 4 tracks"
  );
  await expect(tracksButton).toHaveText("Rhythm track · 4 tracks");
  const trackRows = editor.locator(".tu-track-controls");
  await expect(trackRows).toHaveCount(4);
  await expect(trackRows.nth(0)).toHaveAttribute("aria-current", "true");

  await selectTrack(editor, 1);

  await expect(trackRows.nth(0)).toHaveAttribute("aria-current", "false");
  await expect(editor.locator(".tu-track-controls-overlay")).toBeVisible();
  await expect(editor.locator(".tu-root-svg")).toHaveCount(1);
});

test("keeps the open track list after outside click and Escape", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();
  const tracksButton = editor.getByRole("button", {
    name: /^Tracks ·/,
  });

  await tracksButton.click();
  await expect(editor.locator(".tu-track-controls-overlay")).toBeVisible();
  await editor
    .getByRole("slider", { name: "Master volume", exact: true })
    .click();
  await expect(editor.locator(".tu-track-controls-overlay")).toBeVisible();

  const trackNameInput = editor
    .locator(".tu-track-controls-overlay .tu-track-name-input")
    .first();
  await trackNameInput.focus();
  await expect(trackNameInput).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(editor.locator(".tu-track-controls-overlay")).toBeVisible();
  await tracksButton.click();
  await expect(editor.locator(".tu-track-controls-overlay")).toBeHidden();
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

  const firstTrackNotes = await getRenderedNotes(editor);
  expect(firstTrackNotes.length).toBeGreaterThan(0);
  await selectTrack(editor, 1);
  const secondTrackNotes = await getRenderedNotes(editor);
  expect(secondTrackNotes.length).toBeGreaterThan(0);
  expect(secondTrackNotes).not.toEqual(firstTrackNotes);

  await selectTrack(editor, 0);
  await expect(editor.locator(".tu-root-svg")).toHaveCount(1);
  await expect(editor.locator("#tu-notation")).toHaveCount(1);
  await expect.poll(() => getRenderedNotes(editor)).toEqual(firstTrackNotes);
});
