import { EditorKeyboardDefCallbacks } from "../../../src/notation/input/editor-keyboard-callbacks";
import {
  DEFAULT_MASTER_BAR,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  NoteValue,
} from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { SelectedMoveDirection } from "../../../src/notation/controller";
import { withNotationDialog } from "./notation-dialog-fixture";
import { required } from "../required";
import { serializeScore } from "../../../src/notation/model/serialization";

function createKeyboardEvent(
  key: string,
  options: KeyboardEventInit & { keyCode?: number } = {}
) {
  return {
    key,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    ...options,
    preventDefault: jest.fn(),
  } as any;
}

type FakeRootElement = HTMLElement & {
  dispatch(event: string): void;
};

function createRootElement(): FakeRootElement {
  const listeners = new Map<string, Set<(...args: any[]) => void>>();
  return {
    /** Models DOM containment through the parent chain, including self. */
    contains(node: Node | null): boolean {
      while (node) {
        if (node === this) {
          return true;
        }
        node = node.parentNode;
      }
      return false;
    },
    /** Moves document focus before notifying root focus listeners. */
    focus(): void {
      (document as any).activeElement = this;
      this.dispatch("focusin");
    },
    addEventListener: jest.fn(
      (event: string, handler: (...args: any[]) => void) => {
        const handlers = listeners.get(event) ?? new Set();
        handlers.add(handler);
        listeners.set(event, handlers);
      }
    ),
    removeEventListener: jest.fn(
      (event: string, handler: (...args: any[]) => void) => {
        listeners.get(event)?.delete(handler);
      }
    ),
    dispatch(event: string): void {
      if (event === "focusin" || event === "mousedown") {
        (document as any).activeElement = this;
      }
      for (const handler of listeners.get(event) ?? []) {
        handler({});
      }
    },
  } as any;
}

function createHarness(rootElement: FakeRootElement = createRootElement()) {
  const trackControllerEditor = {
    copy: jest.fn(),
    paste: jest.fn(),
    deleteSelectedBeats: jest.fn(),
    setTechnique: jest.fn(),
    setSelectedNoteFret: jest.fn(),
    moveSelectedNote: jest.fn(),
    selectionManager: {
      selectionCursor: undefined as any,
    },
  };
  const notationComponent = {
    rootDiv: rootElement,
    ensureSelectedNoteVisible: jest.fn(),
    trackController: {
      undo: jest.fn(),
      redo: jest.fn(),
      startPlayer: jest.fn(),
      stopPlayer: jest.fn(),
      isPlaying: false,
      get playbackState() {
        return this.isPlaying ? "playing" : "idle";
      },
      get isPlaybackActive() {
        return this.isPlaying;
      },
      editingEnabled: true,
      copy: jest.fn(),
      paste: jest.fn(),
      deleteSelectedBeats: jest.fn(),
      removeSelectedBeat: jest.fn(),
      removeSelectedBar: jest.fn(),
      insertBeatBeforeSelected: jest.fn(),
      insertBeatAfterSelected: jest.fn(),
      insertBarBeforeSelected: jest.fn(),
      insertBarAfterSelected: jest.fn(),
      setSelectedBeatRest: jest.fn(),
      setDuration: jest.fn(),
      setDots: jest.fn(),
      setSelectedBeatsTuplet: jest.fn(),
      setSelectedBarRepeatStatus: jest.fn(),
      activeVoiceNumber: 1,
      setActiveVoiceNumber: jest.fn(),
      setTechnique: jest.fn(),
      setSelectedNoteFret: jest.fn(),
      moveSelectedNote: jest.fn(),
      moveSelectionByBar: jest.fn(() => true),
      extendSelectionByBeat: jest.fn(() => true),
      extendSelectionByBar: jest.fn(() => true),
      clearSelectionRange: jest.fn(() => true),
      selectionCursor: undefined as any,
      selectionAsBeats: [] as any[],
      hasSelectedNote: false,
      trackControllerEditor,
    },
  } as any;
  const uiComponent = {
    sideComponent: {
      noteControlsComponent: { showTupletControls: jest.fn() },
      measureControlsComponent: {
        showRepeatCountControls: jest.fn(),
        showTempoControls: jest.fn(),
        showTimeSigControls: jest.fn(),
      },
      techniqueControlsComponent: {
        showBendControls: jest.fn(),
      },
    },
  } as any;
  const renderFunc = jest.fn();
  const callbacks = new EditorKeyboardDefCallbacks(
    uiComponent,
    notationComponent,
    renderFunc,
    rootElement
  );

  return {
    callbacks,
    uiComponent,
    notationComponent,
    rootElement,
    trackControllerEditor,
    renderFunc,
  };
}

describe("EditorKeyboardDefCallbacks", () => {
  let originalDocument: any;

  beforeEach(() => {
    originalDocument = (globalThis as any).document;
    (globalThis as any).document = {
      activeElement: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  });

  afterEach(() => {
    (globalThis as any).document = originalDocument;
    jest.restoreAllMocks();
  });

  test.each([
    ["t", true, "Tuplet"],
    ["r", true, "Repeat count"],
    ["m", false, "Tempo"],
    ["m", true, "Time signature"],
    ["b", false, "Bend"],
  ] as const)(
    "%s shift=%s opens the existing dialog",
    (key, shiftKey, title) => {
      withNotationDialog(({ controller, root, notation, ui, host }) => {
        controller.setSelectedNoteFret(5);
        const render = jest.fn();
        const callbacks = new EditorKeyboardDefCallbacks(
          ui as ConstructorParameters<typeof EditorKeyboardDefCallbacks>[0],
          notation,
          render,
          root
        );
        root.focus();
        const event = new window.KeyboardEvent("keydown", {
          key,
          shiftKey,
          cancelable: true,
        });
        callbacks.onKeyDown(event);
        const open = required(host.querySelector("[open]"));
        const labelledBy = open.getAttribute("aria-labelledby");
        const label = labelledBy
          ? document.getElementById(labelledBy)?.textContent
          : open.getAttribute("aria-label");
        expect(label).toBe(title);
        expect(host.querySelectorAll("[open]")).toHaveLength(1);
        expect(controller.selectionCursor?.note).toEqual(
          expect.objectContaining({ fret: 5 })
        );
        expect(event.defaultPrevented).toBe(true);
        expect(render).not.toHaveBeenCalled();
      });
    }
  );

  test.each([
    ["v", false, GuitarTechniqueType.Vibrato],
    ["p", false, GuitarTechniqueType.PalmMute],
    ["l", false, GuitarTechniqueType.Legato],
    ["l", true, GuitarTechniqueType.LetRing],
    ["s", false, GuitarTechniqueType.Slide],
    ["h", false, GuitarTechniqueType.NaturalHarmonic],
    ["h", true, GuitarTechniqueType.PinchHarmonic],
  ] as const)(
    "%s shift=%s applies and removes eligible range techniques",
    (key, shiftKey, type) => {
      const { callbacks, notationComponent, rootElement, renderFunc } =
        createHarness();
      const { track, beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter },
      ]);
      const notes = beats.map((b) => b.notes?.[0]);
      for (const [index, beat] of beats.entries()) {
        for (const note of beat.notes ?? []) {
          if (!(note instanceof GuitarNote)) {
            throw Error("Expected guitar note");
          }
          note.fret = [5, 7, 9][index];
        }
      }
      const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
      notationComponent.trackController = controller;
      controller.extendSelectionByBeat(SelectedMoveDirection.Right);
      expect(controller.selectionAsBeats).toEqual(beats.slice(0, 2));
      rootElement.focus();
      for (const applied of [true, false]) {
        const event = createKeyboardEvent(key, { shiftKey });
        callbacks.onKeyDown(event);
        expect(notes.map((n) => n?.hasTechnique(type))).toEqual([
          applied,
          applied,
          false,
        ]);
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
      }
      controller.undo();
      expect(notes.map((n) => n?.hasTechnique(type))).toEqual([
        true,
        true,
        false,
      ]);
      controller.redo();
      expect(notes.map((n) => n?.hasTechnique(type))).toEqual([
        false,
        false,
        false,
      ]);
      expect(renderFunc).toHaveBeenCalledTimes(2);
      for (const beat of beats) {
        for (const note of beat.notes ?? []) {
          if (note instanceof GuitarNote) note.fret = null;
        }
      }
      const disabled = createKeyboardEvent(key, { shiftKey });
      callbacks.onKeyDown(disabled);
      expect(disabled.preventDefault).not.toHaveBeenCalled();
      expect(notes.map((n) => n?.techniques)).toEqual([[], [], []]);
      expect(renderFunc).toHaveBeenCalledTimes(2);
    }
  );

  test.each([false, true])(
    "Ctrl shortcuts copy, paste, undo and redo note values (uppercase=%s)",
    (uppercase) => {
      const { callbacks, notationComponent, rootElement, renderFunc } =
        createHarness();
      const { track, beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter },
      ]);
      const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
      notationComponent.trackController = controller;
      controller.setSelectedNoteFret(9);
      controller.moveSelectedNote(SelectedMoveDirection.Right);
      controller.setSelectedNoteFret(5);
      controller.moveSelectedNote(SelectedMoveDirection.Left);
      rootElement.focus();

      const copy = createKeyboardEvent(uppercase ? "C" : "c", {
        ctrlKey: true,
      });
      callbacks.onKeyDown(copy);
      expect(copy.preventDefault).toHaveBeenCalledTimes(1);
      expect(renderFunc).not.toHaveBeenCalled();
      expect(beats[0].notes?.[0]).toEqual(expect.objectContaining({ fret: 9 }));
      controller.moveSelectedNote(SelectedMoveDirection.Right);

      for (const [key, fret] of [
        ["v", 9],
        ["z", 5],
        ["y", 9],
      ] as const) {
        renderFunc.mockClear();
        const event = createKeyboardEvent(uppercase ? key.toUpperCase() : key, {
          ctrlKey: true,
        });
        callbacks.onKeyDown(event);
        expect(beats[1].notes?.[0]).toEqual(expect.objectContaining({ fret }));
        expect(beats[0].notes?.[0]).toEqual(
          expect.objectContaining({ fret: 9 })
        );
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(renderFunc).toHaveBeenCalledTimes(1);
      }
    }
  );

  test.each(["rest", "empty note"] as const)(
    "%s cursor rejects techniques",
    (state) => {
      const {
        callbacks,
        notationComponent,
        rootElement,
        uiComponent,
        renderFunc,
      } = createHarness();
      const { track, beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
      ]);
      const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
      notationComponent.trackController = controller;
      if (state === "rest") controller.setSelectedBeatRest();
      rootElement.focus();
      for (const key of ["v", "p", "l", "s", "b", "h"]) {
        const event = createKeyboardEvent(key);
        callbacks.onKeyDown(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      }
      if (state === "rest") {
        expect(beats[0].notes).toBeNull();
      } else {
        expect(beats[0].notes).toEqual(
          Array(6).fill(expect.objectContaining({ fret: null, techniques: [] }))
        );
      }
      expect(renderFunc).not.toHaveBeenCalled();
      expect(
        uiComponent.sideComponent.techniqueControlsComponent.showBendControls
      ).not.toHaveBeenCalled();
    }
  );

  test("ranges reject cursor-only dialogs, repeats, and dead notes", () => {
    const {
      callbacks,
      notationComponent,
      rootElement,
      renderFunc,
      uiComponent,
    } = createHarness();
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    controller.setSelectedNoteFret(5);
    controller.extendSelectionByBeat(SelectedMoveDirection.Right);
    expect(controller.selectionAsBeats).toEqual(beats);
    rootElement.focus();
    for (const key of ["x", "b", "r", "m"]) {
      const event = createKeyboardEvent(key);
      callbacks.onKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
    for (const key of ["r", "m"]) {
      const event = createKeyboardEvent(key, { shiftKey: true });
      callbacks.onKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
    expect(renderFunc).not.toHaveBeenCalled();
    expect(beats[0].notes?.[0]).toEqual(expect.objectContaining({ fret: 5 }));
    expect(beats[1].notes?.[0]).toEqual(
      expect.objectContaining({ fret: null })
    );
    expect(beats[0].voiceBar.bar.masterBar.isRepeatStart).toBe(false);
    expect(beats[0].voiceBar.bar.masterBar.isRepeatEnd).toBe(false);
    for (const component of Object.values(uiComponent.sideComponent)) {
      for (const open of Object.values(
        component as Record<string, jest.Mock>
      )) {
        expect(open).not.toHaveBeenCalled();
      }
    }
  });

  test.each([false, true])("repeat start toggles from %s", (enabled) => {
    const { callbacks, notationComponent, rootElement } = createHarness();
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    bar.masterBar.isRepeatStart = enabled;
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    rootElement.focus();
    const event = createKeyboardEvent("r");
    callbacks.onKeyDown(event);
    expect(bar.masterBar.isRepeatStart).toBe(!enabled);
    expect(event.preventDefault).toHaveBeenCalled();
    controller.undo();
    expect(bar.masterBar.isRepeatStart).toBe(enabled);
    controller.redo();
    expect(bar.masterBar.isRepeatStart).toBe(!enabled);
  });

  test.each([
    { key: "+", shiftKey: false },
    { key: "+", shiftKey: true },
    { key: "=", shiftKey: false },
    { key: "-", shiftKey: false },
  ])("duration steps clamp; $key shifted=$shiftKey", ({ key, shiftKey }) => {
    const { callbacks, notationComponent, rootElement, renderFunc } =
      createHarness();
    // Each row is a worked duration step, including both clamped endpoints.
    const steps = [
      [
        NoteDuration.SixtyFourth,
        NoteDuration.ThirtySecond,
        NoteDuration.SixtyFourth,
      ],
      [
        NoteDuration.ThirtySecond,
        NoteDuration.Sixteenth,
        NoteDuration.SixtyFourth,
      ],
      [NoteDuration.Sixteenth, NoteDuration.Eighth, NoteDuration.ThirtySecond],
      [NoteDuration.Eighth, NoteDuration.Quarter, NoteDuration.Sixteenth],
      [NoteDuration.Quarter, NoteDuration.Half, NoteDuration.Eighth],
      [NoteDuration.Half, NoteDuration.Whole, NoteDuration.Quarter],
      [NoteDuration.Whole, NoteDuration.Whole, NoteDuration.Half],
    ] as const;
    rootElement.focus();
    for (const [baseDuration, longer, shorter] of steps) {
      const { track, beats } = createBarWithBeats([
        { baseDuration },
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Half },
      ]);
      const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
      notationComponent.trackController = controller;
      controller.moveSelectedNote(SelectedMoveDirection.Right);
      controller.extendSelectionByBeat(SelectedMoveDirection.Left);
      expect(controller.selectionEndBeat).toBe(beats[0]);

      renderFunc.mockClear();
      const event = createKeyboardEvent(key, { shiftKey });
      callbacks.onKeyDown(event);
      const expected = key === "-" ? shorter : longer;
      expect(beats.map((beat) => beat.baseDuration)).toEqual([
        expected,
        expected,
        NoteDuration.Half,
      ]);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(renderFunc).toHaveBeenCalledTimes(1);

      controller.undo();
      expect(beats.map((beat) => beat.baseDuration)).toEqual([
        baseDuration,
        NoteDuration.Quarter,
        NoteDuration.Half,
      ]);
    }
  });

  test("dot cycles use the active end and preserve command undo/redo", () => {
    const { callbacks, notationComponent, rootElement, renderFunc } =
      createHarness();
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth, dots: 1 },
      { baseDuration: NoteDuration.Eighth, dots: 2 },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.extendSelectionByBeat(SelectedMoveDirection.Left);
    expect(controller.selectionEndBeat).toBe(beats[0]);
    rootElement.focus();
    for (const expected of [1, 2, 0]) {
      renderFunc.mockClear();
      const event = createKeyboardEvent(".");
      callbacks.onKeyDown(event);
      expect(beats.map((beat) => beat.dots)).toEqual([expected, expected, 2]);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(renderFunc).toHaveBeenCalledTimes(1);
    }
    for (const expected of [
      [2, 2, 2],
      [1, 1, 2],
      [0, 1, 2],
    ]) {
      controller.undo();
      expect(beats.map((beat) => beat.dots)).toEqual(expected);
    }
    for (const expected of [
      [1, 1, 2],
      [2, 2, 2],
      [0, 0, 2],
    ]) {
      controller.redo();
      expect(beats.map((beat) => beat.dots)).toEqual(expected);
    }
  });

  test.each([null, { normalCount: 5, tupletCount: 4 }])(
    "tuplet cycles normalize mixed ranges from active end %j",
    (initial) => {
      const { callbacks, notationComponent, rootElement, renderFunc } =
        createHarness();
      const duplet = { normalCount: 2, tupletCount: 1 };
      const triplet = { normalCount: 3, tupletCount: 2 };
      const { track, beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Eighth, tupletSettings: duplet },
        { baseDuration: NoteDuration.Eighth, tupletSettings: initial },
        { baseDuration: NoteDuration.Quarter },
      ]);
      const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
      notationComponent.trackController = controller;
      controller.extendSelectionByBeat(SelectedMoveDirection.Right);
      expect(controller.selectionEndBeat).toBe(beats[1]);
      rootElement.focus();
      const expectedCycle =
        initial === null
          ? [duplet, triplet, null]
          : [null, duplet, triplet, null];
      for (const expected of expectedCycle) {
        renderFunc.mockClear();
        const event = createKeyboardEvent("t");
        callbacks.onKeyDown(event);
        expect(beats.map((beat) => beat.tupletSettings)).toEqual([
          expected,
          expected,
          null,
        ]);
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(renderFunc).toHaveBeenCalledTimes(1);
      }
      for (let i = 0; i < expectedCycle.length; i++) controller.undo();
      expect(beats.map((beat) => beat.tupletSettings)).toEqual([
        duplet,
        initial,
        null,
      ]);
      for (let i = 0; i < expectedCycle.length; i++) controller.redo();
      expect(beats.map((beat) => beat.tupletSettings)).toEqual([
        null,
        null,
        null,
      ]);
    }
  );

  test.each([
    ["+", {}],
    ["-", {}],
    [".", {}],
    ["t", {}],
  ] as const)("empty selection consumes no-op %s", (key, options) => {
    const { callbacks, rootElement, renderFunc, notationComponent } =
      createHarness();
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    controller.trackElement.update();
    controller.selectBeat(
      required(controller.trackElement.getBeatElement(beats[0]))
    );
    controller.clearSelection();
    expect(controller.selectionAsBeats).toEqual([]);
    expect(controller.selectionCursor).toBeUndefined();
    const before = serializeScore(track.score);
    rootElement.focus();
    const event = createKeyboardEvent(key, options);
    expect(() => callbacks.onKeyDown(event)).not.toThrow();
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(renderFunc).not.toHaveBeenCalled();
    expect(controller.selectionCursor).toBeUndefined();
    expect(serializeScore(track.score)).toEqual(before);
  });

  test("empty selection opens the Shift+T dialog", () => {
    withNotationDialog(({ controller, root, notation, ui, note, beats }) => {
      controller.selectBeat(
        required(controller.trackElement.getBeatElement(beats[0]))
      );
      controller.clearSelection();
      expect(controller.selectionAsBeats).toEqual([]);
      expect(controller.selectionCursor).toBeUndefined();
      const render = jest.fn();
      const callbacks = new EditorKeyboardDefCallbacks(
        ui as ConstructorParameters<typeof EditorKeyboardDefCallbacks>[0],
        notation,
        render,
        root
      );
      root.focus();
      const event = new window.KeyboardEvent("keydown", {
        key: "t",
        shiftKey: true,
        cancelable: true,
      });
      callbacks.onKeyDown(event);
      expect(note.tupletComponent.dialog.open).toBe(true);
      expect(note.tupletComponent.template.normalValue.textContent).toBe("3");
      expect(note.tupletComponent.template.tupletValue.textContent).toBe("2");
      expect(event.defaultPrevented).toBe(true);
      expect(render).not.toHaveBeenCalled();
    });
  });

  test.each([
    ["x", {}],
    ["b", {}],
    ["v", {}],
  ] as const)("unavailable %s is not consumed", (key, options) => {
    const { callbacks, rootElement, renderFunc } = createHarness();
    rootElement.focus();
    const event = createKeyboardEvent(key, options);
    expect(() => callbacks.onKeyDown(event)).not.toThrow();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(renderFunc).not.toHaveBeenCalled();
  });

  test.each([
    { altKey: true },
    { metaKey: true },
    { isComposing: true },
    { keyCode: 229 },
    { ctrlKey: true, shiftKey: true },
  ])("rejects invalid modifiers %j", (options) => {
    const { callbacks, rootElement, renderFunc } = createHarness();
    rootElement.focus();
    for (const key of [
      "x",
      "+",
      ".",
      "t",
      "v",
      "p",
      "l",
      "s",
      "b",
      "h",
      "r",
      "m",
      "a",
      "i",
      "Delete",
      "z",
      "y",
      "c",
      " ",
    ]) {
      const event = createKeyboardEvent(key, options);
      callbacks.onKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
    expect(renderFunc).not.toHaveBeenCalled();
  });

  test("unknown keys, shifted aliases, and consumed events keep defaults", () => {
    const { callbacks, rootElement } = createHarness();
    rootElement.focus();
    for (const key of ["q", "=", "_", "p", "b", "s", ".", "-", "1", " "]) {
      const event = createKeyboardEvent(key, { shiftKey: true });
      callbacks.onKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
    const event = createKeyboardEvent(" ");
    event.defaultPrevented = true;
    callbacks.onKeyDown(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  test("only the notation viewport owns shortcuts, not its shell or descendants", () => {
    const shell = createRootElement();
    const { callbacks, notationComponent } = createHarness(shell);
    const viewport = createRootElement();
    Object.assign(viewport, { parentNode: shell });
    notationComponent.rootDiv = viewport;
    for (const target of [
      shell,
      { parentNode: shell },
      { parentNode: viewport },
      null,
    ]) {
      (document as any).activeElement = target;
      const event = createKeyboardEvent(" ");
      callbacks.onKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
    viewport.focus();
    callbacks.onKeyDown(createKeyboardEvent(" "));
    expect(notationComponent.trackController.startPlayer).toHaveBeenCalledTimes(
      1
    );
  });

  test.each(["playing", "starting", "view-only"])(
    "%s blocks every mutation without preventing defaults",
    (mode) => {
      const { callbacks, notationComponent, rootElement, renderFunc } =
        createHarness();
      const controller = notationComponent.trackController;
      controller.editingEnabled = mode !== "view-only";
      Object.defineProperty(controller, "playbackState", {
        value: mode === "view-only" ? "idle" : mode,
      });
      controller.selectionAsBeats = [{}];
      controller.selectionCursor = { note: null };
      rootElement.focus();
      for (const key of [
        "x",
        "+",
        "-",
        ".",
        "t",
        "v",
        "p",
        "l",
        "s",
        "b",
        "h",
        "r",
        "m",
        "a",
        "i",
        "Delete",
      ]) {
        for (const shiftKey of [false, true]) {
          const event = createKeyboardEvent(key, { shiftKey });
          callbacks.onKeyDown(event);
          expect(event.preventDefault).not.toHaveBeenCalled();
        }
      }
      expect(renderFunc).not.toHaveBeenCalled();
    }
  );

  test.each(["editing", "view-only", "starting", "playing"])(
    "%s routes shared shortcuts once with the same mode restrictions",
    (mode) => {
      const { callbacks, notationComponent, rootElement } = createHarness();
      const controller = notationComponent.trackController;
      const idle = mode === "editing" || mode === "view-only";
      controller.editingEnabled = mode !== "view-only";
      Object.defineProperty(controller, "playbackState", {
        value: idle ? "idle" : mode,
      });
      rootElement.focus();
      const routes = [
        ["C", { ctrlKey: true }, "copy", true],
        [" ", {}, idle ? "startPlayer" : "stopPlayer", true],
        ["Escape", {}, "clearSelectionRange", idle],
        ["ArrowUp", {}, "moveSelectedNote", idle],
        ["ArrowLeft", { ctrlKey: true }, "moveSelectionByBar", idle],
        ["ArrowRight", { shiftKey: true }, "extendSelectionByBeat", idle],
        [
          "ArrowRight",
          { ctrlKey: true, shiftKey: true },
          "extendSelectionByBar",
          idle,
        ],
      ] as const;
      for (const [key, options, method, accepted] of routes) {
        const event = createKeyboardEvent(key, options);
        callbacks.onKeyDown(event);
        expect(controller[method]).toHaveBeenCalledTimes(accepted ? 1 : 0);
        expect(event.preventDefault).toHaveBeenCalledTimes(accepted ? 1 : 0);
      }
    }
  );

  test.each([true, false])(
    "unchanged range extension still consumes arrows, editing=%s",
    (editingEnabled) => {
      withNotationDialog(({ controller, beats, root, notation, ui }) => {
        controller.setEditingEnabled(editingEnabled);
        notation.ensureSelectedNoteVisible = () => {};
        const render = jest.fn();
        const callbacks = new EditorKeyboardDefCallbacks(
          ui as any,
          notation,
          render,
          root
        );
        root.focus();
        for (const ctrlKey of [false, true]) {
          const event = new window.KeyboardEvent("keydown", {
            key: "ArrowLeft",
            ctrlKey,
            shiftKey: true,
            cancelable: true,
          });
          callbacks.onKeyDown(event);
          expect(event.defaultPrevented).toBe(true);
          expect(controller.selectionBeats).toEqual([]);
          expect(controller.selectionCursor?.beat).toBe(beats[0]);
        }
        expect(render).not.toHaveBeenCalled();
      });
    }
  );

  test("real backward range cycles custom tuplets and restores mixed values", () => {
    const { callbacks, notationComponent, rootElement } = createHarness();
    const custom = { normalCount: 5, tupletCount: 4 };
    const duplet = { normalCount: 2, tupletCount: 1 };
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth, tupletSettings: custom },
      { baseDuration: NoteDuration.Eighth, tupletSettings: duplet },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.extendSelectionByBeat(SelectedMoveDirection.Left);
    expect(controller.selectionEndBeat).toBe(beats[0]);
    rootElement.focus();
    callbacks.onKeyDown(createKeyboardEvent("t"));
    expect(beats.map((beat) => beat.tupletSettings)).toEqual([null, null]);
    callbacks.onKeyDown(createKeyboardEvent("z", { ctrlKey: true }));
    expect(beats.map((beat) => beat.tupletSettings)).toEqual([custom, duplet]);
    callbacks.onKeyDown(createKeyboardEvent("y", { ctrlKey: true }));
    expect(beats.map((beat) => beat.tupletSettings)).toEqual([null, null]);
  });

  test("Shift+Delete removes all touched bars in one undoable operation", () => {
    const { callbacks, notationComponent, rootElement } = createHarness();
    const { track, score } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const originalBars = [...score.masterBars];
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    controller.extendSelectionByBeat(SelectedMoveDirection.Right);
    rootElement.focus();
    const event = createKeyboardEvent("Delete", { shiftKey: true });
    callbacks.onKeyDown(event);
    expect(score.masterBars).toEqual([originalBars[2]]);
    expect(controller.selectionCursor?.bar.masterBar).toBe(originalBars[2]);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    callbacks.onKeyDown(createKeyboardEvent("z", { ctrlKey: true }));
    expect(score.masterBars).toEqual(originalBars);
    callbacks.onKeyDown(createKeyboardEvent("y", { ctrlKey: true }));
    expect(score.masterBars).toEqual([originalBars[2]]);
  });

  test("dead notes and rests use undoable controller operations", () => {
    const { callbacks, notationComponent, rootElement } = createHarness();
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    rootElement.focus();
    callbacks.onKeyDown(createKeyboardEvent("x"));
    expect(beats[0].notes?.[0]).toEqual(expect.objectContaining({ fret: -1 }));
    callbacks.onKeyDown(createKeyboardEvent("X", { shiftKey: true }));
    expect(beats[0].isRest()).toBe(true);
    callbacks.onKeyDown(createKeyboardEvent("z", { ctrlKey: true }));
    expect(beats[0].notes?.[0]).toEqual(expect.objectContaining({ fret: -1 }));
  });

  test("dead shortcut rejects a rest without mutation or an undo entry", () => {
    const { callbacks, notationComponent, rootElement, renderFunc } =
      createHarness();
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    controller.setSelectedNoteFret(5);
    controller.setSelectedBeatRest();
    expect(controller.selectionCursor?.note).toBeNull();
    rootElement.focus();
    const event = createKeyboardEvent("x");
    callbacks.onKeyDown(event);
    expect(beats[0].isRest()).toBe(true);
    expect(renderFunc).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
    controller.undo();
    expect(beats[0].notes?.[0]).toEqual(expect.objectContaining({ fret: 5 }));
  });

  test.each([undefined, null, { noteValue: NoteValue.None }])(
    "backspace rejects an absent or empty note: %s",
    (note) => {
      const { callbacks, notationComponent, rootElement, renderFunc } =
        createHarness();
      notationComponent.trackController.selectionCursor =
        note === undefined ? undefined : { note };
      rootElement.focus();
      const event = createKeyboardEvent("Backspace");
      callbacks.onKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(renderFunc).not.toHaveBeenCalled();
      expect(
        notationComponent.trackController.setSelectedNoteFret
      ).not.toHaveBeenCalled();
    }
  );

  test("backspace clears a populated note and restores it through history", () => {
    const { callbacks, notationComponent, rootElement, renderFunc } =
      createHarness();
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    controller.setSelectedNoteFret(7);
    rootElement.focus();
    const event = createKeyboardEvent("Backspace");
    callbacks.onKeyDown(event);
    expect(beats[0].notes?.[0]).toEqual(
      expect.objectContaining({ fret: null })
    );
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(1);

    callbacks.onKeyDown(createKeyboardEvent("z", { ctrlKey: true }));
    expect(beats[0].notes?.[0]).toEqual(expect.objectContaining({ fret: 7 }));
    callbacks.onKeyDown(createKeyboardEvent("y", { ctrlKey: true }));
    expect(beats[0].notes?.[0]).toEqual(
      expect.objectContaining({ fret: null })
    );
  });

  test("playback suppresses editing shortcuts but preserves Space", () => {
    const { callbacks, notationComponent, rootElement, uiComponent } =
      createHarness();
    callbacks.bind();
    rootElement.dispatch("focusin");
    notationComponent.trackController.isPlaying = true;
    notationComponent.trackController.hasSelectedNote = true;

    callbacks.onKeyDown(createKeyboardEvent("c", { ctrlKey: true }));
    callbacks.onKeyDown(createKeyboardEvent("v", { ctrlKey: true }));
    callbacks.onKeyDown(createKeyboardEvent("b", { shiftKey: true }));
    callbacks.onKeyDown(createKeyboardEvent("Delete"));
    callbacks.onKeyDown(createKeyboardEvent(" "));

    expect(notationComponent.trackController.paste).not.toHaveBeenCalled();
    expect(notationComponent.trackController.copy).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.deleteSelectedBeats
    ).not.toHaveBeenCalled();
    expect(
      uiComponent.sideComponent.techniqueControlsComponent.showBendControls
    ).not.toHaveBeenCalled();
    expect(notationComponent.trackController.stopPlayer).toHaveBeenCalledTimes(
      1
    );
  });

  test("view-only dispatches only non-mutating keyboard actions", () => {
    const {
      callbacks,
      notationComponent,
      rootElement,
      uiComponent,
      renderFunc,
    } = createHarness();
    callbacks.bind();
    rootElement.dispatch("focusin");
    notationComponent.trackController.editingEnabled = false;
    notationComponent.trackController.hasSelectedNote = true;
    callbacks.onKeyDown(createKeyboardEvent("c", { ctrlKey: true }));
    callbacks.onKeyDown(createKeyboardEvent("v", { ctrlKey: true }));
    callbacks.onKeyDown(createKeyboardEvent("z", { ctrlKey: true }));
    callbacks.onKeyDown(createKeyboardEvent("y", { ctrlKey: true }));
    callbacks.onKeyDown(createKeyboardEvent("v", { shiftKey: true }));
    callbacks.onKeyDown(createKeyboardEvent("p", { shiftKey: true }));
    callbacks.onKeyDown(createKeyboardEvent("b", { shiftKey: true }));
    callbacks.onKeyDown(createKeyboardEvent("Delete"));
    callbacks.onKeyDown(createKeyboardEvent("7"));
    callbacks.onKeyDown(createKeyboardEvent("Backspace"));
    callbacks.onKeyDown(createKeyboardEvent("ArrowRight"));
    callbacks.onKeyDown(createKeyboardEvent("ArrowLeft", { ctrlKey: true }));
    callbacks.onKeyDown(createKeyboardEvent(" "));

    expect(notationComponent.trackController.copy).toHaveBeenCalledTimes(1);
    expect(notationComponent.trackController.paste).not.toHaveBeenCalled();
    expect(notationComponent.trackController.undo).not.toHaveBeenCalled();
    expect(notationComponent.trackController.redo).not.toHaveBeenCalled();
    expect(
      notationComponent.trackController.deleteSelectedBeats
    ).not.toHaveBeenCalled();
    expect(
      notationComponent.trackController.setTechnique
    ).not.toHaveBeenCalled();
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).not.toHaveBeenCalled();
    expect(
      uiComponent.sideComponent.techniqueControlsComponent.showBendControls
    ).not.toHaveBeenCalled();
    expect(
      notationComponent.trackController.moveSelectedNote
    ).toHaveBeenCalledWith(SelectedMoveDirection.Right);
    expect(
      notationComponent.trackController.moveSelectionByBar
    ).toHaveBeenCalledWith(SelectedMoveDirection.Left);
    expect(notationComponent.trackController.startPlayer).toHaveBeenCalledTimes(
      1
    );
    expect(renderFunc).toHaveBeenCalledTimes(3);
  });

  test("technique shortcuts respect selection and bend shortcut opens bend controls", () => {
    const { callbacks, uiComponent, notationComponent, renderFunc } =
      createHarness(createRootElement());
    notationComponent.trackController = new TrackController(
      createBarWithBeats([]).track,
      TEST_LAYOUT_DIMENSIONS
    );
    callbacks.vibratoEvent();
    expect(notationComponent.trackController.selectionCursor).toBeUndefined();
    expect(notationComponent.trackController.selectionAsBeats).toEqual([]);
    expect(renderFunc).not.toHaveBeenCalled();

    const { track } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;

    controller.setSelectedNoteFret(5);
    const note = controller.selectionCursor?.note;

    callbacks.vibratoEvent();
    expect(note?.hasTechnique(GuitarTechniqueType.Vibrato)).toBe(true);
    callbacks.palmMuteEvent();
    expect(note?.hasTechnique(GuitarTechniqueType.PalmMute)).toBe(true);
    callbacks.bendEvent();

    expect(
      uiComponent.sideComponent.techniqueControlsComponent.showBendControls
    ).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(2);
  });

  test("number entry combines only within the configured time epsilon", () => {
    const { callbacks, notationComponent, renderFunc } =
      createHarness(createRootElement());
    const { track } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    const getTimeSpy = jest.spyOn(Date.prototype, "getTime");

    getTimeSpy.mockReturnValueOnce(1000);
    callbacks.fretInputEvent("1");
    expect(controller.selectionCursor?.note).toEqual(
      expect.objectContaining({ fret: 1 })
    );

    getTimeSpy.mockReturnValueOnce(1100);
    callbacks.fretInputEvent("2");
    expect(controller.selectionCursor?.note).toEqual(
      expect.objectContaining({ fret: 12 })
    );

    getTimeSpy.mockReturnValueOnce(1500);
    callbacks.fretInputEvent("3");
    expect(controller.selectionCursor?.note).toEqual(
      expect.objectContaining({ fret: 3 })
    );

    callbacks.fretInputEvent("x");
    expect(controller.selectionCursor?.note).toEqual(
      expect.objectContaining({ fret: 3 })
    );
    expect(renderFunc).toHaveBeenCalledTimes(3);
  });

  test("rapid digits do not combine after voice selection changes", () => {
    const { callbacks, notationComponent } = createHarness();
    const { track } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    jest.spyOn(Date.prototype, "getTime").mockReturnValue(1000);
    callbacks.fretInputEvent("1");
    const firstNote = controller.selectionCursor?.note;
    controller.setActiveVoiceNumber(2);
    callbacks.fretInputEvent("2");
    expect(firstNote).toEqual(expect.objectContaining({ fret: 1 }));
    expect(controller.selectionCursor?.note).not.toBe(firstNote);
    expect(controller.selectionCursor?.note).toEqual(
      expect.objectContaining({ fret: 2 })
    );
  });

  // NOTE: This is what I mean by tests that don't make sense to me
  // What purpose does this serve? Moving is one operation,
  // clearing with a backspace is another operation and most importantly
  // **why are they tested together?** This is barely a **unit** test
  test("Up/Down select the note cleared by backspace", () => {
    const { callbacks, notationComponent, rootElement, renderFunc } =
      createHarness();
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    controller.setSelectedNoteFret(5);
    controller.moveSelectedNote(SelectedMoveDirection.Down);
    controller.setSelectedNoteFret(9);
    controller.moveSelectedNote(SelectedMoveDirection.Up);
    const upperNote = beats[0].notes?.[0];
    const lowerNote = beats[0].notes?.[1];
    rootElement.focus();

    const down = createKeyboardEvent("ArrowDown");
    callbacks.onKeyDown(down);
    expect(controller.selectionCursor?.note).toBe(lowerNote);
    expect(down.preventDefault).toHaveBeenCalledTimes(1);

    const clearLower = createKeyboardEvent("Backspace");
    callbacks.onKeyDown(clearLower);
    expect(lowerNote).toEqual(expect.objectContaining({ fret: null }));
    expect(upperNote).toEqual(expect.objectContaining({ fret: 5 }));
    expect(clearLower.preventDefault).toHaveBeenCalledTimes(1);

    controller.undo();
    expect(lowerNote).toEqual(expect.objectContaining({ fret: 9 }));

    const up = createKeyboardEvent("ArrowUp");
    callbacks.onKeyDown(up);
    expect(controller.selectionCursor?.note).toBe(upperNote);
    expect(up.preventDefault).toHaveBeenCalledTimes(1);

    const clearUpper = createKeyboardEvent("Backspace");
    callbacks.onKeyDown(clearUpper);
    expect(upperNote).toEqual(expect.objectContaining({ fret: null }));
    expect(lowerNote).toEqual(expect.objectContaining({ fret: 9 }));
    expect(clearUpper.preventDefault).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(4);
  });

  test("horizontal arrows move an active beat range", () => {
    withNotationDialog(({ controller, beats, root, notation, ui }) => {
      notation.ensureSelectedNoteVisible = () => {};
      for (const beat of beats) beat.baseDuration = NoteDuration.Half;
      beats[0].voiceBar.rebuildTiming();
      const track = controller.trackElement.track;
      track.score.appendMasterBar(DEFAULT_MASTER_BAR);
      const nextBeat = required(track.staves[0].bars[1].getVoiceBar(1))
        .beats[0];
      const render = jest.fn();
      const callbacks = new EditorKeyboardDefCallbacks(
        ui as any,
        notation,
        render,
        root
      );
      root.focus();
      controller.extendSelectionByBeat(SelectedMoveDirection.Right);
      expect(controller.selectionBeats).toEqual(beats);

      callbacks.onKeyDown(
        new window.KeyboardEvent("keydown", { key: "ArrowLeft" })
      );
      expect(controller.selectionBeats).toEqual([]);
      expect(controller.selectionCursor?.beat).toBe(beats[0]);
      expect(render).toHaveBeenCalledTimes(1);
      expect(render).toHaveBeenLastCalledWith();

      controller.extendSelectionByBeat(SelectedMoveDirection.Right);
      callbacks.onKeyDown(
        new window.KeyboardEvent("keydown", { key: "ArrowRight" })
      );
      expect(controller.selectionBeats).toEqual([]);
      expect(controller.selectionCursor?.beat).toBe(nextBeat);
      expect(render).toHaveBeenCalledTimes(2);
      expect(render).toHaveBeenLastCalledWith();
    });
  });

  test("shift arrows extend selection by beat or bar", () => {
    withNotationDialog(({ controller, beats, root, notation, ui }) => {
      notation.ensureSelectedNoteVisible = () => {};
      const track = controller.trackElement.track;
      track.score.appendMasterBar(DEFAULT_MASTER_BAR);
      const nextBeat = required(track.staves[0].bars[1].getVoiceBar(1))
        .beats[0];
      const render = jest.fn();
      const callbacks = new EditorKeyboardDefCallbacks(
        ui as any,
        notation,
        render,
        root
      );
      root.focus();
      for (const [key, ctrlKey, expected] of [
        ["ArrowRight", false, beats],
        ["ArrowLeft", false, [beats[0]]],
        ["ArrowRight", true, beats],
        ["ArrowRight", true, [...beats, nextBeat]],
        ["ArrowLeft", true, beats],
      ] as const) {
        const event = new window.KeyboardEvent("keydown", {
          key,
          ctrlKey,
          shiftKey: true,
          cancelable: true,
        });
        render.mockClear();
        callbacks.onKeyDown(event);
        expect(event.defaultPrevented).toBe(true);
        expect(controller.selectionBeats).toEqual(expected);
        expect(render).toHaveBeenCalledTimes(1);
        expect(render).toHaveBeenLastCalledWith();
      }
    });
  });

  test("shift arrows extend selection when editing is disabled", () => {
    withNotationDialog(({ controller, beats, root, notation, ui }) => {
      controller.setEditingEnabled(false);
      notation.ensureSelectedNoteVisible = () => {};
      controller.moveSelectedNote(SelectedMoveDirection.Right);
      const before = serializeScore(controller.trackElement.track.score);
      const render = jest.fn();
      const callbacks = new EditorKeyboardDefCallbacks(
        ui as any,
        notation,
        render,
        root
      );
      root.focus();
      callbacks.onKeyDown(
        new window.KeyboardEvent("keydown", {
          key: "ArrowLeft",
          shiftKey: true,
        })
      );
      expect(controller.selectionBeats).toEqual(beats);
      expect(render).toHaveBeenCalledTimes(1);
      expect(render).toHaveBeenLastCalledWith();
      callbacks.onKeyDown(
        new window.KeyboardEvent("keydown", {
          key: "ArrowRight",
          ctrlKey: true,
          shiftKey: true,
        })
      );
      expect(controller.selectionBeats).toEqual([beats[1]]);
      expect(render).toHaveBeenCalledTimes(2);
      expect(render).toHaveBeenLastCalledWith();
      expect(serializeScore(controller.trackElement.track.score)).toEqual(
        before
      );
    });
  });

  test.each([true, false])(
    "ctrl arrows handle successful movement, editing=%s",
    (editing) => {
      withNotationDialog(({ controller, beats, root, notation, ui }) => {
        controller.setEditingEnabled(editing);
        notation.ensureSelectedNoteVisible = () => {};
        const render = jest.fn();
        const callbacks = new EditorKeyboardDefCallbacks(
          ui as any,
          notation,
          render,
          root
        );
        root.focus();
        const accepted = new window.KeyboardEvent("keydown", {
          key: "ArrowRight",
          ctrlKey: true,
          cancelable: true,
        });
        callbacks.onKeyDown(accepted);
        expect(accepted.defaultPrevented).toBe(true);
        expect(controller.selectionCursor?.beat).toBe(beats[1]);
        expect(render).toHaveBeenCalledTimes(1);

        const rejected = new window.KeyboardEvent("keydown", {
          key: "ArrowRight",
          ctrlKey: true,
          cancelable: true,
        });
        callbacks.onKeyDown(rejected);
        expect(rejected.defaultPrevented).toBe(false);
        expect(controller.selectionCursor?.beat).toBe(beats[1]);
        expect(render).toHaveBeenCalledTimes(1);
      });
    }
  );

  test.each([true, false])(
    "escape handles only active ranges, editing=%s",
    (editing) => {
      withNotationDialog(({ controller, beats, root, notation, ui }) => {
        controller.setEditingEnabled(editing);
        notation.ensureSelectedNoteVisible = () => {};
        controller.extendSelectionByBeat(SelectedMoveDirection.Right);
        expect(controller.selectionBeats).toEqual(beats);
        const render = jest.fn();
        const callbacks = new EditorKeyboardDefCallbacks(
          ui as any,
          notation,
          render,
          root
        );
        root.focus();
        const accepted = new window.KeyboardEvent("keydown", {
          key: "Escape",
          cancelable: true,
        });
        callbacks.onKeyDown(accepted);
        expect(accepted.defaultPrevented).toBe(true);
        expect(controller.selectionBeats).toEqual([]);
        expect(controller.selectionCursor?.beat).toBe(beats[0]);
        expect(render).toHaveBeenCalledTimes(1);

        const rejected = new window.KeyboardEvent("keydown", {
          key: "Escape",
          cancelable: true,
        });
        callbacks.onKeyDown(rejected);
        expect(rejected.defaultPrevented).toBe(false);
        expect(render).toHaveBeenCalledTimes(1);
      });
    }
  );

  test.each(["F2", "Tab"])(
    "%s keeps browser behavior and leaves notation unchanged",
    (key) => {
      const { callbacks, rootElement, notationComponent, renderFunc } =
        createHarness();
      const { track, beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
      ]);
      const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
      notationComponent.trackController = controller;
      controller.setSelectedNoteFret(7);
      const selectedBeat = controller.selectionCursor?.beat;
      rootElement.focus();

      const event = createKeyboardEvent(key);
      callbacks.onKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(renderFunc).not.toHaveBeenCalled();
      expect(controller.selectionCursor?.beat).toBe(selectedBeat);
      expect(beats[0].notes?.[0]).toEqual(expect.objectContaining({ fret: 7 }));
      controller.undo();
      expect(beats[0].notes?.[0]).toEqual(
        expect.objectContaining({ fret: null })
      );
    }
  );

  test("bind and unbind attach one keydown listener and are idempotent", () => {
    const { callbacks } = createHarness(createRootElement());
    const doc = (globalThis as any).document;

    callbacks.bind();
    callbacks.bind();
    expect(doc.addEventListener).toHaveBeenCalledTimes(1);
    expect(doc.addEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );

    callbacks.unbind();
    callbacks.unbind();
    expect(doc.removeEventListener).toHaveBeenCalledTimes(1);
    expect(doc.removeEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  test("restores editor ownership after temporary keyboard capture", () => {
    const root = createRootElement();
    const { callbacks, notationComponent } = createHarness(root);
    callbacks.bind();
    root.focus();

    callbacks.unbind();
    callbacks.bind();
    callbacks.onKeyDown(createKeyboardEvent(" "));

    expect(notationComponent.trackController.startPlayer).toHaveBeenCalledTimes(
      1
    );
    callbacks.unbind();
  });

  test("rebind does not steal ownership when focus is outside the editor", () => {
    const editorA = createHarness();
    const editorB = createHarness();
    editorA.callbacks.bind();
    editorB.callbacks.bind();
    editorA.rootElement.focus();

    editorA.callbacks.unbind();
    editorB.rootElement.focus();
    editorA.callbacks.bind();
    const event = createKeyboardEvent(" ");
    editorA.callbacks.onKeyDown(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    editorB.callbacks.onKeyDown(event);

    expect(
      editorA.notationComponent.trackController.startPlayer
    ).not.toHaveBeenCalled();
    expect(
      editorB.notationComponent.trackController.startPlayer
    ).toHaveBeenCalledTimes(1);
    editorA.callbacks.unbind();
    editorB.callbacks.unbind();
  });

  test("global keyboard input is scoped to the active editor root", () => {
    const rootA = createRootElement();
    const rootB = createRootElement();
    const editorA = createHarness(rootA);
    const editorB = createHarness(rootB);
    const doc = (globalThis as any).document;
    const keydownHandlers: ((event: KeyboardEvent) => void)[] = [];
    doc.addEventListener.mockImplementation(
      (event: string, handler: (event: KeyboardEvent) => void) => {
        if (event === "keydown") {
          keydownHandlers.push(handler);
        }
      }
    );
    doc.removeEventListener.mockImplementation(
      (event: string, handler: (event: KeyboardEvent) => void) => {
        if (event !== "keydown") {
          return;
        }
        const index = keydownHandlers.indexOf(handler);
        if (index !== -1) {
          keydownHandlers.splice(index, 1);
        }
      }
    );

    editorA.callbacks.bind();
    editorB.callbacks.bind();

    for (const handler of keydownHandlers) {
      handler(createKeyboardEvent(" "));
    }
    expect(
      editorA.notationComponent.trackController.startPlayer
    ).toHaveBeenCalledTimes(0);
    expect(
      editorB.notationComponent.trackController.startPlayer
    ).toHaveBeenCalledTimes(0);

    rootA.dispatch("focusin");
    for (const handler of keydownHandlers) {
      handler(createKeyboardEvent(" "));
    }
    expect(
      editorA.notationComponent.trackController.startPlayer
    ).toHaveBeenCalledTimes(1);
    expect(
      editorB.notationComponent.trackController.startPlayer
    ).toHaveBeenCalledTimes(0);

    rootB.dispatch("mousedown");
    for (const handler of keydownHandlers) {
      handler(createKeyboardEvent(" "));
    }
    expect(
      editorA.notationComponent.trackController.startPlayer
    ).toHaveBeenCalledTimes(1);
    expect(
      editorB.notationComponent.trackController.startPlayer
    ).toHaveBeenCalledTimes(1);

    editorA.callbacks.unbind();
    editorB.callbacks.unbind();
    expect(keydownHandlers).toHaveLength(0);
  });
});
