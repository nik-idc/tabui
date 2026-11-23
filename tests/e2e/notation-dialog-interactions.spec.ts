import { expect, test, type Page } from "@playwright/test";
import { clickSvgText, hoverSvgText } from "./helpers";

test("time signature hover and click use the clicked bar", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.locator('[id^="note-rect-"]').first().click();
  await page.keyboard.press("Shift+I");
  await editor.locator('[id^="note-rect-"]').last().click();
  const group = editor.locator(".tu-time-signature").first();
  const text = group.locator('[id^="bar-sig-"]').first();
  const id = await text.getAttribute("id");
  const clickedText = editor.locator(`[id="${id}"]`);
  const original = await text.evaluate((node) => getComputedStyle(node).fill);

  await text.hover();
  await expect(text).not.toHaveCSS("fill", original);
  await page.mouse.move(0, 0);
  await expect(text).toHaveCSS("fill", original);
  await text.click();

  const dialog = editor.getByRole("dialog", { name: "Time signature" });
  await expect(dialog.locator(".tu-number-stepper-value").first()).toHaveText(
    "4"
  );
  await dialog
    .getByRole("button", { name: "Increase beats per measure by 1" })
    .click();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(clickedText).toHaveText("5");
  // Both bars shared 4/4, so the edit changes the section without a reset marker.
  await expect(editor.locator(".tu-time-signature")).toHaveCount(1);

  // A second edit must refresh the existing signature, not only create it.
  await clickedText.click();
  await expect(dialog.locator(".tu-number-stepper-value").first()).toHaveText(
    "5"
  );
  await dialog
    .getByRole("button", { name: "Increase beats per measure by 1" })
    .click();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(clickedText).toHaveText("6");
  await page.keyboard.press("Control+z");
  await expect(clickedText).toHaveText("5");
  await page.keyboard.press("Control+y");
  await expect(clickedText).toHaveText("6");
  await page.keyboard.press("Control+z");
  await page.keyboard.press("Control+z");
  await expect(clickedText).toHaveText("4");
  await expect(editor.locator(".tu-time-signature")).toHaveCount(1);
});

test("tempo hover and click use the clicked bar value", async ({ page }) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  const tempos = editor.locator(".tu-tempo");
  const first = tempos.first();
  const image = first.locator('[id^="tempo-img-"]');
  const text = first.locator('[id^="tempo-text-"]');
  const hitArea = first.locator(".tu-tempo-hit-area");
  // The tempo marker is rebuilt right after the first render, and a replaced
  // element has no computed fill. Wait for a real one.
  const readFill = () => text.evaluate((node) => getComputedStyle(node).fill);
  await expect.poll(readFill).not.toBe("");
  const original = await readFill();

  // Even empty space around the asset belongs to the same pointer target.
  await hitArea.hover({ position: { x: 5, y: 5 } });
  await expect(text).not.toHaveCSS("fill", original);
  const highlight = await text.evaluate((node) => getComputedStyle(node).fill);
  await expect(image).toHaveCSS("fill", highlight);
  await page.mouse.move(0, 0);
  await expect(text).toHaveCSS("fill", original);
  await expect(image).toHaveCSS("fill", original);
  await hitArea.hover();
  await expect(image).toHaveCSS("fill", highlight);
  await hitArea.click({ position: { x: 5, y: 5 } });
  const dialog = editor.getByRole("dialog", { name: "Tempo" });
  await expect(dialog.locator(".tu-number-stepper-value")).toHaveValue("90");
  await dialog.getByRole("button", { name: "Increase tempo by 1 BPM" }).click();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(text).toHaveText("91");

  await hitArea.click();
  await expect(dialog.locator(".tu-number-stepper-value")).toHaveValue("91");
  await dialog.getByRole("button", { name: "Increase tempo by 1 BPM" }).click();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(text).toHaveText("92");

  await page.keyboard.press("Control+z");
  await expect(text).toHaveText("91");
  await page.keyboard.press("Control+y");
  await expect(text).toHaveText("92");
  await page.keyboard.press("Control+z");
  await page.keyboard.press("Control+z");
  await expect(text).toHaveText("90");
});

test("tempo input supports text, keyboard, escape, and wheel changes", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  const hitArea = editor.locator(".tu-tempo-hit-area").first();
  const text = editor
    .locator(".tu-tempo")
    .first()
    .locator('[id^="tempo-text-"]');
  await hitArea.click();
  const dialog = editor.getByRole("dialog", { name: "Tempo" });
  const tempoInput = dialog.locator('input[name="tempo"]');

  await tempoInput.fill("120.5");
  await tempoInput.press("ArrowUp");
  await tempoInput.press("Enter");
  await expect(text).toHaveText("121");

  await hitArea.click();
  await tempoInput.fill("999");
  await tempoInput.press("Escape");
  await expect(text).toHaveText("121");

  await hitArea.click();
  await tempoInput.hover();
  await page.mouse.wheel(0, -100);
  await expect(tempoInput).toHaveValue("122");
});

async function addTuplet(page: Page, complete: boolean) {
  const editor = page.locator("#tabui-editor");
  const firstNote = editor.locator('[id^="note-rect-"]').first();
  await firstNote.click();
  await page.keyboard.press("5");
  if (complete) {
    const gap = editor.locator("[data-bar-end-gap-uuid]");
    await gap.click();
    await gap.click();
    await firstNote.click();
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
  }
  await page.keyboard.press("Shift+T");
  const dialog = editor.getByRole("dialog", { name: "Tuplet" });
  await dialog.getByRole("button", { name: "Confirm" }).click();
}

test("complete tuplet click selects all beats and opens its existing dialog", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  await addTuplet(page, true);
  const editor = page.locator("#tabui-editor");
  await editor.locator('[id^="note-rect-"]').first().click();
  const label = editor.locator('[id^="tuplet-complete-text-"]').first();
  const original = await label.evaluate((node) => getComputedStyle(node).fill);
  await hoverSvgText(label);
  await expect(label).not.toHaveCSS("fill", original);
  await clickSvgText(label);
  const dialog = editor.getByRole("dialog", { name: "Tuplet" });
  await expect(dialog.locator(".tu-number-stepper-value").first()).toHaveText(
    "3"
  );
  await dialog
    .getByRole("button", { name: "Increase normal notes by 1" })
    .click();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(editor.locator('[id^="tuplet-incomplete-text-"]')).toHaveText([
    "4:2",
    "4:2",
    "4:2",
  ]);
  await page.keyboard.press("Control+z");
  await expect(editor.locator('[id^="tuplet-complete-text-"]')).toHaveText("3");
});

test("incomplete tuplet label opens only its beat context", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  await addTuplet(page, true);
  const editor = page.locator("#tabui-editor");
  await clickSvgText(editor.locator('[id^="tuplet-complete-text-"]'));
  const dialog = editor.getByRole("dialog", { name: "Tuplet" });
  await dialog
    .getByRole("button", { name: "Increase normal notes by 1" })
    .click();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  const labels = editor.locator('[id^="tuplet-incomplete-text-"]');
  await expect(labels).toHaveText(["4:2", "4:2", "4:2"]);
  const original = await labels
    .nth(1)
    .evaluate((node) => getComputedStyle(node).fill);
  await hoverSvgText(labels.nth(1));
  await expect(labels.nth(1)).not.toHaveCSS("fill", original);
  await page.mouse.move(0, 0);
  await expect(labels.nth(1)).toHaveCSS("fill", original);
  await clickSvgText(labels.nth(1));
  await expect(dialog.locator(".tu-number-stepper-value").first()).toHaveText(
    "4"
  );
  await dialog
    .getByRole("button", { name: "Increase normal notes by 1" })
    .click();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(labels).toHaveText(["4:2", "5:2", "4:2"]);
  await page.keyboard.press("Control+z");
  await expect(labels).toHaveText(["4:2", "4:2", "4:2"]);
});

test("notation clicks do not open dialogs in view-only mode or playback", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase&mode=view-only");
  const editor = page.locator("#tabui-editor");
  await editor.locator(".tu-tempo-hit-area").first().click();
  await expect(editor.getByRole("dialog")).toHaveCount(0);

  await page.goto("/tabui/?fixture=empty");
  const tempo = editor.locator(".tu-tempo-hit-area").first();
  // The tempo marker is rebuilt right after the first render. This check
  // retries, so it doesn't fail on the replaced element.
  await expect(tempo).toBeInViewport();
  await editor.getByRole("button", { name: "Play", exact: true }).click();
  await expect(editor.getByRole("button", { name: "Pause" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  const tempoBounds = await tempo.boundingBox();
  expect(tempoBounds).not.toBeNull();
  if (tempoBounds === null) {
    throw Error("Expected tempo hit target bounds");
  }
  await page.mouse.click(
    tempoBounds.x + tempoBounds.width / 2,
    tempoBounds.y + tempoBounds.height / 2
  );
  await expect(editor.getByRole("dialog")).toHaveCount(0);
  await expect(editor.getByRole("button", { name: "Pause" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await editor.getByRole("button", { name: "Pause" }).click();
});
