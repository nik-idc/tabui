import { expect, test } from "@playwright/test";

test("Enter confirms from a text field but not from another button", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.getByRole("button", { name: "Tracks", exact: true }).click();
  await editor.getByRole("button", { name: "New track", exact: true }).click();
  const dialog = editor.getByRole("dialog", { name: "New track" });
  const increase = dialog.getByRole("button", {
    name: "Increase string count by 1",
    exact: true,
  });
  await increase.press("Enter");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Raise string 7 by 1 semitone" })
  ).toBeVisible();
  const input = dialog.getByRole("textbox", { name: "Track name" });
  await input.fill("Native track");
  await input.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(
    editor.getByRole("button", {
      name: "Select track: Native track",
      exact: true,
    })
  ).toHaveCount(1);
  await expect(
    editor.getByRole("button", { name: /^Select track:/ })
  ).toHaveCount(2);
  await expect(page).toHaveURL(/\/tabui\/\?fixture=empty$/);
});

test("Enter on a select does not confirm the dialog", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor
    .getByRole("button", { name: "Time Signature", exact: true })
    .click();
  const dialog = editor.getByRole("dialog", { name: "Time signature" });
  const unit = dialog.getByRole("combobox", { name: "Beat unit denominator" });
  await unit.selectOption("8");
  await unit.press("Enter");
  await expect(dialog).toBeVisible();
  await expect(unit).toHaveValue("8");
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await editor
    .getByRole("button", { name: "Time Signature", exact: true })
    .click();
  await expect(unit).toHaveValue("8");
});

test("Enter validates and confirms a repeat count", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const opener = editor.getByRole("button", {
    name: "Repeat End",
    exact: true,
  });
  await opener.click();
  const dialog = editor.getByRole("dialog", { name: "Repeat count" });
  const input = dialog.getByRole("spinbutton");
  await input.fill("1.5");
  await input.press("Enter");
  await expect(
    dialog.getByText("Invalid repeat count", { exact: true })
  ).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Confirm" })).toBeDisabled();
  await input.fill("4");
  await input.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(editor.locator('[id^="bar-rep-count-"]')).toHaveText("x4");
});

test("keeps one announcement region inside the active modal before focus", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.getByRole("button", { name: "Tracks", exact: true }).click();
  const opener = editor.getByRole("button", { name: "New track", exact: true });
  const dialog = editor.getByRole("dialog", { name: "New track" });
  const region = editor.getByRole("status");
  await expect(editor.locator('[role="status"], [aria-live]')).toHaveCount(1);
  await expect(region).toHaveCount(1);
  await expect(region).toHaveText("");
  await expect(region).toHaveAttribute("role", "status");
  await expect(region).toHaveAttribute("aria-live", "polite");
  await expect(region).toHaveAttribute("aria-atomic", "true");
  await expect(region).not.toHaveAttribute("hidden");
  await expect(region).toHaveCSS("position", "absolute");
  await expect(region).toHaveCSS("width", "1px");
  await expect(region).toHaveCSS("height", "1px");
  await expect(region).toHaveCSS("overflow", "hidden");
  await expect(region).toHaveCSS("clip-path", "inset(50%)");
  // Observe accessibility placement at focus time, while browser actions below
  // open and close the dialog through the visible controls.
  const observations = await editor.evaluateHandle((root) => {
    const status = root.querySelector('[role="status"]');
    if (status === null) throw Error("Expected editor status region");
    const result = {
      modalFocus: [] as boolean[],
      openerFocus: [] as boolean[],
    };
    root.addEventListener("focusin", (event) => {
      const target = event.target as Element;
      const modal = target.closest('[aria-modal="true"]');
      if (modal) {
        result.modalFocus.push(
          modal.contains(status) && !status.closest("[inert]")
        );
      }
      if (target.getAttribute("aria-label") === "New track") {
        result.openerFocus.push(status.parentElement === root);
      }
    });
    return result;
  });
  for (let cycle = 0; cycle < 2; cycle++) {
    await opener.click();
    await expect(dialog.getByRole("status")).toHaveCount(1);
    const raise = dialog.getByRole("button", {
      name: "Raise string 1 by 1 semitone",
      exact: true,
    });
    await raise.focus();
    await expect(region).toHaveText("String 1: E");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(region).toHaveCount(1);
    expect(await region.evaluate((node) => node.parentElement?.id)).toBe(
      "tabui-editor"
    );
  }
  const result = await observations.jsonValue();
  expect(result.modalFocus.length).toBeGreaterThanOrEqual(2);
  expect(result.modalFocus).not.toContain(false);
  expect(result.openerFocus.length).toBeGreaterThanOrEqual(2);
  expect(result.openerFocus).not.toContain(false);
  await observations.dispose();
  await expect(editor.locator('[role="status"], [aria-live]')).toHaveCount(1);
});

test("contains modal behavior within the editor", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.getByRole("button", { name: "Tracks", exact: true }).click();
  const opener = editor.getByRole("button", { name: "New track", exact: true });
  await opener.click();

  const dialog = editor.getByRole("dialog", { name: "New track" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  const rootBounds = await editor.boundingBox();
  expect(rootBounds).not.toBeNull();
  expect(await dialog.boundingBox()).toEqual(rootBounds);
  // Hidden accessibility-tree controls must still exist and be inert.
  const tracks = editor.getByRole("button", {
    name: "Tracks",
    exact: true,
    includeHidden: true,
  });
  expect(
    await tracks.evaluate((node) => node.closest("[inert]") !== null)
  ).toBe(true);

  // Use real host-page UI to prove that editor-local modality does not block it.
  const about = page.getByText("About this demo", { exact: true });
  const description = page.getByText("This is a demo of TabUI.", {
    exact: false,
  });
  await expect(description).toBeVisible();
  await about.click();
  await expect(description).toBeHidden();
  await expect(dialog).toBeVisible();
  await about.click();
  await expect(description).toBeVisible();
  await dialog
    .getByRole("button", { name: "Cancel", exact: true })
    .scrollIntoViewIfNeeded();
  expect(await dialog.boundingBox()).toEqual(await editor.boundingBox());
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    editor.getByRole("button", { name: "Tracks", exact: true })
  ).toBeVisible();
  expect(
    await tracks.evaluate((node) => node.closest("[inert]") !== null)
  ).toBe(false);
});

test("traps focus and closes with Escape", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.getByRole("button", { name: "Tracks", exact: true }).click();
  const opener = editor.getByRole("button", { name: "New track", exact: true });
  await opener.click();

  const dialog = editor.getByRole("dialog", { name: "New track" });
  const first = dialog.getByRole("button", { name: "Strings", exact: true });
  const last = dialog.getByRole("button", { name: "Cancel", exact: true });
  await expect(first).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Orchestra", exact: true })
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(first).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();

  await dialog
    .getByRole("textbox", { name: "Track name" })
    .fill("Discarded draft");
  await page.keyboard.press("Escape");

  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(
    editor.getByRole("button", { name: /^Select track:/ })
  ).toHaveCount(1);
  await opener.click();
  await expect(first).toBeFocused();
  // A backdrop click is distinct from a click on the form's controls.
  await dialog.click({ position: { x: 2, y: 2 } });
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(
    editor.getByRole("button", { name: /^Select track:/ })
  ).toHaveCount(1);
});

test("implements the instance dialog method contract", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const result = await page.evaluate(async (workspace) => {
    const path = `/tabui/@fs${workspace}/tests/e2e/dialog-fixture.ts`;
    const { createDialogFixture } = (await import(
      path
    )) as typeof import("./dialog-fixture");
    const fixture = createDialogFixture();
    const modal = fixture.first.dialog;
    const element = fixture.first.template.dialogContainer;
    const events: string[] = [];
    element.addEventListener("cancel", (event) => {
      events.push(`cancel:${event.cancelable}`);
    });
    element.addEventListener("close", () => {
      events.push(`close:${modal.returnValue}`);
    });
    const preventFirstClose = (event: Event) => {
      event.preventDefault();
      element.removeEventListener("cancel", preventFirstClose);
    };
    element.addEventListener("cancel", preventFirstClose);

    modal.showModal();
    modal.requestClose("blocked");
    const stayedOpen = modal.open;
    const blockedValue = modal.returnValue;
    modal.requestClose("accepted");
    const closedValue = modal.returnValue;
    modal.open = true;
    const status = element.querySelector('[role="status"]');
    if (status === null) throw Error("Expected dialog status region");
    const modeless =
      modal.open &&
      !element.hasAttribute("aria-modal") &&
      getComputedStyle(element).display !== "none" &&
      element.getClientRects().length > 0;
    const focused = document.activeElement;
    const observer = new MutationObserver(() => {});
    observer.observe(fixture.root, {
      subtree: true,
      attributes: true,
      childList: true,
      characterData: true,
    });
    let focusEvents = 0;
    fixture.root.addEventListener("focusin", () => focusEvents++);
    modal.show();
    modal.open = true;
    const repeatedShow = {
      mutations: observer.takeRecords().length,
      focusEvents,
      sameFocus: document.activeElement === focused,
    };
    observer.disconnect();
    let crossModeError = "";
    try {
      modal.showModal();
    } catch (error) {
      crossModeError = error instanceof DOMException ? error.name : "unknown";
    }
    modal.close("complete");
    modal.close("stale");
    modal.requestClose("stale");
    modal.open = true;
    modal.open = false;

    const result = {
      events,
      stayedOpen,
      blockedValue,
      closedValue,
      modeless,
      modelessRegionRestored:
        status.parentElement === element.closest(".tu-editor"),
      crossModeError,
      finalValue: modal.returnValue,
      finalOpen: modal.open,
      closedHidden: getComputedStyle(element).display === "none",
      repeatedShow,
    };
    fixture.dispose();
    return result;
  }, process.cwd());

  expect(result).toEqual({
    events: ["cancel:true", "cancel:true", "close:accepted", "close:complete"],
    stayedOpen: true,
    blockedValue: "",
    closedValue: "accepted",
    modeless: true,
    modelessRegionRestored: true,
    crossModeError: "InvalidStateError",
    finalValue: "complete",
    finalOpen: false,
    closedHidden: true,
    repeatedShow: { mutations: 0, focusEvents: 0, sameFocus: true },
  });
});

for (const mode of ["show", "showModal"] as const) {
  for (const nextMode of ["show", "showModal", "open"] as const) {
    test(`rejects ${nextMode} during ${mode} without side effects`, async ({
      page,
    }) => {
      await page.goto("/tabui/?fixture=empty");
      const result = await page.evaluate(
        async ({ mode, nextMode, workspace }) => {
          const path = `/tabui/@fs${workspace}/tests/e2e/dialog-fixture.ts`;
          const { createDialogFixture } = (await import(
            path
          )) as typeof import("./dialog-fixture");
          const fixture = createDialogFixture();
          const { root } = fixture;
          const first = fixture.first.dialog;
          const second = fixture.second.dialog;
          const status = root.querySelector('[role="status"]');
          if (status === null) throw Error("Expected dialog status region");
          first[mode]();
          const focus = document.activeElement;
          let focusEvents = 0;
          root.addEventListener("focusin", () => focusEvents++);
          const observer = new MutationObserver(() => {});
          observer.observe(root, {
            subtree: true,
            attributes: true,
            childList: true,
            characterData: true,
          });
          first[mode]();
          let crossModeError = "";
          try {
            first[mode === "show" ? "showModal" : "show"]();
          } catch (error) {
            crossModeError =
              error instanceof DOMException ? error.name : "unknown";
          }
          let errorName = "";
          try {
            if (nextMode === "open") second.open = true;
            else second[nextMode]();
          } catch (error) {
            if (error instanceof DOMException) {
              errorName = error.name;
            }
          }
          const mutations = observer.takeRecords().length;
          observer.disconnect();
          const result = {
            errorName,
            crossModeError,
            mutations,
            focusEvents,
            sameFocus: document.activeElement === focus,
            sameRegion:
              status.parentElement === fixture.first.template.dialogContainer,
            firstOpen: first.open,
            secondOpen: second.open,
          };
          first.close();
          if (nextMode === "open") second.open = true;
          else second[nextMode]();
          const secondOpenedAfterRelease = second.open;
          second.close();
          fixture.dispose();
          return { ...result, secondOpenedAfterRelease };
        },
        { mode, nextMode, workspace: process.cwd() }
      );
      expect(result).toEqual({
        errorName: "InvalidStateError",
        crossModeError: "InvalidStateError",
        mutations: 0,
        focusEvents: 0,
        sameFocus: true,
        sameRegion: true,
        firstOpen: true,
        secondOpen: false,
        secondOpenedAfterRelease: true,
      });
    });
  }

  test(`releases ${mode} ownership and restores editor controls`, async ({
    page,
  }) => {
    await page.goto("/tabui/?fixture=empty");
    const results = await page.evaluate(
      async ({ mode, workspace }) => {
        const path = `/tabui/@fs${workspace}/tests/e2e/dialog-fixture.ts`;
        const { createDialogFixture } = (await import(
          path
        )) as typeof import("./dialog-fixture");
        const fixture = createDialogFixture();
        const { root } = fixture;
        const first = fixture.first.dialog;
        const second = fixture.second.dialog;
        const host = fixture.shell.template.dialogHost;
        const status = root.querySelector('[role="status"]');
        const siblings = Array.from(root.children).filter(
          (child): child is HTMLElement =>
            child instanceof HTMLElement && child !== host && child !== status
        );
        const original = siblings.map((child) => child.inert);
        const results = [];
        const closeMethods = [
          "close",
          "open",
          "requestClose",
          "closeOpenDialogs",
        ];
        for (const close of closeMethods) {
          first[mode]();
          const inertWhileOpen = siblings.map((child) => child.inert);
          fixture.first.template.dialogContainer.addEventListener(
            "cancel",
            (event) => event.preventDefault(),
            {
              once: true,
            }
          );
          first.requestClose("blocked");
          let retainedOwnership = false;
          try {
            second.show();
          } catch (error) {
            retainedOwnership =
              error instanceof DOMException &&
              error.name === "InvalidStateError";
          }
          if (close === "open") first.open = false;
          else if (close === "close") first.close();
          else if (close === "closeOpenDialogs") fixture.ui.closeOpenDialogs();
          else first.requestClose();
          const restored = siblings.map((child) => child.inert);
          second[mode]();
          first.close("stale");
          first.requestClose("stale");
          first.open = false;
          let staleCloseRetainedOwnership = false;
          try {
            first.show();
          } catch (error) {
            staleCloseRetainedOwnership =
              error instanceof DOMException &&
              error.name === "InvalidStateError";
          }
          const reused =
            second.open &&
            status?.parentElement === fixture.second.template.dialogContainer;
          second.close();
          results.push({
            retainedOwnership,
            staleCloseRetainedOwnership,
            correctInert: inertWhileOpen.every(
              (inert, index) =>
                inert === (mode === "showModal" || original[index])
            ),
            restored: restored.every(
              (inert, index) => inert === original[index]
            ),
            reused,
          });
        }
        fixture.dispose();
        return results;
      },
      { mode, workspace: process.cwd() }
    );
    expect(results).toEqual(
      Array(4).fill({
        retainedOwnership: true,
        staleCloseRetainedOwnership: true,
        correctInert: true,
        restored: true,
        reused: true,
      })
    );
  });
}

test("keeps dialogs in separate editors independent", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const otherEditor = await page.evaluateHandle(async (workspace) => {
    const editorPath = `/tabui/@fs${workspace}/src/tabui-editor.ts`;
    const fixturePath = "/tabui/data/fixture.ts";
    const { TabUIEditor: editorClass } = (await import(
      editorPath
    )) as typeof import("../../src/tabui-editor");
    const { resolveEditorFixture } = await import(fixturePath);
    const otherRoot = document.createElement("div");
    otherRoot.id = "other-editor";
    document.body.appendChild(otherRoot);
    const otherEditor = new editorClass(
      otherRoot,
      resolveEditorFixture(new URLSearchParams("fixture=empty"))
    );
    otherEditor.init();
    return otherEditor;
  }, process.cwd());
  const primary = page.locator("#tabui-editor");
  const other = page.locator("#other-editor");
  const first = primary.getByRole("dialog", { name: "New track" });
  const second = other.getByRole("dialog", { name: "New track" });
  const opener = primary.getByRole("button", {
    name: "New track",
    exact: true,
  });
  const otherOpener = other.getByRole("button", {
    name: "New track",
    exact: true,
  });

  // Both editors must work independently before testing isolation.
  for (const [index, editor] of [primary, other].entries()) {
    await editor.getByRole("button", { name: "Tracks", exact: true }).click();
    await editor
      .getByRole("button", { name: "New track", exact: true })
      .click();
    const dialog = editor.getByRole("dialog", { name: "New track" });
    const name = dialog.getByRole("textbox", { name: "Track name" });
    await name.fill(`Before ${index}`);
    await name.press("Enter");
    await expect(dialog).toHaveCount(0);
    await expect(
      editor.getByRole("button", { name: `Select track: Before ${index}` })
    ).toBeVisible();
    await expect(
      editor.getByRole("button", { name: /^Select track:/ })
    ).toHaveCount(2);
  }

  await opener.click();
  await otherOpener.click();
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  await expect(first.getByRole("status")).toHaveCount(1);
  await expect(second.getByRole("status")).toHaveCount(1);

  // A real Escape in one editor must not cancel the other editor's draft.
  const firstName = first.getByRole("textbox", { name: "Track name" });
  const secondName = second.getByRole("textbox", { name: "Track name" });
  await secondName.fill("Other preserved draft");
  await firstName.fill("Primary discarded draft");
  await firstName.press("Escape");
  await expect(first).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(second).toBeVisible();
  await expect(secondName).toHaveValue("Other preserved draft");
  await expect(second.getByRole("status")).toHaveCount(1);
  await secondName.press("Enter");
  await expect(second).toHaveCount(0);
  await expect(otherOpener).toBeFocused();

  // Closing either modal leaves both editors usable.
  for (const [index, editor] of [primary, other].entries()) {
    await editor
      .getByRole("button", { name: "New track", exact: true })
      .click();
    const dialog = editor.getByRole("dialog", { name: "New track" });
    const name = dialog.getByRole("textbox", { name: "Track name" });
    await name.fill(`After ${index}`);
    await name.press("Enter");
    await expect(dialog).toHaveCount(0);
    await expect(
      editor.getByRole("button", { name: `Select track: After ${index}` })
    ).toBeVisible();
  }
  await expect(
    primary.getByRole("button", { name: /^Select track:/ })
  ).toHaveCount(3);
  await expect(
    other.getByRole("button", { name: /^Select track:/ })
  ).toHaveCount(4);

  await opener.click();
  await firstName.fill("Survives other editor disposal");
  await otherOpener.click();
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  await otherEditor.evaluate((editor) => editor.dispose());
  await expect(second).toHaveCount(0);
  await expect(first).toBeVisible();
  await expect(firstName).toHaveValue("Survives other editor disposal");
  await expect(first.getByRole("status")).toHaveCount(1);
  await firstName.press("Enter");
  await expect(first).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(
    primary.getByRole("button", {
      name: "Select track: Survives other editor disposal",
      exact: true,
    })
  ).toBeVisible();
  await expect(
    primary.getByRole("button", { name: /^Select track:/ })
  ).toHaveCount(4);
  await otherEditor.dispose();
});
