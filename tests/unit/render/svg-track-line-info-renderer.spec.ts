/** @jest-environment jsdom */

import { EditorSVGRenderer } from "../../../src/notation/render/svg/editor-svg-renderer";
import { SVGTrackLineInfoRenderer } from "../../../src/notation/render/svg/svg-track-line-info-renderer";
import { SVGGuitarTuningRenderer } from "../../../src/notation/render/svg/svg-guitar-tuning-renderer";
import { GuitarTuningElement } from "../../../src/notation/controller/element/track/guitar-tuning-element";
import { createScoreGraph } from "../model/helpers";
import { createTestTrackController } from "../controller/helpers";
import { SelectedMoveDirection } from "../../../src/notation/controller/selection/selection-cursor";
import { required } from "../required";
import { NoteDuration } from "../../../src/notation/model";
import {
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
} from "../../../src/notation/model";

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
  const hitArea = required(group.querySelector(".tu-tempo-hit-area"));
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
  hitArea.dispatchEvent(event);
  expect(oldHandler).not.toHaveBeenCalled();
  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler.mock.calls[0][0]).toBe(event);
  expect(handler.mock.calls[0][1]).toBe(currentBar);
  group.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(handler).toHaveBeenCalledTimes(1);

  document.body.appendChild(group);
  renderer.detachContainerGroup();
  expect(group.isConnected).toBe(false);
  hitArea.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(handler).toHaveBeenCalledTimes(1);
  renderer.attachMouseEvent("click", handler);
  hitArea.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(handler).toHaveBeenCalledTimes(2);
  renderer.detachMouseEvent("click");
  hitArea.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(handler).toHaveBeenCalledTimes(2);
});

test("guitar tuning renders once with aligned uppercase pitch classes", () => {
  const { track } = createScoreGraph();
  const controller = createTestTrackController(track);
  controller.trackElement.update();
  const line = controller.trackElement.trackLineElements[0];
  const tuning = required(
    required(line.trackLineInfoElement).guitarTuningElement
  );
  const renderer = new SVGGuitarTuningRenderer(controller, tuning, {
    baseUrl: "/assets",
    variant: "light",
  });

  renderer.render();
  const labels = [...renderer.ensureContainerGroup().querySelectorAll("text")];
  expect(labels.map((label) => label.textContent)).toEqual([
    "E",
    "B",
    "G",
    "D",
    "A",
    "E",
  ]);
  expect(labels.map((label) => Number(label.getAttribute("y")))).toEqual(
    tuning.textYs
  );
  expect(tuning.textYs).toEqual(
    required(
      line.staffLineContainers[0].styleLinesAsArray[0].barElements[0]
    ).staffLinesLineLocal.map((staffLine) => staffLine.y)
  );
  expect(labels[0].getAttribute("font-size")).toBe(
    `${controller.trackElement.layoutDimensions.noteTextSize}px`
  );
  expect(labels[0].getAttribute("dominant-baseline")).toBe("middle");
  expect(tuning.boundingBox.right).toBeLessThanOrEqual(
    required(line.staffLineContainers[0].styleLinesAsArray[0].barElements[0])
      .boundingBox.x
  );
});

test("guitar tuning is an optional child only on the line containing bar zero", () => {
  const { score, track } = createScoreGraph();
  for (let i = 0; i < 8; i++) {
    score.appendMasterBar({
      tempo: 120,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      isRepeatStart: false,
      isRepeatEnd: false,
      repeatCount: null,
    });
  }
  const controller = createTestTrackController(track);
  controller.trackElement.update();
  const lines = controller.trackElement.trackLineElements;
  expect(lines.length).toBeGreaterThan(1);
  expect(lines[0].trackLineInfoElement?.guitarTuningElement).toBeDefined();
  expect(
    lines.slice(1).every((line) => {
      return line.trackLineInfoElement?.guitarTuningElement === undefined;
    })
  ).toBe(true);
  expect(
    lines[0].drawableNotationElements.filter(
      (element) => element instanceof GuitarTuningElement
    )
  ).toHaveLength(1);
});

test("editor renderer mounts and refreshes retained tuning after technique row changes", () => {
  const { track, bar } = createScoreGraph();
  const beat = required(bar.getVoiceBar(1)).beats[0];
  const note = required(required(beat.notes)[0]);
  if (!(note instanceof GuitarNote)) {
    throw Error("Expected guitar note");
  }
  const controller = createTestTrackController(track);
  const viewport = document.createElement("div");
  Object.defineProperties(viewport, {
    clientWidth: { value: 800 },
    clientHeight: { value: 400 },
  });
  const renderer = new EditorSVGRenderer(viewport, controller, {
    baseUrl: "/assets",
    variant: "light",
  });
  const render = () =>
    renderer.render({
      renderNotation: true,
      forceNotation: false,
      overlays: { selection: false, player: false },
    });

  try {
    render();
    const tuningText = required(viewport.querySelector(".tu-tuning text"));
    const initialY = Number(tuningText.getAttribute("y"));
    Object.defineProperty(SVGElement.prototype, "getBBox", {
      configurable: true,
      value: () => ({ x: 0, y: 0, width: 20, height: 12 }),
    });
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));
    controller.trackElement.update();
    render();
    const shiftedText = required(viewport.querySelector(".tu-tuning text"));
    expect(Number(shiftedText.getAttribute("y"))).not.toBe(initialY);

    note.removeTechnique(GuitarTechniqueType.LetRing);
    controller.trackElement.update();
    render();
    const restoredText = required(viewport.querySelector(".tu-tuning text"));
    expect(Number(restoredText.getAttribute("y"))).toBe(initialY);
  } finally {
    renderer.unrender();
  }
});

test("editor renderer keeps tuning mounted after inserting a beat through controller", () => {
  const { track, bar } = createScoreGraph();
  const controller = createTestTrackController(track);
  const viewport = document.createElement("div");
  Object.defineProperties(viewport, {
    clientWidth: { value: 800 },
    clientHeight: { value: 400 },
  });
  const renderer = new EditorSVGRenderer(viewport, controller, {
    baseUrl: "/assets",
    variant: "light",
  });

  try {
    renderer.render();
    expect(viewport.querySelectorAll(".tu-tuning text")).toHaveLength(6);
    const beat = required(bar.getVoiceBar(1)).beats[0];
    controller.insertBeatAfterSelected(beat);
    renderer.render();
    expect(viewport.querySelectorAll(".tu-tuning text")).toHaveLength(6);
  } finally {
    renderer.unrender();
  }
});

test("editor renderer keeps tuning mounted after moving right and appending a beat", () => {
  const { track, bar } = createScoreGraph();
  const controller = createTestTrackController(track);
  const viewport = document.createElement("div");
  Object.defineProperties(viewport, {
    clientWidth: { value: 800 },
    clientHeight: { value: 400 },
  });
  const renderer = new EditorSVGRenderer(viewport, controller, {
    baseUrl: "/assets",
    variant: "light",
  });

  try {
    renderer.render();
    const voiceBar = required(bar.getVoiceBar(1));
    const initialBeatCount = voiceBar.beats.length;
    expect(viewport.querySelectorAll(".tu-tuning text")).toHaveLength(6);
    controller.selectFirstBar();
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    expect(voiceBar.beats).toHaveLength(initialBeatCount + 1);
    renderer.render();
    expect(viewport.querySelectorAll(".tu-tuning text")).toHaveLength(6);
  } finally {
    renderer.unrender();
  }
});
