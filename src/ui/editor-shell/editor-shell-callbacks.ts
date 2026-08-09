import { ListenerManager } from "../../shared/misc/listener-manager";
import { EditorShellComponent } from "./editor-shell-component";
import { SideControlsComponent } from "../side-controls/side-controls-component";

// NOTE: In a future callbacks refactor the relationship between
// editor shell and side controls should be given more carefuly thouht.
// Current relationship "smells" pretty bad

export class EditorShellCallbacks {
  private readonly _component: EditorShellComponent;
  private readonly _sideControls: SideControlsComponent;
  private readonly _onLayoutChange: () => void;
  private readonly _listeners = new ListenerManager();
  private _bound = false;

  constructor(
    component: EditorShellComponent,
    sideControls: SideControlsComponent,
    onLayoutChange: () => void
  ) {
    this._component = component;
    this._sideControls = sideControls;
    this._onLayoutChange = onLayoutChange;
  }

  private onToggleClicked(): void {
    const previousState = this._component.sidePanelCollapsed;
    const collapsed = this._component.toggleSidePanel();
    this._sideControls.renderToggle(collapsed);
    try {
      this._onLayoutChange();
    } catch (error) {
      this._component.setSidePanelCollapsed(previousState);
      this._sideControls.renderToggle(previousState);
      throw error;
    }
  }

  public bind(): void {
    if (
      this._bound ||
      !this._component.config.panels.side.visible ||
      !this._component.config.panels.side.collapsible
    ) {
      return;
    }

    this._bound = true;
    try {
      this._listeners.bindAll([
        {
          element: this._sideControls.template.sidePanelToggle,
          event: "click",
          handler: this.onToggleClicked.bind(this),
        },
      ]);
    } catch (error) {
      this._listeners.unbindAll();
      this._bound = false;
      throw error;
    }
  }

  public unbind(): void {
    if (!this._bound) {
      return;
    }

    this._listeners.unbindAll();
    this._bound = false;
  }
}
