import { SideControlsTemplateRenderer } from "../../../src/ui/side-controls/side-controls-template-renderer";
import { SideControlsCallbacks } from "../../../src/ui/side-controls/side-controls-callbacks";
import { TopControlsCallbacks } from "../../../src/ui/top-controls/top-controls-callbacks";
import { UICallbacks } from "../../../src/ui/ui-callbacks";
import { UIComponent } from "../../../src/ui";
import {
  asNotationComponent,
  createNotationComponentMock,
  makeButton,
} from "./helpers";

describe("UICallbacks", () => {
  test("side editing controls render inert during playback", () => {
    const container = makeButton() as any;
    const renderer = Object.create(SideControlsTemplateRenderer.prototype);
    renderer.notationComponent = {
      trackController: { isPlaybackActive: true, editingEnabled: true },
    };
    renderer.template = { container };
    renderer._assembled = true;

    renderer.render();

    expect(container.inert).toBe(true);
    expect(container.classList.toggle).toHaveBeenCalledWith(
      "tu-editing-disabled",
      true
    );
    expect(container.setAttribute).toHaveBeenCalledWith(
      "aria-disabled",
      "true"
    );
  });

  test("bind and unbind delegate no more than once on repeated bind/unbind calls", () => {
    const topBind = jest
      .spyOn(TopControlsCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const topUnbind = jest
      .spyOn(TopControlsCallbacks.prototype, "unbind")
      .mockImplementation(() => {});
    const sideBind = jest
      .spyOn(SideControlsCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const sideUnbind = jest
      .spyOn(SideControlsCallbacks.prototype, "unbind")
      .mockImplementation(() => {});

    const callbacks = new UICallbacks(
      {
        topComponent: { scoreComponent: {}, playComponent: {} },
        sideComponent: {
          noteControlsComponent: {},
          techniqueControlsComponent: {},
          measureControlsComponent: {},
        },
      } as unknown as UIComponent,
      asNotationComponent(createNotationComponentMock()),
      () => {},
      () => {},
      () => {},
      () => {}
    );

    callbacks.bind();
    callbacks.bind();
    callbacks.unbind();
    callbacks.unbind();

    expect(topBind).toHaveBeenCalledTimes(1);
    expect(topUnbind).toHaveBeenCalledTimes(1);
    expect(sideBind).toHaveBeenCalledTimes(1);
    expect(sideUnbind).toHaveBeenCalledTimes(1);
  });
});
