import { NotationComponent } from "../../../../notation/notation-component";
import {
  DEFAULT_MASTER_BAR,
  MAX_MASTER_BAR_TEMPO,
  MIN_MASTER_BAR_TEMPO,
} from "../../../../notation/model";
import {
  assembleDialog,
  renderOnce,
  setupDialogActionButtons,
} from "../../../shared";
import { TempoControlsTemplate } from "./tempo-controls-template";

export class TempoControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TempoControlsTemplate;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TempoControlsTemplate
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
      "tu-tempo-dialog",
      this.template.dialogContent,
      "tu-tempo-dialog-content",
      [
        {
          element: this.template.inputContent,
          className: "tu-tempo-inputs",
          children: [
            this.template.textContainer,
            this.template.valueControl,
            this.template.errorText,
          ],
        },
        {
          element: this.template.actionsContent,
          className: "tu-tempo-actions",
          children: [this.template.confirmButton, this.template.cancelButton],
        },
      ]
    );
    this.template.valueControl.append(
      this.template.decreaseTenButton,
      this.template.decreaseButton,
      this.template.value,
      this.template.increaseButton,
      this.template.increaseTenButton
    );
  }

  private renderTextContainer(): void {
    const cssClass = "tu-tempo-text";
    this.template.textContainer.classList.add(cssClass);
    this.template.textContainer.textContent = "Edit tempo:";
  }

  private renderInputs(): void {
    const selectionCursor =
      this.notationComponent.trackController.selectionCursor;

    const tempoInitValue =
      selectionCursor !== undefined
        ? `${selectionCursor.bar.masterBar.tempo}`
        : `${DEFAULT_MASTER_BAR.tempo}`;

    this.template.valueControl.classList.add("tu-number-stepper");
    this.template.decreaseTenButton.textContent = "-10";
    this.template.decreaseButton.textContent = "-";
    this.template.value.classList.add("tu-number-stepper-value");
    this.template.value.textContent = tempoInitValue;
    this.template.increaseButton.textContent = "+";
    this.template.increaseTenButton.textContent = "+10";
    const tempo = Number(tempoInitValue);
    this.template.decreaseTenButton.disabled = tempo <= MIN_MASTER_BAR_TEMPO;
    this.template.decreaseButton.disabled = tempo <= MIN_MASTER_BAR_TEMPO;
    this.template.increaseButton.disabled = tempo >= MAX_MASTER_BAR_TEMPO;
    this.template.increaseTenButton.disabled = tempo >= MAX_MASTER_BAR_TEMPO;
    const beatsErrorCSSClass = "tu-tempo-error";
    this.template.errorText.classList.add(beatsErrorCSSClass);
  }

  private renderButtons(): void {
    setupDialogActionButtons(
      this.template.confirmButton,
      this.template.cancelButton,
      "tu-tempo-confirm-button",
      "tu-tempo-cancel-button"
    );
  }

  public render(): void {
    this.renderTextContainer();
    this.renderInputs();
    this.renderButtons();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
