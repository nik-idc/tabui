import { NotationComponent } from "../../../../notation/notation-component";
import { DEFAULT_MASTER_BAR } from "../../../../notation/model";
import {
  assembleDialog,
  renderOnce,
  setupDialogActionButtons,
} from "../../../shared";
import { RepeatCountControlsTemplate } from "./repeat-count-controls-template";

export class RepeatCountControlsTemplateRenderer {
  private _assembled = false;

  constructor(
    private readonly _parentDiv: HTMLDivElement,
    private readonly _notationComponent: NotationComponent,
    readonly template: RepeatCountControlsTemplate
  ) {}

  private assembleContainer(): void {
    assembleDialog(
      this._parentDiv,
      this.template.dialog,
      "tu-repeat-count-dialog",
      this.template.dialogContent,
      "tu-repeat-count-dialog-content",
      [
        {
          element: this.template.inputContent,
          className: "tu-repeat-count-inputs",
          children: [
            this.template.textContainer,
            this.template.valueControl,
            this.template.value,
            this.template.errorText,
          ],
        },
        {
          element: this.template.actionsContent,
          className: "tu-repeat-count-actions",
          children: [this.template.confirmButton, this.template.cancelButton],
        },
      ]
    );
    this.template.valueControl.append(
      this.template.decreaseButton,
      this.template.increaseButton
    );
  }

  private renderTextContainer(): void {
    this.template.textContainer.classList.add("tu-repeat-count-text");
    this.template.textContainer.textContent = "Edit repeat count:";
  }

  public render(): void {
    const selectedBar =
      this._notationComponent.trackController.selectionCursor?.bar.masterBar;
    this.renderTextContainer();
    this.template.valueControl.classList.add("tu-repeat-count-value-control");
    this.template.decreaseButton.textContent = "-1";
    this.template.value.type = "number";
    this.template.value.inputMode = "numeric";
    this.template.value.min = "2";
    this.template.value.step = "1";
    this.template.value.classList.add("tu-repeat-count-input");
    this.template.value.value = `${
      selectedBar?.repeatCount ?? DEFAULT_MASTER_BAR.repeatCount ?? 2
    }`;
    this.template.increaseButton.textContent = "+1";
    this.template.decreaseButton.disabled =
      Number(this.template.value.value) <= 2;
    this.template.errorText.textContent = " ";
    this.template.errorText.classList.add("tu-repeat-count-error");
    setupDialogActionButtons(
      this.template.confirmButton,
      this.template.cancelButton,
      "tu-repeat-count-confirm-button",
      "tu-repeat-count-cancel-button"
    );
    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
