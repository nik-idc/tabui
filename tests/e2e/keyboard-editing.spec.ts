import { expect, test, type Locator, type Page } from "@playwright/test";

/** Loads the editable fixture and gives notation keyboard ownership. */
async function openEditor(page: Page, fixture = "empty") {
  await page.goto(`/tabui/?fixture=${fixture}`);
  const editor = page.locator("#tabui-editor");
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  return editor;
}

/** Captures rendered score content and editing states without model access. */
async function editingState(editor: Locator) {
  return editor.evaluate((root) => ({
    score: Array.from(
      root.querySelectorAll(
        ".tu-root-svg :is(text, path, line, circle, image, use)"
      )
    )
      .map((element) => ({
        tag: element.tagName,
        text: element.textContent,
        attributes: Array.from(element.attributes)
          .filter((attribute) => attribute.name !== "id")
          .map((attribute) => [attribute.name, attribute.value])
          .sort(),
      }))
      .sort((left, right) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right))
      ),
    pressed: Array.from(root.querySelectorAll("button[aria-pressed]"))
      .filter(
        (button) =>
          button.getAttribute("aria-pressed") === "true" &&
          !button.closest(".tu-dialog")
      )
      .map((button) => button.getAttribute("aria-label")),
  }));
}

/** Compares a shortcut with its mouse action from the same undo checkpoint. */
async function expectMouseParity(
  page: Page,
  editor: Locator,
  key: string,
  button: Locator
) {
  const notation = editor.locator(".tu-notation-viewport");
  const before = await editingState(editor);
  await notation.focus();
  await page.keyboard.press(key);
  const keyboard = await editingState(editor);
  expect(keyboard).not.toEqual(before);
  await page.keyboard.press("Control+z");
  expect(await editingState(editor)).toEqual(before);
  await button.click();
  expect(await editingState(editor)).toEqual(keyboard);
}

for (const [key, name] of [
  ["v", "Vibrato"],
  ["p", "Palm Mute"],
  ["Shift+L", "Let Ring"],
  ["h", "Nat. Harmonic"],
  ["Shift+H", "Pinch Harmonic"],
  ["Shift+X", "Quarter rest"],
  ["r", "Repeat Start"],
  ["a", "Insert beat after"],
  ["Shift+A", "Insert beat before"],
  ["i", "Insert bar after"],
  ["Shift+I", "Insert bar before"],
]) {
  test(`${key} matches ${name} and is undoable`, async ({ page }) => {
    const editor = await openEditor(page);
    await page.keyboard.press("5");
    await expectMouseParity(
      page,
      editor,
      key,
      editor.getByRole("button", { name: new RegExp(`^${name}`) })
    );
  });
}

for (const [key, name, dialogName] of [
  ["b", "Bend", "Bend"],
  ["Shift+T", "Custom tuplet", "Tuplet"],
  ["Shift+R", "Repeat End", "Repeat count"],
  ["m", "Tempo", "Tempo"],
  ["Shift+M", "Time Signature", "Time signature"],
]) {
  test(`${key} opens the same dialog as ${name}`, async ({ page }) => {
    const editor = await openEditor(page);
    await page.keyboard.press("5");
    const before = await editingState(editor);
    await page.keyboard.press(key);
    const dialog = editor.getByRole("dialog", {
      name: dialogName,
      exact: true,
    });
    await expect(dialog).toBeVisible();
    const keyboardText = await dialog.textContent();
    await page.keyboard.press("Escape");
    await expect(editor.locator(".tu-notation-viewport")).toBeFocused();
    await editor.getByRole("button", { name: new RegExp(`^${name}`) }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveText(keyboardText!);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    expect(await editingState(editor)).toEqual(before);
  });
}

test("cycles duration, dots, and tuplets like the mouse controls", async ({
  page,
}) => {
  const editor = await openEditor(page);
  for (const [key, selector] of [
    ["-", '[data-duration="8"]'],
    ["+", '[data-duration="4"]'],
    [".", '[data-dot="1"]'],
    [".", '[data-dot="2"]'],
    [".", '[data-dot="2"]'],
    ["t", '[data-tuplet="2"]'],
    ["t", '[data-tuplet="3"]'],
    ["t", '[data-tuplet="3"]'],
  ]) {
    await expectMouseParity(page, editor, key, editor.locator(selector));
  }
  for (const [key, duration] of [
    ["-", "64"],
    ["+", "1"],
  ]) {
    await editor.locator(`[data-duration="${duration}"]`).click();
    await editor.locator(".tu-notation-viewport").focus();
    const before = await editingState(editor);
    await page.keyboard.press(key);
    expect(await editingState(editor)).toEqual(before);
  }
});

test("custom tuplets cycle to none and undo restores the custom ratio", async ({
  page,
}) => {
  const editor = await openEditor(page);
  await page.keyboard.press("Shift+T");
  const dialog = editor.getByRole("dialog", { name: "Tuplet", exact: true });
  await dialog
    .getByRole("button", { name: "Increase normal notes by 1" })
    .click();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(editor.locator('[data-tuplet="0"]')).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  const custom = await editingState(editor);
  await page.keyboard.press("t");
  await expect(
    editor.locator('[data-tuplet][aria-pressed="true"]')
  ).toHaveCount(0);
  await page.keyboard.press("Control+z");
  expect(await editingState(editor)).toEqual(custom);
  await page.keyboard.press("t");
  await page.keyboard.press("t");
  await expect(editor.locator('[data-tuplet="2"]')).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

for (const reverse of [false, true]) {
  test(`mixed range cycles from its ${reverse ? "left" : "right"} active end`, async ({
    page,
  }) => {
    const editor = await openEditor(page);
    await page.keyboard.press("5");
    await page.keyboard.press("a");
    await editor.locator('[data-duration="8"]').click();
    await editor.locator('[data-dot="1"]').click();
    await editor.locator('[data-tuplet="2"]').click();
    await editor.locator(".tu-notation-viewport").focus();
    if (!reverse) await page.keyboard.press("ArrowLeft");
    await page.keyboard.press(reverse ? "Shift+ArrowLeft" : "Shift+ArrowRight");
    await expect(editor.locator(".tu-announcement-host")).toContainText(
      "2 beats selected"
    );
    for (const [key, selector] of [
      ["-", `[data-duration="${reverse ? 8 : 16}"]`],
      [".", `[data-dot="${reverse ? 1 : 2}"]`],
      ["t", `[data-tuplet="${reverse ? 2 : 3}"]`],
      ["p", '[aria-label^="Palm Mute"]'],
      ["Shift+X", '[data-beat-action="rest"]'],
    ]) {
      await expectMouseParity(page, editor, key, editor.locator(selector));
    }
  });
}

for (const [key, name] of [
  ["Delete", "Remove beat"],
  ["Shift+Delete", "Remove bar"],
]) {
  test(`${key} removes a range like the mouse and undo restores it`, async ({
    page,
  }) => {
    const editor = await openEditor(page, "feature_showcase");
    await page.keyboard.press("Shift+ArrowRight");
    const before = (await editingState(editor)).score;
    await page.keyboard.press(key);
    const removed = (await editingState(editor)).score;
    expect(removed).not.toEqual(before);
    await page.keyboard.press("Control+z");
    expect((await editingState(editor)).score).toEqual(before);
    await openEditor(page, "feature_showcase");
    await page.keyboard.press("Shift+ArrowRight");
    await editor.getByRole("button", { name: new RegExp(`^${name}`) }).click();
    expect((await editingState(editor)).score).toEqual(removed);
    await editor.locator(".tu-notation-viewport").focus();
    await page.keyboard.press("Control+z");
    await page.keyboard.press("Control+y");
    expect((await editingState(editor)).score).toEqual(removed);
  });
}

test("Shift+V cycles all four voices without applying vibrato", async ({
  page,
}) => {
  const editor = await openEditor(page, "multi_voice_single_staff");
  /** Captures voice opacity and note hit geometry, including empty strings. */
  async function voicePresentation() {
    return editor
      .locator('.tu-root-svg [id^="note-rect-"]')
      .evaluateAll((rects) =>
        rects
          .map((rect) => ({
            id: rect.id,
            opacity: rect.closest("g[opacity]")?.getAttribute("opacity"),
            pointerEvents: rect.getAttribute("pointer-events"),
            bounds: ["x", "y", "width", "height"].map((name) =>
              rect.getAttribute(name)
            ),
          }))
          .sort((left, right) => left.id.localeCompare(right.id))
      );
  }
  const initial = await voicePresentation();
  expect(initial.length).toBeGreaterThan(0);
  for (const voice of [2, 3, 4, 1]) {
    await page.keyboard.press("Shift+V");
    await expect(
      editor.locator(`[data-voice-number="${voice}"]`)
    ).toHaveAttribute("aria-pressed", "true");
    const keyboard = await editingState(editor);
    const presentation = await voicePresentation();
    if (voice === 2) {
      // Both voices already exist, so no model diff can trigger this refresh.
      expect(presentation.map((note) => note.id)).not.toEqual(
        initial.map((note) => note.id)
      );
      expect(
        initial.some((note) =>
          presentation.some(
            (current) =>
              current.id === note.id && current.opacity !== note.opacity
          )
        )
      ).toBe(true);
    }
    await editor
      .locator(`[data-voice-number="${voice === 1 ? 4 : voice - 1}"]`)
      .click();
    await editor.locator(`[data-voice-number="${voice}"]`).click();
    expect(await editingState(editor)).toEqual(keyboard);
    expect(await voicePresentation()).toEqual(presentation);
    await editor.locator(".tu-notation-viewport").focus();
  }
});

test("rest shortcuts reject dead and clear without changing undo history", async ({
  page,
}) => {
  const editor = await openEditor(page);
  await page.keyboard.press("5");
  const populated = await editingState(editor);
  await page.keyboard.press("Shift+X");
  const rest = await editingState(editor);
  const prevented = await editor
    .locator(".tu-notation-viewport")
    .evaluate((notation) =>
      ["x", "Backspace", "Escape"].map((key) => {
        const event = new KeyboardEvent("keydown", {
          key,
          bubbles: true,
          cancelable: true,
        });
        notation.dispatchEvent(event);
        return event.defaultPrevented;
      })
    );
  expect(prevented).toEqual([false, false, false]);
  expect(await editingState(editor)).toEqual(rest);
  await page.keyboard.press("Control+z");
  expect(await editingState(editor)).toEqual(populated);
  await page.keyboard.press("Control+y");
  expect(await editingState(editor)).toEqual(rest);
});

test("shortcuts do not leak from outside, toolbar, or dialog focus", async ({
  page,
}) => {
  const editor = await openEditor(page);
  await page.keyboard.press("5");
  const before = await editingState(editor);
  for (const target of [
    page.locator("body"),
    page.locator("#fixture-select"),
    editor.getByRole("button", { name: "Play", exact: true }),
  ]) {
    await target.evaluate((element) => element.setAttribute("tabindex", "-1"));
    await target.focus();
    for (const key of ["a", "-", ".", "t", "Shift+X", "Delete"]) {
      await page.keyboard.press(key);
    }
    expect(await editingState(editor)).toEqual(before);
  }
  await editor.locator(".tu-notation-viewport").focus();
  await page.keyboard.press("Shift+R");
  const dialog = editor.getByRole("dialog", { name: "Repeat count" });
  await dialog.getByRole("spinbutton").focus();
  for (const key of ["a", "t", "Shift+X", "Delete"]) {
    await page.keyboard.press(key);
  }
  await expect(dialog).toBeVisible();
  expect(await editingState(editor)).toEqual(before);
});

test("keyboard ownership follows focus between two live editors", async ({
  page,
}) => {
  const editor = await openEditor(page);
  await page.evaluate(async (workspace) => {
    const editorPath = `/tabui/@fs${workspace}/src/tabui-editor.ts`;
    const fixturePath = "/tabui/data/fixture.ts";
    const { TabUIEditor } = (await import(
      editorPath
    )) as typeof import("../../src/tabui-editor");
    const { resolveEditorFixture } = await import(fixturePath);
    const root = document.createElement("div");
    root.id = "other-editor";
    document.body.appendChild(root);
    new TabUIEditor(
      root,
      resolveEditorFixture(new URLSearchParams("fixture=empty"))
    ).init();
  }, process.cwd());
  const other = page.locator("#other-editor");
  const original = await editingState(editor);
  await other.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  await page.keyboard.press("7");
  await page.keyboard.press("p");
  await expect(other.locator('[id^="note-text-"]')).toHaveText("7");
  expect(await editingState(editor)).toEqual(original);
  const otherState = await editingState(other);
  await editor.locator(".tu-notation-viewport").focus();
  await page.keyboard.press("5");
  await page.keyboard.press("Shift+T");
  await expect(editor.getByRole("dialog", { name: "Tuplet" })).toBeVisible();
  await expect(other.getByRole("dialog")).toHaveCount(0);
  expect(await editingState(other)).toEqual(otherState);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+z");
  expect(await editingState(editor)).toEqual(original);
  expect(await editingState(other)).toEqual(otherState);
});

for (const [key, name] of [
  ["l", "Legato"],
  ["s", "Slide"],
]) {
  test(`${key} applies a transition like the mouse`, async ({ page }) => {
    await page.clock.install();
    const editor = await openEditor(page);
    await page.keyboard.press("5");
    await page.keyboard.press("a");
    await page.clock.fastForward(251);
    await page.keyboard.press("7");
    await page.keyboard.press("ArrowLeft");
    await expectMouseParity(
      page,
      editor,
      key,
      editor.getByRole("button", { name: new RegExp(`^${name}`) })
    );
  });
}

for (const [key, name, buttonName, increase] of [
  ["Shift+T", "Tuplet", "Custom tuplet", "Increase normal notes by 1"],
  ["Shift+R", "Repeat count", "Repeat End", "Increase repeat count by 1"],
  ["m", "Tempo", "Tempo", "Increase tempo by 1 BPM"],
  [
    "Shift+M",
    "Time signature",
    "Time Signature",
    "Increase beats per measure by 1",
  ],
]) {
  test(`${key} confirms an undoable edit and returns keyboard ownership`, async ({
    page,
  }) => {
    const editor = await openEditor(page);
    const before = await editingState(editor);
    await page.keyboard.press(key);
    const dialog = editor.getByRole("dialog", { name, exact: true });
    await dialog.getByRole("button", { name: increase, exact: true }).click();
    await dialog.getByRole("button", { name: "Confirm" }).click();
    await expect(editor.locator(".tu-notation-viewport")).toBeFocused();
    const keyboard = await editingState(editor);
    expect(keyboard).not.toEqual(before);
    await page.keyboard.press("Control+z");
    expect(await editingState(editor)).toEqual(before);
    await editor
      .getByRole("button", { name: new RegExp(`^${buttonName}`) })
      .click();
    await dialog.getByRole("button", { name: increase, exact: true }).click();
    await dialog.getByRole("button", { name: "Confirm" }).click();
    expect(await editingState(editor)).toEqual(keyboard);
  });
}

test("ignores composition, prevented events, and unsupported modifiers", async ({
  page,
}) => {
  const editor = await openEditor(page);
  await page.keyboard.press("5");
  const before = await editingState(editor);
  for (const key of [
    "Alt+a",
    "Meta+a",
    "Control+a",
    "Control+Shift+X",
    "Shift+P",
    "Shift+B",
    "Shift+S",
    "Control+-",
    "Control+.",
    "Alt+Shift+T",
  ]) {
    await page.keyboard.press(key);
    expect(await editingState(editor)).toEqual(before);
  }
  const prevented = await editor
    .locator(".tu-notation-viewport")
    .evaluate((notation) => {
      return [
        { isComposing: true },
        { keyCode: 229 },
        { defaultPrevented: true },
      ].map((options) => {
        const event = new KeyboardEvent("keydown", {
          key: "a",
          bubbles: true,
          cancelable: true,
          ...options,
        });
        if (options.defaultPrevented) event.preventDefault();
        notation.dispatchEvent(event);
        return event.defaultPrevented;
      });
    });
  expect(prevented).toEqual([false, false, true]);
  expect(await editingState(editor)).toEqual(before);
});

test("bend confirmation matches mouse and restores notation focus", async ({
  page,
}) => {
  const editor = await openEditor(page);
  await page.keyboard.press("5");
  const before = await editingState(editor);
  await page.keyboard.press("b");
  const dialog = editor.getByRole("dialog", { name: "Bend", exact: true });
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(editor.locator(".tu-notation-viewport")).toBeFocused();
  const keyboard = await editingState(editor);
  expect(keyboard).not.toEqual(before);
  await page.keyboard.press("Control+z");
  expect(await editingState(editor)).toEqual(before);
  await editor.getByRole("button", { name: /^Bend/ }).click();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  expect(await editingState(editor)).toEqual(keyboard);
});

test("view-only mode rejects editing shortcuts but permits navigation", async ({
  page,
}) => {
  const editor = await openEditor(page, "feature_showcase");
  await page.locator("#interaction-mode-select").selectOption("view-only");
  await editor.locator('.tu-root-svg [id^="note-rect-"]').first().click();
  const before = await editingState(editor);
  for (const key of [
    "5",
    "x",
    "Shift+X",
    "Backspace",
    "-",
    "+",
    ".",
    "t",
    "Shift+T",
    "p",
    "b",
    "a",
    "Shift+A",
    "i",
    "Shift+I",
    "Delete",
    "Shift+Delete",
    "r",
    "Shift+R",
    "m",
    "Shift+M",
    "Control+z",
    "Control+y",
  ]) {
    await page.keyboard.press(key);
    expect(await editingState(editor)).toEqual(before);
    await expect(editor.getByRole("dialog")).toHaveCount(0);
  }
  await page.keyboard.press("ArrowRight");
  await expect(editor.locator(".tu-announcement-host")).toContainText("Bar 2");
});

test("disabled techniques and range-only restrictions ignore shortcuts", async ({
  page,
}) => {
  const editor = await openEditor(page);
  const before = await editingState(editor);
  for (const [key, name] of [
    ["v", "Vibrato"],
    ["p", "Palm Mute"],
    ["b", "Bend"],
    ["Shift+L", "Let Ring"],
    ["Shift+H", "Pinch Harmonic"],
    ["h", "Nat. Harmonic"],
    ["l", "Legato"],
    ["s", "Slide"],
  ]) {
    await expect(
      editor.getByRole("button", { name: new RegExp(`^${name}`) })
    ).toBeDisabled();
    await page.keyboard.press(key);
    expect(await editingState(editor)).toEqual(before);
    await expect(editor.getByRole("dialog")).toHaveCount(0);
  }
  await page.keyboard.press("5");
  await page.keyboard.press("a");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Shift+ArrowRight");
  await expect(editor.locator(".tu-announcement-host")).toContainText(
    "2 beats selected"
  );
  await expect(editor.getByRole("button", { name: /^Bend/ })).toBeDisabled();
  const range = await editingState(editor);
  for (const key of ["b", "x", "7", "Backspace", "r", "m"]) {
    await page.keyboard.press(key);
    expect(await editingState(editor)).toEqual(range);
    await expect(editor.getByRole("dialog")).toHaveCount(0);
  }
});
