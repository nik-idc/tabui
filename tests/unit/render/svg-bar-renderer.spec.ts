/** @jest-environment jsdom */

import { SVGBarRenderer } from "../../../src/notation/render/svg/svg-bar-renderer";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { BarRepeatStatus, NoteDuration } from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { required } from "../required";

test("bar callbacks route rendered targets using the current element and detach on reuse", () => {
  const { track, beats } = createBarWithBeats([
    { baseDuration: NoteDuration.Quarter },
  ]);
  const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
  controller.setSelectedBarRepeatStatus({
    status: BarRepeatStatus.Start,
    enabled: true,
  });
  controller.setSelectedBarRepeatStatus({
    status: BarRepeatStatus.End,
    enabled: true,
    repeatCount: 3,
  });
  controller.trackElement.update();
  const original = required(
    controller.trackElement.getBeatElement(beats[0])
  ).barElement;
  const renderer = new SVGBarRenderer(controller, original, {
    baseUrl: "/assets",
    variant: "light",
  });
  renderer.render();
  const group = renderer.ensureContainerGroup();
  document.body.appendChild(group);
  const oldEvents: string[] = [];
  const events: Array<{
    event: MouseEvent;
    element: typeof original;
    kind: string;
  }> = [];
  renderer.attachMouseEvent("click", () => oldEvents.push("click"));
  renderer.attachMouseEvent("click", (event, element, kind) =>
    events.push({ event, element, kind })
  );
  const nextController = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
  nextController.trackElement.update();
  const current = required(
    nextController.trackElement.getBeatElement(beats[0])
  ).barElement;
  expect(current).not.toBe(original);
  renderer.updateElementReference(current);
  const targets = [
    [".tu-repeat-start", "repeatStart"],
    ['[id^="bar-rep-end-"]', "repeatEnd"],
    ['[id^="bar-rep-count-"]', "repeatEnd"],
    ['[id^="bar-sig-"]', "timeSignature"],
  ];
  const click = (selector: string) => {
    const event = new MouseEvent("click", { bubbles: true });
    required(group.querySelector(selector)).dispatchEvent(event);
    return event;
  };
  for (const [selector, kind] of targets) {
    const event = click(selector);
    const received = required(events.at(-1));
    expect(received.event).toBe(event);
    expect(received.element).toBe(current);
    expect(received.kind).toBe(kind);
  }
  expect(events).toHaveLength(4);
  expect(oldEvents).toEqual([]);
  click('[id^="bar-border-"]');
  expect(events).toHaveLength(4);
  renderer.detachContainerGroup();
  expect(group.isConnected).toBe(false);
  click(".tu-repeat-start");
  expect(events).toHaveLength(4);
  renderer.attachMouseEvent("click", (event, element, kind) =>
    events.push({ event, element, kind })
  );
  click(".tu-repeat-start");
  expect(events).toHaveLength(5);
  renderer.detachMouseEvent("click");
  click(".tu-repeat-start");
  expect(events).toHaveLength(5);
});
