import { TabUIEditor } from "../../src/tabui-editor";
import { NotationComponent } from "../../src/notation/notation-component";
import { UIComponent } from "../../src/ui";
import { TabUICallbacks } from "../../src/tabui-callbacks";

jest.mock("../../src/notation/notation-component", () => ({
  NotationComponent: jest.fn().mockImplementation(() => ({
    loadTrack: jest.fn(),
    dispose: jest.fn(),
  })),
}));

jest.mock("../../src/ui", () => ({
  UIComponent: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
  })),
}));

jest.mock("../../src/tabui-callbacks", () => ({
  TabUICallbacks: jest.fn().mockImplementation(() => ({
    bind: jest.fn(),
    unbind: jest.fn(),
  })),
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
  return { tracks: [{ id: "track" }] } as any;
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
  });
});
