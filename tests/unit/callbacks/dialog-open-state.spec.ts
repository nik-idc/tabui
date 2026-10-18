import { withNotationDialog } from "./notation-dialog-fixture";

describe("dialog open state", () => {
  test.each(["tempo", "time signature"] as const)(
    "%s discards cancelled drafts and reads the current selection on reopen",
    (name) => {
      withNotationDialog(({ controller, measure }) => {
        const component =
          name === "tempo"
            ? measure.tempoControlsComponent
            : measure.timeSigControlsComponent;
        const open = () =>
          name === "tempo"
            ? measure.showTempoControls()
            : measure.showTimeSigControls();
        open();
        const values = component.template.dialogContainer.querySelectorAll(
          ".tu-number-stepper-value"
        );
        expect(Array.from(values, (v) => v.textContent)).toEqual(
          name === "tempo" ? ["120"] : ["4"]
        );
        if (name === "time signature") {
          expect(
            measure.timeSigControlsComponent.template.durationSelect.value
          ).toBe("4");
        }
        values[0].textContent = "99";
        component.dialog.requestClose();
        expect(component.dialog.open).toBe(false);
        if (name === "tempo") controller.setSelectedBarTempo(90);
        else controller.setSelectedBarTimeSignature(7, 1 / 8);
        open();
        expect(component.dialog.open).toBe(true);
        expect(Array.from(values, (v) => v.textContent)).toEqual(
          name === "tempo" ? ["90"] : ["7"]
        );
        if (name === "time signature") {
          expect(
            measure.timeSigControlsComponent.template.durationSelect.value
          ).toBe("8");
        }
      });
    }
  );

  test("tuplet discards cancelled drafts and reads the current selection on reopen", () => {
    withNotationDialog(({ controller, note }) => {
      controller.setSelectedBeatsTuplet(3, 2);
      note.showTupletControls();
      const component = note.tupletComponent;
      expect(component.template.normalValue.textContent).toBe("3");
      expect(component.template.tupletValue.textContent).toBe("2");
      component.template.normalValue.textContent = "99";
      component.dialog.requestClose();
      expect(component.dialog.open).toBe(false);
      controller.setSelectedBeatsTuplet(5, 4);
      note.showTupletControls();
      expect(component.dialog.open).toBe(true);
      expect(component.template.normalValue.textContent).toBe("5");
      expect(component.template.tupletValue.textContent).toBe("4");
    });
  });
});
