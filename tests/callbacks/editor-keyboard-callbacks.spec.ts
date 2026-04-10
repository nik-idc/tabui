import { EditorKeyboardDefCallbacks } from "../../src/callbacks/editor/editor-keyboard-callbacks";
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

function createHarness() {
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
    renderFunc
  );

  return {
    callbacks,
    uiComponent,
    notationComponent,
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
    const { callbacks, notationComponent, trackControllerEditor, renderFunc } =
      createHarness();

    callbacks.ctrlCEvent(createKeyboardEvent("c"));
    expect(trackControllerEditor.copy).toHaveBeenCalledTimes(1);
    expect(renderFunc).not.toHaveBeenCalled();

    callbacks.ctrlVEvent(createKeyboardEvent("v"));
    expect(trackControllerEditor.paste).toHaveBeenCalledTimes(1);

    callbacks.ctrlZEvent(createKeyboardEvent("z"));
    expect(notationComponent.trackController.undo).toHaveBeenCalledTimes(1);

    callbacks.ctrlYEvent(createKeyboardEvent("y"));
    expect(notationComponent.trackController.redo).toHaveBeenCalledTimes(1);

    callbacks.deleteEvent(createKeyboardEvent("Delete"));
    expect(trackControllerEditor.deleteSelectedBeats).toHaveBeenCalledTimes(1);

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

  test("technique shortcuts respect selection and bend shortcut opens bend controls", () => {
    const { callbacks, uiComponent, trackControllerEditor, renderFunc } =
      createHarness();

    callbacks.setTechnique(GuitarTechniqueType.Vibrato);
    expect(trackControllerEditor.setTechnique).not.toHaveBeenCalled();

    trackControllerEditor.selectionManager.selectedNote = {
      note: { noteValue: NoteValue.C },
    };

    callbacks.shiftVEvent(createKeyboardEvent("V", { shiftKey: true }));
    callbacks.shiftPEvent(createKeyboardEvent("P", { shiftKey: true }));
    callbacks.shiftBEvent(createKeyboardEvent("B", { shiftKey: true }));

    expect(trackControllerEditor.setTechnique).toHaveBeenNthCalledWith(
      1,
      GuitarTechniqueType.Vibrato,
      undefined
    );
    expect(trackControllerEditor.setTechnique).toHaveBeenNthCalledWith(
      2,
      GuitarTechniqueType.PalmMute,
      undefined
    );
    expect(
      uiComponent.sideComponent.techniqueControlsComponent.showBendControls
    ).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(2);
  });

  test("number entry combines only within the configured time epsilon", () => {
    const { callbacks, trackControllerEditor, renderFunc } = createHarness();
    trackControllerEditor.selectionManager.selectedNote = {
      note: { noteValue: NoteValue.C },
    };
    const getTimeSpy = jest.spyOn(Date.prototype, "getTime");

    getTimeSpy.mockReturnValueOnce(1000);
    callbacks.onNumberDown("1");
    expect(trackControllerEditor.setSelectedNoteFret).toHaveBeenNthCalledWith(
      1,
      1
    );

    getTimeSpy.mockReturnValueOnce(1100);
    callbacks.onNumberDown("2");
    expect(trackControllerEditor.setSelectedNoteFret).toHaveBeenNthCalledWith(
      2,
      12
    );

    getTimeSpy.mockReturnValueOnce(1500);
    callbacks.onNumberDown("3");
    expect(trackControllerEditor.setSelectedNoteFret).toHaveBeenNthCalledWith(
      3,
      3
    );

    callbacks.onNumberDown("x");
    expect(trackControllerEditor.setSelectedNoteFret).toHaveBeenCalledTimes(3);
    expect(renderFunc).toHaveBeenCalledTimes(3);
  });

  test("arrow keys and backspace update the selected note correctly", () => {
    const { callbacks, trackControllerEditor, renderFunc } = createHarness();
    trackControllerEditor.selectionManager.selectedNote = {
      note: { noteValue: NoteValue.C },
    };

    callbacks.onArrowDown("arrowdown");
    callbacks.onArrowDown("arrowup");
    callbacks.onArrowDown("arrowleft");
    callbacks.onArrowDown("arrowright");
    expect(trackControllerEditor.moveSelectedNote).toHaveBeenNthCalledWith(
      1,
      SelectedMoveDirection.Down
    );
    expect(trackControllerEditor.moveSelectedNote).toHaveBeenNthCalledWith(
      2,
      SelectedMoveDirection.Up
    );
    expect(trackControllerEditor.moveSelectedNote).toHaveBeenNthCalledWith(
      3,
      SelectedMoveDirection.Left
    );
    expect(trackControllerEditor.moveSelectedNote).toHaveBeenNthCalledWith(
      4,
      SelectedMoveDirection.Right
    );

    callbacks.onBackspacePress();
    expect(trackControllerEditor.setSelectedNoteFret).toHaveBeenCalledWith(
      null
    );

    trackControllerEditor.selectionManager.selectedNote = {
      note: { noteValue: NoteValue.None },
    };
    callbacks.onBackspacePress();
    expect(trackControllerEditor.setSelectedNoteFret).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(5);
  });

  test("onKeyDown routes handled keys and ignores function keys", () => {
    const { callbacks } = createHarness();
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
  });

  test("bind and unbind attach one keydown listener and are idempotent", () => {
    const { callbacks } = createHarness();
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
});
