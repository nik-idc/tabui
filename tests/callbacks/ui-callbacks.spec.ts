import { UICallbacks } from "../../src/ui/ui-callbacks";
import { TopControlsCallbacks } from "../../src/ui/top-controls/top-controls-callbacks";
import { SideControlsCallbacks } from "../../src/ui/side-controls/side-controls-callbacks";
import { SideControlsTemplateRenderer } from "../../src/ui/side-controls/side-controls-template-renderer";
import { makeButton } from "./helpers";

describe("UICallbacks", () => {
  test("side editing controls render inert during playback", () => {
    const container = makeButton() as any;
    const renderer = Object.create(SideControlsTemplateRenderer.prototype);
    renderer.notationComponent = {
      trackController: { isPlaying: true, editingEnabled: true },
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

  test("bind and unbind delegate to top and side callbacks", () => {
    const topBindSpy = jest
      .spyOn(TopControlsCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const topUnbindSpy = jest
      .spyOn(TopControlsCallbacks.prototype, "unbind")
      .mockImplementation(() => {});
    const sideBindSpy = jest
      .spyOn(SideControlsCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const sideUnbindSpy = jest
      .spyOn(SideControlsCallbacks.prototype, "unbind")
      .mockImplementation(() => {});

    const callbacks = new UICallbacks(
      {
        topComponent: {
          scoreComponent: {
            newTrackComponent: {},
            trackComponents: [],
            template: {},
          },
          playComponent: {},
        },
        sideComponent: {
          noteControlsComponent: {},
          techniqueControlsComponent: {},
          measureControlsComponent: {},
        },
      } as any,
      {} as any,
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn()
    );

    callbacks.bind();
    callbacks.bind();
    expect(topBindSpy).toHaveBeenCalledTimes(1);
    expect(sideBindSpy).toHaveBeenCalledTimes(1);

    callbacks.unbind();
    expect(topUnbindSpy).toHaveBeenCalledTimes(1);
    expect(sideUnbindSpy).toHaveBeenCalledTimes(1);

    topBindSpy.mockRestore();
    topUnbindSpy.mockRestore();
    sideBindSpy.mockRestore();
    sideUnbindSpy.mockRestore();
  });
});
