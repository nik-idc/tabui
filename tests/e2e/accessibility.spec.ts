import { expect, test } from "@playwright/test";

test("icon buttons expose state and are focusable", async ({ page }) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  for (const name of ["Play", "Loop", "Mute", "Bend"]) {
    const button = editor.getByRole("button", { name });
    await expect(button).toHaveAttribute("aria-pressed", /true|false/);
  }

  const firstBar = editor.getByRole("button", { name: "First bar" });
  await expect(firstBar).toHaveJSProperty("tabIndex", 0);
  await firstBar.focus();
  await expect(firstBar).toBeFocused();
});

test("provides icon tooltips on hover and keyboard focus", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const play = editor.getByRole("button", { name: "Play" });

  await play.hover();
  await expect(play).toHaveAttribute("title", "Play");
  await expect(play).toHaveAttribute("data-tooltip", "Play");
  await play.focus();
  await expect(play).toHaveCSS("position", "relative");
});
