/** @jest-environment jsdom */

import { SVGTechniqueLabelRenderer } from "../../../src/notation/render/svg/svg-technique-label-renderer";
import { TrackController } from "../../../src/notation/controller/track-controller";
import {
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
} from "../../../src/notation/model";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { createBarWithBeats } from "../model/helpers";
import { required } from "../required";

function setupRenderer() {
  const { track, beats } = createBarWithBeats([
    { baseDuration: NoteDuration.Quarter },
    { baseDuration: NoteDuration.Quarter },
  ]);
  const note = required(beats[0].notes)[0] as GuitarNote;
  note.fret = 5;
  note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.Vibrato));
  const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
  controller.trackElement.update();
  const currentLabel = () =>
    required(
      controller.trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer.techGapLines[1]?.labelElements[0]
    );
  const renderer = new SVGTechniqueLabelRenderer(controller, currentLabel(), {
    baseUrl: "/assets",
    variant: "light",
  });
  return { controller, beats, renderer, currentLabel };
}

test("label callbacks use the current element and are replaced", () => {
  const { controller, renderer, currentLabel } = setupRenderer();
  const first = jest.fn();
  const second = jest.fn();
  renderer.attachMouseEvent("click", first);
  renderer.attachMouseEvent("click", second);
  controller.trackElement.update();
  const label = currentLabel();
  renderer.updateElementReference(label);
  const group = renderer.ensureContainerGroup();
  const event = new MouseEvent("click");
  group.dispatchEvent(event);

  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledTimes(1);
  expect(second.mock.calls[0][0]).toBe(event);
  expect(second.mock.calls[0][1]).toBe(label);

  document.body.appendChild(group);
  renderer.detachContainerGroup();
  group.dispatchEvent(new MouseEvent("click"));
  expect(group.isConnected).toBe(false);
  expect(second).toHaveBeenCalledTimes(1);
});

test("label hit paths follow real descriptors after a duration edit and are cleaned up", () => {
  const { controller, beats, renderer, currentLabel } = setupRenderer();
  renderer.render();
  const group = renderer.ensureContainerGroup();
  const hitPath = required(
    group.querySelector('[id^="technique-label-hit-path-"]')
  );
  const visiblePath = required(
    group.querySelector('[id^="technique-label-path-"]')
  );
  const originalPath = hitPath.getAttribute("d");
  expect(hitPath.getAttribute("stroke-width")).toBe("6");
  expect(hitPath.getAttribute("pointer-events")).toBe("stroke");
  expect(hitPath.getAttribute("stroke")).toBe("transparent");
  expect(originalPath).toBe(visiblePath.getAttribute("d"));
  expect(hitPath.getAttribute("transform")).toBe(
    visiblePath.parentElement?.getAttribute("transform")
  );

  beats[0].baseDuration = NoteDuration.Eighth;
  beats[0].voiceBar.rebuildTiming();
  controller.trackElement.update();
  renderer.updateElementReference(currentLabel());
  renderer.render();

  expect(
    group.querySelectorAll('[id^="technique-label-hit-path-"]')
  ).toHaveLength(1);
  expect(hitPath.getAttribute("d")).not.toBe(originalPath);
  expect(hitPath.getAttribute("d")).toBe(visiblePath.getAttribute("d"));
  expect(hitPath.getAttribute("transform")).toBe(
    visiblePath.parentElement?.getAttribute("transform")
  );

  renderer.unrender();
  expect(group.childElementCount).toBe(0);
  renderer.render();
  expect(
    group.querySelectorAll('[id^="technique-label-hit-path-"]')
  ).toHaveLength(1);
});
