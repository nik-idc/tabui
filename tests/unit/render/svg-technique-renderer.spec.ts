/** @jest-environment jsdom */

import { TrackController } from "../../../src/notation/controller/track-controller";
import { TechniqueElement } from "../../../src/notation/controller/element/technique/technique-element";
import {
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
} from "../../../src/notation/model";
import { SVGTechniqueRenderer } from "../../../src/notation/render/svg/svg-technique-renderer";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { createScoreGraph } from "../model/helpers";
import { required } from "../required";

test("bindings use the current element and detach before reuse", () => {
  const { track, bar } = createScoreGraph();
  const beat = required(bar.getVoiceBar(1)).beats[0];
  const note = required(beat.notes)[0];
  if (!(note instanceof GuitarNote)) throw Error("Expected guitar note");
  note.setFret(5);
  note.addTechnique(
    new GuitarTechnique(note, GuitarTechniqueType.NaturalHarmonic)
  );
  const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
  controller.trackElement.update();
  const first = required(controller.trackElement.getBeatElement(beat))
    .noteElements[0].techniqueElements[0];
  const rebuilt = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
  rebuilt.trackElement.update();
  const current = required(rebuilt.trackElement.getBeatElement(beat))
    .noteElements[0].techniqueElements[0];
  expect(current).not.toBe(first);
  expect(current.technique).toBe(first.technique);

  const renderer = new SVGTechniqueRenderer(controller, first, {
    baseUrl: "/assets",
    variant: "light",
  });
  const group = renderer.ensureContainerGroup();
  document.body.appendChild(group);
  const received: Array<{ event: MouseEvent; element: TechniqueElement }> = [];
  let replacedHandlerRan = false;
  const handler = (event: MouseEvent, element: TechniqueElement) =>
    received.push({ event, element });
  try {
    renderer.attachMouseEvent("click", () => {
      replacedHandlerRan = true;
    });
    renderer.attachMouseEvent("click", handler);
    renderer.updateElementReference(current);
    const event = new MouseEvent("click");
    group.dispatchEvent(event);
    expect(replacedHandlerRan).toBe(false);
    expect(received).toEqual([{ event, element: current }]);
    expect(received[0].event).toBe(event);
    expect(received[0].element).toBe(current);

    renderer.detachContainerGroup();
    expect(group.parentNode).toBeNull();
    group.dispatchEvent(new MouseEvent("click"));
    expect(received).toHaveLength(1);

    document.body.appendChild(group);
    renderer.attachMouseEvent("click", handler);
    const reusedEvent = new MouseEvent("click");
    group.dispatchEvent(reusedEvent);
    expect(received).toEqual([
      { event, element: current },
      { event: reusedEvent, element: current },
    ]);
    renderer.detachMouseEvent("click");
    group.dispatchEvent(new MouseEvent("click"));
    expect(received).toHaveLength(2);
  } finally {
    renderer.detachContainerGroup();
  }
});
