import { expect, Locator, Page, test } from "@playwright/test";

async function barBorderIds(editor: Locator): Promise<string[]> {
  return editor
    .locator('line[id^="bar-border-"]')
    .evaluateAll((lines) => lines.map((line) => line.id).sort());
}

async function barBorderXs(page: Page): Promise<number[]> {
  return page.locator('line[id^="bar-border-"]').evaluateAll((lines) => {
    return lines
      .map((line) => {
        const svgLine = line as SVGGraphicsElement;
        return (svgLine.getCTM()?.e ?? 0) + Number(svgLine.getAttribute("x1"));
      })
      .sort((a, b) => a - b);
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

  await viewport.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect
    .poll(() => viewport.evaluate((e) => e.scrollLeft))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => (await barBorderIds(editor)).join(":"))
    .not.toBe(initialIds.join(":"));

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
  await viewport.evaluate((element) => {
    element.scrollLeft = element.scrollWidth / 2;
  });
  await expect
    .poll(() => viewport.evaluate((e) => e.scrollLeft))
    .toBeGreaterThan(0);
  const firstTrackXs = await barBorderXs(page);

  await selectTrack(editor, 1);

  expect(await barBorderXs(page)).toEqual(firstTrackXs);
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

  await editor.locator('img[alt="Last bar"]').click();

  await expect
    .poll(() => viewport.evaluate((e) => e.scrollLeft))
    .toBeGreaterThan(0);
  await expect(editor.locator("#tu-selection rect")).toBeVisible();
});

test("follows playback to an offscreen bar in single-line mode", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase&layoutMode=single-line");
  const editor = page.locator("#tabui-editor");
  const viewport = editor.locator(".tu-notation-viewport");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  await editor.locator('img[alt="Play"]').click();
  await editor.locator('img[alt="Last bar"]').click();

  await expect
    .poll(() => viewport.evaluate((e) => e.scrollLeft))
    .toBeGreaterThan(0);
  await expect
    .poll(async () =>
      Number(await editor.locator("#playerCursor").getAttribute("width"))
    )
    .toBeGreaterThan(0);
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
  await editor.locator('img[alt="Whole note"]').click();

  const after = await renderedBarExtents(editor);
  for (let i = 0; i < after.length - 1; i++) {
    expect(after[i].right).toBeLessThanOrEqual(after[i + 1].left + 0.01);
  }
  const contentAfter = await renderedBarContentExtents(editor);
  for (let i = 0; i < contentAfter.length - 1; i++) {
    expect(contentAfter[i].right).toBeLessThanOrEqual(
      contentAfter[i + 1].left + 0.01
    );
  }
});
