import { NotationComponent } from "../../../notation/notation-component";
import { ListenerManager } from "../../../shared/misc";
import { StaffControlsComponent } from "./staff-controls-component";

export interface StaffControlsCallbacks {
  onAddStaffClicked(): void;
  onRemoveStaffClicked(): void;
  bind(): void;
  unbind(): void;
}

export class StaffControlsDefaultCallbacks implements StaffControlsCallbacks {
  private _staffComponent: StaffControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;

  private _listeners = new ListenerManager();

  constructor(
    staffComponent: StaffControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._staffComponent = staffComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
  }

  onAddStaffClicked(): void {
    if (this._notationComponent.trackController.addStaffBelowSelected()) {
      this._notationComponent.ensureSelectedNoteVisible();
    }
    this._renderFunc();
  }

  onRemoveStaffClicked(): void {
    if (this._notationComponent.trackController.removeSelectedStaff()) {
      this._notationComponent.ensureSelectedNoteVisible();
    }
    this._renderFunc();
  }

  public bind(): void {
    this._listeners.bindAll([
      {
        element: this._staffComponent.template.addStaffButton,
        event: "click",
        handler: () => this.onAddStaffClicked(),
      },
      {
        element: this._staffComponent.template.removeStaffButton,
        event: "click",
        handler: () => this.onRemoveStaffClicked(),
      },
    ]);
  }

  public unbind(): void {
    this._listeners.unbindAll();
  }
}
