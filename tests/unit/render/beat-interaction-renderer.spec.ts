/** @jest-environment jsdom */

import { TrackController } from "../../../src/notation/controller/track-controller";
import { BeatInteractionRenderer } from "../../../src/notation/render/svg/beat-interaction-renderer";
import { createScoreGraph } from "../model/helpers";
import { createTestLayoutDimensions } from "../controller/helpers";
import { required } from "../required";

// jsdom exposes SVG rectangles as SVGElement, without the browser subclass.
const originalSVGRectElement = Object.getOwnPropertyDescriptor(
  globalThis,
  "SVGRectElement"
);

beforeAll(() => {
  Object.defineProperty(globalThis, "SVGRectElement", {
    configurable: true,
    value: SVGElement,
  });
});

afterAll(() => {
  if (originalSVGRectElement === undefined) {
    Reflect.deleteProperty(globalThis, "SVGRectElement");
  } else {
    Object.defineProperty(globalThis, "SVGRectElement", originalSVGRectElement);
  }
});

function createHarness() {
  const { track, bar } = createScoreGraph();
  const dimensions = createTestLayoutDimensions();
  const controller = new TrackController(track, dimensions);
  controller.trackElement.update();
  const voiceBar = required(bar.getVoiceBar(1));
  const barElement = required(
    controller.trackElement.getBeatElement(voiceBar.beats[0])
  ).barElement;
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const renderer = new BeatInteractionRenderer(group, controller);
  return { controller, voiceBar, barElement, group, renderer };
}

describe("BeatInteractionRenderer end gaps", () => {
  test("renders and updates a three-gap target and a staff-centered hint", () => {
    const { controller, voiceBar, barElement, group, renderer } =
      createHarness();
    renderer.render([barElement]);

    const target = required(group.querySelector("[data-bar-end-gap-uuid]"));
    const hint = required(group.querySelector(".tu-end-gap-hint"));
    const bounds = barElement.globalBoundingBox;
    const lines = barElement.staffLinesGlobal;
    const targetWidth = Number(target.getAttribute("width"));
    const targetX = Number(target.getAttribute("x"));
    expect(targetWidth).toBeCloseTo(barElement.endGap.width * 3);
    expect(targetX + targetWidth).toBeCloseTo(bounds.right);
    expect(Number(target.getAttribute("y"))).toBeCloseTo(bounds.y);
    expect(Number(target.getAttribute("height"))).toBeCloseTo(bounds.height);
    expect(hint.textContent).toBe("+");
    expect(hint.getAttribute("pointer-events")).toBe("none");
    expect(hint.getAttribute("aria-hidden")).toBe("true");
    expect(Number(hint.getAttribute("x"))).toBeCloseTo(
      bounds.right - barElement.endGap.width * 1.5
    );
    expect(Number(hint.getAttribute("y"))).toBeCloseTo(
      (lines[0].y + lines[lines.length - 1].y) / 2
    );

    // Move this bar along the staff, then render its new public geometry.
    controller.insertBarBeforeSelected();
    const movedBarElement = required(
      controller.trackElement.getBeatElement(voiceBar.beats[0])
    ).barElement;
    renderer.render([movedBarElement]);
    const movedTarget = required(
      group.querySelector("[data-bar-end-gap-uuid]")
    );
    const movedHint = required(group.querySelector(".tu-end-gap-hint"));
    const movedBounds = movedBarElement.globalBoundingBox;
    expect(movedBounds.right).toBeGreaterThan(bounds.right);
    expect(Number(movedTarget.getAttribute("width"))).toBeCloseTo(
      movedBarElement.endGap.width * 3
    );
    expect(Number(movedTarget.getAttribute("x"))).toBeCloseTo(
      movedBounds.right - movedBarElement.endGap.width * 3
    );
    expect(Number(movedHint.getAttribute("x"))).toBeCloseTo(
      movedBounds.right - movedBarElement.endGap.width * 1.5
    );
    expect(group.childElementCount).toBe(2);

    // Fill the original bar through editing, then remove its target and hint.
    for (let i = 0; i < 3; i++) {
      const lastBeat = voiceBar.beats[voiceBar.beats.length - 1];
      controller.insertBeatAfterSelected(lastBeat);
    }
    const filledBarElement = required(
      controller.trackElement.getBeatElement(voiceBar.beats[0])
    ).barElement;
    renderer.render([filledBarElement]);
    expect(group.querySelector("[data-bar-end-gap-uuid]")).toBeNull();
    expect(group.querySelector(".tu-end-gap-hint")).toBeNull();
    renderer.unrender();
    expect(group.childElementCount).toBe(0);
  });

  test("end-gap clicks reach the current last beat, while pointer-down does not", () => {
    const { controller, voiceBar, barElement, group, renderer } =
      createHarness();
    renderer.render([barElement]);
    const reachedBeats: number[] = [];
    renderer.attachEvent("click", (_event, element) => {
      reachedBeats.push(element.beat.uuid);
    });
    renderer.attachEvent("mousedown", (_event, element) => {
      reachedBeats.push(element.beat.uuid);
    });
    const target = required(group.querySelector("[data-bar-end-gap-uuid]"));
    target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(reachedBeats).toEqual([]);
    target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(reachedBeats).toEqual([voiceBar.beats[0].uuid]);

    controller.insertBeatAfterSelected();
    const updatedBarElement = required(
      controller.trackElement.getBeatElement(voiceBar.beats[0])
    ).barElement;
    renderer.render([updatedBarElement]);
    const currentTarget = required(
      group.querySelector("[data-bar-end-gap-uuid]")
    );
    currentTarget.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(reachedBeats).toEqual([
      voiceBar.beats[0].uuid,
      voiceBar.beats[1].uuid,
    ]);

    renderer.detachEvent("click");
    currentTarget.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(reachedBeats).toHaveLength(2);
    renderer.unrender();
    expect(group.childElementCount).toBe(0);
  });
});
