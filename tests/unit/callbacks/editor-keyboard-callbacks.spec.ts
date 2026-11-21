import { JSDOM } from "jsdom";
import { EditorKeyboardDefCallbacks } from "../../../src/notation/input/editor-keyboard-callbacks";
import {
  AccentType,
  BeatGuitarTechniqueType,
  DEFAULT_MASTER_BAR,
  Dynamic,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  NoteValue,
  StrokeDirection,
} from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { SelectedMoveDirection } from "../../../src/notation/controller";
import { withNotationDialog } from "./notation-dialog-fixture";
import { required } from "../required";
import { serializeScore } from "../../../src/notation/model/serialization";
import { ScorePlayer } from "../../../src/player/score-player";
import { installTransportAudio } from "../player/transport-audio";

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

function createRootElement(): HTMLElement {
  const root = document.createElement("div");
  root.tabIndex = 0;
  document.body.append(root);
  return root;
}

class FakeClipboardData {
  private readonly _values = new Map<string, string>();

  public getData(type: string): string {
    return this._values.get(type) ?? "";
  }

  public setData(type: string, value: string): void {
    this._values.set(type, value);
  }

  public clearData(): void {
    this._values.clear();
  }
}

function clipboardEvent(
  type: "copy" | "cut" | "paste",
  data: FakeClipboardData | null
): Event {
  const event = new window.Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: data });
  return event;
}

function createHarness(rootElement: HTMLElement = createRootElement()) {
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
      get canEdit() {
        return this.editingEnabled && !this.isPlaying;
      },
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
      noteControlsComponent: {
        showTupletControls: jest.fn(),
        announceDynamic: jest.fn(),
      },
      measureControlsComponent: {
        showRepeatCountControls: jest.fn(),
        showTempoControls: jest.fn(),
        showTimeSigControls: jest.fn(),
      },
      techniqueControlsComponent: {
        showBendControls: jest.fn(),
        showStrokeControls: jest.fn(),
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
  const domGlobals = [
    "window",
    "document",
    "HTMLElement",
    "Element",
    "Node",
    "Event",
    "KeyboardEvent",
  ] as const;
  let dom: JSDOM;
  let previousGlobals: (PropertyDescriptor | undefined)[];

  beforeEach(() => {
    dom = new JSDOM();
    previousGlobals = domGlobals.map((k) =>
      Object.getOwnPropertyDescriptor(globalThis, k)
    );
    for (const key of domGlobals) {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        writable: true,
        value: dom.window[key],
      });
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
    for (const [i, k] of domGlobals.entries()) {
      const descriptor = previousGlobals[i];
      if (descriptor) {
        Object.defineProperty(globalThis, k, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, k);
      }
    }
    dom.window.close();
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
    ["k", false, GuitarTechniqueType.Tap],
    ["c", false, GuitarTechniqueType.Accent],
    ["c", true, GuitarTechniqueType.Accent],
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
          if (note instanceof GuitarNote) {
            note.setFret(null);
          }
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

  test("select all includes unrendered bars", () => {
    const { callbacks, notationComponent, rootElement, renderFunc } =
      createHarness();
    const { track, score, staff, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats[0].makeRest();
    for (let i = 0; i < 30; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    controller.trackElement.update({
      lineRange: { startLineIndex: 0, endLineIndex: 0 },
    });
    const lastBeat = required(staff.bars[30].getVoiceBar(1)).beats[0];
    expect(controller.trackElement.getBeatElement(lastBeat)).toBeUndefined();
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.extendSelectionByBeat(SelectedMoveDirection.Right);
    const before = serializeScore(score);
    rootElement.focus();

    const event = createKeyboardEvent("A", { ctrlKey: true });
    callbacks.onKeyDown(event);

    expect(controller.selectionBeats).toHaveLength(32);
    expect(controller.selectionBeats[0]).toBe(beats[0]);
    expect(controller.selectionEndBeat).toBe(lastBeat);
    expect(controller.selectionCursor).toBeUndefined();
    expect(controller.hasSelectionAnchor).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(1);
    expect(serializeScore(score)).toEqual(before);
    expect(controller.trackElement.getBeatElement(lastBeat)).toBeUndefined();
    controller.clearSelectionRange();
    expect(controller.selectionCursor?.beat).toBe(beats[0]);
  });

  test.each([
    [false, false, false],
    [true, false, true],
    [true, true, true],
  ])(
    "clipboard history (uppercase=%s, Meta=%s, Shift+Z redo=%s)",
    (uppercase, metaKey, shiftRedo) => {
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

      const clipboard = required(controller.copy());
      expect(renderFunc).not.toHaveBeenCalled();
      expect(beats[0].notes?.[0]).toEqual(expect.objectContaining({ fret: 9 }));
      controller.moveSelectedNote(SelectedMoveDirection.Right);
      expect(controller.paste(clipboard)).toBe(true);
      expect(beats[1].notes?.[0]).toEqual(expect.objectContaining({ fret: 9 }));

      for (const [key, fret] of [
        ["z", 5],
        [shiftRedo ? "z" : "y", 9],
      ] as const) {
        renderFunc.mockClear();
        const event = createKeyboardEvent(uppercase ? key.toUpperCase() : key, {
          ctrlKey: !metaKey,
          metaKey,
          shiftKey: fret === 9 && shiftRedo,
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

  test("C and Shift+C switch the accent kind, then remove it", () => {
    const { callbacks, notationComponent, rootElement } = createHarness();
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const note = beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note");
    }
    note.setFret(5);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    rootElement.focus();
    // Undo restores copied notes, so read the live slot each time.
    const kind = () =>
      (beats[0].notes?.[0] as GuitarNote).techniques.find(
        (t) => t.type === GuitarTechniqueType.Accent
      )?.accentOptions?.kind;

    for (const [shiftKey, expected] of [
      [false, AccentType.Normal],
      [true, AccentType.Heavy],
      [false, AccentType.Normal],
      [false, undefined],
    ] as const) {
      const event = createKeyboardEvent("c", { shiftKey });
      callbacks.onKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(kind()).toBe(expected);
    }
    controller.undo();
    expect(kind()).toBe(AccentType.Normal);
  });

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
      if (state === "rest") {
        controller.setSelectedBeatRest();
      }
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
      const duplet = { normalCount: 2, tupletCount: 3 };
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
      for (let i = 0; i < expectedCycle.length; i++) {
        controller.undo();
      }
      expect(beats.map((beat) => beat.tupletSettings)).toEqual([
        duplet,
        initial,
        null,
      ]);
      for (let i = 0; i < expectedCycle.length; i++) {
        controller.redo();
      }
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
    { metaKey: true, shiftKey: true },
    { metaKey: true, ctrlKey: true },
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
        "ArrowLeft",
        "ArrowRight",
        " ",
      ]) {
        const command = options.metaKey && !options.ctrlKey;
        const allowed =
          (command && key === "a" && !options.shiftKey) ||
          (key === "z" && (command || (options.ctrlKey && !options.metaKey)));
        if (allowed || (key.startsWith("Arrow") && !options.metaKey)) {
          continue;
        }
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

  test("notation playback consumes held Space without toggling again", () => {
    withKeyboardFixture(({ callbacks, root }) => {
      const toggle = jest
        .spyOn(callbacks, "togglePlaybackEvent")
        .mockImplementation(() => {});
      callbacks.bind();
      root.focus();
      const first = new window.KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
        cancelable: true,
      });
      root.dispatchEvent(first);
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
    "%s leaves native toolbar keys available with explicit playback override",
    (key) => {
      withKeyboardFixture(({ callbacks, root }) => {
        const button = document.createElement("button");
        root.append(button);
        const toggle = jest
          .spyOn(callbacks, "togglePlaybackEvent")
          .mockImplementation(() => {});
        callbacks.bind();
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

  test("Space on an editor slider toggles playback once and leaves other keys alone", () => {
    withKeyboardFixture(({ callbacks, root }) => {
      const slider = document.createElement("input");
      slider.type = "range";
      const dialog = document.createElement("dialog");
      const dialogSlider = document.createElement("input");
      dialogSlider.type = "range";
      dialog.append(dialogSlider);
      const outsideSlider = document.createElement("input");
      outsideSlider.type = "range";
      root.append(slider, dialog);
      document.body.append(outsideSlider);
      const toggle = jest
        .spyOn(callbacks, "togglePlaybackEvent")
        .mockImplementation(() => {});
      callbacks.bind();
      const press = (target: HTMLElement, init: KeyboardEventInit) => {
        const event = new window.KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          ...init,
        });
        target.dispatchEvent(event);
        return event.defaultPrevented;
      };

      expect(press(slider, { key: " " })).toBe(true);
      expect(toggle).toHaveBeenCalledTimes(1);
      // A held key is consumed but does not toggle again.
      expect(press(slider, { key: " ", repeat: true })).toBe(true);
      expect(toggle).toHaveBeenCalledTimes(1);

      // Modified Space, arrows, and sliders in dialogs or other apps keep
      // their own behavior.
      expect(press(slider, { key: " ", ctrlKey: true })).toBe(false);
      expect(press(slider, { key: "ArrowRight" })).toBe(false);
      expect(press(dialogSlider, { key: " " })).toBe(false);
      expect(press(outsideSlider, { key: " " })).toBe(false);
      expect(toggle).toHaveBeenCalledTimes(1);
      outsideSlider.remove();
    });
  });

  test("dialog events leave native keys available without enabling toolbar playback", () => {
    withKeyboardFixture(({ callbacks, controller, root }) => {
      const button = document.createElement("button");
      const dialog = document.createElement("dialog");
      const dialogButton = document.createElement("button");
      dialog.append(dialogButton);
      root.append(button, dialog);
      const toggle = jest
        .spyOn(callbacks, "togglePlaybackEvent")
        .mockImplementation(() => {});
      callbacks.bind();
      dialog.setAttribute("open", "");
      dialogButton.focus();
      controller.setSelectedNoteFret(5);
      const selected = controller.selectionCursor;
      for (const [key, ctrlKey, shiftKey] of [
        ["Tab", false, false],
        ["ArrowRight", false, false],
        [" ", false, false],
        ["a", true, false],
        ["a", true, true],
      ] as const) {
        const event = new window.KeyboardEvent("keydown", {
          key,
          ctrlKey,
          shiftKey,
          bubbles: true,
          cancelable: true,
        });
        dialogButton.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
        expect(controller.selectionCursor).toBe(selected);
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
      expect(space.defaultPrevented).toBe(false);
      expect(toggle).not.toHaveBeenCalled();
    });
  });

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
          if (target === document.body) {
            (document.activeElement as HTMLElement).blur();
          } else {
            target.focus();
          }
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
          if (target !== root) {
            const selected = controller.selectionCursor;
            const selectAll = new window.KeyboardEvent("keydown", {
              key: "a",
              ctrlKey: true,
              bubbles: true,
              cancelable: true,
            });
            target.dispatchEvent(selectAll);
            expect(selectAll.defaultPrevented).toBe(false);
            expect(controller.selectionCursor).toBe(selected);
          }
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

  test("native cut is ignored during playback preparation or playback", async () => {
    jest.useFakeTimers();
    const audio = installTransportAudio();
    const { track } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const player = new ScorePlayer(track.score, track);
    try {
      const { callbacks, notationComponent, rootElement, renderFunc } =
        createHarness();
      const controller = new TrackController(
        track,
        TEST_LAYOUT_DIMENSIONS,
        player
      );
      notationComponent.trackController = controller;
      controller.setSelectedNoteFret(7);
      const before = serializeScore(track.score);
      callbacks.bind();
      rootElement.focus();
      const start = player.start();
      for (const state of ["starting", "playing"]) {
        expect(player.playbackState).toBe(state);
        const data = new FakeClipboardData();
        data.setData("text/plain", "unchanged");
        const cut = clipboardEvent("cut", data);
        document.body.dispatchEvent(cut);
        expect(cut.defaultPrevented).toBe(false);
        expect(data.getData("text/plain")).toBe("unchanged");
        expect(serializeScore(track.score)).toEqual(before);
        await start;
      }
      callbacks.unbind();
      expect(renderFunc).not.toHaveBeenCalled();
    } finally {
      player.dispose();
      audio.restore();
      jest.useRealTimers();
    }
  });

  test.each([false, true])(
    "native cut copies before deleting beats and keeps bars (range=%s)",
    (range) => {
      withKeyboardFixture(({ callbacks, controller, root, beats }) => {
        controller.setSelectedNoteFret(7);
        controller.setDuration(NoteDuration.Eighth);
        if (range) {
          controller.extendSelectionByBeat(SelectedMoveDirection.Right);
          controller.extendSelectionByBeat(SelectedMoveDirection.Right);
        }
        const score = controller.track.score;
        const voiceBar = required(
          controller.track.staves[0].bars[0].getVoiceBar(1)
        );
        const bars = [...score.masterBars];
        const before = serializeScore(score);
        callbacks.bind();
        callbacks.bind();
        root.focus();
        const data = new FakeClipboardData();
        const cut = clipboardEvent("cut", data);
        document.body.dispatchEvent(cut);
        expect(cut.defaultPrevented).toBe(true);
        const text = data.getData("text/plain");
        expect(JSON.parse(text)).toMatchObject(
          range
            ? {
                kind: "beats",
                beats: [
                  {
                    duration: "eighth",
                    dots: 0,
                    notes: [
                      expect.objectContaining({ fret: 7 }),
                      null,
                      null,
                      null,
                      null,
                      null,
                    ],
                  },
                  { duration: "quarter", dots: 0 },
                ],
              }
            : { kind: "note", fret: 7 }
        );
        if (range) {
          expect(voiceBar.beats).toHaveLength(1);
          expect(voiceBar.beats[0]).toEqual(
            expect.objectContaining({ notes: null })
          );
        } else {
          expect(voiceBar.beats).toEqual([beats[1]]);
        }
        expect(score.masterBars).toEqual(bars);
        const after = serializeScore(score);
        controller.undo();
        expect(serializeScore(score)).toEqual(before);
        controller.redo();
        expect(serializeScore(score)).toEqual(after);
        expect(controller.paste(text)).toBe(true);
        expect(controller.selectionAsBeats[0].notes?.[0]).toEqual(
          expect.objectContaining({ fret: 7 })
        );
        if (range) {
          expect(controller.selectionAsBeats[0].baseDuration).toBe(
            NoteDuration.Eighth
          );
        }
      });
    }
  );

  test("native clipboard uses the focused viewport and stops after disposal", () => {
    withKeyboardFixture(({ callbacks, controller, root, note, beats }) => {
      controller.setSelectedNoteFret(7);
      callbacks.bind();
      root.focus();
      const copiedData = new FakeClipboardData();
      const copy = clipboardEvent("copy", copiedData);
      document.body.dispatchEvent(copy);
      expect(copy.defaultPrevented).toBe(true);
      expect(copiedData.getData("text/plain")).not.toBe("");

      const input = document.createElement("input");
      root.append(input);
      input.focus();
      const before = serializeScore(controller.track.score);
      for (const type of ["paste", "cut"] as const) {
        const ignored = clipboardEvent(type, copiedData);
        document.body.dispatchEvent(ignored);
        expect(ignored.defaultPrevented).toBe(false);
      }
      root.focus();
      for (const guard of [
        "prevented",
        "no data",
        "dialog",
        "empty",
      ] as const) {
        const data = new FakeClipboardData();
        data.setData("text/plain", "unchanged");
        const cut = clipboardEvent("cut", guard === "no data" ? null : data);
        if (guard === "prevented") {
          cut.preventDefault();
        }
        if (guard === "dialog") {
          note.showTupletControls();
          root.focus();
        }
        if (guard === "empty") {
          controller.selectBeat(
            required(controller.trackElement.getBeatElement(beats[0]))
          );
          controller.clearSelection();
        }
        document.body.dispatchEvent(cut);
        expect(cut.defaultPrevented).toBe(guard === "prevented");
        expect(data.getData("text/plain")).toBe("unchanged");
        expect(serializeScore(controller.track.score)).toEqual(before);
        if (guard === "dialog") {
          note.tupletComponent.dialog.close();
        }
      }

      callbacks.unbind();
      root.focus();
      controller.selectBeat(
        required(controller.trackElement.getBeatElement(beats[0]))
      );
      expect(controller.copy()).toBeDefined();
      for (const type of ["paste", "cut"] as const) {
        const afterDispose = clipboardEvent(type, copiedData);
        document.body.dispatchEvent(afterDispose);
        expect(afterDispose.defaultPrevented).toBe(false);
      }
      expect(serializeScore(controller.track.score)).toEqual(before);
    });
  });

  describe("clipboard shortcuts without clipboard events (WebKit)", () => {
    const blocked = new DOMException("Denied", "NotAllowedError");
    let previousNavigator: PropertyDescriptor | undefined;
    // Unbound after each test, so no listener outlives it.
    let callbacks: EditorKeyboardDefCallbacks | undefined;

    /** Mocks the Clipboard API and binds callbacks with notation focused. */
    function setup(clipboard: Partial<Clipboard>) {
      previousNavigator = Object.getOwnPropertyDescriptor(
        globalThis,
        "navigator"
      );
      Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: { clipboard },
      });
      const harness = createHarness();
      harness.callbacks.bind();
      callbacks = harness.callbacks;
      harness.uiComponent.announce = jest.fn();
      harness.notationComponent.trackController.copy.mockReturnValue("beats");
      harness.notationComponent.trackController.paste.mockReturnValue(true);
      harness.rootElement.focus();
      return harness;
    }

    /** Lets the async clipboard calls finish. */
    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    afterEach(() => {
      callbacks?.unbind();
      if (previousNavigator) {
        Object.defineProperty(globalThis, "navigator", previousNavigator);
      } else {
        Reflect.deleteProperty(globalThis, "navigator");
      }
    });

    test.each([
      ["c", "copy"],
      ["x", "cut"],
      ["v", "paste"],
    ] as const)(
      "leaves Ctrl+%s to the %s event when the browser fires it",
      async (key, type) => {
        const clipboard = { writeText: jest.fn(), readText: jest.fn() };
        const { callbacks } = setup(clipboard);
        const event = createKeyboardEvent(key, { ctrlKey: true });
        callbacks.onKeyDown(event);
        document.body.dispatchEvent(
          clipboardEvent(type, new FakeClipboardData())
        );
        await flush();
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(clipboard.writeText).not.toHaveBeenCalled();
        expect(clipboard.readText).not.toHaveBeenCalled();
      }
    );

    test.each([{ ctrlKey: true }, { metaKey: true }])(
      "copies with the Clipboard API (%o)",
      async (modifier) => {
        const writeText = jest.fn().mockResolvedValue(undefined);
        const { callbacks } = setup({ writeText });
        const event = createKeyboardEvent("c", modifier);
        callbacks.onKeyDown(event);
        await flush();
        expect(writeText).toHaveBeenCalledWith("beats");
      }
    );

    test("cuts only after the write succeeds", async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      const { callbacks, notationComponent, renderFunc } = setup({
        writeText,
      });
      const controller = notationComponent.trackController;
      callbacks.onKeyDown(createKeyboardEvent("x", { ctrlKey: true }));
      await flush();
      expect(writeText).toHaveBeenCalledWith("beats");
      expect(controller.removeSelectedBeat).toHaveBeenCalled();
      expect(renderFunc).toHaveBeenCalled();
    });

    test("keeps the beats and announces it when the browser blocks a cut", async () => {
      const writeText = jest.fn().mockRejectedValue(blocked);
      const { callbacks, notationComponent, uiComponent } = setup({
        writeText,
      });
      callbacks.onKeyDown(createKeyboardEvent("x", { ctrlKey: true }));
      await flush();
      expect(
        notationComponent.trackController.removeSelectedBeat
      ).not.toHaveBeenCalled();
      expect(uiComponent.announce).toHaveBeenCalledWith(
        "The browser blocked clipboard access."
      );
    });

    test("pastes with the Clipboard API", async () => {
      const readText = jest.fn().mockResolvedValue("copied");
      const { callbacks, notationComponent, renderFunc } = setup({
        readText,
      });
      callbacks.onKeyDown(createKeyboardEvent("v", { ctrlKey: true }));
      await flush();
      expect(notationComponent.trackController.paste).toHaveBeenCalledWith(
        "copied"
      );
      expect(renderFunc).toHaveBeenCalled();
    });

    test.each(["x", "v"])(
      "ignores Ctrl+%s when editing is off",
      async (key) => {
        const clipboard = {
          writeText: jest.fn().mockResolvedValue(undefined),
          readText: jest.fn().mockResolvedValue("copied"),
        };
        const { callbacks, notationComponent } = setup(clipboard);
        notationComponent.trackController.editingEnabled = false;
        const event = createKeyboardEvent(key, { ctrlKey: true });
        callbacks.onKeyDown(event);
        await flush();
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(clipboard.writeText).not.toHaveBeenCalled();
        expect(clipboard.readText).not.toHaveBeenCalled();
      }
    );
  });

  test("view-only blocks mutations without changing score, selection, or history", () => {
    withKeyboardFixture((fixture) => {
      const { callbacks, controller, root, host, render, beats } = fixture;
      controller.setSelectedNoteFret(5);
      controller.setSelectedNoteFret(7);
      controller.undo();
      controller.setEditingEnabled(false);
      const before = serializeScore(controller.track.score);
      const selected = controller.selectionCursor?.note;
      root.focus();
      callbacks.bind();
      const data = new FakeClipboardData();
      data.setData("text/plain", "unchanged");
      const cut = clipboardEvent("cut", data);
      document.body.dispatchEvent(cut);
      expect(cut.defaultPrevented).toBe(false);
      expect(data.getData("text/plain")).toBe("unchanged");
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
      const metaSelectAll = new window.KeyboardEvent("keydown", {
        key: "a",
        metaKey: true,
        cancelable: true,
      });
      callbacks.onKeyDown(metaSelectAll);
      expect(metaSelectAll.defaultPrevented).toBe(true);
      expect(serializeScore(controller.track.score)).toEqual(before);
      expect(controller.selectionBeats).toEqual(beats);
      expect(controller.selectionCursor).toBeUndefined();
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
    withKeyboardFixture(({ controller, root, beats }) => {
      controller.setSelectedNoteFret(5);
      controller.setEditingEnabled(false);
      const clipboard = required(controller.copy());
      root.focus();
      controller.setEditingEnabled(true);
      controller.moveSelectedNote(SelectedMoveDirection.Right);
      expect(controller.paste(clipboard)).toBe(true);
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
    const duplet = { normalCount: 2, tupletCount: 3 };
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

  test("Alt staff shortcuts match the physical key and leave other Alt keys alone", () => {
    const { callbacks, notationComponent, rootElement } = createHarness();
    const { track } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    rootElement.focus();
    const press = (key: string, options: KeyboardEventInit) => {
      const event = createKeyboardEvent(key, options);
      callbacks.onKeyDown(event);
      return event.preventDefault.mock.calls.length > 0;
    };

    // AltGr arrives as Ctrl+Alt, and Option changes event.key on macOS.
    expect(press("v", { altKey: true, code: "KeyV" })).toBe(false);
    expect(press("N", { altKey: true, shiftKey: true, code: "KeyN" })).toBe(
      false
    );
    expect(press("n", { altKey: true, ctrlKey: true, code: "KeyN" })).toBe(
      false
    );
    expect(track.staves).toHaveLength(1);
    expect(press("Delete", { altKey: true, code: "Delete" })).toBe(false);

    expect(press("˜", { altKey: true, code: "KeyN" })).toBe(true);
    expect(track.staves).toHaveLength(2);
    expect(controller.selectionCursor?.bar.staff).toBe(track.staves[1]);
    expect(press("ArrowUp", { altKey: true, code: "ArrowUp" })).toBe(true);
    expect(controller.selectionCursor?.bar.staff).toBe(track.staves[0]);
    expect(press("ArrowUp", { altKey: true, code: "ArrowUp" })).toBe(false);

    controller.setEditingEnabled(false);
    expect(press("n", { altKey: true, code: "KeyN" })).toBe(false);
    expect(press("Delete", { altKey: true, code: "Delete" })).toBe(false);
    expect(track.staves).toHaveLength(2);
    expect(press("ArrowDown", { altKey: true, code: "ArrowDown" })).toBe(true);
    expect(controller.selectionCursor?.bar.staff).toBe(track.staves[1]);
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

  test("D and U toggle strokes, and Shift+D opens stroke settings", () => {
    const { callbacks, uiComponent, notationComponent, rootElement } =
      createHarness();
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    rootElement.focus();
    const direction = () =>
      beats[0].getBeatTechnique(BeatGuitarTechniqueType.Stroke)?.options
        .direction;
    const press = (key: string, shiftKey = false) => {
      const event = createKeyboardEvent(key, { shiftKey });
      callbacks.onKeyDown(event);
      return event.preventDefault;
    };

    expect(press("d")).toHaveBeenCalledTimes(1);
    expect(direction()).toBe(StrokeDirection.Down);
    press("u");
    expect(direction()).toBe(StrokeDirection.Up);
    press("u");
    expect(direction()).toBeUndefined();

    expect(press("d", true)).toHaveBeenCalledTimes(1);
    expect(
      uiComponent.sideComponent.techniqueControlsComponent.showStrokeControls
    ).toHaveBeenCalledTimes(1);

    beats[0].makeRest();
    expect(press("d")).not.toHaveBeenCalled();
    expect(press("d", true)).not.toHaveBeenCalled();
    expect(direction()).toBeUndefined();
  });

  test("O, N, [ and ] work during playback and in view-only mode, then speak the state", () => {
    const { callbacks, uiComponent, notationComponent, rootElement } =
      createHarness();
    const controller = notationComponent.trackController;
    controller.isPlaying = true;
    controller.editingEnabled = false;
    controller.isLooped = false;
    controller.metronomeEnabled = false;
    controller.pitchShiftSemitones = 12;
    controller.toggleLoop = jest.fn(() => {
      controller.isLooped = !controller.isLooped;
    });
    controller.setMetronomeEnabled = jest.fn((enabled: boolean) => {
      controller.metronomeEnabled = enabled;
    });
    controller.shiftPlaybackPitch = jest.fn((delta: number) => {
      const value = controller.pitchShiftSemitones + delta;
      if (value > 12) {
        return false;
      }
      controller.pitchShiftSemitones = value;
      return true;
    });
    uiComponent.announce = jest.fn();
    rootElement.focus();
    const press = (key: string, options: KeyboardEventInit = {}) => {
      const event = createKeyboardEvent(key, options);
      callbacks.onKeyDown(event);
      return event.preventDefault;
    };

    expect(press("o")).toHaveBeenCalledTimes(1);
    expect(press("n")).toHaveBeenCalledTimes(1);
    expect(press("[", { code: "BracketLeft" })).toHaveBeenCalledTimes(1);
    // Another layout types a different character on the same physical key.
    expect(press("+", { code: "BracketRight" })).toHaveBeenCalledTimes(1);
    // At the limit the value stays, but the key still speaks it.
    expect(press("]", { code: "BracketRight" })).toHaveBeenCalledTimes(1);
    expect(uiComponent.announce.mock.calls).toEqual([
      ["Loop on"],
      ["Metronome on"],
      ["Playback pitch +11 semitones"],
      ["Playback pitch +12 semitones"],
      ["Playback pitch +12 semitones"],
    ]);

    expect(press("o", { ctrlKey: true })).not.toHaveBeenCalled();
    expect(press("n", { shiftKey: true })).not.toHaveBeenCalled();
    // Alt+N adds a staff; it must not toggle the metronome.
    expect(press("n", { altKey: true, code: "KeyN" })).not.toHaveBeenCalled();
    expect(controller.isLooped).toBe(true);
    expect(controller.metronomeEnabled).toBe(true);
  });

  test("Ctrl+Home and Ctrl+End jump to the first and last bar, also during playback", () => {
    const { callbacks, notationComponent, rootElement, renderFunc } =
      createHarness();
    const controller = notationComponent.trackController;
    controller.selectFirstBar = jest.fn();
    controller.selectLastBar = jest.fn();
    rootElement.focus();
    const press = (key: string, options: KeyboardEventInit = {}) => {
      const event = createKeyboardEvent(key, options);
      callbacks.onKeyDown(event);
      return event.preventDefault;
    };

    expect(press("Home", { ctrlKey: true })).toHaveBeenCalledTimes(1);
    expect(press("End", { ctrlKey: true })).toHaveBeenCalledTimes(1);
    expect(controller.selectFirstBar).toHaveBeenCalledTimes(1);
    expect(controller.selectLastBar).toHaveBeenCalledTimes(1);
    expect(notationComponent.ensureSelectedNoteVisible).toHaveBeenCalledTimes(
      2
    );
    expect(renderFunc).toHaveBeenCalledTimes(2);

    expect(press("Home")).not.toHaveBeenCalled();
    expect(
      press("End", { ctrlKey: true, shiftKey: true })
    ).not.toHaveBeenCalled();
    // The controller seeks during playback, like the First bar button.
    controller.isPlaying = true;
    expect(press("Home", { ctrlKey: true })).toHaveBeenCalledTimes(1);
    expect(controller.selectFirstBar).toHaveBeenCalledTimes(2);
  });

  test("Shift+Up and Shift+Down shift the pitch only when it is allowed", () => {
    const { callbacks, notationComponent, rootElement, renderFunc } =
      createHarness();
    const controller = notationComponent.trackController;
    controller.canShiftSelectedPitch = jest.fn(
      (semitones: number) => semitones > 0
    );
    controller.shiftSelectedPitch = jest.fn();
    rootElement.focus();
    const press = (key: string, options: KeyboardEventInit = {}) => {
      const event = createKeyboardEvent(key, options);
      callbacks.onKeyDown(event);
      return event.preventDefault;
    };

    expect(press("ArrowUp", { shiftKey: true })).toHaveBeenCalledTimes(1);
    expect(controller.shiftSelectedPitch).toHaveBeenCalledWith(1);
    expect(renderFunc).toHaveBeenCalledTimes(1);
    expect(press("ArrowDown", { shiftKey: true })).not.toHaveBeenCalled();

    controller.editingEnabled = false;
    expect(press("ArrowUp", { shiftKey: true })).not.toHaveBeenCalled();
    expect(controller.shiftSelectedPitch).toHaveBeenCalledTimes(1);
  });

  test("> and < shift the dynamic with either Shift state, then speak it", () => {
    const { callbacks, uiComponent, notationComponent, rootElement } =
      createHarness();
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    rootElement.focus();
    const announceDynamic =
      uiComponent.sideComponent.noteControlsComponent.announceDynamic;
    const press = (key: string, options: KeyboardEventInit = {}) => {
      const event = createKeyboardEvent(key, options);
      callbacks.onKeyDown(event);
      return event.preventDefault;
    };

    expect(press(">")).toHaveBeenCalledTimes(1);
    expect(beats[0].dynamic).toBe(Dynamic.Forte);
    expect(press("<", { shiftKey: true })).toHaveBeenCalledTimes(1);
    expect(beats[0].dynamic).toBe(Dynamic.MezzoForte);
    expect(announceDynamic).toHaveBeenCalledTimes(2);

    expect(press(">", { ctrlKey: true })).not.toHaveBeenCalled();
    expect(beats[0].dynamic).toBe(Dynamic.MezzoForte);
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
      for (const beat of beats) {
        beat.baseDuration = NoteDuration.Half;
      }
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
