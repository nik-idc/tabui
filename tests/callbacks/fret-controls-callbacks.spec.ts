import { Guitar } from "../../src/notation/model";
import { FretControlsDefaultCallbacks } from "../../src/ui/side-controls/note-controls/fret-controls";
import { createNotationComponentMock, FakeElement } from "./helpers";

function createHarness() {
  const notationComponent = createNotationComponentMock();
  const instrument = Object.create(Guitar.prototype) as Guitar;
  Object.defineProperty(instrument, "fretsCount", { value: 12 });
  notationComponent.trackController.track = { context: { instrument } };
  notationComponent.trackController.hasSelectedNote = true;

  const template = {
    dialog: new FakeElement(),
    dialogContent: new FakeElement(),
    noFretButton: new FakeElement(),
    deadButton: new FakeElement(),
    input: new FakeElement(),
    confirmButton: new FakeElement(),
    cancelButton: new FakeElement(),
  };
  const component = { template } as any;
  const renderFunc = jest.fn();
  const callbacks = new FretControlsDefaultCallbacks(
    component,
    notationComponent,
    renderFunc,
    jest.fn(),
    jest.fn()
  );

  return { callbacks, notationComponent, renderFunc, template };
}

describe("FretControlsDefaultCallbacks", () => {
  test("applies no fret, dead, and numeric values", () => {
    const { callbacks, notationComponent, renderFunc, template } =
      createHarness();

    template.input.value = "5";
    callbacks.onConfirmClicked();
    callbacks.onDeadClicked();
    callbacks.onNoFretClicked();
    template.input.value = "12";
    callbacks.onConfirmClicked();

    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenNthCalledWith(1, 5);
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenNthCalledWith(2, -1);
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenNthCalledWith(3, null);
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenNthCalledWith(4, 12);
    expect(renderFunc).toHaveBeenCalledTimes(4);
  });

  test("passes numeric values to the controller", () => {
    const { callbacks, notationComponent, renderFunc, template } =
      createHarness();

    const input = template.input;
    input.value = "13";
    callbacks.onConfirmClicked();

    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenCalledWith(13);
    expect(renderFunc).toHaveBeenCalledTimes(1);
  });
});
