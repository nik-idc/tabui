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
    let cancelCount = 0;
    element.addEventListener("cancel", () => {
      cancelCount += 1;
    });
    const preventFirstClose = (event: Event) => {
      event.preventDefault();
      element.removeEventListener("cancel", preventFirstClose);
    };
    element.addEventListener("cancel", preventFirstClose);

    modal.showModal();
    modal.requestClose("blocked");
    const stayedOpen = modal.open;
    modal.requestClose("accepted");
    const closedValue = modal.returnValue;
    modal.show();
    const status = element.querySelector('[role="status"]');
    if (status === null) throw Error("Expected dialog status region");
    const modeless =
      modal.open &&
      !element.hasAttribute("aria-modal") &&
      element.dataset.tuDialogMode === "nonmodal";
    modal.show();
    let crossModeError = "";
    try {
      modal.showModal();
    } catch (error) {
      crossModeError = error instanceof DOMException ? error.name : "unknown";
    }
    modal.close("complete");

    const result = {
      methods: [
        typeof modal.show,
        typeof modal.showModal,
        typeof modal.close,
        typeof modal.requestClose,
      ],
      cancelCount,
      stayedOpen,
      closedValue,
      modeless,
      modelessRegionRestored:
        status.parentElement === element.closest(".tu-editor"),
      crossModeError,
      finalValue: modal.returnValue,
    };
    fixture.dispose();
    return result;
  }, process.cwd());

  expect(result).toEqual({
    methods: ["function", "function", "function", "function"],
    cancelCount: 2,
    stayedOpen: true,
    closedValue: "accepted",
    modeless: true,
    modelessRegionRestored: true,
    crossModeError: "InvalidStateError",
    finalValue: "complete",
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
          let errorName = "";
          let errorMessage = "";
          try {
            if (nextMode === "open") second.open = true;
            else second[nextMode]();
          } catch (error) {
            if (error instanceof DOMException) {
              errorName = error.name;
              errorMessage = error.message;
            }
          }
          const mutations = observer.takeRecords().length;
          observer.disconnect();
          const result = {
            errorName,
            errorMessage,
            mutations,
            focusEvents,
            sameFocus: document.activeElement === focus,
            sameRegion:
              status.parentElement === fixture.first.template.dialogContainer,
            firstOpen: first.open,
            secondOpen: second.open,
          };
          fixture.dispose();
          return result;
        },
        { mode, nextMode, workspace: process.cwd() }
      );
      expect(result).toEqual({
        errorName: "InvalidStateError",
        errorMessage:
          "Another dialog is already open in this editor's dialog host.",
        mutations: 0,
        focusEvents: 0,
        sameFocus: true,
        sameRegion: true,
        firstOpen: true,
        secondOpen: false,
      });
    });
  }

  test(`releases ${mode} ownership and restores original inert states`, async ({
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
        siblings[0].inert = true;
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
          const reused = second.open;
          second.close();
          results.push({
            retainedOwnership,
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
        correctInert: true,
        restored: true,
        reused: true,
      })
    );
  });
}

test("keeps dialogs in separate editors independent", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const result = await page.evaluate(async (workspace) => {
    const editorPath = `/tabui/@fs${workspace}/src/tabui-editor.ts`;
    const fixturePath = "/tabui/data/fixture.ts";
    const { TabUIEditor: editorClass } = (await import(
      editorPath
    )) as typeof import("../../src/tabui-editor");
    const { resolveEditorFixture } = await import(fixturePath);
    const otherRoot = document.createElement("div");
    document.body.appendChild(otherRoot);
    const otherEditor = new editorClass(
      otherRoot,
      resolveEditorFixture(new URLSearchParams("fixture=empty"))
    );
    otherEditor.init();
    const root = document.querySelector("#tabui-editor");
    if (root === null) throw Error("Expected primary editor root");
    const first = root.querySelector<HTMLDivElement>(".tu-nt-dialog");
    const second = otherRoot.querySelector<HTMLDivElement>(".tu-nt-dialog");
    const opener = root.querySelector<HTMLButtonElement>(
      'button[aria-label="New track"]'
    );
    const otherOpener = otherRoot.querySelector<HTMLButtonElement>(
      'button[aria-label="New track"]'
    );
    const dialogsMissing = first === null || second === null;
    const openersMissing = opener === null || otherOpener === null;
    if (dialogsMissing || openersMissing) {
      throw Error("Expected both editor dialogs and openers");
    }
    opener.click();
    otherOpener.click();
    const bothOpen = first.hasAttribute("open") && second.hasAttribute("open");
    const firstCancel = first.querySelector<HTMLButtonElement>(
      ".tu-nt-cancel-button"
    );
    const secondCancel = second.querySelector<HTMLButtonElement>(
      ".tu-nt-cancel-button"
    );
    const otherHost = otherRoot.querySelector<HTMLElement>(
      ".tu-top-controls-host"
    );
    const status = otherRoot.querySelector('[role="status"]');
    const cancelButtonsMissing = firstCancel === null || secondCancel === null;
    const controlsMissing = otherHost === null || status === null;
    if (cancelButtonsMissing || controlsMissing) {
      throw Error("Expected both dialog cancel buttons and controls");
    }
    firstCancel.click();
    const independent =
      second.hasAttribute("open") && otherHost.inert && second.contains(status);
    secondCancel.click();
    otherEditor.dispose();
    otherRoot.remove();
    return { bothOpen, independent };
  }, process.cwd());
  expect(result).toEqual({ bothOpen: true, independent: true });
});
