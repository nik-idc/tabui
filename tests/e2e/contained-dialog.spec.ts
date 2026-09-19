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
  await expect(page).toHaveURL(/\/tabui\/\?fixture=empty$/);
});

test("Enter on a select does not confirm the dialog", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor
    .getByRole("button", { name: "Time Signature", exact: true })
    .click();
  const dialog = editor.getByRole("dialog");
  await dialog.getByRole("combobox").press("Enter");
  await expect(dialog).toBeVisible();
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
});

test("keeps one announcement region inside the active modal before focus", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const region = editor.locator('[role="status"], [aria-live]');
  await expect(region).toHaveCount(1);
  await expect(region).toHaveText("");
  await expect(region).toHaveAttribute("role", "status");
  await expect(region).toHaveAttribute("aria-live", "polite");
  await expect(region).toHaveAttribute("aria-atomic", "true");
  await expect(region).not.toHaveAttribute("hidden");
  await expect(region).toHaveCSS("position", "absolute");
  const result = await editor.evaluate((root) => {
    const status = root.querySelector('[role="status"]')!;
    const first = root.querySelector<HTMLDivElement>(".tu-nt-dialog")!;
    const placements: boolean[] = [];
    const opener = root.querySelector<HTMLButtonElement>(
      'button[aria-label="New track"]'
    )!;
    opener.focus();
    let restoredBeforeFocus = false;
    opener.addEventListener("focus", () => {
      restoredBeforeFocus = status.parentElement === root;
    });
    root.addEventListener("focusin", (event) => {
      const modal = (event.target as Element).closest('[aria-modal="true"]');
      if (modal) placements.push(status.parentElement === modal);
    });
    opener.click();
    const insideFirst = status.parentElement === first;
    first.querySelector<HTMLButtonElement>(".tu-nt-cancel-button")!.click();
    opener.click();
    const insideSecond = status.parentElement === first;
    const notInert = status.closest("[inert]") === null;
    first.querySelector<HTMLButtonElement>(".tu-nt-cancel-button")!.click();
    return {
      insideFirst,
      insideSecond,
      notInert,
      restoredRoot: status.parentElement === root,
      restoredBeforeFocus,
      sameRegion: status === root.querySelector('[role="status"]'),
      placements,
    };
  });
  expect(result).toEqual({
    insideFirst: true,
    insideSecond: true,
    notInert: true,
    restoredRoot: true,
    restoredBeforeFocus: true,
    sameRegion: true,
    placements: [true, true],
  });
  await expect(region).toHaveCount(1);
});

test("contains modal behavior within the editor", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const opener = editor.getByRole("button", { name: "New track" });

  await opener.evaluate((element) => {
    element.tabIndex = 0;
  });
  await opener.focus();
  await opener.click();

  const dialog = editor.locator(".tu-dialog.tu-nt-dialog");
  await expect(dialog).toHaveJSProperty("tagName", "DIV");
  await expect(dialog).toHaveAttribute("open", "");
  await expect(dialog).toHaveAttribute("role", "dialog");
  await expect(dialog).toHaveAccessibleName("New track");
  await expect(dialog).toHaveAttribute("aria-modal", "true");

  const bounds = await page.evaluate(() => {
    const root = document.querySelector("#tabui-editor");
    const modal = root?.querySelector(".tu-dialog.tu-nt-dialog");
    if (!(root instanceof HTMLElement) || !(modal instanceof HTMLElement)) {
      throw new Error("Expected an open editor dialog");
    }
    const rootRect = root.getBoundingClientRect();
    const modalRect = modal.getBoundingClientRect();
    return {
      root: [rootRect.x, rootRect.y, rootRect.width, rootRect.height],
      modal: [modalRect.x, modalRect.y, modalRect.width, modalRect.height],
      parentIsDialogHost:
        modal.parentElement === root?.querySelector(".tu-dialog-host"),
      editorSiblingsInert: Array.from(root.children)
        .filter((element) => element !== root?.querySelector(".tu-dialog-host"))
        .every((element) => element instanceof HTMLElement && element.inert),
    };
  });
  expect(bounds.modal).toEqual(bounds.root);
  expect(bounds.parentIsDialogHost).toBe(true);
  expect(bounds.editorSiblingsInert).toBe(true);

  await page.evaluate(() => {
    const button = document.createElement("button");
    button.id = "host-action";
    button.textContent = "Host action";
    button.addEventListener("click", () => {
      button.dataset.clicked = "true";
    });
    document.body.prepend(button);
  });
  const hostAction = page.locator("#host-action");
  await hostAction.click();
  await expect(hostAction).toHaveAttribute("data-clicked", "true");
  await expect(dialog).toHaveAttribute("open", "");
});

test("traps focus and closes with Escape", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const opener = editor.getByRole("button", { name: "New track" });
  await opener.evaluate((element) => {
    element.tabIndex = 0;
  });
  await opener.focus();
  await opener.click();

  const dialog = editor.locator(".tu-dialog.tu-nt-dialog");
  const focusable = dialog.locator(
    "button:not([disabled]), input:not([disabled]), select:not([disabled]), " +
      "[tabindex]:not([tabindex='-1'])"
  );
  const first = focusable.first();
  const last = focusable.last();
  await expect(first).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();

  await dialog.evaluate((element) => {
    element.addEventListener("cancel", () => {
      element.dataset.cancelled = "true";
    });
    element.addEventListener("close", () => {
      element.dataset.closed = "true";
    });
  });
  await page.keyboard.press("Escape");

  await expect(dialog).not.toHaveAttribute("open", "");
  await expect(dialog).toHaveAttribute("data-cancelled", "true");
  await expect(dialog).toHaveAttribute("data-closed", "true");
  await expect(opener).toBeFocused();
  await expect(dialog).not.toHaveAttribute("aria-modal", "true");
  await expect(dialog).not.toHaveAttribute("data-tu-dialog-mode", "modal");
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
    const status = element.querySelector('[role="status"]')!;
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
          const status = root.querySelector('[role="status"]')!;
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
    const { TabUIEditor } = (await import(
      editorPath
    )) as typeof import("../../src/tabui-editor");
    const { resolveEditorFixture } = await import(fixturePath);
    const otherRoot = document.createElement("div");
    document.body.appendChild(otherRoot);
    const otherEditor = new TabUIEditor(
      otherRoot,
      resolveEditorFixture(new URLSearchParams("fixture=empty"))
    );
    otherEditor.init();
    const root = document.querySelector("#tabui-editor")!;
    const first = root.querySelector<HTMLDivElement>(".tu-nt-dialog")!;
    const second = otherRoot.querySelector<HTMLDivElement>(".tu-nt-dialog")!;
    root
      .querySelector<HTMLButtonElement>('button[aria-label="New track"]')!
      .click();
    otherRoot
      .querySelector<HTMLButtonElement>('button[aria-label="New track"]')!
      .click();
    const bothOpen = first.hasAttribute("open") && second.hasAttribute("open");
    first.querySelector<HTMLButtonElement>(".tu-nt-cancel-button")!.click();
    const independent =
      second.hasAttribute("open") &&
      otherRoot.querySelector<HTMLElement>(".tu-top-controls-host")!.inert &&
      second.contains(otherRoot.querySelector('[role="status"]'));
    second.querySelector<HTMLButtonElement>(".tu-nt-cancel-button")!.click();
    otherEditor.dispose();
    otherRoot.remove();
    return { bothOpen, independent };
  }, process.cwd());
  expect(result).toEqual({ bothOpen: true, independent: true });
});
