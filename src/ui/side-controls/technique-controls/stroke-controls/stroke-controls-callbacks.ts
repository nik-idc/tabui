import { BeatGuitarTechniqueType } from "../../../../notation/model";
import { NotationComponent } from "../../../../notation/notation-component";
import { ListenerManager } from "../../../../shared/misc";
import { StrokeControlsComponent } from "./stroke-controls-component";

export interface StrokeControlsCallbacks {
  onDialogClicked(event: MouseEvent): void;
  onConfirmClicked(): void;
  onRemoveClicked(): void;
  onCancelClicked(): void;
  bind(): void;
  unbind(): void;
}

/** Applies, removes, or cancels stroke settings from the stroke dialog. */
export class StrokeControlsDefaultCallbacks implements StrokeControlsCallbacks {
  private _strokeComponent: StrokeControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;

  private _listeners = new ListenerManager();

  constructor(
    strokeComponent: StrokeControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._strokeComponent = strokeComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
  }

  /** Closes the dialog on a click outside its content. */
  onDialogClicked(event: MouseEvent): void {
    const target = event.target;
    if (
      !(typeof Node !== "undefined" && target instanceof Node) ||
      !this._strokeComponent.template.dialogContent.contains(target)
    ) {
      this._strokeComponent.dialog.close();
    }
  }

  /** Sets the draft stroke on the target beats. */
  onConfirmClicked(): void {
    this._notationComponent.trackController.setBeatTechnique(
      BeatGuitarTechniqueType.Stroke,
      { strokeOptions: this._strokeComponent.getDraftOptions() }
    );
    this._renderFunc();
    this._strokeComponent.dialog.close();
  }

  /** Removes the stroke from every target beat that has one. */
  onRemoveClicked(): void {
    if (this._strokeComponent.template.removeButton.disabled) {
      return;
    }
    this._notationComponent.trackController.removeBeatTechnique(
      BeatGuitarTechniqueType.Stroke
    );
    this._renderFunc();
    this._strokeComponent.dialog.close();
  }

  onCancelClicked(): void {
    this._strokeComponent.dialog.close();
  }

  public bind(): void {
    const { template } = this._strokeComponent;
    this._listeners.bindAll([
      {
        element: template.dialogContainer,
        event: "click",
        handler: (event: MouseEvent) => this.onDialogClicked(event),
      },
      {
        element: template.durationInput,
        event: "input",
        handler: () => this._strokeComponent.onDurationInput(),
      },
      {
        element: template.alignmentInput,
        event: "input",
        handler: () => this._strokeComponent.onAlignmentInput(),
      },
      {
        element: template.dialogContent,
        event: "submit",
        handler: (event: SubmitEvent) => {
          event.preventDefault();
          if (!this._strokeComponent.dialog.open) {
            return;
          }
          this.onConfirmClicked();
        },
      },
      {
        element: template.removeButton,
        event: "click",
        handler: () => this.onRemoveClicked(),
      },
      {
        element: template.cancelButton,
        event: "click",
        handler: () => this.onCancelClicked(),
      },
    ]);
  }

  public unbind(): void {
    this._listeners.unbindAll();
  }
}
