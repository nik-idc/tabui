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
      render,
      () => {},
      () => {}
    );
    try {
      ui.render();
      callbacks.bind();
      callbacks.bind();
      const loop = ui.topComponent.playComponent.template.loopButton;
      const name = ui.topComponent.scoreComponent.template.scoreNameInput;
      loop.click();
      expect(notation.trackController.isLooped).toBe(true);
      name.value = "Mounted score";
      name.dispatchEvent(new Event("input"));
      expect(score.name).toBe("Mounted score");
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
      name.value = "Detached score";
      name.dispatchEvent(new Event("input"));
      trackEvent.emit(TrackEventType.PlayerStateChanged, { playerUUID });
      expect(notation.trackController.isLooped).toBe(true);
      expect(score.name).toBe("Mounted score");
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
