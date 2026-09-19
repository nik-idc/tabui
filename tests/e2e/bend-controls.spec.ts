import { expect, test } from "@playwright/test";
import { requiredBoundingBox } from "./helpers";

async function openBendDialog(page: import("@playwright/test").Page) {
  const editor = page.locator("#tabui-editor");
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  await page.keyboard.press("1");
  const opener = editor.getByRole("button", { name: "Bend" });
  await opener.focus();
  await opener.click();
  return {
    dialog: editor.getByRole("dialog", { name: "Bend" }),
    editor,
    opener,
  };
}

test("exposes bend controls with names, states, and disabled behavior", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const { dialog } = await openBendDialog(page);

  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog).toHaveAttribute(
    "aria-description",
    "Pitch uses half-semitone steps. Tab moves between controls. " +
      "Arrow keys adjust pitch and duration."
  );
  await expect(
    dialog.getByRole("button", { name: "Bend", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.getByRole("button", { name: "Hold" })).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: "Release", exact: true })
  ).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Remove" })).toBeDisabled();

  const point = dialog.locator('circle[aria-label="Bend point"]');
  await expect(point).toHaveAttribute("tabindex", "0");
  await expect(point).not.toHaveAttribute("role");
  expect(
    await point.evaluate((element) =>
      element
        .getAttributeNames()
        .filter((name) => name.startsWith("aria-value"))
    )
  ).toEqual([]);
  const decoration = dialog.locator(
    ".tu-bend-controls-svg line, .tu-bend-controls-svg text, " +
      ".tu-bend-controls-svg path, " +
      ".tu-bend-controls-svg circle:not([tabindex])"
  );
  await expect(decoration.first()).toBeAttached();
  expect(
    await decoration.evaluateAll((elements) =>
      elements.every(
        (element) => element.getAttribute("aria-hidden") === "true"
      )
    )
  ).toBe(true);
});

test("tabs through available bend types, points, and actions", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const { dialog } = await openBendDialog(page);
  const bendRelease = dialog.getByRole("button", {
    name: "Bend / Release",
    exact: true,
  });
  await bendRelease.focus();
  await page.keyboard.press("Enter");
  await expect(bendRelease).toHaveAttribute("aria-pressed", "true");

  const expectedOrder = [
    dialog.getByRole("button", { name: "Bend", exact: true }),
    dialog.getByRole("button", { name: "Prebend", exact: true }),
    bendRelease,
    dialog.getByRole("button", {
      name: "Prebend / Release",
      exact: true,
    }),
    dialog.getByRole("button", { name: "Prebend / Bend", exact: true }),
    dialog.locator('circle[aria-label="Bend point"]'),
    dialog.locator('circle[aria-label="Release point"]'),
    dialog.getByRole("button", { name: "Confirm" }),
    dialog.getByRole("button", { name: "Cancel" }),
  ];
  await expectedOrder[0].focus();
  for (const control of expectedOrder) {
    await expect(control).toBeFocused();
    await page.keyboard.press("Tab");
  }
  await expect(expectedOrder[0]).toBeFocused();

  for (const control of [...expectedOrder].reverse()) {
    await page.keyboard.press("Shift+Tab");
    await expect(control).toBeFocused();
  }
});

test("uses arrows, not Tab, to move the selected bend point", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const { dialog } = await openBendDialog(page);
  const point = dialog.locator('circle[aria-label="Bend point"]');
  const status = dialog.getByRole("status");
  const confirm = dialog.getByRole("button", { name: "Confirm" });
  await point.focus();
  await expect(status).toHaveText(
    "Bend point. Pitch full tone. Duration 75 percent."
  );
  const before = await point.evaluate((element) => ({
    x: element.getAttribute("cx"),
    y: element.getAttribute("cy"),
  }));

  await page.keyboard.press("Tab");
  await expect(confirm).toBeFocused();
  await expect(point).toHaveAttribute("cx", before.x ?? "");
  await expect(point).toHaveAttribute("cy", before.y ?? "");

  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("ArrowUp");
  await expect(point).not.toHaveAttribute("cy", before.y ?? "");
  await expect(status).toHaveText(
    "Bend point. Pitch one and a quarter tones. Duration 75 percent."
  );
  await page.keyboard.press("ArrowDown");
  await expect(status).toHaveText(
    "Bend point. Pitch full tone. Duration 75 percent."
  );
  await page.keyboard.press("ArrowLeft");
  await expect(status).toHaveText(
    "Bend point. Pitch full tone. Duration 67 percent."
  );
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(status).toHaveText(
    "Bend point. Pitch two and a quarter tones. Duration 67 percent."
  );
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await expect(status).toHaveText(
    "Bend point. Pitch two and a quarter tones. Duration 67 percent."
  );
  const updates = await dialog.evaluate(async (element) => {
    const region = element.querySelector('[role="status"]')!;
    const point = element.querySelector<SVGCircleElement>("circle[tabindex]")!;
    const messages: string[] = [];
    const observer = new MutationObserver(() => {
      messages.push(region.textContent ?? "");
    });
    observer.observe(region, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    point.blur();
    point.focus();
    await new Promise((resolve) => setTimeout(resolve, 100));
    observer.disconnect();
    return messages;
  });
  expect(updates).toEqual([]);
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowUp");
  await expect(status).toHaveText(
    "Bend point. Pitch three tones. Duration 67 percent."
  );
  const cleanup = await dialog.evaluate(async (element) => {
    const region = element.querySelector('[role="status"]')!;
    const point = element.querySelector<SVGCircleElement>("circle[tabindex]")!;
    const observer = new MutationObserver(() => {});
    observer.observe(region, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    point.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    const clampedUpdates = observer.takeRecords().length;
    observer.disconnect();
    point.blur();
    point.focus();
    element
      .querySelector<HTMLButtonElement>(".tu-bend-controls-cancel-button")!
      .click();
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { clampedUpdates, text: region.textContent };
  });
  expect(cleanup).toEqual({ clampedUpdates: 0, text: "" });
});

test("contains bend focus and restores its opener", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const { dialog, opener } = await openBendDialog(page);
  const cancel = dialog.getByRole("button", { name: "Cancel" });
  const first = dialog.getByRole("button", { name: "Bend", exact: true });

  await cancel.focus();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test("reopens the bend dialog from the keyboard after Escape", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  await page.keyboard.press("1");

  const dialog = editor.locator(".tu-dialog.tu-bend-controls-dialog");
  await page.keyboard.press("b");
  await expect(dialog).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toHaveAttribute("open", "");
  await expect(editor.locator(".tu-notation-viewport")).toBeFocused();

  await page.keyboard.press("b");

  await expect(dialog).toHaveAttribute("open", "");
});

test("moves a bend handle without scrolling notation", async ({ page }) => {
  // Load an editable score with an empty note slot.
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const notation = editor.locator(".tu-notation-viewport");

  // Enter a fret so the selected note can receive a bend technique.
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  await page.keyboard.press("1");

  // Open the bend dialog through the same control a user clicks.
  await editor.getByRole("button", { name: "Bend" }).click();
  const dialog = editor.locator(".tu-dialog.tu-bend-controls-dialog");
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
  await editor.getByRole("button", { name: "Bend" }).click();

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
