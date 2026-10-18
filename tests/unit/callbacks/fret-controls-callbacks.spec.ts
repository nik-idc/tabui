/** @jest-environment jsdom */

import { GuitarNote } from "../../../src/notation/model/guitar-note";
import { Score } from "../../../src/notation/model/score";
import { NotationComponent } from "../../../src/notation/notation-component";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { FretControlsDefaultCallbacks } from "../../../src/ui/side-controls/note-controls/fret-controls/fret-controls-callbacks";
import { FretControlsComponent } from "../../../src/ui/side-controls/note-controls/fret-controls/fret-controls-component";
import { createTestTrackController } from "../controller/helpers";

function createHarness() {
  const score = new Score();
  const controller = createTestTrackController(score.tracks[0]);
  // The fret controls use only the real controller from the notation owner.
  const owner: Pick<NotationComponent, "trackController"> = {
    trackController: controller,
  };
  const notationComponent = owner as NotationComponent;
  const root = document.createElement("div");
  const dialogHost = document.createElement("div");
  root.appendChild(dialogHost);
  document.body.appendChild(root);
  const component = new FretControlsComponent(
    root,
    new DialogEnforcer(dialogHost, () => {}),
    notationComponent
  );
  const callbacks = new FretControlsDefaultCallbacks(
    component,
    notationComponent,
    () => component.render(),
    () => {},
    () => {}
  );

  return { callbacks, component, controller, root };
}

describe("FretControlsDefaultCallbacks", () => {
  test("applies no fret, dead, and numeric values", () => {
    const { callbacks, component, controller, root } = createHarness();

    try {
      callbacks.onFretButtonClicked();
      expect(component.dialog.open).toBe(true);
      component.template.input.value = "5";
      callbacks.onConfirmClicked();
      const note = controller.selectionCursor?.note;
      if (!(note instanceof GuitarNote)) {
        throw new Error(
          "Expected a selected guitar note after entering a fret"
        );
      }
      expect(note.fret).toBe(5);
      expect(component.dialog.open).toBe(false);

      callbacks.onFretButtonClicked();
      expect(component.dialog.open).toBe(true);
      callbacks.onDeadClicked();
      expect(note.fret).toBe(-1);
      expect(component.dialog.open).toBe(false);

      callbacks.onFretButtonClicked();
      expect(component.dialog.open).toBe(true);
      callbacks.onNoFretClicked();
      expect(note.fret).toBeNull();
      expect(component.dialog.open).toBe(false);

      callbacks.onFretButtonClicked();
      expect(component.dialog.open).toBe(true);
      component.template.input.value = "12";
      callbacks.onConfirmClicked();
      expect(note.fret).toBe(12);
      expect(component.dialog.open).toBe(false);
    } finally {
      component.dialog.close();
      root.remove();
    }
  });
});
