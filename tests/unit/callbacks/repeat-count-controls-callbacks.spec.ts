/** @jest-environment jsdom */

import { NotationComponent } from "../../../src/notation/notation-component";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { RepeatCountControlsDefaultCallbacks } from "../../../src/ui/side-controls/measure-controls/repeat-count-controls/repeat-count-controls-callbacks";
import { RepeatCountControlsComponent } from "../../../src/ui/side-controls/measure-controls/repeat-count-controls/repeat-count-controls-component";
import { createTestTrackController } from "../controller/helpers";
import { createScoreGraph } from "../model/helpers";

test("rejects an invalid repeat count and accepts a valid one", () => {
  const { track, masterBar } = createScoreGraph();
  const controller = createTestTrackController(track);
  const owner: Pick<NotationComponent, "trackController"> = {
    trackController: controller,
  };
  const notation = owner as NotationComponent;
  const root = document.createElement("div");
  const dialogHost = document.createElement("div");
  root.append(dialogHost);
  document.body.append(root);
  const controls = new RepeatCountControlsComponent(
    root,
    new DialogEnforcer(dialogHost, () => {}),
    notation,
    () => {}
  );
  const callbacks = new RepeatCountControlsDefaultCallbacks(
    controls,
    notation,
    () => controls.render(),
    () => {}
  );

  try {
    controls.render();
    callbacks.bind();
    callbacks.bind();
    controls.dialog.showModal();
    const { template } = controls;
    template.value.value = "1.5";
    template.dialogContent.dispatchEvent(
      new Event("submit", { cancelable: true })
    );
    expect(template.errorText.textContent).toBe("Invalid repeat count");
    expect(template.confirmButton.disabled).toBe(true);
    expect(controls.dialog.open).toBe(true);
    expect(masterBar.isRepeatEnd).toBe(false);
    expect(masterBar.repeatCount).toBeNull();

    template.value.value = "4";
    template.value.dispatchEvent(new Event("input"));
    expect(template.confirmButton.disabled).toBe(false);
    template.dialogContent.dispatchEvent(
      new Event("submit", { cancelable: true })
    );
    expect(masterBar.isRepeatEnd).toBe(true);
    expect(masterBar.repeatCount).toBe(4);
    expect(controls.dialog.open).toBe(false);
    controller.undo();
    expect(masterBar.isRepeatEnd).toBe(false);
    expect(masterBar.repeatCount).toBeNull();
    controller.redo();
    expect(masterBar.repeatCount).toBe(4);
  } finally {
    controls.dialog.close();
    callbacks.unbind();
    root.remove();
  }
});
