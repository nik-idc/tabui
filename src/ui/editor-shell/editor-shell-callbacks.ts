import { ListenerManager } from "../../shared/misc/listener-manager";
import { EditorShellComponent } from "./editor-shell-component";

export class EditorShellCallbacks {
  private readonly _component: EditorShellComponent;
  private readonly _onLayoutChange: () => void;
  private readonly _listeners = new ListenerManager();
  private _bound = false;

  constructor(component: EditorShellComponent, onLayoutChange: () => void) {
    this._component = component;
    this._onLayoutChange = onLayoutChange;
  }

  private onToggleClicked(): void {
    const previousState = this._component.sidePanelCollapsed;
    this._component.toggleSidePanel();
    try {
      this._onLayoutChange();
    } catch (error) {
      this._component.setSidePanelCollapsed(previousState);
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
          element: this._component.template.sidePanelToggle,
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
