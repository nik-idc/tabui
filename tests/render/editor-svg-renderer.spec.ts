import { NotationElement } from "../../src/notation/controller";
import { EditorRenderOptions } from "../../src/notation/render";
import { ElementRenderer } from "../../src/notation/render/element-renderer";
import { EditorSVGRenderer } from "../../src/notation/render/svg/editor-svg-renderer";

type RendererReconciliationHarness = {
  renderVisibleElementRenderers(
    elementsByUpdateStatus: Map<NotationElement, boolean>,
    options: EditorRenderOptions
  ): ElementRenderer[];
  createRendererElement: jest.Mock;
  isRendererMounted: jest.Mock;
  mountRenderer: jest.Mock;
};

describe("EditorSVGRenderer ownership", () => {
  test("verifies the parent of a retained unchanged renderer", () => {
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
});
