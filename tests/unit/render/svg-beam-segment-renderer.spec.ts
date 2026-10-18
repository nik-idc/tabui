/** @jest-environment jsdom */

import { SVGBeamSegmentRenderer } from "../../../src/notation/render/svg/svg-beam-segment-renderer";
import { BeamSegmentElement } from "../../../src/notation/controller/element/bar/beam-segment-element";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { NoteDuration } from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { required } from "../required";

test("rendered beams use the current segment and stop dispatching after detach", () => {
  const { track } = createBarWithBeats([
    { baseDuration: NoteDuration.Sixteenth },
    { baseDuration: NoteDuration.Eighth },
  ]);
  function createControllerAndSegment() {
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();
    const segment = required(
      controller.trackElement.trackLineElements[0].staffLineContainers[0].styleLinesAsArray[0].barElements[0]
        .refreshOwnedNotationNodes()
        .find((e): e is BeamSegmentElement => e instanceof BeamSegmentElement)
    );
    return { controller, segment };
  }
  const { controller, segment } = createControllerAndSegment();
  const renderer = new SVGBeamSegmentRenderer(controller, segment, {
    baseUrl: "",
    variant: "light",
  });
  renderer.render();
  const group = renderer.ensureContainerGroup();
  const oldHandler = jest.fn();
  const handler = jest.fn();
  renderer.attachMouseEvent("click", oldHandler);
  renderer.attachMouseEvent("click", handler);

  const current = createControllerAndSegment().segment;
  expect(current).not.toBe(segment);
  expect(current.curBeatElement.beat).toBe(segment.curBeatElement.beat);
  renderer.updateElementReference(current);
  const targets = [...group.querySelectorAll("rect, path")];
  // One shared beam and one secondary tail, each with an enlarged hit path.
  expect(group.querySelectorAll("rect")).toHaveLength(2);
  expect(group.querySelectorAll("path")).toHaveLength(2);
  for (const target of targets) {
    const event = new MouseEvent("click", { bubbles: true });
    target.dispatchEvent(event);
    expect(handler).toHaveBeenLastCalledWith(event, current);
  }
  expect(handler).toHaveBeenCalledTimes(4);
  expect(oldHandler).not.toHaveBeenCalled();

  renderer.detachContainerGroup();
  for (const target of targets) {
    target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }
  expect(handler).toHaveBeenCalledTimes(4);
});
