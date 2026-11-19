/** @jest-environment jsdom */
import { TopControlsCallbacks } from "../../../src/ui/top-controls/top-controls-callbacks";
import {
  TrackEvent,
  trackEvent,
  TrackEventType,
} from "../../../src/shared/events";
import { NotationComponent } from "../../../src/notation/notation-component";
import { UIComponent } from "../../../src/ui";
import { EditorShellComponent } from "../../../src/ui/editor-shell/editor-shell-component";
import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { createScoreGraph } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { required } from "../required";

describe("TopControlsCallbacks", () => {
  test("top controls and player-state subscriptions are isolated, removable and rebindable", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const config = resolveTabUIConfig();
    const shell = new EditorShellComponent(root, config);
    shell.render();
    const { score } = createScoreGraph();
    const notation = new NotationComponent(
      shell.template.notationViewport,
      score,
      config,
      TEST_LAYOUT_DIMENSIONS
    );
    const ui = new UIComponent(
      shell.template.scorePanelHost,
      root,
      shell.template.sidePanelHost,
      shell.dialogEnforcer,
      notation,
      config,
      () => {}
    );
    const render = jest.fn(() => ui.render());
    const callbacks = new TopControlsCallbacks(
      ui.topComponent,
      notation,
      render
    );
    try {
      ui.render();
      callbacks.bind();
      callbacks.bind();
      const loop = ui.topComponent.playComponent.template.loopButton;
      const volume = ui.topComponent.scoreComponent.template.masterVolumeInput;
      loop.click();
      expect(notation.trackController.isLooped).toBe(true);
      volume.value = "30";
      volume.dispatchEvent(new Event("input"));
      expect(score.masterVolume).toBe(0.3);
      render.mockClear();
      const playerUUID = required(notation.trackController.playerUUID);
      trackEvent.emit(TrackEventType.PlayerStateChanged, {
        playerUUID: playerUUID + 1,
      });
      expect(render).not.toHaveBeenCalled();
      trackEvent.emit(TrackEventType.PlayerStateChanged, { playerUUID });
      expect(render).toHaveBeenCalledTimes(1);
      callbacks.unbind();
      callbacks.unbind();
      loop.click();
      volume.value = "90";
      volume.dispatchEvent(new Event("input"));
      trackEvent.emit(TrackEventType.PlayerStateChanged, { playerUUID });
      expect(notation.trackController.isLooped).toBe(true);
      expect(score.masterVolume).toBe(0.3);
      expect(render).toHaveBeenCalledTimes(1);
      callbacks.bind();
      loop.click();
      expect(notation.trackController.isLooped).toBe(false);
      render.mockClear();
      trackEvent.emit(TrackEventType.PlayerStateChanged, { playerUUID });
      expect(render).toHaveBeenCalledTimes(1);
    } finally {
      callbacks.unbind();
      notation.dispose();
      shell.dispose();
      root.remove();
    }
  });

  test("event emission uses a stable listener snapshot", () => {
    const event = new TrackEvent();
    const calls: string[] = [];
    const first = () => {
      calls.push("first");
      event.off(TrackEventType.PlayerStateChanged, first);
      event.on(TrackEventType.PlayerStateChanged, first);
    };
    event.on(TrackEventType.PlayerStateChanged, first);
    event.on(TrackEventType.PlayerStateChanged, () => calls.push("second"));
    event.emit(TrackEventType.PlayerStateChanged, { playerUUID: 1 });
    expect(calls).toEqual(["first", "second"]);
    event.emit(TrackEventType.PlayerStateChanged, { playerUUID: 1 });
    expect(calls).toEqual(["first", "second", "second", "first"]);
  });
});
