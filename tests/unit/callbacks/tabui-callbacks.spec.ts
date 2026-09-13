import { TabUICallbacks } from "../../../src/tabui-callbacks";
import { RenderType } from "../../../src/notation/input";
import { captureSelectionCursor } from "../../../src/notation/accessibility/notation-selection-announcement";
import { GuitarNote } from "../../../src/notation/model";
import { FakeElement } from "./helpers";
import { createScoreGraph } from "../model/helpers";

jest.mock("../../../src/notation/input", () => {
  class MockEditorMouseDefCallbacks {
    public bind = jest.fn();
    public unbind = jest.fn();
    constructor() {}
  }

  class MockEditorKeyboardDefCallbacks {
    public bind = jest.fn();
    public unbind = jest.fn();
    constructor() {}
  }

  return {
    EditorMouseDefCallbacks: MockEditorMouseDefCallbacks,
    EditorKeyboardDefCallbacks: MockEditorKeyboardDefCallbacks,
    RenderType: {
      Full: 0,
      NotationOnly: 1,
      DragSelection: 2,
      SelectionRefresh: 3,
      ActiveVoiceSelection: 4,
      PlayerCursor: 5,
    },
  };
});

jest.mock("../../../src/ui/ui-callbacks", () => {
  class MockUICallbacks {
    public bind = jest.fn();
    public unbind = jest.fn();
    public captureKeyboard: () => void;
    public freeKeyboard: () => void;

    constructor(
      _uiComponent: unknown,
      _notationComponent: unknown,
      _renderFunc: () => void,
      _renderActiveVoiceFunc: () => void,
      captureKeyboard: () => void,
      freeKeyboard: () => void
    ) {
      this.captureKeyboard = captureKeyboard;
      this.freeKeyboard = freeKeyboard;
    }
  }

  return { UICallbacks: MockUICallbacks };
});

describe("TabUICallbacks", () => {
  function createHarness(onStateChanged: () => void = () => {}) {
    const renderer = {
      attachViewportScrollEvent: jest.fn(),
      detachViewportScrollEvent: jest.fn(),
    };
    const notationComponent = {
      render: jest.fn(() => []),
      renderer,
      rootDiv: new FakeElement(),
      trackController: { selectionCursor: undefined },
    } as any;
    const uiComponent = {
      render: jest.fn(),
      topComponent: {},
      sideComponent: {},
    } as any;
    const announce = jest.fn();
    const callbacks = new TabUICallbacks(
      uiComponent,
      notationComponent,
      {} as HTMLDivElement,
      onStateChanged,
      announce
    );

    return {
      callbacks,
      keyboardCallbacks: (callbacks as any)._keyboardCallbacks,
      uiCallbacks: (callbacks as any)._uiCallbacks,
      rootDiv: notationComponent.rootDiv,
      announce,
      notationComponent,
    };
  }

  function createSelectionModel() {
    const graph = createScoreGraph();
    const voiceBar = graph.bar.getVoiceBar(1);
    if (voiceBar === null) throw new Error("Expected test voice bar");
    const beat = voiceBar.beats[0];
    return { beat, note: beat.notes?.[0] };
  }

  test("reattaches the current renderer scroll listener after a full render", () => {
    const firstRenderer = {
      attachViewportScrollEvent: jest.fn(),
      detachViewportScrollEvent: jest.fn(),
    };
    const secondRenderer = {
      attachViewportScrollEvent: jest.fn(),
      detachViewportScrollEvent: jest.fn(),
    };
    const notationComponent = {
      render: jest.fn(() => []),
      renderer: firstRenderer,
      trackController: { selectionCursor: undefined },
    } as any;
    const uiComponent = {
      render: jest.fn(),
      topComponent: {},
      sideComponent: {},
    } as any;
    const callbacks = new TabUICallbacks(
      uiComponent,
      notationComponent,
      {} as HTMLDivElement
    );

    callbacks.bind();
    notationComponent.renderer = secondRenderer;
    (callbacks as any).render(RenderType.Full);

    expect(firstRenderer.attachViewportScrollEvent).toHaveBeenCalledTimes(1);
    expect(secondRenderer.attachViewportScrollEvent).toHaveBeenCalledTimes(1);
  });

  test("captures and releases dialog keyboard ownership idempotently", () => {
    const { callbacks, keyboardCallbacks, uiCallbacks } = createHarness();
    callbacks.bind();
    keyboardCallbacks.bind.mockClear();

    uiCallbacks.captureKeyboard();
    uiCallbacks.captureKeyboard();

    expect(keyboardCallbacks.unbind).toHaveBeenCalledTimes(1);

    uiCallbacks.freeKeyboard();
    uiCallbacks.freeKeyboard();

    expect(keyboardCallbacks.bind).toHaveBeenCalledTimes(1);
  });

  test("announces once on initial focus and after one rebind", () => {
    const { callbacks, rootDiv } = createHarness();
    const announceSelection = jest
      .spyOn(callbacks as any, "announceSelection")
      .mockImplementation(() => {});

    callbacks.bind();
    rootDiv.dispatch("focus");
    expect(announceSelection).toHaveBeenCalledTimes(1);

    callbacks.unbind();
    rootDiv.dispatch("focus");
    expect(announceSelection).toHaveBeenCalledTimes(1);

    callbacks.bind();
    rootDiv.dispatch("focus");
    expect(announceSelection).toHaveBeenCalledTimes(2);
  });

  test("preserves keyboard capture across temporary UI unbind and rebind", () => {
    const { callbacks, keyboardCallbacks, uiCallbacks } = createHarness();
    callbacks.bind();
    uiCallbacks.captureKeyboard();
    keyboardCallbacks.bind.mockClear();
    keyboardCallbacks.unbind.mockClear();

    (callbacks as any).render(RenderType.SelectionRefresh);

    expect(keyboardCallbacks.bind).not.toHaveBeenCalled();
    expect(keyboardCallbacks.unbind).not.toHaveBeenCalled();

    uiCallbacks.freeKeyboard();

    expect(keyboardCallbacks.bind).toHaveBeenCalledTimes(1);
  });

  test("releases open dialog ownership once on final unbind", () => {
    const { callbacks, keyboardCallbacks, uiCallbacks } = createHarness();
    callbacks.bind();
    uiCallbacks.captureKeyboard();
    keyboardCallbacks.bind.mockClear();
    keyboardCallbacks.unbind.mockClear();

    callbacks.unbind();
    callbacks.unbind();

    expect(keyboardCallbacks.bind).toHaveBeenCalledTimes(1);
    expect(keyboardCallbacks.unbind).toHaveBeenCalledTimes(1);

    uiCallbacks.freeKeyboard();

    expect(keyboardCallbacks.bind).toHaveBeenCalledTimes(1);
  });

  test("reports host state changes without reporting cursor-only renders", () => {
    const onStateChanged = jest.fn();
    const { callbacks } = createHarness(onStateChanged);

    (callbacks as any).render(RenderType.SelectionRefresh);
    (callbacks as any).render(RenderType.PlayerCursor);
    callbacks.refresh();

    expect(onStateChanged).toHaveBeenCalledTimes(2);
  });

  test("forces notation geometry during an explicit layout refresh", () => {
    const { callbacks } = createHarness();
    const notationComponent = (callbacks as any)._notationComponent;

    callbacks.refresh();

    expect(notationComponent.render).toHaveBeenCalledWith({
      renderNotation: true,
      forceNotation: true,
      overlays: { selection: true, player: true },
    });
  });

  test("announces a changed fret in the same slot once", () => {
    const { beat, note } = createSelectionModel();
    if (!(note instanceof GuitarNote)) throw new Error("Expected guitar note");
    const { callbacks, announce, notationComponent } = createHarness();
    const notation = notationComponent;
    notation.trackController.selectionCursor = {
      beat,
      note,
      noteIndex: 0,
    };
    callbacks.bind();
    note.fret = 5;

    callbacks.announceSelectionIfChanged();
    callbacks.announceSelectionIfChanged();

    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith(expect.stringContaining("fret 5"));
  });

  test("announces a changed rhythm in the same slot once", () => {
    const { beat, note } = createSelectionModel();
    const { callbacks, announce, notationComponent } = createHarness();
    const notation = notationComponent;
    notation.trackController.selectionCursor = {
      beat,
      note,
      noteIndex: 0,
    };
    callbacks.bind();
    beat.dots = 1;

    callbacks.announceSelectionIfChanged();
    callbacks.announceSelectionIfChanged();

    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith(expect.stringContaining("1 dot"));
  });

  test("keeps unchanged automatic announcements silent", () => {
    const { beat, note } = createSelectionModel();
    const { callbacks, announce, notationComponent } = createHarness();
    const notation = notationComponent;
    notation.trackController.selectionCursor = {
      beat,
      note,
      noteIndex: 0,
    };
    callbacks.bind();

    callbacks.announceSelectionIfChanged();

    expect(announce).not.toHaveBeenCalled();
  });

  test("seeds the automatic cache after explicit focus and arrow output", () => {
    const { beat, note } = createSelectionModel();
    const { callbacks, announce, rootDiv, notationComponent } = createHarness();
    const notation = notationComponent;
    notation.trackController.selectionCursor = {
      beat,
      note,
      noteIndex: 0,
    };
    callbacks.bind();
    rootDiv.dispatch("focus");
    callbacks.announceSelectionIfChanged();
    const previous = captureSelectionCursor(
      notation.trackController.selectionCursor
    );
    (callbacks as any).announceSelection(previous);
    callbacks.announceSelectionIfChanged();

    expect(announce).toHaveBeenCalledTimes(2);
    expect(announce.mock.calls[0][1]).toBe(true);
    expect(announce.mock.calls[1][0]).toBe("String 1, empty.");
  });
});
