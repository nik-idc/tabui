/** @jest-environment jsdom */

import { SVGTrackLineInfoRenderer } from "../../../src/notation/render/svg/svg-track-line-info-renderer";
import { createScoreGraph } from "../model/helpers";
import { createTestTrackController } from "../controller/helpers";
import { required } from "../required";

test("tempo callbacks resolve current bars and detach before renderer reuse", () => {
  const { track } = createScoreGraph();
  const controller = createTestTrackController(track);
  controller.trackElement.update();
  const currentInfo = () =>
    required(controller.trackElement.trackLineElements[0].trackLineInfoElement);
  const renderer = new SVGTrackLineInfoRenderer(controller, currentInfo(), {
    baseUrl: "/assets",
    variant: "light",
  });
  renderer.render();
  const group = renderer.ensureContainerGroup();
  const image = required(group.querySelector("image"));
  const text = required(group.querySelector("text"));
  expect(text.textContent).toBe("=120");
  const oldBar = required([...currentInfo().barTempoRectsMap.keys()][0]);
  const oldHandler = jest.fn();
  const handler = jest.fn();
  renderer.attachMouseEvent("click", oldHandler);
  renderer.attachMouseEvent("click", handler);
  controller.trackElement.update();
  const info = currentInfo();
  const currentBar = required([...info.barTempoRectsMap.keys()][0]);
  expect(currentBar).not.toBe(oldBar);
  expect(currentBar.bar).toBe(oldBar.bar);
  renderer.updateElementReference(info);
  const event = new MouseEvent("click", { bubbles: true });
  image.dispatchEvent(event);
  expect(oldHandler).not.toHaveBeenCalled();
  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler.mock.calls[0][0]).toBe(event);
  expect(handler.mock.calls[0][1]).toBe(currentBar);
  group.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(handler).toHaveBeenCalledTimes(1);

  document.body.appendChild(group);
  renderer.detachContainerGroup();
  expect(group.isConnected).toBe(false);
  text.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(handler).toHaveBeenCalledTimes(1);
  renderer.attachMouseEvent("click", handler);
  text.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(handler).toHaveBeenCalledTimes(2);
  renderer.detachMouseEvent("click");
  image.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(handler).toHaveBeenCalledTimes(2);
});
