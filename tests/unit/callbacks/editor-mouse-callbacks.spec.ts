import { EditorMouseDefCallbacks } from "../../../src/notation/input/editor-mouse-callbacks";
import { RenderType } from "../../../src/notation/input/render-type";
import { SVGTechniqueLabelRenderer } from "../../../src/notation/render/svg/svg-technique-label-renderer";
import { GuitarTechniqueLabelElement } from "../../../src/notation/controller/element/technique/guitar-technique/guitar-technique-label-element";
import {
  BendTechniqueOptions,
  BendType,
  DEFAULT_MASTER_BAR,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  serializeScore,
} from "../../../src/notation/model";
import { SVGBarRenderer } from "../../../src/notation/render/svg/svg-bar-renderer";
import { SVGTrackLineInfoRenderer } from "../../../src/notation/render/svg/svg-track-line-info-renderer";
import { SVGTupletRenderer } from "../../../src/notation/render/svg/tuplet/svg-tuplet-renderer";
import { BarTupletGroupElement } from "../../../src/notation/controller/element/bar/bar-tuplet-group-element";
import { SVGTabBeatRhythmRenderer } from "../../../src/notation/render/svg/svg-tab-beat-rhythm-renderer";
import { SVGBeamSegmentRenderer } from "../../../src/notation/render/svg/svg-beam-segment-renderer";
import { TabNoteSlotElement } from "../../../src/notation/controller/element/note/tab-note-slot-element";
import { JSDOM } from "jsdom";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { NoteDuration } from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { required } from "../required";
import { TabBeatRhythmElement } from "../../../src/notation/controller/element/beat/tab-beat-rhythm-element";
import { BeamSegmentElement } from "../../../src/notation/controller/element/bar/beam-segment-element";
import { PlaybackState, ScorePlayer } from "../../../src/player";
import {
  installTransportAudio,
  settleTransport,
} from "../player/transport-audio";
import { withNotationDialog } from "./notation-dialog-fixture";
import { EditorSVGRenderer } from "../../../src/notation/render/svg/editor-svg-renderer";
import { withDragSelection } from "./drag-selection-fixture";

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
    const { track, bar, score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    bar.masterBar.isRepeatStart = true;
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();
    notationComponent.trackController = controller;
    const clickedBar = required(
      controller.trackElement.getBeatElement(beats[0])
    ).barElement;
    const otherBar = track.staves[0].bars[1];
    const otherBeat = required(otherBar.getVoiceBar(1)).beats[0];
    const otherElement = required(
      controller.trackElement.getBeatElement(otherBeat)
    );
    controller.selectNoteElement(otherElement.noteElements[2]);
    const cursor = controller.selectionCursor;

    callbacks.onRepeatStartClicked({ button: 2 } as MouseEvent, clickedBar);
    expect(bar.masterBar.isRepeatStart).toBe(true);
    expect(renderFunc).not.toHaveBeenCalled();

    callbacks.onRepeatStartClicked(createMouseEvent(0, 0), clickedBar);
    expect(bar.masterBar.isRepeatStart).toBe(false);
    expect(otherBar.masterBar.isRepeatStart).toBe(false);
    expect(controller.selectionCursor).toBe(cursor);
    expect(controller.selectionCursor?.bar).toBe(otherBar);
    expect(controller.selectionCursor?.noteIndex).toBe(2);
    expect(renderFunc).toHaveBeenCalledWith(RenderType.Full);
    controller.undo();
    expect(bar.masterBar.isRepeatStart).toBe(true);
    expect(controller.selectionCursor).toBe(cursor);
  });

  test.each([
    "onTempoClicked",
    "onTimeSignatureClicked",
    "onRepeatEndClicked",
    "onTupletClick",
  ] as const)("%s throws when the clicked context has no beats", (method) => {
    withNotationDialog(({ controller, notation, ui, host }) => {
      const render = jest.fn();
      const callbacks = new EditorMouseDefCallbacks(
        ui as ConstructorParameters<typeof EditorMouseDefCallbacks>[0],
        notation,
        render
      );
      const cursor = controller.selectionCursor;
      // Deliberately malformed public input exercises the documented error contract.
      expect(() =>
        callbacks[method](createMouseEvent(0, 0), {
          beatElements: [],
        } as unknown as BarTupletGroupElement &
          Parameters<typeof callbacks.onTempoClicked>[1])
      ).toThrow("Clicked notation has no beat");
      expect(controller.selectionCursor).toBe(cursor);
      expect(host.querySelectorAll("[open]")).toHaveLength(0);
      expect(render).not.toHaveBeenCalled();
    });
  });

  test.each([
    "onTempoClicked",
    "onTimeSignatureClicked",
    "onRepeatEndClicked",
    "onTupletClick",
  ] as const)("%s throws when the clicked beat has no note slots", (method) => {
    withNotationDialog(({ controller, notation, ui, host, beats }) => {
      const render = jest.fn();
      const callbacks = new EditorMouseDefCallbacks(
        ui as ConstructorParameters<typeof EditorMouseDefCallbacks>[0],
        notation,
        render
      );
      const cursor = controller.selectionCursor;
      const invalid = { beatElements: [{ beat: beats[0], noteElements: [] }] };
      expect(() =>
        callbacks[method](
          createMouseEvent(0, 0),
          invalid as unknown as BarTupletGroupElement &
            Parameters<typeof callbacks.onTempoClicked>[1]
        )
      ).toThrow("Clicked notation's beat has no note slots");
      expect(controller.selectionCursor).toBe(cursor);
      expect(host.querySelectorAll("[open]")).toHaveLength(0);
      expect(render).not.toHaveBeenCalled();
    });
  });

  test.each(["tempo", "timeSignature"] as const)(
    "%s clicks select the clicked bar before opening the dialog",
    (dialog) => {
      withNotationDialog((f) => {
        const { controller, notation, ui, measure, beats, host } = f;
        controller.setSelectedBarTempo(90);
        controller.setSelectedBarTimeSignature(7, NoteDuration.Eighth);
        controller.setActiveVoiceNumber(2);
        controller.setSelectedNoteFret(8);
        controller.setActiveVoiceNumber(1);
        controller.insertBarAfterSelected();
        controller.selectLastBar();
        controller.setActiveVoiceNumber(2);
        controller.trackElement.update();
        const bar = required(
          controller.trackElement.getBeatElement(beats[0])
        ).barElement;
        const secondVoiceBeat = required(
          bar.beatElements.find((v) => v.beat.voiceBar.voiceNumber === 2)
        );
        const render = jest.fn();
        const callbacks = new EditorMouseDefCallbacks(
          ui as ConstructorParameters<typeof EditorMouseDefCallbacks>[0],
          notation,
          render
        );
        if (dialog === "tempo") {
          callbacks.onTempoClicked(createMouseEvent(0, 0), bar);
        } else {
          callbacks.onTimeSignatureClicked(createMouseEvent(0, 0), bar);
        }
        expect(bar.beatElements[0].beat).toBe(beats[0]);
        expect(controller.activeVoiceNumber).toBe(2);
        expect(controller.selectionCursor?.beat).toBe(secondVoiceBeat.beat);
        expect(controller.selectionCursor?.beat).not.toBe(beats[0]);
        expect(render).toHaveBeenCalledTimes(1);
        expect(render).toHaveBeenCalledWith(RenderType.SelectionRefresh);
        const component =
          dialog === "tempo"
            ? measure.tempoControlsComponent
            : measure.timeSigControlsComponent;
        expect(component.dialog.open).toBe(true);
        expect(host.querySelectorAll("[open]")).toHaveLength(1);
        const values = component.template.dialogContainer.querySelectorAll(
          ".tu-number-stepper-value"
        );
        expect(Array.from(values, (v) => v.textContent)).toEqual(
          dialog === "tempo" ? ["90"] : ["7"]
        );
        if (dialog === "timeSignature") {
          expect(
            measure.timeSigControlsComponent.template.durationSelect.value
          ).toBe("8");
        }
      });
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
      withNotationDialog(({ controller, notation, ui, beats, host }) => {
        const clicked = required(
          controller.trackElement.getBeatElement(beats[1])
        );
        const bar = clicked.barElement;
        controller.selectNoteElement(
          required(controller.trackElement.getBeatElement(beats[0]))
            .noteElements[2]
        );
        const cursor = controller.selectionCursor;
        if (mode === "playing") {
          // Transport is the only supplied state; selection uses the real controller.
          const player = {
            playbackState: PlaybackState.Playing,
          } as ScorePlayer;
          Object.assign(notation, {
            trackController: new TrackController(
              controller.track,
              TEST_LAYOUT_DIMENSIONS,
              player
            ),
          });
        }
        const active = notation.trackController;
        if (mode === "view-only") active.setEditingEnabled(false);
        const before = active.selectionCursor;
        const render = jest.fn();
        const callbacks = new EditorMouseDefCallbacks(
          ui as ConstructorParameters<typeof EditorMouseDefCallbacks>[0],
          notation,
          render
        );
        const event = { button: mode === "secondary" ? 2 : 0 } as MouseEvent;
        callbacks.onTempoClicked(event, bar);
        callbacks.onTimeSignatureClicked(event, bar);
        callbacks.onRepeatEndClicked(event, bar);
        callbacks.onTupletClick(event, {
          beatElements: [clicked],
        } as BarTupletGroupElement);
        expect(active.selectionCursor).toBe(before);
        if (mode !== "playing") expect(active.selectionCursor).toBe(cursor);
        expect(host.querySelectorAll("[open]")).toHaveLength(0);
        expect(render).not.toHaveBeenCalled();
      });
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
      withNotationDialog(({ notation, ui, root, host }) => {
        const { controller, beats } = createRhythmHarness();
        for (const beat of beats.slice(0, 3)) {
          beat.tupletSettings = { normalCount: 3, tupletCount: 2 };
        }
        beats[0].voiceBar.computeBarTupletGroups();
        controller.trackElement.update();
        Object.assign(notation, { trackController: controller });
        const editorRenderer = new EditorSVGRenderer(root, controller, {
          baseUrl: "/assets",
          variant: "light",
        });
        Object.assign(notation, { renderer: editorRenderer });
        const renderers = editorRenderer.render({
          renderNotation: true,
          forceNotation: true,
          overlays: { selection: false, player: false },
        });
        const renderer = renderers.find((v) => v instanceof Renderer);
        if (renderer === undefined) throw Error(`Missing ${Renderer.name}`);
        const render = jest.fn();
        const callbacks = new EditorMouseDefCallbacks(
          ui as ConstructorParameters<typeof EditorMouseDefCallbacks>[0],
          notation,
          render
        );
        const selector =
          Renderer === SVGBarRenderer
            ? ".tu-time-signature text"
            : Renderer === SVGTrackLineInfoRenderer
              ? '[id^="tempo-text-"]'
              : Renderer === SVGTupletRenderer
                ? '[id^="tuplet-complete-text-"]'
                : Renderer === SVGTabBeatRhythmRenderer
                  ? '[id^="beat-rhythm-stem-"]'
                  : ".tu-beam path";
        const target = required(root.querySelector(selector));
        const click = () =>
          target.dispatchEvent(
            new window.MouseEvent("click", { bubbles: true })
          );
        const dialogs = [
          ui.sideComponent.measureControlsComponent.timeSigControlsComponent
            .dialog,
          ui.sideComponent.measureControlsComponent.tempoControlsComponent
            .dialog,
          ui.sideComponent.noteControlsComponent.tupletComponent.dialog,
        ];
        callbacks.bind([renderer]);
        callbacks.bind([renderer]);
        click();
        expect(render).toHaveBeenCalledTimes(1);
        const grouped =
          Renderer === SVGTupletRenderer || Renderer === SVGBeamSegmentRenderer;
        expect(controller.selectionAsBeats).toEqual(
          grouped ? beats.slice(0, 3) : [beats[0]]
        );
        const opensDialog =
          Renderer === SVGBarRenderer ||
          Renderer === SVGTrackLineInfoRenderer ||
          Renderer === SVGTupletRenderer;
        expect(host.querySelectorAll("[open]")).toHaveLength(
          opensDialog ? 1 : 0
        );
        for (const dialog of dialogs) dialog.close();
        callbacks.bind([]);
        const selected = controller.selectionAsBeats;
        click();
        expect(render).toHaveBeenCalledTimes(1);
        expect(controller.selectionAsBeats).toEqual(selected);
        expect(host.querySelectorAll("[open]")).toHaveLength(0);
        callbacks.bind([renderer]);
        click();
        expect(render).toHaveBeenCalledTimes(2);
        for (const dialog of dialogs) dialog.close();
        callbacks.unbind();
        click();
        expect(render).toHaveBeenCalledTimes(2);
        expect(host.querySelectorAll("[open]")).toHaveLength(0);
      });
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
    withNotationDialog(({ controller, beats, notation, ui, root }) => {
      const noteElement = required(
        controller.trackElement.getBeatElement(beats[1])
      ).noteElements[2];
      if (!(noteElement instanceof TabNoteSlotElement)) {
        throw Error("Expected a tablature note slot for the hovered note");
      }
      const render = jest.fn();
      const callbacks = new EditorMouseDefCallbacks(
        ui as any,
        notation,
        render
      );
      callbacks.onNotePointerEnter(createPointerEvent(10, 10), noteElement);
      const preview = required(root.querySelector("#selectionPreview"));
      expect(preview.getAttribute("display")).toBe("block");
      const expectedRect = noteElement.selectionRect;
      expect(Number(required(preview.getAttribute("x")))).toBeCloseTo(
        expectedRect.x
      );
      expect(Number(required(preview.getAttribute("y")))).toBeCloseTo(
        expectedRect.y
      );
      const previewWidth = Number(required(preview.getAttribute("width")));
      const previewHeight = Number(required(preview.getAttribute("height")));
      expect(previewWidth).toBeGreaterThan(0);
      expect(previewHeight).toBeGreaterThan(0);
      expect(previewWidth).toBeCloseTo(expectedRect.width);
      expect(previewHeight).toBeCloseTo(expectedRect.height);

      callbacks.onNoteClick(createMouseEvent(10, 10), noteElement);
      expect(controller.selectionCursor?.beat).toBe(beats[1]);
      expect(controller.selectionCursor?.noteIndex).toBe(2);
      expect(preview.getAttribute("display")).toBe("none");
      expect(render).toHaveBeenCalledWith(RenderType.SelectionRefresh);

      expect(callbacks.isSelectingBeats).toBe(false);
      callbacks.onNotePointerDown(createMouseEvent(10, 10), noteElement);
      expect(callbacks.isSelectingBeats).toBe(false);
      callbacks.onNotePointerMove(createMouseEvent(30, 10), noteElement);
      expect(callbacks.isSelectingBeats).toBe(true);
      expect(controller.selectionBeats).toEqual([beats[1]]);
      callbacks.onWindowPointerUp({ ...createMouseEvent(30, 10), button: 2 });
      expect(callbacks.isSelectingBeats).toBe(true);
      render.mockClear();
      callbacks.onWindowPointerUp(createMouseEvent(30, 10, 0));
      expect(callbacks.isSelectingBeats).toBe(false);
      expect(controller.selectionBeats).toEqual([beats[1]]);
      expect(render).toHaveBeenCalledWith(RenderType.DragSelection);

      callbacks.onNotePointerEnter(createPointerEvent(10, 10), noteElement);
      expect(preview.getAttribute("display")).toBe("block");
      callbacks.onNotePointerLeave(createPointerEvent(10, 10), noteElement);
      expect(preview.getAttribute("display")).toBe("none");
    });
  });

  test("note click extends a range initiated through the anchor control", () => {
    withNotationDialog(({ controller, beats, notation, ui }) => {
      const noteElement = required(
        controller.trackElement.getBeatElement(beats[1])
      ).noteElements[2];
      const render = jest.fn();
      const callbacks = new EditorMouseDefCallbacks(
        ui as any,
        notation,
        render
      );
      expect(controller.setSelectionAnchor()).toBe(true);

      callbacks.onNoteClick(createMouseEvent(10, 10), noteElement);

      expect(controller.selectionBeats).toEqual(beats);
      expect(controller.selectionCursor).toBeUndefined();
      expect(controller.clearSelectionRange()).toBe(true);
      expect(controller.selectionCursor?.beat).toBe(beats[0]);
      expect(controller.selectionCursor?.noteIndex).toBe(0);
      expect(render).toHaveBeenCalledWith(RenderType.SelectionRefresh);
    });
  });

  async function withMouseTransport(
    action: (fixture: {
      callbacks: EditorMouseDefCallbacks;
      controller: TrackController;
      player: ScorePlayer;
      beats: ReturnType<typeof createBarWithBeats>["beats"];
      render: jest.Mock;
    }) => Promise<void>
  ) {
    jest.useFakeTimers();
    const audio = installTransportAudio();
    const dom = new JSDOM();
    const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: dom.window.document,
    });
    const { score, track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const player = new ScorePlayer(score, track);
    try {
      const controller = new TrackController(
        track,
        TEST_LAYOUT_DIMENSIONS,
        player
      );
      controller.trackElement.update();
      const root = document.createElement("div");
      const renderer = new EditorSVGRenderer(root, controller, {
        baseUrl: "",
        variant: "light",
      });
      const render = jest.fn();
      const callbacks = new EditorMouseDefCallbacks(
        {} as any,
        { trackController: controller, renderer, rootDiv: root } as any,
        render
      );
      await action({ callbacks, controller, player, beats, render });
    } finally {
      player.dispose();
      audio.restore();
      jest.useRealTimers();
      if (previous) Object.defineProperty(globalThis, "document", previous);
      else Reflect.deleteProperty(globalThis, "document");
      dom.window.close();
    }
  }

  test("clicking notes and beats during playback seeks without selecting", async () => {
    await withMouseTransport(
      async ({ callbacks, controller, player, beats, render }) => {
        await player.start({ startBeat: beats[0] });
        const before = serializeScore(player.score);
        const noteTarget = required(
          controller.trackElement.getBeatElement(beats[1])
        );
        callbacks.onNoteClick(
          createMouseEvent(10, 10),
          noteTarget.noteElements[0]
        );
        await settleTransport();
        expect(player.playbackAnchorBeat).toBe(beats[1]);
        expect(controller.selectionCursor).toBeUndefined();
        expect(controller.selectionBeats).toEqual([]);
        const beatTarget = required(
          controller.trackElement.getBeatElement(beats[2])
        );
        callbacks.onBeatClick(createMouseEvent(20, 10), beatTarget);
        await settleTransport();
        expect(player.playbackAnchorBeat).toBe(beats[2]);
        expect(controller.selectionCursor).toBeUndefined();
        expect(controller.selectionBeats).toEqual([]);
        expect(serializeScore(player.score)).toEqual(before);
        expect(render).toHaveBeenCalledTimes(2);
        expect(render).toHaveBeenCalledWith(RenderType.SelectionRefresh);
      }
    );
  });

  test("ordinary idle beat clicks are no-ops", () => {
    withNotationDialog(({ controller, beats, notation, ui, root }) => {
      const beatElement = required(
        controller.trackElement.getBeatElement(beats[1])
      );
      const render = jest.fn();
      const callbacks = new EditorMouseDefCallbacks(
        ui as any,
        notation,
        render
      );
      const initialCursor = controller.selectionCursor;
      const before = serializeScore(controller.trackElement.track.score);

      callbacks.onBeatClick(
        { ...createMouseEvent(20, 10), target: root } as unknown as MouseEvent,
        beatElement
      );

      expect(controller.playbackState).toBe(PlaybackState.Idle);
      expect(controller.selectionCursor).toBe(initialCursor);
      expect(controller.selectionBeats).toEqual([]);
      expect(serializeScore(controller.trackElement.track.score)).toEqual(
        before
      );
      expect(render).not.toHaveBeenCalled();
    });
  });

  test("clicking a beat during audio startup seeks without selecting", async () => {
    await withMouseTransport(
      async ({ callbacks, controller, player, beats }) => {
        const start = player.start({ startBeat: beats[0] });
        expect(player.playbackState).toBe(PlaybackState.Starting);
        callbacks.onBeatClick(
          createMouseEvent(20, 10),
          required(controller.trackElement.getBeatElement(beats[2]))
        );
        await start;
        await settleTransport();
        expect(player.playbackState).toBe(PlaybackState.Playing);
        expect(player.playbackAnchorBeat).toBe(beats[2]);
        expect(controller.selectionCursor).toBeUndefined();
        expect(controller.selectionBeats).toEqual([]);
      }
    );
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

  test("drag attempts preserve the range while playback is starting", () => {
    withDragSelection((fixture) => {
      const { callbacks, controller, player, beats, elements, mouse, pointer } =
        fixture;
      controller.selectBeat(elements[2]);
      controller.selectBeat(elements[3]);
      const starting = player.start();
      expect(controller.playbackState).toBe(PlaybackState.Starting);

      callbacks.onNotePointerDown(mouse(0), elements[0].noteElements[0]);
      callbacks.onBeatPointerDown(mouse(0), elements[0]);
      callbacks.onBeatPointerMove(mouse(100), elements[1]);
      callbacks.onNotePointerEnter(
        pointer(100, "mouse"),
        elements[1].noteElements[0]
      );

      expect(controller.selectionBeats).toEqual([beats[2], beats[3]]);
      expect(callbacks.isSelectingBeats).toBe(false);
      player.stop();
      // Audio startup resumes after this synchronous interaction and sees the
      // stopped generation. No browser audio implementation is needed here.
      void starting;
    });
  });

  test("mouse drag replaces a range, extends it, and stops changing it on release", () => {
    withDragSelection((fixture) => {
      const { callbacks, controller, beats, elements, root, mouse } = fixture;
      controller.selectBeat(elements[3]);
      callbacks.onNotePointerDown(mouse(0), elements[0].noteElements[0]);
      callbacks.onBeatPointerMove(mouse(11), elements[0]);
      expect(controller.selectionBeats).toEqual([beats[3]]);
      expect(callbacks.isSelectingBeats).toBe(false);

      callbacks.onBeatPointerMove(mouse(12), elements[1]);
      expect(controller.selectionBeats).toEqual([beats[0], beats[1]]);
      expect(callbacks.isSelectingBeats).toBe(true);
      const selection = required(root.querySelector('[id^="selection-rect-"]'));
      expect(Number(selection.getAttribute("width"))).toBeCloseTo(93.6);

      callbacks.onNotePointerMove(mouse(100), elements[2].noteElements[0]);
      expect(controller.selectionBeats).toEqual([beats[0], beats[1], beats[2]]);
      expect(Number(selection.getAttribute("width"))).toBeCloseTo(140.4);

      callbacks.onWindowPointerUp(mouse(100));
      expect(callbacks.isSelectingBeats).toBe(false);
      callbacks.onBeatPointerMove(mouse(200), elements[3]);
      expect(controller.selectionBeats).toEqual([beats[0], beats[1], beats[2]]);

      controller.setDots(1);
      expect(beats.map((v) => v.dots)).toEqual([1, 1, 1, 0]);
      controller.undo();
      expect(beats.map((v) => v.dots)).toEqual([0, 0, 0, 0]);
      controller.redo();
      expect(beats.map((v) => v.dots)).toEqual([1, 1, 1, 0]);
    });
  });

  test("bind and unbind manage global, delegated, and note renderer listeners without leaks", () => {
    withDragSelection(({ root, controller, beats, elements }) => {
      const rectConstructor = Object.getOwnPropertyDescriptor(
        globalThis,
        "SVGRectElement"
      );
      Object.defineProperty(globalThis, "SVGRectElement", {
        configurable: true,
        value: document.createElementNS("http://www.w3.org/2000/svg", "rect")
          .constructor,
      });
      const host = document.createElement("div");
      root.appendChild(host);
      const renderer = new EditorSVGRenderer(host, controller, {
        baseUrl: "",
        variant: "light",
      });
      const owner = {
        renderer,
        trackController: controller,
      } as unknown as ConstructorParameters<typeof EditorMouseDefCallbacks>[1];
      const render = jest.fn(() => renderer.render());
      const callbacks = new EditorMouseDefCallbacks(
        {} as ConstructorParameters<typeof EditorMouseDefCallbacks>[0],
        owner,
        render
      );
      const active = renderer.render();
      const note = required(
        host.querySelector(
          `[id="note-rect-${elements[1].noteElements[0].getStableIdentity()}"]`
        )
      );
      const beat = required(
        host.querySelector(`[data-beat-uuid="${beats[2].uuid}"]`)
      );
      const event = (type: string, x = 0) => {
        const e = new window.MouseEvent(type, {
          bubbles: true,
          buttons: 1,
          clientX: x,
        });
        Object.defineProperties(e, {
          pageX: { value: x },
          pageY: { value: 0 },
        });
        return e;
      };
      try {
        callbacks.bind(active);
        callbacks.bind(active);
        note.dispatchEvent(event("click"));
        expect(controller.selectionCursor?.beat).toBe(beats[1]);
        expect(render).toHaveBeenCalledTimes(1);
        beat.dispatchEvent(event("mousedown"));
        required(
          host.querySelector(`[data-beat-uuid="${beats[0].uuid}"]`)
        ).dispatchEvent(event("mousemove", 100));
        expect(callbacks.isSelectingBeats).toBe(true);
        window.dispatchEvent(event("mouseup", 100));
        expect(callbacks.isSelectingBeats).toBe(false);
        callbacks.unbind();
        callbacks.unbind();
        controller.clearSelection();
        controller.selectNoteElement(elements[0].noteElements[0]);
        render.mockClear();
        note.dispatchEvent(event("click"));
        beat.dispatchEvent(event("mousedown"));
        note.dispatchEvent(event("mousemove", 100));
        expect(controller.selectionCursor?.beat).toBe(beats[0]);
        expect(callbacks.isSelectingBeats).toBe(false);
        expect(render).not.toHaveBeenCalled();
        callbacks.bind(active);
        note.dispatchEvent(event("click"));
        expect(controller.selectionCursor?.beat).toBe(beats[1]);
        expect(render).toHaveBeenCalledTimes(1);
      } finally {
        callbacks.unbind();
        renderer.dispose();
        if (rectConstructor)
          Object.defineProperty(globalThis, "SVGRectElement", rectConstructor);
        else Reflect.deleteProperty(globalThis, "SVGRectElement");
      }
    });
  });

  test("bind reconciles stale note renderers when the active renderer set changes", () => {
    withDragSelection(({ root, controller, beats, elements }) => {
      const hosts = [
        document.createElement("div"),
        document.createElement("div"),
      ];
      hosts.forEach((h) => root.appendChild(h));
      const renderers = hosts.map(
        (h) =>
          new EditorSVGRenderer(h, controller, {
            baseUrl: "",
            variant: "light",
          })
      );
      const sets = renderers.map((r) => r.render());
      const owner = {
        renderer: renderers[1],
        trackController: controller,
      } as unknown as ConstructorParameters<typeof EditorMouseDefCallbacks>[1];
      const callbacks = new EditorMouseDefCallbacks(
        {} as ConstructorParameters<typeof EditorMouseDefCallbacks>[0],
        owner,
        () => {}
      );
      const notes = hosts.map((h) =>
        required(
          h.querySelector(
            `[id="note-rect-${elements[1].noteElements[0].getStableIdentity()}"]`
          )
        )
      );
      try {
        callbacks.bind(sets[0]);
        notes[0].dispatchEvent(
          new window.MouseEvent("click", { bubbles: true })
        );
        expect(controller.selectionCursor?.beat).toBe(beats[1]);
        controller.selectNoteElement(elements[0].noteElements[0]);
        callbacks.bind(sets[1]);
        notes[0].dispatchEvent(
          new window.MouseEvent("click", { bubbles: true })
        );
        expect(controller.selectionCursor?.beat).toBe(beats[0]);
        notes[1].dispatchEvent(
          new window.MouseEvent("click", { bubbles: true })
        );
        expect(controller.selectionCursor?.beat).toBe(beats[1]);
      } finally {
        callbacks.unbind();
        renderers.forEach((r) => r.dispose());
      }
    });
  });

  test("pointer events do not start or update drag selection", () => {
    withDragSelection((fixture) => {
      const { callbacks, controller, beats, elements, mouse, pointer } =
        fixture;
      controller.selectBeat(elements[3]);
      for (const type of ["mouse", "touch", "pen"]) {
        callbacks.onNotePointerDown(
          pointer(0, type),
          elements[0].noteElements[0]
        );
        callbacks.onBeatPointerDown(pointer(0, type), elements[0]);
        // A following compatibility mousemove must not find a pending drag.
        callbacks.onBeatPointerMove(mouse(100), elements[1]);
        expect(controller.selectionBeats).toEqual([beats[3]]);
        expect(callbacks.isSelectingBeats).toBe(false);
      }

      callbacks.onBeatPointerDown(mouse(0), elements[0]);
      callbacks.onBeatPointerMove(mouse(100), elements[1]);
      expect(controller.selectionBeats).toEqual([beats[0], beats[1]]);
      for (const type of ["mouse", "touch", "pen"]) {
        callbacks.onBeatPointerMove(pointer(200, type), elements[3]);
        callbacks.onNotePointerMove(
          pointer(200, type),
          elements[3].noteElements[0]
        );
        callbacks.onBeatPointerUp(pointer(200, type, false));
        expect(controller.selectionBeats).toEqual([beats[0], beats[1]]);
        expect(callbacks.isSelectingBeats).toBe(true);
      }
      callbacks.onBeatPointerUp(mouse(100));
      expect(callbacks.isSelectingBeats).toBe(false);
    });
  });
});
