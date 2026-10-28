/** @jest-environment jsdom */
import { TabUIEditor } from "../../../src/tabui-editor";
import { TabUICallbacks } from "../../../src/tabui-callbacks";
import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import { UIComponent } from "../../../src/ui";
import { EditorShellComponent } from "../../../src/ui/editor-shell/editor-shell-component";
import { DEFAULT_MASTER_BAR, NoteDuration } from "../../../src/notation/model";
import { captureSelectionCursor } from "../../../src/notation/accessibility/notation-selection-announcement";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { createBeat, createScoreGraph } from "../model/helpers";
import { required } from "../required";

describe("selection announcement behavior", () => {
  const cleanups: (() => void)[] = [];

  beforeEach(() => {
    jest.useFakeTimers();
    // jsdom has real SVG nodes but does not expose the rectangle constructor.
    const descriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "SVGRectElement"
    );
    Object.defineProperty(globalThis, "SVGRectElement", {
      configurable: true,
      value: document.createElementNS("http://www.w3.org/2000/svg", "rect")
        .constructor,
    });
    cleanups.push(() => {
      if (descriptor)
        Object.defineProperty(globalThis, "SVGRectElement", descriptor);
      else Reflect.deleteProperty(globalThis, "SVGRectElement");
    });
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
    jest.useRealTimers();
    document.body.replaceChildren();
  });

  function createShell() {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const config = resolveTabUIConfig();
    const shell = new EditorShellComponent(root, config);
    shell.render();
    cleanups.push(() => shell.dispose());

    return { root, config, shell, region: shell.template.announcementHost };
  }

  function createCallbacks() {
    const fixture = createShell();
    const { score, track, staff } = createScoreGraph();
    track.name = "Guitar";
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    for (const bar of staff.bars.slice(1)) {
      const voice = required(bar.getVoiceBar(1));
      voice.beats.splice(
        0,
        voice.beats.length,
        createBeat(voice, NoteDuration.Quarter)
      );
    }

    const notation = new NotationComponent(
      fixture.shell.template.notationViewport,
      score,
      fixture.config,
      TEST_LAYOUT_DIMENSIONS
    );
    cleanups.push(() => notation.dispose());
    const ui = new UIComponent(
      fixture.shell.template.scorePanelHost,
      fixture.shell.template.sidePanelHost,
      fixture.shell.dialogEnforcer,
      notation,
      fixture.config,
      () => {}
    );
    ui.render();
    const announce = jest.fn(fixture.shell.announce.bind(fixture.shell));
    const callbacks = new TabUICallbacks(
      ui,
      notation,
      fixture.root,
      () => callbacks.announceSelection(true),
      announce
    );
    callbacks.bind();
    cleanups.push(() => callbacks.unbind());

    return {
      ...fixture,
      callbacks,
      announce,
      selection: notation.trackController,
      viewport: notation.rootDiv,
      beats: staff.getBeatsSeq(1),
    };
  }

  const initial =
    "Track Guitar, Staff 1, voice 1, Bar 1, 4/4, 120 BPM, Beat 1, quarter, String 1, empty.";

  test("announces once on initial focus and after one rebind", () => {
    const { callbacks, viewport, announce } = createCallbacks();
    viewport.focus();
    expect(announce.mock.calls).toEqual([[initial, true]]);

    viewport.blur();
    callbacks.unbind();
    viewport.focus();
    expect(announce.mock.calls).toEqual([[initial, true]]);

    viewport.blur();
    callbacks.bind();
    viewport.focus();
    expect(announce.mock.calls).toEqual([
      [initial, true],
      [initial, true],
    ]);
  });

  test("announces a changed fret in the same slot once", () => {
    const { callbacks, selection, announce, region } = createCallbacks();
    selection.setSelectedNoteFret(5);
    callbacks.announceSelection(true);
    callbacks.announceSelection(true);

    const description =
      "Track Guitar, Staff 1, voice 1, Bar 1, 4/4, 120 BPM, Beat 1, quarter, String 1, fret 5.";
    expect(announce.mock.calls).toEqual([[description, false]]);
    expect(region.textContent).toBe(description);
  });

  test("announces a changed rhythm in the same slot once", () => {
    const { callbacks, beats, announce, region } = createCallbacks();
    beats[0].dots = 1;
    callbacks.announceSelection(true);
    callbacks.announceSelection(true);

    const description =
      "Track Guitar, Staff 1, voice 1, Bar 1, 4/4, 120 BPM, Beat 1, quarter, 1 dot, String 1, empty.";
    expect(announce.mock.calls).toEqual([[description, false]]);
    expect(region.textContent).toBe(description);
  });

  test("keeps unchanged automatic announcements silent", () => {
    const { callbacks, selection, announce } = createCallbacks();
    callbacks.announceSelection(true);
    jest.runOnlyPendingTimers();
    expect(announce).not.toHaveBeenCalled();

    selection.setSelectedNoteFret(7);
    callbacks.announceSelection(true);
    expect(announce.mock.calls).toEqual([
      [
        "Track Guitar, Staff 1, voice 1, Bar 1, 4/4, 120 BPM, Beat 1, quarter, String 1, fret 7.",
        false,
      ],
    ]);
  });

  test("seeds the automatic cache after explicit focus and arrow output", () => {
    const { callbacks, selection, viewport, announce } = createCallbacks();
    viewport.focus();
    callbacks.announceSelection(true);
    const previous = captureSelectionCursor(selection.selectionCursor);
    required(selection.selectionCursor).moveDown();
    callbacks.announceSelection(false, previous);
    callbacks.announceSelection(true);
    expect(announce.mock.calls).toEqual([
      [initial, true],
      ["String 2, empty.", true],
    ]);
  });

  test("announces a changed range once, stays silent unchanged, and repeats on focus", () => {
    const { callbacks, selection, beats, announce, viewport } =
      createCallbacks();
    selection.selectBeat(
      required(selection.trackElement.getBeatElement(beats[0]))
    );
    callbacks.announceSelection(true);
    announce.mockClear();

    selection.selectBeat(
      required(selection.trackElement.getBeatElement(beats[1]))
    );
    callbacks.announceSelection(true);
    callbacks.announceSelection(true);
    const description =
      "Track Guitar, Staff 1, voice 1, 2 beats selected, bar 1 beat 1 to bar 2 beat 1, anchor bar 1 beat 1, active end bar 2 beat 1.";
    expect(announce.mock.calls).toEqual([[description, false]]);
    viewport.focus();
    viewport.blur();
    viewport.focus();
    callbacks.announceSelection(true);
    expect(announce.mock.calls).toEqual([
      [description, false],
      [description, true],
      [description, true],
    ]);
  });

  test("mounts the announcer only on parent changes and cancels stale text", () => {
    const { shell, root, region } = createShell();
    const dialog = document.createElement("div");
    root.appendChild(dialog);
    shell.announce("Repeat");
    const observer = new MutationObserver(() => {});
    observer.observe(root, { childList: true });
    try {
      shell.mountAnnouncer(root);
      expect(observer.takeRecords()).toHaveLength(0);
      expect(region.textContent).toBe("Repeat");

      shell.announce("Repeat", true);
      shell.mountAnnouncer(root);
      jest.runOnlyPendingTimers();
      expect(region.textContent).toBe("Repeat");

      shell.announce("Repeat", true);
      shell.mountAnnouncer(dialog);
      expect(region.parentElement).toBe(dialog);
      jest.runOnlyPendingTimers();
      expect(region.textContent).toBe("");

      shell.announce("Stale");
      shell.mountAnnouncer(root);
      expect(region.parentElement).toBe(root);
      expect(region.textContent).toBe("");

      shell.announce("Pending disposal");
      shell.announce("Pending disposal", true);
      shell.dispose();
      jest.runOnlyPendingTimers();
      shell.announce("Disposed");
      shell.mountAnnouncer(dialog);
      expect(region.textContent).toBe("");
      expect(region.parentElement).toBeNull();
    } finally {
      observer.disconnect();
    }
  });

  function startDrag(fixture: ReturnType<typeof createCallbacks>) {
    const notes = fixture.beats.map((b) =>
      required(fixture.viewport.querySelector(`[data-beat-uuid="${b.uuid}"]`))
    );
    const [first, second, third] = notes;
    first.dispatchEvent(mouseEvent("mousedown", 0));
    second.dispatchEvent(mouseEvent("mousemove", 100));
    expect(fixture.selection.selectionAsBeats).toHaveLength(2);
    expect(fixture.selection.selectionAsBeats[0]).toBe(fixture.beats[0]);
    expect(fixture.selection.selectionAsBeats[1]).toBe(fixture.beats[1]);
    return { second, third };
  }

  /** Supplies page coordinates missing from jsdom's mouse events. */
  function mouseEvent(type: string, x: number): MouseEvent {
    const event = new MouseEvent(type, {
      bubbles: true,
      button: 0,
      buttons: type === "mouseup" ? 0 : 1,
      clientX: x,
    });
    Object.defineProperties(event, {
      pageX: { value: x },
      pageY: { value: 0 },
    });
    return event;
  }

  test("renders held drag frames silently and announces the latest range on release", () => {
    const fixture = createCallbacks();
    const { second, third } = startDrag(fixture);

    for (const target of [third, second, third]) {
      target.dispatchEvent(mouseEvent("mousemove", 100));
      jest.advanceTimersByTime(20);
      fixture.callbacks.announceSelection(false);
      fixture.callbacks.announceSelection(true);
      expect(fixture.announce).not.toHaveBeenCalled();
      expect(fixture.region.textContent).toBe("");
    }
    expect(fixture.selection.selectionAsBeats).toEqual(fixture.beats);

    window.dispatchEvent(new MouseEvent("mouseup", { button: 0 }));
    expect(fixture.announce).not.toHaveBeenCalled();
    jest.advanceTimersByTime(20);
    const description =
      "Track Guitar, Staff 1, voice 1, 3 beats selected, bar 1 beat 1 to bar 3 beat 1, anchor bar 1 beat 1, active end bar 3 beat 1.";
    expect(fixture.announce.mock.calls).toEqual([[description, false]]);
    expect(fixture.region.textContent).toBe(description);

    fixture.callbacks.announceSelection(true);
    expect(fixture.announce.mock.calls).toEqual([[description, false]]);
  });

  test.each(["refresh", "selection", "unbind"])(
    "cancels queued range output on %s",
    (action) => {
      const fixture = createCallbacks();
      startDrag(fixture);
      window.dispatchEvent(new MouseEvent("mouseup", { button: 0 }));
      expect(fixture.announce).not.toHaveBeenCalled();

      // A new cursor selection must win over the range waiting for its frame.
      if (action === "unbind") fixture.callbacks.unbind();
      else if (action === "refresh") {
        const beat = required(
          fixture.selection.trackElement.getBeatElement(fixture.beats[0])
        );
        fixture.selection.selectNoteElement(beat.noteElements[0]);
        fixture.selection.setSelectedNoteFret(5);
        fixture.callbacks.refresh();
      } else {
        required(
          fixture.viewport.querySelector('[id^="note-rect-"]')
        ).dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
      }

      const output = fixture.announce.mock.calls.map((v) => v[0]);
      if (action === "unbind") expect(output).toEqual([]);
      else
        expect(output).toEqual([
          action === "refresh"
            ? "Track Guitar, Staff 1, voice 1, Bar 1, 4/4, 120 BPM, Beat 1, quarter, String 1, fret 5."
            : initial,
        ]);

      jest.advanceTimersByTime(100);
      expect(fixture.announce.mock.calls.map((v) => v[0])).toEqual(output);
      if (action !== "unbind")
        expect(fixture.region.textContent).toBe(output[0]);
    }
  );

  test("deduplicates announcements and preserves explicit repeats", () => {
    const { shell, region } = createShell();
    const observer = new MutationObserver(() => {});
    observer.observe(region, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    try {
      shell.announce("");
      shell.announce("");
      jest.runOnlyPendingTimers();
      expect(region.textContent).toBe("");
      expect(observer.takeRecords()).toHaveLength(0);

      shell.announce("Repeat", true);
      expect(region.textContent).toBe("Repeat");
      expect(observer.takeRecords()).toHaveLength(1);
      shell.announce("Repeat");
      expect(observer.takeRecords()).toHaveLength(0);

      shell.announce("Repeat", true);
      expect(region.textContent).toBe("");
      observer.takeRecords();
      shell.announce("Repeat");
      expect(observer.takeRecords()).toHaveLength(0);
      jest.runOnlyPendingTimers();
      expect(region.textContent).toBe("Repeat");
      expect(observer.takeRecords()).toHaveLength(1);

      shell.announce("Repeat", true);
      shell.announce("New text");
      jest.runOnlyPendingTimers();
      expect(region.textContent).toBe("New text");
    } finally {
      observer.disconnect();
    }
  });

  function createEditor() {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const { score } = createScoreGraph();
    const editor = new TabUIEditor(root, score);
    editor.init();
    cleanups.push(() => editor.dispose());
    return {
      editor,
      root,
      region: required(root.querySelector('[role="status"]')),
    };
  }

  test("defers automatic announcements and publishes the latest host state once", () => {
    const { editor, region } = createEditor();
    const states = jest.fn();
    editor.subscribe(states);
    editor.refreshLayout();
    editor.refreshLayout();
    expect(states).toHaveBeenCalled();
    expect(region.textContent).toBe("");

    editor.score.tracks[0].name = "Latest name";
    editor.refreshLayout();
    const observer = new MutationObserver(() => {});
    observer.observe(region, { childList: true });
    try {
      jest.runAllTicks();
      expect(region.textContent).toBe(
        "Track Latest name, Staff 1, voice 1, Bar 1, 4/4, 120 BPM, Beat 1, quarter, String 1, empty."
      );
      expect(observer.takeRecords()).toHaveLength(1);
    } finally {
      observer.disconnect();
    }
  });

  test("does not publish automatic selection announcements after disposal", () => {
    const { editor, region } = createEditor();
    editor.score.tracks[0].name = "Live name";
    editor.refreshLayout();
    jest.runAllTicks();
    expect(region.textContent).toBe(
      "Track Live name, Staff 1, voice 1, Bar 1, 4/4, 120 BPM, Beat 1, quarter, String 1, empty."
    );

    editor.score.tracks[0].name = "Pending name";
    editor.refreshLayout();
    editor.dispose();
    jest.runAllTicks();
    jest.runOnlyPendingTimers();
    expect(region.textContent).toBe("");
  });
});
