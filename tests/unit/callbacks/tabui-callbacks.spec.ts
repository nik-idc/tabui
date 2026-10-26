/** @jest-environment jsdom */
import { TabUICallbacks } from "../../../src/tabui-callbacks";
import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import { UIComponent } from "../../../src/ui";
import { EditorShellComponent } from "../../../src/ui/editor-shell/editor-shell-component";
import { DEFAULT_MASTER_BAR, GuitarNote } from "../../../src/notation/model";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { createScoreGraph } from "../model/helpers";
import { required } from "../required";

describe("TabUICallbacks", () => {
  const cleanups: (() => void)[] = [];
  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(globalThis, "SVGRectElement", {
      configurable: true,
      value: document.createElementNS("http://www.w3.org/2000/svg", "rect")
        .constructor,
    });
  });
  afterEach(() => {
    cleanups
      .splice(0)
      .reverse()
      .forEach((c) => c());
    Reflect.deleteProperty(globalThis, "SVGRectElement");
    jest.useRealTimers();
    document.body.replaceChildren();
  });

  function createHarness(long = false) {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const config = resolveTabUIConfig();
    const shell = new EditorShellComponent(root, config);
    shell.render();
    cleanups.push(() => shell.dispose());
    const { score, track, staff } = createScoreGraph();
    if (long)
      for (let i = 0; i < 80; i++) score.appendMasterBar(DEFAULT_MASTER_BAR);
    const viewport = shell.template.notationViewport;
    Object.defineProperties(viewport, {
      clientHeight: { value: 400 },
      clientWidth: { value: 800 },
    });
    const notation = new NotationComponent(
      viewport,
      score,
      config,
      TEST_LAYOUT_DIMENSIONS
    );
    cleanups.push(() => notation.dispose());
    const ui = new UIComponent(
      shell.template.scorePanelHost,
      shell.template.sidePanelHost,
      shell.dialogEnforcer,
      notation,
      config,
      () => {}
    );
    ui.render();
    const changed = jest.fn();
    const callbacks = new TabUICallbacks(ui, notation, root, changed);
    cleanups.push(() => callbacks.unbind());
    callbacks.bind();
    const key = (value: string) => {
      viewport.focus();
      return viewport.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: value,
          bubbles: true,
          cancelable: true,
        })
      );
    };
    const tempo = ui.sideComponent.measureControlsComponent;
    return {
      callbacks,
      notation,
      ui,
      root,
      viewport,
      changed,
      key,
      tempo,
      track,
      staff,
    };
  }

  test("scrolling still materializes notation after the active renderer is replaced", () => {
    const { callbacks, notation, viewport, track, staff } = createHarness(true);
    const firstBar = `bar-${staff.bars[0].uuid}`;
    const lastBar = `bar-${staff.bars[80].uuid}`;
    notation.loadTrack(track);
    callbacks.refresh();
    expect(viewport.querySelector(`[id="${firstBar}"]`)).not.toBeNull();
    expect(viewport.querySelector(`[id="${lastBar}"]`)).toBeNull();
    viewport.scrollTop = 1_000_000;
    viewport.dispatchEvent(new Event("scroll"));
    jest.advanceTimersByTime(20);
    expect(viewport.querySelector(`[id="${lastBar}"]`)).not.toBeNull();
    expect(viewport.querySelector(`[id="${firstBar}"]`)).toBeNull();
  });

  test("repeated dialog capture and close suspend and restore real keyboard editing", () => {
    const { tempo, key, notation } = createHarness();
    const note = required(notation.trackController.selectionCursor)
      .note as GuitarNote;
    key("5");
    expect(note?.fret).toBe(5);
    tempo.template.tempoButton.click();
    tempo.template.tempoButton.click();
    expect(tempo.tempoControlsComponent.dialog.open).toBe(true);
    key("7");
    expect(note?.fret).toBe(5);
    tempo.tempoControlsComponent.dialog.close();
    tempo.tempoControlsComponent.dialog.close();
    key("Backspace");
    expect(note?.fret).toBeNull();
  });

  test("repeated bind and unbind keep top and side controls active exactly once", () => {
    const { callbacks, notation, ui, changed } = createHarness();
    const loop = ui.topComponent.playComponent.template.loopButton;
    const dot = ui.sideComponent.noteControlsComponent.template.dot1Button;
    const beat = required(notation.trackController.selectionCursor).beat;
    callbacks.bind();
    callbacks.bind();
    loop.click();
    expect(changed).toHaveBeenCalledTimes(1);
    dot.click();
    expect(changed).toHaveBeenCalledTimes(2);
    expect(notation.trackController.isLooped).toBe(true);
    expect(beat.dots).toBe(1);
    callbacks.unbind();
    callbacks.unbind();
    loop.click();
    dot.click();
    expect(changed).toHaveBeenCalledTimes(2);
    expect(notation.trackController.isLooped).toBe(true);
    expect(beat.dots).toBe(1);
    callbacks.bind();
    loop.click();
    expect(changed).toHaveBeenCalledTimes(3);
    dot.click();
    expect(changed).toHaveBeenCalledTimes(4);
    expect(notation.trackController.isLooped).toBe(false);
    expect(beat.dots).toBe(0);
  });

  test("selection UI refresh preserves an open dialog's keyboard capture", () => {
    const { tempo, key, notation, ui } = createHarness();
    const note = required(notation.trackController.selectionCursor)
      .note as GuitarNote;
    key("5");
    tempo.template.tempoButton.click();
    // Changing loop rerenders and rebinds the UI while the dialog is open.
    ui.topComponent.playComponent.template.loopButton.click();
    expect(notation.trackController.isLooped).toBe(true);
    expect(tempo.tempoControlsComponent.dialog.open).toBe(true);
    key("Backspace");
    expect(note?.fret).toBe(5);
    tempo.tempoControlsComponent.dialog.close();
    key("Backspace");
    expect(note?.fret).toBeNull();
  });

  test("final unbind releases keyboard capture without reviving detached listeners", () => {
    const { callbacks, tempo, key, notation } = createHarness();
    const note = required(notation.trackController.selectionCursor)
      .note as GuitarNote;
    key("5");
    tempo.template.tempoButton.click();
    callbacks.unbind();
    callbacks.unbind();
    tempo.tempoControlsComponent.dialog.close();
    key("Backspace");
    expect(note?.fret).toBe(5);
    callbacks.bind();
    key("Backspace");
    expect(note?.fret).toBeNull();
  });

  test("host changes report real selection edits but scrolling stays silent", () => {
    const { callbacks, changed, key, viewport } = createHarness();
    key("5");
    expect(changed).toHaveBeenCalledTimes(1);
    viewport.dispatchEvent(new Event("scroll"));
    jest.advanceTimersByTime(20);
    expect(changed).toHaveBeenCalledTimes(1);
    callbacks.refresh();
    expect(changed).toHaveBeenCalledTimes(2);
  });

  test("explicit refresh displays externally changed note content", () => {
    const { callbacks, notation, viewport } = createHarness();
    const beat = required(notation.trackController.selectionCursor).beat;
    const note = required(beat.notes?.[0]) as GuitarNote;
    expect(
      Array.from(viewport.querySelectorAll("text"), (e) => e.textContent)
    ).not.toContain("7");
    note.setFret(7);
    callbacks.refresh();
    expect(
      Array.from(viewport.querySelectorAll("text"), (e) => e.textContent)
    ).toContain("7");
  });
});
