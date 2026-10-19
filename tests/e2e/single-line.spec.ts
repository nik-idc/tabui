import { expect, Locator, Page, test } from "@playwright/test";

async function barBorderIds(editor: Locator): Promise<string[]> {
  return editor
    .locator('line[id^="bar-border-"]')
    .evaluateAll((lines) => lines.map((line) => line.id).sort());
}

async function barBorderXs(page: Page): Promise<number[]> {
  return page.locator('line[id^="bar-border-"]').evaluateAll((lines) => {
    const positions = lines
      .map((line) => {
        return Math.round(line.getBoundingClientRect().x * 100) / 100;
      })
      .sort((a, b) => a - b);
    // Each staff repeats the same bar borders at a different height.
    return [...new Set(positions)];
  });
}

async function selectTrack(editor: Locator, index: number): Promise<void> {
  await editor.getByRole("button", { name: "Tracks" }).click();
  const buttons = editor.locator(".tu-track-select-button");
  await buttons.nth(index).click();
  await expect(buttons.nth(index)).toHaveAttribute("aria-pressed", "true");
}

type BarExtent = { left: number; right: number };

async function renderedBarExtents(editor: Locator): Promise<BarExtent[]> {
  return editor.locator('g[id^="bar-"]').evaluateAll((groups) => {
    const extents = new Map<number, number>();
    for (const group of groups) {
      const rightBorder = group.querySelector(
        'line[id^="bar-border-"][id$="-1"]'
      );
      if (!(rightBorder instanceof SVGGraphicsElement)) {
        continue;
      }
      const matrix = rightBorder.getCTM();
      if (matrix === null) {
        continue;
      }
      const left = Math.round(matrix.e * 1000) / 1000;
      const right = left + Number(rightBorder.getAttribute("x1"));
      extents.set(left, Math.max(extents.get(left) ?? left, right));
    }
    return [...extents]
      .map(([left, right]) => ({ left, right }))
      .sort((a, b) => a.left - b.left);
  });
}

async function renderedBarContentExtents(
  editor: Locator
): Promise<BarExtent[]> {
  return editor.locator('g[id^="bar-"]').evaluateAll((groups) => {
    const extents = new Map<number, number>();
    for (const group of groups) {
      const wrapper = group.parentElement?.parentElement;
      if (!(wrapper instanceof SVGGraphicsElement)) {
        continue;
      }
      const matrix = wrapper.getCTM();
      if (matrix === null) {
        continue;
      }
      const bounds = wrapper.getBBox();
      const left = Math.round(matrix.e * 1000) / 1000;
      const right = left + bounds.x + bounds.width;
      extents.set(left, Math.max(extents.get(left) ?? left, right));
    }
    return [...extents]
      .map(([left, right]) => ({ left, right }))
      .sort((a, b) => a.left - b.left);
  });
}

test("scrolls one notation line and materializes horizontal bar ranges", async ({
  page,
}) => {
  // Keep three bars beyond the viewport even with the showcase's lighter notation.
  await page.setViewportSize({ width: 800, height: 720 });
  await page.goto("/tabui/?fixture=feature_showcase&layoutMode=single-line");
  const editor = page.locator("#tabui-editor");
  const viewport = editor.locator(".tu-notation-viewport");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  const dimensions = await viewport.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
  expect(await editor.locator("#tu-notation > g").count()).toBe(1);
  const initialIds = await barBorderIds(editor);
  expect(initialIds.length).toBeGreaterThan(0);
  const initialBars = await viewport.evaluate((element) => {
    const viewportLeft =
      element.getBoundingClientRect().left + element.clientLeft;
    const borders = [
      ...element.querySelectorAll('line[id^="bar-border-"][id$="-1"]'),
    ]
      .map((e) => ({
        id: e.id,
        right:
          e.getBoundingClientRect().right - viewportLeft + element.scrollLeft,
      }))
      .sort((a, b) => a.right - b.right);
    // Staves share bar positions. Keep one border per horizontal bar.
    return borders.filter(
      (b, i) => i === 0 || b.right > borders[i - 1].right + 1
    );
  });
  expect(initialBars.length).toBeGreaterThanOrEqual(3);

  await viewport.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect
    .poll(() => viewport.evaluate((e) => e.scrollLeft))
    // Three complete bars must be behind the viewport, beyond two-bar overscan.
    .toBeGreaterThan(initialBars[2].right + 1);
  await expect
    .poll(async () => (await barBorderIds(editor)).join(":"))
    .not.toBe(initialIds.join(":"));
  await expect
    .poll(() => barBorderIds(editor))
    .not.toContain(initialBars[0].id);
  expect((await barBorderIds(editor)).length).toBeGreaterThan(0);

  await viewport.evaluate((element) => {
    element.scrollLeft = 0;
  });
  await expect.poll(() => barBorderIds(editor)).toEqual(initialIds);

  expect(await editor.locator(".tu-root-svg").count()).toBe(1);
  expect(await editor.locator("#tu-notation").count()).toBe(1);
  expect(await editor.locator("#tu-notation > g").count()).toBe(1);
});

test("keeps single-line bar borders aligned when switching tracks", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase&layoutMode=single-line");
  const editor = page.locator("#tabui-editor");
  const viewport = editor.locator(".tu-notation-viewport");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();
  const initialXs = await barBorderXs(page);
  await viewport.evaluate((element) => {
    element.scrollLeft = element.scrollWidth / 2;
  });
  await expect
    .poll(() => viewport.evaluate((e) => e.scrollLeft))
    .toBeGreaterThan(0);
  await expect.poll(() => barBorderXs(page)).not.toEqual(initialXs);
  const firstTrackXs = await barBorderXs(page);
  expect(firstTrackXs.length).toBeGreaterThan(2);

  await selectTrack(editor, 1);

  await expect.poll(() => barBorderXs(page)).toEqual(firstTrackXs);
  expect(await editor.locator(".tu-root-svg").count()).toBe(1);
  expect(await editor.locator("#tu-notation > g").count()).toBe(1);
});

test("follows an offscreen selected bar in single-line mode", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase&layoutMode=single-line");
  const editor = page.locator("#tabui-editor");
  const viewport = editor.locator(".tu-notation-viewport");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();
  expect(await viewport.evaluate((e) => e.scrollLeft)).toBe(0);

  await editor.getByRole("button", { name: "Last bar" }).click();

  await expect
    .poll(() => viewport.evaluate((e) => e.scrollLeft))
    .toBeGreaterThan(0);
  await expect(editor.locator("#tu-selection rect")).toBeVisible();
  // Scroll offsets are rounded to CSS pixels; allow at most one pixel of error.
  await expect
    .poll(() =>
      viewport.evaluate((element) => {
        const selection = element.querySelector("#tu-selection rect");
        if (selection === null) throw Error("Expected selection rectangle");
        const bounds = selection.getBoundingClientRect();
        const left = element.getBoundingClientRect().left + element.clientLeft;
        const right = left + element.clientWidth;
        return Math.max(0, left - bounds.left, bounds.right - right);
      })
    )
    .toBeLessThanOrEqual(1);
});

test("follows playback to an offscreen bar in single-line mode", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase&layoutMode=single-line");
  const editor = page.locator("#tabui-editor");
  const viewport = editor.locator(".tu-notation-viewport");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();
  expect(await viewport.evaluate((e) => e.scrollLeft)).toBe(0);

  await editor.getByRole("button", { name: "Play" }).click();
  await expect(editor.getByRole("button", { name: "Pause" })).toBeVisible();
  // Capture and pause in the same browser frame, before the short final bar ends.
  const followed = await editor.evaluate(async (element) => {
    const scroller = element.querySelector<HTMLElement>(
      ".tu-notation-viewport"
    );
    const last = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Last bar"]'
    );
    if (scroller === null || last === null) {
      throw Error("Expected playback controls");
    }
    last.click();
    const deadline = performance.now() + 3_000;
    while (true) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      );
      const cursor = element.querySelector("#playerCursor");
      if (cursor === null) throw Error("Expected playback cursor");
      const bounds = cursor.getBoundingClientRect();
      const left = scroller.getBoundingClientRect().left + scroller.clientLeft;
      const right = left + scroller.clientWidth;
      const reachedBar = scroller.scrollLeft > 0 && bounds.width > 0;
      if (reachedBar || performance.now() >= deadline) {
        const pause = element.querySelector<HTMLButtonElement>(
          'button[aria-label="Pause"]'
        );
        const result = {
          scrollLeft: scroller.scrollLeft,
          width: bounds.width,
          horizontalOverflow: Math.max(
            0,
            left - bounds.left,
            bounds.right - right
          ),
          wasPlaying: pause?.getAttribute("aria-pressed") === "true",
        };
        pause?.click();
        return result;
      }
    }
  });
  expect(followed.wasPlaying).toBe(true);
  expect(followed.scrollLeft).toBeGreaterThan(0);
  expect(followed.width).toBeGreaterThan(0);
  // Use the scroller's horizontal clip, with one CSS pixel for scroll rounding.
  expect(followed.horizontalOverflow).toBeLessThanOrEqual(1);
  await expect(editor.getByRole("button", { name: "Play" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
});

test("keeps adjacent bars separate after a visible duration change", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase&layoutMode=single-line");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();
  const before = await renderedBarExtents(editor);
  expect(before.length).toBeGreaterThan(2);

  const editedBar = before[2];
  const noteRects = editor.locator('.tu-root-svg [id^="note-rect-"]');
  const noteIndex = await noteRects.evaluateAll((rects, bounds) => {
    const matching = rects
      .map((rect, index) => ({ rect, index }))
      .filter(({ rect }) => {
        const matrix = (rect as SVGGraphicsElement).getCTM();
        const x = (matrix?.e ?? 0) + Number(rect.getAttribute("x"));
        return x > bounds.left && x < bounds.right;
      });
    return matching[Math.floor(matching.length / 2)]?.index ?? -1;
  }, editedBar);
  expect(noteIndex).toBeGreaterThanOrEqual(0);
  await noteRects.nth(noteIndex).click();
  const wholeNote = editor.getByRole("button", { name: "Whole note" });
  await expect(wholeNote).toHaveAttribute("aria-pressed", "false");
  await wholeNote.click();
  await expect(wholeNote).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(async () => (await renderedBarExtents(editor))[2]?.right ?? 0)
    .toBeGreaterThan(editedBar.right);

  const after = await renderedBarExtents(editor);
  expect(after.length).toBeGreaterThan(2);
  expect(after[2].left).toBeCloseTo(editedBar.left, 2);
  for (const bar of after) {
    expect(bar.right).toBeGreaterThan(bar.left);
  }
  for (let i = 0; i < after.length - 1; i++) {
    expect(after[i].right).toBeLessThanOrEqual(after[i + 1].left + 0.01);
  }
  const contentAfter = await renderedBarContentExtents(editor);
  expect(contentAfter).toHaveLength(after.length);
  for (let i = 0; i < contentAfter.length - 1; i++) {
    expect(contentAfter[i].right).toBeLessThanOrEqual(
      contentAfter[i + 1].left + 0.01
    );
  }
});
