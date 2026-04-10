import { TechniqueControlsDefaultCallbacks } from "../../src/callbacks/ui/effect-controls-callbacks";
import { BendControlsDefaultCallbacks } from "../../src/callbacks/ui/bend-controls-callbacks";
import { GuitarTechniqueType } from "../../src/notation/model";
import {
  createNotationComponentMock,
  dispatchClick,
  makeButton,
} from "./helpers";

describe("TechniqueControlsDefaultCallbacks", () => {
  test("effect buttons map to techniques and repeated bind does not double fire", () => {
    const bendBindSpy = jest
      .spyOn(BendControlsDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const bendUnbindSpy = jest
      .spyOn(BendControlsDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});

    const notationComponent = createNotationComponentMock();
    const renderFunc = jest.fn();
    const component = {
      template: {
        vibratoButton: makeButton(),
        palmMuteButton: makeButton(),
        nhButton: makeButton(),
        phButton: makeButton(),
        hammerOnButton: makeButton(),
        pullOffButton: makeButton(),
        slideButton: makeButton(),
        bendButton: makeButton(),
      },
      bendControlsComponent: {},
      showBendControls: jest.fn(),
    } as any;
    const callbacks = new TechniqueControlsDefaultCallbacks(
      component,
      notationComponent,
      renderFunc,
      jest.fn(),
      jest.fn()
    );

    callbacks.bind();
    callbacks.bind();
    dispatchClick(component.template.vibratoButton);
    dispatchClick(component.template.pullOffButton);
    dispatchClick(component.template.slideButton);
    dispatchClick(component.template.bendButton);

    expect(
      notationComponent.trackController.trackControllerEditor.setTechnique
    ).toHaveBeenNthCalledWith(1, GuitarTechniqueType.Vibrato);
    expect(
      notationComponent.trackController.trackControllerEditor.setTechnique
    ).toHaveBeenNthCalledWith(2, GuitarTechniqueType.HammerOnOrPullOff);
    expect(
      notationComponent.trackController.trackControllerEditor.setTechnique
    ).toHaveBeenNthCalledWith(3, GuitarTechniqueType.Slide);
    expect(renderFunc).toHaveBeenCalledTimes(3);
    expect(component.showBendControls).toHaveBeenCalledTimes(1);
    expect(bendBindSpy).toHaveBeenCalledTimes(2);

    const renderCallsBeforeUnbind = renderFunc.mock.calls.length;
    const techniqueCallsBeforeUnbind =
      notationComponent.trackController.trackControllerEditor.setTechnique.mock
        .calls.length;
    callbacks.unbind();
    dispatchClick(component.template.nhButton);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeUnbind);
    expect(
      notationComponent.trackController.trackControllerEditor.setTechnique
    ).toHaveBeenCalledTimes(techniqueCallsBeforeUnbind);
    expect(bendUnbindSpy).toHaveBeenCalledTimes(1);

    bendBindSpy.mockRestore();
    bendUnbindSpy.mockRestore();
  });
});
