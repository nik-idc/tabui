/** @jest-environment jsdom */

import { NoteDuration, Score } from "../../../src/notation/model";
import { NotationComponent } from "../../../src/notation/notation-component";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { TimeSigControlsDefaultCallbacks } from "../../../src/ui/side-controls/measure-controls/time-sig-controls/time-sig-controls-callbacks";
import { TimeSigControlsComponent } from "../../../src/ui/side-controls/measure-controls/time-sig-controls/time-sig-controls-component";
import { createTestTrackController } from "../controller/helpers";

function createTimeSigHarness(duration = NoteDuration.Quarter) {
  const score = new Score();
  score.masterBars[0].duration = duration;
  const controller = createTestTrackController(score.tracks[0]);
  const owner: Pick<NotationComponent, "trackController"> = {
    trackController: controller,
  };
  const notationComponent = owner as NotationComponent;
  const root = document.createElement("div");
  const dialogHost = document.createElement("div");
  root.appendChild(dialogHost);
  document.body.appendChild(root);
  const component = new TimeSigControlsComponent(
    root,
    new DialogEnforcer(dialogHost, () => {}),
    notationComponent,
    () => {}
  );
  const freeKeyboard = jest.fn();
  const callbacks = new TimeSigControlsDefaultCallbacks(
    component,
    notationComponent,
    () => {},
    () => {},
    freeKeyboard
  );
  component.render();
  component.dialog.showModal();

  return { callbacks, component, controller, score, freeKeyboard };
}

describe("TimeSigControlsDefaultCallbacks", () => {
  afterEach(() => document.body.replaceChildren());

  test("beats stepper clamps and duration selector validates", () => {
    // Storage supports 1/64, but the selector only offers denominators to 32.
    const { callbacks, component, score } = createTimeSigHarness(
      NoteDuration.SixtyFourth
    );

    callbacks.onBeatsStep(3);
    expect(component.template.beatsValue.textContent).toBe("7");
    callbacks.onBeatsStep(-100);
    expect(component.template.beatsValue.textContent).toBe("1");
    expect(component.template.beatsDownButton.disabled).toBe(true);

    expect(component.template.durationSelect.value).toBe("");
    callbacks.onDurationChanged();
    expect(component.template.confirmButton.disabled).toBe(true);
    expect(component.template.durationErrorText.textContent?.trim()).not.toBe(
      ""
    );
    callbacks.onConfirmClicked();
    expect(component.dialog.open).toBe(true);
    expect(score.masterBars[0].beatsCount).toBe(4);
    expect(score.masterBars[0].duration).toBe(NoteDuration.SixtyFourth);

    component.template.durationSelect.value = "8";
    callbacks.onDurationChanged();
    expect(component.template.confirmButton.disabled).toBe(false);
    expect(component.template.durationErrorText.textContent?.trim()).toBe("");
  });

  test("wheel binding is idempotent, prevents scrolling, and can be removed", () => {
    const { callbacks, component } = createTimeSigHarness();
    callbacks.bind();
    callbacks.bind();
    const event = new WheelEvent("wheel", { deltaY: -1, cancelable: true });

    component.template.beatsControl.dispatchEvent(event);

    expect(component.template.beatsValue.textContent).toBe("5");
    expect(event.defaultPrevented).toBe(true);
    callbacks.unbind();
    const unboundEvent = new WheelEvent("wheel", {
      deltaY: -1,
      cancelable: true,
    });
    component.template.beatsControl.dispatchEvent(unboundEvent);
    expect(component.template.beatsValue.textContent).toBe("5");
    expect(unboundEvent.defaultPrevented).toBe(false);
  });

  test("confirm commits time signature once after repeated bind and stops after unbind", () => {
    const { callbacks, component, controller, score, freeKeyboard } =
      createTimeSigHarness();
    callbacks.bind();
    callbacks.bind();
    callbacks.onBeatsStep(3);
    component.template.durationSelect.value = "8";
    component.template.durationSelect.dispatchEvent(new Event("change"));

    component.template.dialogContent.dispatchEvent(
      new Event("submit", { cancelable: true })
    );

    expect(score.masterBars[0].beatsCount).toBe(7);
    expect(score.masterBars[0].duration).toBe(NoteDuration.Eighth);
    expect(component.dialog.open).toBe(false);
    expect(freeKeyboard).toHaveBeenCalledTimes(1);
    controller.undo();
    expect(score.masterBars[0].beatsCount).toBe(4);
    expect(score.masterBars[0].duration).toBe(NoteDuration.Quarter);
    controller.redo();
    expect(score.masterBars[0].beatsCount).toBe(7);

    callbacks.unbind();
    component.dialog.showModal();
    callbacks.onBeatsStep(-4);
    component.template.dialogContent.dispatchEvent(
      new Event("submit", { cancelable: true })
    );
    expect(score.masterBars[0].beatsCount).toBe(7);
    expect(component.dialog.open).toBe(true);
    component.dialog.close();
  });
});
