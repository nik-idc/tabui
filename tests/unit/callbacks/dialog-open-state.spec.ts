import { MeasureControlsComponent } from "../../../src/ui/side-controls/measure-controls/measure-controls-component";
import { NoteControlsComponent } from "../../../src/ui/side-controls/note-controls/note-controls-component";

describe("dialog open state", () => {
  test.each([
    ["tempo", "showTempoControls", "tempoControlsComponent", "120", "90"],
    [
      "time signature",
      "showTimeSigControls",
      "timeSigControlsComponent",
      "4/4",
      "7/8",
    ],
  ])(
    "%s re-renders the current selected model state before every open",
    (_name, showMethod, childName, initialValue, changedValue) => {
      let modelValue = initialValue;
      let draftValue = "";
      const calls: string[] = [];
      const child = {
        render: jest.fn(() => {
          calls.push("render");
          draftValue = modelValue;
        }),
        template: {
          dialog: {
            showModal: jest.fn(() => calls.push(`show:${draftValue}`)),
          },
        },
      };
      const component = {
        [childName]: child,
      } as any;

      (MeasureControlsComponent.prototype as any)[showMethod].call(component);
      draftValue = "cancelled draft";
      modelValue = changedValue;
      (MeasureControlsComponent.prototype as any)[showMethod].call(component);

      expect(calls).toEqual([
        "render",
        `show:${initialValue}`,
        "render",
        `show:${changedValue}`,
      ]);
    }
  );

  test("tuplet re-renders the current selected model state before every open", () => {
    let modelValue = "3:2";
    let draftValue = "";
    const calls: string[] = [];
    const child = {
      render: jest.fn(() => {
        calls.push("render");
        draftValue = modelValue;
      }),
      template: {
        dialog: {
          showModal: jest.fn(() => calls.push(`show:${draftValue}`)),
        },
      },
    };
    const component = { tupletComponent: child } as any;

    NoteControlsComponent.prototype.showTupletControls.call(component);
    draftValue = "cancelled draft";
    modelValue = "5:4";
    NoteControlsComponent.prototype.showTupletControls.call(component);

    expect(calls).toEqual(["render", "show:3:2", "render", "show:5:4"]);
  });
});
