import { expect, Page, test } from "@playwright/test";

async function openShowcase(page: Page) {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();
  const play = editor.getByRole("button", { name: /^(Play|Pause)$/ });
  const tracks = editor.getByRole("button", { name: /^Tracks ·/ });
  const overlay = editor.locator(".tu-track-controls-overlay");
  return { editor, play, tracks, overlay };
}

test("Space plays after mouse clicks on toolbar buttons and track rows", async ({
  page,
}) => {
  const { editor, play, tracks, overlay } = await openShowcase(page);
  await play.click();
  await expect(play).toHaveAttribute("aria-pressed", "true");
  await play.click();
  await expect(play).toHaveAttribute("aria-pressed", "false");

  await tracks.click();
  const lead = editor.locator(".tu-track-controls").nth(1);
  await lead.locator(".tu-track-name-label").click();
  await expect(lead).toHaveAttribute("aria-current", "true");
  await tracks.click();
  await expect(overlay).toBeHidden();

  // Space must reach the notation, not press the last clicked button.
  await page.keyboard.press("Space");
  await expect(play).toHaveAttribute("aria-pressed", "true");
  await expect(overlay).toBeHidden();
});

test("Space still presses a button that has keyboard focus", async ({
  page,
}) => {
  const { play, tracks, overlay } = await openShowcase(page);
  await tracks.focus();
  await page.keyboard.press("Space");
  await expect(overlay).toBeVisible();
  await expect(tracks).toBeFocused();
  await expect(play).toHaveAttribute("aria-pressed", "false");
});

test("Space on a slider toggles playback and keeps its value", async ({
  page,
}) => {
  const { editor, play } = await openShowcase(page);
  const volume = editor.getByRole("slider", {
    name: "Master volume",
    exact: true,
  });
  await volume.click();
  await expect(volume).toBeFocused();
  const value = await volume.inputValue();

  await page.keyboard.press("Space");
  await expect(play).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(play).toHaveAttribute("aria-pressed", "false");
  await expect(volume).toHaveValue(value);
  await expect(volume).toBeFocused();
});
