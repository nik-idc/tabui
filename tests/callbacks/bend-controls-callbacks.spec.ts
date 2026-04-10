import { BendControlsDefaultCallbacks } from "../../src/callbacks/ui/bend-controls-callbacks";
import { BendType, GuitarTechniqueType } from "../../src/notation/model";
import {
  createNotationComponentMock,
  dispatchClick,
  FakeElement,
  makeButton,
  makeDialog,
} from "./helpers";

function createBendHarness() {
  const dialog = makeDialog();
  const dialogContent = new FakeElement();
  dialog.appendChild(dialogContent);
  const bendTypesButtons = [
    makeButton(),
    makeButton(),
    makeButton(),
    makeButton(),
  ];
  const confirmButton = makeButton();
  const cancelButton = makeButton();
  const bendSelectorManager = {
    changeBendType: jest.fn(),
    getCurrentTechnique: jest.fn(() => ({
      type: BendType.Bend,
      bendPitch: 1,
      bendDuration: 1,
    })),
  };
  const component = {
    template: {
      dialog,
      dialogContent,
      bendTypesButtons,
      confirmButton,
      cancelButton,
    },
    bendSelectorManager,
  } as any;
  const notationComponent = createNotationComponentMock();
  const renderFunc = jest.fn();
  const freeKeyboard = jest.fn();
  const callbacks = new BendControlsDefaultCallbacks(
    component,
    notationComponent,
    renderFunc,
    jest.fn(),
    freeKeyboard
  );

  return {
    callbacks,
    component,
    notationComponent,
    renderFunc,
    freeKeyboard,
    bendSelectorManager,
  };
}

describe("BendControlsDefaultCallbacks", () => {
  test("bend type buttons map to bend selector manager", () => {
    const { callbacks, bendSelectorManager } = createBendHarness();

    callbacks.onBendTypeClicked(BendType.PrebendAndRelease);

    expect(bendSelectorManager.changeBendType).toHaveBeenCalledWith(
      BendType.PrebendAndRelease
    );
  });

  test("confirm commits bend technique and lifecycle wiring is idempotent", () => {
    const {
      callbacks,
      component,
      notationComponent,
      renderFunc,
      freeKeyboard,
    } = createBendHarness();
    const setTechnique =
      notationComponent.trackController.trackControllerEditor.setTechnique;

    callbacks.bind();
    callbacks.bind();
    const techniqueCallsBeforeConfirm = setTechnique.mock.calls.length;
    const renderCallsBeforeConfirm = renderFunc.mock.calls.length;
    const freeKeyboardCallsBeforeConfirm = freeKeyboard.mock.calls.length;
    dispatchClick(component.template.bendTypesButtons[2]);
    dispatchClick(component.template.confirmButton);

    expect(setTechnique).toHaveBeenCalledTimes(techniqueCallsBeforeConfirm + 1);
    expect(setTechnique).toHaveBeenCalledWith(
      GuitarTechniqueType.Bend,
      expect.anything()
    );
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeConfirm + 1);
    expect(component.template.dialog.close).toHaveBeenCalledTimes(1);
    expect(freeKeyboard).toHaveBeenCalledTimes(
      freeKeyboardCallsBeforeConfirm + 1
    );

    const techniqueCallsBeforeUnbind = setTechnique.mock.calls.length;
    const renderCallsBeforeUnbind = renderFunc.mock.calls.length;
    callbacks.unbind();
    dispatchClick(component.template.confirmButton);
    expect(setTechnique).toHaveBeenCalledTimes(techniqueCallsBeforeUnbind);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeUnbind);
  });
});
