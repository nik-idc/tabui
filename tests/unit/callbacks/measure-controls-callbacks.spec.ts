/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { MeasureControlsComponent } from "../../../src/ui/side-controls/measure-controls/measure-controls-component";
import { MeasureControlsDefaultCallbacks } from "../../../src/ui/side-controls/measure-controls/measure-controls-callbacks";
import { createTestLayoutDimensions } from "../controller/helpers";
import { createScoreGraph } from "../model/helpers";

function createControls() {
  const { score, masterBar } = createScoreGraph();
  const root = document.createElement("div");
  const notationHost = document.createElement("div");
  const controlsHost = document.createElement("div");
  const dialogHost = document.createElement("div");
  root.append(notationHost, controlsHost, dialogHost);
  document.body.append(root);
  const notation = new NotationComponent(
    notationHost,
    score,
    resolveTabUIConfig(),
    createTestLayoutDimensions()
  );
  const controls = new MeasureControlsComponent(
    controlsHost,
    new DialogEnforcer(dialogHost, () => {}),
    notation,
    () => {}
  );
  let keyboardCaptured = false;
  const callbacks = new MeasureControlsDefaultCallbacks(
    controls,
    notation,
    () => controls.render(),
    () => {
      keyboardCaptured = true;
    },
    () => {
      keyboardCaptured = false;
    }
  );
  controls.render();

  return {
    score,
    masterBar,
    controls,
    callbacks,
    controller: notation.trackController,
    get keyboardCaptured() {
      return keyboardCaptured;
    },
    dispose() {
      controls.tempoControlsComponent.dialog.close();
      controls.timeSigControlsComponent.dialog.close();
      controls.repeatCountControlsComponent.dialog.close();
      callbacks.unbind();
      notation.dispose();
      root.remove();
    },
  };
}

describe("MeasureControlsDefaultCallbacks", () => {
  let fixture: ReturnType<typeof createControls>;
  beforeEach(() => {
    fixture = createControls();
  });
  afterEach(() => {
    fixture.dispose();
  });

  test("top-level controls open dialogs, edit bars once, and stop after unbind", () => {
    const { callbacks, controls, score, masterBar, controller } = fixture;
    callbacks.bind();
    callbacks.bind();

    controls.template.tempoButton.click();
    expect(controls.tempoControlsComponent.dialog.open).toBe(true);
    expect(fixture.keyboardCaptured).toBe(true);
    controls.tempoControlsComponent.template.cancelButton.click();
    expect(controls.tempoControlsComponent.dialog.open).toBe(false);
    expect(fixture.keyboardCaptured).toBe(false);

    controls.template.timeSignatureButton.click();
    expect(controls.timeSigControlsComponent.dialog.open).toBe(true);
    expect(fixture.keyboardCaptured).toBe(true);
    controls.timeSigControlsComponent.template.cancelButton.click();
    expect(controls.timeSigControlsComponent.dialog.open).toBe(false);
    expect(fixture.keyboardCaptured).toBe(false);

    controls.template.repeatEndButton.click();
    expect(controls.repeatCountControlsComponent.dialog.open).toBe(true);
    expect(fixture.keyboardCaptured).toBe(true);
    controls.repeatCountControlsComponent.template.cancelButton.click();
    expect(controls.repeatCountControlsComponent.dialog.open).toBe(false);
    expect(fixture.keyboardCaptured).toBe(false);

    controls.template.repeatStartButton.click();
    expect(masterBar.isRepeatStart).toBe(true);
    controller.undo();
    expect(masterBar.isRepeatStart).toBe(false);

    controls.template.insertBarBeforeButton.click();
    expect(score.masterBars).toHaveLength(2);
    const before = score.masterBars[0];
    expect(score.masterBars[1]).toBe(masterBar);
    expect(controller.selectionCursor?.bar.masterBar).toBe(before);
    controls.template.insertBarAfterButton.click();
    expect(score.masterBars).toHaveLength(3);
    const after = score.masterBars[1];
    expect(score.masterBars[0]).toBe(before);
    expect(score.masterBars[2]).toBe(masterBar);
    expect(controller.selectionCursor?.bar.masterBar).toBe(after);
    controls.template.removeBarButton.click();
    expect(score.masterBars).toEqual([before, masterBar]);
    controller.undo();
    expect(score.masterBars).toEqual([before, after, masterBar]);

    callbacks.unbind();
    const selected = controller.selectionCursor?.bar.masterBar;
    controls.template.repeatStartButton.click();
    controls.template.insertBarBeforeButton.click();
    controls.template.insertBarAfterButton.click();
    controls.template.removeBarButton.click();
    controls.template.repeatEndButton.click();
    controls.template.tempoButton.click();
    controls.template.timeSignatureButton.click();
    expect(selected?.isRepeatStart).toBe(false);
    expect(score.masterBars).toEqual([before, after, masterBar]);
    expect(controls.repeatCountControlsComponent.dialog.open).toBe(false);
    expect(controls.tempoControlsComponent.dialog.open).toBe(false);
    expect(controls.timeSigControlsComponent.dialog.open).toBe(false);
  });

  test("repeat start click clears an existing boundary and undo restores it", () => {
    const { callbacks, controls, controller, masterBar } = fixture;
    masterBar.isRepeatStart = true;
    controls.render();
    callbacks.bind();

    controls.template.repeatStartButton.click();

    expect(masterBar.isRepeatStart).toBe(false);
    controller.undo();
    expect(masterBar.isRepeatStart).toBe(true);
    controller.redo();
    expect(masterBar.isRepeatStart).toBe(false);
  });
});
