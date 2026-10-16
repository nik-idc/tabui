import { GuitarNote, Score } from "../../../src/notation/model";
import { NotationComponent } from "../../../src/notation/notation-component";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { BendControlsDefaultCallbacks } from "../../../src/ui/side-controls/technique-controls/bend-controls/bend-controls-callbacks";
import { BendControlsComponent } from "../../../src/ui/side-controls/technique-controls/bend-controls/bend-controls-component";
import { createTestTrackController } from "../controller/helpers";

/** Builds the real bend dialog and controller with a minimal notation owner. */
export function createBendControlsHarness() {
  const controller = createTestTrackController(new Score().tracks[0]);
  controller.setSelectedNoteFret(5);
  const owner: Pick<NotationComponent, "trackController"> = {
    trackController: controller,
  };
  const root = document.createElement("div");
  const dialogHost = document.createElement("div");
  root.append(dialogHost);
  document.body.append(root);
  const component = new BendControlsComponent(
    root,
    new DialogEnforcer(dialogHost, () => {}),
    owner as NotationComponent,
    () => {}
  );
  const keyboard = { captures: 0, releases: 0 };
  const callbacks = new BendControlsDefaultCallbacks(
    component,
    owner as NotationComponent,
    () => component.render(),
    () => keyboard.captures++,
    () => keyboard.releases++
  );
  component.render();

  return {
    component,
    controller,
    callbacks,
    keyboard,
    selectedNote(): GuitarNote {
      const note = controller.selectionCursor?.note;
      if (!(note instanceof GuitarNote)) throw Error("Expected guitar note");
      return note;
    },
    open() {
      component.prepareForOpen();
      component.dialog.showModal();
    },
    dispose() {
      component.dialog.close();
      callbacks.unbind();
      component.bendSelectorManager.dispose();
      root.remove();
    },
  };
}
