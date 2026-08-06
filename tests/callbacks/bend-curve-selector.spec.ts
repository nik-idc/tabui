import { BendType } from "../../src/notation/model";
import { Point } from "../../src/shared";
import { buildBendPath } from "../../src/ui/side-controls/effect-controls/bend-controls/bend-selectors/bend-curve-selector";
import { BendCurveSelector } from "../../src/ui/side-controls/effect-controls/bend-controls/bend-selectors/bend-curve-selector";
import { FakeElement } from "./helpers";

const options = {
  width: 420,
  height: 300,
  gridOffset: 20,
  rowsCount: 12,
  colsCount: 12,
};

describe("buildBendPath", () => {
  test.each([
    [BendType.Bend, { bend: new Point(300, 100) }],
    [
      BendType.BendAndRelease,
      { bend: new Point(220, 100), release: new Point(320, 250) },
    ],
    [
      BendType.PrebendAndRelease,
      { prebend: new Point(20, 100), release: new Point(300, 250) },
    ],
    [
      BendType.PrebendBend,
      { prebend: new Point(20, 200), bend: new Point(300, 100) },
    ],
    [
      BendType.Release,
      { start: new Point(20, 100), release: new Point(300, 250) },
    ],
  ])("uses a quadratic curve for bend type %s", (type, points) => {
    expect(buildBendPath(type, points, options)).toContain(" Q ");
  });

  test("rejects a shape with missing control points", () => {
    expect(() => buildBendPath(BendType.Bend, {}, options)).toThrow(
      "Missing 'bend' control point"
    );
  });

  test("Hold and Prebend use the same horizontal shape", () => {
    const point = new Point(20, 100);

    expect(buildBendPath(BendType.Hold, { hold: point }, options)).toBe(
      buildBendPath(BendType.Prebend, { prebend: point }, options)
    );
  });

  test.each([BendType.Bend, BendType.BendAndRelease])(
    "starts continuation bend type %s at the inherited pitch",
    (type) => {
      const path = buildBendPath(
        type,
        {
          start: new Point(20, 150),
          bend: new Point(220, 100),
          release:
            type === BendType.BendAndRelease ? new Point(320, 250) : undefined,
        },
        options
      );

      expect(path).toContain("M 20 150");
      expect(path).toContain("Q 220 150, 220 100");
    }
  );
});

describe("BendCurveSelector", () => {
  test("emits Hold at the fixed continuation pitch", () => {
    const originalDocument = globalThis.document;
    const createElementNS = jest.fn(() => {
      const element = new FakeElement() as FakeElement & {
        style: Record<string, string>;
      };
      element.style = {};
      return element;
    });
    (
      globalThis as unknown as { document: { createElementNS: jest.Mock } }
    ).document = { createElementNS };
    const svg = new FakeElement() as unknown as SVGSVGElement;
    const selector = new BendCurveSelector(
      svg,
      options,
      {
        type: BendType.Hold,
        holdPitch: 2,
        bendDuration: 0.5,
      },
      1
    );

    selector.init();

    expect(selector.getBendTechnique()).toEqual({
      type: BendType.Hold,
      holdPitch: 1,
      bendDuration: 0.5,
    });

    if (originalDocument === undefined) {
      delete (globalThis as unknown as { document?: Document }).document;
    } else {
      globalThis.document = originalDocument;
    }
  });

  test.each([BendType.Bend, BendType.BendAndRelease])(
    "does not emit continuation bend type %s below its inherited pitch",
    (type) => {
      const originalDocument = globalThis.document;
      const createElementNS = jest.fn(() => {
        const element = new FakeElement() as FakeElement & {
          style: Record<string, string>;
        };
        element.style = {};
        return element;
      });
      (
        globalThis as unknown as { document: { createElementNS: jest.Mock } }
      ).document = { createElementNS };
      const svg = new FakeElement() as unknown as SVGSVGElement;
      const selector = new BendCurveSelector(
        svg,
        options,
        type === BendType.Bend
          ? { type, bendPitch: 0.5, bendDuration: 0.5 }
          : {
              type,
              bendPitch: 0.5,
              releasePitch: 0,
              bendDuration: 0.5,
            },
        1.5
      );

      selector.init();

      expect(selector.getBendTechnique().bendPitch).toBeGreaterThanOrEqual(1.5);
      const bend = (
        selector as unknown as {
          _points: Array<{ name: string; y: number }>;
        }
      )._points.find((point) => point.name === "bend");
      if (bend === undefined) {
        throw Error("Expected bend control point");
      }
      bend.y = options.height;
      (
        selector as unknown as {
          constrainPoints: (xStep: number, yStep: number) => void;
        }
      ).constrainPoints(
        (options.width - options.gridOffset) / options.colsCount,
        options.height / options.rowsCount
      );
      expect(selector.getBendTechnique().bendPitch).toBeGreaterThanOrEqual(1.5);

      if (originalDocument === undefined) {
        delete (globalThis as unknown as { document?: Document }).document;
      } else {
        globalThis.document = originalDocument;
      }
    }
  );
});
