import { NotationComponent } from "@/notation/notation-component";
import {
  assembleDialog,
  renderOnce,
  setupDialogActionButtons,
} from "@/ui/shared";
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
            this.template.normalInput,
            this.template.normalErrorText,
            this.template.input,
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

    const inputCSSClass = "tu-tuplet-input";
    const tupletErrorCSSClass = "tu-tuplet-error";
    this.template.normalInput.classList.add(inputCSSClass);
    this.template.normalInput.type = "number";
    this.template.normalInput.value = normalInitValue;
    this.template.normalErrorText.classList.add(tupletErrorCSSClass);
    this.template.input.classList.add(inputCSSClass);
    this.template.input.type = "number";
    this.template.input.value = tupletInitValue;
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
