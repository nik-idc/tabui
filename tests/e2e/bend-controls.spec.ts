import { expect, test } from "@playwright/test";
import { requiredBoundingBox } from "./helpers";

test("moves a bend handle without scrolling notation", async ({ page }) => {
  // Load an editable score with an empty note slot.
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const notation = editor.locator(".tu-notation-viewport");

  // Enter a fret so the selected note can receive a bend technique.
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  await page.keyboard.press("1");

  // Open the bend dialog through the same control a user clicks.
  await editor.locator('img[alt="Bend"]').click();
  const dialog = editor.locator("dialog.tu-bend-controls-dialog");
  const graph = dialog.locator(".tu-bend-controls-svg");
  await expect(dialog).toHaveAttribute("open", "");
  await expect(graph).toBeVisible();

  // Record the handle position and notation scroll state before dragging.
  const handle = graph.locator("circle").last();
  const handleBox = await requiredBoundingBox(handle);
  const handleYBefore = await handle.getAttribute("cy");
  const scrollTopBefore = await notation.evaluate(
    (element) => element.scrollTop
  );
  // Drag the handle upward far enough to cross one snapped graph row.
  const handleX = handleBox.x + handleBox.width / 2;
  const handleY = handleBox.y + handleBox.height / 2;
  await page.mouse.move(handleX, handleY);
  await page.mouse.down();
  await page.mouse.move(handleX, handleY - 100);
  await page.mouse.up();

  // The snapped graph point changes while the notation viewport stays still.
  await expect(handle).not.toHaveAttribute("cy", handleYBefore ?? "");
  await expect(notation).toHaveJSProperty("scrollTop", scrollTopBefore);
});

test("moves a bend handle through a touch gesture", async ({
  page,
  browserName,
}) => {
  // CDP touch injection is Chromium-specific, so Firefox keeps mouse coverage above.
  test.skip(
    browserName !== "chromium",
    "CDP touch injection requires Chromium"
  );

  // Load an editable score and open the bend graph for one entered fret.
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  await page.keyboard.press("1");
  await editor.locator('img[alt="Bend"]').click();

  // The graph explicitly owns touch gestures instead of allowing browser panning.
  const graph = editor.locator(".tu-bend-controls-svg");
  await expect(graph).toHaveCSS("touch-action", "none");
  const handle = graph.locator("circle").last();
  const handleBox = await requiredBoundingBox(handle);
  const handleYBefore = await handle.getAttribute("cy");

  // Send a real browser touch start, move, and end at the handle's screen position.
  const handleX = handleBox.x + handleBox.width / 2;
  const handleY = handleBox.y + handleBox.height / 2;
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: handleX, y: handleY, id: 1 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: handleX, y: handleY - 100, id: 1 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });

  // The touch gesture updates the snapped graph point through Pointer Events.
  await expect(handle).not.toHaveAttribute("cy", handleYBefore ?? "");
});
