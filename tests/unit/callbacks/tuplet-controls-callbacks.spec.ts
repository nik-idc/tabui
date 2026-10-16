/** @jest-environment jsdom */

import { NotationComponent } from "../../../src/notation/notation-component";
import { SelectedMoveDirection } from "../../../src/notation/controller";
import { NoteDuration, TupletSettings } from "../../../src/notation/model";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { TupletControlsDefaultCallbacks } from "../../../src/ui/side-controls/note-controls/tuplet-controls/tuplet-controls-callbacks";
import { TupletControlsComponent } from "../../../src/ui/side-controls/note-controls/tuplet-controls/tuplet-controls-component";
import { createTestTrackController } from "../controller/helpers";
import { createBarWithBeats } from "../model/helpers";

function createTupletHarness(settings: TupletSettings | null = null) {
  const { track, beats } = createBarWithBeats([
    { baseDuration: NoteDuration.Eighth, tupletSettings: settings },
    { baseDuration: NoteDuration.Eighth, tupletSettings: settings },
  ]);
  const controller = createTestTrackController(track);
  const owner: Pick<NotationComponent, "trackController"> = {
    trackController: controller,
  };
  const notationComponent = owner as NotationComponent;
  const root = document.createElement("div");
  const dialogHost = document.createElement("div");
  root.appendChild(dialogHost);
  document.body.appendChild(root);
  const component = new TupletControlsComponent(
    root,
    new DialogEnforcer(dialogHost, () => {}),
    notationComponent,
    () => {}
  );
  const callbacks = new TupletControlsDefaultCallbacks(
    component,
    notationComponent,
    () => {},
    () => {},
    () => {}
  );
  component.render();
  callbacks.bind();
  component.dialog.showModal();

  return { callbacks, component, controller, beat: beats[0] };
}

describe("TupletControlsDefaultCallbacks", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  test("dialog inputs use the selected group's existing tuplet ratio", () => {
    const { component, controller } = createTupletHarness({
      normalCount: 5,
      tupletCount: 4,
    });
    controller.extendSelectionByBeat(SelectedMoveDirection.Right);
    expect(controller.selectionCursor).toBeUndefined();
    component.render();

    expect(component.template.normalValue.textContent).toBe("5");
    expect(component.template.tupletValue.textContent).toBe("4");
  });

  test("button controls step and clamp both tuplet values", () => {
    const { component } = createTupletHarness();
    const template = component.template;

    template.normalUpButton.click();
    expect(template.normalValue.textContent).toBe("4");
    expect(template.tupletValue.textContent).toBe("2");
    template.tupletUpButton.click();
    expect(template.tupletValue.textContent).toBe("3");

    template.normalDownButton.click();
    template.normalDownButton.click();
    template.normalDownButton.click();
    template.tupletDownButton.click();
    template.tupletDownButton.click();
    expect(template.normalValue.textContent).toBe("2");
    expect(template.tupletValue.textContent).toBe("2");
    expect(template.normalDownButton.disabled).toBe(true);
    expect(template.tupletDownButton.disabled).toBe(true);
  });

  test("mouse wheel adjusts each tuplet value independently", () => {
    const { component } = createTupletHarness();
    const template = component.template;
    const normalWheel = new WheelEvent("wheel", {
      deltaY: -1,
      cancelable: true,
    });
    template.normalControl.dispatchEvent(normalWheel);
    expect(normalWheel.defaultPrevented).toBe(true);
    expect(template.normalValue.textContent).toBe("4");
    expect(template.tupletValue.textContent).toBe("2");

    const tupletWheel = new WheelEvent("wheel", {
      deltaY: -1,
      cancelable: true,
    });
    template.tupletControl.dispatchEvent(tupletWheel);
    expect(tupletWheel.defaultPrevented).toBe(true);
    expect(template.normalValue.textContent).toBe("4");
    expect(template.tupletValue.textContent).toBe("3");
  });

  test("confirm rejects a stored ratio below the dialog minimum", () => {
    // The model accepts 1, but the dialog offers counts starting at 2.
    const settings = { normalCount: 1, tupletCount: 4 };
    const { callbacks, component, beat, controller } =
      createTupletHarness(settings);

    callbacks.onConfirmClicked();

    expect(component.template.confirmButton.disabled).toBe(true);
    expect(component.template.normalErrorText.textContent?.trim()).not.toBe("");
    expect(component.dialog.open).toBe(true);
    expect(beat.tupletSettings).toEqual(settings);
    controller.undo();
    expect(beat.tupletSettings).toEqual(settings);
  });

  test("confirm commits once after repeated binding and unbind removes listeners", () => {
    const { callbacks, component, controller, beat } = createTupletHarness();
    const template = component.template;
    callbacks.bind();
    template.normalUpButton.click();
    template.tupletUpButton.click();
    expect(template.normalValue.textContent).toBe("4");
    expect(template.tupletValue.textContent).toBe("3");

    const submit = new Event("submit", { cancelable: true });
    template.dialogContent.dispatchEvent(submit);
    expect(submit.defaultPrevented).toBe(true);
    expect(beat.tupletSettings).toEqual({ normalCount: 4, tupletCount: 3 });
    expect(component.dialog.open).toBe(false);
    controller.undo();
    expect(beat.tupletSettings).toBeNull();
    controller.redo();
    expect(beat.tupletSettings).toEqual({ normalCount: 4, tupletCount: 3 });

    component.render();
    component.dialog.showModal();
    callbacks.unbind();
    template.normalUpButton.click();
    expect(template.normalValue.textContent).toBe("4");
    template.dialogContent.dispatchEvent(new Event("submit"));
    expect(component.dialog.open).toBe(true);
    expect(beat.tupletSettings).toEqual({ normalCount: 4, tupletCount: 3 });
  });
});
