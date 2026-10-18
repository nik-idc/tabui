/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import { Score } from "../../../src/notation/model";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { YesNoDefaultCallbacks } from "../../../src/ui/shared/yes-no/yes-no-callbacks";
import { YesNoComponent } from "../../../src/ui/shared/yes-no/yes-no-component";
import { createTestLayoutDimensions } from "../controller/helpers";

describe("YesNoDefaultCallbacks", () => {
  test("confirmation notifies the consumer once; cancellation and detached events do not", () => {
    const root = document.createElement("div");
    const viewport = document.createElement("div");
    const host = document.createElement("div");
    root.append(viewport, host);
    document.body.append(root);
    const score = new Score();
    const notation = new NotationComponent(
      viewport,
      score,
      resolveTabUIConfig(),
      createTestLayoutDimensions()
    );
    const component = new YesNoComponent(
      host,
      new DialogEnforcer(host, () => {}),
      notation
    );
    component.render();
    // These callbacks are the consumer's confirmation and keyboard boundary.
    const onConfirm = jest.fn();
    const freeKeyboard = jest.fn();
    const callbacks = new YesNoDefaultCallbacks(
      component,
      notation,
      () => component.render(),
      () => {},
      freeKeyboard,
      onConfirm
    );
    const { dialog } = component;
    const { confirmButton, cancelButton, yesNoText, yesNoDialogContent } =
      component.template;

    try {
      callbacks.bind();
      callbacks.bind();
      dialog.showModal();
      yesNoText.click();
      expect(dialog.open).toBe(true);
      expect(onConfirm).not.toHaveBeenCalled();

      cancelButton.click();
      expect(dialog.open).toBe(false);
      expect(onConfirm).not.toHaveBeenCalled();
      expect(freeKeyboard).toHaveBeenCalledTimes(1);

      dialog.showModal();
      component.template.dialogContainer.click();
      expect(dialog.open).toBe(false);
      expect(onConfirm).not.toHaveBeenCalled();
      expect(freeKeyboard).toHaveBeenCalledTimes(2);

      dialog.showModal();
      confirmButton.disabled = true;
      yesNoDialogContent.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
      expect(dialog.open).toBe(true);
      expect(onConfirm).not.toHaveBeenCalled();
      confirmButton.disabled = false;
      confirmButton.click();
      expect(dialog.open).toBe(false);
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(freeKeyboard).toHaveBeenCalledTimes(3);

      yesNoDialogContent.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
      expect(onConfirm).toHaveBeenCalledTimes(1);

      dialog.showModal();
      callbacks.unbind();
      // Prevent jsdom's unhandled native submit after the listener is removed.
      const submit = new Event("submit", { bubbles: true, cancelable: true });
      yesNoDialogContent.dispatchEvent(submit);
      cancelButton.click();
      component.template.dialogContainer.click();
      expect(dialog.open).toBe(true);
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(submit.defaultPrevented).toBe(false);
      dialog.close();
      expect(freeKeyboard).toHaveBeenCalledTimes(3);

      callbacks.bind();
      dialog.showModal();
      confirmButton.click();
      expect(dialog.open).toBe(false);
      expect(onConfirm).toHaveBeenCalledTimes(2);
      expect(freeKeyboard).toHaveBeenCalledTimes(4);
    } finally {
      callbacks.unbind();
      dialog.close();
      notation.dispose();
      root.remove();
    }
  });
});
