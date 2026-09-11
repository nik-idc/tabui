import { expect, test } from "@playwright/test";

test("announces the tempo when it opens and changes", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.getByRole("button", { name: "Tempo", exact: true }).click();
  const dialog = editor.getByRole("dialog", { name: "Tempo", exact: true });
  const region = dialog.getByRole("status");
  const increase = dialog.getByRole("button", {
    name: "Increase tempo by 1 BPM",
    exact: true,
  });
  await expect(region).toHaveText("Tempo 120 beats per minute");
  await increase.focus();
  await page.keyboard.press("Space");
  await expect(region).toHaveText("Tempo 121 beats per minute");
});

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

test("announces the repeat count when a step button gets focus", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.getByRole("button", { name: "Repeat End", exact: true }).click();
  const dialog = editor.getByRole("dialog", { name: "Repeat count" });
  const region = dialog.getByRole("status");
  const increase = dialog.getByRole("button", {
    name: "Increase repeat count by 1",
    exact: true,
  });
  await increase.press("Space");
  await expect(region).toHaveText("Repeat count 3");
  const input = dialog.getByRole("spinbutton", { name: "Repeat count" });
  await input.fill("4");
  await expect(region).toHaveText("Repeat count 3");
  await increase.focus();
  await expect(region).toHaveText("Repeat count 4");
  await expect(increase).toBeFocused();
});

test("Tab and Shift+Tab move through and out of editor controls", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  const firstBar = editor.getByRole("button", { name: "First bar" });
  const previousBar = editor.getByRole("button", { name: "Prev bar" });

  await firstBar.focus();
  await page.keyboard.press("Tab");
  await expect(previousBar).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(firstBar).toBeFocused();

  await page.evaluate(() => {
    const before = document.createElement("button");
    before.textContent = "Before editor";
    const after = document.createElement("button");
    after.textContent = "After editor";
    const editor = document.querySelector("#tabui-editor");
    editor?.before(before);
    editor?.after(after);
  });

  const beforeEditor = page.getByRole("button", { name: "Before editor" });
  await beforeEditor.focus();
  await page.keyboard.press("Tab");
  const tracks = editor.getByRole("button", { name: "Tracks" });
  await expect(tracks).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(beforeEditor).toBeFocused();
  await page.keyboard.press("Tab");

  const afterEditor = page.getByRole("button", { name: "After editor" });
  const tabStops = editor.locator(
    "button:visible:not(:disabled), input:visible:not(:disabled), " +
      "select:visible:not(:disabled), textarea:visible:not(:disabled), " +
      "[tabindex]:visible:not([tabindex='-1']), " +
      ".tu-notation-viewport:visible"
  );
  const tabStopCount = await tabStops.count();
  for (let i = 0; i < tabStopCount; i++) {
    await page.keyboard.press("Tab");
    if (await afterEditor.evaluate((el) => el === document.activeElement)) {
      break;
    }
  }
  await expect(afterEditor).toBeFocused();
});

test("basic controls expose accessible names and native behavior", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  const controls = editor.locator(
    "button:visible, input:visible, select:visible, textarea:visible"
  );
  const controlCount = await controls.count();
  for (let i = 0; i < controlCount; i++) {
    await expect(controls.nth(i)).toHaveAccessibleName(/\S/);
  }

  await expect(
    editor.getByRole("textbox", { name: "Score name" })
  ).toBeVisible();
  await expect(
    editor.getByRole("slider", { name: "Master volume" })
  ).toBeVisible();
  await expect(
    editor.getByRole("slider", { name: "Master panning" })
  ).toBeVisible();

  const tracks = editor.getByRole("button", { name: "Tracks" });
  await expect(tracks).toHaveAttribute("aria-expanded", "false");
  await tracks.focus();
  await page.keyboard.press("Space");
  await expect(tracks).toHaveAttribute("aria-expanded", "true");

  for (const name of ["Rhythm track", "Lead track", "Bass track"]) {
    await expect(
      editor.getByRole("button", { name: `Select track: ${name}` })
    ).toBeVisible();
    await expect(
      editor.getByRole("textbox", { name: `${name} name` })
    ).toBeVisible();
    await expect(
      editor.getByRole("slider", { name: `${name} volume` })
    ).toBeVisible();
    await expect(
      editor.getByRole("slider", { name: `${name} panning` })
    ).toBeVisible();
  }

  const rhythmTrack = editor.getByRole("button", {
    name: "Select track: Rhythm track",
  });
  await expect(rhythmTrack).toHaveAttribute("aria-pressed", "true");
  await expect(
    editor.getByRole("button", { name: "Move Rhythm track up" })
  ).toBeDisabled();
  await rhythmTrack.focus();
  await page.keyboard.press("Tab");
  await expect(
    editor.getByRole("button", { name: "Move Rhythm track down" })
  ).toBeFocused();
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

test("new track string-count actions update per-string tuning labels", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.getByRole("button", { name: "New track" }).click();
  const dialog = editor.getByRole("dialog", { name: "New track" });
  const value = dialog.locator(".tu-nt-string-count-value");

  for (const action of [
    "Decrease string count by 1",
    "Increase string count by 1",
    "Increase string count by 1",
  ]) {
    await dialog.getByRole("button", { name: action, exact: true }).click();
  }
  await expect(value).toHaveText("7");
  await expect(dialog.locator(".tu-nt-tuning-string")).toHaveCount(7);
  await dialog
    .getByRole("button", {
      name: "Raise string 1 by 1 semitone",
      exact: true,
    })
    .press("Space");
  await expect(dialog.getByRole("status")).toHaveText("String 1: F");
});

test("announces tuning changes without moving keyboard focus", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await editor.getByRole("button", { name: "Tracks", exact: true }).click();
  for (const opener of ["New track", "Rhythm track settings"]) {
    await editor.getByRole("button", { name: opener, exact: true }).click();
    const dialog = editor.getByRole("dialog");
    const region = dialog.getByRole("status");
    const raise = dialog.getByRole("button", {
      name: "Raise string 1 by 1 semitone",
      exact: true,
    });
    await raise.focus();
    await expect(region).toHaveText("String 1: E");
    await page.keyboard.press("Space");
    await expect(region).toHaveText("String 1: F");
    await expect(raise).toBeFocused();
    await dialog
      .getByRole("button", {
        name: "Lower all strings by 1 semitone",
        exact: true,
      })
      .click();
    await expect(region).toHaveText(
      "Tuning, strings 6 to 1: D sharp, G sharp, C sharp, F sharp, A sharp, E"
    );
    await page.keyboard.press("Escape");
  }
});

test("names a delete confirmation with the track being deleted", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await editor.getByRole("button", { name: "Tracks", exact: true }).click();
  const removeRhythm = editor.getByRole("button", {
    name: "Remove Rhythm track",
    exact: true,
  });
  await removeRhythm.click();
  const dialog = editor.getByRole("dialog");
  await expect(dialog).toHaveAccessibleName(
    'Are you sure you want to delete track "Rhythm track"?'
  );
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
});
