import { EditorMouseDefCallbacks } from "../../src/callbacks/editor/editor-mouse-callbacks";
import { RenderType } from "../../src/callbacks/render-type";
import { SVGTabNoteRenderer } from "../../src/notation/render/svg/svg-tab-note-renderer";

function createMouseEvent(
  x: number,
  y: number,
  buttons: number = 1
): MouseEvent {
  return {
    pageX: x,
    pageY: y,
    buttons,
  } as MouseEvent;
}

function createRendererBackedNoteRenderer(noteElement: any) {
  const handlers = new Map<string, Function>();
  const renderer = Object.create(SVGTabNoteRenderer.prototype) as any;
  renderer.noteElement = noteElement;
  renderer.attachMouseEvent = jest.fn(
    (eventType: string, handler: Function) => {
      handlers.set(eventType, handler);
    }
  );
  renderer.detachMouseEvent = jest.fn((eventType: string) => {
    handlers.delete(eventType);
  });
  renderer.detachAllMouseEvents = jest.fn(() => {
    handlers.clear();
  });
  renderer.trigger = (eventType: string, event: MouseEvent) => {
    handlers.get(eventType)?.(event, noteElement);
  };
  renderer.hasHandler = (eventType: string) => handlers.has(eventType);
  return renderer;
}

function createHarness() {
  const beatElement = {
    boundingBox: { width: 40 },
    rect: { width: 40 },
  } as any;
  const noteElement = { beatElement } as any;
  const renderer = {
    showSelectionPreview: jest.fn(),
    hideSelectionPreview: jest.fn(),
    attachBeatInteractionEvent: jest.fn(),
    detachBeatInteractionEvent: jest.fn(),
  };
  const trackControllerEditor = {
    selectNoteElement: jest.fn(),
    selectBeat: jest.fn(),
    clearSelection: jest.fn(),
  };
  const notationComponent = {
    renderer,
    trackController: {
      trackControllerEditor,
    },
  } as any;
  const renderFunc = jest.fn();
  const callbacks = new EditorMouseDefCallbacks(
    {} as any,
    notationComponent,
    renderFunc
  );

  return {
    callbacks,
    beatElement,
    noteElement,
    renderer,
    trackControllerEditor,
    renderFunc,
  };
}

describe("EditorMouseDefCallbacks", () => {
  let originalWindow: any;

  beforeEach(() => {
    originalWindow = (globalThis as any).window;
    (globalThis as any).window = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    jest.restoreAllMocks();
  });

  test("note click and hover behavior update preview and selection correctly", () => {
    const {
      callbacks,
      noteElement,
      renderer,
      trackControllerEditor,
      renderFunc,
    } = createHarness();

    callbacks.onNoteClick(createMouseEvent(10, 10), noteElement);
    expect(renderer.hideSelectionPreview).toHaveBeenCalledTimes(1);
    expect(trackControllerEditor.selectNoteElement).toHaveBeenCalledWith(
      noteElement
    );
    expect(renderFunc).toHaveBeenCalledWith(RenderType.NoteSelection);

    callbacks.onNoteMouseEnter(createMouseEvent(10, 10), noteElement);
    expect(renderer.showSelectionPreview).toHaveBeenCalledWith(noteElement);

    callbacks.onNoteMouseLeave(createMouseEvent(10, 10), noteElement);
    expect(renderer.hideSelectionPreview).toHaveBeenCalledTimes(2);
  });

  test("drag-selection behavior routes through the drag controller state machine", () => {
    const {
      callbacks,
      beatElement,
      noteElement,
      trackControllerEditor,
      renderFunc,
    } = createHarness();
    const dragController = {
      begin: jest.fn(),
      handleMove: jest
        .fn()
        .mockReturnValueOnce({
          startedSelection: true,
          shouldSelectCurrentBeat: true,
          anchorBeat: beatElement,
        })
        .mockReturnValueOnce({
          startedSelection: false,
          shouldSelectCurrentBeat: true,
        }),
      reset: jest.fn(),
      isSelectingBeats: false,
      isDragPending: false,
    };
    (callbacks as any)._selectionDragController = dragController;

    callbacks.onNoteMouseDown(createMouseEvent(1, 2), noteElement);
    expect(dragController.begin).toHaveBeenCalledWith(noteElement.beatElement, {
      x: 1,
      y: 2,
    });

    callbacks.onBeatMouseMove(createMouseEvent(5, 6), beatElement);
    expect(trackControllerEditor.clearSelection).toHaveBeenCalledTimes(1);
    expect(trackControllerEditor.selectBeat).toHaveBeenNthCalledWith(
      1,
      beatElement
    );
    expect(renderFunc).toHaveBeenNthCalledWith(1, RenderType.DragSelection);
    expect(trackControllerEditor.selectBeat).toHaveBeenNthCalledWith(
      2,
      beatElement
    );

    callbacks.onBeatMouseMove(createMouseEvent(7, 8), beatElement);
    expect(trackControllerEditor.selectBeat).toHaveBeenNthCalledWith(
      3,
      beatElement
    );

    callbacks.onBeatMouseUp();
    expect(dragController.reset).toHaveBeenCalledTimes(1);
  });

  test("bind and unbind manage global, delegated, and note renderer listeners without leaks", () => {
    const {
      callbacks,
      noteElement,
      renderer,
      trackControllerEditor,
      renderFunc,
    } = createHarness();
    const noteRenderer = createRendererBackedNoteRenderer(noteElement);
    const win = (globalThis as any).window;

    callbacks.bind([noteRenderer]);
    callbacks.bind([noteRenderer]);

    expect(win.addEventListener).toHaveBeenCalledTimes(1);
    expect(renderer.attachBeatInteractionEvent).toHaveBeenCalledTimes(3);
    expect(noteRenderer.attachMouseEvent).toHaveBeenCalledTimes(5);

    noteRenderer.trigger("click", createMouseEvent(10, 10));
    expect(trackControllerEditor.selectNoteElement).toHaveBeenCalledWith(
      noteElement
    );
    expect(renderFunc).toHaveBeenCalledWith(RenderType.NoteSelection);

    const noteSelectionCallsBeforeUnbind =
      trackControllerEditor.selectNoteElement.mock.calls.length;
    callbacks.unbind();
    expect(win.removeEventListener).toHaveBeenCalledTimes(1);
    expect(renderer.detachBeatInteractionEvent).toHaveBeenCalledTimes(3);
    expect(noteRenderer.detachMouseEvent).toHaveBeenCalledTimes(5);
    expect(noteRenderer.hasHandler("click")).toBe(false);

    noteRenderer.trigger("click", createMouseEvent(20, 20));
    expect(trackControllerEditor.selectNoteElement).toHaveBeenCalledTimes(
      noteSelectionCallsBeforeUnbind
    );

    callbacks.bind([noteRenderer]);
    expect(win.addEventListener).toHaveBeenCalledTimes(2);
    expect(noteRenderer.attachMouseEvent).toHaveBeenCalledTimes(10);
  });

  test("bind reconciles stale note renderers when the active renderer set changes", () => {
    const { callbacks, noteElement, trackControllerEditor } = createHarness();
    const oldRenderer = createRendererBackedNoteRenderer(noteElement);
    const newRenderer = createRendererBackedNoteRenderer(noteElement);

    callbacks.bind([oldRenderer]);
    expect(oldRenderer.attachMouseEvent).toHaveBeenCalledTimes(5);
    expect(oldRenderer.hasHandler("click")).toBe(true);

    callbacks.bind([newRenderer]);
    expect(oldRenderer.detachMouseEvent).toHaveBeenCalledTimes(5);
    expect(oldRenderer.hasHandler("click")).toBe(false);
    expect(newRenderer.attachMouseEvent).toHaveBeenCalledTimes(5);
    expect(newRenderer.hasHandler("click")).toBe(true);

    const selectedCallsBeforeOldTrigger =
      trackControllerEditor.selectNoteElement.mock.calls.length;
    oldRenderer.trigger("click", createMouseEvent(30, 30));
    expect(trackControllerEditor.selectNoteElement).toHaveBeenCalledTimes(
      selectedCallsBeforeOldTrigger
    );

    newRenderer.trigger("click", createMouseEvent(40, 40));
    expect(trackControllerEditor.selectNoteElement).toHaveBeenCalledTimes(
      selectedCallsBeforeOldTrigger + 1
    );
  });
});
