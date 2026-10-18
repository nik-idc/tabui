import { JSDOM } from "jsdom";
import { TabUIEditor } from "../../../src/tabui-editor";
import {
  TabUIConfig,
  TabUIScorePanelPlacement,
  TabUISidePanelPlacement,
} from "../../../src/config/tabui-config";
import { required } from "../required";

describe("TabUIEditor responsive sizing with real components", () => {
  let dom: JSDOM;
  const originalGlobals = new Map<string, PropertyDescriptor | undefined>();
  let editorConstructor: typeof TabUIEditor;
  let guitarNoteConstructor: typeof import("../../../src/notation/model").GuitarNote;
  let scoreGraph: typeof import("../model/helpers").createScoreGraph;
  let hostWidth: number;
  let viewportWidth: number;
  let notifyResize: () => void;
  let observe: jest.Mock;
  let disconnect: jest.Mock;
  const editors: TabUIEditor[] = [];

  beforeAll(() => {
    jest.isolateModules(() => {
      jest.dontMock("../../../src/notation/notation-component");
      jest.dontMock("../../../src/ui");
      jest.dontMock("../../../src/tabui-callbacks");
      editorConstructor = jest.requireActual(
        "../../../src/tabui-editor"
      ).TabUIEditor;
      scoreGraph = jest.requireActual("../model/helpers").createScoreGraph;
      guitarNoteConstructor = jest.requireActual(
        "../../../src/notation/model"
      ).GuitarNote;
    });
  });

  beforeEach(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>");
    const browserGlobals = new Map<string, unknown>([
      ["window", dom.window],
      ["document", dom.window.document],
      ["HTMLElement", dom.window.HTMLElement],
      ["Element", dom.window.Element],
      ["Node", dom.window.Node],
      ["SVGElement", dom.window.SVGElement],
      ["SVGRectElement", dom.window.SVGElement],
      ["Event", dom.window.Event],
      ["KeyboardEvent", dom.window.KeyboardEvent],
      ["getComputedStyle", dom.window.getComputedStyle.bind(dom.window)],
      ["ResizeObserver", undefined],
      [
        "requestAnimationFrame",
        (callback: FrameRequestCallback) => setTimeout(() => callback(0), 16),
      ],
      ["cancelAnimationFrame", (id: number) => clearTimeout(id)],
    ]);
    for (const [name, value] of browserGlobals) {
      originalGlobals.set(
        name,
        Object.getOwnPropertyDescriptor(globalThis, name)
      );
      Object.defineProperty(globalThis, name, {
        configurable: true,
        writable: true,
        value,
      });
    }
    jest.useFakeTimers();
    hostWidth = 1200;
    viewportWidth = 690;
    observe = jest.fn();
    disconnect = jest.fn();
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      writable: true,
      value: jest.fn((callback: ResizeObserverCallback) => {
        notifyResize = () => callback([], {} as ResizeObserver);
        return { observe, disconnect };
      }),
    });
    // Layout measurement is a browser boundary: jsdom does not lay out boxes.
    jest
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockImplementation(function (this: HTMLElement) {
        return this.classList.contains("tu-notation-viewport")
          ? viewportWidth
          : hostWidth;
      });
  });

  afterEach(() => {
    for (const editor of editors.splice(0)) editor.dispose();
    jest.restoreAllMocks();
    jest.useRealTimers();
    dom.window.close();
    for (const [name, descriptor] of originalGlobals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
    originalGlobals.clear();
  });

  function mount(config: TabUIConfig = {}) {
    const root = document.createElement("div");
    root.style.padding = "0px";
    document.body.appendChild(root);
    const { score, bar } = scoreGraph();
    const editor = new editorConstructor(root, score, config);
    editors.push(editor);
    editor.init();
    const svg = required(root.querySelector<SVGSVGElement>(".tu-root-svg"));
    const beat = required(bar.getVoiceBar(1)).beats[0];
    const frets = () =>
      required(beat.notes).map((v) => {
        if (!(v instanceof guitarNoteConstructor))
          throw new Error("Expected a guitar note");
        return v.fret;
      });
    return { root, editor, svg, frets };
  }

  function flushResize() {
    notifyResize();
    jest.advanceTimersByTime(20);
  }

  function expectRenderedWidth(root: HTMLDivElement, width: number) {
    const svg = required(root.querySelector<SVGSVGElement>(".tu-root-svg"));
    expect(Number(svg.getAttribute("width"))).toBe(width);
    expect(Number(svg.getAttribute("height"))).toBeGreaterThan(0);
    expect(svg.querySelectorAll("path, line, text").length).toBeGreaterThan(0);
  }

  test("applies configured panel placement and visibility to the shell", () => {
    const { root } = mount({
      panels: {
        score: { visible: false, placement: TabUIScorePanelPlacement.Bottom },
        side: { placement: TabUISidePanelPlacement.Right },
      },
    });
    expect(root.classList.contains("tu-score-panel-bottom")).toBe(true);
    expect(root.classList.contains("tu-side-controls-right")).toBe(true);
    expect(
      required(root.querySelector<HTMLElement>(".tu-top-controls-host")).hidden
    ).toBe(true);
    expect(
      required(root.querySelector<HTMLElement>(".tu-side-controls-host")).hidden
    ).toBe(false);
    expect(
      root.querySelector('[aria-label="Collapse side panel"]')
    ).not.toBeNull();
  });

  test("collapses and expands visible side controls with layout refresh", () => {
    const { root, editor } = mount();
    const toggle = required(
      root.querySelector<HTMLButtonElement>(
        '[aria-label="Collapse side panel"]'
      )
    );
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    viewportWidth = 810;
    toggle.click();
    expect(root.classList.contains("tu-side-controls-collapsed")).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-label")).toBe("Expand side panel");
    expect(editor.getState().layout.width).toBe(786);
    expectRenderedWidth(root, 810);
    viewportWidth = 690;
    toggle.click();
    expect(root.classList.contains("tu-side-controls-collapsed")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-label")).toBe("Collapse side panel");
    expect(editor.getState().layout.width).toBe(666);
    expectRenderedWidth(root, 690);
  });

  test("supports an initially collapsed side panel", () => {
    const { root } = mount({ panels: { side: { initiallyCollapsed: true } } });
    expect(root.classList.contains("tu-score-panel-top")).toBe(true);
    expect(root.classList.contains("tu-side-controls-left")).toBe(true);
    expect(root.classList.contains("tu-side-controls-collapsed")).toBe(true);
    const toggle = required(
      root.querySelector<HTMLButtonElement>('[aria-label="Expand side panel"]')
    );
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    toggle.click();
    expect(root.classList.contains("tu-side-controls-collapsed")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  test("rolls collapse state back when a layout-change subscriber throws", () => {
    const { root, editor } = mount();
    const toggle = required(
      root.querySelector<HTMLButtonElement>(
        '[aria-label="Collapse side panel"]'
      )
    );
    const failure = new Error("layout listener failed");
    const errors: unknown[] = [];
    dom.window.addEventListener("error", (event) => {
      errors.push(event.error);
      event.preventDefault();
    });
    const unsubscribe = editor.subscribe(() => {
      throw failure;
    });
    viewportWidth = 810;
    toggle.click();
    expect(errors).toEqual([failure]);
    expect(root.classList.contains("tu-side-controls-collapsed")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-label")).toBe("Collapse side panel");
    expectRenderedWidth(root, 690);
    unsubscribe();
    toggle.click();
    expect(root.classList.contains("tu-side-controls-collapsed")).toBe(true);
    expectRenderedWidth(root, 810);
  });

  test("does not mount a toggle for a non-collapsible side panel", () => {
    const { root } = mount({ panels: { side: { collapsible: false } } });
    const side = required(
      root.querySelector<HTMLElement>(".tu-side-controls-host")
    );
    expect(side.hidden).toBe(false);
    expect(side.querySelector(".tu-side-controls")).not.toBeNull();
    expect(side.querySelector('[aria-label="Collapse side panel"]')).toBeNull();
    expect(side.querySelector('[aria-label="Expand side panel"]')).toBeNull();
  });

  test("removes the toggle listener when unbound", () => {
    const { root, editor } = mount();
    const toggle = required(
      root.querySelector<HTMLButtonElement>(
        '[aria-label="Collapse side panel"]'
      )
    );
    const changes = jest.fn();
    editor.subscribe(changes);
    editor.dispose();
    toggle.click();
    expect(root.childElementCount).toBe(0);
    expect(root.classList.contains("tu-side-controls-collapsed")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(changes).not.toHaveBeenCalled();
  });

  test("applies layout config and explicit width override", () => {
    const { editor, root } = mount({
      layout: {
        width: 640,
        noteTextSize: 14,
        timeSigTextSize: 52,
        tempoTextSize: 26,
        durationsHeight: 40,
        horizontalPadding: 18,
      },
    });
    expect(editor.layoutDimensions.width).toBe(640);
    expect(editor.layoutDimensions.noteTextSize).toBe(14);
    expect(editor.layoutDimensions.timeSigTextSize).toBe(52);
    expect(editor.layoutDimensions.tempoTextSize).toBe(26);
    expect(editor.layoutDimensions.durationsHeight).toBe(40);
    expect(editor.layoutDimensions.horizontalPadding).toBe(18);
    // 640 content pixels and two 18-pixel margins.
    expectRenderedWidth(root, 676);
  });

  test("measures notation host width instead of full root width", () => {
    const { editor, root } = mount();
    // 690 viewport pixels minus two 12-pixel notation margins.
    expect(editor.getState().layout.width).toBe(666);
    expectRenderedWidth(root, 690);
  });

  test("refreshes layout with an explicit width and publishes the new size", () => {
    const { editor, root } = mount();
    const listener = jest.fn();
    editor.subscribe(listener);
    editor.refreshLayout(720);
    expect(editor.getState().layout.width).toBe(720);
    expectRenderedWidth(root, 744);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      type: "change",
      state: expect.objectContaining({
        layout: expect.objectContaining({ width: 720 }),
      }),
    });
  });

  test("coalesces responsive viewport observations using the latest width", () => {
    const { editor, root, svg } = mount();
    expect(observe).toHaveBeenCalledWith(
      root.querySelector(".tu-notation-viewport")
    );
    const listener = jest.fn();
    editor.subscribe(listener);
    viewportWidth = 740;
    notifyResize();
    viewportWidth = 780;
    notifyResize();
    expect(editor.getState().layout.width).toBe(666);
    jest.advanceTimersByTime(20);
    expect(editor.getState().layout.width).toBe(756);
    expectRenderedWidth(root, 780);
    expect(root.querySelector(".tu-root-svg")).toBe(svg);
    expect(listener).toHaveBeenCalledTimes(1);
    flushResize();
    expect(listener).toHaveBeenCalledTimes(1);
    editor.dispose();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  test("enforces responsive blocked and view-only modes from host width", () => {
    hostWidth = 490;
    viewportWidth = 490;
    const { root, frets } = mount();
    const viewport = required(
      root.querySelector<HTMLElement>(".tu-notation-viewport")
    );
    const message = required(
      root.querySelector<HTMLElement>(".tu-responsive-message")
    );
    const key = () =>
      viewport.dispatchEvent(
        new KeyboardEvent("keydown", { key: "5", bubbles: true })
      );
    expect(root.classList.contains("tu-responsive-blocked")).toBe(true);
    expect(message.hidden).toBe(false);
    viewport.focus();
    expect(document.activeElement).toBe(viewport);
    key();
    expect(frets()).toEqual([null, null, null, null, null, null]);

    hostWidth = 700;
    viewportWidth = 700;
    flushResize();
    expect(root.classList.contains("tu-responsive-view-only")).toBe(true);
    expect(message.hidden).toBe(true);
    viewport.focus();
    expect(document.activeElement).toBe(viewport);
    key();
    expect(frets()).toEqual([null, null, null, null, null, null]);

    hostWidth = 1000;
    viewportWidth = 1000;
    flushResize();
    expect(root.classList.contains("tu-responsive-view-only")).toBe(false);
    viewport.focus();
    expect(document.activeElement).toBe(viewport);
    key();
    expect(frets()).toEqual([5, null, null, null, null, null]);
    expectRenderedWidth(root, 1000);

    const dialog = required(root.querySelector(".tu-tempo-dialog"));
    for (const width of [700, 490]) {
      hostWidth = 1000;
      viewportWidth = 1000;
      flushResize();
      const tempo = required(root.querySelector('[id^="tempo-img-"]'));
      tempo.dispatchEvent(
        new dom.window.MouseEvent("click", { bubbles: true })
      );
      expect(dialog.hasAttribute("open")).toBe(true);
      hostWidth = width;
      viewportWidth = width;
      flushResize();
      expect(dialog.hasAttribute("open")).toBe(false);
    }
  });

  test("mounts a blocked editor below the view-only threshold", () => {
    hostWidth = 280;
    viewportWidth = 280;
    const { editor, root } = mount();
    expect(editor.layoutDimensions.width).toBe(256);
    expect(root.classList.contains("tu-responsive-blocked")).toBe(true);
    const message = required(
      root.querySelector<HTMLElement>(".tu-responsive-message")
    );
    expect(message.hidden).toBe(false);
    expect(message.textContent).toContain("too small");
  });

  test("ignores transient invalid responsive widths and later recovers", () => {
    const { editor, root } = mount();
    const listener = jest.fn();
    editor.subscribe(listener);
    viewportWidth = 0;
    flushResize();
    expect(editor.getState().layout.width).toBe(666);
    expect(listener).not.toHaveBeenCalled();
    viewportWidth = 300;
    flushResize();
    expect(editor.getState().layout.width).toBe(276);
    expectRenderedWidth(root, 300);
    expect(listener).toHaveBeenCalledTimes(1);
    viewportWidth = 720;
    flushResize();
    expect(editor.getState().layout.width).toBe(696);
    expectRenderedWidth(root, 720);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  test("rolls back when responsive observer setup fails", () => {
    jest.mocked(ResizeObserver).mockImplementationOnce(() => ({
      observe: () => {
        throw new Error("observe failed");
      },
      unobserve: jest.fn(),
      disconnect,
    }));
    const root = document.createElement("div");
    const editor = new editorConstructor(root, scoreGraph().score);
    expect(() => editor.init()).toThrow("observe failed");
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(root.childElementCount).toBe(0);
    expect(() => editor.getState()).toThrow("TabUIEditor already disposed");
    const restored = new editorConstructor(root, scoreGraph().score);
    editors.push(restored);
    restored.init();
    expectRenderedWidth(root, 690);
  });

  test("observes responsive interaction without resizing configured widths", () => {
    const { editor, root } = mount({ layout: { width: 640 } });
    hostWidth = 639;
    viewportWidth = 800;
    flushResize();
    expect(root.classList.contains("tu-responsive-blocked")).toBe(true);
    expect(editor.getState().layout.width).toBe(640);
    hostWidth = 640;
    flushResize();
    expect(root.classList.contains("tu-responsive-blocked")).toBe(false);
    expectRenderedWidth(root, 664);
  });

  test("cancels pending responsive work during disposal", () => {
    const { editor, root, svg } = mount();
    const cancel = jest.spyOn(globalThis, "cancelAnimationFrame");
    const listener = jest.fn();
    editor.subscribe(listener);
    viewportWidth = 760;
    notifyResize();
    editor.dispose();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    notifyResize();
    jest.advanceTimersByTime(20);
    expect(root.childElementCount).toBe(0);
    expect(Number(svg.getAttribute("width"))).toBe(690);
    expect(listener).not.toHaveBeenCalled();
  });

  test("falls back to a coalesced window resize listener", () => {
    Reflect.deleteProperty(globalThis, "ResizeObserver");
    const removeListener = jest.spyOn(window, "removeEventListener");
    const { editor, root } = mount();
    const listener = jest.fn();
    editor.subscribe(listener);
    viewportWidth = 750;
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("resize"));
    expect(editor.getState().layout.width).toBe(666);
    jest.advanceTimersByTime(20);
    expect(editor.getState().layout.width).toBe(726);
    expectRenderedWidth(root, 750);
    expect(listener).toHaveBeenCalledTimes(1);
    editor.dispose();
    expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function));
    const request = jest.spyOn(globalThis, "requestAnimationFrame");
    window.dispatchEvent(new Event("resize"));
    expect(request).not.toHaveBeenCalled();
  });

  test("keeps configured layout width fixed during measured refresh", () => {
    const { editor, root } = mount({ layout: { width: 640 } });
    viewportWidth = 880;
    editor.refreshLayout();
    expect(editor.getState().layout.width).toBe(640);
    expectRenderedWidth(root, 664);
  });

  test("restores the previous width when a change listener throws", () => {
    const { editor, root } = mount();
    const unsubscribe = editor.subscribe(() => {
      throw new Error("listener failed");
    });
    expect(() => editor.refreshLayout(720)).toThrow("listener failed");
    expect(editor.layoutDimensions.width).toBe(666);
    expectRenderedWidth(root, 690);
    unsubscribe();
    editor.refreshLayout(720);
    expect(editor.getState().layout.width).toBe(720);
    expectRenderedWidth(root, 744);
  });

  test("restores captured dimensions when a change listener disposes and throws", () => {
    const { editor, root } = mount();
    const dimensions = editor.layoutDimensions;
    editor.subscribe(() => {
      editor.dispose();
      throw new Error("listener failed");
    });
    expect(() => editor.refreshLayout(720)).toThrow("listener failed");
    expect(dimensions.width).toBe(666);
    expect(root.childElementCount).toBe(0);
    expect(() => editor.getState()).toThrow("TabUIEditor already disposed");
  });

  test.each([-1, NaN, Infinity])(
    "rejects invalid refresh width %p before changing layout",
    (width) => {
      const { editor, root } = mount();
      const initialState = editor.getState();
      const listener = jest.fn();
      editor.subscribe(listener);
      expect(() => editor.refreshLayout(width)).toThrow(
        "non-negative finite number"
      );
      expect(editor.getState()).toBe(initialState);
      expect(editor.layoutDimensions.width).toBe(666);
      expectRenderedWidth(root, 690);
      expect(listener).not.toHaveBeenCalled();
    }
  );
});
