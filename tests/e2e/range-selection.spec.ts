import { expect, test } from "@playwright/test";

test("announces a mouse range once on release, not during held drag frames", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  const notes = editor.locator('.tu-root-svg [id^="note-rect-"]');
  await notes.first().click();
  const announcement = editor.locator(".tu-announcement-host");
  await expect(announcement).toHaveText(/Bar 1.*Beat 1/);
  const initialText = await announcement.textContent();
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
  await announcement.evaluate((element) => {
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
    (window as any).__tabuiDragAnnouncements = { changes, observer };
  });

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
    await expect(announcement).toHaveText(initialText!);
    expect(
      await page.evaluate(
        () => (window as any).__tabuiDragAnnouncements.changes.mutations
      )
    ).toBe(0);
  }

  await page.mouse.move(1, 1);
  await page.mouse.up();
  const finalText =
    "Track Rhythm track, Staff 1, voice 1, 3 beats selected, " +
    "bar 1 beat 1 to bar 2 beat 2, anchor bar 1 beat 1, active end bar 2 beat 2.";
  await expect(announcement).toHaveText(finalText);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );
  const insertions = await page.evaluate(() => {
    const { changes, observer } = (window as any).__tabuiDragAnnouncements;
    observer.disconnect();
    delete (window as any).__tabuiDragAnnouncements;
    return changes.insertions;
  });
  expect(insertions).toEqual([await announcement.textContent()]);
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
