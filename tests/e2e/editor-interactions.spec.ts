import { expect, test } from "@playwright/test";

test("accepts timed keyboard fret input", async ({ page }) => {
  // Load one deterministic editable score.
  const time = new Date("2026-01-01T00:00:00Z");
  await page.clock.install({ time: new Date("2025-12-31T00:00:00Z") });
  await page.clock.pauseAt(time);
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  // Click the first note hitbox to give the notation keyboard ownership.
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();

  // Digits entered within the accumulation window form a two-digit fret.
  await page.keyboard.press("1");
  await page.keyboard.press("2");
  await expect(editor.locator('[id^="note-text-"]')).toHaveText(/12/);

  // Waiting past the timeout makes the next digit replace the previous fret.
  await page.clock.fastForward(251);
  await page.keyboard.press("3");
  await expect(editor.locator('[id^="note-text-"]')).toHaveText("3");
});

for (const selection of ["keyboard", "mouse"]) {
  test(`rapid fret digits stay on their selected notes: ${selection}`, async ({
    page,
  }) => {
    const time = new Date("2026-01-01T00:00:00Z");
    await page.clock.install({ time: new Date("2025-12-31T00:00:00Z") });
    await page.clock.pauseAt(time);
    await page.goto("/tabui/?fixture=empty");
    const editor = page.locator("#tabui-editor");
    await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();

    await page.keyboard.press("1");
    if (selection === "keyboard") {
      await page.keyboard.press("ArrowDown");
    } else {
      await editor.locator('.tu-root-svg [id^="note-rect-"]').nth(1).click();
    }
    await page.keyboard.press("2");
    await expect(editor.locator('[id^="note-text-"]')).toHaveText(["1", "2"]);
  });
}

test("announces a fret change but not an unchanged fret DOM write", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const note = editor.locator('.tu-root-svg [id^="note-rect-"]').first();
  await note.click();

  const announcement = editor.locator(".tu-announcement-host");
  await announcement.evaluate((element) => {
    (window as any).__tabuiAnnouncementMutations = 0;
    const observer = new MutationObserver((records) => {
      (window as any).__tabuiAnnouncementMutations += records.length;
    });
    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    (window as any).__tabuiAnnouncementObserver = observer;
  });
  await page.keyboard.press("5");
  await expect(announcement).toHaveText(
    /Track .*Staff .*Bar .*Beat .*String 1, fret 5\./
  );
  const changedMutations = await page.evaluate(() => {
    const count = (window as any).__tabuiAnnouncementMutations;
    (window as any).__tabuiAnnouncementMutations = 0;
    return count;
  });
  expect(changedMutations).toBeGreaterThan(0);
  await page.clock.fastForward(251);
  await page.keyboard.press("5");
  await page.evaluate(() => Promise.resolve());
  const mutations = await page.evaluate(() => {
    const observer = (window as any)
      .__tabuiAnnouncementObserver as MutationObserver;
    const records =
      (window as any).__tabuiAnnouncementMutations +
      observer.takeRecords().length;
    observer.disconnect();
    delete (window as any).__tabuiAnnouncementObserver;
    delete (window as any).__tabuiAnnouncementMutations;
    return records;
  });

  expect(mutations).toBe(0);
  await expect(editor.locator('[id^="note-text-"]')).toHaveText("5");
});

test("keeps concise arrow announcements after the automatic flush", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  await page.keyboard.press("ArrowRight");

  await expect(editor.locator(".tu-announcement-host")).toHaveText(
    /^Bar 2, 4\/4, 120 BPM, Voice 1,/
  );
});

test("starts and pauses playback from the transport control", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  // Observe and pause in-page so remote calls cannot outlive playback.
  await editor.evaluate((element) => {
    (window as any).__tabuiPlaybackMovement = new Promise((resolve) => {
      let before: number | undefined;
      /** Captures native-clock cursor motion before stopping playback. */
      const observe = () => {
        const cursor = element.querySelector("#playerCursor")!;
        const visible = cursor.getAttribute("width") === "5";
        const x = Number(cursor.getAttribute("x"));
        if (visible && before === undefined) {
          before = x;
        } else if (before !== undefined && (!visible || x > before)) {
          const pause = element.querySelector<HTMLButtonElement>(
            'button[aria-label="Pause"]'
          );
          const result = {
            before,
            after: x,
            visible,
            pressed: pause?.getAttribute("aria-pressed"),
          };
          pause?.click();
          resolve(result);
          return;
        }
        requestAnimationFrame(observe);
      };
      requestAnimationFrame(observe);
    });
  });
  await editor.getByRole("button", { name: "Play" }).click();
  const movement = await page.evaluate(async () => {
    const result = await (window as any).__tabuiPlaybackMovement;
    delete (window as any).__tabuiPlaybackMovement;
    return result;
  });
  expect(movement.visible).toBe(true);
  expect(movement.pressed).toBe("true");
  expect(movement.after).toBeGreaterThan(movement.before);

  await expect(editor.getByRole("button", { name: "Play" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  await expect(editor.locator("#playerCursor")).toHaveAttribute("width", "0");
});

test("starts and pauses playback with Space", async ({ page }) => {
  const time = new Date("2026-01-01T00:00:00Z");
  await page.clock.install({ time: new Date("2025-12-31T00:00:00Z") });
  await page.clock.pauseAt(time);
  // Web Audio time is not controlled by page.clock.
  await page.addInitScript(() => {
    Object.defineProperty(BaseAudioContext.prototype, "currentTime", {
      get: () => performance.now() / 1000,
    });
  });
  // Load a score with enough beats for visible cursor animation.
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  // Click notation so the editor owns subsequent keyboard input.
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();

  // Space starts playback through the editor's keyboard handler.
  await page.keyboard.press("Space");
  await expect(editor.getByRole("button", { name: "Pause" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  // The visible SVG cursor must advance while the player is running.
  const cursor = editor.locator("#playerCursor");
  await page.clock.runFor(100);
  await expect(cursor).toHaveAttribute("width", "5");
  const cursorXBefore = await cursor.getAttribute("x");
  await page.clock.runFor(100);
  await expect(cursor).not.toHaveAttribute("x", cursorXBefore!);

  // A second Space press uses the same keyboard path to pause playback.
  await page.keyboard.press("Space");
  await expect(editor.getByRole("button", { name: "Play" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  await expect(cursor).toHaveAttribute("width", "0");
});
