import { UICallbacks } from "../../src/callbacks/ui/ui-callbacks";
import { TopControlsCallbacks } from "../../src/callbacks/ui/top-callbacks";
import { SideControlsCallbacks } from "../../src/callbacks/ui/side-callbacks";

describe("UICallbacks", () => {
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
