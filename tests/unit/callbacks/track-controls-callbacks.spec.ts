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
      root,
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

  test.each([
    { state: "idle", edit: true, mix: true, select: true },
    { state: "playing", edit: false, mix: true, select: false },
    { state: "view-only", edit: false, mix: false, select: true },
  ])(
    "controls follow the controller rules when $state",
    async ({ state, edit, mix, select }) => {
      if (state === "playing") {
        notation.trackController.startPlayer();
        await settleTransport();
      } else if (state === "view-only") {
        notation.setEditingEnabled(false);
      }
      controls.render();
      const score = controls.template;
      const lead = controls.trackComponents[1].template;
      const enabled = (elements: { disabled: boolean }[]) =>
        elements.map((element) => !element.disabled);

      expect(
        enabled([
          lead.moveUpButton,
          lead.removeButton,
          lead.settingsButton,
          lead.trackNameInput,
          score.newTrackButton,
          score.cutButton,
          score.pasteButton,
        ])
      ).toEqual(Array(7).fill(edit));
      expect(
        enabled([
          lead.volumeInput,
          lead.panningInput,
          lead.muteButton,
          lead.soloButton,
          score.masterVolumeInput,
          score.masterPanningInput,
        ])
      ).toEqual(Array(6).fill(mix));
      expect(
        enabled([score.rangeButton, score.selectAllButton, score.copyButton])
      ).toEqual(Array(3).fill(select));
      // The last track can't move down in any state.
      expect(lead.moveDownButton.disabled).toBe(true);
    }
  );

  test("playback blocks track editing but preserves selection and mix controls", async () => {
    const lead = controls.trackComponents[1];
    const tracks = [...notation.score.tracks];
    notation.trackController.startPlayer();
    await settleTransport();
    callbacks.onTrackMoveUpClicked();
    input(lead.template.trackNameInput, "Blocked");
    callbacks.onTrackRemoveClicked();
    callbacks.onTrackSettingsClicked();
    lead.template.container.click();
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
    lead.template.container.click();
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

  test("selects from the inactive name without focusing its editor and supports row keys", () => {
    const lead = controls.trackComponents[1];
    const rhythm = controls.trackComponents[0];

    lead.template.trackNameLabel.click();
    expect(notation.trackController.track).toBe(lead.track);
    expect(document.activeElement).not.toBe(lead.template.trackNameInput);
    // A mouse click leaves focus to the editor, so Space stays a shortcut.
    expect(document.activeElement).not.toBe(lead.template.container);
    expect(lead.template.trackNameInput.hidden).toBe(false);

    notation.loadTrack(rhythm.track);
    controls.render();
    lead.template.container.focus();
    lead.template.container.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
    expect(notation.trackController.track).toBe(lead.track);
    expect(document.activeElement).toBe(lead.template.container);

    notation.loadTrack(rhythm.track);
    controls.render();
    for (const key of ["Enter", " "]) {
      lead.template.muteButton.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true })
      );
      expect(notation.trackController.track).toBe(rhythm.track);
    }
    lead.template.muteButton.click();
    expect(notation.trackController.track).toBe(rhythm.track);
    expect(lead.track.muted).toBe(true);

    lead.template.container.focus();
    lead.template.container.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true })
    );
    expect(notation.trackController.track).toBe(lead.track);
  });
});
