import { TabUICallbacks } from "../../src/tabui-callbacks";
import { RenderType } from "../../src/notation/input";

jest.mock("../../src/notation/input", () => {
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

jest.mock("../../src/ui/ui-callbacks", () => {
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
    } as any;
    const uiComponent = {
      render: jest.fn(),
      topComponent: {},
      sideComponent: {},
    } as any;
    const callbacks = new TabUICallbacks(
      uiComponent,
      notationComponent,
      {} as HTMLDivElement,
      onStateChanged
    );

    return {
      callbacks,
      keyboardCallbacks: (callbacks as any)._keyboardCallbacks,
      uiCallbacks: (callbacks as any)._uiCallbacks,
    };
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
});
