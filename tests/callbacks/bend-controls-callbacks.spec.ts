import { BendControlsDefaultCallbacks } from "../../src/ui/side-controls/effect-controls/bend-controls/bend-controls-callbacks";
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
  const bendTypesButtons = {
    [BendType.Bend]: makeButton(),
    [BendType.BendAndRelease]: makeButton(),
    [BendType.Hold]: makeButton(),
    [BendType.Prebend]: makeButton(),
    [BendType.PrebendAndRelease]: makeButton(),
    [BendType.PrebendBend]: makeButton(),
    [BendType.Release]: makeButton(),
  };
  const confirmButton = makeButton();
  const cancelButton = makeButton();
  const removeButton = makeButton();
  const bendSelectorManager = {
    changeBendType: jest.fn(),
    getCurrentTechnique: jest.fn(() => ({
      type: BendType.Bend,
      bendPitch: 1,
      bendDuration: 1,
    })),
    dispose: jest.fn(),
  };
  const component = {
    template: {
      dialog,
      dialogContent,
      bendTypesButtons,
      confirmButton,
      cancelButton,
      removeButton,
    },
    bendSelectorManager,
    templateRenderer: {
      setSelectedBendType: jest.fn(),
    },
  } as any;
  const notationComponent = createNotationComponentMock();
  const renderFunc = jest.fn();
  const captureKeyboard = jest.fn();
  const freeKeyboard = jest.fn();
  const callbacks = new BendControlsDefaultCallbacks(
    component,
    notationComponent,
    renderFunc,
    captureKeyboard,
    freeKeyboard
  );

  return {
    callbacks,
    component,
    notationComponent,
    renderFunc,
    freeKeyboard,
    captureKeyboard,
    bendSelectorManager,
  };
}

describe("BendControlsDefaultCallbacks", () => {
  test("bend type buttons map to bend selector manager", () => {
    const { callbacks, component, bendSelectorManager } = createBendHarness();

    callbacks.onBendTypeClicked(BendType.PrebendAndRelease);

    expect(bendSelectorManager.changeBendType).toHaveBeenCalledWith(
      BendType.PrebendAndRelease
    );
    expect(component.templateRenderer.setSelectedBendType).toHaveBeenCalledWith(
      BendType.PrebendAndRelease
    );
  });

  test.each([
    BendType.Bend,
    BendType.BendAndRelease,
    BendType.Hold,
    BendType.Release,
    BendType.Prebend,
    BendType.PrebendAndRelease,
    BendType.PrebendBend,
  ])("disabled conditional bend type %s cannot be selected", (type) => {
    const { callbacks, component, bendSelectorManager } = createBendHarness();
    component.template.bendTypesButtons[type].disabled = true;

    callbacks.onBendTypeClicked(type);

    expect(bendSelectorManager.changeBendType).not.toHaveBeenCalled();
  });

  test("all rendered bend type buttons are bound to their model type", () => {
    const { callbacks, component, bendSelectorManager } = createBendHarness();
    callbacks.bind();

    dispatchClick(component.template.bendTypesButtons[BendType.PrebendBend]);
    dispatchClick(component.template.bendTypesButtons[BendType.Hold]);
    dispatchClick(component.template.bendTypesButtons[BendType.Release]);

    expect(bendSelectorManager.changeBendType).toHaveBeenNthCalledWith(
      1,
      BendType.PrebendBend
    );
    expect(bendSelectorManager.changeBendType).toHaveBeenNthCalledWith(
      2,
      BendType.Hold
    );
    expect(bendSelectorManager.changeBendType).toHaveBeenNthCalledWith(
      3,
      BendType.Release
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
    const setTechnique = notationComponent.trackController.setTechnique;

    callbacks.bind();
    callbacks.bind();
    const techniqueCallsBeforeConfirm = setTechnique.mock.calls.length;
    const renderCallsBeforeConfirm = renderFunc.mock.calls.length;
    const freeKeyboardCallsBeforeConfirm = freeKeyboard.mock.calls.length;
    dispatchClick(component.template.bendTypesButtons[BendType.BendAndRelease]);
    component.template.dialog.dispatch("focusin");
    dispatchClick(component.template.confirmButton);
    component.template.dialog.dispatch("close");

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

  test("invalid bend data does not mutate or close the dialog", () => {
    const { callbacks, component, notationComponent, renderFunc } =
      createBendHarness();
    component.bendSelectorManager.getCurrentTechnique.mockReturnValue({
      type: BendType.BendAndRelease,
      bendPitch: 1,
    });

    callbacks.onConfirmClicked();

    expect(
      notationComponent.trackController.setTechnique
    ).not.toHaveBeenCalled();
    expect(renderFunc).not.toHaveBeenCalled();
    expect(component.template.dialog.close).not.toHaveBeenCalled();
  });

  test("remove uses the undoable controller operation", () => {
    const { callbacks, component, notationComponent, renderFunc } =
      createBendHarness();

    callbacks.onRemoveClicked();

    expect(notationComponent.trackController.setTechnique).toHaveBeenCalledWith(
      GuitarTechniqueType.Bend
    );
    expect(renderFunc).toHaveBeenCalledTimes(1);
    expect(component.template.dialog.close).toHaveBeenCalledTimes(1);
  });

  test("remove is ignored when the selected note has no bend", () => {
    const { callbacks, component, notationComponent } = createBendHarness();
    component.template.removeButton.disabled = true;

    callbacks.onRemoveClicked();

    expect(
      notationComponent.trackController.setTechnique
    ).not.toHaveBeenCalled();
    expect(component.template.dialog.close).not.toHaveBeenCalled();
  });

  test("close cleanup captures and releases keyboard exactly once", () => {
    const {
      callbacks,
      component,
      captureKeyboard,
      freeKeyboard,
      bendSelectorManager,
    } = createBendHarness();
    callbacks.bind();

    component.template.dialog.dispatch("focusin");
    component.template.dialog.dispatch("focusin");
    callbacks.onCancelClicked();
    component.template.dialog.dispatch("close");
    component.template.dialog.dispatch("close");

    expect(captureKeyboard).toHaveBeenCalledTimes(1);
    expect(freeKeyboard).toHaveBeenCalledTimes(1);
    expect(bendSelectorManager.dispose).toHaveBeenCalledTimes(3);
  });

  test("Enter confirms while Escape remains native dialog behavior", () => {
    const { callbacks, component, notationComponent } = createBendHarness();
    const preventDefault = jest.fn();
    callbacks.bind();

    component.template.dialog.dispatch("keydown", {
      key: "Enter",
      preventDefault,
    });
    component.template.dialog.dispatch("keydown", {
      key: "Escape",
      preventDefault,
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.setTechnique
    ).toHaveBeenCalledTimes(1);
  });
});
