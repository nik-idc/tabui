import { expect, test } from "@playwright/test";

test("contains modal behavior within the editor", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  const opener = editor.locator('img[alt="New track"]');

  await opener.evaluate((element) => {
    element.tabIndex = 0;
  });
  await opener.focus();
  await opener.click();

  const dialog = editor.locator(".tu-dialog.tu-nt-dialog");
  await expect(dialog).toHaveJSProperty("tagName", "DIV");
  await expect(dialog).toHaveAttribute("open", "");
  await expect(dialog).toHaveAttribute("role", "dialog");
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
  const opener = editor.locator('img[alt="New track"]');
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

test("matches the native dialog method contract", async ({ page }) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.locator('img[alt="New track"]').click();
  const dialog = editor.locator(".tu-dialog.tu-nt-dialog");

  const result = await dialog.evaluate((element) => {
    const modal = element as HTMLDialogElement;
    let cancelCount = 0;
    modal.addEventListener("cancel", () => {
      cancelCount += 1;
    });
    const preventFirstClose = (event: Event) => {
      event.preventDefault();
      modal.removeEventListener("cancel", preventFirstClose);
    };
    modal.addEventListener("cancel", preventFirstClose);

    modal.showModal();
    modal.requestClose("blocked");
    const stayedOpen = modal.open;
    modal.requestClose("accepted");
    const closedValue = modal.returnValue;
    modal.show();
    const modeless =
      modal.open &&
      !modal.hasAttribute("aria-modal") &&
      modal.dataset.tuDialogMode === "nonmodal";
    modal.show();
    let crossModeError = "";
    try {
      modal.showModal();
    } catch (error) {
      crossModeError = error instanceof DOMException ? error.name : "unknown";
    }
    modal.close("complete");

    return {
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
      crossModeError,
      finalValue: modal.returnValue,
    };
  });

  expect(result).toEqual({
    methods: ["function", "function", "function", "function"],
    cancelCount: 2,
    stayedOpen: true,
    closedValue: "accepted",
    modeless: true,
    crossModeError: "InvalidStateError",
    finalValue: "complete",
  });
});

test("keeps the editor inert until all modal dialogs close", async ({
  page,
}) => {
  await page.goto("/tabui/?fixture=empty");
  const editor = page.locator("#tabui-editor");
  await editor.locator('img[alt="New track"]').click();
  const firstDialog = editor.locator(".tu-dialog.tu-nt-dialog");
  const secondDialog = editor.locator(".tu-dialog.tu-ts-dialog");
  await secondDialog.evaluate((element: HTMLDialogElement) =>
    element.showModal()
  );

  await firstDialog.evaluate((element: HTMLDialogElement) => element.close());
  await expect(secondDialog).toHaveAttribute("open", "");
  await expect(editor.locator(".tu-top-controls-host")).toHaveJSProperty(
    "inert",
    true
  );

  await secondDialog.evaluate((element: HTMLDialogElement) => element.close());
  await expect(editor.locator(".tu-top-controls-host")).toHaveJSProperty(
    "inert",
    false
  );
});
