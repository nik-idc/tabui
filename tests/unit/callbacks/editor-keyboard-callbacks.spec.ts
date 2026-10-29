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

/** Exercises keyboard ownership with native focus and the real score controller. */
function withKeyboardFixture(
  action: (
    fixture: Parameters<Parameters<typeof withNotationDialog>[0]>[0] & {
      callbacks: EditorKeyboardDefCallbacks;
      render: jest.Mock;
    }
  ) => void
) {
  withNotationDialog((fixture) => {
    const render = jest.fn();
    const callbacks = new EditorKeyboardDefCallbacks(
      fixture.ui as ConstructorParameters<typeof EditorKeyboardDefCallbacks>[0],
      fixture.notation,
      render,
      fixture.root
    );
    try {
      action({ ...fixture, callbacks, render });
    } finally {
      callbacks.unbind();
    }
  });
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
    ["l", false, GuitarTechniqueType.Legato],
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
      for (const [index, beat] of beats.entries()) {
        for (const note of beat.notes ?? []) {
          if (!(note instanceof GuitarNote)) {
            throw Error("Expected guitar note");
          }
          note.setFret([5, 7, 9][index]);
        }
      }
      const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
      notationComponent.trackController = controller;
      controller.extendSelectionByBeat(SelectedMoveDirection.Right);
      controller.extendSelectionByBeat(SelectedMoveDirection.Right);
      expect(controller.selectionAsBeats).toEqual(beats.slice(0, 2));
      rootElement.focus();
      for (const applied of [true, false]) {
        const event = createKeyboardEvent(key, { shiftKey });
        callbacks.onKeyDown(event);
        expect(beats.map((b) => b.notes?.[0].hasTechnique(type))).toEqual([
          applied,
          applied,
          false,
        ]);
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
      }
      controller.undo();
      expect(beats.map((b) => b.notes?.[0].hasTechnique(type))).toEqual([
        true,
        true,
        false,
      ]);
      controller.redo();
      expect(beats.map((b) => b.notes?.[0].hasTechnique(type))).toEqual([
        false,
        false,
        false,
      ]);
      expect(renderFunc).toHaveBeenCalledTimes(2);
      for (const beat of beats) {
        for (const note of beat.notes ?? []) {
          if (note instanceof GuitarNote) note.setFret(null);
        }
      }
      const disabled = createKeyboardEvent(key, { shiftKey });
      callbacks.onKeyDown(disabled);
      expect(disabled.preventDefault).not.toHaveBeenCalled();
      expect(beats.map((b) => b.notes?.[0].techniques)).toEqual([[], [], []]);
      expect(renderFunc).toHaveBeenCalledTimes(2);
    }
  );

  test.each([
    { shiftKey: false, distance: 1 },
    { shiftKey: true, distance: 3 },
  ])(
    "Tie shortcut with Shift=$shiftKey ties to a source $distance beats back and supports undo",
    ({ shiftKey, distance }) => {
      const { callbacks, notationComponent, rootElement } = createHarness();
      const { track, beats } = createBarWithBeats(
        Array.from({ length: distance + 1 }, () => ({
          baseDuration: NoteDuration.Quarter,
        }))
      );
      const first = beats[0].notes?.[0];
      if (!(first instanceof GuitarNote)) {
        throw Error("Expected guitar note");
      }
      first.setFret(5);
      beats[distance].makeRest();
      const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
      notationComponent.trackController = controller;
      for (let i = 0; i < distance; i++) {
        controller.moveSelectedNote(SelectedMoveDirection.Right);
      }
      rootElement.focus();
      if (shiftKey) {
        const singleBeat = createKeyboardEvent("j");
        callbacks.onKeyDown(singleBeat);
        expect(beats[distance].isRest()).toBe(true);
        expect(singleBeat.preventDefault).not.toHaveBeenCalled();
      }
      const event = createKeyboardEvent("j", { shiftKey });
      callbacks.onKeyDown(event);
      expect(controller.selectionCursor?.note).toEqual(
        expect.objectContaining({ fret: 5 })
      );
      expect(
        controller.selectionCursor?.note?.hasTechnique(GuitarTechniqueType.Tie)
      ).toBe(true);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      controller.undo();
      expect(beats[distance].isRest()).toBe(true);
      expect(
        (beats[1].notes?.[0] as GuitarNote | undefined)?.fret ?? null
      ).toBe(null);
    }
  );

  test("Let Ring shortcut marks a supported empty slot but not a rest", () => {
    const { callbacks, notationComponent, rootElement } = createHarness();
    const { track, beats } = createBarWithBeats(
      Array.from({ length: 3 }, () => ({ baseDuration: NoteDuration.Quarter }))
    );
    const source = required(beats[0].notes)[0] as GuitarNote;
    source.setFret(5);
    source.setTechnique(GuitarTechniqueType.LetRing);
    beats[2].makeRest();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    rootElement.focus();
    callbacks.onKeyDown(createKeyboardEvent("l", { shiftKey: true }));
    expect(controller.hasSelectedTechnique(GuitarTechniqueType.LetRing)).toBe(
      true
    );
    expect((required(beats[1].notes)[0] as GuitarNote).fret).toBeNull();
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    callbacks.onKeyDown(createKeyboardEvent("l", { shiftKey: true }));
    expect(beats[2].isRest()).toBe(true);
    expect(source.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
  });

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

  test("ranges allow tempo and meter dialogs but reject cursor-only actions", () => {
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
    controller.extendSelectionByBeat(SelectedMoveDirection.Right);
    expect(controller.selectionAsBeats).toEqual(beats);
    rootElement.focus();
    for (const key of ["x", "b", "r"]) {
      const event = createKeyboardEvent(key);
      callbacks.onKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
    for (const key of ["r"]) {
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
    for (const shiftKey of [false, true]) {
      const event = createKeyboardEvent("m", { shiftKey });
      callbacks.onKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    }
    expect(
      uiComponent.sideComponent.measureControlsComponent.showTempoControls
    ).toHaveBeenCalledTimes(1);
    expect(
      uiComponent.sideComponent.measureControlsComponent.showTimeSigControls
    ).toHaveBeenCalledTimes(1);
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
    withKeyboardFixture(({ callbacks, controller, root, render, beats }) => {
      controller.selectBeat(
        required(controller.trackElement.getBeatElement(beats[0]))
      );
      controller.clearSelection();
      expect(controller.selectionAsBeats).toEqual([]);
      const before = serializeScore(controller.track.score);
      root.focus();
      const event = new window.KeyboardEvent("keydown", {
        key,
        ...options,
        cancelable: true,
      });
      callbacks.onKeyDown(event);
      expect(event.defaultPrevented).toBe(false);
      expect(serializeScore(controller.track.score)).toEqual(before);
      expect(render).not.toHaveBeenCalled();
    });
  });

  test.each([
    { altKey: true },
    { metaKey: true },
    { isComposing: true },
    { keyCode: 229 },
    { ctrlKey: true, shiftKey: true },
  ])("rejects invalid modifiers %j", (options) => {
    withKeyboardFixture(({ callbacks, controller, root, host, render }) => {
      controller.setSelectedNoteFret(5);
      const before = serializeScore(controller.track.score);
      const selected = controller.selectionCursor?.note;
      root.focus();
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
        const event = new window.KeyboardEvent("keydown", {
          key,
          ...options,
          cancelable: true,
        });
        callbacks.onKeyDown(event);
        expect(event.defaultPrevented).toBe(false);
        expect(serializeScore(controller.track.score)).toEqual(before);
        expect(controller.selectionCursor?.note).toBe(selected);
        expect(host.querySelector("[open]")).toBeNull();
      }
      expect(render).not.toHaveBeenCalled();
    });
  });

  test("toolbar playback restores notation focus and consumes held Space without toggling again", () => {
    withKeyboardFixture(({ callbacks, root }) => {
      const button = document.createElement("button");
      root.append(button);
      const toggle = jest
        .spyOn(callbacks, "togglePlaybackEvent")
        .mockImplementation(() => {
          button.disabled = true;
        });
      callbacks.bind();
      button.dispatchEvent(new window.Event("pointerdown", { bubbles: true }));
      button.focus();
      const first = new window.KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
        cancelable: true,
      });
      button.dispatchEvent(first);
      expect(first.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(root);
      expect(toggle).toHaveBeenCalledTimes(1);

      const repeat = new window.KeyboardEvent("keydown", {
        key: " ",
        repeat: true,
        bubbles: true,
        cancelable: true,
      });
      root.dispatchEvent(repeat);
      expect(repeat.defaultPrevented).toBe(true);
      expect(toggle).toHaveBeenCalledTimes(1);

      const second = new window.KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
        cancelable: true,
      });
      root.dispatchEvent(second);
      expect(second.defaultPrevented).toBe(true);
      expect(toggle).toHaveBeenCalledTimes(2);
      callbacks.unbind();
      root.dispatchEvent(second);
      expect(toggle).toHaveBeenCalledTimes(2);
    });
  });

  test.each(["Tab", "ArrowRight"])(
    "%s restores native button keys after a pointer click",
    (key) => {
      withKeyboardFixture(({ callbacks, root }) => {
        const button = document.createElement("button");
        root.append(button);
        const toggle = jest
          .spyOn(callbacks, "togglePlaybackEvent")
          .mockImplementation(() => {});
        callbacks.bind();
        button.dispatchEvent(
          new window.Event("pointerdown", { bubbles: true })
        );
        button.focus();
        button.dispatchEvent(
          new window.KeyboardEvent("keydown", { key, bubbles: true })
        );
        for (const key of [" ", "Enter"]) {
          const event = new window.KeyboardEvent("keydown", {
            key,
            bubbles: true,
            cancelable: true,
          });
          button.dispatchEvent(event);
          expect(event.defaultPrevented).toBe(false);
        }
        expect(toggle).not.toHaveBeenCalled();
        const override = new window.KeyboardEvent("keydown", {
          key: " ",
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        });
        button.dispatchEvent(override);
        expect(override.defaultPrevented).toBe(true);
        expect(toggle).toHaveBeenCalledTimes(1);
        expect(document.activeElement).toBe(root);
      });
    }
  );

  test.each([false, true])(
    "dialog events preserve pointer mode=%s and never trigger playback",
    (pointerMode) => {
      withKeyboardFixture(({ callbacks, root }) => {
        const button = document.createElement("button");
        const dialog = document.createElement("dialog");
        const dialogButton = document.createElement("button");
        dialog.append(dialogButton);
        root.append(button, dialog);
        const toggle = jest
          .spyOn(callbacks, "togglePlaybackEvent")
          .mockImplementation(() => {});
        callbacks.bind();
        if (pointerMode)
          button.dispatchEvent(
            new window.Event("pointerdown", { bubbles: true })
          );
        dialog.setAttribute("open", "");
        dialogButton.focus();
        dialogButton.dispatchEvent(
          new window.Event("pointerdown", { bubbles: true })
        );
        for (const key of ["Tab", "ArrowRight", " "]) {
          const event = new window.KeyboardEvent("keydown", {
            key,
            shiftKey: true,
            bubbles: true,
            cancelable: true,
          });
          dialogButton.dispatchEvent(event);
          expect(event.defaultPrevented).toBe(false);
        }
        expect(toggle).not.toHaveBeenCalled();
        dialog.removeAttribute("open");
        button.focus();
        const space = new window.KeyboardEvent("keydown", {
          key: " ",
          bubbles: true,
          cancelable: true,
        });
        button.dispatchEvent(space);
        expect(space.defaultPrevented).toBe(pointerMode);
        expect(toggle).toHaveBeenCalledTimes(pointerMode ? 1 : 0);
      });
    }
  );

  test("playback shortcuts leave fields, outside buttons, and unsupported modifiers alone", () => {
    withKeyboardFixture(({ callbacks, root }) => {
      const toggle = jest
        .spyOn(callbacks, "togglePlaybackEvent")
        .mockImplementation(() => {});
      callbacks.bind();
      for (const tag of ["input", "select", "textarea", "button"]) {
        const control = document.createElement(tag);
        (tag === "button" ? document.body : root).append(control);
        control.focus();
        for (const shiftKey of [false, true]) {
          const event = new window.KeyboardEvent("keydown", {
            key: " ",
            shiftKey,
            bubbles: true,
            cancelable: true,
          });
          control.dispatchEvent(event);
          expect(event.defaultPrevented).toBe(false);
        }
      }
      const button = document.createElement("button");
      root.append(button);
      button.dispatchEvent(new window.Event("pointerdown", { bubbles: true }));
      button.focus();
      for (const options of [
        { ctrlKey: true },
        { altKey: true },
        { metaKey: true },
        { isComposing: true },
      ]) {
        const event = new window.KeyboardEvent("keydown", {
          key: " ",
          bubbles: true,
          cancelable: true,
          ...options,
        });
        button.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
      }
      expect(toggle).not.toHaveBeenCalled();
    });
  });

  test("unknown keys, shifted aliases, and consumed events keep defaults", () => {
    withKeyboardFixture(({ callbacks, controller, root, host, render }) => {
      controller.setSelectedNoteFret(5);
      const before = serializeScore(controller.track.score);
      root.focus();
      for (const key of ["q", "=", "_", "p", "b", "s", ".", "-", "1"]) {
        const event = new window.KeyboardEvent("keydown", {
          key,
          shiftKey: true,
          cancelable: true,
        });
        callbacks.onKeyDown(event);
        expect(event.defaultPrevented).toBe(false);
      }
      const event = new window.KeyboardEvent("keydown", {
        key: "a",
        cancelable: true,
      });
      event.preventDefault();
      callbacks.onKeyDown(event);
      expect(event.defaultPrevented).toBe(true);
      expect(serializeScore(controller.track.score)).toEqual(before);
      expect(host.querySelector("[open]")).toBeNull();
      expect(render).not.toHaveBeenCalled();
    });
  });

  test("only the notation viewport owns shortcuts, not its shell or descendants", () => {
    withKeyboardFixture(({ controller, root, notation, ui }) => {
      const shell = document.createElement("div");
      shell.tabIndex = 0;
      root.before(shell);
      shell.append(root);
      const sibling = document.createElement("button");
      shell.append(sibling);
      const descendant = document.createElement("input");
      root.append(descendant);
      const callbacks = new EditorKeyboardDefCallbacks(
        ui as ConstructorParameters<typeof EditorKeyboardDefCallbacks>[0],
        notation,
        () => {},
        shell
      );
      callbacks.bind();
      try {
        for (const target of [shell, sibling, descendant, document.body]) {
          if (target === document.body)
            (document.activeElement as HTMLElement).blur();
          else target.focus();
          expect(document.activeElement).toBe(target);
          const event = new window.KeyboardEvent("keydown", {
            key: "5",
            bubbles: true,
            cancelable: true,
          });
          target.dispatchEvent(event);
          expect(event.defaultPrevented).toBe(false);
          expect(controller.selectionCursor?.note).toEqual(
            expect.objectContaining({ fret: null })
          );
        }
        root.focus();
        const accepted = new window.KeyboardEvent("keydown", {
          key: "5",
          bubbles: true,
          cancelable: true,
        });
        root.dispatchEvent(accepted);
        expect(accepted.defaultPrevented).toBe(true);
        expect(controller.selectionCursor?.note).toEqual(
          expect.objectContaining({ fret: 5 })
        );
      } finally {
        callbacks.unbind();
      }
    });
  });

  test("view-only blocks mutations without changing score, selection, or history", () => {
    withKeyboardFixture(({ callbacks, controller, root, host, render }) => {
      controller.setSelectedNoteFret(5);
      controller.setSelectedNoteFret(7);
      controller.undo();
      controller.copy();
      controller.setEditingEnabled(false);
      const before = serializeScore(controller.track.score);
      const selected = controller.selectionCursor?.note;
      root.focus();
      for (const key of [
        "7",
        "Backspace",
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
          const event = new window.KeyboardEvent("keydown", {
            key,
            shiftKey,
            cancelable: true,
          });
          callbacks.onKeyDown(event);
          expect(event.defaultPrevented).toBe(false);
          expect(serializeScore(controller.track.score)).toEqual(before);
          expect(controller.selectionCursor?.note).toBe(selected);
          expect(host.querySelector("[open]")).toBeNull();
        }
      }
      for (const key of ["v", "z", "y"]) {
        const event = new window.KeyboardEvent("keydown", {
          key,
          ctrlKey: true,
          cancelable: true,
        });
        callbacks.onKeyDown(event);
        expect(event.defaultPrevented).toBe(false);
      }
      expect(serializeScore(controller.track.score)).toEqual(before);
      expect(render).not.toHaveBeenCalled();
      controller.setEditingEnabled(true);
      controller.redo();
      expect(controller.selectionCursor?.note).toEqual(
        expect.objectContaining({ fret: 7 })
      );
      controller.undo();
      controller.undo();
      expect(controller.selectionCursor?.note).toEqual(
        expect.objectContaining({ fret: null })
      );
    });
  });

  test("view-only copy preserves the selected value for a later editable paste", () => {
    withKeyboardFixture(({ callbacks, controller, root, beats }) => {
      controller.setSelectedNoteFret(5);
      controller.setEditingEnabled(false);
      root.focus();
      const event = new window.KeyboardEvent("keydown", {
        key: "C",
        ctrlKey: true,
        cancelable: true,
      });
      callbacks.onKeyDown(event);
      expect(event.defaultPrevented).toBe(true);
      controller.setEditingEnabled(true);
      controller.moveSelectedNote(SelectedMoveDirection.Right);
      controller.paste();
      expect(beats.map((b) => b.notes?.[0])).toEqual([
        expect.objectContaining({ fret: 5 }),
        expect.objectContaining({ fret: 5 }),
      ]);
    });
  });

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
          expect(controller.selectionBeats).toEqual([beats[0]]);
          expect(controller.selectionCursor).toBeUndefined();
        }
        expect(render).toHaveBeenCalledTimes(1);
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
    expect(beats[0].notes?.[1]).toEqual(expect.objectContaining({ fret: 9 }));

    const up = createKeyboardEvent("ArrowUp");
    callbacks.onKeyDown(up);
    expect(controller.selectionCursor?.note).toBe(beats[0].notes?.[0]);
    expect(up.preventDefault).toHaveBeenCalledTimes(1);

    const clearUpper = createKeyboardEvent("Backspace");
    callbacks.onKeyDown(clearUpper);
    expect(beats[0].notes?.[0]).toEqual(
      expect.objectContaining({ fret: null })
    );
    expect(beats[0].notes?.[1]).toEqual(expect.objectContaining({ fret: 9 }));
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
      expect(controller.selectionBeats).toEqual([beats[0]]);

      callbacks.onKeyDown(
        new window.KeyboardEvent("keydown", { key: "ArrowLeft" })
      );
      expect(controller.selectionBeats).toEqual([]);
      expect(controller.selectionCursor?.beat).toBe(beats[0]);
      expect(render).toHaveBeenCalledTimes(1);
      expect(render).toHaveBeenLastCalledWith();

      controller.extendSelectionByBeat(SelectedMoveDirection.Right);
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
        ["ArrowRight", false, [beats[0]]],
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
        const expectedRenderCount = key === "ArrowLeft" && !ctrlKey ? 0 : 1;
        expect(render).toHaveBeenCalledTimes(expectedRenderCount);
        if (expectedRenderCount !== 0) {
          expect(render).toHaveBeenLastCalledWith();
        }
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
      expect(controller.selectionBeats).toEqual([beats[1]]);
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
      expect(render).toHaveBeenCalledTimes(1);
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

  test("bind and unbind handle each key once and stop handling after cleanup", () => {
    withKeyboardFixture(({ callbacks, controller, root }) => {
      root.focus();
      callbacks.bind();
      callbacks.bind();
      root.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: ".", bubbles: true })
      );
      expect(controller.selectionCursor?.beat.dots).toBe(1);
      callbacks.unbind();
      callbacks.unbind();
      root.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: ".", bubbles: true })
      );
      expect(controller.selectionCursor?.beat.dots).toBe(1);
      controller.undo();
      expect(controller.selectionCursor?.beat.dots).toBe(0);
    });
  });

  test("restores editor ownership after temporary keyboard capture", () => {
    withKeyboardFixture(({ callbacks, controller, root }) => {
      callbacks.bind();
      root.focus();
      callbacks.unbind();
      root.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: ".", bubbles: true })
      );
      expect(controller.selectionCursor?.beat.dots).toBe(0);
      callbacks.bind();
      root.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: ".", bubbles: true })
      );
      expect(controller.selectionCursor?.beat.dots).toBe(1);
    });
  });

  test("rebind does not steal ownership when focus is outside the editor", () => {
    withKeyboardFixture(({ callbacks, controller, root }) => {
      const outside = document.createElement("input");
      document.body.append(outside);
      callbacks.bind();
      root.focus();
      callbacks.unbind();
      outside.focus();
      callbacks.bind();
      const event = new window.KeyboardEvent("keydown", {
        key: "5",
        bubbles: true,
        cancelable: true,
      });
      outside.dispatchEvent(event);
      expect(document.activeElement).toBe(outside);
      expect(event.defaultPrevented).toBe(false);
      expect(controller.selectionCursor?.note).toEqual(
        expect.objectContaining({ fret: null })
      );
      root.focus();
      root.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "5", bubbles: true })
      );
      expect(controller.selectionCursor?.note).toEqual(
        expect.objectContaining({ fret: 5 })
      );
    });
  });

  test("global keyboard input is scoped to the active editor root", () => {
    withKeyboardFixture(({ callbacks, controller, root, ui, notation }) => {
      const otherRoot = document.createElement("div");
      otherRoot.tabIndex = 0;
      document.body.append(otherRoot);
      const other = new TrackController(
        createBarWithBeats([{ baseDuration: NoteDuration.Quarter }]).track,
        TEST_LAYOUT_DIMENSIONS
      );
      const otherCallbacks = new EditorKeyboardDefCallbacks(
        ui as ConstructorParameters<typeof EditorKeyboardDefCallbacks>[0],
        {
          ...notation,
          rootDiv: otherRoot,
          trackController: other,
        } as typeof notation,
        () => {},
        otherRoot
      );
      callbacks.bind();
      otherCallbacks.bind();
      try {
        document.dispatchEvent(
          new window.KeyboardEvent("keydown", { key: "." })
        );
        expect(controller.selectionCursor?.beat.dots).toBe(0);
        expect(other.selectionCursor?.beat.dots).toBe(0);
        root.focus();
        root.dispatchEvent(
          new window.KeyboardEvent("keydown", { key: ".", bubbles: true })
        );
        expect(controller.selectionCursor?.beat.dots).toBe(1);
        expect(other.selectionCursor?.beat.dots).toBe(0);
        otherRoot.focus();
        otherRoot.dispatchEvent(
          new window.KeyboardEvent("keydown", { key: ".", bubbles: true })
        );
        expect(controller.selectionCursor?.beat.dots).toBe(1);
        expect(other.selectionCursor?.beat.dots).toBe(1);
        callbacks.unbind();
        otherCallbacks.unbind();
        otherRoot.dispatchEvent(
          new window.KeyboardEvent("keydown", { key: ".", bubbles: true })
        );
        expect(other.selectionCursor?.beat.dots).toBe(1);
      } finally {
        otherCallbacks.unbind();
      }
    });
  });
});
