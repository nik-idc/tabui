/** @jest-environment jsdom */

import {
  BendTechniqueOptions,
  BendType,
  GuitarTechniqueType,
} from "../../../src/notation/model";
import { createBendControlsHarness } from "./bend-controls-test-helpers";

describe("BendControlsDefaultCallbacks", () => {
  let harness: ReturnType<typeof createBendControlsHarness>;
  beforeEach(() => {
    harness = createBendControlsHarness();
  });
  afterEach(() => harness.dispose());

  test("bend type buttons select and commit their model type", () => {
    const { component, callbacks, selectedNote, controller } = harness;
    callbacks.bind();

    for (const type of [
      BendType.Bend,
      BendType.BendAndRelease,
      BendType.Prebend,
      BendType.PrebendAndRelease,
      BendType.PrebendBend,
    ]) {
      harness.open();
      component.template.bendTypesButtons[type].click();
      expect(
        component.template.bendTypesButtons[type].getAttribute("aria-pressed")
      ).toBe("true");
      component.template.dialogContent.requestSubmit();
      expect(
        selectedNote().techniques.find(
          (t) => t.type === GuitarTechniqueType.Bend
        )?.bendOptions?.type
      ).toBe(type);
      expect(component.dialog.open).toBe(false);
      controller.undo();
      expect(selectedNote().hasTechnique(GuitarTechniqueType.Bend)).toBe(false);
    }

    controller.setTechnique(GuitarTechniqueType.Bend, {
      bendOptions: new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1,
        bendDuration: 0.75,
      }),
    });
    controller.insertBeatAfterSelected();
    controller.setSelectedNoteFret(5);
    controller.setTechnique(GuitarTechniqueType.Tie);
    for (const type of [BendType.Hold, BendType.Release]) {
      harness.open();
      component.template.bendTypesButtons[type].click();
      component.template.dialogContent.requestSubmit();
      expect(
        selectedNote().techniques.find(
          (t) => t.type === GuitarTechniqueType.Bend
        )?.bendOptions?.type
      ).toBe(type);
      controller.undo();
    }
  });

  test.each([
    BendType.Bend,
    BendType.BendAndRelease,
    BendType.Hold,
    BendType.Release,
    BendType.Prebend,
    BendType.PrebendAndRelease,
    BendType.PrebendBend,
  ])("disabled conditional bend type %s cannot be selected", (type) => {
    const { controller, component, callbacks } = harness;
    if (type === BendType.Bend || type === BendType.BendAndRelease) {
      controller.setTechnique(GuitarTechniqueType.Bend, {
        bendOptions: new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 3,
          bendDuration: 0.75,
        }),
      });
      controller.insertBeatAfterSelected();
      controller.setSelectedNoteFret(5);
      controller.setTechnique(GuitarTechniqueType.Tie);
    } else if (type !== BendType.Hold && type !== BendType.Release) {
      controller.insertBeatAfterSelected();
      controller.setSelectedNoteFret(5);
      controller.setTechnique(GuitarTechniqueType.Tie);
    }
    callbacks.bind();
    harness.open();
    const graph = component.template.bendSelectorGraphSVG;
    const points = () =>
      Array.from(graph.querySelectorAll("circle"), (p) => [
        p.getAttribute("cx"),
        p.getAttribute("cy"),
      ]);
    const before = points();
    expect(component.template.bendTypesButtons[type].disabled).toBe(true);

    // Exercise the public callback guard as well as native disabled-button behavior.
    callbacks.onBendTypeClicked(type);
    component.template.bendTypesButtons[type].click();

    expect(points()).toEqual(before);
    expect(component.dialog.open).toBe(true);
  });

  test("confirm commits once after repeated binding and unbind removes listeners", () => {
    const { callbacks, component, controller, selectedNote } = harness;
    callbacks.bind();
    callbacks.bind();
    harness.open();
    component.template.bendTypesButtons[BendType.BendAndRelease].click();
    component.template.dialogContent.requestSubmit();

    expect(
      selectedNote().techniques.find((t) => t.type === GuitarTechniqueType.Bend)
        ?.bendOptions
    ).toMatchObject({
      type: BendType.BendAndRelease,
      bendPitch: 1,
      releasePitch: 0,
      bendDuration: 0.75,
    });
    expect(component.dialog.open).toBe(false);
    controller.undo();
    expect(selectedNote().hasTechnique(GuitarTechniqueType.Bend)).toBe(false);
    controller.redo();
    expect(selectedNote().hasTechnique(GuitarTechniqueType.Bend)).toBe(true);
    controller.undo();
    controller.undo();
    expect(controller.selectionAsBeats[0].notes).toBeNull();

    controller.setSelectedNoteFret(5);
    controller.setTechnique(GuitarTechniqueType.Bend, {
      bendOptions: new BendTechniqueOptions({
        type: BendType.BendAndRelease,
        bendPitch: 1,
        releasePitch: 0,
        bendDuration: 0.75,
      }),
    });

    harness.open();
    callbacks.unbind();
    component.template.removeButton.click();
    component.template.cancelButton.click();
    component.template.dialogContent.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );
    component.template.bendTypesButtons[BendType.Prebend].click();
    expect(
      component.template.bendTypesButtons[BendType.BendAndRelease].getAttribute(
        "aria-pressed"
      )
    ).toBe("true");
    expect(selectedNote().hasTechnique(GuitarTechniqueType.Bend)).toBe(true);
    expect(component.dialog.open).toBe(true);
  });

  test("remove closes the dialog and supports undo and redo", () => {
    const { callbacks, component, controller, selectedNote } = harness;
    controller.setTechnique(GuitarTechniqueType.Bend, {
      bendOptions: new BendTechniqueOptions({
        type: BendType.Prebend,
        prebendPitch: 0.5,
      }),
    });
    callbacks.bind();
    harness.open();
    expect(component.template.removeButton.disabled).toBe(false);
    component.template.removeButton.click();

    expect(selectedNote().hasTechnique(GuitarTechniqueType.Bend)).toBe(false);
    expect(component.dialog.open).toBe(false);
    controller.undo();
    expect(
      selectedNote().techniques.find((t) => t.type === GuitarTechniqueType.Bend)
        ?.bendOptions
    ).toMatchObject({ type: BendType.Prebend, prebendPitch: 0.5 });
    controller.redo();
    expect(selectedNote().hasTechnique(GuitarTechniqueType.Bend)).toBe(false);
  });

  test("remove is ignored when the selected note has no bend", () => {
    const { callbacks, component, controller, selectedNote } = harness;
    callbacks.bind();
    harness.open();
    expect(component.template.removeButton.disabled).toBe(true);
    callbacks.onRemoveClicked();
    component.template.removeButton.click();

    expect(selectedNote().hasTechnique(GuitarTechniqueType.Bend)).toBe(false);
    expect(component.dialog.open).toBe(true);
    controller.undo();
    expect(controller.selectionAsBeats[0].notes).toBeNull();
  });

  test("cancel releases keyboard ownership and detaches the old graph controls", () => {
    const { callbacks, component, keyboard, selectedNote } = harness;
    callbacks.bind();
    harness.open();
    const point =
      component.template.bendSelectorGraphSVG.querySelector<SVGCircleElement>(
        'circle[aria-label="Bend point"]'
      );
    if (point === null) throw Error("Expected bend point");
    point.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    point.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    const before = point.getAttribute("cy");
    component.template.cancelButton.click();
    component.dialog.close();

    point.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(point.getAttribute("cy")).toBe(before);
    expect(component.dialog.open).toBe(false);
    expect(selectedNote().hasTechnique(GuitarTechniqueType.Bend)).toBe(false);
    expect(keyboard).toEqual({ captures: 1, releases: 1 });

    harness.open();
    const reopenedPoint =
      component.template.bendSelectorGraphSVG.querySelector<SVGCircleElement>(
        'circle[aria-label="Bend point"]'
      );
    if (reopenedPoint === null) throw Error("Expected reopened bend point");
    reopenedPoint.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    reopenedPoint.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp" })
    );
    expect(reopenedPoint.getAttribute("cy")).toBe("175");
    component.template.cancelButton.click();
    expect(keyboard).toEqual({ captures: 2, releases: 2 });
  });
});
