import { EditorMouseDefCallbacks } from "../../../src/notation/input/editor-mouse-callbacks";
import { RenderType } from "../../../src/notation/input/render-type";
import { SVGTabNoteRenderer } from "../../../src/notation/render/svg/svg-tab-note-renderer";
import { SVGTechniqueLabelRenderer } from "../../../src/notation/render/svg/svg-technique-label-renderer";
import { GuitarTechniqueType } from "../../../src/notation/model";
import { SVGBarRenderer } from "../../../src/notation/render/svg/svg-bar-renderer";
import { SVGTrackLineInfoRenderer } from "../../../src/notation/render/svg/svg-track-line-info-renderer";
import { SVGTupletRenderer } from "../../../src/notation/render/svg/tuplet/svg-tuplet-renderer";

class TestElement {
  closest = jest.fn();
}

function createMouseEvent(
  x: number,
  y: number,
  buttons: number = 1
): MouseEvent {
  return {
    pageX: x,
    pageY: y,
    buttons,
    button: 0,
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
  let playbackState = "idle";
  const beatElement = {
    beat: { voiceBar: { voiceNumber: 1 } },
    boundingBox: { width: 40 },
    rect: { width: 40 },
  } as any;
  const noteElement = { beatElement } as any;
  beatElement.noteElements = [noteElement];
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
        return playbackState;
      },
      get isPlaybackActive() {
        return playbackState !== "idle";
      },
      get activeVoiceNumber() {
        return activeVoiceNumber;
      },
      setActiveVoiceNumber(voiceNumber: number) {
        activeVoiceNumber = voiceNumber;
      },
      editingEnabled: true,
      insertBeatAfterSelected: jest.fn(),
      removeTechniques: jest.fn().mockReturnValue(true),
    },
  } as any;
  const renderFunc = jest.fn();
  const uiComponent = {
    sideComponent: {
      measureControlsComponent: {
        showTempoControls: jest.fn(),
        showTimeSigControls: jest.fn(),
      },
      noteControlsComponent: { showTupletControls: jest.fn() },
    },
  } as any;
  const callbacks = new EditorMouseDefCallbacks(
    uiComponent,
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
    uiComponent,
    setActiveVoiceNumber: (voiceNumber: number) => {
      activeVoiceNumber = voiceNumber;
    },
    setIsPlaying: (value: boolean) => {
      playbackState = value ? "playing" : "idle";
    },
    setPlaybackState: (value: string) => {
      playbackState = value;
    },
  };
}

describe("EditorMouseDefCallbacks", () => {
  test.each([
    "onTempoClicked",
    "onTimeSignatureClicked",
    "onTupletClick",
  ] as const)("%s throws when the clicked context has no beats", (method) => {
    const { callbacks, uiComponent, renderFunc } = createHarness();
    expect(() =>
      callbacks[method](createMouseEvent(0, 0), {
        beatElements: [],
      } as any)
    ).toThrow("Clicked notation has no beat");
    expect(renderFunc).not.toHaveBeenCalled();
    expect(
      uiComponent.sideComponent.measureControlsComponent.showTempoControls
    ).not.toHaveBeenCalled();
    expect(
      uiComponent.sideComponent.measureControlsComponent.showTimeSigControls
    ).not.toHaveBeenCalled();
    expect(
      uiComponent.sideComponent.noteControlsComponent.showTupletControls
    ).not.toHaveBeenCalled();
  });

  test.each([
    "onTempoClicked",
    "onTimeSignatureClicked",
    "onTupletClick",
  ] as const)("%s throws when the clicked beat has no note slots", (method) => {
    const { callbacks, renderFunc } = createHarness();
    expect(() =>
      callbacks[method](createMouseEvent(0, 0), {
        beatElements: [
          { beat: { voiceBar: { voiceNumber: 1 } }, noteElements: [] },
        ],
      } as any)
    ).toThrow("Clicked notation's beat has no note slots");
    expect(renderFunc).not.toHaveBeenCalled();
  });

  test.each(["tempo", "timeSignature"] as const)(
    "%s clicks select the clicked bar before opening the dialog",
    (dialog) => {
      const {
        callbacks,
        uiComponent,
        notationComponent,
        noteElement,
        beatElement,
        renderFunc,
      } = createHarness();
      const otherVoice = { beat: { voiceBar: { voiceNumber: 2 } } };
      const callback =
        dialog === "tempo"
          ? callbacks.onTempoClicked.bind(callbacks)
          : callbacks.onTimeSignatureClicked.bind(callbacks);
      callback(createMouseEvent(0, 0), {
        beatElements: [otherVoice, beatElement],
      } as any);
      expect(
        notationComponent.trackController.selectNoteElement
      ).toHaveBeenCalledWith(noteElement);
      expect(renderFunc).toHaveBeenCalledWith(RenderType.SelectionRefresh);
      const controls = uiComponent.sideComponent.measureControlsComponent;
      expect(
        dialog === "tempo"
          ? controls.showTempoControls
          : controls.showTimeSigControls
      ).toHaveBeenCalledTimes(1);
    }
  );

  test("complete tuplets replace old selection with their full group", () => {
    const { callbacks, uiComponent, notationComponent, beatElement } =
      createHarness();
    const last = { noteElements: [{}] };
    callbacks.onTupletClick(createMouseEvent(0, 0), {
      beatElements: [beatElement, last],
    } as any);
    expect(
      notationComponent.trackController.clearSelection
    ).toHaveBeenCalledTimes(1);
    expect(notationComponent.trackController.selectBeat.mock.calls).toEqual([
      [beatElement],
      [last],
    ]);
    expect(
      uiComponent.sideComponent.noteControlsComponent.showTupletControls
    ).toHaveBeenCalledTimes(1);
  });

  test("incomplete tuplet labels select only their corresponding beat", () => {
    const { callbacks, uiComponent, notationComponent, beatElement } =
      createHarness();
    const note = {};
    const last = { noteElements: [note] };
    callbacks.onTupletClick(
      createMouseEvent(0, 0),
      {
        beatElements: [beatElement, last],
      } as any,
      1
    );
    expect(
      notationComponent.trackController.selectNoteElement
    ).toHaveBeenCalledWith(note);
    expect(notationComponent.trackController.selectBeat).not.toHaveBeenCalled();
    expect(
      uiComponent.sideComponent.noteControlsComponent.showTupletControls
    ).toHaveBeenCalledTimes(1);
  });

  test.each(["secondary", "playing", "view-only"])(
    "notation dialogs reject %s clicks without changing selection",
    (mode) => {
      const {
        callbacks,
        uiComponent,
        notationComponent,
        beatElement,
        setIsPlaying,
        renderFunc,
      } = createHarness();
      if (mode === "playing") setIsPlaying(true);
      if (mode === "view-only")
        notationComponent.trackController.editingEnabled = false;
      const event = { button: mode === "secondary" ? 2 : 0 } as MouseEvent;
      callbacks.onTempoClicked(event, { beatElements: [beatElement] } as any);
      callbacks.onTimeSignatureClicked(event, {
        beatElements: [beatElement],
      } as any);
      callbacks.onTupletClick(event, { beatElements: [beatElement] } as any);
      expect(
        notationComponent.trackController.selectNoteElement
      ).not.toHaveBeenCalled();
      expect(
        notationComponent.trackController.selectBeat
      ).not.toHaveBeenCalled();
      expect(renderFunc).not.toHaveBeenCalled();
      expect(
        uiComponent.sideComponent.measureControlsComponent.showTempoControls
      ).not.toHaveBeenCalled();
      expect(
        uiComponent.sideComponent.measureControlsComponent.showTimeSigControls
      ).not.toHaveBeenCalled();
      expect(
        uiComponent.sideComponent.noteControlsComponent.showTupletControls
      ).not.toHaveBeenCalled();
    }
  );

  test.each([SVGBarRenderer, SVGTrackLineInfoRenderer, SVGTupletRenderer])(
    "notation dialog bindings reconcile and unbind without duplicates",
    (Renderer) => {
      const { callbacks } = createHarness();
      const renderer = Object.create(Renderer.prototype);
      renderer.attachMouseEvent = jest.fn();
      renderer.detachMouseEvent = jest.fn();
      callbacks.bind([renderer]);
      callbacks.bind([renderer]);
      expect(renderer.attachMouseEvent).toHaveBeenCalledTimes(1);
      callbacks.bind([]);
      expect(renderer.detachMouseEvent).toHaveBeenCalledWith("click");
      callbacks.bind([renderer]);
      callbacks.unbind();
      expect(renderer.detachMouseEvent).toHaveBeenCalledTimes(2);
    }
  );

  test("shared labels remove only matching notes from their owning beat", () => {
    const { callbacks, notationComponent, renderFunc } = createHarness();
    const notes = [true, false, true].map((hasTechnique) => ({
      hasTechnique: jest.fn().mockReturnValue(hasTechnique),
    }));
    const label = {
      technique: { type: GuitarTechniqueType.PalmMute, note: notes[0] },
      beatElement: { beat: { notes } },
    } as any;
    callbacks.onLabelClick(createMouseEvent(0, 0), label);
    expect(
      notationComponent.trackController.removeTechniques
    ).toHaveBeenCalledWith([notes[0], notes[2]], GuitarTechniqueType.PalmMute);
    expect(renderFunc).toHaveBeenCalledWith(RenderType.Full);
    expect(
      notationComponent.trackController.selectNoteElement
    ).not.toHaveBeenCalled();
  });

  test("bend label clicks do not remove techniques", () => {
    const { callbacks, notationComponent } = createHarness();
    const notes = [{}, {}];
    callbacks.onLabelClick(createMouseEvent(0, 0), {
      technique: { type: GuitarTechniqueType.Bend, note: notes[1] },
      beatElement: { beat: { notes } },
    } as any);
    expect(
      notationComponent.trackController.removeTechniques
    ).not.toHaveBeenCalled();
  });

  test("label clicks ignore secondary buttons and render only successful edits", () => {
    const { callbacks, notationComponent, renderFunc } = createHarness();
    const label = {
      technique: { type: GuitarTechniqueType.PalmMute, note: {} },
      beatElement: { beat: { notes: [] } },
    } as any;
    callbacks.onLabelClick({ button: 2 } as MouseEvent, label);
    expect(
      notationComponent.trackController.removeTechniques
    ).not.toHaveBeenCalled();
    notationComponent.trackController.removeTechniques.mockReturnValue(false);
    callbacks.onLabelClick(createMouseEvent(0, 0), label);
    expect(renderFunc).not.toHaveBeenCalled();
  });

  test("label renderer bindings reconcile and unbind without duplicates", () => {
    const { callbacks } = createHarness();
    const renderer = Object.create(SVGTechniqueLabelRenderer.prototype);
    renderer.techniqueLabelElement = {
      technique: { type: GuitarTechniqueType.PalmMute },
    };
    renderer.attachMouseEvent = jest.fn();
    renderer.detachMouseEvent = jest.fn();
    callbacks.bind([renderer]);
    callbacks.bind([renderer]);
    expect(renderer.attachMouseEvent).toHaveBeenCalledTimes(1);
    callbacks.bind([]);
    expect(renderer.detachMouseEvent).toHaveBeenCalledWith("click");
    callbacks.bind([renderer]);
    callbacks.unbind();
    expect(renderer.detachMouseEvent).toHaveBeenCalledTimes(2);
    renderer.techniqueLabelElement = {
      technique: { type: GuitarTechniqueType.Bend },
    };
    callbacks.bind([renderer]);
    expect(renderer.attachMouseEvent).toHaveBeenCalledTimes(2);
  });

  let originalWindow: any;
  let originalElement: any;

  beforeEach(() => {
    originalWindow = (globalThis as any).window;
    originalElement = (globalThis as any).Element;
    (globalThis as any).window = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    (globalThis as any).Element = TestElement;
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    (globalThis as any).Element = originalElement;
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

    expect(callbacks.isSelectingBeats).toBe(false);
    callbacks.onNotePointerDown(createMouseEvent(10, 10), noteElement);
    expect(callbacks.isSelectingBeats).toBe(false);
    callbacks.onNotePointerMove(createMouseEvent(30, 10), noteElement);
    expect(callbacks.isSelectingBeats).toBe(true);
    callbacks.onWindowPointerUp({ ...createMouseEvent(30, 10), button: 2 });
    expect(callbacks.isSelectingBeats).toBe(true);
    renderFunc.mockClear();
    callbacks.onWindowPointerUp(createMouseEvent(30, 10, 0));
    expect(callbacks.isSelectingBeats).toBe(false);
    expect(renderFunc).toHaveBeenCalledWith(RenderType.DragSelection);

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

  test("ordinary idle beat clicks are no-ops", () => {
    const { callbacks, beatElement, notationComponent, renderFunc } =
      createHarness();

    callbacks.onBeatClick(createMouseEvent(20, 10), beatElement);

    expect(
      notationComponent.trackController.restartPlayerFromBeat
    ).not.toHaveBeenCalled();
    expect(renderFunc).not.toHaveBeenCalled();
  });

  test("paused playback clicks seek without selecting", () => {
    const { callbacks, beatElement, notationComponent, setPlaybackState } =
      createHarness();
    setPlaybackState("paused");

    callbacks.onBeatClick(createMouseEvent(20, 10), beatElement);

    expect(
      notationComponent.trackController.restartPlayerFromBeat
    ).toHaveBeenCalledWith(beatElement.beat);
  });

  test("end-gap click inserts after the clicked bar's last active beat", () => {
    const { callbacks, notationComponent, renderFunc } = createHarness();
    const lastBeat = { uuid: 7 } as any;
    const voiceBar = {
      voiceNumber: 1,
      beats: [lastBeat],
      actualTicks: 4,
      barTicks: 16,
    };
    lastBeat.voiceBar = voiceBar;
    const beatElement = { beat: lastBeat } as any;
    const gap = new TestElement();
    gap.closest.mockReturnValue({});

    callbacks.onBeatClick(
      { ...createMouseEvent(10, 10), target: gap } as unknown as MouseEvent,
      beatElement
    );

    expect(
      notationComponent.trackController.insertBeatAfterSelected
    ).toHaveBeenCalledWith(beatElement.beat);
    expect(renderFunc).toHaveBeenCalledWith(RenderType.Full);
  });

  test.each(["playing", "paused"])(
    "end-gap click during %s seeks the supplied last beat without insertion",
    (playbackState) => {
      const { callbacks, notationComponent, renderFunc, setPlaybackState } =
        createHarness();
      const lastBeat = { uuid: 7 } as any;
      lastBeat.voiceBar = {
        voiceNumber: 1,
        beats: [lastBeat],
        actualTicks: 4,
        barTicks: 16,
      };
      const target = new TestElement();
      target.closest.mockReturnValue({});
      setPlaybackState(playbackState);

      callbacks.onBeatClick(
        { ...createMouseEvent(10, 10), target } as unknown as MouseEvent,
        { beat: lastBeat } as any
      );

      expect(
        notationComponent.trackController.restartPlayerFromBeat
      ).toHaveBeenCalledWith(lastBeat);
      expect(
        notationComponent.trackController.insertBeatAfterSelected
      ).not.toHaveBeenCalled();
      expect(renderFunc).toHaveBeenCalledWith(RenderType.SelectionRefresh);
    }
  );

  test.each(["full", "overflow", "read-only", "voice", "button"])(
    "ignores an ineligible end-gap click: %s",
    (reason) => {
      const { callbacks, notationComponent, setIsPlaying, renderFunc } =
        createHarness();
      const beat = { uuid: 7 } as any;
      beat.voiceBar = {
        voiceNumber: reason === "voice" ? 2 : 1,
        beats: [beat],
        actualTicks: reason === "full" ? 16 : reason === "overflow" ? 20 : 4,
        barTicks: 16,
      };
      setIsPlaying(reason === "playback");
      notationComponent.trackController.editingEnabled = reason !== "read-only";
      const target = new TestElement();
      target.closest.mockReturnValue({});
      callbacks.onBeatClick(
        {
          ...createPointerEvent(10, 10),
          button: reason === "button" ? 2 : 0,
          target,
        } as unknown as MouseEvent,
        { beat } as any
      );
      expect(
        notationComponent.trackController.insertBeatAfterSelected
      ).not.toHaveBeenCalled();
      expect(
        notationComponent.trackController.restartPlayerFromBeat
      ).not.toHaveBeenCalled();
      expect(renderFunc).not.toHaveBeenCalled();
    }
  );

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

    callbacks.onNotePointerDown(createMouseEvent(1, 2), noteElement);
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

    callbacks.onNotePointerDown(createMouseEvent(1, 2), noteElement);
    expect(dragController.begin).toHaveBeenCalledWith(
      noteElement.beatElement,
      { x: 1, y: 2 },
      0
    );

    callbacks.onBeatPointerMove(createMouseEvent(5, 6), beatElement);
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

    callbacks.onBeatPointerMove(createMouseEvent(7, 8), beatElement);
    expect(
      notationComponent.trackController.selectBeat
    ).toHaveBeenNthCalledWith(3, beatElement);

    callbacks.onBeatPointerUp(createMouseEvent(7, 8));
    expect(dragController.finish).toHaveBeenCalledWith(0);
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

  test("pointer events do not start or update drag selection", () => {
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

    expect(dragController.begin).not.toHaveBeenCalled();
    expect(dragController.handleMove).not.toHaveBeenCalled();
    expect(dragController.finish).not.toHaveBeenCalled();
    expect(
      notationComponent.trackController.clearSelection
    ).not.toHaveBeenCalled();
  });
});
