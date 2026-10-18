import { JSDOM } from "jsdom";
import { NotationComponent } from "../../../src/notation/notation-component";
import { NoteDuration } from "../../../src/notation/model";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { MeasureControlsComponent } from "../../../src/ui/side-controls/measure-controls/measure-controls-component";
import { NoteControlsComponent } from "../../../src/ui/side-controls/note-controls/note-controls-component";
import { TechniqueControlsComponent } from "../../../src/ui/side-controls/technique-controls/technique-controls-component";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { createBarWithBeats } from "../model/helpers";
import { EditorSVGRenderer } from "../../../src/notation/render/svg/editor-svg-renderer";
import { resolveTabUIConfig } from "../../../src/config/tabui-config";

/** Runs dialog tests in a real DOM and restores the caller's environment. */
export function withNotationDialog(
  action: (fixture: ReturnType<typeof createFixture>) => void
): void {
  const dom = new JSDOM();
  const keys = [
    "window",
    "document",
    "HTMLElement",
    "Element",
    "Node",
    "Event",
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
  try {
    action(createFixture());
  } finally {
    keys.forEach((k, i) => {
      const descriptor = previous[i];
      if (descriptor) Object.defineProperty(globalThis, k, descriptor);
      else Reflect.deleteProperty(globalThis, k);
    });
    dom.window.close();
  }
}

function createFixture() {
  const { track, beats } = createBarWithBeats([
    { baseDuration: NoteDuration.Quarter },
    { baseDuration: NoteDuration.Quarter },
  ]);
  const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
  controller.trackElement.update();
  const root = document.createElement("div");
  root.tabIndex = 0;
  const host = document.createElement("div");
  root.appendChild(host);
  document.body.appendChild(root);
  const renderer = new EditorSVGRenderer(root, controller, {
    baseUrl: "/assets",
    variant: "light",
  });
  const owner: Pick<
    NotationComponent,
    "trackController" | "rootDiv" | "renderer" | "config"
  > = {
    trackController: controller,
    rootDiv: root,
    renderer,
    config: resolveTabUIConfig(),
  };
  const notation = owner as NotationComponent;
  const enforcer = new DialogEnforcer(host, () => {});
  const measure = new MeasureControlsComponent(
    root,
    enforcer,
    notation,
    () => {}
  );
  const note = new NoteControlsComponent(root, enforcer, notation, () => {});
  const technique = new TechniqueControlsComponent(
    root,
    enforcer,
    notation,
    () => {}
  );
  technique.bendControlsComponent.render();
  const ui = {
    sideComponent: {
      measureControlsComponent: measure,
      noteControlsComponent: note,
      techniqueControlsComponent: technique,
    },
  };
  return {
    controller,
    beats,
    root,
    host,
    notation,
    ui,
    measure,
    note,
    technique,
  };
}
