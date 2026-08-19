import { Guitar, GuitarNote } from "../../../../notation/model";
import { NotationComponent } from "../../../../notation/notation-component";
import {
  assembleDialog,
  renderOnce,
  setupDialogActionButtons,
} from "../../../shared";
import { FretControlsTemplate } from "./fret-controls-template";

/** Renders the fret editor dialog and its current selection state. */
export class FretControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: FretControlsTemplate;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: FretControlsTemplate
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this._assembled = false;
  }

  private assembleContainer(): void {
    assembleDialog(
      this.parentDiv,
      this.template.dialog,
      "tu-fret-dialog",
      this.template.dialogContent,
      "tu-fret-dialog-content",
      [
        {
          element: this.template.inputContent,
          className: "tu-fret-inputs",
          children: [
            this.template.textContainer,
            this.template.valueControl,
            this.template.input,
          ],
        },
        {
          element: this.template.actionsContent,
          className: "tu-fret-actions",
          children: [this.template.confirmButton, this.template.cancelButton],
        },
      ]
    );
    this.template.valueControl.append(
      this.template.noFretButton,
      this.template.deadButton
    );
  }

  private renderInputs(): void {
    const selectionCursor =
      this.notationComponent.trackController.selectionCursor;
    const note = selectionCursor?.note;
    const guitarNote = note instanceof GuitarNote ? note : undefined;
    const playable = guitarNote !== undefined;
    const instrument =
      this.notationComponent.trackController.track.context.instrument;
    const maxFrets = instrument instanceof Guitar ? instrument.fretsCount : 0;
    const currentFret = guitarNote?.fret ?? null;

    this.template.textContainer.classList.add("tu-fret-text");
    this.template.textContainer.textContent = "Edit fret:";
    this.template.valueControl.classList.add("tu-fret-value-control");
    this.template.noFretButton.textContent = "Clear";
    this.template.deadButton.textContent = "x";
    this.template.input.type = "number";
    this.template.input.inputMode = "numeric";
    this.template.input.min = "0";
    this.template.input.max = `${maxFrets}`;
    this.template.input.step = "1";
    this.template.input.value =
      currentFret !== null && currentFret >= 0 ? `${currentFret}` : "";
    this.template.noFretButton.disabled = !playable;
    this.template.deadButton.disabled = !playable;
    this.template.input.disabled = !playable;
    this.template.confirmButton.disabled = !playable;
    setupDialogActionButtons(
      this.template.confirmButton,
      this.template.cancelButton,
      "tu-fret-confirm-button",
      "tu-fret-cancel-button"
    );
  }

  public render(): void {
    this.renderInputs();
    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
