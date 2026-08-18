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

function createPointerEvent(
  x: number,
  y: number,
  pointerId: number = 1,
  pointerType: string = "mouse",
  isPrimary: boolean = true
): PointerEvent {
  return {
    pageX: x,
    pageY: y,
    pointerId,
    pointerType,
    isPrimary,
    button: 0,
  } as PointerEvent;
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
      get playbackState() {
        return isPlaying ? "playing" : "idle";
      },
      get isPlaybackActive() {
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

    callbacks.onNotePointerEnter(createPointerEvent(10, 10), noteElement);
    expect(renderer.showSelectionPreview).toHaveBeenCalledWith(noteElement);

    callbacks.onNotePointerLeave(createPointerEvent(10, 10), noteElement);
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

  test("note click extends a range initiated through the anchor control", () => {
    const { callbacks, noteElement, notationComponent, renderFunc } =
      createHarness();
    notationComponent.trackController.hasExplicitSelectionAnchor = true;

    callbacks.onNoteClick(createMouseEvent(10, 10), noteElement);

    expect(notationComponent.trackController.selectBeat).toHaveBeenCalledWith(
      noteElement.beatElement
    );
    expect(
      notationComponent.trackController.selectNoteElement
    ).not.toHaveBeenCalled();
    expect(renderFunc).toHaveBeenCalledWith(RenderType.SelectionRefresh);
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
    ).toHaveBeenNthCalledWith(1, beatElement.beat);
    expect(
      notationComponent.trackController.restartPlayerFromBeat
    ).toHaveBeenNthCalledWith(2, beatElement.beat);
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

    callbacks.onNotePointerDown(createPointerEvent(1, 2), noteElement);
    callbacks.onBeatPointerDown(createPointerEvent(1, 2), beatElement);
    callbacks.onBeatPointerMove(createPointerEvent(20, 2), beatElement);
    callbacks.onNotePointerEnter(createPointerEvent(20, 2), noteElement);

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
      finish: jest.fn().mockReturnValue(true),
      reset: jest.fn(),
      isSelectingBeats: false,
      isDragPending: false,
    };
    (callbacks as any)._selectionDragController = dragController;

    callbacks.onNotePointerDown(createPointerEvent(1, 2), noteElement);
    expect(dragController.begin).toHaveBeenCalledWith(
      noteElement.beatElement,
      { x: 1, y: 2 },
      1
    );

    callbacks.onBeatPointerMove(createPointerEvent(5, 6), beatElement);
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

    callbacks.onBeatPointerMove(createPointerEvent(7, 8), beatElement);
    expect(
      notationComponent.trackController.selectBeat
    ).toHaveBeenNthCalledWith(3, beatElement);

    callbacks.onBeatPointerUp(createPointerEvent(7, 8));
    expect(dragController.finish).toHaveBeenCalledWith(1);
  });

  test("idle global pointerup does not render", () => {
    const { callbacks, renderFunc } = createHarness();

    callbacks.onBeatPointerUp(createPointerEvent(1, 1));

    expect(renderFunc).not.toHaveBeenCalled();
  });

  test("bind and unbind manage global, delegated, and note renderer listeners without leaks", () => {
    const { callbacks, noteElement, renderer, notationComponent, renderFunc } =
      createHarness();
    const noteRenderer = createRendererBackedNoteRenderer(noteElement);
    const win = (globalThis as any).window;

    callbacks.bind([noteRenderer]);
    callbacks.bind([noteRenderer]);

    expect(win.addEventListener).toHaveBeenCalledTimes(2);
    expect(renderer.attachBeatInteractionEvent).toHaveBeenCalledTimes(5);
    expect(noteRenderer.attachMouseEvent).toHaveBeenCalledTimes(5);

    noteRenderer.trigger("click", createMouseEvent(10, 10));
    expect(
      notationComponent.trackController.selectNoteElement
    ).toHaveBeenCalledWith(noteElement);
    expect(renderFunc).toHaveBeenCalledWith(RenderType.SelectionRefresh);

    const noteSelectionCallsBeforeUnbind =
      notationComponent.trackController.selectNoteElement.mock.calls.length;
    callbacks.unbind();
    expect(win.removeEventListener).toHaveBeenCalledTimes(2);
    expect(renderer.detachBeatInteractionEvent).toHaveBeenCalledTimes(5);
    expect(noteRenderer.detachMouseEvent).toHaveBeenCalledTimes(5);
    expect(noteRenderer.hasHandler("click")).toBe(false);

    noteRenderer.trigger("click", createMouseEvent(20, 20));
    expect(
      notationComponent.trackController.selectNoteElement
    ).toHaveBeenCalledTimes(noteSelectionCallsBeforeUnbind);

    callbacks.bind([noteRenderer]);
    expect(win.addEventListener).toHaveBeenCalledTimes(4);
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

  test("touch and pen drags use their owning pointer only", () => {
    const { callbacks, beatElement, notationComponent } = createHarness();
    const dragController = {
      begin: jest.fn(),
      handleMove: jest.fn().mockReturnValue({
        startedSelection: false,
        shouldSelectCurrentBeat: false,
      }),
      finish: jest.fn().mockReturnValue(false),
      reset: jest.fn(),
      isSelectingBeats: false,
      isDragPending: false,
    };
    (callbacks as any)._selectionDragController = dragController;

    callbacks.onBeatPointerDown(
      createPointerEvent(1, 2, 7, "touch"),
      beatElement
    );
    callbacks.onBeatPointerDown(
      createPointerEvent(1, 2, 8, "pen", false),
      beatElement
    );
    callbacks.onBeatPointerMove(
      createPointerEvent(4, 2, 7, "touch"),
      beatElement
    );
    callbacks.onBeatPointerUp(createPointerEvent(4, 2, 8, "pen", false));

    expect(dragController.begin).toHaveBeenCalledTimes(1);
    expect(dragController.begin).toHaveBeenCalledWith(
      beatElement,
      { x: 1, y: 2 },
      7
    );
    expect(dragController.handleMove).toHaveBeenCalledWith(
      { x: 4, y: 2 },
      beatElement,
      7
    );
    expect(dragController.finish).toHaveBeenCalledWith(8);
    expect(
      notationComponent.trackController.clearSelection
    ).not.toHaveBeenCalled();
  });
});
