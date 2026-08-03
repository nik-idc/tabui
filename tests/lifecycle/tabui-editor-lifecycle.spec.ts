import { TabUIEditor } from "../../src/tabui-editor";
import { NotationComponent } from "../../src/notation/notation-component";
import { UIComponent } from "../../src/ui";
import { TabUICallbacks } from "../../src/tabui-callbacks";
import { PlaybackErrorCode } from "../../src/player";

jest.mock("../../src/notation/notation-component", () => ({
  NotationComponent: jest
    .fn()
    .mockImplementation(
      (
        _root: unknown,
        score: any,
        _config: unknown,
        layoutDimensions: any,
        onPlaybackError?: (error: unknown) => void
      ) => ({
        loadTrack: jest.fn(),
        refreshLayout: jest.fn(),
        dispose: jest.fn(),
        emitPlaybackError: onPlaybackError,
        trackController: {
          track: score.tracks[0],
          isPlaying: false,
          isLooped: false,
          activeVoiceNumber: 1,
          selectionBeats: [],
          selectedNote: undefined,
          windowHeight: layoutDimensions.WIDTH / 2,
        },
      })
    ),
}));

jest.mock("../../src/ui", () => ({
  UIComponent: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
  })),
}));

jest.mock("../../src/tabui-callbacks", () => ({
  TabUICallbacks: jest
    .fn()
    .mockImplementation(
      (
        _ui: unknown,
        _notation: unknown,
        _root: unknown,
        onStateChanged?: () => void
      ) => ({
        bind: jest.fn(),
        unbind: jest.fn(),
        refresh: jest.fn(onStateChanged),
        emitStateChanged: onStateChanged,
      })
    ),
}));

function createRoot() {
  const children: any[] = [];
  return {
    clientWidth: 900,
    appendChild: jest.fn((child: any) => {
      children.push(child);
      return child;
    }),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
    },
    style: {
      setProperty: jest.fn(),
      removeProperty: jest.fn(),
    },
    replaceChildren: jest.fn(() => {
      children.length = 0;
    }),
    children,
  } as unknown as HTMLDivElement;
}

function createShellElement() {
  const classes = new Set<string>();
  return {
    classList: {
      add: (...classNames: string[]) => {
        for (const className of classNames) {
          classes.add(className);
        }
      },
      remove: (...classNames: string[]) => {
        for (const className of classNames) {
          classes.delete(className);
        }
      },
      contains: (className: string) => classes.has(className),
    },
    clientWidth: 0,
    getBoundingClientRect: () => ({ width: 0 }),
    style: {
      setProperty: jest.fn(),
      removeProperty: jest.fn(),
    },
  } as unknown as HTMLDivElement;
}

function createScore() {
  return { tracks: [{ uuid: Math.random(), name: "Track" }] } as any;
}

describe("TabUIEditor lifecycle", () => {
  let originalDocument: any;
  let originalGetComputedStyle: any;

  beforeEach(() => {
    originalDocument = (globalThis as any).document;
    originalGetComputedStyle = (globalThis as any).getComputedStyle;
    (globalThis as any).document = {
      createElement: jest.fn((tagName: string) => {
        if (tagName === "div") {
          const element = createShellElement();
          Object.defineProperties(element, {
            clientWidth: {
              get() {
                return element.classList.contains("tu-notation-viewport")
                  ? 690
                  : 0;
              },
            },
            getBoundingClientRect: {
              value: () => ({
                width: element.classList.contains("tu-notation-viewport")
                  ? 690
                  : 0,
              }),
            },
          });
          return element;
        }

        return createShellElement();
      }),
      documentElement: {
        style: {
          setProperty: jest.fn(),
          removeProperty: jest.fn(),
        },
      },
    };
    (globalThis as any).getComputedStyle = jest.fn((element: any) => ({
      paddingLeft: "0px",
      paddingRight: "0px",
    }));
    jest.clearAllMocks();
  });

  afterEach(() => {
    (globalThis as any).document = originalDocument;
    (globalThis as any).getComputedStyle = originalGetComputedStyle;
  });

  test("init then dispose tears down owned callbacks, notation, and root DOM state", () => {
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore());

    editor.init();
    editor.dispose();
    editor.dispose();

    const ui = jest.mocked(UIComponent).mock.results[0].value;
    const notation = jest.mocked(NotationComponent).mock.results[0].value;
    const callbacks = jest.mocked(TabUICallbacks).mock.results[0].value;

    expect(ui.render).toHaveBeenCalledTimes(1);
    expect(notation.loadTrack).not.toHaveBeenCalled();
    expect(callbacks.bind).toHaveBeenCalledTimes(1);
    expect(callbacks.unbind).toHaveBeenCalledTimes(1);
    expect(notation.dispose).toHaveBeenCalledTimes(1);
    expect(root.replaceChildren).toHaveBeenCalledTimes(1);
    expect((root as any).children).toHaveLength(0);
    expect(root.classList.remove).toHaveBeenCalledWith("tu-editor");
  });

  test("keeps theme variables scoped to the editor root", () => {
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore());
    const documentStyle = document.documentElement.style as any;

    editor.init();

    expect(root.style.setProperty).toHaveBeenCalled();
    expect(documentStyle.setProperty).not.toHaveBeenCalled();
    editor.dispose();
    expect(root.style.removeProperty).toHaveBeenCalled();
    expect(documentStyle.removeProperty).not.toHaveBeenCalled();
  });

  test("a disposed root can be remounted by a new editor", () => {
    const root = createRoot();
    const firstEditor = new TabUIEditor(root, createScore());
    firstEditor.init();
    firstEditor.dispose();

    const secondEditor = new TabUIEditor(root, createScore());
    secondEditor.init();
    secondEditor.dispose();

    expect(jest.mocked(NotationComponent)).toHaveBeenCalledTimes(2);
    expect(root.replaceChildren).toHaveBeenCalledTimes(2);
  });

  test("applies layout config and explicit width override", () => {
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore(), {
      layout: {
        width: 640,
        noteTextSize: 14,
        timeSigTextSize: 52,
        tempoTextSize: 26,
        durationsHeight: 40,
        horizontalPadding: 18,
      },
    });

    editor.init();

    expect(editor.layoutDimensions.WIDTH).toBe(640);
    expect(editor.layoutDimensions.NOTE_TEXT_SIZE).toBe(14);
    expect(editor.layoutDimensions.TIME_SIG_TEXT_SIZE).toBe(52);
    expect(editor.layoutDimensions.TEMPO_TEXT_SIZE).toBe(26);
    expect(editor.layoutDimensions.DURATIONS_HEIGHT).toBe(40);
    expect(editor.layoutDimensions.HORIZONTAL_PADDING).toBe(18);
  });

  test("measures notation host width instead of full root width", () => {
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore());

    editor.init();

    expect(editor.layoutDimensions.WIDTH).toBe(666);
    expect(root.appendChild).toHaveBeenCalledTimes(3);
    expect(
      (root.appendChild as jest.Mock).mock.calls[2][0].classList.contains(
        "tu-notation-viewport"
      )
    ).toBe(true);
  });

  test("rejects widths below the resolved minimum", () => {
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore(), {
      layout: {
        width: 200,
      },
    });

    expect(() => editor.init()).toThrow(
      "TabUIEditor width must be at least 320px"
    );
    expect(root.replaceChildren).toHaveBeenCalledTimes(1);
    expect(root.classList.remove).toHaveBeenCalledWith("tu-editor");
    expect(() => editor.init()).toThrow("TabUIEditor already disposed");
  });

  test("rolls back a partial init failure and allows a clean remount", () => {
    const renderError = new Error("render failed");
    jest.mocked(UIComponent).mockImplementationOnce(
      () =>
        ({
          render: jest.fn(() => {
            throw renderError;
          }),
        }) as any
    );
    const root = createRoot();
    const failedEditor = new TabUIEditor(root, createScore());

    expect(() => failedEditor.init()).toThrow(renderError);

    const failedNotation = jest.mocked(NotationComponent).mock.results[0].value;
    const failedCallbacks = jest.mocked(TabUICallbacks).mock.results[0].value;
    expect(failedCallbacks.bind).not.toHaveBeenCalled();
    expect(failedCallbacks.unbind).not.toHaveBeenCalled();
    expect(failedNotation.dispose).toHaveBeenCalledTimes(1);
    expect(root.replaceChildren).toHaveBeenCalledTimes(1);
    expect((root as any).children).toHaveLength(0);
    expect(() => failedEditor.getState()).toThrow(
      "TabUIEditor already disposed"
    );
    failedEditor.dispose();
    expect(failedNotation.dispose).toHaveBeenCalledTimes(1);

    const restoredEditor = new TabUIEditor(root, createScore());
    restoredEditor.init();
    restoredEditor.dispose();

    expect(jest.mocked(NotationComponent)).toHaveBeenCalledTimes(2);
    expect(root.replaceChildren).toHaveBeenCalledTimes(2);
  });

  test("exposes model-level editor state without exposing runtime controllers", () => {
    const editor = new TabUIEditor(createRoot(), createScore());
    editor.init();
    const notation = jest.mocked(NotationComponent).mock.results[0].value;
    const selectedBeat = { uuid: 10 };
    const selectedNote = { uuid: 11 };
    notation.trackController.isPlaying = true;
    notation.trackController.isLooped = true;
    notation.trackController.activeVoiceNumber = 2;
    notation.trackController.selectionBeats = [selectedBeat];
    notation.trackController.selectedNote = {
      beat: selectedBeat,
      note: selectedNote,
      noteIndex: 3,
    };
    const callbacks = jest.mocked(TabUICallbacks).mock.results[0].value;
    callbacks.emitStateChanged();

    const state = editor.getState();

    expect(state).toEqual({
      activeTrack: editor.score.tracks[0],
      playback: { isPlaying: true, isLooped: true },
      selection: {
        activeVoiceNumber: 2,
        beats: [selectedBeat],
        cursor: { beat: selectedBeat, note: selectedNote, noteIndex: 3 },
      },
      layout: { width: 666, height: 333 },
    });
    expect(state).not.toHaveProperty("controller");
    expect(state).not.toHaveProperty("renderer");
  });

  test("subscriptions are disposable and isolated between editor instances", () => {
    const firstEditor = new TabUIEditor(createRoot(), createScore());
    const secondEditor = new TabUIEditor(createRoot(), createScore());
    firstEditor.init();
    secondEditor.init();
    const firstListener = jest.fn();
    const secondListener = jest.fn();
    const unsubscribeFirst = firstEditor.subscribe(firstListener);
    secondEditor.subscribe(secondListener);
    const firstCallbacks = jest.mocked(TabUICallbacks).mock.results[0].value;
    const secondCallbacks = jest.mocked(TabUICallbacks).mock.results[1].value;

    firstCallbacks.emitStateChanged();

    expect(firstListener).toHaveBeenCalledWith({
      type: "change",
      state: firstEditor.getState(),
    });
    expect(secondListener).not.toHaveBeenCalled();

    unsubscribeFirst();
    unsubscribeFirst();
    firstCallbacks.emitStateChanged();
    secondCallbacks.emitStateChanged();

    expect(firstListener).toHaveBeenCalledTimes(1);
    expect(secondListener).toHaveBeenCalledTimes(1);
  });

  test("keeps state snapshots stable between change notifications", () => {
    const editor = new TabUIEditor(createRoot(), createScore());
    editor.init();
    const initialState = editor.getState();
    const callbacks = jest.mocked(TabUICallbacks).mock.results[0].value;

    expect(editor.getState()).toBe(initialState);

    callbacks.emitStateChanged();

    expect(editor.getState()).not.toBe(initialState);
    expect(editor.getState()).toBe(editor.getState());
  });

  test("publishes structured playback failures only to the owning editor", () => {
    const firstEditor = new TabUIEditor(createRoot(), createScore());
    const secondEditor = new TabUIEditor(createRoot(), createScore());
    firstEditor.init();
    secondEditor.init();
    const firstListener = jest.fn();
    const secondListener = jest.fn();
    firstEditor.subscribe(firstListener);
    secondEditor.subscribe(secondListener);
    const firstNotation = jest.mocked(NotationComponent).mock.results[0].value;
    const cause = new Error("blocked");

    firstNotation.emitPlaybackError({
      code: PlaybackErrorCode.ContextStart,
      message: "Failed to start audio context",
      cause,
    });

    expect(firstListener).toHaveBeenCalledWith({
      type: "error",
      error: {
        source: "playback",
        code: PlaybackErrorCode.ContextStart,
        message: "Failed to start audio context",
        cause,
      },
    });
    expect(secondListener).not.toHaveBeenCalled();
  });

  test("refreshes explicit or measured layout and publishes the new size", () => {
    const editor = new TabUIEditor(createRoot(), createScore());
    editor.init();
    const listener = jest.fn();
    editor.subscribe(listener);
    const notation = jest.mocked(NotationComponent).mock.results[0].value;
    const callbacks = jest.mocked(TabUICallbacks).mock.results[0].value;

    editor.refreshLayout(720);

    expect(editor.layoutDimensions.WIDTH).toBe(720);
    expect(notation.refreshLayout).toHaveBeenCalledTimes(1);
    expect(callbacks.refresh).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith({
      type: "change",
      state: editor.getState(),
    });
  });

  test("rejects invalid refresh widths before changing layout", () => {
    const editor = new TabUIEditor(createRoot(), createScore());
    editor.init();
    const notation = jest.mocked(NotationComponent).mock.results[0].value;
    const callbacks = jest.mocked(TabUICallbacks).mock.results[0].value;

    expect(() => editor.refreshLayout(200)).toThrow(
      "TabUIEditor width must be at least 320px"
    );
    expect(editor.layoutDimensions.WIDTH).toBe(666);
    expect(notation.refreshLayout).not.toHaveBeenCalled();
    expect(callbacks.refresh).not.toHaveBeenCalled();
  });

  test("disposal clears subscriptions and keeps state APIs terminal", () => {
    const editor = new TabUIEditor(createRoot(), createScore());
    editor.init();
    const listener = jest.fn();
    editor.subscribe(listener);
    const callbacks = jest.mocked(TabUICallbacks).mock.results[0].value;

    editor.dispose();
    callbacks.emitStateChanged();

    expect(listener).not.toHaveBeenCalled();
    expect(() => editor.getState()).toThrow("TabUIEditor already disposed");
    expect(() => editor.subscribe(jest.fn())).toThrow(
      "TabUIEditor already disposed"
    );
    expect(() => editor.refreshLayout()).toThrow(
      "TabUIEditor already disposed"
    );
  });
});
