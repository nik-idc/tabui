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
    constructor() {}
  }

  return { UICallbacks: MockUICallbacks };
});

describe("TabUICallbacks", () => {
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
});
