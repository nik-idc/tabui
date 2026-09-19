import { resolveTabUIConfig } from "../../src/config/tabui-config";
import { EditorLayoutDimensions } from "../../src/notation/controller/editor-layout-dimensions";
import { NotationComponent } from "../../src/notation/notation-component";
import { EditorShellComponent } from "../../src/ui/editor-shell/editor-shell-component";
import { UIComponent } from "../../src/ui/ui-component";
import { resolveEditorFixture } from "../../demo/data/fixture";

/** Renders real components for dialog methods that have no user control. */
export function createDialogFixture() {
  const root = document.createElement("div");
  document.body.appendChild(root);
  const config = resolveTabUIConfig();
  const shell = new EditorShellComponent(root, config);
  shell.render();
  const notation = new NotationComponent(
    shell.template.notationViewport,
    resolveEditorFixture(new URLSearchParams("fixture=empty")),
    config,
    new EditorLayoutDimensions({ ...config.layout, width: 1000 })
  );
  const ui = new UIComponent(
    shell.template.scorePanelHost,
    shell.template.sidePanelHost,
    shell.dialogEnforcer,
    notation,
    config,
    shell.announce.bind(shell)
  );
  ui.render();
  return {
    root,
    ui,
    shell,
    first: ui.topComponent.scoreComponent.newTrackComponent,
    second: ui.topComponent.scoreComponent.trackSettingsComponent,
    /** Releases component-owned resources after each method-contract check. */
    dispose() {
      ui.closeOpenDialogs();
      notation.dispose();
      shell.dispose();
      root.remove();
    },
  };
}
