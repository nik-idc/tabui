import { TabUIEditor } from "../../src/tabui-editor";
import { NotationComponent } from "../../src/notation/notation-component";
import { UIComponent } from "../../src/ui";
import { TabUICallbacks } from "../../src/tabui-callbacks";
import { PlaybackErrorCode } from "../../src/player";
import {
  TabUIEditorMode,
  TabUIScorePanelPlacement,
  TabUISidePanelPlacement,
} from "../../src/config/tabui-config";

let rootWidth: number;

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
        setEditingEnabled: jest.fn(),
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
  UIComponent: jest
    .fn()
    .mockImplementation(
      (_topHost: unknown, sideHost: any, _notation: unknown, config: any) => {
        const sidePanelToggle = (globalThis as any).document.createElement(
          "button"
        );
        if (config.panels.side.visible && config.panels.side.collapsible) {
          sideHost.appendChild(sidePanelToggle);
        }

        const sideComponent = {
          template: { sidePanelToggle },
          renderToggle: jest.fn((collapsed: boolean) => {
            sidePanelToggle.setAttribute("aria-expanded", `${!collapsed}`);
          }),
        };
        return {
          render: jest.fn((collapsed?: boolean) => {
            if (collapsed !== undefined) {
              sideComponent.renderToggle(collapsed);
            }
          }),
          closeOpenDialogs: jest.fn(),
          sideComponent,
        };
      }
    ),
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
  const listeners = new Map<string, Set<(...args: any[]) => void>>();
  return {
    get clientWidth() {
      return rootWidth;
    },
    appendChild: jest.fn((child: any) => {
      children.push(child);
      return child;
    }),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      toggle: jest.fn(),
    },
    style: {
      setProperty: jest.fn(),
      removeProperty: jest.fn(),
    },
    addEventListener: jest.fn(
      (type: string, listener: (...args: any[]) => void) => {
        const typeListeners =
          listeners.get(type) ?? new Set<(...args: any[]) => void>();
        typeListeners.add(listener);
        listeners.set(type, typeListeners);
      }
    ),
    removeEventListener: jest.fn(
      (type: string, listener: (...args: any[]) => void) => {
        listeners.get(type)?.delete(listener);
      }
    ),
    dispatch: (type: string, event: Record<string, unknown> = {}) => {
      for (const listener of listeners.get(type) ?? []) {
        listener(event);
      }
    },
    hidden: false,
    replaceChildren: jest.fn(() => {
      children.length = 0;
    }),
    children,
  } as unknown as HTMLDivElement;
}

function createShellElement() {
  const classes = new Set<string>();
  const children: any[] = [];
  const listeners = new Map<string, Set<() => void>>();
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
    children,
    appendChild: jest.fn((child: any) => {
      children.push(child);
      return child;
    }),
    addEventListener: jest.fn((type: string, listener: () => void) => {
      const typeListeners = listeners.get(type) ?? new Set<() => void>();
      typeListeners.add(listener);
      listeners.set(type, typeListeners);
    }),
    removeEventListener: jest.fn((type: string, listener: () => void) => {
      listeners.get(type)?.delete(listener);
    }),
    dispatch: (type: string) => {
      for (const listener of listeners.get(type) ?? []) {
        listener();
      }
    },
    setAttribute: jest.fn(),
    hidden: false,
  } as unknown as HTMLDivElement;
}

function createScore() {
  return { tracks: [{ uuid: Math.random(), name: "Track" }] } as any;
}

describe("TabUIEditor lifecycle", () => {
  let originalDocument: any;
  let originalGetComputedStyle: any;
  let originalResizeObserver: any;
  let originalRequestAnimationFrame: any;
  let originalCancelAnimationFrame: any;
  let originalWindow: any;
  let notationViewportWidth: number;

  beforeEach(() => {
    originalDocument = (globalThis as any).document;
    originalGetComputedStyle = (globalThis as any).getComputedStyle;
    originalResizeObserver = (globalThis as any).ResizeObserver;
    originalRequestAnimationFrame = (globalThis as any).requestAnimationFrame;
    originalCancelAnimationFrame = (globalThis as any).cancelAnimationFrame;
    originalWindow = (globalThis as any).window;
    notationViewportWidth = 690;
    rootWidth = 900;
    (globalThis as any).document = {
      createElement: jest.fn((tagName: string) => {
        if (tagName === "div") {
          const element = createShellElement();
          Object.defineProperties(element, {
            clientWidth: {
              get() {
                return element.classList.contains("tu-notation-viewport")
                  ? notationViewportWidth
                  : 0;
              },
            },
            getBoundingClientRect: {
              value: () => ({
                width: element.classList.contains("tu-notation-viewport")
                  ? notationViewportWidth
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
    (globalThis as any).ResizeObserver = originalResizeObserver;
    (globalThis as any).requestAnimationFrame = originalRequestAnimationFrame;
    (globalThis as any).cancelAnimationFrame = originalCancelAnimationFrame;
    (globalThis as any).window = originalWindow;
  });

  test("init then dispose tears down owned callbacks, notation, and root DOM state", () => {
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore());

    editor.init();
    const sideHost = (root as any).children[1];
    const sideToggle = sideHost.children[0];
    editor.dispose();
    editor.dispose();

    const ui = jest.mocked(UIComponent).mock.results[0].value;
    const notation = jest.mocked(NotationComponent).mock.results[0].value;
    const callbacks = jest.mocked(TabUICallbacks).mock.results[0].value;

    expect(ui.render).toHaveBeenCalledTimes(2);
    expect(notation.loadTrack).not.toHaveBeenCalled();
    expect(callbacks.bind).toHaveBeenCalledTimes(1);
    expect(callbacks.unbind).toHaveBeenCalledTimes(1);
    expect(notation.dispose).toHaveBeenCalledTimes(1);
    expect(sideToggle.removeEventListener).toHaveBeenCalledTimes(1);
    expect(root.replaceChildren).toHaveBeenCalledTimes(1);
    expect((root as any).children).toHaveLength(0);
    expect(root.classList.remove).toHaveBeenCalledWith("tu-editor");
    expect(root.classList.remove).toHaveBeenCalledWith(
      "tu-score-panel-top",
      "tu-score-panel-bottom",
      "tu-side-controls-left",
      "tu-side-controls-right",
      "tu-score-panel-hidden",
      "tu-side-controls-hidden",
      "tu-side-controls-collapsed",
      "tu-responsive-view-only",
      "tu-responsive-blocked",
      "tu-view-only"
    );
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
    expect(root.appendChild).toHaveBeenCalledTimes(4);
    expect(
      (root.appendChild as jest.Mock).mock.calls[2][0].classList.contains(
        "tu-notation-viewport"
      )
    ).toBe(true);
  });

  test("applies configured panel placement and visibility to the shell", () => {
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore(), {
      panels: {
        score: {
          visible: false,
          placement: TabUIScorePanelPlacement.Bottom,
        },
        side: { placement: TabUISidePanelPlacement.Right },
      },
    });

    editor.init();

    const topHost = (root as any).children[0];
    const sideHost = (root as any).children[1];
    expect(root.classList.add).toHaveBeenCalledWith(
      "tu-score-panel-bottom",
      "tu-side-controls-right",
      "tu-score-panel-hidden"
    );
    expect(topHost.hidden).toBe(true);
    expect(sideHost.hidden).toBe(false);
  });

  test("hides side controls by default in view-only mode", () => {
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore(), {
      interaction: { mode: TabUIEditorMode.ViewOnly },
    });

    editor.init();

    const sideHost = (root as any).children[1];
    expect(root.classList.add).toHaveBeenCalledWith(
      "tu-score-panel-top",
      "tu-side-controls-left",
      "tu-side-controls-hidden"
    );
    expect(sideHost.hidden).toBe(true);
  });

  test("collapses and expands visible side controls with layout refresh", () => {
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore());
    editor.init();
    const sideHost = (root as any).children[1];
    const toggle = sideHost.children[0];
    const notation = jest.mocked(NotationComponent).mock.results[0].value;

    toggle.dispatch("click");

    expect(root.classList.add).toHaveBeenCalledWith(
      "tu-side-controls-collapsed"
    );
    expect(toggle.setAttribute).toHaveBeenLastCalledWith(
      "aria-expanded",
      "false"
    );
    expect(notation.refreshLayout).toHaveBeenCalledTimes(1);

    toggle.dispatch("click");

    expect(root.classList.remove).toHaveBeenCalledWith(
      "tu-side-controls-collapsed"
    );
    expect(toggle.setAttribute).toHaveBeenLastCalledWith(
      "aria-expanded",
      "true"
    );
    expect(notation.refreshLayout).toHaveBeenCalledTimes(2);
  });

  test("supports an initially collapsed side panel", () => {
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore(), {
      panels: { side: { initiallyCollapsed: true } },
    });

    editor.init();

    const sideHost = (root as any).children[1];
    const toggle = sideHost.children[0];
    expect(root.classList.add).toHaveBeenCalledWith(
      "tu-score-panel-top",
      "tu-side-controls-left"
    );
    expect(root.classList.add).toHaveBeenCalledWith(
      "tu-side-controls-collapsed"
    );
    expect(toggle.setAttribute).toHaveBeenLastCalledWith(
      "aria-expanded",
      "false"
    );
  });

  test("rolls collapse state back when layout refresh fails", () => {
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore());
    editor.init();
    const sideHost = (root as any).children[1];
    const toggle = sideHost.children[0];
    jest.spyOn(editor, "refreshLayout").mockImplementation(() => {
      throw new Error("layout failed");
    });

    expect(() => toggle.dispatch("click")).toThrow("layout failed");

    expect(root.classList.add).toHaveBeenCalledWith(
      "tu-side-controls-collapsed"
    );
    expect(root.classList.remove).toHaveBeenCalledWith(
      "tu-side-controls-collapsed"
    );
    expect(toggle.setAttribute).toHaveBeenLastCalledWith(
      "aria-expanded",
      "true"
    );
  });

  test("does not mount a toggle for a non-collapsible side panel", () => {
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore(), {
      panels: { side: { collapsible: false } },
    });

    editor.init();

    const sideHost = (root as any).children[1];
    expect(sideHost.children).toHaveLength(0);
  });

  test("rejects explicit widths below the view-only threshold", () => {
    expect(
      () =>
        new TabUIEditor(createRoot(), createScore(), {
          layout: { width: 200 },
        })
    ).toThrow("layout width");
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

  test("coalesces responsive viewport observations using the latest width", () => {
    let resizeCallback: ResizeObserverCallback | undefined;
    let frameCallback: FrameRequestCallback | undefined;
    const observe = jest.fn();
    const disconnect = jest.fn();
    (globalThis as any).ResizeObserver = jest
      .fn()
      .mockImplementation((callback: ResizeObserverCallback) => {
        resizeCallback = callback;
        return { observe, disconnect };
      });
    (globalThis as any).requestAnimationFrame = jest.fn(
      (callback: FrameRequestCallback) => {
        frameCallback = callback;
        return 7;
      }
    );
    (globalThis as any).cancelAnimationFrame = jest.fn();
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore());
    editor.init();
    const notation = jest.mocked(NotationComponent).mock.results[0].value;
    const callbacks = jest.mocked(TabUICallbacks).mock.results[0].value;
    const listener = jest.fn();
    editor.subscribe(listener);

    expect(observe).toHaveBeenCalledWith((root as any).children[2]);
    notationViewportWidth = 740;
    resizeCallback?.([], {} as ResizeObserver);
    notationViewportWidth = 780;
    resizeCallback?.([], {} as ResizeObserver);

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    frameCallback?.(0);
    expect(editor.layoutDimensions.WIDTH).toBe(756);
    expect(notation.refreshLayout).toHaveBeenCalledTimes(1);
    expect(callbacks.refresh).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(NotationComponent).toHaveBeenCalledTimes(1);
    expect(UIComponent).toHaveBeenCalledTimes(1);
    expect(TabUICallbacks).toHaveBeenCalledTimes(1);

    resizeCallback?.([], {} as ResizeObserver);
    frameCallback?.(1);
    expect(notation.refreshLayout).toHaveBeenCalledTimes(1);

    editor.dispose();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  test("enforces responsive blocked and view-only modes from notation width", () => {
    let resizeCallback: ResizeObserverCallback | undefined;
    let frameCallback: FrameRequestCallback | undefined;
    (globalThis as any).ResizeObserver = jest
      .fn()
      .mockImplementation((callback: ResizeObserverCallback) => {
        resizeCallback = callback;
        return { observe: jest.fn(), disconnect: jest.fn() };
      });
    (globalThis as any).requestAnimationFrame = jest.fn(
      (callback: FrameRequestCallback) => {
        frameCallback = callback;
        return 1;
      }
    );
    notationViewportWidth = 490;
    rootWidth = 490;
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore());

    editor.init();
    const notation = jest.mocked(NotationComponent).mock.results[0].value;
    const ui = jest.mocked(UIComponent).mock.results[0].value;
    expect(notation.setEditingEnabled).toHaveBeenLastCalledWith(false);
    expect(ui.closeOpenDialogs).toHaveBeenCalledTimes(1);
    expect(root.classList.toggle).toHaveBeenCalledWith(
      "tu-responsive-blocked",
      true
    );

    notationViewportWidth = 700;
    rootWidth = 700;
    resizeCallback?.([], {} as ResizeObserver);
    frameCallback?.(0);
    expect(root.classList.toggle).toHaveBeenCalledWith(
      "tu-responsive-view-only",
      true
    );
    expect(notation.setEditingEnabled).toHaveBeenLastCalledWith(false);
    expect(ui.closeOpenDialogs).toHaveBeenCalledTimes(2);

    notationViewportWidth = 1000;
    rootWidth = 1000;
    resizeCallback?.([], {} as ResizeObserver);
    frameCallback?.(1);
    expect(root.classList.toggle).toHaveBeenCalledWith(
      "tu-responsive-view-only",
      false
    );
    expect(notation.setEditingEnabled).toHaveBeenLastCalledWith(true);
  });

  test("mounts a blocked editor below the view-only threshold", () => {
    notationViewportWidth = 280;
    rootWidth = 280;
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore());

    expect(() => editor.init()).not.toThrow();
    expect(editor.layoutDimensions.WIDTH).toBe(256);
    expect(root.classList.toggle).toHaveBeenCalledWith(
      "tu-responsive-blocked",
      true
    );
  });

  test("ignores transient invalid responsive widths and later recovers", () => {
    let resizeCallback: ResizeObserverCallback | undefined;
    let frameCallback: FrameRequestCallback | undefined;
    (globalThis as any).ResizeObserver = jest
      .fn()
      .mockImplementation((callback: ResizeObserverCallback) => {
        resizeCallback = callback;
        return { observe: jest.fn(), disconnect: jest.fn() };
      });
    (globalThis as any).requestAnimationFrame = jest.fn(
      (callback: FrameRequestCallback) => {
        frameCallback = callback;
        return 8;
      }
    );
    (globalThis as any).cancelAnimationFrame = jest.fn();
    const editor = new TabUIEditor(createRoot(), createScore());
    editor.init();
    const notation = jest.mocked(NotationComponent).mock.results[0].value;

    notationViewportWidth = 0;
    resizeCallback?.([], {} as ResizeObserver);
    frameCallback?.(0);
    notationViewportWidth = 300;
    resizeCallback?.([], {} as ResizeObserver);
    frameCallback?.(1);

    expect(editor.layoutDimensions.WIDTH).toBe(276);
    expect(notation.refreshLayout).toHaveBeenCalledTimes(1);

    notationViewportWidth = 720;
    resizeCallback?.([], {} as ResizeObserver);
    frameCallback?.(2);
    expect(editor.layoutDimensions.WIDTH).toBe(696);
    expect(notation.refreshLayout).toHaveBeenCalledTimes(2);
  });

  test("rolls back when responsive observer setup fails", () => {
    const disconnect = jest.fn();
    (globalThis as any).ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(() => {
        throw new Error("observe failed");
      }),
      disconnect,
    }));
    const root = createRoot();
    const editor = new TabUIEditor(root, createScore());

    expect(() => editor.init()).toThrow("observe failed");

    const notation = jest.mocked(NotationComponent).mock.results[0].value;
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(notation.dispose).toHaveBeenCalledTimes(1);
    expect(root.replaceChildren).toHaveBeenCalledTimes(1);
    expect(() => editor.getState()).toThrow("TabUIEditor already disposed");
  });

  test("observes responsive interaction without resizing configured widths", () => {
    const ResizeObserverMock = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    }));
    (globalThis as any).ResizeObserver = ResizeObserverMock;
    const editor = new TabUIEditor(createRoot(), createScore(), {
      layout: { width: 640 },
    });

    editor.init();
    notationViewportWidth = 800;

    expect(ResizeObserverMock).toHaveBeenCalledTimes(1);
    expect(editor.layoutDimensions.WIDTH).toBe(640);
  });

  test("cancels pending responsive work during disposal", () => {
    let resizeCallback: ResizeObserverCallback | undefined;
    let frameCallback: FrameRequestCallback | undefined;
    const disconnect = jest.fn();
    (globalThis as any).ResizeObserver = jest
      .fn()
      .mockImplementation((callback: ResizeObserverCallback) => {
        resizeCallback = callback;
        return { observe: jest.fn(), disconnect };
      });
    (globalThis as any).requestAnimationFrame = jest.fn(
      (callback: FrameRequestCallback) => {
        frameCallback = callback;
        return 9;
      }
    );
    (globalThis as any).cancelAnimationFrame = jest.fn();
    const editor = new TabUIEditor(createRoot(), createScore());
    editor.init();
    const notation = jest.mocked(NotationComponent).mock.results[0].value;

    notationViewportWidth = 760;
    resizeCallback?.([], {} as ResizeObserver);
    editor.dispose();
    resizeCallback?.([], {} as ResizeObserver);
    frameCallback?.(0);

    expect(cancelAnimationFrame).toHaveBeenCalledWith(9);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(notation.refreshLayout).not.toHaveBeenCalled();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  test("falls back to a coalesced window resize listener", () => {
    let resizeHandler: EventListener | undefined;
    let frameCallback: FrameRequestCallback | undefined;
    const addEventListener = jest.fn((type: string, handler: EventListener) => {
      if (type === "resize") {
        resizeHandler = handler;
      }
    });
    const removeEventListener = jest.fn();
    (globalThis as any).ResizeObserver = undefined;
    (globalThis as any).window = { addEventListener, removeEventListener };
    (globalThis as any).requestAnimationFrame = jest.fn(
      (callback: FrameRequestCallback) => {
        frameCallback = callback;
        return 11;
      }
    );
    (globalThis as any).cancelAnimationFrame = jest.fn();
    const editor = new TabUIEditor(createRoot(), createScore());
    editor.init();
    const notation = jest.mocked(NotationComponent).mock.results[0].value;

    notationViewportWidth = 750;
    resizeHandler?.({} as Event);
    resizeHandler?.({} as Event);
    frameCallback?.(0);

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(editor.layoutDimensions.WIDTH).toBe(726);
    expect(notation.refreshLayout).toHaveBeenCalledTimes(1);

    editor.dispose();
    expect(removeEventListener).toHaveBeenCalledWith("resize", resizeHandler);
  });

  test("keeps configured layout width fixed during measured refresh", () => {
    const editor = new TabUIEditor(createRoot(), createScore(), {
      layout: { width: 640 },
    });
    editor.init();
    const notation = jest.mocked(NotationComponent).mock.results[0].value;

    editor.refreshLayout();

    expect(editor.layoutDimensions.WIDTH).toBe(640);
    expect(notation.refreshLayout).toHaveBeenCalledTimes(1);
  });

  test("restores the previous width when notation refresh fails", () => {
    const editor = new TabUIEditor(createRoot(), createScore());
    editor.init();
    const notation = jest.mocked(NotationComponent).mock.results[0].value;
    const callbacks = jest.mocked(TabUICallbacks).mock.results[0].value;
    notation.refreshLayout.mockImplementationOnce(() => {
      throw new Error("refresh failed");
    });

    expect(() => editor.refreshLayout(720)).toThrow("refresh failed");

    expect(editor.layoutDimensions.WIDTH).toBe(666);
    expect(notation.refreshLayout).toHaveBeenCalledTimes(2);
    expect(callbacks.refresh).toHaveBeenCalledTimes(1);
  });

  test("restores captured dimensions when a change listener disposes and throws", () => {
    const editor = new TabUIEditor(createRoot(), createScore());
    editor.init();
    const dimensions = editor.layoutDimensions;
    const notation = jest.mocked(NotationComponent).mock.results[0].value;
    editor.subscribe(() => {
      editor.dispose();
      throw new Error("listener failed");
    });

    expect(() => editor.refreshLayout(720)).toThrow("listener failed");

    expect(dimensions.WIDTH).toBe(666);
    expect(notation.refreshLayout).toHaveBeenCalledTimes(2);
  });

  test("rejects negative refresh widths before changing layout", () => {
    const editor = new TabUIEditor(createRoot(), createScore());
    editor.init();
    const notation = jest.mocked(NotationComponent).mock.results[0].value;
    const callbacks = jest.mocked(TabUICallbacks).mock.results[0].value;

    expect(() => editor.refreshLayout(-1)).toThrow(
      "non-negative finite number"
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
