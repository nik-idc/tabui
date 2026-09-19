import { EditorKeyboardDefCallbacks } from "../../../src/notation/input/editor-keyboard-callbacks";
import { RenderType } from "../../../src/notation/input/render-type";
import {
  BarRepeatStatus,
  DEFAULT_MASTER_BAR,
  GuitarTechniqueType,
  NoteDuration,
  NoteValue,
} from "../../../src/notation/model";
import { SetTupletCommand } from "../../../src/notation/controller/editor/command/set-tuplet-command";
import { SetDotsCommand } from "../../../src/notation/controller/editor/command/set-dots-command";
import { createBarWithBeats } from "../model/helpers";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { SelectedMoveDirection } from "../../../src/notation/controller";

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
    ["x", false, "setSelectedNoteFret", [-1]],
    ["X", true, "setSelectedBeatRest", []],
    ["a", false, "insertBeatAfterSelected", []],
    ["A", true, "insertBeatBeforeSelected", []],
    ["i", false, "insertBarAfterSelected", []],
    ["I", true, "insertBarBeforeSelected", []],
    ["Delete", false, "removeSelectedBeat", []],
    ["Delete", true, "removeSelectedBar", []],
  ] as const)(
    "%s shift=%s uses the mouse operation",
    (key, shiftKey, method, args) => {
      const { callbacks, notationComponent, rootElement, renderFunc } =
        createHarness();
      const controller = notationComponent.trackController;
      controller.selectionAsBeats = [{}, {}];
      const { track } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
      ]);
      controller.selectionCursor = new TrackController(
        track,
        TEST_LAYOUT_DIMENSIONS
      ).selectionCursor;
      rootElement.focus();
      const event = createKeyboardEvent(key, { shiftKey });
      callbacks.onKeyDown(event);
      expect(controller[method]).toHaveBeenCalledWith(...args);
      expect(controller.deleteSelectedBeats).not.toHaveBeenCalled();
      expect(renderFunc).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    }
  );

  test.each([
    ["t", true, "noteControlsComponent", "showTupletControls"],
    ["r", true, "measureControlsComponent", "showRepeatCountControls"],
    ["m", false, "measureControlsComponent", "showTempoControls"],
    ["m", true, "measureControlsComponent", "showTimeSigControls"],
    ["b", false, "techniqueControlsComponent", "showBendControls"],
  ] as const)(
    "%s shift=%s opens the existing dialog",
    (key, shiftKey, component, method) => {
      const {
        callbacks,
        notationComponent,
        rootElement,
        uiComponent,
        renderFunc,
      } = createHarness();
      notationComponent.trackController.selectionCursor = {
        note: { hasTechnique: () => false, isTechniqueApplicable: () => true },
      };
      notationComponent.trackController.selectionAsBeats = [{}];
      rootElement.focus();
      const event = createKeyboardEvent(key, { shiftKey });
      callbacks.onKeyDown(event);
      expect(
        uiComponent.sideComponent[component][method]
      ).toHaveBeenCalledTimes(1);
      expect(renderFunc).not.toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
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
      const { callbacks, notationComponent, rootElement } = createHarness();
      const controller = notationComponent.trackController;
      const note = {
        hasTechnique: jest.fn(() => false),
        isTechniqueApplicable: jest.fn(() => true),
      };
      controller.selectionAsBeats = [{ notes: [note] }];
      rootElement.focus();
      for (const applied of [false, true]) {
        note.hasTechnique.mockReturnValue(applied);
        note.isTechniqueApplicable.mockReturnValue(!applied);
        const event = createKeyboardEvent(key, { shiftKey });
        callbacks.onKeyDown(event);
        expect(controller.setTechnique).toHaveBeenLastCalledWith(
          type,
          undefined
        );
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
      }
      expect(controller.setTechnique).toHaveBeenCalledTimes(2);
      note.hasTechnique.mockReturnValue(false);
      const disabled = createKeyboardEvent(key, { shiftKey });
      callbacks.onKeyDown(disabled);
      expect(disabled.preventDefault).not.toHaveBeenCalled();
      expect(controller.setTechnique).toHaveBeenCalledTimes(2);
    }
  );

  test.each([1, 2, 3, 4])("voice %s advances and wraps", (voice) => {
    const { callbacks, notationComponent, rootElement, renderFunc } =
      createHarness();
    notationComponent.trackController.activeVoiceNumber = voice;
    rootElement.focus();
    callbacks.onKeyDown(createKeyboardEvent("V", { shiftKey: true }));
    expect(
      notationComponent.trackController.setActiveVoiceNumber
    ).toHaveBeenCalledWith((voice % 4) + 1);
    expect(renderFunc).toHaveBeenCalledWith(RenderType.ActiveVoiceSelection);
  });

  test.each([
    ["c", "copy"],
    ["v", "paste"],
    ["z", "undo"],
    ["y", "redo"],
  ])("Ctrl+%s keeps its existing command", (key, method) => {
    const { callbacks, notationComponent, rootElement } = createHarness();
    rootElement.focus();
    const event = createKeyboardEvent(key, { ctrlKey: true });
    callbacks.onKeyDown(event);
    expect(notationComponent.trackController[method]).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  test.each([
    null,
    {
      hasTechnique: () => false,
      isTechniqueApplicable: () => false,
    },
  ])("empty or ineligible cursor notes reject techniques: %j", (note) => {
    const { callbacks, notationComponent, rootElement, uiComponent } =
      createHarness();
    notationComponent.trackController.selectionCursor = { note };
    rootElement.focus();
    for (const key of ["v", "p", "l", "s", "b", "h"]) {
      const event = createKeyboardEvent(key);
      callbacks.onKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
    expect(
      notationComponent.trackController.setTechnique
    ).not.toHaveBeenCalled();
    expect(
      uiComponent.sideComponent.techniqueControlsComponent.showBendControls
    ).not.toHaveBeenCalled();
  });

  test("ranges reject cursor-only dialogs, repeats, and dead notes", () => {
    const { callbacks, notationComponent, rootElement, renderFunc } =
      createHarness();
    notationComponent.trackController.selectionAsBeats = [{}, {}];
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
  });

  test.each([false, true])("repeat start toggles from %s", (enabled) => {
    const { callbacks, notationComponent, rootElement } = createHarness();
    const controller = notationComponent.trackController;
    controller.selectionCursor = {
      bar: { masterBar: { isRepeatStart: enabled } },
    };
    rootElement.focus();
    callbacks.onKeyDown(createKeyboardEvent("r"));
    expect(controller.setSelectedBarRepeatStatus).toHaveBeenCalledWith({
      status: BarRepeatStatus.Start,
      enabled: !enabled,
    });
  });

  test.each([
    { key: "+", shiftKey: false },
    { key: "+", shiftKey: true },
    { key: "=", shiftKey: false },
    { key: "-", shiftKey: false },
  ])("duration steps clamp; $key shifted=$shiftKey", ({ key, shiftKey }) => {
    const { callbacks, notationComponent, rootElement } = createHarness();
    const controller = notationComponent.trackController;
    const durations = [
      NoteDuration.SixtyFourth,
      NoteDuration.ThirtySecond,
      NoteDuration.Sixteenth,
      NoteDuration.Eighth,
      NoteDuration.Quarter,
      NoteDuration.Half,
      NoteDuration.Whole,
    ];
    rootElement.focus();
    durations.forEach((baseDuration, index) => {
      const active = { baseDuration };
      controller.selectionAsBeats = [
        active,
        { baseDuration: NoteDuration.Quarter },
      ];
      controller.selectionEndBeat = active;
      callbacks.onKeyDown(createKeyboardEvent(key, { shiftKey }));
      expect(controller.setDuration).toHaveBeenLastCalledWith(
        durations[
          key === "-"
            ? Math.max(index - 1, 0)
            : Math.min(index + 1, durations.length - 1)
        ]
      );
    });
  });

  test("dot cycles use the active end and preserve command undo/redo", () => {
    const { callbacks, notationComponent, rootElement } = createHarness();
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth, dots: 1 },
    ]);
    const controller = notationComponent.trackController;
    controller.selectionAsBeats = beats;
    controller.selectionEndBeat = beats[0];
    const commands: SetDotsCommand[] = [];
    controller.setDots.mockImplementation((dots: number) => {
      const command = new SetDotsCommand(beats, dots);
      command.execute();
      commands.push(command);
    });
    rootElement.focus();
    for (const expected of [1, 2, 0]) {
      callbacks.onKeyDown(createKeyboardEvent("."));
      expect(beats.map((beat) => beat.dots)).toEqual([expected, expected]);
    }
    commands.reverse().forEach((command) => command.undo());
    expect(beats.map((beat) => beat.dots)).toEqual([0, 1]);
    commands.reverse().forEach((command) => command.redo());
    expect(beats.map((beat) => beat.dots)).toEqual([0, 0]);
  });

  test.each([null, { normalCount: 5, tupletCount: 4 }])(
    "tuplet cycles normalize mixed ranges from active end %j",
    (initial) => {
      const { callbacks, notationComponent, rootElement } = createHarness();
      const duplet = { normalCount: 2, tupletCount: 1 };
      const triplet = { normalCount: 3, tupletCount: 2 };
      const { beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Eighth, tupletSettings: initial },
        { baseDuration: NoteDuration.Eighth, tupletSettings: duplet },
      ]);
      const controller = notationComponent.trackController;
      controller.selectionAsBeats = beats;
      controller.selectionEndBeat = beats[0];
      const commands: SetTupletCommand[] = [];
      controller.setSelectedBeatsTuplet.mockImplementation(
        (normalCount: number, tupletCount: number) => {
          const command = new SetTupletCommand(
            beats,
            normalCount === 1 ? null : { normalCount, tupletCount }
          );
          command.execute();
          commands.push(command);
        }
      );
      rootElement.focus();
      const expectedCycle =
        initial === null
          ? [duplet, triplet, null]
          : [null, duplet, triplet, null];
      for (const expected of expectedCycle) {
        callbacks.onKeyDown(createKeyboardEvent("t"));
        expect(beats.map((beat) => beat.tupletSettings)).toEqual([
          expected,
          expected,
        ]);
      }
      commands.reverse().forEach((command) => command.undo());
      expect(beats.map((beat) => beat.tupletSettings)).toEqual([
        initial,
        duplet,
      ]);
      commands.reverse().forEach((command) => command.redo());
      expect(beats.map((beat) => beat.tupletSettings)).toEqual([null, null]);
    }
  );

  test.each([
    ["x", { shiftKey: true }, "setSelectedBeatRest"],
    ["a", {}, "insertBeatAfterSelected"],
    ["a", { shiftKey: true }, "insertBeatBeforeSelected"],
    ["i", {}, "insertBarAfterSelected"],
    ["i", { shiftKey: true }, "insertBarBeforeSelected"],
    ["Delete", {}, "removeSelectedBeat"],
    ["Delete", { shiftKey: true }, "removeSelectedBar"],
  ] as const)("empty selection still routes %s %j", (key, options, method) => {
    const { callbacks, notationComponent, rootElement, renderFunc } =
      createHarness();
    rootElement.focus();
    const event = createKeyboardEvent(key, options);
    expect(() => callbacks.onKeyDown(event)).not.toThrow();
    expect(notationComponent.trackController[method]).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["+", {}],
    ["-", {}],
    [".", {}],
    ["t", {}],
  ] as const)("empty selection consumes no-op %s", (key, options) => {
    const { callbacks, rootElement, renderFunc } = createHarness();
    rootElement.focus();
    const event = createKeyboardEvent(key, options);
    expect(() => callbacks.onKeyDown(event)).not.toThrow();
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(renderFunc).not.toHaveBeenCalled();
  });

  test("empty selection opens the Shift+T dialog", () => {
    const { callbacks, rootElement, uiComponent, renderFunc } = createHarness();
    rootElement.focus();
    const event = createKeyboardEvent("t", { shiftKey: true });
    callbacks.onKeyDown(event);
    expect(
      uiComponent.sideComponent.noteControlsComponent.showTupletControls
    ).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(renderFunc).not.toHaveBeenCalled();
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
      const { callbacks, notationComponent, rootElement, renderFunc } =
        createHarness();
      const controller = notationComponent.trackController;
      controller.editingEnabled = editingEnabled;
      controller.extendSelectionByBeat.mockReturnValue(false);
      controller.extendSelectionByBar.mockReturnValue(false);
      rootElement.focus();
      for (const ctrlKey of [false, true]) {
        const event = createKeyboardEvent("ArrowRight", {
          ctrlKey,
          shiftKey: true,
        });
        callbacks.onKeyDown(event);
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
      }
      expect(controller.extendSelectionByBeat).toHaveBeenCalledTimes(1);
      expect(controller.extendSelectionByBar).toHaveBeenCalledTimes(1);
      expect(renderFunc).not.toHaveBeenCalled();
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
    const setFret = jest.spyOn(controller, "setSelectedNoteFret");
    rootElement.focus();
    const event = createKeyboardEvent("x");
    callbacks.onKeyDown(event);
    expect(beats[0].isRest()).toBe(true);
    expect(setFret).not.toHaveBeenCalled();
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
      expect(callbacks.clearFretEvent()).toBe(false);
    }
  );

  test("backspace prevents default when clearing a populated note", () => {
    const { callbacks, notationComponent, rootElement, renderFunc } =
      createHarness();
    notationComponent.trackController.selectionCursor = {
      note: { noteValue: NoteValue.C },
    };
    rootElement.focus();
    const event = createKeyboardEvent("Backspace");
    callbacks.onKeyDown(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenCalledWith(null);
  });

  test("direct command handlers dispatch expected editor actions", () => {
    const { callbacks, notationComponent, renderFunc } =
      createHarness(createRootElement());

    callbacks.copyEvent();
    expect(notationComponent.trackController.copy).toHaveBeenCalledTimes(1);
    expect(renderFunc).not.toHaveBeenCalled();

    callbacks.pasteEvent();
    expect(notationComponent.trackController.paste).toHaveBeenCalledTimes(1);

    callbacks.undoEvent();
    expect(notationComponent.trackController.undo).toHaveBeenCalledTimes(1);

    callbacks.redoEvent();
    expect(notationComponent.trackController.redo).toHaveBeenCalledTimes(1);

    callbacks.deleteSelectionEvent();
    expect(
      notationComponent.trackController.removeSelectedBeat
    ).toHaveBeenCalledTimes(1);

    callbacks.togglePlaybackEvent();
    expect(notationComponent.trackController.startPlayer).toHaveBeenCalledTimes(
      1
    );

    notationComponent.trackController.isPlaying = true;
    callbacks.togglePlaybackEvent();
    expect(notationComponent.trackController.stopPlayer).toHaveBeenCalledTimes(
      1
    );
    expect(renderFunc).toHaveBeenCalledTimes(6);
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

    callbacks.vibratoEvent();
    expect(
      notationComponent.trackController.setTechnique
    ).not.toHaveBeenCalled();

    notationComponent.trackController.selectionCursor = {
      note: {
        noteValue: NoteValue.C,
        hasTechnique: () => false,
        isTechniqueApplicable: () => true,
      },
    };
    notationComponent.trackController.hasSelectedNote = true;

    callbacks.vibratoEvent();
    callbacks.palmMuteEvent();
    callbacks.bendEvent();

    expect(
      notationComponent.trackController.setTechnique
    ).toHaveBeenNthCalledWith(1, GuitarTechniqueType.Vibrato, undefined);
    expect(
      notationComponent.trackController.setTechnique
    ).toHaveBeenNthCalledWith(2, GuitarTechniqueType.PalmMute, undefined);
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
    jest.spyOn(controller, "setSelectedNoteFret");
    const getTimeSpy = jest.spyOn(Date.prototype, "getTime");

    getTimeSpy.mockReturnValueOnce(1000);
    callbacks.fretInputEvent("1");
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenNthCalledWith(1, 1);

    getTimeSpy.mockReturnValueOnce(1100);
    callbacks.fretInputEvent("2");
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenNthCalledWith(2, 12);

    getTimeSpy.mockReturnValueOnce(1500);
    callbacks.fretInputEvent("3");
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenNthCalledWith(3, 3);

    callbacks.fretInputEvent("x");
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenCalledTimes(3);
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

  test("arrow keys and backspace update the selected note correctly", () => {
    const { callbacks, notationComponent, renderFunc } =
      createHarness(createRootElement());
    notationComponent.trackController.selectionCursor = {
      note: { noteValue: NoteValue.C },
    };
    notationComponent.trackController.hasSelectedNote = true;

    callbacks.moveSelectionEvent("arrowdown");
    callbacks.moveSelectionEvent("arrowup");
    callbacks.moveSelectionEvent("arrowleft");
    callbacks.moveSelectionEvent("arrowright");
    expect(
      notationComponent.trackController.moveSelectedNote
    ).toHaveBeenNthCalledWith(1, SelectedMoveDirection.Down);
    expect(
      notationComponent.trackController.moveSelectedNote
    ).toHaveBeenNthCalledWith(2, SelectedMoveDirection.Up);
    expect(
      notationComponent.trackController.moveSelectedNote
    ).toHaveBeenNthCalledWith(3, SelectedMoveDirection.Left);
    expect(
      notationComponent.trackController.moveSelectedNote
    ).toHaveBeenNthCalledWith(4, SelectedMoveDirection.Right);

    callbacks.clearFretEvent();
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenCalledWith(null);

    notationComponent.trackController.selectionCursor = {
      note: { noteValue: NoteValue.None },
    };
    callbacks.clearFretEvent();
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(5);
  });

  test("horizontal arrows move an active beat range", () => {
    const { callbacks, notationComponent, renderFunc } =
      createHarness(createRootElement());
    notationComponent.trackController.selectionAsBeats = [{}];

    callbacks.moveSelectionEvent("arrowleft");
    callbacks.moveSelectionEvent("arrowright");
    callbacks.moveSelectionEvent("arrowup");

    expect(
      notationComponent.trackController.moveSelectedNote
    ).toHaveBeenNthCalledWith(1, SelectedMoveDirection.Left);
    expect(
      notationComponent.trackController.moveSelectedNote
    ).toHaveBeenNthCalledWith(2, SelectedMoveDirection.Right);
    expect(
      notationComponent.trackController.moveSelectedNote
    ).toHaveBeenCalledTimes(3);
    expect(notationComponent.ensureSelectedNoteVisible).toHaveBeenCalledTimes(
      3
    );
    expect(renderFunc).toHaveBeenCalledTimes(3);
  });

  test("shift arrows extend selection by beat or bar", () => {
    const { callbacks, notationComponent, renderFunc, rootElement } =
      createHarness(createRootElement());
    callbacks.bind();
    rootElement.dispatch("focusin");

    callbacks.onKeyDown(createKeyboardEvent("ArrowLeft", { shiftKey: true }));
    callbacks.onKeyDown(createKeyboardEvent("ArrowRight", { shiftKey: true }));
    callbacks.onKeyDown(
      createKeyboardEvent("ArrowLeft", { ctrlKey: true, shiftKey: true })
    );
    callbacks.onKeyDown(
      createKeyboardEvent("ArrowRight", { ctrlKey: true, shiftKey: true })
    );

    expect(
      notationComponent.trackController.extendSelectionByBeat
    ).toHaveBeenNthCalledWith(1, SelectedMoveDirection.Left);
    expect(
      notationComponent.trackController.extendSelectionByBeat
    ).toHaveBeenNthCalledWith(2, SelectedMoveDirection.Right);
    expect(
      notationComponent.trackController.extendSelectionByBar
    ).toHaveBeenNthCalledWith(1, SelectedMoveDirection.Left);
    expect(
      notationComponent.trackController.extendSelectionByBar
    ).toHaveBeenNthCalledWith(2, SelectedMoveDirection.Right);
    expect(notationComponent.ensureSelectedNoteVisible).toHaveBeenCalledTimes(
      4
    );
    expect(renderFunc).toHaveBeenCalledTimes(4);

    callbacks.unbind();
  });

  test("shift arrows extend selection when editing is disabled", () => {
    const { callbacks, notationComponent, rootElement } =
      createHarness(createRootElement());
    notationComponent.trackController.editingEnabled = false;
    callbacks.bind();
    rootElement.dispatch("focusin");

    callbacks.onKeyDown(createKeyboardEvent("ArrowLeft", { shiftKey: true }));
    callbacks.onKeyDown(
      createKeyboardEvent("ArrowRight", { ctrlKey: true, shiftKey: true })
    );

    expect(
      notationComponent.trackController.extendSelectionByBeat
    ).toHaveBeenCalledWith(SelectedMoveDirection.Left);
    expect(
      notationComponent.trackController.extendSelectionByBar
    ).toHaveBeenCalledWith(SelectedMoveDirection.Right);

    callbacks.unbind();
  });

  test.each([true, false])(
    "ctrl arrows handle successful movement, editing=%s",
    (editing) => {
      const { callbacks, notationComponent, renderFunc, rootElement } =
        createHarness(createRootElement());
      notationComponent.trackController.editingEnabled = editing;
      notationComponent.trackController.moveSelectionByBar
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      callbacks.bind();
      rootElement.dispatch("focusin");

      const accepted = createKeyboardEvent("ArrowLeft", { ctrlKey: true });
      const rejected = createKeyboardEvent("ArrowRight", { ctrlKey: true });
      callbacks.onKeyDown(accepted);
      callbacks.onKeyDown(rejected);
      expect(accepted.preventDefault).toHaveBeenCalledTimes(1);
      expect(rejected.preventDefault).not.toHaveBeenCalled();

      expect(
        notationComponent.trackController.moveSelectionByBar
      ).toHaveBeenNthCalledWith(1, SelectedMoveDirection.Left);
      expect(
        notationComponent.trackController.moveSelectionByBar
      ).toHaveBeenNthCalledWith(2, SelectedMoveDirection.Right);
      expect(notationComponent.ensureSelectedNoteVisible).toHaveBeenCalledTimes(
        1
      );
      expect(renderFunc).toHaveBeenCalledTimes(1);

      callbacks.unbind();
    }
  );

  test.each([true, false])(
    "escape handles only active ranges, editing=%s",
    (editing) => {
      const { callbacks, notationComponent, renderFunc, rootElement } =
        createHarness(createRootElement());
      notationComponent.trackController.editingEnabled = editing;
      notationComponent.trackController.clearSelectionRange
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      callbacks.bind();
      rootElement.dispatch("focusin");

      const accepted = createKeyboardEvent("Escape");
      const rejected = createKeyboardEvent("Escape");
      callbacks.onKeyDown(accepted);
      callbacks.onKeyDown(rejected);
      expect(accepted.preventDefault).toHaveBeenCalledTimes(1);
      expect(rejected.preventDefault).not.toHaveBeenCalled();

      expect(
        notationComponent.trackController.clearSelectionRange
      ).toHaveBeenCalledTimes(2);
      expect(renderFunc).toHaveBeenCalledTimes(1);

      callbacks.unbind();
    }
  );

  test("onKeyDown routes handled keys and ignores function keys", () => {
    const { callbacks, rootElement, notationComponent } =
      createHarness(createRootElement());
    notationComponent.trackController.selectionCursor = {
      note: {
        noteValue: NoteValue.C,
        hasTechnique: () => false,
        isTechniqueApplicable: () => true,
      },
    };
    notationComponent.trackController.selectionAsBeats = [{}];
    callbacks.bind();
    rootElement.dispatch("focusin");
    const copySpy = jest.spyOn(callbacks, "copyEvent");
    const bendSpy = jest.spyOn(callbacks, "bendEvent");
    const deleteSpy = jest.spyOn(callbacks, "deleteSelectionEvent");
    const fretSpy = jest.spyOn(callbacks, "fretInputEvent");
    const moveSpy = jest.spyOn(callbacks, "moveSelectionEvent");
    const clearFretSpy = jest.spyOn(callbacks, "clearFretEvent");
    const playbackSpy = jest.spyOn(callbacks, "togglePlaybackEvent");

    const ctrlC = createKeyboardEvent("C", { ctrlKey: true });
    callbacks.onKeyDown(ctrlC);
    expect(copySpy).toHaveBeenCalledTimes(1);
    expect(ctrlC.preventDefault).toHaveBeenCalledTimes(1);

    const bend = createKeyboardEvent("B");
    callbacks.onKeyDown(bend);
    expect(bendSpy).toHaveBeenCalledTimes(1);
    expect(bend.preventDefault).toHaveBeenCalledTimes(1);

    const deleteEvent = createKeyboardEvent("Delete");
    callbacks.onKeyDown(deleteEvent);
    expect(deleteSpy).toHaveBeenCalledTimes(1);

    callbacks.onKeyDown(createKeyboardEvent("7"));
    expect(fretSpy).toHaveBeenCalledWith("7");

    callbacks.onKeyDown(createKeyboardEvent("ArrowLeft"));
    expect(moveSpy).toHaveBeenCalledWith("arrowleft");

    callbacks.onKeyDown(createKeyboardEvent("Backspace"));
    expect(clearFretSpy).toHaveBeenCalledTimes(1);

    callbacks.onKeyDown(createKeyboardEvent(" "));
    expect(playbackSpy).toHaveBeenCalledTimes(1);

    const functionKey = createKeyboardEvent("F2");
    callbacks.onKeyDown(functionKey);
    expect(functionKey.preventDefault).not.toHaveBeenCalled();

    const tab = createKeyboardEvent("Tab");
    callbacks.onKeyDown(tab);
    expect(tab.preventDefault).not.toHaveBeenCalled();

    callbacks.unbind();
  });

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
