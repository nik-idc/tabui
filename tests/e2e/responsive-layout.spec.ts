import { expect, test, type Page } from "@playwright/test";
import { requiredBoundingBox } from "./helpers";

type PanelPlacement = "top-left" | "bottom-right";

/** Verifies panel placement against the notation's rendered browser rectangle. */
async function expectPanelPlacement(
  page: Page,
  placement: PanelPlacement
): Promise<void> {
  const editor = page.locator("#tabui-editor");
  const notationBox = await requiredBoundingBox(
    editor.locator(".tu-notation-viewport")
  );
  const scorePanelBox = await requiredBoundingBox(
    editor.locator(".tu-top-controls-host")
  );
  const sidePanelBox = await requiredBoundingBox(
    editor.locator(".tu-side-controls-host")
  );
  for (const box of [notationBox, scorePanelBox, sidePanelBox]) {
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  }
  // Panels must share the notation's column/row, not just be somewhere outside it.
  expect(
    Math.min(
      scorePanelBox.x + scorePanelBox.width,
      notationBox.x + notationBox.width
    )
  ).toBeGreaterThan(Math.max(scorePanelBox.x, notationBox.x));
  expect(
    Math.min(
      sidePanelBox.y + sidePanelBox.height,
      notationBox.y + notationBox.height
    )
  ).toBeGreaterThan(Math.max(sidePanelBox.y, notationBox.y));

  if (placement === "top-left") {
    expect(scorePanelBox.y + scorePanelBox.height).toBeLessThanOrEqual(
      notationBox.y
    );
    expect(sidePanelBox.x + sidePanelBox.width).toBeLessThanOrEqual(
      notationBox.x
    );
    return;
  }

  expect(scorePanelBox.y).toBeGreaterThanOrEqual(
    notationBox.y + notationBox.height
  );
  expect(sidePanelBox.x).toBeGreaterThanOrEqual(
    notationBox.x + notationBox.width
  );
}

test("adapts between unrestricted, view-only, and blocked widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/tabui/?fixture=feature_showcase");

  // Wait until the editor has mounted its real notation SVG.
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  // A wide host preserves the configured edit-mode presentation.
  await expect(editor).not.toHaveClass(/tu-responsive-view-only/);
  await expect(editor).not.toHaveClass(/tu-responsive-blocked/);
  const notation = editor.locator(".tu-notation-viewport");
  const svg = editor.locator(".tu-root-svg");
  const wideWidth = (await requiredBoundingBox(svg)).width;
  expect(wideWidth).toBeGreaterThan(0);
  const bars = editor.locator('line[id^="bar-border-"]');
  expect(await bars.count()).toBeGreaterThan(0);
  const readBarPositions = () =>
    bars.evaluateAll((lines) =>
      lines.map((line) => {
        const svgLine = line as SVGLineElement;
        const matrix = svgLine.getScreenCTM();
        const svgRoot = svgLine.ownerSVGElement;
        if (matrix === null || svgRoot === null)
          throw new Error("Expected rendered notation geometry");
        const point = new DOMPoint(
          svgLine.x1.baseVal.value,
          svgLine.y1.baseVal.value
        ).matrixTransform(matrix);
        const bounds = svgRoot.getBoundingClientRect();
        return { id: line.id, x: point.x - bounds.x, y: point.y - bounds.y };
      })
    );
  const wideBars = await readBarPositions();
  expect(wideBars.length).toBeGreaterThan(0);
  expect(
    wideBars.every((v) => Number.isFinite(v.x) && Number.isFinite(v.y))
  ).toBe(true);
  const movedSharedBars = async () => {
    const currentBars = await readBarPositions();
    return currentBars.filter((v) => {
      const original = wideBars.find((b) => b.id === v.id);
      return (
        original !== undefined &&
        (Math.abs(v.x - original.x) > 0.5 || Math.abs(v.y - original.y) > 0.5)
      );
    }).length;
  };
  const restoredSharedBars = async () => {
    const currentBars = await readBarPositions();
    return wideBars.every((v) => {
      const current = currentBars.find((b) => b.id === v.id);
      return (
        current !== undefined &&
        Math.abs(v.x - current.x) <= 0.5 &&
        Math.abs(v.y - current.y) <= 0.5
      );
    });
  };

  // This width is between the default responsive thresholds.
  await page.setViewportSize({ width: 800, height: 900 });
  await expect(editor).toHaveClass(/tu-responsive-view-only/);

  // Responsive view-only hides the editing side panel but keeps notation visible.
  await expect(editor.locator(".tu-side-controls-host")).toBeHidden();
  await expect(editor.locator(".tu-root-svg")).toBeVisible();
  await expect
    .poll(async () => (await requiredBoundingBox(svg)).width)
    .toBeLessThan(wideWidth);
  const narrowWidth = (await requiredBoundingBox(svg)).width;
  expect(narrowWidth).toBeGreaterThan(0);
  expect(narrowWidth).toBeLessThanOrEqual(
    (await requiredBoundingBox(notation)).width
  );
  await expect.poll(movedSharedBars).toBeGreaterThan(0);
  const narrowBars = await readBarPositions();
  expect(narrowBars.length).toBeGreaterThan(0);
  expect(
    narrowBars.every((v) => v.x >= 0 && v.x <= narrowWidth && v.y >= 0)
  ).toBe(true);

  // This width is below the default view-only threshold.
  await page.setViewportSize({ width: 480, height: 900 });
  await expect(editor).toHaveClass(/tu-responsive-blocked/);

  // A blocked editor presents its accessible size message instead of notation.
  await expect(editor.getByRole("status")).toHaveText(
    "This area is too small. Rotate your device, expand the window, or use a larger screen."
  );
  await expect(editor.locator(".tu-notation-viewport")).toBeHidden();

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(editor).not.toHaveClass(/tu-responsive-(view-only|blocked)/);
  await expect(editor.locator(".tu-side-controls-host")).toBeVisible();
  await expect(svg).toBeVisible();
  await expect
    .poll(async () => (await requiredBoundingBox(svg)).width)
    .toBeCloseTo(wideWidth, 0);
  await expect.poll(restoredSharedBars).toBe(true);

  // A host-only resize must also apply the restriction, with no window resize.
  await editor.evaluate((root) => {
    root.style.width = "800px";
  });
  await expect(editor).toHaveClass(/tu-responsive-view-only/);
  await expect(svg).toBeVisible();
  await expect
    .poll(async () => (await requiredBoundingBox(svg)).width)
    .toBeLessThan(wideWidth);
  await expect.poll(movedSharedBars).toBeGreaterThan(0);
  const hostWidth = (await requiredBoundingBox(svg)).width;
  expect(hostWidth).toBeGreaterThan(0);
  expect(hostWidth).toBeLessThanOrEqual(
    (await requiredBoundingBox(notation)).width
  );
  const hostBars = await readBarPositions();
  expect(hostBars.length).toBeGreaterThan(0);
  expect(hostBars.every((v) => v.x >= 0 && v.x <= hostWidth && v.y >= 0)).toBe(
    true
  );
  await editor.evaluate((root) => {
    root.style.removeProperty("width");
  });
  await expect(editor).not.toHaveClass(/tu-responsive-(view-only|blocked)/);
  await expect
    .poll(async () => (await requiredBoundingBox(svg)).width)
    .toBeCloseTo(wideWidth, 0);
  await expect.poll(restoredSharedBars).toBe(true);
});

test("collapses the side panel and gives notation its space", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const notation = editor.locator(".tu-notation-viewport");
  const svg = editor.locator(".tu-root-svg");
  await expect(svg).toBeVisible();

  // Read the visible notation width before the user collapses controls.
  const widthBefore = (await requiredBoundingBox(notation)).width;
  const svgWidthBefore = (await requiredBoundingBox(svg)).width;
  expect(svgWidthBefore).toBeGreaterThan(0);

  // Click the actual accessibility-labelled collapse control.
  await editor.getByRole("button", { name: "Collapse side panel" }).click();

  // The control state and editor layout both reflect the collapsed panel.
  await expect(editor).toHaveClass(/tu-side-controls-collapsed/);
  await expect(
    editor.getByRole("button", { name: "Expand side panel" })
  ).toHaveAttribute("aria-expanded", "false");

  // Collapsing removes the editing controls and increases notation width.
  await expect(editor.locator(".tu-side-controls")).toBeHidden();
  await expect
    .poll(async () => (await requiredBoundingBox(notation)).width)
    .toBeGreaterThan(widthBefore);
  await expect
    .poll(async () => (await requiredBoundingBox(svg)).width)
    .toBeGreaterThan(svgWidthBefore);
  // The viewport's border box includes its reserved scrollbar gutter.
  await expect
    .poll(async () => {
      const widths = await notation.evaluate((viewport) => {
        const rendered = viewport.querySelector(".tu-root-svg");
        if (rendered === null) throw new Error("Expected rendered notation");
        return {
          svg: rendered.getBoundingClientRect().width,
          available: viewport.clientWidth,
        };
      });
      expect(widths.svg).toBeGreaterThan(0);
      expect(widths.available).toBeGreaterThan(0);
      return widths.svg - widths.available;
    })
    .toBeCloseTo(0, 0);

  await editor.getByRole("button", { name: "Expand side panel" }).click();
  await expect(editor).not.toHaveClass(/tu-side-controls-collapsed/);
  await expect(
    editor.getByRole("button", { name: "Collapse side panel" })
  ).toHaveAttribute("aria-expanded", "true");
  await expect(editor.locator(".tu-side-controls")).toBeVisible();
  await expect
    .poll(async () => (await requiredBoundingBox(svg)).width)
    .toBeCloseTo(svgWidthBefore, 0);
});

test("uses the default top-left panel placement", async ({ page }) => {
  // The default configuration places score controls above notation and side controls left.
  await page.goto("/tabui/?fixture=empty");
  await expectPanelPlacement(page, "top-left");
});

test("uses configured bottom-right panel placement", async ({ page }) => {
  // The query parameters configure score controls below notation and side controls right.
  await page.goto(
    "/tabui/?fixture=empty&scorePanelPlacement=bottom&sidePanelPlacement=right"
  );
  await expectPanelPlacement(page, "bottom-right");
});

test("opens the track list in the available direction without moving notation", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();
  const notation = editor.locator(".tu-notation-viewport");
  await editor.getByRole("button", { name: "Tracks" }).scrollIntoViewIfNeeded();
  const before = await requiredBoundingBox(notation);
  const pageScrollBefore = await page.evaluate(() => window.scrollY);

  await editor.getByRole("button", { name: "Tracks" }).click();
  const overlay = editor.locator(".tu-track-controls-overlay");
  await expect(overlay).toBeVisible();
  await expect(overlay.locator(".tu-track-controls")).toHaveCount(4);
  const geometry = await editor.evaluate((root) => {
    const getBox = (selector: string): DOMRect => {
      const element = root.querySelector<HTMLElement>(selector);
      if (element === null) throw new Error(`Missing ${selector}`);
      return element.getBoundingClientRect();
    };
    const toolbar = getBox(".tu-top-controls");
    const title = getBox(".tu-score-name-input");
    const play = getBox(".tu-play-button");
    const master = getBox(".tu-master-volume-input");
    const track = getBox(".tu-track-volume-input");
    const panel = getBox(".tu-track-controls-overlay");
    return {
      toolbarCenter: toolbar.left + toolbar.width / 2,
      toolbarBottom: toolbar.bottom,
      titleCenter: title.left + title.width / 2,
      playCenter: play.left + play.width / 2,
      masterX: master.left,
      trackX: track.left,
      masterWidth: master.width,
      trackWidth: track.width,
      panelTop: panel.top,
      panelBottom: panel.bottom,
      notationTop: getBox(".tu-notation-viewport").top,
    };
  });
  expect(Math.abs(geometry.titleCenter - geometry.toolbarCenter)).toBeLessThan(
    2
  );
  expect(Math.abs(geometry.playCenter - geometry.toolbarCenter)).toBeLessThan(
    2
  );
  expect(Math.abs(geometry.masterX - geometry.trackX)).toBeLessThan(2);
  expect(Math.abs(geometry.masterWidth - geometry.trackWidth)).toBeLessThan(2);
  expect(
    Math.abs(geometry.panelTop - geometry.toolbarBottom)
  ).toBeLessThanOrEqual(0.5);
  await expect
    .poll(async () => {
      const box = await requiredBoundingBox(notation);
      return [box.x, box.y, box.width, box.height];
    })
    .toEqual([before.x, before.y, before.width, before.height]);
  await expect
    .poll(async () => page.evaluate(() => window.scrollY))
    .toBe(pageScrollBefore);

  await page.goto(
    "/tabui/?fixture=feature_showcase&scorePanelPlacement=bottom"
  );
  await expect(editor.locator(".tu-root-svg")).toBeVisible();
  const bottomNotation = editor.locator(".tu-notation-viewport");
  await editor.getByRole("button", { name: "Tracks" }).scrollIntoViewIfNeeded();
  const bottomBefore = await requiredBoundingBox(bottomNotation);
  const bottomPageScrollBefore = await page.evaluate(() => window.scrollY);
  await editor.getByRole("button", { name: "Tracks" }).click();
  const bottomGeometry = await editor.evaluate((root) => {
    const getBox = (selector: string): DOMRect => {
      const element = root.querySelector<HTMLElement>(selector);
      if (element === null) throw new Error(`Missing ${selector}`);
      return element.getBoundingClientRect();
    };
    const panel = getBox(".tu-track-controls-overlay");
    const toolbar = getBox(".tu-top-controls");
    return { panelBottom: panel.bottom, toolbarTop: toolbar.top };
  });
  expect(
    Math.abs(bottomGeometry.panelBottom - bottomGeometry.toolbarTop)
  ).toBeLessThanOrEqual(0.5);
  await expect
    .poll(async () => {
      const box = await requiredBoundingBox(bottomNotation);
      return [box.x, box.y, box.width, box.height];
    })
    .toEqual([
      bottomBefore.x,
      bottomBefore.y,
      bottomBefore.width,
      bottomBefore.height,
    ]);
  await expect
    .poll(async () => page.evaluate(() => window.scrollY))
    .toBe(bottomPageScrollBefore);
  await editor.getByRole("button", { name: /^Tracks ·/ }).click();
  await expect(editor.locator(".tu-track-controls-overlay")).toBeHidden();
});

test("caps a long track list at five rows and keeps it scrollable", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  for (const name of ["Extra one", "Extra two", "Extra three"]) {
    await editor
      .getByRole("button", { name: "New track", exact: true })
      .click();
    const dialog = editor.getByRole("dialog", { name: "New track" });
    await dialog
      .getByRole("textbox", { name: "Track name", exact: true })
      .fill(name);
    await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  }
  await editor.getByRole("button", { name: /^Tracks ·/ }).click();
  const overlay = editor.locator(".tu-track-controls-overlay");
  const metrics = await editor
    .locator(".tu-track-controls-overlay")
    .evaluate((panel) => {
      const row = panel.querySelector<HTMLElement>(".tu-track-controls");
      if (row === null) throw new Error("Expected track row");
      const style = getComputedStyle(panel);
      return {
        clientHeight: panel.clientHeight,
        scrollHeight: panel.scrollHeight,
        rowHeight: row.getBoundingClientRect().height,
        gap: parseFloat(style.gap),
        padding: parseFloat(style.paddingTop) + parseFloat(style.paddingBottom),
      };
    });
  expect(metrics.clientHeight).toBeGreaterThan(0);
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  expect(metrics.clientHeight).toBeLessThanOrEqual(
    metrics.rowHeight * 5 + metrics.gap * 4 + metrics.padding + 2
  );
  await overlay.scrollIntoViewIfNeeded();
  await overlay.hover();
  const scrollTopBeforeWheel = await overlay.evaluate(
    (panel) => panel.scrollTop
  );
  await page.mouse.wheel(0, 500);
  await expect
    .poll(async () =>
      overlay.evaluate((panel) => {
        return panel.scrollTop;
      })
    )
    .toBeGreaterThan(scrollTopBeforeWheel);
  const scrollState = await overlay.evaluate((panel) => {
    const row = panel.querySelector<HTMLElement>(
      ".tu-track-controls:last-child"
    );
    if (row === null) throw new Error("Expected last track row");
    const panelBox = panel.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    return {
      scrollTop: panel.scrollTop,
      rowTop: rowBox.top,
      rowBottom: rowBox.bottom,
      panelTop: panelBox.top,
      panelBottom: panelBox.bottom,
    };
  });
  expect(scrollState.scrollTop).toBeGreaterThan(0);
  expect(scrollState.rowTop).toBeGreaterThanOrEqual(scrollState.panelTop - 0.5);
  expect(scrollState.rowBottom).toBeLessThanOrEqual(
    scrollState.panelBottom + 0.5
  );
});

test("configured view-only keeps only track selection, names, and playback", async ({
  page,
}) => {
  // Load the explicit configuration rather than relying on responsive restriction.
  await page.goto("/tabui/?fixture=feature_showcase&mode=view-only");
  const editor = page.locator("#tabui-editor");
  await expect(editor).toHaveClass(/tu-view-only/);
  await expect(editor.locator(".tu-side-controls-host")).toBeHidden();

  // Open the track list to inspect the controls retained for view-only use.
  await editor.getByRole("button", { name: "Tracks" }).click();

  // Track selection and score/track names remain available for viewing.
  await expect(editor.getByRole("button", { name: "Tracks" })).toBeVisible();
  await expect(editor.locator(".tu-score-name-input")).toBeDisabled();
  await expect(editor.locator(".tu-track-select-button")).toHaveCount(4);
  for (const name of [
    "Rhythm track",
    "Lead track",
    "Bass track",
    "Solo track",
  ]) {
    await expect(
      editor.getByRole("button", { name: `Select track: ${name}`, exact: true })
    ).toBeVisible();
    await expect(
      editor.getByRole("textbox", { name: `${name} name`, exact: true })
    ).toBeDisabled();
  }
  const lead = editor.getByRole("button", {
    name: "Select track: Lead track",
    exact: true,
  });
  const rhythm = editor.getByRole("button", {
    name: "Select track: Rhythm track",
    exact: true,
  });
  await expect(rhythm).toHaveAttribute("aria-pressed", "true");
  // Keyboard navigation restores native Space activation after opening Tracks by mouse.
  await rhythm.focus();
  await page.keyboard.press("Tab");
  await expect(lead).toBeFocused();
  await page.keyboard.press("Space");
  await expect(lead).toHaveAttribute("aria-pressed", "true");
  await expect(rhythm).toHaveAttribute("aria-pressed", "false");
  const notation = editor.locator(".tu-notation-viewport");
  await notation.focus();
  await expect(notation).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(lead).toHaveAttribute("aria-pressed", "true");
  await expect(rhythm).toHaveAttribute("aria-pressed", "false");
  await expect(editor.getByRole("status")).toHaveText(
    "Beat 2, quarter, String 1, fret 15."
  );
  await page.keyboard.press("ArrowLeft");
  await expect(editor.getByRole("status")).toContainText("Beat 1");
  await expect(editor.getByRole("status")).toContainText("fret 12.");
  await expect(lead).toHaveAttribute("aria-pressed", "true");
  await expect(
    editor.getByRole("button", { name: "Play", exact: true })
  ).toBeEnabled();

  // Score creation and mix controls are absent from the compact presentation.
  await expect(editor.locator(".tu-new-track-button")).toBeHidden();
  await expect(editor.locator(".tu-master-volume-input")).toBeHidden();
  await expect(editor.locator(".tu-master-panning-input")).toBeHidden();

  // Track movement, mix, settings, and removal controls are absent too.
  for (const selector of [
    ".tu-track-move-up-button",
    ".tu-track-move-down-button",
    ".tu-track-volume-input",
    ".tu-track-panning-input",
    ".tu-track-mute-button",
    ".tu-track-solo-button",
    ".tu-track-settings-button",
    ".tu-track-remove-button",
  ]) {
    await expect(editor.locator(`${selector}:visible`)).toHaveCount(0);
  }
});
