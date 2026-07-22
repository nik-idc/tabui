import { EditorKeyboardDefCallbacks } from "../../src/notation/input/editor-keyboard-callbacks";
import { GuitarTechniqueType, NoteValue } from "../../src/notation/model";
import { SelectedMoveDirection } from "../../src/notation/controller";

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
      selectedNote: undefined as any,
    },
  };
  const notationComponent = {
    trackController: {
      undo: jest.fn(),
      redo: jest.fn(),
      startPlayer: jest.fn(),
      stopPlayer: jest.fn(),
      isPlaying: false,
      copy: jest.fn(),
      paste: jest.fn(),
      deleteSelectedBeats: jest.fn(),
      setTechnique: jest.fn(),
      setSelectedNoteFret: jest.fn(),
      moveSelectedNote: jest.fn(),
      selectedNote: undefined as any,
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

    callbacks.ctrlCEvent(createKeyboardEvent("c"));
    expect(notationComponent.trackController.copy).toHaveBeenCalledTimes(1);
    expect(renderFunc).not.toHaveBeenCalled();

    callbacks.ctrlVEvent(createKeyboardEvent("v"));
    expect(notationComponent.trackController.paste).toHaveBeenCalledTimes(1);

    callbacks.ctrlZEvent(createKeyboardEvent("z"));
    expect(notationComponent.trackController.undo).toHaveBeenCalledTimes(1);

    callbacks.ctrlYEvent(createKeyboardEvent("y"));
    expect(notationComponent.trackController.redo).toHaveBeenCalledTimes(1);

    callbacks.deleteEvent(createKeyboardEvent("Delete"));
    expect(
      notationComponent.trackController.deleteSelectedBeats
    ).toHaveBeenCalledTimes(1);

    callbacks.spaceEvent(createKeyboardEvent(" "));
    expect(notationComponent.trackController.startPlayer).toHaveBeenCalledTimes(
      1
    );

    notationComponent.trackController.isPlaying = true;
    callbacks.spaceEvent(createKeyboardEvent(" "));
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

  test("technique shortcuts respect selection and bend shortcut opens bend controls", () => {
    const { callbacks, uiComponent, notationComponent, renderFunc } =
      createHarness(createRootElement());

    callbacks.setTechnique(GuitarTechniqueType.Vibrato);
    expect(
      notationComponent.trackController.setTechnique
    ).not.toHaveBeenCalled();

    notationComponent.trackController.selectedNote = {
      note: { noteValue: NoteValue.C },
    };
    notationComponent.trackController.hasSelectedNote = true;

    callbacks.shiftVEvent(createKeyboardEvent("V", { shiftKey: true }));
    callbacks.shiftPEvent(createKeyboardEvent("P", { shiftKey: true }));
    callbacks.shiftBEvent(createKeyboardEvent("B", { shiftKey: true }));

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
    notationComponent.trackController.selectedNote = {
      note: { noteValue: NoteValue.C },
    };
    notationComponent.trackController.hasSelectedNote = true;
    const getTimeSpy = jest.spyOn(Date.prototype, "getTime");

    getTimeSpy.mockReturnValueOnce(1000);
    callbacks.onNumberDown("1");
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenNthCalledWith(1, 1);

    getTimeSpy.mockReturnValueOnce(1100);
    callbacks.onNumberDown("2");
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenNthCalledWith(2, 12);

    getTimeSpy.mockReturnValueOnce(1500);
    callbacks.onNumberDown("3");
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenNthCalledWith(3, 3);

    callbacks.onNumberDown("x");
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenCalledTimes(3);
    expect(renderFunc).toHaveBeenCalledTimes(3);
  });

  test("arrow keys and backspace update the selected note correctly", () => {
    const { callbacks, notationComponent, renderFunc } =
      createHarness(createRootElement());
    notationComponent.trackController.selectedNote = {
      note: { noteValue: NoteValue.C },
    };
    notationComponent.trackController.hasSelectedNote = true;

    callbacks.onArrowDown("arrowdown");
    callbacks.onArrowDown("arrowup");
    callbacks.onArrowDown("arrowleft");
    callbacks.onArrowDown("arrowright");
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

    callbacks.onBackspacePress();
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenCalledWith(null);

    notationComponent.trackController.selectedNote = {
      note: { noteValue: NoteValue.None },
    };
    callbacks.onBackspacePress();
    expect(
      notationComponent.trackController.setSelectedNoteFret
    ).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(5);
  });

  test("onKeyDown routes handled keys and ignores function keys", () => {
    const { callbacks, rootElement } = createHarness(createRootElement());
    callbacks.bind();
    rootElement.dispatch("focusin");
    const ctrlCSpy = jest.spyOn(callbacks, "ctrlCEvent");
    const shiftBSpy = jest.spyOn(callbacks, "shiftBEvent");
    const deleteSpy = jest.spyOn(callbacks, "deleteEvent");
    const numberSpy = jest.spyOn(callbacks, "onNumberDown");
    const arrowSpy = jest.spyOn(callbacks, "onArrowDown");
    const backspaceSpy = jest.spyOn(callbacks, "onBackspacePress");
    const spaceSpy = jest.spyOn(callbacks, "spaceEvent");

    const ctrlC = createKeyboardEvent("C", { ctrlKey: true });
    callbacks.onKeyDown(ctrlC);
    expect(ctrlCSpy).toHaveBeenCalledTimes(1);
    expect(ctrlC.preventDefault).toHaveBeenCalledTimes(1);

    const shiftB = createKeyboardEvent("B", { shiftKey: true });
    callbacks.onKeyDown(shiftB);
    expect(shiftBSpy).toHaveBeenCalledTimes(1);
    expect(shiftB.preventDefault).toHaveBeenCalledTimes(1);

    const deleteEvent = createKeyboardEvent("Delete");
    callbacks.onKeyDown(deleteEvent);
    expect(deleteSpy).toHaveBeenCalledTimes(1);

    callbacks.onKeyDown(createKeyboardEvent("7"));
    expect(numberSpy).toHaveBeenCalledWith("7");

    callbacks.onKeyDown(createKeyboardEvent("ArrowLeft"));
    expect(arrowSpy).toHaveBeenCalledWith("arrowleft");

    callbacks.onKeyDown(createKeyboardEvent("Backspace"));
    expect(backspaceSpy).toHaveBeenCalledTimes(1);

    callbacks.onKeyDown(createKeyboardEvent(" "));
    expect(spaceSpy).toHaveBeenCalledTimes(1);

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
