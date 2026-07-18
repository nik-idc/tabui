import { EditorMouseDefCallbacks } from "../../src/notation/input/editor-mouse-callbacks";
import { RenderType } from "../../src/notation/input/render-type";
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
  let activeVoiceNumber = 1;
  let isPlaying = false;
  const beatElement = {
    beat: { voiceBar: { voiceNumber: 1 } },
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
  const notationComponent = {
    renderer,
    trackController: {
      selectNoteElement: jest.fn(),
      selectBeat: jest.fn(),
      clearSelection: jest.fn(),
      restartPlayerFromBeat: jest.fn(),
      get isPlaying() {
        return isPlaying;
      },
      get activeVoiceNumber() {
        return activeVoiceNumber;
      },
      setActiveVoiceNumber(voiceNumber: number) {
        activeVoiceNumber = voiceNumber;
      },
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
    notationComponent,
    renderFunc,
    setActiveVoiceNumber: (voiceNumber: number) => {
      activeVoiceNumber = voiceNumber;
    },
    setIsPlaying: (value: boolean) => {
      isPlaying = value;
    },
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
    const { callbacks, noteElement, renderer, notationComponent, renderFunc } =
      createHarness();

    callbacks.onNoteClick(createMouseEvent(10, 10), noteElement);
    expect(renderer.hideSelectionPreview).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.selectNoteElement
    ).toHaveBeenCalledWith(noteElement);
    expect(renderFunc).toHaveBeenCalledWith(RenderType.SelectionRefresh);

    callbacks.onNoteMouseEnter(createMouseEvent(10, 10), noteElement);
    expect(renderer.showSelectionPreview).toHaveBeenCalledWith(noteElement);

    callbacks.onNoteMouseLeave(createMouseEvent(10, 10), noteElement);
    expect(renderer.hideSelectionPreview).toHaveBeenCalledTimes(2);
  });

  test("note click refreshes visible notation when active voice changes", () => {
    const {
      callbacks,
      noteElement,
      notationComponent,
      renderFunc,
      setActiveVoiceNumber,
    } = createHarness();
    setActiveVoiceNumber(2);
    notationComponent.trackController.selectNoteElement.mockImplementation(() =>
      setActiveVoiceNumber(1)
    );

    callbacks.onNoteClick(createMouseEvent(10, 10), noteElement);

    expect(renderFunc).toHaveBeenCalledWith(RenderType.ActiveVoiceSelection);
  });

  test("clicking notes and beats during playback seeks without selecting", () => {
    const {
      callbacks,
      beatElement,
      noteElement,
      notationComponent,
      renderFunc,
      setIsPlaying,
    } = createHarness();
    setIsPlaying(true);

    callbacks.onNoteClick(createMouseEvent(10, 10), noteElement);
    callbacks.onBeatClick(createMouseEvent(20, 10), beatElement);

    expect(
      notationComponent.trackController.selectNoteElement
    ).not.toHaveBeenCalled();
    expect(notationComponent.trackController.selectBeat).not.toHaveBeenCalled();
    expect(
      notationComponent.trackController.restartPlayerFromBeat
    ).toHaveBeenNthCalledWith(1, beatElement);
    expect(
      notationComponent.trackController.restartPlayerFromBeat
    ).toHaveBeenNthCalledWith(2, beatElement);
    expect(renderFunc).toHaveBeenCalledTimes(2);
    expect(renderFunc).toHaveBeenCalledWith(RenderType.SelectionRefresh);
  });

  test("playback prevents drag selection from starting or changing selection", () => {
    const {
      callbacks,
      beatElement,
      noteElement,
      notationComponent,
      renderFunc,
      setIsPlaying,
    } = createHarness();
    const dragController = {
      begin: jest.fn(),
      handleMove: jest.fn(),
      reset: jest.fn(),
      isSelectingBeats: false,
      isDragPending: false,
    };
    (callbacks as any)._selectionDragController = dragController;
    setIsPlaying(true);

    callbacks.onNoteMouseDown(createMouseEvent(1, 2), noteElement);
    callbacks.onBeatMouseDown(createMouseEvent(1, 2), beatElement);
    callbacks.onBeatMouseMove(createMouseEvent(20, 2), beatElement);
    callbacks.onNoteMouseEnter(createMouseEvent(20, 2), noteElement);

    expect(dragController.begin).not.toHaveBeenCalled();
    expect(dragController.handleMove).not.toHaveBeenCalled();
    expect(
      notationComponent.trackController.clearSelection
    ).not.toHaveBeenCalled();
    expect(notationComponent.trackController.selectBeat).not.toHaveBeenCalled();
    expect(renderFunc).not.toHaveBeenCalled();
  });

  test("drag-selection behavior routes through the drag controller state machine", () => {
    const {
      callbacks,
      beatElement,
      noteElement,
      notationComponent,
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
    expect(
      notationComponent.trackController.clearSelection
    ).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.selectBeat
    ).toHaveBeenNthCalledWith(1, beatElement);
    expect(renderFunc).toHaveBeenNthCalledWith(1, RenderType.DragSelection);
    expect(
      notationComponent.trackController.selectBeat
    ).toHaveBeenNthCalledWith(2, beatElement);

    callbacks.onBeatMouseMove(createMouseEvent(7, 8), beatElement);
    expect(
      notationComponent.trackController.selectBeat
    ).toHaveBeenNthCalledWith(3, beatElement);

    callbacks.onBeatMouseUp();
    expect(dragController.reset).toHaveBeenCalledTimes(1);
  });

  test("bind and unbind manage global, delegated, and note renderer listeners without leaks", () => {
    const { callbacks, noteElement, renderer, notationComponent, renderFunc } =
      createHarness();
    const noteRenderer = createRendererBackedNoteRenderer(noteElement);
    const win = (globalThis as any).window;

    callbacks.bind([noteRenderer]);
    callbacks.bind([noteRenderer]);

    expect(win.addEventListener).toHaveBeenCalledTimes(1);
    expect(renderer.attachBeatInteractionEvent).toHaveBeenCalledTimes(4);
    expect(noteRenderer.attachMouseEvent).toHaveBeenCalledTimes(5);

    noteRenderer.trigger("click", createMouseEvent(10, 10));
    expect(
      notationComponent.trackController.selectNoteElement
    ).toHaveBeenCalledWith(noteElement);
    expect(renderFunc).toHaveBeenCalledWith(RenderType.SelectionRefresh);

    const noteSelectionCallsBeforeUnbind =
      notationComponent.trackController.selectNoteElement.mock.calls.length;
    callbacks.unbind();
    expect(win.removeEventListener).toHaveBeenCalledTimes(1);
    expect(renderer.detachBeatInteractionEvent).toHaveBeenCalledTimes(4);
    expect(noteRenderer.detachMouseEvent).toHaveBeenCalledTimes(5);
    expect(noteRenderer.hasHandler("click")).toBe(false);

    noteRenderer.trigger("click", createMouseEvent(20, 20));
    expect(
      notationComponent.trackController.selectNoteElement
    ).toHaveBeenCalledTimes(noteSelectionCallsBeforeUnbind);

    callbacks.bind([noteRenderer]);
    expect(win.addEventListener).toHaveBeenCalledTimes(2);
    expect(noteRenderer.attachMouseEvent).toHaveBeenCalledTimes(10);
  });

  test("bind reconciles stale note renderers when the active renderer set changes", () => {
    const { callbacks, noteElement, notationComponent } = createHarness();
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
      notationComponent.trackController.selectNoteElement.mock.calls.length;
    oldRenderer.trigger("click", createMouseEvent(30, 30));
    expect(
      notationComponent.trackController.selectNoteElement
    ).toHaveBeenCalledTimes(selectedCallsBeforeOldTrigger);

    newRenderer.trigger("click", createMouseEvent(40, 40));
    expect(
      notationComponent.trackController.selectNoteElement
    ).toHaveBeenCalledTimes(selectedCallsBeforeOldTrigger + 1);
  });
});
