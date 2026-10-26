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
  note.setFret(5);
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

test("label paths update after a duration edit and are cleaned up", () => {
  const { controller, beats, renderer, currentLabel } = setupRenderer();
  renderer.render();
  const group = renderer.ensureContainerGroup();
  const visiblePath = required(
    group.querySelector('[id^="technique-label-path-"]')
  );
  const originalPath = visiblePath.getAttribute("d");

  beats[0].baseDuration = NoteDuration.Eighth;
  beats[0].voiceBar.rebuildTiming();
  controller.trackElement.update();
  renderer.updateElementReference(currentLabel());
  renderer.render();

  expect(group.querySelectorAll('[id^="technique-label-path-"]')).toHaveLength(
    1
  );
  expect(visiblePath.getAttribute("d")).not.toBe(originalPath);

  renderer.unrender();
  expect(group.childElementCount).toBe(0);
  renderer.render();
  expect(group.querySelectorAll('[id^="technique-label-path-"]')).toHaveLength(
    1
  );
});
