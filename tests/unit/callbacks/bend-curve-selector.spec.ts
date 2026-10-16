/** @jest-environment jsdom */

import { BendOptionsData, BendType } from "../../../src/notation/model";
import { BendCurveSelector } from "../../../src/ui/side-controls/technique-controls/bend-controls/bend-selectors/bend-curve-selector";
import { required } from "../required";

const options = {
  width: 420,
  height: 300,
  gridOffset: 20,
  rowsCount: 12,
  colsCount: 12,
};

function createSelector(bend: BendOptionsData, continuationPitch?: number) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(svg);
  const selector = new BendCurveSelector(
    svg,
    options,
    bend,
    () => {},
    continuationPitch
  );
  selector.init();
  return { svg, selector };
}

afterEach(() => document.body.replaceChildren());

describe("BendCurveSelector", () => {
  // The 400px time axis starts at x=20; half duration is x=220.
  // The pitch grid spans 0–3 tones: full tone is y=200, half tone y=250.
  test.each<[BendOptionsData, string]>([
    [
      { type: BendType.Bend, bendPitch: 1, bendDuration: 0.5 },
      "M 20 300 Q 220 300, 220 200 L 420 200",
    ],
    [
      {
        type: BendType.BendAndRelease,
        bendPitch: 1,
        releasePitch: 0,
        bendDuration: 0.5,
      },
      "M 20 300 Q 220 300, 220 200 Q 320 200, 320 300",
    ],
    [
      {
        type: BendType.PrebendAndRelease,
        prebendPitch: 1,
        releasePitch: 0,
        bendDuration: 0.75,
      },
      "M 20 200 L 160 200 Q 320 200, 320 300 L 420 300",
    ],
    [
      {
        type: BendType.PrebendBend,
        prebendPitch: 0.5,
        bendPitch: 1,
        bendDuration: 0.5,
      },
      "M 20 250 L 110 250 Q 220 250, 220 200 L 420 200",
    ],
    [
      { type: BendType.Release, releasePitch: 0, bendDuration: 0.75 },
      "M 20 200 L 160 200 Q 320 200, 320 300 L 420 300",
    ],
  ])("renders the complete curve for %j", (bend, expectedPath) => {
    const { svg, selector } = createSelector(bend);
    try {
      expect(svg.querySelector("path")?.getAttribute("d")).toBe(expectedPath);
      expect(selector.getBendTechnique()).toEqual(bend);
    } finally {
      selector.dispose();
    }
  });

  test.each<[BendOptionsData]>([
    [{ type: BendType.Hold, holdPitch: 2, bendDuration: 1 }],
    [{ type: BendType.Prebend, prebendPitch: 2 }],
  ])("renders a horizontal pitch line for %j", (bend) => {
    const { svg, selector } = createSelector(bend);
    try {
      expect(svg.querySelector("path")?.getAttribute("d")).toBe(
        "M 20 100 L 420 100"
      );
      expect(selector.getBendTechnique()).toEqual(bend);
    } finally {
      selector.dispose();
    }
  });

  test.each([BendType.Bend, BendType.BendAndRelease])(
    "starts continuation bend type %s at the inherited pitch",
    (type) => {
      const { svg, selector } = createSelector(
        {
          type,
          bendPitch: 2,
          bendDuration: 0.5,
          ...(type === BendType.BendAndRelease ? { releasePitch: 0.5 } : {}),
        },
        1.5
      );
      try {
        expect(svg.querySelector("path")?.getAttribute("d")).toBe(
          type === BendType.Bend
            ? "M 20 150 Q 220 150, 220 100 L 420 100"
            : "M 20 150 Q 220 150, 220 100 Q 320 100, 320 250"
        );
      } finally {
        selector.dispose();
      }
    }
  );

  test("emits Hold at the fixed continuation pitch", () => {
    const { svg, selector } = createSelector(
      { type: BendType.Hold, holdPitch: 2, bendDuration: 0.5 },
      1
    );
    try {
      expect(selector.getBendTechnique()).toEqual({
        type: BendType.Hold,
        holdPitch: 1,
        bendDuration: 0.5,
      });
      expect(svg.querySelector("path")?.getAttribute("d")).toBe(
        "M 20 200 L 420 200"
      );
      expect(svg.querySelectorAll('[tabindex="0"]')).toHaveLength(0);
    } finally {
      selector.dispose();
    }
  });

  test.each([BendType.Bend, BendType.BendAndRelease])(
    "does not emit continuation bend type %s below its inherited pitch",
    (type) => {
      const { svg, selector } = createSelector(
        {
          type,
          bendPitch: 0.5,
          bendDuration: 0.5,
          ...(type === BendType.BendAndRelease ? { releasePitch: 0 } : {}),
        },
        1.5
      );
      try {
        const handle = required(svg.querySelector('[aria-label="Bend point"]'));
        expect(selector.getBendTechnique().bendPitch).toBe(1.5);
        expect(handle.getAttribute("cy")).toBe("150");
        handle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
        expect(selector.getBendTechnique().bendPitch).toBe(1.75);
        expect(handle.getAttribute("cy")).toBe("125");
        for (let i = 0; i < 3; i++) {
          handle.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown" })
          );
        }
        expect(selector.getBendTechnique().bendPitch).toBe(1.5);
        expect(handle.getAttribute("cy")).toBe("150");
      } finally {
        selector.dispose();
      }
    }
  );
});
