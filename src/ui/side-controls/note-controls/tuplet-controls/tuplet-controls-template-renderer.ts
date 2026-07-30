import { NotationComponent } from "../../../../notation/notation-component";
import {
  assembleDialog,
  renderOnce,
  setupDialogActionButtons,
} from "../../../shared";
import { TupletControlsTemplate } from "./tuplet-controls-template";

export class TupletControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TupletControlsTemplate;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TupletControlsTemplate
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
      "tu-tuplet-dialog",
      this.template.dialogContent,
      "tu-tuplet-dialog-content",
      [
        {
          element: this.template.inputContent,
          className: "tu-tuplet-inputs",
          children: [
            this.template.textContainer,
            this.template.normalLabel,
            this.template.normalControl,
            this.template.normalErrorText,
            this.template.tupletLabel,
            this.template.tupletControl,
            this.template.tupletErrorText,
          ],
        },
        {
          element: this.template.actionsContent,
          className: "tu-tuplet-actions",
          children: [this.template.confirmButton, this.template.cancelButton],
        },
      ]
    );
    this.template.normalControl.append(
      this.template.normalDownButton,
      this.template.normalValue,
      this.template.normalUpButton
    );
    this.template.tupletControl.append(
      this.template.tupletDownButton,
      this.template.tupletValue,
      this.template.tupletUpButton
    );
  }

  private renderTextContainer(): void {
    const cssClass = "tu-tuplet-text";
    this.template.textContainer.classList.add(cssClass);
    this.template.textContainer.textContent = "Custom tuplet:";
  }

  private renderInputs(): void {
    const selectedNote = this.notationComponent.trackController.selectedNote;

    let normalInitValue: string;
    let tupletInitValue: string;
    if (
      selectedNote !== undefined &&
      selectedNote.beat.tupletSettings !== null
    ) {
      normalInitValue = `${selectedNote.beat.tupletSettings.normalCount}`;
      tupletInitValue = `${selectedNote.beat.tupletSettings.tupletCount}`;
    } else {
      normalInitValue = "3";
      tupletInitValue = "2";
    }

    const tupletErrorCSSClass = "tu-tuplet-error";
    this.template.normalLabel.textContent = "Normal notes";
    this.template.normalControl.classList.add("tu-number-stepper");
    this.template.normalDownButton.textContent = "-";
    this.template.normalValue.classList.add("tu-number-stepper-value");
    this.template.normalValue.textContent = normalInitValue;
    this.template.normalUpButton.textContent = "+";
    this.template.normalDownButton.disabled = Number(normalInitValue) <= 2;
    this.template.normalUpButton.disabled = Number(normalInitValue) >= 256;
    this.template.normalErrorText.classList.add(tupletErrorCSSClass);
    this.template.tupletLabel.textContent = "Tuplet notes";
    this.template.tupletControl.classList.add("tu-number-stepper");
    this.template.tupletDownButton.textContent = "-";
    this.template.tupletValue.classList.add("tu-number-stepper-value");
    this.template.tupletValue.textContent = tupletInitValue;
    this.template.tupletUpButton.textContent = "+";
    this.template.tupletDownButton.disabled = Number(tupletInitValue) <= 2;
    this.template.tupletUpButton.disabled = Number(tupletInitValue) >= 256;
    this.template.tupletErrorText.classList.add(tupletErrorCSSClass);
  }

  private renderButtons(): void {
    setupDialogActionButtons(
      this.template.confirmButton,
      this.template.cancelButton,
      "tu-tuplet-confirm-button",
      "tu-tuplet-cancel-button"
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
