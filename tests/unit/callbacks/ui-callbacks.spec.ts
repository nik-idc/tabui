/** @jest-environment jsdom */
import { TabUIEditor } from "../../../src/tabui-editor";
import { PlaybackErrorCode } from "../../../src/player";
import { GuitarNote, NoteDuration } from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import {
  installTransportAudio,
  settleTransport,
} from "../player/transport-audio";
import { required } from "../required";

describe("mounted editor lifecycle and callbacks", () => {
  const editors: TabUIEditor[] = [];
  let audio: ReturnType<typeof installTransportAudio>;
  beforeEach(() => {
    jest.useFakeTimers();
    audio = installTransportAudio();
    // jsdom exposes SVG nodes but omits the browser's rectangle constructor.
    Object.defineProperty(globalThis, "SVGRectElement", {
      configurable: true,
      value: document.createElementNS("http://www.w3.org/2000/svg", "rect")
        .constructor,
    });
  });
  afterEach(() => {
    editors.splice(0).forEach((e) => e.dispose());
    audio.restore();
    jest.useRealTimers();
    Reflect.deleteProperty(globalThis, "SVGRectElement");
    document.body.replaceChildren();
  });
  function mount(root = document.createElement("div")) {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    document.body.appendChild(root);
    const editor = new TabUIEditor(root, score, { layout: { width: 900 } });
    editors.push(editor);
    editor.init();
    return { editor, root, beats };
  }
  function button(root: HTMLElement, label: string) {
    return required(
      root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
    );
  }
  function key(root: HTMLElement, value: string) {
    const viewport = required(
      root.querySelector<HTMLElement>(".tu-notation-viewport")
    );
    viewport.focus();
    viewport.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: value,
        bubbles: true,
        cancelable: true,
      })
    );
  }

  test("disposal stops retained controls and keyboard input and clears owned DOM", () => {
    const { editor, root, beats } = mount();
    const dot = button(root, "Dot");
    const loop = button(root, "Loop");
    const viewport = required(
      root.querySelector<HTMLElement>(".tu-notation-viewport")
    );
    dot.click();
    loop.click();
    key(root, "5");
    expect(beats[0].dots).toBe(1);
    expect(editor.getState().playback.isLooped).toBe(true);
    expect((beats[0].notes?.[0] as GuitarNote).fret).toBe(5);
    editor.dispose();
    editor.dispose();
    dot.click();
    loop.click();
    viewport.dispatchEvent(
      new KeyboardEvent("keydown", { key: "7", bubbles: true })
    );
    expect(beats[0].dots).toBe(1);
    expect((beats[0].notes?.[0] as GuitarNote).fret).toBe(5);
    expect(root.childElementCount).toBe(0);
    expect(root.classList.contains("tu-editor")).toBe(false);
    expect(root.className).not.toMatch(
      /tu-(?:score-panel|side-controls|responsive|view-only)/
    );
  });
  test("theme values stay on the owning root and are removed on disposal", () => {
    const documentStyle = document.documentElement.style.cssText;
    const { editor, root } = mount();
    const { root: other } = mount();
    const variables = Array.from(root.style).filter((v) => v.startsWith("--"));
    expect(variables.length).toBeGreaterThan(0);
    const otherStyle = other.style.cssText;
    expect(document.documentElement.style.cssText).toBe(documentStyle);
    editor.dispose();
    expect(variables.every((v) => root.style.getPropertyValue(v) === "")).toBe(
      true
    );
    expect(other.style.cssText).toBe(otherStyle);
    expect(document.documentElement.style.cssText).toBe(documentStyle);
  });
  test("a disposed root can mount a fresh working editor without reviving old controls", () => {
    const first = mount();
    const oldDot = button(first.root, "Dot");
    first.editor.dispose();
    const second = mount(first.root);
    expect(second.root.querySelectorAll(".tu-root-svg")).toHaveLength(1);
    oldDot.click();
    expect(first.beats[0].dots).toBe(0);
    expect(second.beats[0].dots).toBe(0);
    button(second.root, "Dot").click();
    expect(second.beats[0].dots).toBe(1);
    expect(first.beats[0].dots).toBe(0);
  });
  test("rolls back partial initialization failure and permits a working remount", async () => {
    const { score } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const root = document.createElement("div");
    document.body.appendChild(root);
    const failed = new TabUIEditor(root, score, {
      layout: { width: 900 },
      playback: { preloadAudio: true },
    });
    editors.push(failed);
    const appendChild = Node.prototype.appendChild;
    // UI mounting follows notation ownership and synchronous audio preloading.
    const failure = jest
      .spyOn(Node.prototype, "appendChild")
      .mockImplementation(function <T extends Node>(this: Node, child: T): T {
        if (
          this instanceof HTMLElement &&
          this.classList.contains("tu-top-controls-host")
        ) {
          expect(child).toBeInstanceOf(HTMLElement);
          expect(
            (child as unknown as HTMLElement).classList.contains(
              "tu-top-controls"
            )
          ).toBe(true);
          expect(audio.construct).toHaveBeenCalledTimes(1);
          expect(audio.context.close).not.toHaveBeenCalled();
          throw new Error("Controls mounting failed");
        }
        return appendChild.call(this, child) as T;
      });
    try {
      expect(() => failed.init()).toThrow("Controls mounting failed");
    } finally {
      failure.mockRestore();
    }
    expect(audio.context.close).toHaveBeenCalledTimes(1);
    expect(root.childElementCount).toBe(0);
    expect(() => failed.getState()).toThrow("TabUIEditor already disposed");
    failed.dispose();
    await settleTransport();
    expect(audio.context.close).toHaveBeenCalledTimes(1);
    const restored = mount(root);
    button(root, "Dot").click();
    expect(restored.beats[0].dots).toBe(1);
    expect(root.querySelectorAll(".tu-root-svg")).toHaveLength(1);
  });
  test("state snapshots describe real selection, edits, loop and playback", async () => {
    const { editor, root, beats } = mount();
    button(root, "Voice 2").click();
    expect(editor.getState().selection.activeVoiceNumber).toBe(2);
    button(root, "Voice 1").click();
    key(root, "ArrowDown");
    key(root, "ArrowDown");
    key(root, "ArrowDown");
    key(root, "5");
    button(root, "Loop").click();
    button(root, "Play").click();
    await settleTransport();
    const state = editor.getState();
    expect(state.activeTrack).toBe(editor.score.tracks[0]);
    expect(state.playback).toEqual({ state: "playing", isLooped: true });
    expect(state.selection.activeVoiceNumber).toBe(1);
    expect(state.selection.beats).toEqual([]);
    expect(state.selection.cursor).toMatchObject({
      beat: beats[0],
      note: beats[0].notes?.[0],
      noteIndex: 0,
    });
    expect(state.layout.width).toBe(900);
    expect(state.layout.height).toBeGreaterThan(0);
    expect(state).not.toHaveProperty("controller");
    expect(state).not.toHaveProperty("renderer");
    button(root, "Pause").click();
    const viewport = required(
      root.querySelector<HTMLElement>(".tu-notation-viewport")
    );
    viewport.focus();
    viewport.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowRight",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      })
    );
    expect(editor.getState().selection.beats).toEqual([beats[0]]);
  });

  test("a pointer toolbar action returns focus before real notation key events", () => {
    const { editor, root } = mount();
    const viewport = required(
      root.querySelector<HTMLElement>(".tu-notation-viewport")
    );
    const dot = button(root, "Dot");
    dot.focus();
    dot.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 })
    );

    expect(document.activeElement).toBe(viewport);
    key(root, "ArrowDown");
    key(root, "5");
    expect(
      (editor.getState().selection.cursor?.note as GuitarNote | undefined)?.fret
    ).toBe(5);
  });

  test("clicking empty editor space restores notation focus without changing selection", () => {
    const { editor, root } = mount();
    const viewport = required(
      root.querySelector<HTMLElement>(".tu-notation-viewport")
    );
    const panel = required(
      root.querySelector<HTMLElement>(".tu-top-controls-host")
    );
    const name = required(
      root.querySelector<HTMLInputElement>(".tu-score-name-input")
    );
    const cursor = editor.getState().selection.cursor;
    name.focus();
    panel.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 })
    );
    expect(document.activeElement).toBe(viewport);
    expect(editor.getState().selection.cursor).toEqual(cursor);
    viewport.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })
    );
    expect(editor.getState().selection.cursor?.noteIndex).toBe(1);
  });

  test("native inputs, editable controls, and separate editor roots keep keyboard ownership", () => {
    const first = mount();
    const second = mount();
    const firstNote = required(first.editor.getState().selection.cursor?.note);
    expect(firstNote).toBeInstanceOf(GuitarNote);
    if (!(firstNote instanceof GuitarNote)) {
      throw Error("Expected a guitar note");
    }
    expect(firstNote.fret).toBeNull();
    const volume = required(
      first.root.querySelector<HTMLInputElement>(".tu-master-volume-input")
    );
    volume.focus();
    const nativeKey = new KeyboardEvent("keydown", {
      key: "5",
      bubbles: true,
      cancelable: true,
    });
    volume.dispatchEvent(nativeKey);
    expect(nativeKey.defaultPrevented).toBe(false);
    expect(first.editor.getState().selection.cursor?.note).toBe(firstNote);
    expect(firstNote.fret).toBeNull();
    expect(document.activeElement).toBe(volume);

    const scoreName = required(
      first.root.querySelector<HTMLInputElement>(".tu-score-name-input")
    );
    scoreName.focus();
    const editableSpace = new KeyboardEvent("keydown", {
      key: " ",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    scoreName.dispatchEvent(editableSpace);
    expect(editableSpace.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(scoreName);

    const editableToolbar = document.createElement("div");
    editableToolbar.setAttribute("contenteditable", "");
    const editableButton = document.createElement("button");
    editableToolbar.append(editableButton);
    first.root.append(editableToolbar);
    editableButton.focus();
    const editableKey = new KeyboardEvent("keydown", {
      key: " ",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    editableButton.dispatchEvent(editableKey);
    expect(editableKey.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(editableButton);

    const secondDot = button(second.root, "Dot");
    secondDot.focus();
    secondDot.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 })
    );
    expect(document.activeElement).toBe(
      required(second.root.querySelector<HTMLElement>(".tu-notation-viewport"))
    );
    key(second.root, "5");
    expect(first.editor.getState().selection.cursor?.note).toBe(firstNote);
    expect(firstNote.fret).toBeNull();
    expect(
      (
        second.editor.getState().selection.cursor?.note as
          | GuitarNote
          | undefined
      )?.fret
    ).toBe(5);
  });
  test("subscriptions are disposable and isolated between mounted editors", () => {
    const first = mount();
    const second = mount();
    const firstListener = jest.fn();
    const secondListener = jest.fn();
    const unsubscribe = first.editor.subscribe(firstListener);
    second.editor.subscribe(secondListener);
    button(first.root, "Loop").click();
    expect(firstListener).toHaveBeenCalledWith({
      type: "change",
      state: first.editor.getState(),
    });
    expect(secondListener).not.toHaveBeenCalled();
    const count = firstListener.mock.calls.length;
    unsubscribe();
    unsubscribe();
    button(first.root, "Loop").click();
    button(second.root, "Loop").click();
    expect(firstListener).toHaveBeenCalledTimes(count);
    expect(secondListener).toHaveBeenCalledWith({
      type: "change",
      state: second.editor.getState(),
    });
  });
  test("state snapshot identity changes only after a real change notification", () => {
    const { editor, root } = mount();
    const initial = editor.getState();
    expect(editor.getState()).toBe(initial);
    button(root, "Loop").click();
    const changed = editor.getState();
    expect(changed).not.toBe(initial);
    expect(changed.playback.isLooped).toBe(true);
    expect(editor.getState()).toBe(changed);
    expect(initial.playback.isLooped).toBe(false);
  });
  test("real playback startup failures notify only the owning editor", async () => {
    const first = mount();
    const second = mount();
    const listener = jest.fn();
    const otherListener = jest.fn();
    first.editor.subscribe(listener);
    second.editor.subscribe(otherListener);
    const cause = new Error("blocked");
    audio.context.resume.mockRejectedValueOnce(cause);
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      button(first.root, "Play").click();
      await settleTransport();
      expect(errorLog.mock.calls).toEqual([["Failed to prepare audio", cause]]);
      expect(listener).toHaveBeenCalledWith({
        type: "error",
        error: {
          source: "playback",
          code: PlaybackErrorCode.ContextInit,
          message: "Failed to prepare audio",
          cause,
        },
      });
      expect(otherListener).not.toHaveBeenCalled();
      expect(first.editor.getState().playback.state).toBe("idle");
    } finally {
      errorLog.mockRestore();
    }
  });
  test("disposed controls do not notify hosts and state APIs remain terminal", () => {
    const { editor, root } = mount();
    const listener = jest.fn();
    editor.subscribe(listener);
    const loop = button(root, "Loop");
    loop.click();
    expect(listener).toHaveBeenCalled();
    const count = listener.mock.calls.length;
    editor.dispose();
    loop.click();
    expect(listener).toHaveBeenCalledTimes(count);
    expect(() => editor.getState()).toThrow("TabUIEditor already disposed");
    expect(() => editor.subscribe(jest.fn())).toThrow(
      "TabUIEditor already disposed"
    );
    expect(() => editor.refreshLayout()).toThrow(
      "TabUIEditor already disposed"
    );
  });
  test("playback makes side editing controls inert and restores them on stop", async () => {
    const { root } = mount();
    const side = required(
      root.querySelector<HTMLElement>(".tu-side-controls-host [aria-disabled]")
    );
    expect(side.getAttribute("aria-disabled")).toBe("false");
    button(root, "Play").click();
    await settleTransport();
    expect(side.inert).toBe(true);
    expect(side.classList.contains("tu-editing-disabled")).toBe(true);
    expect(side.getAttribute("aria-disabled")).toBe("true");
    button(root, "Pause").click();
    expect(side.inert).toBe(false);
    expect(side.getAttribute("aria-disabled")).toBe("false");
  });
});
