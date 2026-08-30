import { EditorKeyboardDefCallbacks } from "../../../src/notation/input/editor-keyboard-callbacks";
import { GuitarTechniqueType, NoteValue } from "../../../src/notation/model";
import { SelectedMoveDirection } from "../../../src/notation/controller";

function createKeyboardEvent(
  key: string,
  options: { ctrlKey?: boolean; shiftKey?: boolean } = {}
) {
  return {
    key,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    preventDefault: jest.fn(),
  } as any;
}

type FakeRootElement = HTMLElement & {
  dispatch(event: string): void;
};

function createRootElement(): FakeRootElement {
  const listeners = new Map<string, Set<(...args: any[]) => void>>();
  return {
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
      setTechnique: jest.fn(),
      setSelectedNoteFret: jest.fn(),
      moveSelectedNote: jest.fn(),
      selectionCursor: undefined as any,
      selectionAsBeats: [] as any[],
      hasSelectedNote: false,
      trackControllerEditor,
    },
  } as any;
  const uiComponent = {
    sideComponent: {
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
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  });

  afterEach(() => {
    (globalThis as any).document = originalDocument;
    jest.restoreAllMocks();
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
      notationComponent.trackController.deleteSelectedBeats
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
    expect(notationComponent.trackController.startPlayer).toHaveBeenCalledTimes(
      1
    );
    expect(renderFunc).toHaveBeenCalledTimes(2);
  });

  test("technique shortcuts respect selection and bend shortcut opens bend controls", () => {
    const { callbacks, uiComponent, notationComponent, renderFunc } =
      createHarness(createRootElement());

    callbacks.vibratoEvent();
    expect(
      notationComponent.trackController.setTechnique
    ).not.toHaveBeenCalled();

    notationComponent.trackController.selectionCursor = {
      note: { noteValue: NoteValue.C },
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
    notationComponent.trackController.selectionCursor = {
      note: { noteValue: NoteValue.C },
    };
    notationComponent.trackController.hasSelectedNote = true;
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

  test("onKeyDown routes handled keys and ignores function keys", () => {
    const { callbacks, rootElement } = createHarness(createRootElement());
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

    const shiftB = createKeyboardEvent("B", { shiftKey: true });
    callbacks.onKeyDown(shiftB);
    expect(bendSpy).toHaveBeenCalledTimes(1);
    expect(shiftB.preventDefault).toHaveBeenCalledTimes(1);

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
    expect(rootA.removeEventListener).toHaveBeenCalledWith(
      "focusin",
      expect.any(Function)
    );
    expect(rootB.removeEventListener).toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function)
    );
  });
});
