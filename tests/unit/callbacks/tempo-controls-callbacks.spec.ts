/** @jest-environment jsdom */

import { TempoControlsDefaultCallbacks } from "../../../src/ui/side-controls/measure-controls/tempo-controls/tempo-controls-callbacks";
import { TempoControlsComponent } from "../../../src/ui/side-controls/measure-controls/tempo-controls/tempo-controls-component";
import { NotationComponent } from "../../../src/notation/notation-component";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { createScoreGraph } from "../model/helpers";
import { createTestTrackController } from "../controller/helpers";

function createTempoHarness() {
  const { track, masterBar } = createScoreGraph();
  const controller = createTestTrackController(track);
  const owner: Pick<NotationComponent, "trackController"> = {
    trackController: controller,
  };
  const notation = owner as NotationComponent;
  const root = document.createElement("div");
  const host = document.createElement("div");
  root.appendChild(host);
  document.body.appendChild(root);
  const component = new TempoControlsComponent(
    root,
    new DialogEnforcer(host, () => {}),
    notation,
    () => {}
  );
  let keyboardOwned = true;
  const callbacks = new TempoControlsDefaultCallbacks(
    component,
    notation,
    () => component.render(),
    () => {
      keyboardOwned = true;
    },
    () => {
      keyboardOwned = false;
    }
  );
  component.render();
  callbacks.bind();
  component.dialog.showModal();

  return {
    callbacks,
    component,
    controller,
    masterBar,
    keyboardOwned: () => keyboardOwned,
    dispose: () => {
      component.dialog.close();
      callbacks.unbind();
      root.remove();
    },
  };
}

describe("TempoControlsDefaultCallbacks", () => {
  test("tempo buttons step and clamp the displayed value", () => {
    const { component, masterBar, dispose } = createTempoHarness();
    const template = component.template;
    try {
      template.increaseTenButton.click();
      expect(template.value.textContent).toBe("130");
      template.decreaseButton.click();
      expect(template.value.textContent).toBe("129");
      for (let i = 0; i < 13; i++) template.decreaseTenButton.click();
      expect(template.value.textContent).toBe("1");
      expect(template.decreaseButton.disabled).toBe(true);
      expect(template.decreaseTenButton.disabled).toBe(true);
      expect(template.confirmButton.disabled).toBe(false);
      template.increaseButton.click();
      expect(template.value.textContent).toBe("2");
      expect(template.decreaseButton.disabled).toBe(false);
      for (let i = 0; i < 100; i++) template.increaseTenButton.click();
      expect(template.value.textContent).toBe("999");
      expect(template.increaseButton.disabled).toBe(true);
      expect(template.increaseTenButton.disabled).toBe(true);
      expect(masterBar.tempo).toBe(120);
    } finally {
      dispose();
    }
  });

  test("mouse wheel adjusts tempo and prevents page scrolling", () => {
    const { component, dispose } = createTempoHarness();
    try {
      const up = new WheelEvent("wheel", { deltaY: -1, cancelable: true });
      component.template.valueControl.dispatchEvent(up);
      expect(component.template.value.textContent).toBe("121");
      expect(up.defaultPrevented).toBe(true);
      const down = new WheelEvent("wheel", { deltaY: 1, cancelable: true });
      component.template.valueControl.dispatchEvent(down);
      expect(component.template.value.textContent).toBe("120");
      expect(down.defaultPrevented).toBe(true);
    } finally {
      dispose();
    }
  });

  test("confirm commits undoable tempo, closes, and frees keyboard", () => {
    const { component, controller, masterBar, keyboardOwned, dispose } =
      createTempoHarness();
    try {
      for (let i = 0; i < 6; i++) component.template.increaseTenButton.click();
      component.template.dialogContent.dispatchEvent(
        new Event("submit", { cancelable: true })
      );
      expect(masterBar.tempo).toBe(180);
      expect(component.dialog.open).toBe(false);
      expect(keyboardOwned()).toBe(false);
      controller.undo();
      expect(masterBar.tempo).toBe(120);
      controller.redo();
      expect(masterBar.tempo).toBe(180);
      component.render();
      component.dialog.showModal();
      expect(component.template.value.textContent).toBe("180");
    } finally {
      dispose();
    }
  });

  test("dialog clicks close only when clicking outside content", () => {
    const { component, masterBar, keyboardOwned, dispose } =
      createTempoHarness();
    try {
      component.template.increaseButton.click();
      expect(component.dialog.open).toBe(true);
      expect(keyboardOwned()).toBe(true);
      component.template.dialogContainer.click();
      expect(component.dialog.open).toBe(false);
      expect(keyboardOwned()).toBe(false);
      expect(masterBar.tempo).toBe(120);
    } finally {
      dispose();
    }
  });

  test("bind and unbind wire events once even across repeated bind", () => {
    const { callbacks, component, controller, masterBar, dispose } =
      createTempoHarness();
    const template = component.template;
    try {
      callbacks.bind();
      callbacks.bind();
      template.increaseButton.click();
      expect(template.value.textContent).toBe("121");
      template.dialogContent.dispatchEvent(
        new Event("submit", { cancelable: true })
      );
      expect(masterBar.tempo).toBe(121);
      controller.undo();
      expect(masterBar.tempo).toBe(120);
      controller.redo();
      expect(masterBar.tempo).toBe(121);

      component.render();
      component.dialog.showModal();
      callbacks.unbind();
      template.increaseButton.click();
      template.dialogContent.dispatchEvent(
        new Event("submit", { cancelable: true })
      );
      expect(template.value.textContent).toBe("121");
      expect(masterBar.tempo).toBe(121);
      expect(component.dialog.open).toBe(true);

      callbacks.bind();
      callbacks.bind();
      template.increaseTenButton.click();
      expect(template.value.textContent).toBe("131");
      template.dialogContent.dispatchEvent(
        new Event("submit", { cancelable: true })
      );
      expect(masterBar.tempo).toBe(131);
      expect(component.dialog.open).toBe(false);
      controller.undo();
      expect(masterBar.tempo).toBe(121);
      controller.undo();
      expect(masterBar.tempo).toBe(120);
    } finally {
      dispose();
    }
  });
});
