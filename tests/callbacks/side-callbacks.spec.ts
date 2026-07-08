import { SideControlsCallbacks } from "../../src/ui/side-controls/side-controls-callbacks";
import { NoteControlsDefaultCallbacks } from "../../src/ui/side-controls/note-controls/note-controls-callbacks";
import { TechniqueControlsDefaultCallbacks } from "../../src/ui/side-controls/effect-controls/effect-controls-callbacks";
import { MeasureControlsDefaultCallbacks } from "../../src/ui/side-controls/measure-controls/measure-controls-callbacks";

describe("SideControlsCallbacks", () => {
  test("bind and unbind delegate to child callbacks", () => {
    const noteBindSpy = jest
      .spyOn(NoteControlsDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const noteUnbindSpy = jest
      .spyOn(NoteControlsDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});
    const techniqueBindSpy = jest
      .spyOn(TechniqueControlsDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const techniqueUnbindSpy = jest
      .spyOn(TechniqueControlsDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});
    const measureBindSpy = jest
      .spyOn(MeasureControlsDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const measureUnbindSpy = jest
      .spyOn(MeasureControlsDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});

    const callbacks = new SideControlsCallbacks(
      {
        noteControlsComponent: {},
        techniqueControlsComponent: {},
        measureControlsComponent: {},
      } as any,
      {} as any,
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn()
    );

    callbacks.bind();
    callbacks.bind();
    expect(noteBindSpy).toHaveBeenCalledTimes(1);
    expect(techniqueBindSpy).toHaveBeenCalledTimes(1);
    expect(measureBindSpy).toHaveBeenCalledTimes(1);

    callbacks.unbind();
    expect(noteUnbindSpy).toHaveBeenCalledTimes(1);
    expect(techniqueUnbindSpy).toHaveBeenCalledTimes(1);
    expect(measureUnbindSpy).toHaveBeenCalledTimes(1);

    noteBindSpy.mockRestore();
    noteUnbindSpy.mockRestore();
    techniqueBindSpy.mockRestore();
    techniqueUnbindSpy.mockRestore();
    measureBindSpy.mockRestore();
    measureUnbindSpy.mockRestore();
  });
});
