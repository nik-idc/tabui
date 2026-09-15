import { TabUICallbacks } from "../../../src/tabui-callbacks";
import { RenderType } from "../../../src/notation/input";
import { captureSelectionCursor } from "../../../src/notation/accessibility/notation-selection-announcement";
import { DEFAULT_MASTER_BAR, GuitarNote } from "../../../src/notation/model";
import { SelectionManager } from "../../../src/notation/controller/selection/selection-manager";
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
      trackController: { selectionCursor: undefined, selectionAsBeats: [] },
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
      trackController: { selectionCursor: undefined, selectionAsBeats: [] },
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
      .spyOn(callbacks, "announceSelection")
      .mockImplementation(() => {});

    callbacks.bind();
    rootDiv.dispatch("focus");
    expect(announceSelection).toHaveBeenCalledTimes(1);
    expect(announceSelection).toHaveBeenLastCalledWith(false);

    callbacks.unbind();
    rootDiv.dispatch("focus");
    expect(announceSelection).toHaveBeenCalledTimes(1);

    callbacks.bind();
    rootDiv.dispatch("focus");
    expect(announceSelection).toHaveBeenCalledTimes(2);
    expect(announceSelection).toHaveBeenLastCalledWith(false);
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

    callbacks.announceSelection(true);
    callbacks.announceSelection(true);

    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith(
      expect.stringContaining("fret 5"),
      false
    );
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

    callbacks.announceSelection(true);
    callbacks.announceSelection(true);

    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith(
      expect.stringContaining("1 dot"),
      false
    );
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

    callbacks.announceSelection(true);

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
    callbacks.announceSelection(true);
    const previous = captureSelectionCursor(
      notation.trackController.selectionCursor
    );
    callbacks.announceSelection(false, previous);
    callbacks.announceSelection(true);

    expect(announce).toHaveBeenCalledTimes(2);
    expect(announce.mock.calls[0][1]).toBe(true);
    expect(announce.mock.calls[1][0]).toBe("String 1, empty.");
  });

  /** Uses real range state while keeping rendering isolated. */
  function createRangeHarness() {
    const graph = createScoreGraph();
    graph.track.name = "Guitar";
    graph.score.appendMasterBar(DEFAULT_MASTER_BAR);
    graph.score.appendMasterBar(DEFAULT_MASTER_BAR);
    const selection = new SelectionManager(graph.track);
    const beats = graph.staff.getBeatsSeq(1);
    selection.selectBeat(beats[0]);
    const harness = createHarness(() =>
      harness.callbacks.announceSelection(true)
    );
    harness.notationComponent.trackController = selection;
    harness.callbacks.bind();
    return { ...harness, selection, beats };
  }

  test("announces a changed range once, stays silent unchanged, and repeats on focus", () => {
    const { callbacks, selection, beats, announce, rootDiv } =
      createRangeHarness();
    callbacks.announceSelection(true);
    expect(announce).not.toHaveBeenCalled();
    selection.selectBeat(beats[1]);
    callbacks.announceSelection(true);
    callbacks.announceSelection(true);
    const description =
      "Track Guitar, Staff 1, voice 1, 2 beats selected, " +
      "bar 1 beat 1 to bar 2 beat 1, anchor bar 1 beat 1, active end bar 2 beat 1.";
    expect(announce.mock.calls).toEqual([[description, false]]);
    rootDiv.dispatch("focus");
    rootDiv.dispatch("focus");
    callbacks.announceSelection(true);
    expect(announce.mock.calls).toEqual([
      [description, false],
      [description, true],
      [description, true],
    ]);
  });

  describe("queued drag announcements", () => {
    let frames: Map<number, FrameRequestCallback>;
    const originalRequest = globalThis.requestAnimationFrame;
    const originalCancel = globalThis.cancelAnimationFrame;
    beforeEach(() => {
      frames = new Map();
      let id = 0;
      globalThis.requestAnimationFrame = jest.fn((callback) => {
        frames.set(++id, callback);
        return id;
      });
      globalThis.cancelAnimationFrame = jest.fn((id) => {
        frames.delete(id);
      });
    });
    afterEach(() => {
      if (originalRequest === undefined)
        Reflect.deleteProperty(globalThis, "requestAnimationFrame");
      else globalThis.requestAnimationFrame = originalRequest;
      if (originalCancel === undefined)
        Reflect.deleteProperty(globalThis, "cancelAnimationFrame");
      else globalThis.cancelAnimationFrame = originalCancel;
    });

    test("coalesces drag changes and announces only the latest state after rendering", () => {
      const { callbacks, selection, beats, announce, notationComponent } =
        createRangeHarness();
      selection.selectBeat(beats[1]);
      (callbacks as any).render(RenderType.DragSelection);
      selection.selectBeat(beats[2]);
      (callbacks as any).render(RenderType.DragSelection);
      expect(frames.size).toBe(1);
      expect(announce).not.toHaveBeenCalled();
      notationComponent.render.mockClear();
      notationComponent.render.mockImplementation(() => {
        expect(announce).not.toHaveBeenCalled();
        return [];
      });
      for (const frame of frames.values()) frame(0);
      expect(notationComponent.render).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith(
        "Track Guitar, Staff 1, voice 1, 3 beats selected, " +
          "bar 1 beat 1 to bar 3 beat 1, anchor bar 1 beat 1, active end bar 3 beat 1.",
        false
      );
      callbacks.announceSelection(true);
      expect(announce).toHaveBeenCalledTimes(1);
    });

    test.each(["refresh", "selection", "unbind"])(
      "cancels queued range output on %s",
      (action) => {
        const { callbacks, selection, beats, announce } = createRangeHarness();
        selection.selectBeat(beats[2]);
        (callbacks as any).render(RenderType.DragSelection);
        selection.clearRange();
        if (action === "refresh") callbacks.refresh();
        else if (action === "selection")
          (callbacks as any).render(RenderType.SelectionRefresh);
        else callbacks.unbind();
        expect(frames.size).toBe(0);
        expect(announce.mock.calls).toEqual(
          action === "unbind"
            ? []
            : [
                [
                  "Track Guitar, Staff 1, voice 1, Bar 1, 4/4, 120 BPM, Beat 1, quarter, String 1, empty.",
                  false,
                ],
              ]
        );
      }
    );
  });
});
