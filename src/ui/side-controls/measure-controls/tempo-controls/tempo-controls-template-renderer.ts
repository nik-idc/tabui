import { NotationComponent } from "@/notation/notation-component";
import { TempoControlsTemplate } from "./tempo-controls-template";

export class TempoControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TempoControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TempoControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const dialogCSSClass = "tu-tempo-dialog";
    this.template.dialog.classList.add(dialogCSSClass);
    const dialogContentCSSClass = "tu-tempo-dialog-content";
    this.template.dialogContent.classList.add(dialogContentCSSClass);
    const inputContainerCSSClass = "tu-tempo-inputs";
    this.template.inputContent.classList.add(inputContainerCSSClass);
    const actionsCSSClass = "tu-tempo-actions";
    this.template.actionsContent.classList.add(actionsCSSClass);

    this.template.dialog.append(this.template.dialogContent);
    this.template.dialogContent.append(
      this.template.inputContent,
      this.template.actionsContent
    );
    this.template.inputContent.append(
      this.template.textContainer,
      this.template.input,
      this.template.errorText
    );
    this.template.actionsContent.append(
      this.template.confirmButton,
      this.template.cancelButton
    );
    this.parentDiv.appendChild(this.template.dialog);
  }

  private renderTextContainer(): void {
    const cssClass = "tu-tempo-text";
    this.template.textContainer.classList.add(cssClass);
    this.template.textContainer.textContent = "Edit tempo:";
  }

  private renderInputs(): void {
    const selectedNote =
      this.notationComponent.trackController.trackControllerEditor
        .selectionManager.selectedNote;

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
    const confirmCSSClass = "tu-tempo-confirm-button";
    this.template.confirmButton.classList.add(confirmCSSClass);
    this.template.confirmButton.textContent = "Confirm";

    const cancelCSSClass = "tu-tempo-cancel-button";
    this.template.cancelButton.classList.add(cancelCSSClass);
    this.template.cancelButton.textContent = "Cancel";
  }

  public render(): void {
    this.renderTextContainer();
    this.renderInputs();
    this.renderButtons();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
