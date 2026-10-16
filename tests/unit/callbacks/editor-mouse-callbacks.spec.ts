import { EditorMouseDefCallbacks } from "../../../src/notation/input/editor-mouse-callbacks";
import { RenderType } from "../../../src/notation/input/render-type";
import { SVGTabNoteRenderer } from "../../../src/notation/render/svg/svg-tab-note-renderer";
import { SVGTechniqueLabelRenderer } from "../../../src/notation/render/svg/svg-technique-label-renderer";
import { GuitarTechniqueLabelElement } from "../../../src/notation/controller/element/technique/guitar-technique/guitar-technique-label-element";
import {
  BarRepeatStatus,
  BendTechniqueOptions,
  BendType,
  DEFAULT_MASTER_BAR,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
} from "../../../src/notation/model";
import { SVGBarRenderer } from "../../../src/notation/render/svg/svg-bar-renderer";
import { SVGTrackLineInfoRenderer } from "../../../src/notation/render/svg/svg-track-line-info-renderer";
import { SVGTupletRenderer } from "../../../src/notation/render/svg/tuplet/svg-tuplet-renderer";
import { BarTupletGroupElement } from "../../../src/notation/controller/element/bar/bar-tuplet-group-element";
import { SVGTabBeatRhythmRenderer } from "../../../src/notation/render/svg/svg-tab-beat-rhythm-renderer";
import { SVGBeamSegmentRenderer } from "../../../src/notation/render/svg/svg-beam-segment-renderer";
import type { TabNoteSlotElement } from "../../../src/notation/controller/element/note/tab-note-slot-element";
import { JSDOM } from "jsdom";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { NoteDuration } from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { required } from "../required";
import { TabBeatRhythmElement } from "../../../src/notation/controller/element/beat/tab-beat-rhythm-element";
import { BeamSegmentElement } from "../../../src/notation/controller/element/bar/beam-segment-element";
import { PlaybackState, type ScorePlayer } from "../../../src/player";

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

function createRendererBackedNoteRenderer(noteElement: TabNoteSlotElement) {
  type NoteMouseHandler = (
    event: MouseEvent,
    noteElement: TabNoteSlotElement
  ) => void;
  const handlers = new Map<string, NoteMouseHandler>();
  const renderer = Object.create(SVGTabNoteRenderer.prototype) as any;
  renderer.noteElement = noteElement;
  renderer.attachMouseEvent = jest.fn(
    (eventType: string, handler: NoteMouseHandler) => {
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
      setRepeatStatus: jest.fn().mockReturnValue(true),
      setBeatDots: jest.fn().mockReturnValue(true),
    },
  } as any;
  const renderFunc = jest.fn();
  const uiComponent = {
    sideComponent: {
      measureControlsComponent: {
        showTempoControls: jest.fn(),
        showTimeSigControls: jest.fn(),
        showRepeatCountControls: jest.fn(),
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
  function createRhythmHarness(playbackState = PlaybackState.Idle) {
    const { track, beats } = createBarWithBeats(
      Array.from({ length: 6 }, () => ({ baseDuration: NoteDuration.Eighth })),
      { ...DEFAULT_MASTER_BAR, beatsCount: 6, duration: NoteDuration.Eighth }
    );
    // Only the transport state is supplied; selection and edits use the real controller.
    const player = { playbackState } as ScorePlayer;
    const controller = new TrackController(
      track,
      TEST_LAYOUT_DIMENSIONS,
      player
    );
    controller.trackElement.update();
    const firstBeat = required(
      controller.trackElement.getBeatElement(beats[0])
    );
    const nodes = firstBeat.barElement.refreshOwnedNotationNodes();
    const rhythms = nodes.filter(
      (v): v is TabBeatRhythmElement => v instanceof TabBeatRhythmElement
    );
    const beams = nodes.filter(
      (v): v is BeamSegmentElement => v instanceof BeamSegmentElement
    );
    const notationOwner = {
      trackController: controller,
      renderer: { hideSelectionPreview() {} },
    } as ConstructorParameters<typeof EditorMouseDefCallbacks>[1];
    const renderFunc = jest.fn();
    const callbacks = new EditorMouseDefCallbacks(
      {} as ConstructorParameters<typeof EditorMouseDefCallbacks>[0],
      notationOwner,
      renderFunc
    );
    return { controller, beats, rhythms, beams, callbacks, renderFunc };
  }

  test("stem and flags select only their beat, including in view-only mode", () => {
    const { callbacks, controller, beats, rhythms, renderFunc } =
      createRhythmHarness();
    controller.selectBeat(
      required(controller.trackElement.getBeatElement(beats[0]))
    );
    controller.selectBeat(
      required(controller.trackElement.getBeatElement(beats[5]))
    );
    controller.setEditingEnabled(false);

    callbacks.onDurationClick(createMouseEvent(0, 0), rhythms[1]);

    expect(controller.selectionAsBeats).toEqual([beats[1]]);
    expect(renderFunc).toHaveBeenCalledWith(RenderType.SelectionRefresh);
  });

  test("dots clear the clicked beat without changing selection", () => {
    const { callbacks, controller, beats, rhythms, renderFunc } =
      createRhythmHarness();
    beats[0].dots = 2;
    controller.selectNoteElement(
      required(controller.trackElement.getBeatElement(beats[5])).noteElements[2]
    );
    const cursor = controller.selectionCursor;

    callbacks.onDotsClick(createMouseEvent(0, 0), rhythms[0]);

    expect(beats.map((v) => v.dots)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(controller.selectionCursor).toBe(cursor);
    expect(controller.selectionCursor?.beat).toBe(beats[5]);
    expect(controller.selectionCursor?.noteIndex).toBe(2);
    expect(renderFunc).toHaveBeenCalledWith(RenderType.Full);
    renderFunc.mockClear();
    callbacks.onDotsClick(createMouseEvent(0, 0), rhythms[0]);
    expect(renderFunc).not.toHaveBeenCalled();
    controller.undo();
    expect(beats[0].dots).toBe(2);
    expect(controller.selectionCursor).toBe(cursor);
    expect(controller.selectionCursor?.beat).toBe(beats[5]);
    expect(controller.selectionCursor?.noteIndex).toBe(2);
  });

  test("any beam segment selects the full group, not adjacent groups", () => {
    const { callbacks, controller, beats, beams } = createRhythmHarness();
    const firstGroup = beats.slice(0, 3);
    const secondGroup = beats.slice(3);
    controller.setEditingEnabled(false);
    expect(
      beams.some((v) => firstGroup.some((b) => b === v.curBeatElement.beat))
    ).toBe(true);
    expect(
      beams.some((v) => secondGroup.some((b) => b === v.curBeatElement.beat))
    ).toBe(true);
    for (const beam of beams) {
      callbacks.onBeamClick(createMouseEvent(0, 0), beam);
      expect(controller.selectionAsBeats).toEqual(
        firstGroup.some((v) => v === beam.curBeatElement.beat)
          ? firstGroup
          : secondGroup
      );
    }
  });

  test.each(["starting", "playing", "secondary"])(
    "rhythm selection and dot edits reject %s",
    (mode) => {
      const state =
        mode === "starting"
          ? PlaybackState.Starting
          : mode === "playing"
            ? PlaybackState.Playing
            : PlaybackState.Idle;
      const { callbacks, controller, beats, rhythms, beams, renderFunc } =
        createRhythmHarness(state);
      beats[0].dots = 2;
      const selection = controller.selectionAsBeats;
      const event = { button: mode === "secondary" ? 2 : 0 } as MouseEvent;
      callbacks.onDurationClick(event, rhythms[5]);
      callbacks.onDotsClick(event, rhythms[0]);
      callbacks.onBeamClick(event, required(beams[0]));
      expect(controller.selectionAsBeats).toEqual(selection);
      expect(beats[0].dots).toBe(2);
      expect(renderFunc).not.toHaveBeenCalled();
    }
  );

  test("repeat-start clicks remove the clicked mark and preserve selection", () => {
    const { callbacks, notationComponent, renderFunc } = createHarness();
    const bar = { bar: {} } as any;
    callbacks.onRepeatStartClicked(createMouseEvent(0, 0), bar);
    expect(
      notationComponent.trackController.setRepeatStatus
    ).toHaveBeenCalledWith(bar.bar, {
      status: BarRepeatStatus.Start,
      enabled: false,
    });
    expect(
      notationComponent.trackController.selectNoteElement
    ).not.toHaveBeenCalled();
    expect(renderFunc).toHaveBeenCalledWith(RenderType.Full);
    renderFunc.mockClear();
    notationComponent.trackController.setRepeatStatus.mockReturnValue(false);
    callbacks.onRepeatStartClicked(createMouseEvent(0, 0), bar);
    callbacks.onRepeatStartClicked({ button: 2 } as MouseEvent, bar);
    expect(
      notationComponent.trackController.setRepeatStatus
    ).toHaveBeenCalledTimes(2);
    expect(renderFunc).not.toHaveBeenCalled();
  });

  test("repeat-end clicks select the clicked bar before opening its dialog", () => {
    const {
      callbacks,
      beatElement,
      noteElement,
      uiComponent,
      notationComponent,
    } = createHarness();
    callbacks.onRepeatEndClicked(createMouseEvent(0, 0), {
      beatElements: [beatElement],
    } as any);
    expect(
      notationComponent.trackController.selectNoteElement
    ).toHaveBeenCalledWith(noteElement);
    expect(
      uiComponent.sideComponent.measureControlsComponent.showRepeatCountControls
    ).toHaveBeenCalledTimes(1);
  });

  test.each([
    "onTempoClicked",
    "onTimeSignatureClicked",
    "onRepeatEndClicked",
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
    "onRepeatEndClicked",
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
    const { callbacks, notationComponent } = createHarness();
    const settings = { normalCount: 3, tupletCount: 2 };
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth, tupletSettings: settings },
      { baseDuration: NoteDuration.Eighth, tupletSettings: settings },
      { baseDuration: NoteDuration.Eighth, tupletSettings: settings },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    controller.trackElement.update();
    const beatElement = required(
      controller.trackElement.getBeatElement(beats[1])
    );
    const tuplet = required(
      beatElement.barElement
        .refreshOwnedNotationNodes()
        .find(
          (e): e is BarTupletGroupElement => e instanceof BarTupletGroupElement
        )
    );
    expect(controller.selectionAsBeats).toEqual([beats[0]]);

    callbacks.onTupletClick(createMouseEvent(0, 0), tuplet);

    expect(controller.selectionAsBeats).toEqual(beats.slice(1));
  });

  test("incomplete tuplet labels select only their corresponding beat", () => {
    const { callbacks, notationComponent } = createHarness();
    const settings = { normalCount: 3, tupletCount: 2 };
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth, tupletSettings: settings },
      { baseDuration: NoteDuration.Eighth, tupletSettings: settings },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    notationComponent.trackController = controller;
    controller.trackElement.update();
    const beatElement = required(
      controller.trackElement.getBeatElement(beats[1])
    );
    const tuplet = required(
      beatElement.barElement
        .refreshOwnedNotationNodes()
        .find(
          (e): e is BarTupletGroupElement => e instanceof BarTupletGroupElement
        )
    );

    callbacks.onTupletClick(createMouseEvent(0, 0), tuplet, 1);

    expect(controller.selectionAsBeats).toEqual([beats[2]]);
    expect(controller.selectionCursor?.beat).toBe(beats[2]);
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
      callbacks.onRepeatEndClicked(event, {
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
      expect(
        uiComponent.sideComponent.measureControlsComponent
          .showRepeatCountControls
      ).not.toHaveBeenCalled();
    }
  );

  test.each([
    SVGBarRenderer,
    SVGTrackLineInfoRenderer,
    SVGTupletRenderer,
    SVGTabBeatRhythmRenderer,
    SVGBeamSegmentRenderer,
  ])(
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

  describe("technique label removal", () => {
    function setupLabel(type = GuitarTechniqueType.PalmMute) {
      const { track, beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter },
      ]);
      const notes = required(beats[0].notes) as GuitarNote[];
      const otherNote = required(beats[1].notes)[0] as GuitarNote;
      for (const note of [notes[0], notes[2], otherNote]) {
        note.fret = 5;
        const options =
          type === GuitarTechniqueType.Bend
            ? new BendTechniqueOptions({
                type: BendType.Bend,
                bendPitch: 1,
                bendDuration: 1,
              })
            : null;
        note.addTechnique(new GuitarTechnique(note, type, options));
      }
      notes[1].fret = 7;
      notes[1].addTechnique(
        new GuitarTechnique(notes[1], GuitarTechniqueType.NaturalHarmonic)
      );
      const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
      controller.trackElement.update();
      controller.selectNoteElement(
        required(controller.trackElement.getBeatElement(beats[1]))
          .noteElements[0]
      );
      const label = required(
        controller.trackElement.trackLineElements[0].drawableNotationElements.find(
          (v) =>
            v instanceof GuitarTechniqueLabelElement &&
            v.technique.note === notes[0]
        )
      );
      if (!(label instanceof GuitarTechniqueLabelElement)) {
        throw Error("Expected technique label");
      }
      const harness = createHarness();
      harness.notationComponent.trackController = controller;
      return { ...harness, controller, notes, otherNote, label };
    }

    test("shared labels remove only matching notes from their owning beat", () => {
      const { callbacks, controller, notes, otherNote, label, renderFunc } =
        setupLabel();
      callbacks.onLabelClick(createMouseEvent(0, 0), label);

      expect(
        notes.map((v) => v.hasTechnique(GuitarTechniqueType.PalmMute))
      ).toEqual([false, false, false, false, false, false]);
      expect(notes[1].hasTechnique(GuitarTechniqueType.NaturalHarmonic)).toBe(
        true
      );
      expect(otherNote.hasTechnique(GuitarTechniqueType.PalmMute)).toBe(true);
      expect(controller.selectionCursor?.note).toBe(otherNote);
      expect(renderFunc).toHaveBeenCalledWith(RenderType.Full);

      controller.undo();
      expect(
        notes.map((v) => v.hasTechnique(GuitarTechniqueType.PalmMute))
      ).toEqual([true, false, true, false, false, false]);
      controller.redo();
      expect(notes[0].hasTechnique(GuitarTechniqueType.PalmMute)).toBe(false);
      expect(notes[2].hasTechnique(GuitarTechniqueType.PalmMute)).toBe(false);
      expect(controller.selectionCursor?.note).toBe(otherNote);
    });

    test("bend label clicks do not remove techniques", () => {
      const { callbacks, notes, label, renderFunc } = setupLabel(
        GuitarTechniqueType.Bend
      );
      callbacks.onLabelClick(createMouseEvent(0, 0), label);
      expect(notes[0].hasTechnique(GuitarTechniqueType.Bend)).toBe(true);
      expect(notes[2].hasTechnique(GuitarTechniqueType.Bend)).toBe(true);
      expect(renderFunc).not.toHaveBeenCalled();
    });

    test("label clicks ignore secondary buttons and render only successful edits", () => {
      const { callbacks, controller, notes, label, renderFunc } = setupLabel();
      callbacks.onLabelClick({ button: 2 } as MouseEvent, label);
      expect(notes[0].hasTechnique(GuitarTechniqueType.PalmMute)).toBe(true);
      expect(renderFunc).not.toHaveBeenCalled();

      callbacks.onLabelClick(createMouseEvent(0, 0), label);
      expect(notes[0].hasTechnique(GuitarTechniqueType.PalmMute)).toBe(false);
      expect(renderFunc).toHaveBeenCalledTimes(1);
      callbacks.onLabelClick(createMouseEvent(0, 0), label);
      expect(renderFunc).toHaveBeenCalledTimes(1);
      controller.undo();
      expect(notes[0].hasTechnique(GuitarTechniqueType.PalmMute)).toBe(true);
    });

    test("label renderer bindings reconcile and unbind without duplicates", () => {
      const { callbacks, controller, notes, label, renderFunc } = setupLabel();
      const dom = new JSDOM();
      const previousDocument = globalThis.document;
      globalThis.document = dom.window.document;
      try {
        const renderer = new SVGTechniqueLabelRenderer(controller, label, {
          baseUrl: "/assets",
          variant: "light",
        });
        const click = () =>
          renderer
            .ensureContainerGroup()
            .dispatchEvent(new dom.window.MouseEvent("click"));
        callbacks.bind([renderer]);
        callbacks.bind([renderer]);
        click();
        expect(notes[0].hasTechnique(GuitarTechniqueType.PalmMute)).toBe(false);
        expect(renderFunc).toHaveBeenCalledTimes(1);
        controller.undo();

        callbacks.bind([]);
        click();
        expect(notes[0].hasTechnique(GuitarTechniqueType.PalmMute)).toBe(true);
        callbacks.bind([renderer]);
        click();
        expect(notes[0].hasTechnique(GuitarTechniqueType.PalmMute)).toBe(false);
        expect(renderFunc).toHaveBeenCalledTimes(2);
        controller.undo();

        callbacks.unbind();
        click();
        expect(notes[0].hasTechnique(GuitarTechniqueType.PalmMute)).toBe(true);
        expect(renderFunc).toHaveBeenCalledTimes(2);
      } finally {
        callbacks.unbind();
        globalThis.document = previousDocument;
        dom.window.close();
      }
    });
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

  function clickEndGap(
    callbacks: EditorMouseDefCallbacks,
    beatElement: Parameters<EditorMouseDefCallbacks["onBeatClick"]>[1],
    button = 0
  ): void {
    const dom = new JSDOM('<div data-bar-end-gap-uuid="1"></div>');
    const previousElement = globalThis.Element;
    globalThis.Element = dom.window.Element;
    try {
      const gap = required(dom.window.document.querySelector("div"));
      const event = new dom.window.MouseEvent("click", {
        bubbles: true,
        button,
      });
      gap.dispatchEvent(event);
      callbacks.onBeatClick(event, beatElement);
    } finally {
      globalThis.Element = previousElement;
      dom.window.close();
    }
  }

  function createEndGapCallbacks(controller: TrackController) {
    const renderFunc = jest.fn();
    const uiOwner = {} as ConstructorParameters<
      typeof EditorMouseDefCallbacks
    >[0];
    const notationOwner = {
      trackController: controller,
    } as ConstructorParameters<typeof EditorMouseDefCallbacks>[1];
    const callbacks = new EditorMouseDefCallbacks(
      uiOwner,
      notationOwner,
      renderFunc
    );
    return { callbacks, renderFunc };
  }

  test("end-gap click inserts after the clicked bar's last active beat", () => {
    const { track, bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const { callbacks, renderFunc } = createEndGapCallbacks(controller);
    controller.trackElement.update();
    const lastBeat = beats[1];
    const beatElement = required(
      controller.trackElement.getBeatElement(lastBeat)
    );
    const voiceBar = required(bar.getVoiceBar(1));
    clickEndGap(callbacks, beatElement);

    expect(voiceBar.beats).toHaveLength(3);
    expect(voiceBar.beats[0]).toBe(beats[0]);
    expect(voiceBar.beats[1]).toBe(lastBeat);
    expect(controller.selectionCursor?.beat).toBe(voiceBar.beats[2]);
    expect(renderFunc).toHaveBeenCalledWith(RenderType.Full);

    controller.undo();
    expect(voiceBar.beats).toEqual(beats);
    controller.redo();
    expect(voiceBar.beats).toHaveLength(3);
  });

  test.each(["full", "overflow", "read-only", "voice", "button"])(
    "ignores an ineligible end-gap click: %s",
    (reason) => {
      const count = reason === "full" ? 4 : reason === "overflow" ? 5 : 1;
      const { track, bar } = createBarWithBeats(
        Array.from({ length: count }, () => ({
          baseDuration: NoteDuration.Quarter,
        }))
      );
      const voiceBar =
        reason === "voice"
          ? bar.insertVoiceBar(2)
          : required(bar.getVoiceBar(1));
      const originalBeats = [...voiceBar.beats];
      const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
      const { callbacks, renderFunc } = createEndGapCallbacks(controller);
      controller.setEditingEnabled(reason !== "read-only");
      controller.trackElement.update();
      const beatElement = required(
        controller.trackElement.getBeatElement(
          voiceBar.beats[voiceBar.beats.length - 1]
        )
      );
      const selectedBeat = controller.selectionCursor?.beat;
      clickEndGap(callbacks, beatElement, reason === "button" ? 2 : 0);

      expect(voiceBar.beats).toEqual(originalBeats);
      expect(controller.selectionCursor?.beat).toBe(selectedBeat);
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
