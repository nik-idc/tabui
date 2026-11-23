/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import { PlaybackState } from "../../../src/player";
import { Score } from "../../../src/notation/model";
import {
  ScoreHeaderCallbacks,
  ScoreHeaderComponent,
} from "../../../src/ui/score-header";
import { createTestLayoutDimensions } from "../controller/helpers";
import {
  installTransportAudio,
  settleTransport,
} from "../player/transport-audio";

describe("Score header", () => {
  let notation: NotationComponent;
  let header: ScoreHeaderComponent;
  let callbacks: ScoreHeaderCallbacks;
  let viewport: HTMLDivElement;
  let audio: ReturnType<typeof installTransportAudio>;

  beforeEach(() => {
    jest.useFakeTimers();
    audio = installTransportAudio();
    viewport = document.createElement("div");
    document.body.append(viewport);
    const score = new Score([], "Original", "Ada");
    notation = new NotationComponent(
      viewport,
      score,
      resolveTabUIConfig(),
      createTestLayoutDimensions()
    );
    header = new ScoreHeaderComponent(viewport, notation);
    header.render();
    callbacks = new ScoreHeaderCallbacks(header, notation);
    callbacks.bind();
  });

  afterEach(() => {
    callbacks.unbind();
    notation.dispose();
    viewport.remove();
    audio.restore();
    jest.useRealTimers();
  });

  function input(
    element: HTMLInputElement | HTMLTextAreaElement,
    value: string
  ) {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }

  test("sits at the top of the notation and shows the score details", () => {
    const t = header.template;
    expect(viewport.firstElementChild).toBe(t.container);
    expect(t.titleInput.value).toBe("Original");
    expect(t.artistInput.value).toBe("Ada");
    // Unknown details are empty and show a placeholder.
    expect(t.albumInput.value).toBe("");
    expect(t.albumInput.placeholder).toBe("Unknown album");
    expect(t.releaseDateInput.value).toBe("");
  });

  test("saves each field as the user types", () => {
    const t = header.template;
    const score = notation.score;
    input(t.titleInput, "Song");
    input(t.artistInput, "Band");
    input(t.albumInput, "Record");
    input(t.releaseDateInput, "2024");
    expect(score.name).toBe("Song");
    expect(score.artist).toBe("Band");
    expect(score.album).toBe("Record");
    expect(score.releaseDate).toBe("2024");

    // Clearing a detail makes it unknown again.
    input(t.albumInput, "");
    input(t.releaseDateInput, "");
    expect(score.album).toBeNull();
    expect(score.releaseDate).toBeNull();
  });

  test("keeps fields on one line", () => {
    const t = header.template;
    input(t.titleInput, "Two\nlines");
    expect(t.titleInput.value).toBe("Two lines");
    expect(notation.score.name).toBe("Two lines");

    const enter = new KeyboardEvent("keydown", {
      key: "Enter",
      cancelable: true,
    });
    t.artistInput.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
  });

  test("saves a release date only once it is valid", () => {
    const date = header.template.releaseDateInput;
    input(date, "2024");
    date.focus();
    input(date, "2024-1");
    expect(notation.score.releaseDate).toBe("2024");
    expect(date.getAttribute("aria-invalid")).toBe("true");

    // A render while the user types keeps the partly typed date.
    header.render();
    expect(date.value).toBe("2024-1");

    input(date, "2024-11");
    expect(notation.score.releaseDate).toBe("2024-11");
    expect(date.hasAttribute("aria-invalid")).toBe(false);

    // Leaving an invalid date shows the saved one again.
    input(date, "nope");
    date.blur();
    expect(date.value).toBe("2024-11");
    expect(date.hasAttribute("aria-invalid")).toBe(false);
  });

  test("disables fields in view-only mode and during playback", async () => {
    const t = header.template;
    const fields = [
      t.titleInput,
      t.artistInput,
      t.albumInput,
      t.releaseDateInput,
    ];
    notation.setEditingEnabled(false);
    header.render();
    expect(fields.every((field) => field.disabled)).toBe(true);
    input(t.titleInput, "Blocked");
    expect(notation.score.name).toBe("Original");

    notation.setEditingEnabled(true);
    notation.trackController.startPlayer();
    await settleTransport();
    expect(notation.trackController.playbackState).toBe(PlaybackState.Playing);
    header.render();
    expect(fields.every((field) => field.disabled)).toBe(true);
    input(t.artistInput, "Blocked");
    expect(notation.score.artist).toBe("Ada");
  });

  test("unbind stops saving", () => {
    callbacks.unbind();
    input(header.template.titleInput, "Detached");
    expect(notation.score.name).toBe("Original");
  });
});
