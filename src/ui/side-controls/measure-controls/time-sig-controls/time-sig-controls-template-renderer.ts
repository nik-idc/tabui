import { NotationComponent } from "@/notation/notation-component";
import { TimeSigControlsTemplate } from "./time-sig-controls-template";

export class TimeSigControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TimeSigControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TimeSigControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const dialogCSSClass = "tu-time-sig-dialog";
    const dialogContentCSSClass = "tu-time-sig-dialog-content";
    const inputContainerCSSClass = "tu-time-sig-inputs";
    const actionsCSSClass = "tu-time-sig-actions";

    this.template.dialog.classList.add(dialogCSSClass);
    this.template.dialogContent.classList.add(dialogContentCSSClass);
    this.template.inputContent.classList.add(inputContainerCSSClass);
    this.template.actionsContent.classList.add(actionsCSSClass);

    this.template.dialog.append(this.template.dialogContent);
    this.template.dialogContent.append(
      this.template.inputContent,
      this.template.actionsContent
    );
    this.template.inputContent.append(
      this.template.textContainer,
      this.template.beatsInput,
      this.template.beatsErrorText,
      this.template.durationInput,
      this.template.durationErrorText
    );
    this.template.actionsContent.append(
      this.template.confirmButton,
      this.template.cancelButton
    );
    this.parentDiv.appendChild(this.template.dialog);
  }

  private renderTextContainer(): void {
    const cssClass = "tu-time-sig-text";
    this.template.textContainer.classList.add(cssClass);
    this.template.textContainer.textContent = "Edit time signature:";
  }

  private renderInputs(): void {
    const selectedNote =
      this.notationComponent.trackController.trackControllerEditor
        .selectionManager.selectedNote;

    const beatsInitValue =
      selectedNote !== undefined
        ? `${selectedNote.bar.masterBar.beatsCount}`
        : "4";
    const durationInitValue =
      selectedNote !== undefined
        ? `${1 / selectedNote.bar.masterBar.duration}`
        : "4";

    const beatsCSSClass = "tu-time-sig-beats-input";
    this.template.beatsInput.classList.add(beatsCSSClass);
    this.template.beatsInput.type = "number";
    this.template.beatsInput.value = beatsInitValue;
    const beatsErrorCSSClass = "tu-time-sig-beats-error";
    this.template.beatsErrorText.classList.add(beatsErrorCSSClass);

    const durationCSSClass = "tu-time-sig-duration-input";
    this.template.durationInput.classList.add(durationCSSClass);
    this.template.durationInput.type = "number";
    this.template.durationInput.value = durationInitValue;
    const durationErrorCSSClass = "tu-time-sig-duration-error";
    this.template.durationErrorText.classList.add(durationErrorCSSClass);
  }

  private renderButtons(): void {
    const confirmCSSClass = "tu-time-sig-confirm-button";
    this.template.confirmButton.classList.add(confirmCSSClass);
    this.template.confirmButton.textContent = "Confirm";

    const cancelCSSClass = "tu-time-sig-cancel-button";
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
