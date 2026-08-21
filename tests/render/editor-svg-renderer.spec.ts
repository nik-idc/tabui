import { NotationElement } from "../../src/notation/controller";
import { EditorRenderOptions } from "../../src/notation/render";
import { ElementRenderer } from "../../src/notation/render/element-renderer";
import { EditorSVGRenderer } from "../../src/notation/render/svg/editor-svg-renderer";
import { Rect } from "../../src/shared";

type RendererReconciliationHarness = {
  renderVisibleElementRenderers(
    elementsByUpdateStatus: Map<NotationElement, boolean>,
    options: EditorRenderOptions
  ): ElementRenderer[];
  createRendererElement: jest.Mock;
  isRendererMounted: jest.Mock;
  mountRenderer: jest.Mock;
};

type HorizontalViewportHarness = {
  trackController: {
    trackElement: {
      trackLineElements: Array<{
        trackLineBars: Array<{
          x: number;
          finalizedWidth: number;
          masterBarIndex: number;
        }>;
      }>;
    };
  };
  _viewportRect: Rect;
  getMasterBarsInViewport(): { start: number; end: number };
};

type VerticalViewportHarness = {
  trackController: {
    trackElement: {
      trackLineElements: Array<{ globalBoundingBox: Rect }>;
    };
  };
  _viewportRect: Rect;
  getLinesInViewport(): { start: number; end: number };
};

describe("EditorSVGRenderer ownership", () => {
  test("mounts a retained renderer after updating its element reference", () => {
    const element = {
      getStableIdentity: () => "note-slot:1:1",
    } as unknown as NotationElement;
    const elementRenderer = {
      updateElementReference: jest.fn(),
      render: jest.fn(),
    } as unknown as ElementRenderer;
    const harness = Object.create(
      EditorSVGRenderer.prototype
    ) as RendererReconciliationHarness;
    harness.createRendererElement = jest.fn(() => ({
      renderer: elementRenderer,
      isNewRenderer: false,
    }));
    harness.isRendererMounted = jest.fn(() => true);
    harness.mountRenderer = jest.fn();
    const options: EditorRenderOptions = {
      renderNotation: true,
      forceNotation: false,
      overlays: { selection: false, player: false },
    };

    const renderers = harness.renderVisibleElementRenderers(
      new Map([[element, false]]),
      options
    );

    expect(elementRenderer.updateElementReference).toHaveBeenCalledWith(
      element
    );
    expect(harness.mountRenderer).toHaveBeenCalledWith(
      elementRenderer,
      element
    );
    expect(elementRenderer.render).not.toHaveBeenCalled();
    expect(renderers).toEqual([elementRenderer]);
  });

  test("includes bounded master-bar overscan in the horizontal viewport", () => {
    const harness = Object.create(
      EditorSVGRenderer.prototype
    ) as HorizontalViewportHarness;
    harness.trackController = {
      trackElement: {
        trackLineElements: [
          {
            trackLineBars: Array.from({ length: 10 }, (_, i) => ({
              x: i * 100,
              finalizedWidth: 100,
              masterBarIndex: i,
            })),
          },
        ],
      },
    };
    harness._viewportRect = new Rect(250, 0, 200, 100);

    expect(harness.getMasterBarsInViewport()).toEqual({ start: 0, end: 6 });
  });

  test("returns the bounded nearest-line range outside the vertical viewport", () => {
    const harness = Object.create(
      EditorSVGRenderer.prototype
    ) as VerticalViewportHarness;
    harness._viewportRect = new Rect(0, 10_000, 800, 400);
    harness.trackController = {
      trackElement: {
        trackLineElements: Array.from({ length: 20 }, (_, i) => ({
          globalBoundingBox: new Rect(0, i * 100, 800, 80),
        })),
      },
    };

    expect(harness.getLinesInViewport()).toEqual({ start: 17, end: 19 });
  });
});
