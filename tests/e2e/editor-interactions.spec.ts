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
  await expect(editor.locator('[id^="note-text-"]')).toHaveText("12");

  // Waiting past the timeout makes the next digit replace the previous fret.
  await page.clock.fastForward(251);
  await page.keyboard.press("3");
  await expect(editor.locator('[id^="note-text-"]')).toHaveText("3");
});

test("clicks an underfilled bar end gap to append and select a beat", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await expect(editor.locator(".tu-root-svg")).toBeVisible();

  const notes = editor.locator('.tu-root-svg [id^="note-rect-"]');
  await notes.first().click();
  await page.keyboard.press("1");
  await expect(editor.locator('[id^="note-text-"]')).toHaveText("1");
  const gap = editor.locator("[data-bar-end-gap-uuid]");
  await expect(gap).toHaveCount(1);
  const hint = editor.locator(".tu-end-gap-hint");
  await expect(hint).toHaveText("+");
  await expect(hint).toBeHidden();
  await gap.hover();
  await expect(hint).toBeVisible();
  await notes.first().hover();
  await expect(hint).toBeHidden();
  await gap.click();
  await expect(editor.locator("[data-beat-uuid]")).toHaveCount(2);

  await page.keyboard.press("7");
  await expect(editor.locator('[id^="note-text-"]')).toHaveText(["1", "7"]);

  const beats = editor.locator("[data-beat-uuid]");
  const firstBeat = await beats.nth(0).boundingBox();
  const secondBeat = await beats.nth(1).boundingBox();
  expect(firstBeat).not.toBeNull();
  expect(secondBeat).not.toBeNull();
  if (firstBeat === null || secondBeat === null)
    throw Error("Expected beat bounds");
  await page.mouse.move(firstBeat.x + firstBeat.width / 2, firstBeat.y + 10);
  await page.mouse.down();
  await page.mouse.move(secondBeat.x + secondBeat.width / 2, secondBeat.y + 10);
  const gapBounds = await gap.boundingBox();
  expect(gapBounds).not.toBeNull();
  if (gapBounds === null) throw Error("Expected gap bounds");
  await page.mouse.move(
    gapBounds.x + gapBounds.width / 2,
    gapBounds.y + gapBounds.height / 2
  );
  await page.mouse.up();
  await expect(beats).toHaveCount(2);
  await gap.click();
  await expect(beats).toHaveCount(3);

  await gap.click();
  await expect(editor.locator("[data-bar-end-gap-uuid]")).toHaveCount(0);
  await expect(hint).toHaveCount(0);
  await expect(editor.locator("[data-beat-uuid]")).toHaveCount(4);
});

for (const layoutMode of ["wrapped", "single-line"] as const) {
  test(`appends a bar from the final-bar plus in ${layoutMode} mode`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 720 });
    const layoutQuery =
      layoutMode === "single-line" ? "&layoutMode=single-line" : "";
    await page.goto(`/tabui/?fixture=empty${layoutQuery}`);
    const editor = page.locator("#tabui-editor");
    await expect(editor.locator(".tu-root-svg")).toBeVisible();

    const append = editor.locator("rect.tu-append-bar");
    await expect(append).toHaveCount(1);
    const appendText = editor.locator("text.tu-append-bar");
    await expect(appendText).toBeHidden();
    await append.hover();
    await expect(appendText).toBeVisible();

    // Put the final bar on a later wrapped line and far to the right in single-line mode.
    for (let index = 0; index < 4; index += 1) {
      await append.click();
      await expect(editor.locator('g[id^="bar-"]')).toHaveCount(index + 2);
    }

    const bounds = await append.boundingBox();
    const rootBounds = await editor.locator(".tu-root-svg").boundingBox();
    expect(bounds).not.toBeNull();
    expect(rootBounds).not.toBeNull();
    if (bounds === null || rootBounds === null) {
      throw Error("Expected append affordance bounds");
    }
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(
      rootBounds.x + rootBounds.width + 1
    );

    const finalBar = editor.locator('g[id^="bar-"]').last();
    const finalBorder = await finalBar
      .locator('[id^="bar-border-"]')
      .last()
      .boundingBox();
    expect(finalBorder).not.toBeNull();
    if (finalBorder === null) throw Error("Expected final bar border bounds");
    expect(Math.abs(bounds.x - finalBorder.x)).toBeLessThan(1);

    const bars = editor.locator('g[id^="bar-"]');
    await append.click();
    await expect(bars).toHaveCount(6);
    await expect(editor.locator("rect.tu-append-bar")).toHaveCount(1);
    await page.keyboard.press("7");
    await expect(editor.locator('[id^="note-text-"]')).toHaveText("7");
  });
}

test("suppresses editing feedback during playback and restores it after stopping", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.locator('[id^="note-rect-"]').first().click();
  await page.keyboard.press("5");
  await page.keyboard.press("-");
  await page.keyboard.press("a");
  await page.keyboard.press("6");
  await editor.locator('[data-duration="8"]').click();
  const gap = editor.locator("[data-bar-end-gap-uuid]");
  const hint = editor.locator(".tu-end-gap-hint");
  const rootSvg = editor.locator("svg.tu-root-svg");
  const append = editor.locator("rect.tu-append-bar");
  const appendText = editor.locator("text.tu-append-bar");
  await expect(gap).toHaveCount(1);
  await expect(append).toHaveCount(1);

  await gap.hover();
  await expect(hint).toBeVisible();
  await append.hover();
  await expect(appendText).toBeVisible();
  const tempoHitArea = editor.locator(".tu-tempo-hit-area").first();
  const beamHitArea = editor.locator(".tu-beam-hit").first();
  const tempoSymbol = editor.locator(".tu-tempo-symbol").first();
  const beamVisible = editor.locator(".tu-beam-visible").first();
  await expect(tempoHitArea).toHaveCount(1);
  await expect(beamHitArea).toHaveCount(1);

  const moveToCenter = async (target: typeof tempoHitArea) => {
    await target.scrollIntoViewIfNeeded();
    const bounds = await target.boundingBox();
    expect(bounds).not.toBeNull();
    if (bounds === null) {
      throw Error("Expected notation editing hit target bounds");
    }
    await page.mouse.move(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2
    );
  };
  await moveToCenter(tempoHitArea);
  const hoveredTempoFill = await tempoSymbol.evaluate(
    (element) => getComputedStyle(element).fill
  );
  // Keep the small score playing while all disabled targets are exercised.
  await editor.getByRole("button", { name: "Loop", exact: true }).click();
  await editor.getByRole("button", { name: "Play", exact: true }).focus();
  await moveToCenter(beamHitArea);
  const hoveredBeamFill = await beamVisible.evaluate(
    (element) => getComputedStyle(element).fill
  );

  // Start without moving off the beam, so an existing group highlight is covered.
  await page.keyboard.press("Enter");
  await expect(editor.getByRole("button", { name: "Pause" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(rootSvg).toHaveAttribute("data-playback-active", "true");
  await gap.hover();
  await expect(hint).toBeHidden();
  await moveToCenter(append);
  await expect(appendText).toBeHidden();
  await expect(append).toHaveCSS("pointer-events", "none");
  await moveToCenter(tempoHitArea);
  await expect(tempoSymbol).not.toHaveCSS("fill", hoveredTempoFill);
  await moveToCenter(beamHitArea);
  await expect(beamVisible).not.toHaveCSS("fill", hoveredBeamFill);

  await editor.getByRole("button", { name: "Pause" }).click();
  await expect(
    editor.getByRole("button", { name: "Play", exact: true })
  ).toHaveAttribute("aria-pressed", "false");
  await expect(rootSvg).toHaveAttribute("data-playback-active", "false");
  await expect(beamVisible).not.toHaveCSS("fill", hoveredBeamFill);
  await gap.hover();
  await expect(hint).toBeVisible();
  await append.hover();
  await expect(appendText).toBeVisible();
  await moveToCenter(tempoHitArea);
  await expect(tempoSymbol).toHaveCSS("fill", hoveredTempoFill);
  await moveToCenter(beamHitArea);
  await expect(beamVisible).toHaveCSS("fill", hoveredBeamFill);
});

for (const fixture of ["empty", "feature_showcase"] as const) {
  test(`centers the end-gap hint on staff lines: ${fixture}`, async ({
    page,
  }) => {
    await page.goto(`/tabui/?fixture=${fixture}`);
    const editor = page.locator("#tabui-editor");
    if (fixture === "feature_showcase") {
      await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();
      await page.keyboard.press("Delete");
    }
    const gap = editor.locator("[data-bar-end-gap-uuid]").first();
    await expect(gap).toBeVisible();
    await gap.hover();

    const geometry = await editor.evaluate((root) => {
      const gapElement = root.querySelector<SVGRectElement>(
        "[data-bar-end-gap-uuid]"
      );
      const hint = root.querySelector<SVGTextElement>(".tu-end-gap-hint");
      if (gapElement === null || hint === null) {
        throw Error("End-gap geometry is missing");
      }
      const uuid = gapElement.dataset["barEndGapUuid"];
      const firstLine = root.querySelector<SVGLineElement>(
        `[id="bar-staff-${uuid}-0"]`
      );
      const lastLine = root.querySelectorAll<SVGLineElement>(
        `[id^="bar-staff-${uuid}-"]`
      );
      if (firstLine === null || lastLine.length === 0) {
        throw Error("Bar staff geometry is missing");
      }
      const firstY = firstLine.getBoundingClientRect().top;
      const lastY = lastLine[lastLine.length - 1].getBoundingClientRect().top;
      const hintBounds = hint.getBoundingClientRect();
      const gapBounds = gapElement.getBoundingClientRect();
      return {
        staffCenter: (firstY + lastY) / 2,
        hintCenter: hintBounds.top + hintBounds.height / 2,
        targetCenterX: gapBounds.left + gapBounds.width / 2,
        hintCenterX: hintBounds.left + hintBounds.width / 2,
      };
    });

    expect(Math.abs(geometry.hintCenter - geometry.staffCenter)).toBeLessThan(
      1
    );
    expect(
      Math.abs(geometry.hintCenterX - geometry.targetCenterX)
    ).toBeLessThan(1);
  });
}

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

  const announcement = editor.getByRole("status");
  await expect(announcement).toHaveAttribute("aria-live", "polite");
  await expect(announcement).toHaveAttribute("aria-atomic", "true");
  await page.clock.runFor(100);
  const observation = await announcement.evaluateHandle((element) => {
    const state = {
      mutations: 0,
      observer: new MutationObserver((records) => {
        state.mutations += records.length;
      }),
    };
    state.observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return state;
  });
  try {
    await page.keyboard.press("5");
    await expect(announcement).toHaveText(
      /Track .*Staff .*Bar .*Beat .*String 1, fret 5\./
    );
    // Finish the first edit and digit window before observing the unchanged edit.
    await page.clock.runFor(300);
    const changedMutations = await observation.evaluate((state) => {
      const count = state.mutations + state.observer.takeRecords().length;
      state.mutations = 0;
      return count;
    });
    expect(changedMutations).toBeGreaterThan(0);

    await page.keyboard.press("5");
    // Include animation frames and any delayed clear-and-reinsert announcement.
    await page.clock.runFor(100);
    const mutations = await observation.evaluate(
      (state) => state.mutations + state.observer.takeRecords().length
    );
    expect(mutations).toBe(0);
    await expect(editor.locator('[id^="note-text-"]')).toHaveText("5");
  } finally {
    await observation.evaluate((state) => state.observer.disconnect());
    await observation.dispose();
  }
});

test("keeps concise arrow announcements after the automatic flush", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/tabui/?fixture=feature_showcase");
  const editor = page.locator("#tabui-editor");
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  await page.keyboard.press("ArrowRight");
  await page.clock.runFor(100);

  await expect(editor.locator(".tu-announcement-host")).toHaveText(
    "Beat 2, quarter, String 1, empty."
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
        const cursor = element.querySelector("#playerCursor");
        if (cursor === null) throw Error("Expected playback cursor");
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
  await editor.getByRole("button", { name: "Play", exact: true }).click();
  const movement = await page.evaluate(async () => {
    const result = await (window as any).__tabuiPlaybackMovement;
    delete (window as any).__tabuiPlaybackMovement;
    return result;
  });
  expect(movement.visible).toBe(true);
  expect(movement.pressed).toBe("true");
  expect(movement.after).toBeGreaterThan(movement.before);

  await expect(
    editor.getByRole("button", { name: "Play", exact: true })
  ).toHaveAttribute("aria-pressed", "false");
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
  if (cursorXBefore === null) throw Error("Expected playback cursor position");
  await expect(cursor).not.toHaveAttribute("x", cursorXBefore);

  // A second Space press uses the same keyboard path to pause playback.
  await page.keyboard.press("Space");
  await expect(
    editor.getByRole("button", { name: "Play", exact: true })
  ).toHaveAttribute("aria-pressed", "false");
  await expect(cursor).toHaveAttribute("width", "0");
});
