import { NotationComponent } from "@/notation/notation-component";
import {
  assembleDialog,
  renderOnce,
  setupDialogActionButtons,
} from "@/ui/shared";
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
            this.template.input,
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
  }

  private renderTextContainer(): void {
    const cssClass = "tu-tempo-text";
    this.template.textContainer.classList.add(cssClass);
    this.template.textContainer.textContent = "Edit tempo:";
  }

  private renderInputs(): void {
    const selectedNote = this.notationComponent.trackController.selectedNote;

    const tempoInitValue =
      selectedNote !== undefined
        ? `${selectedNote.bar.masterBar.tempo}`
        : "120";

    const beatsCSSClass = "tu-tempo-input";
    this.template.input.classList.add(beatsCSSClass);
    this.template.input.type = "number";
    this.template.input.value = tempoInitValue;
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
