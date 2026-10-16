/** @jest-environment jsdom */

import { SVGTabBeatRhythmRenderer } from "../../../src/notation/render/svg/svg-tab-beat-rhythm-renderer";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { TabBeatRhythmElement } from "../../../src/notation/controller/element/beat/tab-beat-rhythm-element";
import { NoteDuration } from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { required } from "../required";

test("rendered rhythm targets use the current element and stop dispatching after detach", () => {
  const { track, beats } = createBarWithBeats([
    { baseDuration: NoteDuration.Eighth, dots: 2 },
  ]);
  function createControllerAndRhythm() {
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();
    const beatElement = required(
      controller.trackElement.getBeatElement(beats[0])
    );
    const rhythm = required(
      beatElement.barElement
        .refreshOwnedNotationNodes()
        .find(
          (v): v is TabBeatRhythmElement => v instanceof TabBeatRhythmElement
        )
    );
    return { controller, rhythm };
  }
  const { controller, rhythm } = createControllerAndRhythm();
  const renderer = new SVGTabBeatRhythmRenderer(controller, rhythm, {
    baseUrl: "",
    variant: "light",
  });
  renderer.render();
  const group = renderer.ensureContainerGroup();
  const oldHandler = jest.fn();
  const handler = jest.fn();
  renderer.attachMouseEvent("click", oldHandler);
  renderer.attachMouseEvent("click", handler);

  const current = createControllerAndRhythm().rhythm;
  expect(current).not.toBe(rhythm);
  expect(current.beat).toBe(rhythm.beat);
  renderer.updateElementReference(current);
  const targets = [
    [".tu-beat-duration line", "duration"],
    [".tu-beat-duration path", "duration"],
    [".tu-beat-dots circle", "dots"],
    [".tu-beat-dots path", "dots"],
  ] as const;
  for (const [selector, kind] of targets) {
    const target = required(group.querySelector(selector));
    const event = new MouseEvent("click", { bubbles: true });
    target.dispatchEvent(event);
    expect(handler).toHaveBeenLastCalledWith(event, current, kind);
  }
  expect(handler).toHaveBeenCalledTimes(4);
  expect(oldHandler).not.toHaveBeenCalled();

  group.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(handler).toHaveBeenCalledTimes(4);
  renderer.detachContainerGroup();
  required(group.querySelector(".tu-beat-duration path")).dispatchEvent(
    new MouseEvent("click", { bubbles: true })
  );
  expect(handler).toHaveBeenCalledTimes(4);
});
