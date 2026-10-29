import { expect, Locator, test } from "@playwright/test";

/** Measures the full selected width, including ranges that wrap across lines. */
async function getSelectionWidth(rectangles: Locator): Promise<number> {
  return rectangles.evaluateAll((r) =>
    r.reduce((sum, rectangle) => {
      return sum + Number(rectangle.getAttribute("width"));
    }, 0)
  );
}

test("announces a mouse range once on release, not during held drag frames", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  const notes = editor.locator('.tu-root-svg [id^="note-rect-"]');
  await notes.first().click();
  const announcement = editor.locator(".tu-announcement-host");
  await expect(announcement).toHaveText(/Bar 1.*Beat 1/);
  await expect(announcement).toHaveAttribute("aria-live", "polite");
  await expect(announcement).toHaveAttribute("aria-atomic", "true");
  const initialText = await announcement.textContent();
  if (initialText === null)
    throw Error("Expected initial selection announcement");
  const points = await notes.evaluateAll((elements) => {
    const first = elements[0].getBoundingClientRect();
    const seen = new Set<number>();
    return elements
      .flatMap((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.y !== first.y || seen.has(rect.x)) return [];
        seen.add(rect.x);
        return [{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }];
      })
      .slice(0, 3);
  });
  expect(points).toHaveLength(3);
  const observation = await announcement.evaluateHandle((element) => {
    const changes = { mutations: 0, insertions: [] as string[] };
    const observer = new MutationObserver((records) => {
      changes.mutations += records.length;
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.textContent) changes.insertions.push(node.textContent);
        }
      }
    });
    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return { changes, observer };
  });

  try {
    await page.mouse.move(points[0].x, points[0].y);
    await page.mouse.down();
    let previousWidth: string | null = null;
    for (const point of points.slice(1)) {
      await page.mouse.move(point.x, point.y);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          })
      );
      const selection = editor.locator('[id^="selection-rect-"]').first();
      await expect(selection).toBeVisible();
      const width = await selection.getAttribute("width");
      expect(width).not.toBe(previousWidth);
      previousWidth = width;
      await expect(announcement).toHaveText(initialText);
      expect(
        await observation.evaluate((state) => state.changes.mutations)
      ).toBe(0);
    }

    // Leave the editor without changing the horizontal selection endpoint.
    await page.mouse.move(points[2].x, 1);
    await page.mouse.up();
    const finalText =
      "Track Rhythm track, Staff 1, voice 1, 3 beats selected, " +
      "bar 1 beat 1 to bar 1 beat 3, anchor bar 1 beat 1, active end bar 1 beat 3.";
    await expect(announcement).toHaveText(finalText);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        })
    );
    const insertions = await observation.evaluate(
      (state) => state.changes.insertions
    );
    expect(insertions).toEqual([finalText]);
  } finally {
    await observation.evaluate((state) => state.observer.disconnect());
    await observation.dispose();
  }
});

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
  const selectionWidthBefore = await getSelectionWidth(selectionRect);
  expect(selectionWidthBefore).toBeGreaterThan(0);

  // Bar wrappers contain sibling bar, beat, and note renderer groups.
  // The first staff starts with four quarters, then two eighths and three quarters.
  const bars = editor.locator('.tu-root-svg g[id^="bar-"]');
  const firstBar = bars.nth(0).locator("xpath=../..");
  const secondBar = bars.nth(1).locator("xpath=../..");
  const beatGroups = 'g[id^="beat-"]:not([id^="beat-rhythm-"])';
  await expect(firstBar.locator(beatGroups)).toHaveCount(4);
  const secondBarBeats = secondBar.locator(beatGroups);
  await expect(secondBarBeats).toHaveCount(5);
  const firstBeatId = await secondBarBeats.first().getAttribute("id");
  if (firstBeatId === null) {
    throw Error("Expected the second bar's first beat ID");
  }
  const beatUUID = firstBeatId.slice("beat-".length);
  const nextBeatNote = secondBar.locator(
    `[id="note-rect-note-slot:${beatUUID}:1"]`
  );
  await expect(nextBeatNote).toHaveCount(1);
  await nextBeatNote.click();
  const selectionWidthAfterBeat = await getSelectionWidth(selectionRect);
  expect(selectionWidthAfterBeat).toBeGreaterThan(selectionWidthBefore);
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, 5 beats selected, " +
      "bar 1 beat 1 to bar 2 beat 1, anchor bar 1 beat 1, active end bar 2 beat 1."
  );

  // Next extends the stopped range from its active endpoint.
  const nextBarButton = editor.getByRole("button", { name: "Next bar" });
  await nextBarButton.click();
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, 10 beats selected, " +
      "bar 1 beat 1 to bar 3 beat 1, anchor bar 1 beat 1, active end bar 3 beat 1."
  );
  await expect
    .poll(() => getSelectionWidth(selectionRect))
    .toBeGreaterThan(selectionWidthAfterBeat);

  // Clear restores the cursor state and makes a new anchor available.
  await clearRangeButton.click();
  await expect(rangeButton).toBeVisible();
  await expect(editor.locator('[id^="selection-rect-"]')).toHaveCount(0);
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, Bar 1, 4/4, 120 BPM, " +
      "Beat 1, quarter, String 1, empty."
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
    "Track Rhythm track, Staff 1, voice 1, 1 beat selected, " +
      "bar 1 beat 1 to bar 1 beat 1, anchor bar 1 beat 1, active end bar 1 beat 1."
  );
  await page.keyboard.press("Shift+ArrowRight");
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, 2 beats selected, " +
      "bar 1 beat 1 to bar 1 beat 2, anchor bar 1 beat 1, active end bar 1 beat 2."
  );
  await page.keyboard.press("Control+Shift+ArrowRight");
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, 4 beats selected, " +
      "bar 1 beat 1 to bar 1 beat 4, anchor bar 1 beat 1, active end bar 1 beat 4."
  );
  await page.keyboard.press("Control+Shift+ArrowRight");
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, 9 beats selected, " +
      "bar 1 beat 1 to bar 2 beat 5, anchor bar 1 beat 1, active end bar 2 beat 5."
  );
  await expect(editor.locator('[id^="selection-rect-"]').first()).toBeVisible();
  await page.keyboard.press("Control+Shift+ArrowLeft");
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, 4 beats selected, " +
      "bar 1 beat 1 to bar 1 beat 4, anchor bar 1 beat 1, active end bar 1 beat 4."
  );
  await page.keyboard.press("Control+Shift+ArrowLeft");
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, 1 beat selected, " +
      "bar 1 beat 1 to bar 1 beat 1, anchor bar 1 beat 1, active end bar 1 beat 1."
  );
  await page.keyboard.press("Escape");
  await expect(editor.locator('[id^="selection-rect-"]')).toHaveCount(0);
  await expect(announcement).toHaveText(
    "Track Rhythm track, Staff 1, voice 1, Bar 1, 4/4, 120 BPM, " +
      "Beat 1, quarter, String 1, empty."
  );
  await page.keyboard.press("ArrowRight");
  await expect(announcement).toHaveText("Beat 2, quarter, String 1, empty.");
});
