/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import { PlaybackState } from "../../../src/player";
import { Guitar, Score } from "../../../src/notation/model";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { ScoreControlsComponent } from "../../../src/ui/top-controls/score-controls/score-controls-component";
import { TrackControlsDefaultCallbacks } from "../../../src/ui/top-controls/score-controls/track-controls/track-controls-callbacks";
import { createTestLayoutDimensions } from "../controller/helpers";
import {
  installTransportAudio,
  settleTransport,
} from "../player/transport-audio";

describe("Track controls", () => {
  let notation: NotationComponent;
  let controls: ScoreControlsComponent;
  let callbacks: TrackControlsDefaultCallbacks;
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
    score.tracks[0].name = "Rhythm";
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
    controls.changeTracksAreDisplayed();
    controls.render();
    const lead = controls.trackComponents[1];
    callbacks = new TrackControlsDefaultCallbacks(
      lead,
      notation,
      () => controls.render(),
      () => {},
      () => {},
      () => controls.showTrackSettingsDialog(lead.track),
      () => controls.showTrackRemoveDialog(lead.track)
    );
    callbacks.bind();
    callbacks.bind();
  });

  afterEach(() => {
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

  test("remove is unavailable for the only track and available with two tracks", () => {
    const rhythm = controls.trackComponents[0];
    expect(rhythm.template.removeButton.disabled).toBe(false);
    notation.removeTrack(controls.trackComponents[1].track);
    controls.render();
    expect(controls.trackComponents[0].template.removeButton.disabled).toBe(
      true
    );
    expect(notation.score.tracks).toEqual([rhythm.track]);
  });

  test("track editing controls render disabled during playback", async () => {
    notation.trackController.startPlayer();
    await settleTransport();
    expect(notation.trackController.playbackState).toBe(PlaybackState.Playing);
    controls.render();
    const template = controls.trackComponents[1].template;
    for (const button of [
      template.moveUpButton,
      template.moveDownButton,
      template.removeButton,
      template.settingsButton,
    ]) {
      expect(button.disabled).toBe(true);
    }
    expect(template.trackNameInput.disabled).toBe(true);
    expect(template.volumeInput.disabled).toBe(false);
    expect(template.panningInput.disabled).toBe(false);
  });

  test("playback blocks track editing but preserves selection and mix controls", async () => {
    const lead = controls.trackComponents[1];
    const tracks = [...notation.score.tracks];
    notation.trackController.startPlayer();
    await settleTransport();
    callbacks.onTrackMoveUpClicked();
    input(lead.template.trackNameInput, "Blocked");
    callbacks.onTrackRemoveClicked();
    callbacks.onTrackSettingsClicked();
    lead.template.selectButton.click();
    expect(notation.trackController.track).toBe(lead.track);
    expect(notation.trackController.playbackState).toBe(PlaybackState.Playing);
    expect(notation.score.tracks).toEqual(tracks);
    expect(lead.track.name).toBe("Lead");
    expect(controls.trackRemoveComponent.dialog.open).toBe(false);
    expect(controls.trackSettingsComponent.dialog.open).toBe(false);
    input(lead.template.volumeInput, "75");
    input(lead.template.panningInput, "-0.5");
    lead.template.muteButton.click();
    lead.template.soloButton.click();
    expect([
      lead.track.volume,
      lead.track.pan,
      lead.track.muted,
      lead.track.soloed,
    ]).toEqual([0.75, -0.5, true, true]);
    lead.template.muteButton.click();
    lead.template.soloButton.click();
    expect([lead.track.muted, lead.track.soloed]).toEqual([false, false]);
    expect(lead.template.muteButton.getAttribute("aria-pressed")).toBe("false");
    expect(lead.template.soloButton.getAttribute("aria-pressed")).toBe("false");
  });

  test("view-only mode rejects persisted mix changes", () => {
    notation.setEditingEnabled(false);
    const lead = controls.trackComponents[1];
    input(lead.template.volumeInput, "75");
    input(lead.template.panningInput, "-0.5");
    lead.template.muteButton.click();
    lead.template.soloButton.click();
    controls.render();
    expect([
      lead.track.volume,
      lead.track.pan,
      lead.track.muted,
      lead.track.soloed,
    ]).toEqual([0.5, 0, false, false]);
    expect(lead.template.volumeInput.value).toBe("50");
    expect(lead.template.muteButton.getAttribute("aria-pressed")).toBe("false");
    expect(lead.template.soloButton.getAttribute("aria-pressed")).toBe("false");
  });

  test("bound controls select, reorder, rename and open track dialogs; unbind stops edits", () => {
    const lead = controls.trackComponents[1];
    const rhythm = notation.score.tracks[0];
    lead.template.selectButton.click();
    expect(notation.trackController.track).toBe(lead.track);
    lead.template.moveUpButton.click();
    expect(notation.score.tracks).toEqual([lead.track, rhythm]);
    lead.template.moveDownButton.click();
    expect(notation.score.tracks).toEqual([rhythm, lead.track]);
    input(lead.template.trackNameInput, "Solo");
    expect(lead.track.name).toBe("Solo");
    lead.template.settingsButton.click();
    expect(controls.trackSettingsComponent.dialog.open).toBe(true);
    controls.trackSettingsComponent.dialog.close();
    lead.template.removeButton.click();
    expect(controls.trackRemoveComponent.dialog.open).toBe(true);
    expect(
      controls.trackRemoveComponent.template.dialogContainer.textContent
    ).toContain('delete track "Solo"');
    callbacks.unbind();
    lead.template.moveUpButton.click();
    input(lead.template.trackNameInput, "Detached");
    expect(notation.score.tracks).toEqual([rhythm, lead.track]);
    expect(lead.track.name).toBe("Solo");
  });
});
