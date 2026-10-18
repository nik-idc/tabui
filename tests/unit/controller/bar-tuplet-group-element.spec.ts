/** @jest-environment jsdom */

import { BarTupletGroupElement } from "../../../src/notation/controller/element/bar/bar-tuplet-group-element";
import { TabBeatElement } from "../../../src/notation/controller/element/beat/tab-beat-element";
import { TabBeatRhythmElement } from "../../../src/notation/controller/element/beat/tab-beat-rhythm-element";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { NoteDuration, TupletSettings } from "../../../src/notation/model";
import { SVGTupletRenderer } from "../../../src/notation/render/svg/tuplet/svg-tuplet-renderer";
import { SVGTabBeatRhythmRenderer } from "../../../src/notation/render/svg/svg-tab-beat-rhythm-renderer";
import { createBarWithBeats } from "../model/helpers";
import { required } from "../required";
import { TEST_LAYOUT_DIMENSIONS } from "./helpers";

function renderTuplet(settings: TupletSettings, count: number) {
  const { track, beats } = createBarWithBeats([
    // An earlier beat makes accidental bar-origin placement visible.
    { baseDuration: NoteDuration.Quarter },
    ...Array.from({ length: count }, () => ({
      baseDuration: NoteDuration.Sixteenth,
      tupletSettings: settings,
    })),
  ]);
  const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
  controller.trackElement.update();
  const firstBeat = required(controller.trackElement.getBeatElement(beats[1]));
  const tuplet = required(
    firstBeat.barElement
      .refreshOwnedNotationNodes()
      .find(
        (e): e is BarTupletGroupElement => e instanceof BarTupletGroupElement
      )
  );
  const renderer = new SVGTupletRenderer(controller, tuplet, {
    baseUrl: "",
    variant: "light",
  });
  renderer.render();
  const rhythm = required(
    firstBeat.barElement
      .refreshOwnedNotationNodes()
      .find(
        (e): e is TabBeatRhythmElement =>
          e instanceof TabBeatRhythmElement && e.beat === beats[1]
      )
  );
  const rhythmRenderer = new SVGTabBeatRhythmRenderer(controller, rhythm, {
    baseUrl: "",
    variant: "light",
  });
  rhythmRenderer.render();
  const durationStem = required(
    rhythmRenderer
      .ensureContainerGroup()
      .querySelector(".tu-beat-duration line")
  );
  // Both renderers write bar-local SVG coordinates, including the rhythm row origin.
  const durationBottom = Number(required(durationStem.getAttribute("y2")));

  return {
    group: renderer.ensureContainerGroup(),
    durationBottom,
    beatElements: beats.slice(1).map((b) => {
      const element = controller.trackElement.getBeatElement(b);
      if (!(element instanceof TabBeatElement)) {
        throw new Error("Expected a rendered tab beat");
      }
      return element;
    }),
  };
}

describe("Rendered tuplets", () => {
  test.each([
    [{ normalCount: 3, tupletCount: 2 }, "3"],
    [{ normalCount: 5, tupletCount: 3 }, "5:3"],
  ] as const)(
    "complete %j spans its beat attacks with a centered %s label",
    (settings, label) => {
      const { group, beatElements, durationBottom } = renderTuplet(
        settings,
        settings.normalCount
      );
      const text = required(group.querySelector("text"));
      const path = required(group.querySelector("path"));
      const firstAttack = beatElements[0].attackXBarLocal;
      const lastAttack = beatElements[beatElements.length - 1].attackXBarLocal;

      expect(group.querySelectorAll("text")).toHaveLength(1);
      expect(group.querySelectorAll("path")).toHaveLength(1);
      expect(group.querySelector("[data-tuplet-beat-index]")).toBeNull();
      expect(text.textContent).toBe(label);
      expect(text.getAttribute("text-anchor")).toBe("middle");
      expect(Number(text.getAttribute("x"))).toBeCloseTo(
        (firstAttack + lastAttack) / 2
      );

      // The bracket starts at the first attack and ends at the last attack.
      const coordinates = required(
        required(path.getAttribute("d")).match(/-?\d+(?:\.\d+)?/g)
      ).map(Number);
      expect(coordinates).toHaveLength(8);
      expect(coordinates[0]).toBeCloseTo(firstAttack);
      expect(coordinates[0] + coordinates[4]).toBeCloseTo(lastAttack);
      expect(coordinates[2]).toBe(0);
      expect(coordinates[3]).toBeGreaterThan(0);
      expect(coordinates[5]).toBe(0);
      expect(coordinates[6]).toBe(0);
      expect(coordinates[7]).toBe(-coordinates[3]);
      expect(coordinates[1]).toBeGreaterThan(durationBottom);
      expect(Number(text.getAttribute("y"))).toBeGreaterThan(durationBottom);
      expect(Number(text.getAttribute("y"))).toBeGreaterThan(coordinates[1]);
    }
  );

  test("incomplete tuplets show one label at each beat attack without a bracket", () => {
    const { group, beatElements, durationBottom } = renderTuplet(
      { normalCount: 3, tupletCount: 2 },
      2
    );
    const texts = [...group.querySelectorAll("text")];

    expect(group.querySelector("path")).toBeNull();
    expect(texts.map((t) => t.textContent)).toEqual(["3", "3"]);
    expect(texts.map((t) => t.getAttribute("data-tuplet-beat-index"))).toEqual([
      "0",
      "1",
    ]);
    for (let i = 0; i < texts.length; i++) {
      expect(Number(texts[i].getAttribute("x"))).toBeCloseTo(
        beatElements[i].attackXBarLocal
      );
      expect(Number(texts[i].getAttribute("y"))).toBeGreaterThan(
        durationBottom
      );
    }
  });
});
