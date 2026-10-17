import { JSDOM } from "jsdom";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { NoteDuration } from "../../../src/notation/model";
import { EditorMouseDefCallbacks } from "../../../src/notation/input/editor-mouse-callbacks";
import { EditorSVGRenderer } from "../../../src/notation/render/svg/editor-svg-renderer";
import { ScorePlayer } from "../../../src/player";
import type { NotationComponent } from "../../../src/notation/notation-component";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { createBarWithBeats } from "../model/helpers";
import { required } from "../required";

/** Builds a four-beat score with real layout and transport. */
export function createDragScore() {
  const { score, track, beats } = createBarWithBeats(
    Array.from({ length: 4 }, () => ({ baseDuration: NoteDuration.Quarter }))
  );
  const player = new ScorePlayer(score, track);
  const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS, player);
  controller.trackElement.update();
  const elements = beats.map((v) =>
    required(controller.trackElement.getBeatElement(v))
  );
  return { controller, player, beats, elements };
}

/** Runs a drag interaction with real DOM events and SVG selection output. */
export function withDragSelection(
  action: (fixture: ReturnType<typeof createFixture>) => void
): void {
  const dom = new JSDOM();
  const keys = [
    "window",
    "document",
    "Element",
    "HTMLElement",
    "Node",
  ] as const;
  const previous = keys.map((k) =>
    Object.getOwnPropertyDescriptor(globalThis, k)
  );
  for (const key of keys) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: dom.window[key],
    });
  }
  const fixture = createFixture(dom);
  try {
    action(fixture);
  } finally {
    fixture.callbacks.unbind();
    fixture.player.dispose();
    keys.forEach((k, i) => {
      const descriptor = previous[i];
      if (descriptor) Object.defineProperty(globalThis, k, descriptor);
      else Reflect.deleteProperty(globalThis, k);
    });
    dom.window.close();
  }
}

function createFixture(dom: JSDOM) {
  const score = createDragScore();
  const root = document.createElement("div");
  document.body.appendChild(root);
  const renderer = new EditorSVGRenderer(root, score.controller, {
    baseUrl: "/assets",
    variant: "light",
  });
  const owner: Pick<NotationComponent, "trackController" | "renderer"> = {
    trackController: score.controller,
    renderer,
  };
  const callbacks = new EditorMouseDefCallbacks(
    {} as ConstructorParameters<typeof EditorMouseDefCallbacks>[0],
    owner as NotationComponent,
    () => renderer.render()
  );
  renderer.render();
  const mouse = (x: number, y = 0, button = 0) => {
    const event = new dom.window.MouseEvent("mousemove", {
      clientX: x,
      clientY: y,
      button,
      buttons: 1,
    });
    // This jsdom version omits page coordinates. The viewport has no scroll.
    Object.defineProperties(event, {
      pageX: { value: x },
      pageY: { value: y },
    });
    return event;
  };
  // jsdom has no PointerEvent constructor. Add the browser's pointer fields to
  // a real MouseEvent so the callbacks receive the same event shape.
  const pointer = (x: number, pointerType: string, isPrimary = true) =>
    Object.assign(mouse(x), {
      pointerId: 7,
      pointerType,
      isPrimary,
    }) as PointerEvent;
  return { ...score, callbacks, root, mouse, pointer };
}
