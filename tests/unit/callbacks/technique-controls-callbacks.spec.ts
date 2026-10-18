/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import { SelectedMoveDirection } from "../../../src/notation/controller";
import { GuitarTechniqueType, NoteDuration } from "../../../src/notation/model";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { TechniqueControlsComponent } from "../../../src/ui/side-controls/technique-controls/technique-controls-component";
import { TechniqueControlsDefaultCallbacks } from "../../../src/ui/side-controls/technique-controls/technique-controls-callbacks";
import { createTestLayoutDimensions } from "../controller/helpers";
import { createBarWithBeats } from "../model/helpers";
import { required } from "../required";

describe("TechniqueControlsDefaultCallbacks", () => {
  test("technique buttons edit once after repeated binding, open bend controls, and stop after unbinding", () => {
    const { score } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const root = document.createElement("div");
    document.body.append(root);
    const notation = new NotationComponent(
      document.createElement("div"),
      score,
      resolveTabUIConfig(),
      createTestLayoutDimensions()
    );
    const controller = notation.trackController;
    controller.setSelectedNoteFret(5);
    const note = required(required(controller.selectionCursor).note);
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.setSelectedNoteFret(7);
    controller.moveSelectedNote(SelectedMoveDirection.Left);

    const enforcer = new DialogEnforcer(root, () => {});
    const controls = new TechniqueControlsComponent(
      root,
      enforcer,
      notation,
      () => {}
    );
    const render = jest.fn(() => controls.render());
    const callbacks = new TechniqueControlsDefaultCallbacks(
      controls,
      notation,
      render,
      () => {},
      () => {}
    );
    controls.render();

    try {
      callbacks.bind();
      callbacks.bind();
      for (const [button, type] of [
        [controls.template.vibratoButton, GuitarTechniqueType.Vibrato],
        [controls.template.letRingButton, GuitarTechniqueType.LetRing],
        [controls.template.legatoButton, GuitarTechniqueType.Legato],
        [controls.template.slideButton, GuitarTechniqueType.Slide],
      ] as const) {
        button.click();
        expect(note.hasTechnique(type)).toBe(true);
        expect(button.getAttribute("aria-pressed")).toBe("true");
        controller.undo();
        expect(note.hasTechnique(type)).toBe(false);
        controls.render();
      }
      expect(render).toHaveBeenCalledTimes(4);

      controls.template.bendButton.click();
      expect(controls.bendControlsComponent.dialog.open).toBe(true);
      expect(enforcer.activeDialog).toBe(controls.bendControlsComponent.dialog);
      controls.bendControlsComponent.dialog.close();

      callbacks.unbind();
      expect(controls.template.nhButton.disabled).toBe(false);
      controls.template.nhButton.click();
      expect(note.hasTechnique(GuitarTechniqueType.NaturalHarmonic)).toBe(
        false
      );
      expect(render).toHaveBeenCalledTimes(4);
      controls.template.bendButton.click();
      expect(controls.bendControlsComponent.dialog.open).toBe(false);
    } finally {
      controls.bendControlsComponent.dialog.close();
      callbacks.unbind();
      notation.dispose();
      root.remove();
    }
  });
});
