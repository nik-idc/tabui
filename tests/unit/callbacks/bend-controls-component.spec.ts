/** @jest-environment jsdom */

import {
  BendTechniqueOptions,
  BendType,
  GuitarTechniqueType,
} from "../../../src/notation/model";
import { createBendControlsHarness } from "./bend-controls-test-helpers";

describe("BendControlsComponent", () => {
  let harness: ReturnType<typeof createBendControlsHarness>;
  beforeEach(() => {
    harness = createBendControlsHarness();
  });
  afterEach(() => harness.dispose());

  function prepareContinuation(
    pitch: number,
    letRing = true,
    releasing = false
  ) {
    const { controller } = harness;
    controller.setTechnique(
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: releasing ? BendType.BendAndRelease : BendType.Bend,
        bendPitch: pitch,
        bendDuration: 0.75,
        ...(releasing ? { releasePitch: 0 } : {}),
      })
    );
    controller.insertBeatAfterSelected();
    controller.setSelectedNoteFret(5);
    if (letRing) controller.setTechnique(GuitarTechniqueType.LetRing);
    harness.component.prepareForOpen();
  }

  test("template renderer highlights only the selected bend type", () => {
    const { component } = harness;
    for (const selected of [BendType.Release, BendType.PrebendBend]) {
      component.templateRenderer.setSelectedBendType(selected);
      for (const [type, button] of Object.entries(
        component.template.bendTypesButtons
      )) {
        expect(button.classList.contains("tu-applied-button")).toBe(
          Number(type) === selected
        );
        expect(button.getAttribute("aria-pressed")).toBe(
          `${Number(type) === selected}`
        );
      }
    }
  });

  test("initializes the selector from an existing bend", () => {
    const { component, controller } = harness;
    controller.setTechnique(
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({
        type: BendType.PrebendBend,
        prebendPitch: 0.5,
        bendPitch: 1,
        bendDuration: 0.75,
      })
    );

    component.prepareForOpen();

    expect(component.template.removeButton.disabled).toBe(false);
    expect(
      component.template.bendTypesButtons[BendType.PrebendBend].getAttribute(
        "aria-pressed"
      )
    ).toBe("true");
    const graph = component.template.bendSelectorGraphSVG;
    const prebend = graph.querySelector('circle[aria-label="Prebend point"]');
    const bend = graph.querySelector('circle[aria-label="Bend point"]');
    expect(prebend?.getAttribute("cy")).toBe("250");
    expect(bend?.getAttribute("cy")).toBe("200");
    expect(bend?.getAttribute("cx")).toBe("320");
  });

  test("enables Hold and Release after a non-releasing bend", () => {
    prepareContinuation(1);
    const { component } = harness;
    expect(component.template.bendTypesButtons[BendType.Hold].disabled).toBe(
      false
    );
    expect(component.template.bendTypesButtons[BendType.Release].disabled).toBe(
      false
    );
    expect(component.template.bendTypesButtons[BendType.Prebend].disabled).toBe(
      true
    );
    expect(
      component.template.bendTypesButtons[BendType.PrebendAndRelease].disabled
    ).toBe(true);
    expect(
      component.template.bendTypesButtons[BendType.PrebendBend].disabled
    ).toBe(true);
    // The new bend must start from the previous note's full-tone bend.
    const start = component.template.bendSelectorGraphSVG.querySelector(
      "circle:not([tabindex])"
    );
    expect(start?.getAttribute("cy")).toBe("200");
  });

  test("disables Bend and Bend/Release at the maximum continuation pitch", () => {
    prepareContinuation(3);
    const { component } = harness;
    const graph = component.template.bendSelectorGraphSVG;
    expect(graph.querySelectorAll("circle[tabindex]")).toHaveLength(0);
    expect(graph.querySelector("circle")?.getAttribute("cy")).toBe("0");
    expect(
      component.template.bendTypesButtons[BendType.Hold].getAttribute(
        "aria-pressed"
      )
    ).toBe("true");
    expect(component.template.bendTypesButtons[BendType.Bend].disabled).toBe(
      true
    );
    expect(
      component.template.bendTypesButtons[BendType.BendAndRelease].disabled
    ).toBe(true);
    expect(component.template.bendTypesButtons[BendType.Hold].disabled).toBe(
      false
    );
    expect(component.template.bendTypesButtons[BendType.Release].disabled).toBe(
      false
    );
  });

  test("disables every prebend type on Let Ring notes without continuation", () => {
    const { component, controller } = harness;
    controller.setTechnique(GuitarTechniqueType.LetRing);
    component.prepareForOpen();

    expect(component.template.bendTypesButtons[BendType.Prebend].disabled).toBe(
      true
    );
    expect(
      component.template.bendTypesButtons[BendType.PrebendAndRelease].disabled
    ).toBe(true);
    expect(
      component.template.bendTypesButtons[BendType.PrebendBend].disabled
    ).toBe(true);
  });

  test("keeps Hold and Release disabled without Let Ring", () => {
    prepareContinuation(1, false);
    const { component } = harness;
    expect(component.template.bendTypesButtons[BendType.Hold].disabled).toBe(
      true
    );
    expect(component.template.bendTypesButtons[BendType.Release].disabled).toBe(
      true
    );
  });

  test("keeps Hold and Release disabled after a releasing bend", () => {
    prepareContinuation(1, true, true);
    const { component } = harness;
    expect(component.template.bendTypesButtons[BendType.Hold].disabled).toBe(
      true
    );
    expect(component.template.bendTypesButtons[BendType.Release].disabled).toBe(
      true
    );
  });
});
