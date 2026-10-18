/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import { PlaybackState } from "../../../src/player";
import { Guitar, Score } from "../../../src/notation/model";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { ScoreControlsComponent } from "../../../src/ui/top-controls/score-controls/score-controls-component";
import { ScoreControlsDefaultCallbacks } from "../../../src/ui/top-controls/score-controls/score-controls-callbacks";
import { createTestLayoutDimensions } from "../controller/helpers";
import {
  installTransportAudio,
  settleTransport,
} from "../player/transport-audio";

describe("Score controls", () => {
  let notation: NotationComponent;
  let controls: ScoreControlsComponent;
  let callbacks: ScoreControlsDefaultCallbacks;
  let root: HTMLDivElement;
  let audio: ReturnType<typeof installTransportAudio>;

  beforeEach(() => {
    jest.useFakeTimers();
    audio = installTransportAudio();
    root = document.createElement("div");
    const viewport = document.createElement("div");
    const host = document.createElement("div");
    const dialogs = document.createElement("div");
    root.append(viewport, host, dialogs);
    document.body.append(root);
    const score = new Score();
    score.name = "Original";
    score.addTrack(new Guitar(), "Lead");
    notation = new NotationComponent(
      viewport,
      score,
      resolveTabUIConfig(),
      createTestLayoutDimensions()
    );
    controls = new ScoreControlsComponent(
      host,
      new DialogEnforcer(dialogs, () => {}),
      notation,
      () => {}
    );
    controls.render();
    callbacks = new ScoreControlsDefaultCallbacks(
      controls,
      notation,
      () => controls.render(),
      () => {},
      () => {},
      (track) => controls.showTrackSettingsDialog(track)
    );
    callbacks.bind();
    callbacks.bind();
  });

  afterEach(() => {
    controls.newTrackComponent.dialog.close();
    controls.trackSettingsComponent.dialog.close();
    controls.trackRemoveComponent.dialog.close();
    callbacks.unbind();
    notation.dispose();
    root.remove();
    audio.restore();
    jest.useRealTimers();
  });

  function input(element: HTMLInputElement, value: string) {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }

  test("playback disables score editing and rejects changes while master mix remains available", async () => {
    notation.trackController.startPlayer();
    await settleTransport();
    expect(notation.trackController.playbackState).toBe(PlaybackState.Playing);
    controls.render();
    expect(controls.template.newTrackButton.disabled).toBe(true);
    expect(controls.template.scoreNameInput.disabled).toBe(true);
    callbacks.onNewTrackButtonClicked();
    input(controls.template.scoreNameInput, "Blocked");
    expect(controls.newTrackComponent.dialog.open).toBe(false);
    expect(notation.score.name).toBe("Original");
    expect(notation.score.tracks).toHaveLength(2);
    expect(controls.template.masterVolumeInput.disabled).toBe(false);
    expect(controls.template.masterPanningInput.disabled).toBe(false);
    input(controls.template.masterVolumeInput, "60");
    input(controls.template.masterPanningInput, "0.5");
    expect(notation.score.masterVolume).toBe(0.6);
    expect(notation.score.masterPan).toBe(0.5);
  });

  test("score controls toggle tracks, rename and open dialogs; unbind stops events", () => {
    controls.template.showTracksButton.click();
    expect(controls.tracksAreDisplayed).toBe(true);
    expect(controls.template.tracksContainer.children).toHaveLength(2);
    const lead = controls.trackComponents[1];
    lead.template.selectButton.click();
    expect(notation.trackController.track).toBe(lead.track);
    input(controls.template.scoreNameInput, "Renamed");
    expect(notation.score.name).toBe("Renamed");
    controls.template.newTrackButton.click();
    expect(controls.newTrackComponent.dialog.open).toBe(true);
    controls.newTrackComponent.dialog.close();
    lead.template.settingsButton.click();
    expect(controls.trackSettingsComponent.dialog.open).toBe(true);
    controls.trackSettingsComponent.dialog.close();
    lead.template.removeButton.click();
    expect(controls.trackRemoveComponent.dialog.open).toBe(true);
    controls.trackRemoveComponent.template.confirmButton.click();
    expect(notation.score.tracks).toHaveLength(1);
    expect(notation.score.tracks).not.toContain(lead.track);
    callbacks.unbind();
    controls.template.showTracksButton.click();
    input(controls.template.scoreNameInput, "Detached");
    input(controls.template.masterVolumeInput, "10");
    expect(controls.tracksAreDisplayed).toBe(true);
    expect(notation.score.name).toBe("Renamed");
    expect(notation.score.masterVolume).toBe(1);
  });

  test("master controls preserve score and per-track mix across rerenders and switches", () => {
    const score = notation.score;
    score.tracks[0].volume = 0.3;
    score.tracks[0].pan = 0.25;
    score.tracks[1].muted = true;
    score.tracks[1].soloed = true;
    input(controls.template.masterVolumeInput, "70");
    input(controls.template.masterPanningInput, "-0.25");
    notation.loadTrack(score.tracks[1]);
    controls.render();
    expect(controls.template.masterVolumeInput.value).toBe("70");
    expect(controls.template.masterPanningInput.value).toBe("-0.25");
    expect([score.masterVolume, score.masterPan]).toEqual([0.7, -0.25]);
    expect([
      score.tracks[0].volume,
      score.tracks[0].pan,
      score.tracks[1].muted,
      score.tracks[1].soloed,
    ]).toEqual([0.3, 0.25, true, true]);
  });
});
