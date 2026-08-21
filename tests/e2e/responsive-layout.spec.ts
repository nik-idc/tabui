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
  // Start wide enough for the configured edit mode.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/tabui/?fixture=empty");

  // Wait until the editor has mounted its real notation SVG.
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  // A wide host preserves the configured edit-mode presentation.
  await expect(editor).not.toHaveClass(/tu-responsive-view-only/);
  await expect(editor).not.toHaveClass(/tu-responsive-blocked/);

  // This width is between the default responsive thresholds.
  await page.setViewportSize({ width: 800, height: 900 });
  await expect(editor).toHaveClass(/tu-responsive-view-only/);

  // Responsive view-only hides the editing side panel but keeps notation visible.
  await expect(editor.locator(".tu-side-controls-host")).toBeHidden();
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  // This width is below the default view-only threshold.
  await page.setViewportSize({ width: 480, height: 900 });
  await expect(editor).toHaveClass(/tu-responsive-blocked/);

  // A blocked editor presents its accessible size message instead of notation.
  await expect(editor.getByRole("status")).toHaveText(
    "This area is too small. Rotate your device, expand the window, or use a larger screen."
  );
  await expect(editor.locator(".tu-notation-viewport")).toBeHidden();
});

test("collapses the side panel and gives notation its space", async ({
  page,
}) => {
  // Use the default edit-mode layout with its expanded side panel.
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const notation = editor.locator(".tu-notation-viewport");

  // Read the visible notation width before the user collapses controls.
  const widthBefore = (await requiredBoundingBox(notation)).width;

  // Click the actual accessibility-labelled collapse control.
  await editor.getByRole("button", { name: "Collapse side panel" }).click();

  // The control state and editor layout both reflect the collapsed panel.
  await expect(editor).toHaveClass(/tu-side-controls-collapsed/);
  await expect(
    editor.getByRole("button", { name: "Expand side panel" })
  ).toHaveAttribute("aria-expanded", "false");

  // Collapsing removes the editing controls and increases notation width.
  await expect(editor.locator(".tu-side-controls")).toBeHidden();
  const widthAfter = (await requiredBoundingBox(notation)).width;
  expect(widthAfter).toBeGreaterThan(widthBefore);
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

test("configured view-only keeps only track selection, names, and playback", async ({
  page,
}) => {
  // Load the explicit configuration rather than relying on responsive restriction.
  await page.goto("/tabui/?fixture=empty&mode=view-only");
  const editor = page.locator("#tabui-editor");
  await expect(editor).toHaveClass(/tu-view-only/);
  await expect(editor.locator(".tu-side-controls-host")).toBeHidden();

  // Open the track list to inspect the controls retained for view-only use.
  await editor.getByRole("button", { name: "Tracks" }).click();

  // Track selection and score/track names remain available for viewing.
  await expect(editor.getByRole("button", { name: "Tracks" })).toBeVisible();
  await expect(editor.locator(".tu-score-name-input")).toBeDisabled();
  await expect(editor.locator(".tu-track-select-button")).toBeVisible();
  await expect(editor.locator(".tu-track-name-input")).toBeVisible();

  // Score creation and mix controls are absent from the compact presentation.
  await expect(editor.locator(".tu-new-track-button")).toBeHidden();
  await expect(editor.locator(".tu-master-volume-input")).toBeHidden();
  await expect(editor.locator(".tu-master-panning-input")).toBeHidden();

  // Track movement, mix, settings, and removal controls are absent too.
  await expect(editor.locator(".tu-track-move-up-button")).toBeHidden();
  await expect(editor.locator(".tu-track-move-down-button")).toBeHidden();
  await expect(editor.locator(".tu-track-volume-input")).toBeHidden();
  await expect(editor.locator(".tu-track-panning-input")).toBeHidden();
  await expect(editor.locator(".tu-track-mute-button")).toBeHidden();
  await expect(editor.locator(".tu-track-solo-button")).toBeHidden();
  await expect(editor.locator(".tu-track-settings-button")).toBeHidden();
  await expect(editor.locator(".tu-track-remove-button")).toBeHidden();
});
